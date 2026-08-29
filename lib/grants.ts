import { prisma } from "@/lib/prisma";
import type { GrantReportFacts } from "@/lib/ai/types";

export async function buildGrantReportFacts(grantId: string, reportingMonth: string): Promise<GrantReportFacts | null> {
  const performance = await prisma.grantPerformance.findUnique({
    where: { grantId_reportingMonth: { grantId, reportingMonth } },
  });
  if (!performance) return null;

  const [financeLines, evidenceRecords] = await Promise.all([
    prisma.grantFinanceLine.findMany({ where: { grantId, reportingMonth } }),
    prisma.evidenceMedia.findMany({ where: { grantId, reportingMonth } }),
  ]);

  const totalApproved = financeLines.reduce((s, f) => s + f.approvedBudgetUnits, 0);
  const totalCumulativeUtilized = financeLines.reduce((s, f) => s + f.cumulativeUtilizedUnits, 0);
  const overallUtilizationRate = totalApproved > 0 ? (totalCumulativeUtilized / totalApproved) * 100 : 0;

  return {
    grantId: performance.grantId,
    donor: performance.donor,
    grantName: performance.grantName,
    reportingMonth: performance.reportingMonth,
    reportStatus: performance.reportStatus,
    riskStatus: performance.riskStatus,
    sampledSchoolRecords: performance.sampledSchoolRecords,
    schoolsCompletedPbl: performance.schoolsCompletedPbl,
    pblCompletionRate: performance.pblCompletionRate * 100,
    schoolsWithEvidence: performance.schoolsWithEvidence,
    evidenceSubmissionRate: performance.evidenceSubmissionRate * 100,
    totalEnrollment: performance.totalEnrollment,
    totalAttendance: performance.totalAttendance,
    attendanceRate: performance.attendanceRate * 100,
    milestoneSummary: performance.milestoneSummary,
    coveredDistricts: performance.coveredDistricts.split(";").map((d) => d.trim()).filter(Boolean),
    financeLines: financeLines.map((f) => ({
      budgetLine: f.budgetLine,
      approvedBudgetUnits: f.approvedBudgetUnits,
      cumulativeUtilizedUnits: f.cumulativeUtilizedUnits,
      cumulativeUtilizationRate: f.cumulativeUtilizationRate * 100,
    })),
    overallUtilizationRate,
    evidenceRecords: evidenceRecords.map((e) => ({
      title: e.title,
      summaryOrCaption: e.summaryOrCaption,
      district: e.district,
    })),
  };
}
