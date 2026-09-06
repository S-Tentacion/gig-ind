import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getMemberByContact, hasVerifiedPayment, setMemberProfileImages } from "@/lib/db";

export const runtime = "nodejs";

const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
const maxImageSize = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const contact = typeof formData.get("contact") === "string" ? String(formData.get("contact")) : "";
    const paymentId = typeof formData.get("paymentId") === "string" ? String(formData.get("paymentId")) : "";
    const images = formData.getAll("images").filter((entry): entry is File => entry instanceof File);
    if (!contact || !paymentId || !hasVerifiedPayment(contact, paymentId)) return NextResponse.json({ error: "A verified payment is required before saving profile images." }, { status: 403 });
    if (images.length < 3 || images.length > 5) return NextResponse.json({ error: "Upload at least 3 and no more than 5 profile images." }, { status: 400 });
    if (images.some((image) => !(image.type in extensions) || image.size === 0 || image.size > maxImageSize)) return NextResponse.json({ error: "Use JPG, PNG, or WebP images under 5 MB each." }, { status: 400 });
    const member = getMemberByContact(contact);
    if (!member) return NextResponse.json({ error: "Your member profile could not be found." }, { status: 404 });

    const uploadDirectory = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDirectory, { recursive: true });
    const profileImages = await Promise.all(images.map(async (image) => {
      const extension = extensions[image.type as keyof typeof extensions];
      const fileName = `profile-${member.id}-${randomUUID()}.${extension}`;
      await writeFile(path.join(uploadDirectory, fileName), Buffer.from(await image.arrayBuffer()));
      return `/uploads/${fileName}`;
    }));
    const updatedMember = setMemberProfileImages(member.id, profileImages);
    return NextResponse.json({ profileImages: updatedMember.profileImages });
  } catch {
    return NextResponse.json({ error: "We could not save your profile images. Please try again." }, { status: 500 });
  }
}
