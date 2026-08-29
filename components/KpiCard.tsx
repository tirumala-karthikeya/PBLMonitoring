export default function KpiCard({
  label,
  icon,
  value,
  deltaPoints,
  deltaLabel,
}: {
  label: string;
  icon: string;
  value: string;
  deltaPoints?: number | null;
  deltaLabel?: string;
}) {
  const hasDelta = deltaPoints !== undefined && deltaPoints !== null;
  const positive = hasDelta && deltaPoints! >= 0;

  return (
    <div className="bg-surface-container-lowest p-stack-md rounded-lg border border-outline-variant hover:border-outline transition-colors flex flex-col justify-between">
      <div className="flex justify-between items-start mb-stack-sm">
        <span className="text-label-md font-label-md text-outline uppercase tracking-wider">{label}</span>
        <span className="material-symbols-outlined text-outline text-[20px]">{icon}</span>
      </div>
      <div className="flex items-end gap-stack-sm flex-wrap">
        <span className="text-display font-display text-on-surface">{value}</span>
        {hasDelta && (
          <span
            className={`text-label-md font-label-md rounded-full px-2 py-0.5 mb-1 flex items-center gap-1 ${
              positive ? "text-primary-container bg-primary-fixed" : "text-error bg-error-container"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {positive ? "trending_up" : "trending_down"}
            </span>
            {positive ? "+" : ""}
            {deltaPoints!.toFixed(1)} pts
          </span>
        )}
      </div>
      {deltaLabel && <p className="text-body-md font-body-md text-on-surface-variant mt-stack-sm">{deltaLabel}</p>}
    </div>
  );
}
