import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "Upload not configured" }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, and WEBP files are allowed" }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    const { put } = await import("@vercel/blob");
    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `pwata-brief/${Date.now()}.${ext}`;
    const blob = await put(filename, file, { access: "public" });

    return NextResponse.json({ url: blob.url, pathname: blob.pathname });

  } catch {
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
