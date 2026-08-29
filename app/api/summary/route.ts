import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { buildReviewSummaryFacts, computeAggregateMetrics, rankGeographies } from "@/lib/metrics";
import { generateReviewSummaryNarrative } from "@/lib/ai/narrative";
import {
  getAvailableMonths,
  getClassSubjectRows,
  getSchoolRows,
  previousReportingMonth,
  toSchoolLevelRows,
} from "@/lib/queries";

function scopeLabel(district?: string, block?: string): string {
  if (block) return `${block}${district ? `, ${district}` : ""}`;
  if (district) return district;
  return "All districts";
}

async function buildFacts(searchParams: URLSearchParams) {
  const month = searchParams.get("month") ?? undefined;
  const district = searchParams.get("district") ?? undefined;
  const block = searchParams.get("block") ?? undefined;

  const allMonths = await getAvailableMonths();
  const resolvedMonth = month ?? allMonths[allMonths.length - 1];

  const [schoolRowsRaw, classSubjectRows] = await Promise.all([
    getSchoolRows({ month: resolvedMonth, district, block }),
    getClassSubjectRows({ month: resolvedMonth, district, block }),
  ]);
  const schoolRows = toSchoolLevelRows(schoolRowsRaw);

  const prevMonth = previousReportingMonth(resolvedMonth, allMonths);
  let previousMetrics = null;
  if (prevMonth) {
    const [prevSchoolRowsRaw, prevClassSubjectRows] = await Promise.all([
      getSchoolRows({ month: prevMonth, district, block }),
      getClassSubjectRows({ month: prevMonth, district, block }),
    ]);
    previousMetrics = computeAggregateMetrics(toSchoolLevelRows(prevSchoolRowsRaw), prevClassSubjectRows);
  }

  const districtRanking = rankGeographies(schoolRows, classSubjectRows, district ? "block" : "district");

  return buildReviewSummaryFacts({
    reportingMonth: resolvedMonth,
    scopeLabel: scopeLabel(district, block),
    schoolRows,
    classSubjectRows,
    previousMetrics,
    districtRanking,
  });
}

export async function GET(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const facts = await buildFacts(searchParams);
  return NextResponse.json({ facts });
}

export async function POST(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const facts = await buildFacts(searchParams);
  const result = await generateReviewSummaryNarrative(facts);

  return NextResponse.json({ facts, ...result });
}
