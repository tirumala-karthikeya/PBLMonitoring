import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const rows = await prisma.grantPerformance.findMany({
    select: { grantId: true, grantName: true, donor: true, reportingMonth: true },
    orderBy: [{ grantId: "asc" }, { reportingMonth: "asc" }],
  });

  const grantsMap = new Map<string, { grantId: string; grantName: string; donor: string; months: string[] }>();
  for (const row of rows) {
    const existing = grantsMap.get(row.grantId);
    if (existing) {
      existing.months.push(row.reportingMonth);
    } else {
      grantsMap.set(row.grantId, {
        grantId: row.grantId,
        grantName: row.grantName,
        donor: row.donor,
        months: [row.reportingMonth],
      });
    }
  }

  return NextResponse.json({ grants: [...grantsMap.values()] });
}
