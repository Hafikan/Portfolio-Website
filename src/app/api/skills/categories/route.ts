import { NextResponse, NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { readSkillsFile, writeSkillsFile } from "@/lib/localData";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Local JSON persistence when Firebase is not configured
  if (!isFirebaseConfigured || !db) {
    try {
      const { oldName, newName } = await req.json();
      if (!oldName || !newName) {
        return NextResponse.json({ error: "oldName and newName are required" }, { status: 400 });
      }
      const list = await readSkillsFile();
      let updatedCount = 0;
      list.forEach((s: any) => {
        if (s.category === oldName) {
          s.category = newName;
          updatedCount += 1;
        }
      });
      await writeSkillsFile(list);
      return NextResponse.json({ success: true, updatedCount });
    } catch (error) {
      console.error("Local Skill Category Rename Error:", error);
      return NextResponse.json({ error: "Failed to rename category locally" }, { status: 500 });
    }
  }

  try {
    const { oldName, newName } = await req.json();

    if (!oldName || !newName) {
      return NextResponse.json({ error: "oldName and newName are required" }, { status: 400 });
    }

    const q = query(collection(db!, "skills"), where("category", "==", oldName));
    const snapshot = await getDocs(q);

    const updatePromises = snapshot.docs.map((skillDoc) => {
      const docRef = doc(db!, "skills", skillDoc.id);
      return updateDoc(docRef, { category: newName });
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true, updatedCount: snapshot.docs.length });
  } catch (error) {
    console.error("Firestore Skill Category Rename Error:", error);
    return NextResponse.json({ error: "Failed to rename category in Firestore" }, { status: 500 });
  }
}
