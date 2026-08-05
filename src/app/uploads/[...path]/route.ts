// Serves admin-uploaded images from public/uploads at request time.
//
// Why this exists: Next's production server snapshots the contents of public/
// when it boots. Files written after boot — i.e. every image uploaded through
// the admin panel (src/app/api/upload/route.ts) — are not in that snapshot and
// 404 until the process restarts. In `next dev` the directory is re-read per
// request, so the bug only appears in production/containers.
//
// Requests for files that *were* present at boot never reach this handler; the
// static handler answers them first. This is the fallback for everything newer.
import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads");

// Mirrors the extensions accepted by the upload endpoint.
const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  // Reject traversal before touching the filesystem. Uploads are stored flat as
  // <uuid>.<ext>, so anything with a separator or a dot-segment is bogus.
  if (
    segments.length !== 1 ||
    segments[0].includes("/") ||
    segments[0].includes("\\") ||
    segments[0].startsWith(".")
  ) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(UPLOAD_DIR, segments[0]);

  // Belt and braces: confirm the resolved path is still inside UPLOAD_DIR, so a
  // decoding quirk upstream can't walk out of the directory.
  if (path.dirname(path.resolve(filePath)) !== path.resolve(UPLOAD_DIR)) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(segments[0]).slice(1).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return new Response("Not found", { status: 404 });
  }

  let file: Buffer;
  try {
    file = await fs.readFile(filePath);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": contentType,
      // Filenames are randomly generated UUIDs and never rewritten, so the
      // content at a given URL is immutable.
      "Cache-Control": "public, max-age=31536000, immutable",
      // Uploaded SVGs can carry script. `sandbox` neutralises it if the file is
      // ever opened as a top-level document instead of via <img>.
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
