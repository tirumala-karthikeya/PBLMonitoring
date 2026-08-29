import { prisma } from "@/lib/prisma";
import type { Prisma, SchoolResponse } from "@prisma/client";
import type { ClassSubjectRow, SchoolLevelRow } from "@/lib/metrics";

export interface ProgramFilters {
  month?: string;
  district?: string;
  block?: string;
  grade?: number;
  subject?: string;
}

export async function getSchoolRows(filters: Pick<ProgramFilters, "month" | "district" | "block">) {
  const where: Prisma.SchoolResponseWhereInput = {};
  if (filters.month) where.reportingMonth = filters.month;
  if (filters.district) where.district = filters.district;
  if (filters.block) where.block = filters.block;

  return prisma.schoolResponse.findMany({ where });
}

export async function getClassSubjectRows(filters: ProgramFilters): Promise<ClassSubjectRow[]> {
  const where: Prisma.ClassSubjectMetricWhereInput = {};
  if (filters.month) where.reportingMonth = filters.month;
  if (filters.district) where.district = filters.district;
  if (filters.block) where.block = filters.block;
  if (filters.grade) where.grade = filters.grade;
  if (filters.subject) where.subject = filters.subject;

  return prisma.classSubjectMetric.findMany({ where });
}

export function toSchoolLevelRows(rows: SchoolResponse[]): SchoolLevelRow[] {
  return rows.map((r) => ({
    schoolCode: r.schoolCode,
    district: r.district,
    block: r.block,
    reportingMonth: r.reportingMonth,
    pblConducted: r.pblConducted,
    evidenceSubmitted: r.evidenceSubmitted,
  }));
}

export async function getAvailableMonths(): Promise<string[]> {
  const rows = await prisma.schoolResponse.findMany({
    distinct: ["reportingMonth"],
    select: { reportingMonth: true },
    orderBy: { reportingMonth: "asc" },
  });
  return rows.map((r) => r.reportingMonth);
}

export async function getAvailableDistricts(): Promise<string[]> {
  const rows = await prisma.schoolResponse.findMany({
    distinct: ["district"],
    select: { district: true },
    orderBy: { district: "asc" },
  });
  return rows.map((r) => r.district);
}

export async function getAvailableBlocks(district?: string): Promise<string[]> {
  const rows = await prisma.schoolResponse.findMany({
    where: district ? { district } : undefined,
    distinct: ["block"],
    select: { block: true },
    orderBy: { block: "asc" },
  });
  return rows.map((r) => r.block);
}

export function previousReportingMonth(month: string, allMonths: string[]): string | null {
  const idx = allMonths.indexOf(month);
  if (idx <= 0) return null;
  return allMonths[idx - 1];
}
