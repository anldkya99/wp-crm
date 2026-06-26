import { NextResponse } from "next/server";
import { runAutomationEngine } from "@/lib/server/automation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dryRun = Boolean(body.dryRun);
    const operatorId = String(body.operatorId ?? "") || null;
    const result = await runAutomationEngine({ dryRun, operatorId });
    return NextResponse.json({
      ...result,
      mode: dryRun ? "test" : "run",
      message: dryRun ? "Operatör yönlendirme motoru test edildi." : "Operatör yönlendirme önerileri hazırlandı."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Operatör yönlendirme motoru çalıştırılamadı." },
      { status: 500 }
    );
  }
}
