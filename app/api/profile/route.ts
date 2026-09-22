import { NextResponse } from "next/server";
import { updateMemberProfile, type Member } from "@/lib/db";
import { getCurrentMember } from "@/lib/current-member";
import { syncMemberProfile } from "@/lib/supabase-payment-ledger";

export const runtime = "nodejs";

function profilePayload(member: Member) {
  return {
    id: member.id,
    name: member.name,
    username: member.username,
    legalName: member.name,
    contact: member.contact,
    city: member.city,
    bio: member.bio,
    profileVisibility: member.profileVisibility,
    emailUpdates: member.emailUpdates,
    profileImages: member.profileImages,
    kitPurchased: member.kitPurchased,
    createdAt: member.createdAt,
  };
}

export async function GET() {
  try {
    const member = await getCurrentMember();
    if (!member) return NextResponse.json({ error: "Please sign in to view your profile." }, { status: 401 });
    return NextResponse.json({ profile: profilePayload(member) });
  } catch {
    return NextResponse.json({ error: "We could not load your profile." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const member = await getCurrentMember();
    if (!member) return NextResponse.json({ error: "Please sign in to update your profile." }, { status: 401 });
    const body = await request.json() as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const bio = typeof body.bio === "string" ? body.bio.trim() : "";
    const profileVisibility = body.profileVisibility === "members" ? "members" : "private";
    const emailUpdates = typeof body.emailUpdates === "boolean" ? body.emailUpdates : member.emailUpdates;

    if (name.length < 2 || name.length > 80) return NextResponse.json({ error: "Use a name between 2 and 80 characters." }, { status: 400 });
    if (city.length < 2 || city.length > 80) return NextResponse.json({ error: "Use a city between 2 and 80 characters." }, { status: 400 });
    if (bio.length > 500) return NextResponse.json({ error: "Keep your introduction to 500 characters or fewer." }, { status: 400 });

    const profile = updateMemberProfile(member.id, { name, city, bio, profileVisibility, emailUpdates });
    await syncMemberProfile({ member: profile, authUserId: member.authUserId });
    return NextResponse.json({ profile: profilePayload(profile) });
  } catch {
    return NextResponse.json({ error: "We could not save your profile. Please try again." }, { status: 500 });
  }
}
