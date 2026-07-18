/* eslint-disable @typescript-eslint/no-explicit-any */
// Server-only helpers for reading/writing the static JSON registries in src/data.
// Used as the persistence layer for the admin panel when Firebase is not configured.
import fs from "fs/promises";
import path from "path";

const PROJECTS_PATH = path.join(process.cwd(), "src/data/projects.json");
const SKILLS_PATH = path.join(process.cwd(), "src/data/skills.json");

// Write atomically: serialize to a temp file in the same directory, then rename
// over the target. rename() is atomic on POSIX, so a concurrent reader never sees
// a half-written or truncated file — it sees either the old or the new content.
async function atomicWriteJson(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(filePath)}.tmp`);
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, filePath);
}

// Resolve a stable id for a project, matching the logic used by the GET fallback.
export function resolveProjectId(p: any, idx: number): string {
  return p.id || (p.title ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "") || `project-${idx}`;
}

export function resolveSkillId(s: any, idx: number): string {
  return s.id || s.slug || `skill-${idx}`;
}

export async function readProjectsFile(): Promise<any[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(PROJECTS_PATH, "utf8"));
    return parsed.map((p: any, idx: number) => ({ ...p, id: resolveProjectId(p, idx) }));
  } catch {
    return [];
  }
}

export async function writeProjectsFile(list: any[]): Promise<void> {
  await atomicWriteJson(PROJECTS_PATH, list);
}

export async function readSkillsFile(): Promise<any[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(SKILLS_PATH, "utf8"));
    return parsed.map((s: any, idx: number) => ({ ...s, id: resolveSkillId(s, idx) }));
  } catch {
    return [];
  }
}

export async function writeSkillsFile(list: any[]): Promise<void> {
  await atomicWriteJson(SKILLS_PATH, list);
}

// Ensure a candidate id is unique against a list of existing ids, suffixing -2, -3, ... if needed.
export function uniqueId(candidate: string, existing: Set<string>): string {
  let id = candidate || "item";
  let n = 2;
  while (existing.has(id)) {
    id = `${candidate}-${n}`;
    n += 1;
  }
  return id;
}

// Serialize read-modify-write operations so concurrent requests (e.g. the admin
// drag-reorder firing one PUT per project at once) don't clobber each other's
// writes to the same JSON file. Dev/single-process only — good enough for local use.
let writeLock: Promise<unknown> = Promise.resolve();
export function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeLock.then(fn, fn);
  writeLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
