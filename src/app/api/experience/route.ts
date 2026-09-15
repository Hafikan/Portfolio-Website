import { NextResponse, NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { normalizeExperience, sortExperience, validateExperience } from "@/lib/experience";
import { readExperienceFile, writeExperienceFile, resolveExperienceId, uniqueId, withLock } from "@/lib/localData";

// Work experience is persisted to src/data/experience.json only (no Firestore branch).

export async function GET() {
  const list = await readExperienceFile();
  return NextResponse.json(sortExperience(list));
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const entry = normalizeExperience(body);
  const invalid = validateExperience(entry);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  try {
    const created = await withLock(async () => {
      const list = await readExperienceFile();
      const existingIds = new Set<string>(list.map((e) => e.id));
      const id = uniqueId(resolveExperienceId(entry, list.length), existingIds);
      const newEntry = { id, ...entry, createdAt: new Date().toISOString() };
      list.push(newEntry);
      await writeExperienceFile(list);
      return newEntry;
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error("Local Experience POST Error:", error);
    return NextResponse.json({ error: "Failed to save experience locally" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    const removed = await withLock(async () => {
      const list = await readExperienceFile();
      const filtered = list.filter((e) => e.id !== id);
      if (filtered.length === list.length) return false;
      await writeExperienceFile(filtered);
      return true;
    });
    if (!removed) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Local Experience DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete experience locally" }, { status: 500 });
  }
}
