import { NextRequest, NextResponse } from "next/server";
import { getCredits, setPlan, consumeCredits } from "@/lib/credits";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ credits: getCredits() });
}

export async function PATCH(req: NextRequest) {
  let body: { plan?: string; total?: number; consume_cents?: number };
  try {
    body = await req.json() as { plan?: string; total?: number; consume_cents?: number };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.plan && typeof body.total === "number") {
    setPlan("demo_user", body.plan, body.total);
  }
  if (typeof body.consume_cents === "number") {
    consumeCredits("demo_user", body.consume_cents);
  }
  return NextResponse.json({ credits: getCredits() });
}
