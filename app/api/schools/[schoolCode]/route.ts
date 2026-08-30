import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getSchoolDetail } from "@/lib/queries";

export async function GET(_request: Request, { params }: { params: { schoolCode: string } }) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const detail = await getSchoolDetail(params.schoolCode);
  if (!detail) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
