import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { buildGrantReportFacts } from "@/lib/grants";

export async function GET(request: Request, { params }: { params: { grantId: string } }) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  if (!month) {
    return NextResponse.json({ error: "month is required" }, { status: 400 });
  }

  const facts = await buildGrantReportFacts(params.grantId, month);
  if (!facts) {
    return NextResponse.json({ error: "No data for this grant/month" }, { status: 404 });
  }

  const evidence = await prisma.evidenceMedia.findMany({
    where: { grantId: params.grantId, reportingMonth: month },
  });

  return NextResponse.json({
    facts,
    evidence: evidence.map((e) => ({
      recordId: e.recordId,
      recordType: e.recordType,
      title: e.title,
      summaryOrCaption: e.summaryOrCaption,
      district: e.district,
      imageUrl: `/evidence/${e.fileName}`,
      usageNote: e.usageNote,
    })),
  });
}
