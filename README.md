# PBL Program Intelligence & Grant Reporting Assistant

A working prototype for Mantra4Change's Lead Full-Stack Product Developer assessment: a program-review dashboard and a grant reporting assistant, built on three months of synthetic PBL (Project-Based Learning) school survey data.

All data in this repository is synthetic and for assessment use only (see `00_START_HERE.pdf`).

## Setup

```bash
npm install                 # also runs `prisma generate` via postinstall
cp .env.example .env        # DATABASE_URL is pre-set; AUTH_SECRET is required
npm run db:migrate           # creates prisma/dev.db and applies the schema
npm run db:seed              # parses the CSVs and images into the database
npm run dev                  # http://localhost:3000 (or next free port)
```

Then open the app, click **Create one** on the sign-in page, and register an account (any of the three roles). There is no seeded user — the app has no real users until you sign up.

To enable real AI narrative generation, set `ANTHROPIC_API_KEY` in `.env` and restart the dev server. Leaving it blank is fully supported — every AI-generated surface (grant report narrative, monthly review summary) falls back to a deterministic template automatically, and the UI labels which mode produced the text.

## Architecture

- **Framework**: Next.js 14 (App Router), TypeScript, Tailwind CSS.
- **Database**: SQLite via Prisma ORM (`prisma/schema.prisma`, `prisma/dev.db`). Chosen for zero-setup local development; see Production Readiness below for the migration path.
- **Auth**: Auth.js (NextAuth v5) with a Credentials provider, bcrypt-hashed passwords, and JWT sessions. Middleware (`middleware.ts`) gates `/dashboard`, `/reports`, `/schools`, `/settings`; each API route also calls `requireSession()` independently, since the middleware matcher only covers page routes, not `/api/*`.
- **AI**: `@anthropic-ai/sdk`, called only with a small structured "facts" object — never raw CSV rows or database rows. See AI Workflow below.
- **UI design system**: ported directly from Figma-exported mockups the candidate was given mid-assignment (Sign Up, Sign In, Dashboard, Grant Reporting, Settings) — a Material-3-style Tailwind token set (`tailwind.config.ts`): color roles, a fixed type scale, and consistent spacing/radius tokens, shared across every page via `components/AppShell.tsx`.

## Data Model

Two ingestion paths, both driven by `scripts/seed.ts`, which reads the CSVs directly from `02_Primary_PBL_Data/` and `03_Grant_Reporting_Evidence/` (no manual copy step) and copies the evidence images into `public/evidence/`.

**Primary PBL data** (`SchoolResponse`, `ClassSubjectMetric`):
- `SchoolResponse` mirrors each monthly CSV row as-is: one row per school per month, with the wide per-class(6/7/8)/per-subject(Science/Math) enrollment and attendance columns, plus the CSV's own derived totals and risk label (kept only for reference/QA — the app computes its own risk independently).
- `ClassSubjectMetric` is a normalized fact table derived at seed time: one row per (school, month, grade, subject) that was actually taught. This is what makes the grade/subject filters cheap and correct — see Assumptions below for why "attendance = 0" is treated as "not taught."

**Grant reporting evidence** (`GrantFinanceLine`, `GrantPerformance`, `EvidenceMedia`): near-direct mirrors of the three grant CSVs, plus `User` for auth.

## Risk & Metrics Engine (deterministic — no AI)

`lib/risk.ts` and `lib/metrics.ts` are pure functions with no database or AI dependency, so they're independently testable:

- `classifyRate()` applies the brief's fixed thresholds: On Track ≥75%, Behind 60–<75%, At Risk 35–<60%, Critical <35%.
- `computeAggregateMetrics()` computes participation %, evidence-submission %, enrollment, attendance, and attendance % for any filtered slice.
- `computeMonthOverMonth()` computes point deltas for participation, evidence, and attendance rate.
- `rankGeographies()` groups filtered rows by district or block and classifies each.
- `buildReviewSummaryFacts()` assembles achievements/risks/priorities/discussion points as structured data — this is what both the on-screen Monthly Review Summary and its optional AI narrative are built from.

**Verified against the source data**: for July 2025, School AAKD has enrollment 94 / attendance 133 → the CSV's own derived rate is 0.7074 ("Behind"). `computeAttendanceAggregate()` on that school's `ClassSubjectMetric` rows independently reproduces 70.74% and classifies it "Behind" — confirming the engine's formula matches the source data's own methodology without having been told what it was.

## Key Assumptions (the data was intentionally ambiguous in places)

1. **Attendance rate denominator.** The source CSV's derived attendance rate for a school equals `totalAttendance / (totalEnrollment × 2)` — i.e., it always divides by two subject-sessions per grade, even though not every school taught both subjects. Rather than guess a per-school multiplier from `subjectsRaw`, the engine sums attendance and enrollment **per (school, grade, subject) row** in `ClassSubjectMetric`. This reproduces the source's own numbers exactly when both subjects are present, and generalizes correctly to any grade/subject filter without special-casing.
2. **"0 attendance" means "not taught."** The survey's own column headers say to enter 0 if a subject wasn't taught in a given grade. The seed script treats `attendance <= 0` as "this grade/subject combination wasn't taught this month" and does not create a `ClassSubjectMetric` row for it — so a school that only teaches Math never contributes a phantom Science row.
3. **Enrollment headcount vs. rate denominator are different numbers.** A grade's enrollment is the same figure whether one or two subjects were taught there. The "Total Enrollment" KPI dedupes by (school, grade); the attendance-rate *denominator* intentionally does not (see #1). Conflating these two would either double-count enrollment or silently change the rate formula from the source data's own convention.
4. **Participation and evidence-submission rates ignore grade/subject filters.** Both are recorded once per school per month (a single yes/no on the survey) — there's no grade/subject-level participation data to filter. Selecting "Grade 7 / Math" changes the enrollment/attendance/attendance-rate KPIs but not participation or evidence %, which stay computed from all schools in the selected month/district/block.
5. **Auth is demo-grade, not production security.** Real accounts, hashed passwords (bcrypt), and JWT sessions — but no email verification, password reset, or rate limiting. This was added because the candidate was given Figma mockups for Sign Up/Sign In mid-assignment and asked to implement them functionally; it is not a requirement of the core assignment brief.
6. **`/schools` is a convenience view, not a Tier requirement.** It exists because every provided mockup has a persistent "Schools" nav item; it's a straightforward school-level table reusing data already modeled for Tier 1.

## AI Workflow

Preferred flow per the brief: **deterministic calculations → structured facts → generated narrative.** Concretely:

1. An API route (`/api/summary`, `/api/grants/[grantId]/report`) computes all facts using only `lib/risk.ts` / `lib/metrics.ts` / Prisma queries — never touching AI.
2. Those facts (a small typed object — grant financials + performance + milestones + evidence titles, or program review metrics + MoM + priority geographies) are handed to `lib/ai/narrative.ts`.
3. If `ANTHROPIC_API_KEY` is set, it calls Claude (`claude-opus-5`) with a system prompt that explicitly forbids inventing numbers, locations, or evidence not present in the supplied facts, and asks for 3–5 sentences of plain prose.
4. On **any** failure — no key, network error, rate limit, refusal — it falls back to `lib/ai/templates.ts`, a plain string-interpolation generator modeled on the `draft_report_text` style already present in the grant CSVs.
5. Every response carries `generationMode: "ai" | "template"` and the exact `sourceFacts` used, both shown in the UI, so the fact/narrative distinction and the "why does this number appear" traceability the brief asks for are visible, not just implemented.
6. Narrative generation is **on-demand only** (an explicit "Generate Narrative" / "Generate Report Section" button) — it is never triggered automatically on page load or filter change, to avoid firing real API calls (and cost) every time a user adjusts a dropdown.

To verify the guardrail live: leave `ANTHROPIC_API_KEY` unset (the default in `.env.example`) and generate a narrative anywhere in the app — it will produce correct, complete output via the template path, with the UI badge reading "Template (deterministic)".

## What's Implemented

- **Tier 1 (all 5 items)**: month/district/block/grade/subject filters that drive every dashboard number; the full KPI set (schools, participation, evidence, enrollment, attendance, attendance rate) with month-over-month deltas on 3 metrics; a sortable district/block performance table with risk badges; the deterministic risk engine; the full Grant Reporting Assistant (grant/month selection, fact panel, evidence gallery, generated report section).
- **Tier 2**: Monthly Review Summary — achievements, MoM changes, priority geographies, and discussion points, generated from the same deterministic engine, with an optional AI narrative layered on top.
- **Not implemented (Tier 3 / stretch)**: the recommended-actions tracker (owner/priority/due-date/status records) was scoped out given the timeline — see Future Improvements.

## Limitations & Production Readiness

- **Database**: SQLite is file-based and single-writer — fine for a local demo, not for concurrent production traffic. Prisma's schema/queries are already provider-agnostic; moving to Postgres (Supabase or otherwise) is a `datasource` provider swap plus a fresh migration, no application code changes.
- **Auth**: see Assumption #5 above — add email verification, password reset, and rate-limiting on `/api/auth/*` before any real deployment.
- **No caching layer**: every dashboard filter change re-queries and re-aggregates in Node from scratch. At this data volume (6,900 school-month rows) it's fast enough not to matter; at real scale, pre-aggregated rollup tables (by district/block/month) would replace the current in-memory `reduce` in `lib/metrics.ts`.
- **AI cost/latency**: narrative generation is user-triggered, not cached — repeated clicks re-call the API. A production version would cache a narrative per (grant, month) or (scope, month) until the underlying facts change.
- **No automated tests**: the risk/metrics engine is pure functions specifically so it *can* be unit tested; that suite doesn't exist yet (see Future Improvements).
- **Known build warning**: `next build` logs an Edge Runtime compatibility warning from a transitive dependency of `next-auth` (`jose`'s `CompressionStream` usage). It does not affect functionality — the JWE code path it warns about isn't used by this app's plain signed-JWT session strategy — but it's worth knowing about if `next-auth`/`jose` are upgraded.
- **Dependency advisories**: `npm audit` flags known Next.js 14.2.x advisories with no in-range fix (next 14.2.35 is the latest 14.x patch as of this build); the fix requires a Next 15/16 major upgrade, out of scope for this timeline. Acceptable for a local, non-public-facing demo; flag before any real deployment.

## Future Improvements

- Tier 3 recommended-actions tracker (owner/priority/due-date/status, linked to a specific metric or geography).
- Unit tests for `lib/risk.ts` / `lib/metrics.ts` (the verification section below is currently manual).
- Cache generated narratives per (scope, month) instead of regenerating on every click.
- Role-based authorization (the `donor` role currently sees the same screens as `regional_director`/`school_admin`; a real deployment would likely scope donors to `/reports` only).
- PDF/DOCX export beyond the current print-to-PDF button on the Grant Reporting Assistant.

## Manual Verification

```bash
npm run db:seed          # prints row counts — cross-check against the source CSVs
npx tsc --noEmit          # typecheck
npm run build             # production build + lint
npm run dev                # then: sign up, walk the dashboard filters, generate both
                            # narrative surfaces, then unset ANTHROPIC_API_KEY and
                            # regenerate to confirm the template fallback still works
```
