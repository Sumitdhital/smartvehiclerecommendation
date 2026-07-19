import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin, unauthorized } from "@/lib/admin-auth";

const BUCKET = "listing-photos";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per file
const ALLOWED = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

// Uploads admin-supplied listing photos to the public `listing-photos` bucket.
// Admins authenticate with a custom cookie (not Supabase Auth), so the upload
// runs through the service-role client, which bypasses the bucket's
// authenticated-only INSERT policy. Route stays admin-gated.
export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `"${file.name}" is larger than 5 MB.` },
        { status: 400 }
      );
    }
    const ext = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!ALLOWED.has(ext)) {
      return NextResponse.json(
        { error: `"${file.name}" is not a supported image type.` },
        { status: 400 }
      );
    }

    const path = `admin/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false,
    });
    if (error) {
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return NextResponse.json({ urls });
}
