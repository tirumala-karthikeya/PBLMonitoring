"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FilterSelect from "@/components/FilterSelect";
import RiskBadge from "@/components/RiskBadge";
import type { RiskStatus } from "@/lib/risk";

interface School {
  schoolCode: string;
  schoolName: string;
  district: string;
  block: string;
  pblConducted: boolean;
  evidenceSubmitted: boolean;
  totalEnrollment: number;
  attendanceRate: number;
  risk: RiskStatus;
}

export default function SchoolsClient() {
  const router = useRouter();
  const [district, setDistrict] = useState("");
  const [block, setBlock] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (district) params.set("district", district);
    fetch(`/api/filters?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setDistricts(d.districts);
        setBlocks(d.blocks);
      });
  }, [district]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (district) params.set("district", district);
    if (block) params.set("block", block);
    fetch(`/api/schools?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setSchools(d.schools);
        setMonth(d.month);
        setLoading(false);
      });
  }, [district, block]);

  return (
    <div className="space-y-stack-lg pb-stack-lg">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-wrap gap-stack-md items-end">
        <FilterSelect
          label="District"
          value={district}
          onChange={(v) => {
            setDistrict(v);
            setBlock("");
          }}
          options={districts.map((d) => ({ value: d, label: d }))}
        />
        <FilterSelect label="Block" value={block} onChange={setBlock} options={blocks.map((b) => ({ value: b, label: b }))} />
        {month && (
          <p className="text-label-md font-label-md text-on-surface-variant mb-2">
            Showing latest reporting month: <span className="font-semibold text-on-surface">{month}</span>
          </p>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden">
        <div className="overflow-auto max-h-[640px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low sticky top-0 z-10">
              <tr>
                <th className="p-stack-sm pl-stack-md text-label-md font-label-md text-outline uppercase border-b border-outline-variant">School</th>
                <th className="p-stack-sm text-label-md font-label-md text-outline uppercase border-b border-outline-variant">District / Block</th>
                <th className="p-stack-sm text-label-md font-label-md text-outline uppercase border-b border-outline-variant">Enrollment</th>
                <th className="p-stack-sm text-label-md font-label-md text-outline uppercase border-b border-outline-variant">Attendance</th>
                <th className="p-stack-sm text-label-md font-label-md text-outline uppercase border-b border-outline-variant">Evidence</th>
                <th className="p-stack-sm pr-stack-md text-label-md font-label-md text-outline uppercase border-b border-outline-variant text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-stack-md text-center text-on-surface-variant">
                    Loading…
                  </td>
                </tr>
              ) : (
                schools.map((s) => (
                  <tr
                    key={s.schoolCode}
                    onClick={() => router.push(`/schools/${s.schoolCode}`)}
                    className="border-b border-outline-variant hover:bg-surface-container-low cursor-pointer"
                  >
                    <td className="p-stack-sm pl-stack-md text-body-md font-body-md font-medium text-on-surface">
                      {s.schoolName}
                      <span className="block text-label-md font-label-md text-outline">{s.schoolCode}</span>
                    </td>
                    <td className="p-stack-sm text-body-md font-body-md text-on-surface-variant">
                      {s.district} / {s.block}
                    </td>
                    <td className="p-stack-sm text-data-mono font-data-mono text-on-surface">{s.totalEnrollment}</td>
                    <td className="p-stack-sm text-data-mono font-data-mono text-on-surface">{s.attendanceRate.toFixed(1)}%</td>
                    <td className="p-stack-sm text-body-md font-body-md text-on-surface-variant">
                      {s.evidenceSubmitted ? "Submitted" : "Missing"}
                    </td>
                    <td className="p-stack-sm pr-stack-md">
                      <div className="flex items-center justify-end gap-2">
                        <RiskBadge risk={s.risk} />
                        <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
