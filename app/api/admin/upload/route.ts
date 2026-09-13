import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requireAdminSession } from "@/lib/auth-server";
import { put } from "@vercel/blob";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "image/gif": ".gif",
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds the 5MB limit" },
        { status: 400 }
      );
    }

    const mimeType = file.type;
    if (!ALLOWED_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "Invalid image type. Allowed: JPG, PNG, WEBP, SVG, GIF" },
        { status: 400 }
      );
    }

    const ext = EXTENSION_MAP[mimeType] || ".jpg";
    const randomHash = crypto.randomBytes(8).toString("hex");
    const filename = `banner-${Date.now()}-${randomHash}${ext}`;

    // 1. If Vercel Blob token is configured, upload to Vercel Blob Storage CDN
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`banners/${filename}`, file, {
        access: "public",
      });

      return NextResponse.json({
        success: true,
        url: blob.url,
        filename,
      });
    }

    // 2. If running in a serverless environment (e.g. Vercel) with a read-only filesystem,
    // convert to a Base64 data URL so uploads work immediately without any extra setup
    if (process.env.VERCEL) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return NextResponse.json({
        success: true,
        url: dataUrl,
        filename,
      });
    }

    // 3. Local development fallback: save to public/uploads/banners
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "banners");
      await mkdir(uploadDir, { recursive: true });

      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      const publicUrl = `/uploads/banners/${filename}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename,
      });
    } catch (fsErr) {
      // If filesystem write fails (e.g. permission or read-only container), return data URL
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return NextResponse.json({
        success: true,
        url: dataUrl,
        filename,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload banner";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
