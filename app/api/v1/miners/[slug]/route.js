import { NextResponse } from "next/server";

import { getMinerCatalogBySlug } from "@/lib/miners";

export async function GET(_request, { params }) {
  const { slug } = params;
  const miner = await getMinerCatalogBySlug(slug);

  if (!miner) {
    return NextResponse.json({ error: "Miner not found" }, { status: 404 });
  }

  return NextResponse.json(miner);
}
