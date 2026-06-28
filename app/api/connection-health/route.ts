import { NextResponse } from "next/server";
import { getProviderHealthSummary } from "@/lib/connection-engine/health";

export async function GET() {
  const providers = await getProviderHealthSummary();
  return NextResponse.json({ providers });
}
