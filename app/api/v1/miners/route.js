import { NextResponse } from "next/server";

import { getAllMinerCatalogEntries } from "@/lib/miners";

export async function GET() {
  const miners = await getAllMinerCatalogEntries();
  return NextResponse.json(miners);
}
