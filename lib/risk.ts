export type RiskStatus = "On Track" | "Behind" | "At Risk" | "Critical";

/**
 * Code-based thresholds from the assignment brief — no AI involved.
 * On Track >= 75%, Behind 60–<75%, At Risk 35–<60%, Critical < 35%.
 */
export function classifyRate(ratePercent: number): RiskStatus {
  if (ratePercent >= 75) return "On Track";
  if (ratePercent >= 60) return "Behind";
  if (ratePercent >= 35) return "At Risk";
  return "Critical";
}

export const RISK_ORDER: RiskStatus[] = ["Critical", "At Risk", "Behind", "On Track"];

export const RISK_STYLES: Record<RiskStatus, { bg: string; text: string; border: string }> = {
  "On Track": { bg: "bg-primary-fixed", text: "text-primary-container", border: "border-primary-container/30" },
  Behind: { bg: "bg-surface-variant", text: "text-on-surface-variant", border: "border-outline-variant" },
  "At Risk": { bg: "bg-tertiary-fixed", text: "text-tertiary", border: "border-tertiary/30" },
  Critical: { bg: "bg-error-container", text: "text-error", border: "border-error/30" },
};
