import { RISK_STYLES, type RiskStatus } from "@/lib/risk";

export default function RiskBadge({ risk }: { risk: RiskStatus }) {
  const style = RISK_STYLES[risk];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-data-mono font-data-mono text-[12px] border ${style.bg} ${style.text} ${style.border}`}
    >
      {risk}
    </span>
  );
}
