import { classifyRate, type RiskStatus } from "@/lib/risk";

// --- Input row shapes (subsets of the Prisma models) ---------------------

export interface SchoolLevelRow {
  schoolCode: string;
  district: string;
  block: string;
  reportingMonth: string;
  pblConducted: boolean;
  evidenceSubmitted: boolean;
}

export interface ClassSubjectRow {
  schoolResponseId: string;
  district: string;
  block: string;
  reportingMonth: string;
  grade: number;
  subject: string;
  enrollment: number;
  attendance: number;
}

export interface AggregateMetrics {
  totalSchools: number;
  participatingSchools: number;
  participationRate: number; // 0-100
  evidenceSchools: number;
  evidenceSubmissionRate: number; // 0-100
  totalEnrollment: number;
  totalAttendance: number;
  attendanceRate: number; // 0-100
}

/**
 * Participation and evidence-submission are recorded once per school per
 * month (a single yes/no on the survey), so they are computed from the
 * whole school-response rows and are not affected by grade/subject filters.
 */
export function computeParticipationAndEvidence(
  rows: SchoolLevelRow[],
): Pick<
  AggregateMetrics,
  "totalSchools" | "participatingSchools" | "participationRate" | "evidenceSchools" | "evidenceSubmissionRate"
> {
  const totalSchools = rows.length;
  const participatingSchools = rows.filter((r) => r.pblConducted).length;
  const evidenceSchools = rows.filter((r) => r.evidenceSubmitted).length;
  return {
    totalSchools,
    participatingSchools,
    participationRate: totalSchools > 0 ? (participatingSchools / totalSchools) * 100 : 0,
    evidenceSchools,
    evidenceSubmissionRate: totalSchools > 0 ? (evidenceSchools / totalSchools) * 100 : 0,
  };
}

/**
 * Enrollment and attendance are computed from the normalized
 * ClassSubjectMetric rows (one row per school/grade/subject actually
 * taught this month), which is what makes grade/subject filters work:
 *
 * - totalEnrollment ("headcount"): deduped by (school, grade), since a
 *   grade's enrollment is the same number whether one or two subjects
 *   were taught there (summing raw rows would double-count it).
 * - attendanceRate: attendance summed over all matching rows, divided by
 *   enrollment summed over the SAME (un-deduped) rows. This reproduces the
 *   source CSV's own "Derived: Overall PBL attendance rate" methodology
 *   exactly (verified against School AAKD, July 2025: 133 / (94*2) =
 *   0.7074), without needing to special-case how many subjects a school
 *   taught. A school that only taught one subject simply has one row.
 */
export function computeAttendanceAggregate(
  rows: ClassSubjectRow[],
): Pick<AggregateMetrics, "totalEnrollment" | "totalAttendance" | "attendanceRate"> {
  const enrollmentByCohort = new Map<string, number>();
  let totalAttendance = 0;
  let rateDenominatorEnrollment = 0;

  for (const row of rows) {
    const cohortKey = `${row.schoolResponseId}:${row.grade}`;
    if (!enrollmentByCohort.has(cohortKey)) {
      enrollmentByCohort.set(cohortKey, row.enrollment);
    }
    totalAttendance += row.attendance;
    rateDenominatorEnrollment += row.enrollment;
  }

  const totalEnrollment = [...enrollmentByCohort.values()].reduce((sum, v) => sum + v, 0);
  const attendanceRate =
    rateDenominatorEnrollment > 0 ? (totalAttendance / rateDenominatorEnrollment) * 100 : 0;

  return { totalEnrollment, totalAttendance, attendanceRate };
}

export function computeAggregateMetrics(
  schoolRows: SchoolLevelRow[],
  classSubjectRows: ClassSubjectRow[],
): AggregateMetrics {
  return {
    ...computeParticipationAndEvidence(schoolRows),
    ...computeAttendanceAggregate(classSubjectRows),
  };
}

// --- Month-over-month --------------------------------------------------

export interface MoMDelta {
  metric: "participationRate" | "evidenceSubmissionRate" | "attendanceRate";
  current: number;
  previous: number | null;
  deltaPoints: number | null; // percentage-point change
}

export function computeMonthOverMonth(
  current: AggregateMetrics,
  previous: AggregateMetrics | null,
): MoMDelta[] {
  const metrics: MoMDelta["metric"][] = ["participationRate", "evidenceSubmissionRate", "attendanceRate"];
  return metrics.map((metric) => ({
    metric,
    current: current[metric],
    previous: previous ? previous[metric] : null,
    deltaPoints: previous ? current[metric] - previous[metric] : null,
  }));
}

// --- Geography ranking ---------------------------------------------------

export interface GeographyMetrics extends AggregateMetrics {
  name: string;
  risk: RiskStatus;
}

/**
 * Groups already-filtered rows by a geography key (district or block) and
 * computes each group's aggregate metrics + risk classification, based on
 * the group's overall attendance rate (the brief's headline indicator).
 */
export function rankGeographies(
  schoolRows: SchoolLevelRow[],
  classSubjectRows: ClassSubjectRow[],
  level: "district" | "block",
): GeographyMetrics[] {
  const names = new Set<string>();
  for (const r of schoolRows) names.add(level === "district" ? r.district : r.block);

  const results: GeographyMetrics[] = [];
  for (const name of names) {
    const schoolSubset = schoolRows.filter((r) => (level === "district" ? r.district : r.block) === name);
    const classSubset = classSubjectRows.filter(
      (r) => (level === "district" ? r.district : r.block) === name,
    );
    const metrics = computeAggregateMetrics(schoolSubset, classSubset);
    results.push({ name, ...metrics, risk: classifyRate(metrics.attendanceRate) });
  }

  return results.sort((a, b) => b.attendanceRate - a.attendanceRate);
}

// --- Monthly Review Summary (Tier 2) facts -------------------------------

export interface ReviewSummaryFacts {
  reportingMonth: string;
  scopeLabel: string;
  metrics: AggregateMetrics;
  risk: RiskStatus;
  momDeltas: MoMDelta[];
  topGeographies: GeographyMetrics[];
  priorityGeographies: GeographyMetrics[];
  discussionPoints: string[];
}

export function buildReviewSummaryFacts(params: {
  reportingMonth: string;
  scopeLabel: string;
  schoolRows: SchoolLevelRow[];
  classSubjectRows: ClassSubjectRow[];
  previousMetrics: AggregateMetrics | null;
  districtRanking: GeographyMetrics[];
}): ReviewSummaryFacts {
  const { reportingMonth, scopeLabel, schoolRows, classSubjectRows, previousMetrics, districtRanking } = params;

  const metrics = computeAggregateMetrics(schoolRows, classSubjectRows);
  const risk = classifyRate(metrics.attendanceRate);
  const momDeltas = computeMonthOverMonth(metrics, previousMetrics);

  const topGeographies = districtRanking.slice(0, 3);
  const priorityGeographies = [...districtRanking]
    .sort((a, b) => a.attendanceRate - b.attendanceRate)
    .slice(0, 3);

  const discussionPoints: string[] = [];
  if (priorityGeographies.length > 0) {
    discussionPoints.push(
      `Follow up on ${priorityGeographies.map((g) => g.name).join(", ")}: attendance below the rest of the cohort this month.`,
    );
  }
  if (metrics.evidenceSubmissionRate < metrics.participationRate - 10) {
    discussionPoints.push(
      "Evidence submission is trailing participation: schools are running PBL sessions but not documenting them.",
    );
  }
  const attendanceDelta = momDeltas.find((m) => m.metric === "attendanceRate");
  if (attendanceDelta?.deltaPoints !== null && attendanceDelta?.deltaPoints !== undefined) {
    if (attendanceDelta.deltaPoints < 0) {
      discussionPoints.push(
        `Attendance rate dropped ${Math.abs(attendanceDelta.deltaPoints).toFixed(1)} points versus last month.`,
      );
    } else if (attendanceDelta.deltaPoints > 0) {
      discussionPoints.push(
        `Attendance rate improved ${attendanceDelta.deltaPoints.toFixed(1)} points versus last month.`,
      );
    }
  }

  return {
    reportingMonth,
    scopeLabel,
    metrics,
    risk,
    momDeltas,
    topGeographies,
    priorityGeographies,
    discussionPoints,
  };
}
