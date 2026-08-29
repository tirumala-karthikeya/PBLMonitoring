import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { rankGeographies } from "@/lib/metrics";
import { getAvailableMonths, getClassSubjectRows, getSchoolRows, toSchoolLevelRows } from "@/lib/queries";

export async function GET(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level") === "block" ? "block" : "district";
  const district = searchParams.get("district") ?? undefined;
  const block = searchParams.get("block") ?? undefined;
  const grade = searchParams.get("grade") ? Number(searchParams.get("grade")) : undefined;
  const subject = searchParams.get("subject") ?? undefined;

  const allMonths = await getAvailableMonths();
  const month = searchParams.get("month") ?? allMonths[allMonths.length - 1];

  const [schoolRowsRaw, classSubjectRows] = await Promise.all([
    getSchoolRows({ month, district, block }),
    getClassSubjectRows({ month, district, block, grade, subject }),
  ]);

  const ranking = rankGeographies(toSchoolLevelRows(schoolRowsRaw), classSubjectRows, level);
  return NextResponse.json({ month, level, ranking });
}
