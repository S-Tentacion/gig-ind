import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getMemberByContact, hasVerifiedPayment, setMemberProfileImages } from "@/lib/db";
import { getCurrentMember } from "@/lib/current-member";
import { syncMemberProfile } from "@/lib/supabase-payment-ledger";

export const runtime = "nodejs";

const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
const maxImageSize = 5 * 1024 * 1024;

function validImages(images: File[]) {
  return images.every((image) => image.type in extensions && image.size > 0 && image.size <= maxImageSize);
}

async function saveImages(memberId: number, images: File[]) {
  const uploadDirectory = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDirectory, { recursive: true });
  return Promise.all(images.map(async (image) => {
    const extension = extensions[image.type as keyof typeof extensions];
    const fileName = `profile-${memberId}-${randomUUID()}.${extension}`;
    await writeFile(path.join(uploadDirectory, fileName), Buffer.from(await image.arrayBuffer()));
    return `/uploads/${fileName}`;
  }));
}

function retainedImages(value: FormDataEntryValue | null, existing: string[]) {
  if (typeof value !== "string") return existing;
  try {
    const requested = JSON.parse(value);
    if (!Array.isArray(requested)) return existing;
    return existing.filter((image) => requested.includes(image));
  } catch {
    return existing;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const images = formData.getAll("images").filter((entry): entry is File => entry instanceof File);
    if (!validImages(images)) return NextResponse.json({ error: "Use JPG, PNG, or WebP images under 5 MB each." }, { status: 400 });

    const contact = typeof formData.get("contact") === "string" ? String(formData.get("contact")) : "";
    const paymentId = typeof formData.get("paymentId") === "string" ? String(formData.get("paymentId")) : "";

    if (contact || paymentId) {
      if (!contact || !paymentId || !hasVerifiedPayment(contact, paymentId)) return NextResponse.json({ error: "A verified payment is required before saving profile images." }, { status: 403 });
      if (images.length < 3 || images.length > 5) return NextResponse.json({ error: "Upload at least 3 and no more than 5 profile images." }, { status: 400 });
      const member = getMemberByContact(contact);
      if (!member) return NextResponse.json({ error: "Your member profile could not be found." }, { status: 404 });
      const profileImages = await saveImages(member.id, images);
      const updatedMember = setMemberProfileImages(member.id, profileImages);
      await syncMemberProfile({ member: updatedMember });
      return NextResponse.json({ profileImages: updatedMember.profileImages });
    }

    const member = await getCurrentMember();
    if (!member) return NextResponse.json({ error: "Please sign in to manage profile images." }, { status: 401 });
    const retained = retainedImages(formData.get("retainedImages"), member.profileImages);
    const added = await saveImages(member.id, images);
    const profileImages = [...retained, ...added];
    if (profileImages.length < 3 || profileImages.length > 5) return NextResponse.json({ error: "Keep between 3 and 5 profile photos." }, { status: 400 });
    const updatedMember = setMemberProfileImages(member.id, profileImages);
    await syncMemberProfile({ member: updatedMember, authUserId: member.authUserId });
    return NextResponse.json({ profileImages: updatedMember.profileImages });
  } catch {
    return NextResponse.json({ error: "We could not save your profile images. Please try again." }, { status: 500 });
  }
}
