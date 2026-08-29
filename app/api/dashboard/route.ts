import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { classifyRate } from "@/lib/risk";
import { computeAggregateMetrics, computeMonthOverMonth, rankGeographies } from "@/lib/metrics";
import {
  getAvailableMonths,
  getClassSubjectRows,
  getSchoolRows,
  previousReportingMonth,
  toSchoolLevelRows,
  type ProgramFilters,
} from "@/lib/queries";

function parseFilters(searchParams: URLSearchParams): ProgramFilters {
  const grade = searchParams.get("grade");
  return {
    month: searchParams.get("month") ?? undefined,
    district: searchParams.get("district") ?? undefined,
    block: searchParams.get("block") ?? undefined,
    grade: grade ? Number(grade) : undefined,
    subject: searchParams.get("subject") ?? undefined,
  };
}

export async function GET(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const filters = parseFilters(searchParams);

  const allMonths = await getAvailableMonths();
  const month = filters.month ?? allMonths[allMonths.length - 1];

  const [schoolRowsRaw, classSubjectRows] = await Promise.all([
    getSchoolRows({ month, district: filters.district, block: filters.block }),
    getClassSubjectRows({ ...filters, month }),
  ]);
  const schoolRows = toSchoolLevelRows(schoolRowsRaw);

  const metrics = computeAggregateMetrics(schoolRows, classSubjectRows);
  const risk = classifyRate(metrics.attendanceRate);

  const prevMonth = previousReportingMonth(month, allMonths);
  let previousMetrics = null;
  if (prevMonth) {
    const [prevSchoolRowsRaw, prevClassSubjectRows] = await Promise.all([
      getSchoolRows({ month: prevMonth, district: filters.district, block: filters.block }),
      getClassSubjectRows({ ...filters, month: prevMonth }),
    ]);
    previousMetrics = computeAggregateMetrics(toSchoolLevelRows(prevSchoolRowsRaw), prevClassSubjectRows);
  }
  const momDeltas = computeMonthOverMonth(metrics, previousMetrics);

  const districtRanking = rankGeographies(schoolRows, classSubjectRows, "district");
  const blockRanking = rankGeographies(schoolRows, classSubjectRows, "block");

  return NextResponse.json({
    month,
    availableMonths: allMonths,
    filters,
    metrics,
    risk,
    momDeltas,
    districtRanking,
    blockRanking,
  });
}
