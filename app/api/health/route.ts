import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "tek-numarali-whatsapp-operasyon-paneli",
    database: "postgresql",
    whatsapp: "simulated-incoming"
  });
}
