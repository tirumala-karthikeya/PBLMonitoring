"use client";

import { useCallback, useEffect, useState } from "react";
import KpiCard from "@/components/KpiCard";
import RiskBadge from "@/components/RiskBadge";
import FilterSelect from "@/components/FilterSelect";
import type { AggregateMetrics, GeographyMetrics, MoMDelta, ReviewSummaryFacts } from "@/lib/metrics";
import type { RiskStatus } from "@/lib/risk";

interface FilterOptions {
  months: string[];
  districts: string[];
  blocks: string[];
  grades: number[];
  subjects: string[];
}

interface DashboardData {
  month: string;
  availableMonths: string[];
  metrics: AggregateMetrics;
  risk: RiskStatus;
  momDeltas: MoMDelta[];
  districtRanking: GeographyMetrics[];
  blockRanking: GeographyMetrics[];
}

interface SummaryResponse {
  facts: ReviewSummaryFacts;
  narrative?: string;
  generationMode?: "ai" | "template";
}

function findDelta(deltas: MoMDelta[], metric: MoMDelta["metric"]) {
  return deltas.find((d) => d.metric === metric)?.deltaPoints ?? null;
}

export default function DashboardClient() {
  const [month, setMonth] = useState("");
  const [district, setDistrict] = useState("");
  const [block, setBlock] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [geoView, setGeoView] = useState<"district" | "block">("district");

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (district) params.set("district", district);
    fetch(`/api/filters?${params}`)
      .then((r) => r.json())
      .then(setFilterOptions);
  }, [district]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (district) params.set("district", district);
    if (block) params.set("block", block);
    if (grade) params.set("grade", grade);
    if (subject) params.set("subject", subject);
    const res = await fetch(`/api/dashboard?${params}`);
    const json: DashboardData = await res.json();
    setData(json);
    if (!month) setMonth(json.month);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, district, block, grade, subject]);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, district, block, grade, subject]);

  const loadSummary = useCallback(
    async (method: "GET" | "POST") => {
      setSummaryLoading(true);
      const params = new URLSearchParams();
      if (month) params.set("month", month);
      if (district) params.set("district", district);
      if (block) params.set("block", block);
      const res = await fetch(`/api/summary?${params}`, { method });
      const json: SummaryResponse = await res.json();
      setSummary(json);
      setSummaryLoading(false);
    },
    [month, district, block],
  );

  useEffect(() => {
    loadSummary("GET");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, district, block]);

  const metrics = data?.metrics;
  const geoRanking = data ? (geoView === "district" ? data.districtRanking : data.blockRanking) : [];
  const attentionList = data
    ? [...data.blockRanking]
        .filter((g) => g.risk === "Critical" || g.risk === "At Risk")
        .sort((a, b) => a.attendanceRate - b.attendanceRate)
        .slice(0, 5)
    : [];

  return (
    <div className="space-y-stack-lg pb-stack-lg">
      {/* Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-wrap gap-stack-md items-end">
        <FilterSelect
          label="Reporting Month"
          value={month}
          onChange={setMonth}
          allLabel="Latest"
          options={(filterOptions?.months ?? []).map((m) => ({ value: m, label: m }))}
        />
        <FilterSelect
          label="District"
          value={district}
          onChange={(v) => {
            setDistrict(v);
            setBlock("");
          }}
          options={(filterOptions?.districts ?? []).map((d) => ({ value: d, label: d }))}
        />
        <FilterSelect
          label="Block"
          value={block}
          onChange={setBlock}
          options={(filterOptions?.blocks ?? []).map((b) => ({ value: b, label: b }))}
        />
        <FilterSelect
          label="Grade"
          value={grade}
          onChange={setGrade}
          options={(filterOptions?.grades ?? []).map((g) => ({ value: String(g), label: `Class ${g}` }))}
        />
        <FilterSelect
          label="Subject"
          value={subject}
          onChange={setSubject}
          options={(filterOptions?.subjects ?? []).map((s) => ({ value: s, label: s }))}
        />
        {(district || block || grade || subject) && (
          <button
            onClick={() => {
              setDistrict("");
              setBlock("");
              setGrade("");
              setSubject("");
            }}
            className="text-label-md font-label-md text-primary hover:text-primary-container transition-colors uppercase tracking-wider mb-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading || !metrics ? (
        <div className="text-body-lg font-body-lg text-on-surface-variant py-stack-lg text-center">
          Loading dashboard…
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
            <KpiCard label="Total Schools" icon="apartment" value={metrics.totalSchools.toLocaleString()} />
            <KpiCard
              label="Participating Schools"
              icon="groups"
              value={metrics.participatingSchools.toLocaleString()}
              deltaLabel={`${metrics.participationRate.toFixed(1)}% participation`}
              deltaPoints={findDelta(data!.momDeltas, "participationRate")}
            />
            <KpiCard
              label="Evidence Submission"
              icon="fact_check"
              value={`${metrics.evidenceSubmissionRate.toFixed(1)}%`}
              deltaPoints={findDelta(data!.momDeltas, "evidenceSubmissionRate")}
            />
            <KpiCard label="Total Enrollment" icon="school" value={metrics.totalEnrollment.toLocaleString()} />
            <KpiCard
              label="Total Attendance"
              icon="event_available"
              value={metrics.totalAttendance.toLocaleString()}
            />
            <div className="bg-surface-container-lowest p-stack-md rounded-lg border border-outline-variant hover:border-outline transition-colors flex flex-col justify-between">
              <div className="flex justify-between items-start mb-stack-sm">
                <span className="text-label-md font-label-md text-outline uppercase tracking-wider">
                  Attendance Rate
                </span>
                <span className="material-symbols-outlined text-outline text-[20px]">monitor_heart</span>
              </div>
              <div className="flex items-end gap-stack-sm flex-wrap">
                <span className="text-display font-display text-on-surface">
                  {metrics.attendanceRate.toFixed(1)}%
                </span>
                <RiskBadge risk={data!.risk} />
              </div>
            </div>
          </div>

          {/* Geography performance + Attention panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden flex flex-col">
              <div className="p-stack-md border-b border-outline-variant flex justify-between items-center bg-surface-bright">
                <h3 className="text-headline-md font-headline-md text-on-surface">
                  {geoView === "district" ? "District" : "Block"} Performance
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGeoView("district")}
                    className={`px-3 py-1 text-label-md font-label-md rounded-DEFAULT ${
                      geoView === "district"
                        ? "bg-primary-container text-on-primary"
                        : "bg-surface text-on-surface-variant border border-outline-variant hover:bg-surface-container-low"
                    }`}
                  >
                    Districts
                  </button>
                  <button
                    onClick={() => setGeoView("block")}
                    className={`px-3 py-1 text-label-md font-label-md rounded-DEFAULT ${
                      geoView === "block"
                        ? "bg-primary-container text-on-primary"
                        : "bg-surface text-on-surface-variant border border-outline-variant hover:bg-surface-container-low"
                    }`}
                  >
                    Blocks
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto max-h-[520px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low sticky top-0 z-10">
                    <tr>
                      <th className="p-stack-sm pl-stack-md text-label-md font-label-md text-outline uppercase border-b border-outline-variant">
                        {geoView === "district" ? "District" : "Block"}
                      </th>
                      <th className="p-stack-sm text-label-md font-label-md text-outline uppercase border-b border-outline-variant">
                        Attendance
                      </th>
                      <th className="p-stack-sm text-label-md font-label-md text-outline uppercase border-b border-outline-variant">
                        Participation
                      </th>
                      <th className="p-stack-sm pr-stack-md text-label-md font-label-md text-outline uppercase border-b border-outline-variant text-right">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {geoRanking.map((g) => (
                      <tr key={g.name} className="border-b border-outline-variant hover:bg-surface-container-low">
                        <td className="p-stack-sm pl-stack-md text-body-md font-body-md font-medium text-on-surface">
                          {g.name}
                        </td>
                        <td className="p-stack-sm text-data-mono font-data-mono text-on-surface">
                          {g.attendanceRate.toFixed(1)}%
                        </td>
                        <td className="p-stack-sm text-data-mono font-data-mono text-on-surface">
                          {g.participationRate.toFixed(1)}%
                        </td>
                        <td className="p-stack-sm pr-stack-md text-right">
                          <RiskBadge risk={g.risk} />
                        </td>
                      </tr>
                    ))}
                    {geoRanking.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-stack-md text-center text-on-surface-variant">
                          No data for this filter combination.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-1 bg-surface-container-lowest rounded-lg border border-outline-variant flex flex-col">
              <div className="p-stack-md border-b border-outline-variant bg-surface-bright flex items-center gap-2">
                <span className="material-symbols-outlined text-error">warning</span>
                <h3 className="text-headline-md font-headline-md text-on-surface">Attention Required</h3>
              </div>
              <div className="flex-1 overflow-auto p-stack-sm">
                {attentionList.length === 0 ? (
                  <p className="text-body-md font-body-md text-on-surface-variant p-stack-sm">
                    No blocks at risk for this filter. Nice work.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {attentionList.map((g) => (
                      <div
                        key={g.name}
                        className={`p-stack-sm rounded-md border flex items-start gap-3 ${
                          g.risk === "Critical" ? "border-error-container bg-error-container/20" : "border-outline-variant bg-surface-container-low"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined mt-0.5 text-[20px] ${g.risk === "Critical" ? "text-error" : "text-on-surface-variant"}`}
                        >
                          {g.risk === "Critical" ? "error" : "trending_flat"}
                        </span>
                        <div>
                          <h4 className="text-body-md font-body-md font-semibold text-on-surface">{g.name}</h4>
                          <p className="text-body-md font-body-md text-on-surface-variant text-sm mt-1">
                            Attendance {g.attendanceRate.toFixed(1)}%, participation {g.participationRate.toFixed(1)}%.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Monthly Review Summary (Tier 2) */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-container-margin">
            <div className="flex items-center justify-between mb-stack-md">
              <h3 className="text-headline-md font-headline-md font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-outline">subject</span>
                Monthly Review Summary
              </h3>
              <div className="flex items-center gap-stack-sm">
                {summary?.generationMode && (
                  <span
                    className={`text-label-md font-label-md px-2 py-1 rounded-DEFAULT uppercase tracking-wider ${
                      summary.generationMode === "ai"
                        ? "bg-secondary-container text-on-secondary-container"
                        : "bg-surface-variant text-on-surface-variant"
                    }`}
                  >
                    {summary.generationMode === "ai" ? "AI-generated" : "Template (deterministic)"}
                  </span>
                )}
                <button
                  onClick={() => loadSummary("POST")}
                  disabled={summaryLoading}
                  className="px-3 py-1.5 text-label-md font-label-md bg-primary-container text-on-primary rounded-DEFAULT hover:bg-primary transition-colors disabled:opacity-60"
                >
                  {summaryLoading ? "Generating…" : "Generate Narrative"}
                </button>
              </div>
            </div>

            {summary?.facts && (
              <>
                {summary.narrative && (
                  <div className="prose prose-sm max-w-none text-body-lg font-body-lg text-on-surface leading-relaxed border-l-4 border-secondary-fixed pl-stack-md bg-surface p-stack-sm mb-stack-md">
                    {summary.narrative}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md text-body-md font-body-md text-on-surface-variant">
                  <div>
                    <h4 className="text-label-md font-label-md text-outline uppercase mb-1">Priority geographies</h4>
                    <ul className="list-disc list-inside">
                      {summary.facts.priorityGeographies.map((g) => (
                        <li key={g.name}>
                          {g.name}: {g.attendanceRate.toFixed(1)}% attendance ({g.risk})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-label-md font-label-md text-outline uppercase mb-1">Discussion points</h4>
                    <ul className="list-disc list-inside">
                      {summary.facts.discussionPoints.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                      {summary.facts.discussionPoints.length === 0 && <li>No flags this month.</li>}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
