export interface GrantReportFacts {
  grantId: string;
  donor: string;
  grantName: string;
  reportingMonth: string;
  reportStatus: string;
  riskStatus: string;
  sampledSchoolRecords: number;
  schoolsCompletedPbl: number;
  pblCompletionRate: number; // 0-100
  schoolsWithEvidence: number;
  evidenceSubmissionRate: number; // 0-100
  totalEnrollment: number;
  totalAttendance: number;
  attendanceRate: number; // 0-100
  milestoneSummary: string;
  coveredDistricts: string[];
  financeLines: Array<{
    budgetLine: string;
    approvedBudgetUnits: number;
    cumulativeUtilizedUnits: number;
    cumulativeUtilizationRate: number; // 0-100
  }>;
  overallUtilizationRate: number; // 0-100, weighted across budget lines
  evidenceRecords: Array<{ title: string; summaryOrCaption: string; district: string }>;
}

export interface NarrativeResult {
  narrative: string;
  generationMode: "ai" | "template";
  sourceFacts: Record<string, string | number>;
}
