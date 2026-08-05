// Admin session tokens.
//
// Runs in the Edge runtime as well as Node (src/middleware.ts imports this), so
// this module must stick to Web Crypto and standard globals — no `node:crypto`,
// no Buffer.
//
// Token layout:  v1.<base64url(payload)>.<base64url(HMAC-SHA256)>
// The signature covers "v1.<base64url(payload)>", i.e. the version prefix is
// authenticated too, so a future v2 token can never be replayed as a v1.

const TOKEN_VERSION = "v1";

/** Session lifetime. Kept in one place so the cookie's maxAge and the token's
 *  own `exp` claim cannot drift apart — a cookie outliving its token would log
 *  the admin out with no visible reason. */
export const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24 hours

/** Tolerance for a token whose `iat` sits slightly in the future, so ordinary
 *  clock skew doesn't reject a freshly minted session. */
const MAX_CLOCK_SKEW_SECONDS = 60;

type SessionPayload = {
  /** Who the session belongs to. */
  sub: string;
  /** Issued-at, seconds since epoch. */
  iat: number;
  /** Expiry, seconds since epoch. */
  exp: number;
  /** Unique per session, so two logins never produce the same token. */
  jti: string;
};

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Returns Uint8Array<ArrayBuffer> rather than the default Uint8Array<ArrayBufferLike>:
// Web Crypto's BufferSource excludes SharedArrayBuffer-backed views, so the
// looser type is rejected where the result is handed to crypto.subtle.
function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export const getSecretKey = async () => {
  const secret = process.env.ADMIN_PASSWORD;

  // This used to fall back to a hardcoded 'default_secret'. A deployment that
  // forgot to set ADMIN_PASSWORD would then sign sessions with a value printed
  // in this repository, letting anyone forge an admin cookie. Fail closed.
  if (!secret) {
    throw new Error("ADMIN_PASSWORD is not set; refusing to sign or verify admin sessions.");
  }

  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
};

/**
 * Constant-time secret comparison.
 *
 * `a === b` on strings returns as soon as two characters differ, so the time it
 * takes leaks how long a matching prefix the caller supplied — enough to
 * recover a secret character by character. Comparing fixed-length SHA-256
 * digests instead removes both that signal and the length signal.
 */
export async function secretsMatch(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);

  const bytesA = new Uint8Array(digestA);
  const bytesB = new Uint8Array(digestB);
  let diff = 0;
  for (let i = 0; i < bytesA.length; i += 1) diff |= bytesA[i] ^ bytesB[i];
  return diff === 0;
}

export async function createSessionToken(subject = "admin"): Promise<string> {
  const key = await getSecretKey();
  const issuedAt = Math.floor(Date.now() / 1000);

  // Random per session. Without it every login produced a byte-identical token
  // that stayed valid for the lifetime of the password.
  const jti = base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)));

  const payload: SessionPayload = {
    sub: subject,
    iat: issuedAt,
    exp: issuedAt + SESSION_TTL_SECONDS,
    jti,
  };

  const body = `${TOKEN_VERSION}.${base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)))}`;
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));

  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [version, encodedPayload, encodedSignature] = parts;
    if (version !== TOKEN_VERSION) return false;

    const key = await getSecretKey();

    // subtle.verify compares the MACs itself without short-circuiting, so it
    // leaks no timing signal about how many bytes matched. The previous `===`
    // on the token string did.
    const signatureValid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(encodedSignature),
      new TextEncoder().encode(`${version}.${encodedPayload}`),
    );
    if (!signatureValid) return false;

    // Only now is the payload trustworthy enough to parse.
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(encodedPayload)),
    ) as SessionPayload;

    if (typeof payload.exp !== "number" || typeof payload.iat !== "number") return false;

    const now = Math.floor(Date.now() / 1000);
    if (now >= payload.exp) return false;
    if (payload.iat > now + MAX_CLOCK_SKEW_SECONDS) return false;

    // A validly signed token claiming a longer life than policy allows means the
    // key was used to mint something this code never would. Distrust it.
    if (payload.exp - payload.iat > SESSION_TTL_SECONDS) return false;

    return true;
  } catch {
    // Malformed base64, malformed JSON, or an unset ADMIN_PASSWORD all land here
    // and all mean the same thing: not authenticated.
    return false;
  }
}
