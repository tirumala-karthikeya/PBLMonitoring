import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { buildGrantReportFacts } from "@/lib/grants";
import { generateGrantNarrative } from "@/lib/ai/narrative";

export async function POST(request: Request, { params }: { params: { grantId: string } }) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const month = body?.month as string | undefined;
  if (!month) {
    return NextResponse.json({ error: "month is required" }, { status: 400 });
  }

  const facts = await buildGrantReportFacts(params.grantId, month);
  if (!facts) {
    return NextResponse.json({ error: "No data for this grant/month" }, { status: 404 });
  }

  const result = await generateGrantNarrative(facts);
  return NextResponse.json({ facts, ...result });
}
