import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/current-member";

export const runtime = "nodejs";

export async function GET() {
  try {
    const member = await getCurrentMember();

    if (!member) return NextResponse.json({ member: null });
    return NextResponse.json({ member: { id: member.id, name: member.name, city: member.city, kitPurchased: member.kitPurchased, profileImages: member.profileImages } });
  } catch {
    return NextResponse.json({ member: null });
  }
}
