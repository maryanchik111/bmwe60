import { NextResponse } from "next/server";
import { EMPTY_STATS, getStats } from "@/lib/donations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getStats());
  } catch {
    return NextResponse.json(EMPTY_STATS);
  }
}
