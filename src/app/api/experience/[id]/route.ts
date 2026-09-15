import { NextResponse, NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { normalizeExperience, validateExperience } from "@/lib/experience";
import { readExperienceFile, writeExperienceFile, withLock } from "@/lib/localData";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get("admin_session")?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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
    const updated = await withLock(async () => {
      const list = await readExperienceFile();
      const index = list.findIndex((e) => e.id === id);
      if (index < 0) return null;
      const merged = { ...list[index], ...entry, id, updatedAt: new Date().toISOString() };
      list[index] = merged;
      await writeExperienceFile(list);
      return merged;
    });
    if (!updated) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Local Experience PUT Error:", error);
    return NextResponse.json({ error: "Failed to update experience locally" }, { status: 500 });
  }
}
