import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";

const FAQS = [
  {
    q: "How is risk status calculated?",
    a: "Every risk badge (On Track / Behind / At Risk / Critical) comes from a fixed, code-based threshold applied to an attendance rate: On Track ≥ 75%, Behind 60–74%, At Risk 35–59%, Critical below 35%. No AI is involved in this classification; see lib/risk.ts.",
  },
  {
    q: "Why doesn't the Grade/Subject filter change Participation or Evidence Submission?",
    a: "Those two figures are recorded once per school per month on the survey (a single yes/no), so there's no grade- or subject-level breakdown to filter in the source data. Selecting a grade or subject changes enrollment, attendance, and attendance rate, which are tracked at that level.",
  },
  {
    q: 'What does the "Template (deterministic)" badge mean on a generated narrative?',
    a: "It means the paragraph was assembled by plain code from the facts shown above it, not written by AI. This is the fallback path used whenever ANTHROPIC_API_KEY is unset or an AI call fails, so the app keeps working even with AI fully disabled.",
  },
  {
    q: "Why is the evidence gallery on the Grant Reporting page showing images tied to a district, not a specific school?",
    a: "The source evidence/media data links each image to a grant, district, and reporting month. There is no per-school field in that dataset, so evidence can't be attributed to an individual school.",
  },
];

export default async function HelpPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <AppShell
      pageTitle="Help & Support"
      user={{
        fullName: session.user.name ?? "User",
        email: session.user.email ?? "",
      }}
    >
      <div className="space-y-stack-lg pb-stack-lg max-w-3xl mx-auto">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-container-margin">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-stack-sm">
            How this dashboard works
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            This is a synthetic-data assessment build for Mantra4Change. The FAQs below cover the parts of the
            data model and AI workflow that come up most often when reviewing the numbers.
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          {FAQS.map((item, i) => (
            <div
              key={item.q}
              className={`p-stack-lg ${i > 0 ? "border-t border-outline-variant" : ""}`}
            >
              <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-sm flex items-start gap-2">
                <span className="material-symbols-outlined text-primary-container mt-0.5">help</span>
                {item.q}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant pl-8">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-outline">mail</span>
          <p className="font-body-md text-body-md text-on-surface-variant">
            This is an assessment build with no live support desk. For questions about this submission, contact
            the candidate directly.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
