import Anthropic from "@anthropic-ai/sdk";
import type { ReviewSummaryFacts } from "@/lib/metrics";
import type { GrantReportFacts, NarrativeResult } from "@/lib/ai/types";
import { buildGrantReportTemplate, buildReviewSummaryTemplate } from "@/lib/ai/templates";

const MODEL = "claude-opus-5";

const GROUNDING_SYSTEM_PROMPT = `You write short, factual program-review and grant-report narratives for an education nonprofit's monitoring dashboard.

Rules:
- Use ONLY the facts provided in the JSON below. Never invent numbers, locations, achievements, or evidence not present in the facts.
- Do not round numbers in a way that changes their meaning; you may format them naturally (e.g. "84.2%").
- Write 3-5 sentences of plain, report-ready prose. No headings, no bullet points, no markdown.
- If the facts indicate risk (At Risk or Critical), say so plainly and note that follow-up is needed.
- Do not mention that you are an AI or that you were given "facts" — just write the narrative.`;

/**
 * Calls Claude with only a structured facts object (never raw CSV rows).
 * Returns null on any failure — missing key, network error, rate limit,
 * or an unexpected response shape — so callers can fall back to the
 * deterministic template generator without the request ever failing.
 */
async function callClaude(factsJson: unknown): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      output_config: { effort: "low" },
      system: GROUNDING_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Facts:\n${JSON.stringify(factsJson, null, 2)}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") return null;

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text.trim() : "";
    return text.length > 0 ? text : null;
  } catch (err) {
    console.warn("Claude narrative generation failed, falling back to template:", err);
    return null;
  }
}

export async function generateGrantNarrative(facts: GrantReportFacts): Promise<NarrativeResult> {
  const sourceFacts: Record<string, string | number> = {
    grant: facts.grantName,
    donor: facts.donor,
    reportingMonth: facts.reportingMonth,
    pblCompletionRate: facts.pblCompletionRate,
    evidenceSubmissionRate: facts.evidenceSubmissionRate,
    attendanceRate: facts.attendanceRate,
    overallUtilizationRate: facts.overallUtilizationRate,
    riskStatus: facts.riskStatus,
    totalEnrollment: facts.totalEnrollment,
  };

  const aiText = await callClaude(facts);
  if (aiText) {
    return { narrative: aiText, generationMode: "ai", sourceFacts };
  }
  return { narrative: buildGrantReportTemplate(facts), generationMode: "template", sourceFacts };
}

export async function generateReviewSummaryNarrative(facts: ReviewSummaryFacts): Promise<NarrativeResult> {
  const sourceFacts: Record<string, string | number> = {
    scope: facts.scopeLabel,
    reportingMonth: facts.reportingMonth,
    participationRate: facts.metrics.participationRate,
    evidenceSubmissionRate: facts.metrics.evidenceSubmissionRate,
    attendanceRate: facts.metrics.attendanceRate,
    risk: facts.risk,
    totalSchools: facts.metrics.totalSchools,
  };

  const aiText = await callClaude(facts);
  if (aiText) {
    return { narrative: aiText, generationMode: "ai", sourceFacts };
  }
  return { narrative: buildReviewSummaryTemplate(facts), generationMode: "template", sourceFacts };
}
