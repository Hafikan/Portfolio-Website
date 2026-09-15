/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared (client + server) helpers for the work experience registry.

export type Experience = {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string; // YYYY-MM
  endDate?: string; // YYYY-MM, empty when current
  current?: boolean;
  highlights?: string[];
  tech?: string[];
  createdAt?: string;
  updatedAt?: string;
};

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const toMonth = (value: unknown) => {
  const text = toText(value);
  return MONTH_PATTERN.test(text) ? text : "";
};

// Accepts either an array or a delimited string (textarea / comma-separated input).
const toList = (value: unknown, separator: string | RegExp): string[] => {
  const items = Array.isArray(value) ? value : typeof value === "string" ? value.split(separator) : [];
  return items.map((item) => String(item).trim()).filter(Boolean);
};

// Sanitize an admin-submitted payload into the persisted shape (without id/timestamps).
export function normalizeExperience(body: any): Omit<Experience, "id" | "createdAt" | "updatedAt"> {
  const current = !!body?.current;
  return {
    company: toText(body?.company),
    role: toText(body?.role),
    location: toText(body?.location),
    startDate: toMonth(body?.startDate),
    endDate: current ? "" : toMonth(body?.endDate),
    current,
    highlights: toList(body?.highlights, /\r?\n/),
    tech: toList(body?.tech, ","),
  };
}

// Returns an error message when the entry can't be saved, otherwise null.
export function validateExperience(entry: Pick<Experience, "company" | "role" | "startDate" | "endDate">): string | null {
  if (!entry.company || !entry.role || !entry.startDate) {
    return "Company, role and start date are required.";
  }
  if (entry.endDate && entry.endDate < entry.startDate) {
    return "End date can't be before the start date.";
  }
  return null;
}

// Current roles first, then most recently ended, then most recently started.
export function sortExperience<T extends Pick<Experience, "startDate" | "endDate" | "current">>(list: T[]): T[] {
  const endKey = (e: T) => (e.current ? "9999-12" : e.endDate || e.startDate || "");
  return [...list].sort(
    (a, b) => endKey(b).localeCompare(endKey(a)) || (b.startDate || "").localeCompare(a.startDate || "")
  );
}

export function formatMonth(month?: string): string {
  if (!month || !MONTH_PATTERN.test(month)) return "";
  const [year, m] = month.split("-");
  return `${MONTH_NAMES[Number(m) - 1]} ${year}`;
}

export function formatPeriod(entry: Pick<Experience, "startDate" | "endDate" | "current">): string {
  const start = formatMonth(entry.startDate);
  const end = entry.current ? "Present" : formatMonth(entry.endDate);
  return end ? `${start} — ${end}` : start;
}
