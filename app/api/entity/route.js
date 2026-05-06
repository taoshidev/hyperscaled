import { NextResponse } from "next/server";
import { getAllActiveMinersWithTiers } from "@/lib/miners";

export async function GET() {
  const miners = await getAllActiveMinersWithTiers();
  return NextResponse.json(miners);
}
