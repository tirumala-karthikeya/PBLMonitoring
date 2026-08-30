import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import RiskBadge from "@/components/RiskBadge";
import { getSchoolDetail } from "@/lib/queries";

export default async function SchoolDetailPage({ params }: { params: { schoolCode: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const detail = await getSchoolDetail(params.schoolCode);
  if (!detail) notFound();

  const { school, history, districtEvidence } = detail;
  const latest = history[history.length - 1];
  const maxAttendanceRate = Math.max(...history.map((h) => h.attendanceRate), 1);

  return (
    <AppShell
      pageTitle="School Profile"
      user={{ fullName: session.user.name ?? "User", email: session.user.email ?? "" }}
    >
      <div className="space-y-stack-lg pb-stack-lg">
        <div className="flex items-center gap-2 text-outline font-label-md text-label-md uppercase tracking-wider">
          <Link href="/schools" className="hover:text-primary transition-colors">
            Schools
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">{school.schoolName}</span>
        </div>

        {/* Identity card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg flex flex-wrap items-center justify-between gap-stack-md">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">{school.schoolName}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {school.schoolCode} · {school.district} / {school.block}
            </p>
          </div>
          <div className="flex items-center gap-stack-sm">
            <span className="font-label-md text-label-md text-outline uppercase tracking-wider">
              Latest ({latest.reportingMonth})
            </span>
            <RiskBadge risk={latest.risk} />
          </div>
        </div>

        {/* 3-month history */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-md">
            3-Month Reporting History
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-stack-md mb-stack-lg">
            {history.map((h) => (
              <div key={h.reportingMonth} className="border border-outline-variant rounded-DEFAULT p-stack-md flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-outline uppercase tracking-wider">
                    {h.reportingMonth}
                  </span>
                  <RiskBadge risk={h.risk} />
                </div>
                <p className="font-headline-lg text-headline-lg font-bold text-on-surface">
                  {h.attendanceRate.toFixed(1)}%
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {h.totalAttendance.toLocaleString()} / {h.totalEnrollment.toLocaleString()} attendance
                </p>
                <div className="flex gap-2 mt-1">
                  <span
                    className={`text-label-md font-label-md px-2 py-0.5 rounded-DEFAULT ${h.pblConducted ? "bg-primary-fixed text-primary-container" : "bg-surface-variant text-on-surface-variant"}`}
                  >
                    {h.pblConducted ? "PBL conducted" : "Not conducted"}
                  </span>
                  <span
                    className={`text-label-md font-label-md px-2 py-0.5 rounded-DEFAULT ${h.evidenceSubmitted ? "bg-primary-fixed text-primary-container" : "bg-surface-variant text-on-surface-variant"}`}
                  >
                    {h.evidenceSubmitted ? "Evidence submitted" : "No evidence"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Simple attendance trend */}
          <div>
            <h3 className="font-label-md text-label-md text-outline uppercase tracking-wider mb-2">
              Attendance rate trend
            </h3>
            <div className="flex items-end gap-stack-md h-32">
              {history.map((h) => (
                <div key={h.reportingMonth} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center h-24 bg-surface-container-low rounded-DEFAULT overflow-hidden">
                    <div
                      className="w-full bg-primary-container transition-all"
                      style={{ height: `${(h.attendanceRate / maxAttendanceRate) * 100}%` }}
                      title={`${h.attendanceRate.toFixed(1)}%`}
                    />
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant">{h.reportingMonth}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* District-level evidence (not school-specific) */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-outline">photo_library</span>
            Evidence for {school.district} district
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md italic">
            The source evidence data links each record to a grant and district, not an individual school. These
            images are not specific to {school.schoolName}.
          </p>
          {districtEvidence.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">
              No evidence records for {school.district}.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-stack-md">
              {districtEvidence.map((e) => (
                <div key={e.recordId} className="border border-outline-variant rounded-DEFAULT overflow-hidden">
                  <div className="h-32 bg-surface-variant relative">
                    <Image src={e.imageUrl} alt={e.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="p-stack-sm bg-surface-container-lowest">
                    <p className="text-body-md font-body-md font-medium text-on-surface">{e.title}</p>
                    <p className="text-label-md font-label-md text-on-surface-variant mt-1">{e.reportingMonth}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
