"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { GrantReportFacts, NarrativeResult } from "@/lib/ai/types";

interface GrantSummary {
  grantId: string;
  grantName: string;
  donor: string;
  months: string[];
}

interface EvidenceItem {
  recordId: string;
  recordType: string;
  title: string;
  summaryOrCaption: string;
  district: string;
  imageUrl: string;
  usageNote: string;
}

interface FactPanelResponse {
  facts: GrantReportFacts;
  evidence: EvidenceItem[];
}

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

export default function ReportsClient() {
  const [grants, setGrants] = useState<GrantSummary[]>([]);
  const [grantId, setGrantId] = useState("");
  const [month, setMonth] = useState("");

  const [panel, setPanel] = useState<FactPanelResponse | null>(null);
  const [loadingPanel, setLoadingPanel] = useState(false);

  const [report, setReport] = useState<NarrativeResult | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/grants")
      .then((r) => r.json())
      .then((data: { grants: GrantSummary[] }) => {
        setGrants(data.grants);
        if (data.grants.length > 0) {
          setGrantId(data.grants[0].grantId);
          setMonth(data.grants[0].months[data.grants[0].months.length - 1]);
        }
      });
  }, []);

  useEffect(() => {
    if (!grantId || !month) return;
    setLoadingPanel(true);
    setReport(null);
    fetch(`/api/grants/${grantId}?month=${month}`)
      .then((r) => r.json())
      .then((data: FactPanelResponse) => {
        setPanel(data);
        setLoadingPanel(false);
      });
  }, [grantId, month]);

  async function generateReport() {
    setGenerating(true);
    const res = await fetch(`/api/grants/${grantId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month }),
    });
    const json: NarrativeResult = await res.json();
    setReport(json);
    setGenerating(false);
  }

  const selectedGrant = grants.find((g) => g.grantId === grantId);
  const facts = panel?.facts;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
      {/* Left: configuration */}
      <div className="lg:col-span-3 flex flex-col gap-stack-lg print:hidden">
        <section className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-stack-md flex flex-col gap-stack-md">
          <div className="border-b border-outline-variant pb-stack-sm">
            <h3 className="text-body-lg font-body-lg font-semibold text-on-surface">Report Configuration</h3>
          </div>

          <div className="flex flex-col gap-base">
            <label className="text-label-md font-label-md text-on-surface-variant">Select Grant</label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded-DEFAULT py-2 pl-3 pr-10 text-body-md focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/10 text-on-surface cursor-pointer"
                value={grantId}
                onChange={(e) => {
                  setGrantId(e.target.value);
                  const g = grants.find((x) => x.grantId === e.target.value);
                  if (g) setMonth(g.months[g.months.length - 1]);
                }}
              >
                {grants.map((g) => (
                  <option key={g.grantId} value={g.grantId}>
                    {g.grantName} ({g.donor})
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                expand_more
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-base">
            <label className="text-label-md font-label-md text-on-surface-variant">Reporting Month</label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded-DEFAULT py-2 pl-3 pr-10 text-body-md focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/10 text-on-surface cursor-pointer"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {(selectedGrant?.months ?? []).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                expand_more
              </span>
            </div>
          </div>
        </section>

        <button
          onClick={generateReport}
          disabled={!facts || generating}
          className="w-full bg-primary-container text-on-primary py-3 px-4 rounded-DEFAULT font-body-lg font-medium flex items-center justify-center gap-2 hover:bg-primary transition-colors disabled:opacity-60"
        >
          <span className="material-symbols-outlined" data-weight="fill">
            subject
          </span>
          {generating ? "Generating…" : "Generate Report Section"}
        </button>

        <button
          onClick={() => window.print()}
          disabled={!report}
          className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface py-3 px-4 rounded-DEFAULT font-body-lg font-medium flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors disabled:opacity-60"
        >
          <span className="material-symbols-outlined" data-weight="fill">
            picture_as_pdf
          </span>
          Print / Save as PDF
        </button>
      </div>

      {/* Right: preview */}
      <div className="lg:col-span-9">
        <section className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-sm overflow-hidden flex flex-col">
          <div className="px-container-margin py-stack-md border-b border-outline-variant bg-surface flex items-center justify-between print:hidden">
            <div className="flex items-center gap-stack-md">
              <span className="material-symbols-outlined text-primary-container text-[24px]">visibility</span>
              <h3 className="text-headline-md font-headline-md font-semibold text-on-surface">Report Preview</h3>
            </div>
            {report && (
              <span
                className={`text-label-md font-label-md px-2 py-1 rounded-DEFAULT uppercase tracking-wider ${
                  report.generationMode === "ai"
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-surface-variant text-on-surface-variant"
                }`}
              >
                {report.generationMode === "ai" ? "AI-generated" : "Template (deterministic)"}
              </span>
            )}
          </div>

          <div className="p-container-margin flex flex-col gap-stack-lg bg-white flex-1">
            {loadingPanel || !facts ? (
              <p className="text-body-lg text-on-surface-variant text-center py-stack-lg">Loading grant data…</p>
            ) : (
              <>
                <div className="text-center border-b-2 border-outline-variant pb-stack-md mb-stack-sm">
                  <h1 className="text-display font-display font-bold text-on-surface mb-base">
                    Program Achievement Summary
                  </h1>
                  <p className="text-body-lg font-body-lg text-on-surface-variant">
                    {facts.grantName} • {facts.donor} • {facts.reportingMonth}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-md">
                  <FactCard label="PBL Completion" value={pct(facts.pblCompletionRate)} sub={`${facts.schoolsCompletedPbl} / ${facts.sampledSchoolRecords} schools`} />
                  <FactCard label="Evidence Submission" value={pct(facts.evidenceSubmissionRate)} sub={`${facts.schoolsWithEvidence} schools`} />
                  <FactCard label="Attendance" value={pct(facts.attendanceRate)} sub={`${facts.totalAttendance.toLocaleString()} / ${facts.totalEnrollment.toLocaleString()}`} />
                  <FactCard label="Fund Utilization" value={pct(facts.overallUtilizationRate)} sub={`${facts.financeLines.length} budget lines`} />
                  <FactCard label="Risk Status" value={facts.riskStatus} sub={facts.reportStatus} />
                  <FactCard label="Districts Covered" value={String(facts.coveredDistricts.length)} sub={facts.coveredDistricts.join(", ")} />
                </div>

                <div>
                  <h4 className="text-headline-md font-headline-md font-semibold text-on-surface mb-stack-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-outline">account_balance_wallet</span>
                    Budget Line Breakdown
                  </h4>
                  <div className="border border-outline-variant rounded-DEFAULT overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-surface-container-low">
                        <tr>
                          <th className="p-stack-sm pl-stack-md text-label-md font-label-md text-outline uppercase border-b border-outline-variant">
                            Budget Line
                          </th>
                          <th className="p-stack-sm text-label-md font-label-md text-outline uppercase border-b border-outline-variant text-right">
                            Approved
                          </th>
                          <th className="p-stack-sm text-label-md font-label-md text-outline uppercase border-b border-outline-variant text-right">
                            Utilized
                          </th>
                          <th className="p-stack-sm pr-stack-md text-label-md font-label-md text-outline uppercase border-b border-outline-variant w-40">
                            Utilization
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {facts.financeLines.map((line) => (
                          <tr key={line.budgetLine} className="border-b border-outline-variant last:border-b-0">
                            <td className="p-stack-sm pl-stack-md text-body-md font-body-md font-medium text-on-surface">
                              {line.budgetLine}
                            </td>
                            <td className="p-stack-sm text-data-mono font-data-mono text-on-surface text-right">
                              {line.approvedBudgetUnits.toLocaleString()}
                            </td>
                            <td className="p-stack-sm text-data-mono font-data-mono text-on-surface text-right">
                              {line.cumulativeUtilizedUnits.toLocaleString()}
                            </td>
                            <td className="p-stack-sm pr-stack-md">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary-container rounded-full"
                                    style={{ width: `${Math.min(line.cumulativeUtilizationRate, 100)}%` }}
                                  />
                                </div>
                                <span className="text-data-mono font-data-mono text-on-surface w-12 text-right shrink-0">
                                  {pct(line.cumulativeUtilizationRate)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-headline-md font-headline-md font-semibold text-on-surface mb-stack-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-outline">flag</span>
                    Milestones
                  </h4>
                  <p className="text-body-lg font-body-lg text-on-surface-variant">{facts.milestoneSummary}</p>
                </div>

                <div>
                  <h4 className="text-headline-md font-headline-md font-semibold text-on-surface mb-stack-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-outline">subject</span>
                    Generated Summary
                  </h4>
                  {report ? (
                    <>
                      <div className="prose prose-sm max-w-none text-body-lg font-body-lg text-on-surface leading-relaxed border-l-4 border-secondary-fixed pl-stack-md bg-surface p-stack-sm">
                        <p>{report.narrative}</p>
                      </div>
                      <details className="mt-stack-sm text-body-md font-body-md text-on-surface-variant">
                        <summary className="cursor-pointer text-label-md font-label-md text-outline uppercase tracking-wider">
                          Source facts used
                        </summary>
                        <ul className="list-disc list-inside mt-1">
                          {Object.entries(report.sourceFacts).map(([k, v]) => (
                            <li key={k}>
                              {k}: {String(v)}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </>
                  ) : (
                    <p className="text-body-md font-body-md text-on-surface-variant italic">
                      Click &ldquo;Generate Report Section&rdquo; to produce a report-ready narrative from the facts above.
                    </p>
                  )}
                </div>

                <div className="border-t border-outline-variant pt-stack-md">
                  <h4 className="text-headline-md font-headline-md font-semibold text-on-surface mb-stack-md flex items-center gap-2">
                    <span className="material-symbols-outlined text-outline">photo_library</span>
                    Project Evidence Gallery
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
                    {panel!.evidence.map((e) => (
                      <div key={e.recordId} className="border border-outline-variant rounded-DEFAULT overflow-hidden">
                        <div className="h-40 bg-surface-variant relative">
                          <Image src={e.imageUrl} alt={e.title} fill className="object-cover" unoptimized />
                        </div>
                        <div className="p-stack-sm bg-surface-container-lowest">
                          <p className="text-body-md font-body-md font-medium text-on-surface">{e.title}</p>
                          <p className="text-label-md font-label-md text-on-surface-variant mt-1">{e.summaryOrCaption}</p>
                          <p className="text-label-md font-label-md text-outline mt-1 italic">{e.usageNote}</p>
                        </div>
                      </div>
                    ))}
                    {panel!.evidence.length === 0 && (
                      <p className="text-body-md font-body-md text-on-surface-variant">
                        No evidence records for this grant/month.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function FactCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border border-outline-variant rounded-DEFAULT p-stack-md flex flex-col items-start bg-surface">
      <span className="text-label-md font-label-md text-on-surface-variant uppercase mb-base">{label}</span>
      <span className="text-headline-lg font-headline-lg font-bold text-on-surface">{value}</span>
      <span className="text-label-md font-label-md text-on-surface-variant mt-1">{sub}</span>
    </div>
  );
}
