import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { parse } from "csv-parse/sync";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const ROOT = path.resolve(__dirname, "..");

const PBL_DIR = path.join(ROOT, "02_Primary_PBL_Data", "csv_exports");
const GRANT_DIR = path.join(ROOT, "03_Grant_Reporting_Evidence", "csv");
const IMAGES_DIR = path.join(ROOT, "03_Grant_Reporting_Evidence", "images");
const PUBLIC_EVIDENCE_DIR = path.join(ROOT, "public", "evidence");

const PBL_FILES = [
  "PBL_School_Response_Data_July_2025.csv",
  "PBL_School_Response_Data_August_2025.csv",
  "PBL_School_Response_Data_September_2025.csv",
];

function toInt(v: string): number {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}
function toFloat(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}
function toBool(v: string): boolean {
  return v.trim().toLowerCase() === "yes";
}
function readRawRows(filePath: string): string[][] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const rows: string[][] = parse(raw, { skip_empty_lines: true });
  return rows.slice(1); // drop header row
}

async function seedSchoolResponses() {
  const schoolResponses: Prisma.SchoolResponseCreateManyInput[] = [];
  const classSubjectMetrics: Prisma.ClassSubjectMetricCreateManyInput[] = [];

  for (const file of PBL_FILES) {
    const rows = readRawRows(path.join(PBL_DIR, file));

    for (const r of rows) {
      const [
        reportingMonth,
        timestamp,
        schoolName,
        schoolCode,
        district,
        block,
        pblConducted,
        evidenceSubmitted,
        classesRaw,
        subjectsRaw,
        c6enroll,
        c6sci,
        c6math,
        c7enroll,
        c7sci,
        c7math,
        c8enroll,
        c8sci,
        c8math,
        derivedTotalEnrollment,
        derivedTotalAttendance,
        derivedAttendanceRate,
        riskStatusSource,
      ] = r;

      const id = crypto.randomUUID();
      const class6Enrollment = toInt(c6enroll);
      const class6Science = toInt(c6sci);
      const class6Math = toInt(c6math);
      const class7Enrollment = toInt(c7enroll);
      const class7Science = toInt(c7sci);
      const class7Math = toInt(c7math);
      const class8Enrollment = toInt(c8enroll);
      const class8Science = toInt(c8sci);
      const class8Math = toInt(c8math);

      schoolResponses.push({
        id,
        reportingMonth,
        timestamp: new Date(timestamp),
        schoolName,
        schoolCode,
        district,
        block,
        pblConducted: toBool(pblConducted),
        evidenceSubmitted: toBool(evidenceSubmitted),
        classesRaw,
        subjectsRaw,
        class6Enrollment,
        class6Science,
        class6Math,
        class7Enrollment,
        class7Science,
        class7Math,
        class8Enrollment,
        class8Science,
        class8Math,
        totalEnrollment: toInt(derivedTotalEnrollment),
        totalAttendance: toInt(derivedTotalAttendance),
        attendanceRate: toFloat(derivedAttendanceRate),
        riskStatusSource,
      });

      // Derive one row per (grade, subject) that was actually taught this month.
      // The survey instructs respondents to enter 0 attendance for a subject
      // not taught in that grade, so attendance <= 0 is treated as "not taught".
      const combos: Array<{ grade: number; subject: string; enrollment: number; attendance: number }> = [
        { grade: 6, subject: "Science", enrollment: class6Enrollment, attendance: class6Science },
        { grade: 6, subject: "Math", enrollment: class6Enrollment, attendance: class6Math },
        { grade: 7, subject: "Science", enrollment: class7Enrollment, attendance: class7Science },
        { grade: 7, subject: "Math", enrollment: class7Enrollment, attendance: class7Math },
        { grade: 8, subject: "Science", enrollment: class8Enrollment, attendance: class8Science },
        { grade: 8, subject: "Math", enrollment: class8Enrollment, attendance: class8Math },
      ];

      for (const combo of combos) {
        if (combo.attendance <= 0) continue;
        classSubjectMetrics.push({
          id: crypto.randomUUID(),
          schoolResponseId: id,
          reportingMonth,
          district,
          block,
          grade: combo.grade,
          subject: combo.subject,
          enrollment: combo.enrollment,
          attendance: combo.attendance,
          attendanceRate: combo.enrollment > 0 ? combo.attendance / combo.enrollment : 0,
        });
      }
    }
  }

  await prisma.classSubjectMetric.deleteMany({});
  await prisma.schoolResponse.deleteMany({});
  await prisma.schoolResponse.createMany({ data: schoolResponses });
  await prisma.classSubjectMetric.createMany({ data: classSubjectMetrics });

  console.log(
    `Seeded ${schoolResponses.length} school responses and ${classSubjectMetrics.length} class/subject metrics`,
  );
}

async function seedGrantFinance() {
  const rows: Record<string, string>[] = parse(
    fs.readFileSync(path.join(GRANT_DIR, "01_Grant_Profile_and_Finance.csv"), "utf-8"),
    { columns: true, skip_empty_lines: true },
  );

  const data: Prisma.GrantFinanceLineCreateManyInput[] = rows.map((row) => ({
    id: crypto.randomUUID(),
    grantId: row.grant_id,
    donor: row.donor,
    grantName: row.grant_name,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    coveredDistricts: row.covered_districts,
    reportingMonth: row.reporting_month,
    budgetLine: row.budget_line,
    approvedBudgetUnits: toInt(row.approved_budget_units),
    monthlyUtilizedUnits: toInt(row.monthly_utilized_units),
    cumulativeUtilizedUnits: toInt(row.cumulative_utilized_units),
    cumulativeUtilizationRate: toFloat(row.cumulative_utilization_rate),
    financeNote: row.finance_note,
  }));

  await prisma.grantFinanceLine.deleteMany({});
  await prisma.grantFinanceLine.createMany({ data });
  console.log(`Seeded ${data.length} grant finance lines`);
}

async function seedGrantPerformance() {
  const rows: Record<string, string>[] = parse(
    fs.readFileSync(path.join(GRANT_DIR, "02_Grant_Performance_and_Report_Material.csv"), "utf-8"),
    { columns: true, skip_empty_lines: true },
  );

  const data: Prisma.GrantPerformanceCreateManyInput[] = rows.map((row) => ({
    id: crypto.randomUUID(),
    grantId: row.grant_id,
    donor: row.donor,
    grantName: row.grant_name,
    reportingMonth: row.reporting_month,
    periodEndDate: row.period_end_date,
    reportDueDate: row.report_due_date,
    reportStatus: row.report_status,
    coveredDistricts: row.covered_districts,
    sampledSchoolRecords: toInt(row.sampled_school_records),
    schoolsCompletedPbl: toInt(row.schools_completed_pbl),
    pblCompletionRate: toFloat(row.pbl_completion_rate),
    schoolsWithEvidence: toInt(row.schools_with_evidence),
    evidenceSubmissionRate: toFloat(row.evidence_submission_rate),
    totalEnrollment: toInt(row.total_enrollment),
    totalAttendance: toInt(row.total_attendance),
    attendanceRate: toFloat(row.attendance_rate),
    riskStatus: row.risk_status,
    milestoneSummary: row.milestone_summary,
    draftReportText: row.draft_report_text,
  }));

  await prisma.grantPerformance.deleteMany({});
  await prisma.grantPerformance.createMany({ data });
  console.log(`Seeded ${data.length} grant performance rows`);
}

async function seedEvidenceMedia() {
  const rows: Record<string, string>[] = parse(
    fs.readFileSync(path.join(GRANT_DIR, "03_Evidence_and_Media_Index.csv"), "utf-8"),
    { columns: true, skip_empty_lines: true },
  );

  const data: Prisma.EvidenceMediaCreateManyInput[] = rows.map((row) => ({
    id: crypto.randomUUID(),
    recordId: row.record_id,
    recordType: row.record_type,
    grantId: row.grant_id,
    donor: row.donor,
    reportingMonth: row.reporting_month,
    district: row.district,
    title: row.title,
    summaryOrCaption: row.summary_or_caption,
    fileName: row.file_name,
    relativePath: row.relative_path,
    usageNote: row.usage_note,
  }));

  await prisma.evidenceMedia.deleteMany({});
  await prisma.evidenceMedia.createMany({ data });
  console.log(`Seeded ${data.length} evidence/media records`);

  fs.mkdirSync(PUBLIC_EVIDENCE_DIR, { recursive: true });
  for (const file of fs.readdirSync(IMAGES_DIR)) {
    fs.copyFileSync(path.join(IMAGES_DIR, file), path.join(PUBLIC_EVIDENCE_DIR, file));
  }
  console.log(`Copied evidence images into public/evidence/`);
}

async function main() {
  await seedSchoolResponses();
  await seedGrantFinance();
  await seedGrantPerformance();
  await seedEvidenceMedia();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
