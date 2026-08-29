export default function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = "All",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  allLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-base min-w-[140px]">
      <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <select
          className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded-DEFAULT py-2 pl-3 pr-9 text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 cursor-pointer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{allLabel}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[20px]">
          expand_more
        </span>
      </div>
    </div>
  );
}
