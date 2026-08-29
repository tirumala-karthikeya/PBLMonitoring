import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { classifyRate } from "@/lib/risk";
import { getAvailableMonths } from "@/lib/queries";

export async function GET(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const district = searchParams.get("district") ?? undefined;
  const block = searchParams.get("block") ?? undefined;

  const allMonths = await getAvailableMonths();
  const latestMonth = allMonths[allMonths.length - 1];

  const rows = await prisma.schoolResponse.findMany({
    where: { reportingMonth: latestMonth, district, block },
    orderBy: [{ district: "asc" }, { block: "asc" }, { schoolName: "asc" }],
  });

  const schools = rows.map((r) => ({
    schoolCode: r.schoolCode,
    schoolName: r.schoolName,
    district: r.district,
    block: r.block,
    pblConducted: r.pblConducted,
    evidenceSubmitted: r.evidenceSubmitted,
    totalEnrollment: r.totalEnrollment,
    attendanceRate: r.attendanceRate * 100,
    risk: classifyRate(r.attendanceRate * 100),
  }));

  return NextResponse.json({ month: latestMonth, schools });
}
