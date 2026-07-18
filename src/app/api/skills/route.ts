/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @next/next/no-img-element, react-hooks/exhaustive-deps */
import { NextResponse, NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { normalizeSkillCategory } from "@/lib/projects";
import { readSkillsFile, writeSkillsFile, resolveSkillId, uniqueId } from "@/lib/localData";

// Helper to load static fallback skills if Firestore is unconfigured or empty
async function getLocalSkills() {
  return readSkillsFile();
}

export async function GET() {
  if (!isFirebaseConfigured || !db) {
    const localData = await getLocalSkills();
    return NextResponse.json(localData);
  }

  try {
    const querySnapshot = await getDocs(collection(db, "skills"));
    const skills: any[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      skills.push({
        id: docSnap.id,
        ...data,
      });
    });

    if (skills.length === 0) {
      const localData = await getLocalSkills();
      return NextResponse.json(localData);
    }

    return NextResponse.json(skills);
  } catch (error) {
    console.error("Firestore Skills Fetch Error:", error);
    const localData = await getLocalSkills();
    return NextResponse.json(localData);
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Local JSON persistence when Firebase is not configured
  if (!isFirebaseConfigured || !db) {
    try {
      const body = await req.json();
      const list = await readSkillsFile();
      const existingIds = new Set(list.map((s: any) => s.id));
      const baseId = resolveSkillId(body, list.length);
      const id = uniqueId(baseId, existingIds);

      const newSkill = {
        id,
        name: body.name || "",
        slug: body.slug || "",
        category: normalizeSkillCategory(body.category),
        white: !!body.white,
        createdAt: new Date().toISOString(),
      };

      list.push(newSkill);
      await writeSkillsFile(list);
      return NextResponse.json(newSkill);
    } catch (error) {
      console.error("Local Skill POST Error:", error);
      return NextResponse.json({ error: "Failed to save skill locally" }, { status: 500 });
    }
  }

  try {
    const body = await req.json();

    const docRef = await addDoc(collection(db, "skills"), {
      name: body.name || "",
      slug: body.slug || "",
      category: normalizeSkillCategory(body.category),
      white: !!body.white,
      createdAt: new Date().toISOString()
    });

    const newSkill = {
      id: docRef.id,
      ...body
    };

    return NextResponse.json(newSkill);
  } catch (error) {
    console.error("Firestore Skill POST Error:", error);
    return NextResponse.json({ error: "Failed to save skill to Firestore" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Local JSON persistence when Firebase is not configured
  if (!isFirebaseConfigured || !db) {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");
      if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 });
      }
      const list = await readSkillsFile();
      const filtered = list.filter((s: any) => s.id !== id);
      if (filtered.length === list.length) {
        return NextResponse.json({ error: "Skill not found" }, { status: 404 });
      }
      await writeSkillsFile(filtered);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Local Skill DELETE Error:", error);
      return NextResponse.json({ error: "Failed to delete skill locally" }, { status: 500 });
    }
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "skills", id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Firestore Skill DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete skill" }, { status: 500 });
  }
}
