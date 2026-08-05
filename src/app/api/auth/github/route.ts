import { NextResponse } from "next/server";

/**
 * GitHub/Firebase admin login — DISABLED, fails closed.
 *
 * What this route used to do: read `{ username, email, uid }` straight out of
 * the request body, check `username` against an allow-list, and — if it matched
 * — set an admin session cookie.
 *
 * Nothing authenticated that body. The client ran a Firebase popup sign-in and
 * then POSTed the resulting username as plain JSON, but the server never saw,
 * let alone verified, a Firebase ID token. So one unauthenticated request forged
 * a full admin session:
 *
 *     curl -X POST https://<site>/api/auth/github \
 *          -H 'Content-Type: application/json' \
 *          -d '{"username":"hafikan"}'
 *
 * The allow-list did not help: "hafikan" was hardcoded next to
 * GITHUB_ADMIN_USERNAME, so the bypass worked even with that variable unset.
 * Every admin API (projects, skills, config, upload) trusts this cookie.
 *
 * To re-enable this route safely it must:
 *   1. require the Firebase ID token from `getIdToken()` in the request,
 *   2. verify that token's RS256 signature server-side against Google's public
 *      keys, plus its `iss`, `aud` (the Firebase project id) and `exp`,
 *   3. take the username from the *verified* token claims — never from the body,
 *   4. only then check the allow-list and mint a session.
 *
 * Until that exists, password login (/api/auth/login) is the only way in.
 */
export async function POST() {
  return NextResponse.json(
    { error: "GitHub sign-in is disabled. Use password login." },
    { status: 501 },
  );
}
