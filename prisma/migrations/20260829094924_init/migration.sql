-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SchoolResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportingMonth" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "schoolName" TEXT NOT NULL,
    "schoolCode" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "pblConducted" BOOLEAN NOT NULL,
    "evidenceSubmitted" BOOLEAN NOT NULL,
    "classesRaw" TEXT NOT NULL,
    "subjectsRaw" TEXT NOT NULL,
    "class6Enrollment" INTEGER NOT NULL,
    "class6Science" INTEGER NOT NULL,
    "class6Math" INTEGER NOT NULL,
    "class7Enrollment" INTEGER NOT NULL,
    "class7Science" INTEGER NOT NULL,
    "class7Math" INTEGER NOT NULL,
    "class8Enrollment" INTEGER NOT NULL,
    "class8Science" INTEGER NOT NULL,
    "class8Math" INTEGER NOT NULL,
    "totalEnrollment" INTEGER NOT NULL,
    "totalAttendance" INTEGER NOT NULL,
    "attendanceRate" REAL NOT NULL,
    "riskStatusSource" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ClassSubjectMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolResponseId" TEXT NOT NULL,
    "reportingMonth" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "enrollment" INTEGER NOT NULL,
    "attendance" INTEGER NOT NULL,
    "attendanceRate" REAL NOT NULL,
    CONSTRAINT "ClassSubjectMetric_schoolResponseId_fkey" FOREIGN KEY ("schoolResponseId") REFERENCES "SchoolResponse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrantFinanceLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grantId" TEXT NOT NULL,
    "donor" TEXT NOT NULL,
    "grantName" TEXT NOT NULL,
    "periodStart" TEXT NOT NULL,
    "periodEnd" TEXT NOT NULL,
    "coveredDistricts" TEXT NOT NULL,
    "reportingMonth" TEXT NOT NULL,
    "budgetLine" TEXT NOT NULL,
    "approvedBudgetUnits" INTEGER NOT NULL,
    "monthlyUtilizedUnits" INTEGER NOT NULL,
    "cumulativeUtilizedUnits" INTEGER NOT NULL,
    "cumulativeUtilizationRate" REAL NOT NULL,
    "financeNote" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "GrantPerformance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grantId" TEXT NOT NULL,
    "donor" TEXT NOT NULL,
    "grantName" TEXT NOT NULL,
    "reportingMonth" TEXT NOT NULL,
    "periodEndDate" TEXT NOT NULL,
    "reportDueDate" TEXT NOT NULL,
    "reportStatus" TEXT NOT NULL,
    "coveredDistricts" TEXT NOT NULL,
    "sampledSchoolRecords" INTEGER NOT NULL,
    "schoolsCompletedPbl" INTEGER NOT NULL,
    "pblCompletionRate" REAL NOT NULL,
    "schoolsWithEvidence" INTEGER NOT NULL,
    "evidenceSubmissionRate" REAL NOT NULL,
    "totalEnrollment" INTEGER NOT NULL,
    "totalAttendance" INTEGER NOT NULL,
    "attendanceRate" REAL NOT NULL,
    "riskStatus" TEXT NOT NULL,
    "milestoneSummary" TEXT NOT NULL,
    "draftReportText" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "EvidenceMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recordId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "donor" TEXT NOT NULL,
    "reportingMonth" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summaryOrCaption" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "usageNote" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SchoolResponse_reportingMonth_district_block_idx" ON "SchoolResponse"("reportingMonth", "district", "block");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolResponse_schoolCode_reportingMonth_key" ON "SchoolResponse"("schoolCode", "reportingMonth");

-- CreateIndex
CREATE INDEX "ClassSubjectMetric_reportingMonth_district_block_grade_subject_idx" ON "ClassSubjectMetric"("reportingMonth", "district", "block", "grade", "subject");

-- CreateIndex
CREATE INDEX "GrantFinanceLine_grantId_reportingMonth_idx" ON "GrantFinanceLine"("grantId", "reportingMonth");

-- CreateIndex
CREATE UNIQUE INDEX "GrantPerformance_grantId_reportingMonth_key" ON "GrantPerformance"("grantId", "reportingMonth");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceMedia_recordId_key" ON "EvidenceMedia"("recordId");

-- CreateIndex
CREATE INDEX "EvidenceMedia_grantId_reportingMonth_idx" ON "EvidenceMedia"("grantId", "reportingMonth");
