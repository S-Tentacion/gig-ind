import { NextResponse } from "next/server";
import { activateMemberBoost } from "@/lib/db";
import { getCurrentMember } from "@/lib/current-member";

export const runtime = "nodejs";

async function getPremiumMember() {
  const member = await getCurrentMember();
  if (!member) return { error: "Please sign in to manage your Profile Boost.", status: 401 } as const;
  if (!member.kitPurchased) return { error: "Profile Boost is available with the Gigolo Kit.", status: 403 } as const;
  return { member } as const;
}

export async function GET() {
  try {
    const result = await getPremiumMember();
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    const boostExpiresAt = result.member.boostExpiresAt;
    return NextResponse.json({ boostExpiresAt, boostCredits: result.member.boostCredits, boostActive: Boolean(boostExpiresAt && new Date(boostExpiresAt).getTime() > Date.now()) });
  } catch {
    return NextResponse.json({ error: "Profile Boost is unavailable right now." }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await getPremiumMember();
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    const member = activateMemberBoost(result.member.id);
    return NextResponse.json({ boostExpiresAt: member.boostExpiresAt, boostCredits: member.boostCredits, boostActive: true });
  } catch (error) {
    if (error instanceof Error && error.message === "BOOST_NOT_AVAILABLE") return NextResponse.json({ error: "Use an available Boost credit after the active hour ends." }, { status: 409 });
    return NextResponse.json({ error: "We could not activate Profile Boost. Please try again." }, { status: 500 });
  }
}
