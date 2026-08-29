import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getAvailableBlocks, getAvailableDistricts, getAvailableMonths } from "@/lib/queries";

export async function GET(request: Request) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const district = searchParams.get("district") ?? undefined;

  const [months, districts, blocks] = await Promise.all([
    getAvailableMonths(),
    getAvailableDistricts(),
    getAvailableBlocks(district),
  ]);

  return NextResponse.json({
    months,
    districts,
    blocks,
    grades: [6, 7, 8],
    subjects: ["Science", "Math"],
  });
}
