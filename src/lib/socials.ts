// Social links are stored in the site config (src/data/config.json) under `socials`
// and edited from the admin panel. Kept local — no external service required.

export type Socials = {
  email: string;
  github: string;
  linkedin: string;
  twitter: string;
};

export const SOCIAL_FIELDS: { key: keyof Socials; label: string; placeholder: string }[] = [
  { key: "email", label: "Email", placeholder: "you@example.com" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/username" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/username" },
];

export const DEFAULT_SOCIALS: Socials = {
  email: "",
  github: "",
  linkedin: "",
  twitter: "",
};

export function normalizeSocials(s: Partial<Socials> | undefined | null): Socials {
  return { ...DEFAULT_SOCIALS, ...(s || {}) };
}

// Human-readable label for a URL (strip protocol + trailing slash).
export function socialDisplay(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}
