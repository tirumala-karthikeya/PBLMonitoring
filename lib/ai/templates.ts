import type { ReviewSummaryFacts } from "@/lib/metrics";
import type { GrantReportFacts } from "@/lib/ai/types";

function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

/**
 * Deterministic, template-based narrative — no AI involved. Used whenever
 * ANTHROPIC_API_KEY is unset or the API call fails, and mirrors the style
 * of the draft_report_text examples already present in the source CSVs.
 */
export function buildGrantReportTemplate(facts: GrantReportFacts): string {
  const districts = facts.coveredDistricts.join(", ");
  const sentences: string[] = [];

  sentences.push(
    `In ${facts.reportingMonth}, ${facts.grantName} (${facts.donor}) reached ${pct(facts.pblCompletionRate)} PBL completion and ${pct(facts.evidenceSubmissionRate)} evidence submission across ${facts.sampledSchoolRecords} sampled schools in ${districts}.`,
  );
  sentences.push(
    `Attendance across ${facts.totalEnrollment.toLocaleString()} enrolled students stood at ${pct(facts.attendanceRate)}, giving an overall program status of ${facts.riskStatus}.`,
  );
  sentences.push(
    `Grant funds were utilized at ${pct(facts.overallUtilizationRate)} of the approved budget across ${facts.financeLines.length} budget line${facts.financeLines.length === 1 ? "" : "s"} to date.`,
  );
  if (facts.milestoneSummary) {
    sentences.push(`Milestones: ${facts.milestoneSummary}.`);
  }
  if (facts.evidenceRecords.length > 0) {
    const titles = facts.evidenceRecords.map((e) => e.title).join("; ");
    sentences.push(`Supporting evidence on file: ${titles}.`);
  }
  if (facts.riskStatus === "At Risk" || facts.riskStatus === "Critical") {
    sentences.push(
      `This grant needs follow-up this month — use the district and block dashboards to identify priority intervention areas.`,
    );
  }

  return sentences.join(" ");
}

export function buildReviewSummaryTemplate(facts: ReviewSummaryFacts): string {
  const { metrics, momDeltas, topGeographies, priorityGeographies, discussionPoints } = facts;
  const sentences: string[] = [];

  sentences.push(
    `Program review for ${facts.scopeLabel}, ${facts.reportingMonth}: ${metrics.totalSchools} schools reporting, ${pct(metrics.participationRate)} participation, ${pct(metrics.evidenceSubmissionRate)} evidence submission, and ${pct(metrics.attendanceRate)} attendance. Overall status: ${facts.risk}.`,
  );

  const momSentences = momDeltas
    .filter((m) => m.deltaPoints !== null)
    .map((m) => {
      const label =
        m.metric === "participationRate"
          ? "Participation"
          : m.metric === "evidenceSubmissionRate"
            ? "Evidence submission"
            : "Attendance";
      const delta = m.deltaPoints!;
      const direction = delta >= 0 ? "up" : "down";
      return `${label} ${direction} ${Math.abs(delta).toFixed(1)} points month-over-month`;
    });
  if (momSentences.length > 0) {
    sentences.push(momSentences.join("; ") + ".");
  }

  if (topGeographies.length > 0) {
    sentences.push(
      `Highest-performing: ${topGeographies.map((g) => `${g.name} (${pct(g.attendanceRate)})`).join(", ")}.`,
    );
  }
  if (priorityGeographies.length > 0) {
    sentences.push(
      `Priority for follow-up: ${priorityGeographies.map((g) => `${g.name} (${pct(g.attendanceRate)}, ${g.risk})`).join(", ")}.`,
    );
  }
  if (discussionPoints.length > 0) {
    sentences.push(`Discussion points: ${discussionPoints.join(" ")}`);
  }

  return sentences.join(" ");
}
