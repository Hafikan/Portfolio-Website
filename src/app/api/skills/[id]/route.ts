import { NextResponse, NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { normalizeSkillCategory } from "@/lib/projects";
import { readSkillsFile, writeSkillsFile } from "@/lib/localData";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get("admin_session")?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Local JSON persistence when Firebase is not configured
  if (!isFirebaseConfigured || !db) {
    try {
      const { id } = await params;
      const body = await req.json();
      const list = await readSkillsFile();
      const index = list.findIndex((s: any) => s.id === id);
      if (index < 0) {
        return NextResponse.json({ error: "Skill not found" }, { status: 404 });
      }
      const merged = {
        ...list[index],
        name: body.name,
        slug: body.slug,
        category: normalizeSkillCategory(body.category),
        white: !!body.white,
        id,
        updatedAt: new Date().toISOString(),
      };
      list[index] = merged;
      await writeSkillsFile(list);
      return NextResponse.json(merged);
    } catch (error) {
      console.error("Local Skill PUT Error:", error);
      return NextResponse.json({ error: "Failed to update skill locally" }, { status: 500 });
    }
  }

  try {
    const { id } = await params;
    const body = await req.json();
    
    const docRef = doc(db, "skills", id);
    await updateDoc(docRef, {
      name: body.name,
      slug: body.slug,
      category: normalizeSkillCategory(body.category),
      white: !!body.white,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ id, ...body });
  } catch (error) {
    console.error("Firestore Skill PUT Error:", error);
    return NextResponse.json({ error: "Failed to update skill" }, { status: 500 });
  }
}
