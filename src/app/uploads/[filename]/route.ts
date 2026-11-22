import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sql from "@/lib/db";
import { isCommitteeMember } from "@/lib/committees";
import { getSession } from "@/lib/session";
import { CONTENT_TYPES, UPLOAD_DIR, UPLOAD_FILENAME_RE } from "@/lib/uploads";

const NOT_FOUND = () => new NextResponse("Not found", { status: 404 });

/**
 * Pictures that sit inside meeting minutes belong to a committee, and mast photos on board applications to the admins.
 * Everything else (masts, activity posters, plugin photos) is public. Returns whether the viewer may see the file.
 */
async function mayView(filename: string): Promise<{ allowed: boolean; restricted: boolean }> {
  const url = `/uploads/${filename}`;
  const [minutes] = await sql<{ committee_id: string }[]>`
    SELECT m.committee_id FROM meeting_items i JOIN meetings m ON m.id = i.meeting_id
    WHERE position(${url} in i.notes) > 0 LIMIT 1
  `;
  const [application] = await sql`SELECT 1 FROM board_applications WHERE mast_photo = ${url} LIMIT 1`;
  if (!minutes && !application) return { allowed: true, restricted: false };

  const session = await getSession();
  if (!session) return { allowed: false, restricted: true };
  if (session.user.role === "admin") return { allowed: true, restricted: true };
  if (minutes && (await isCommitteeMember(session.user, minutes.committee_id))) return { allowed: true, restricted: true };
  return { allowed: false, restricted: true };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  if (!UPLOAD_FILENAME_RE.test(filename)) {
    return NOT_FOUND();
  }

  const access = await mayView(filename).catch((error: unknown) => {
    console.error("Upload access check failed:", (error as Error).message);
    return null;
  });
  if (!access?.allowed) return NOT_FOUND();

  try {
    const data = await readFile(path.join(UPLOAD_DIR, filename));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": CONTENT_TYPES[filename.split(".").pop()!],
        // Filenames are unique and never rewritten, so cache forever.
        "Cache-Control": access.restricted ? "private, no-store" : "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NOT_FOUND();
  }
}
