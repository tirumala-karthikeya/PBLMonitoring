"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

const ROLES = [
  { value: "regional_director", label: "Regional Director" },
  { value: "school_admin", label: "School Admin" },
  { value: "donor", label: "Donor" },
];

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, role, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (signInResult?.error) {
        router.push("/signin");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-surface min-h-screen font-body-md text-on-surface antialiased flex flex-col md:flex-row">
      {/* Left Pane: Branding & Visuals */}
      <div className="hidden md:flex md:w-1/2 lg:w-[45%] bg-surface-container-lowest relative overflow-hidden flex-col justify-between border-r border-outline-variant">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-80"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCUVnxcg-Ylo-yB7f-ciJAnY_aGOWYUZQIgwQzjntkv-OO8Bdyc7lyoN5yRsCKZbMfgRfX0ALgjZ7lw2E6jKAFvNB_wPqcj-gpP84chLf7vgTqrSJS4XxDY7izxgf2qKdrq5RGNWMmPBOuf2fq47ozlQ5A50OCO0wu8AdkTOZ5o49yRY60o3OQHzcsG18VJ2xome4j37J3eJFrxtUZlhJywW-oAOETWPH4MXtd6jruREHYsg51frO61Nw')",
          }}
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-surface-container-lowest/80 via-surface-container-lowest/20 to-surface-container-lowest/90" />
        <div className="relative z-20 p-container-margin">
          <div className="flex items-center gap-stack-sm mb-stack-md">
            <span className="material-symbols-outlined text-primary-container" data-weight="fill" style={{ fontSize: 32 }}>
              monitoring
            </span>
            <span className="font-headline-lg text-headline-lg text-primary-container">Mantra4Change</span>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-sm">
            Empowering administrators and policymakers with precise, high-density data analytics for educational monitoring.
          </p>
        </div>
        <div className="relative z-20 p-container-margin">
          <div className="inline-flex items-center gap-stack-sm bg-surface-container-low border border-outline-variant px-stack-md py-stack-sm rounded-full">
            <span className="material-symbols-outlined text-primary-container text-sm">verified_user</span>
            <span className="font-label-md text-label-md text-on-surface">Secure Enterprise Platform</span>
          </div>
        </div>
      </div>

      {/* Right Pane: Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-gutter md:p-container-margin bg-surface">
        <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl p-container-margin relative">
          <div className="md:hidden flex items-center justify-center gap-stack-sm mb-stack-lg">
            <span className="material-symbols-outlined text-primary-container" data-weight="fill" style={{ fontSize: 28 }}>
              monitoring
            </span>
            <span className="font-headline-md text-headline-md text-primary-container">Mantra4Change</span>
          </div>

          <div className="mb-stack-lg text-center md:text-left">
            <h1 className="font-display text-display text-on-surface mb-stack-sm">Create Account</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Register to access the PBL Tracker dashboard.</p>
          </div>

          <form className="flex flex-col gap-stack-lg" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-DEFAULT border border-error-container bg-error-container/40 px-stack-md py-stack-sm text-body-md font-body-md text-error">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-base">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="fullName">
                Full Name
              </label>
              <input
                className="w-full font-body-md text-body-md text-on-surface bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-stack-md py-[10px] focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 transition-colors placeholder:text-outline-variant"
                id="fullName"
                name="fullName"
                placeholder="Jane Doe"
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-base">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="email">
                Organization Email
              </label>
              <input
                className="w-full font-body-md text-body-md text-on-surface bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-stack-md py-[10px] focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 transition-colors placeholder:text-outline-variant"
                id="email"
                name="email"
                placeholder="jane.doe@organization.edu"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-base">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="role">
                System Role
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none font-body-md text-body-md text-on-surface bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-stack-md py-[10px] focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 transition-colors cursor-pointer pr-10"
                  id="role"
                  name="role"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option className="text-outline-variant" disabled value="">
                    Select your role
                  </option>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-stack-md text-outline">
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-base">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="password">
                Password
              </label>
              <input
                className="w-full font-body-md text-body-md text-on-surface bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-stack-md py-[10px] focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 transition-colors placeholder:text-outline-variant"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                type="password"
                minLength={12}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="font-label-md text-label-md text-outline mt-1 font-normal opacity-80">
                Must be at least 12 characters long.
              </p>
            </div>

            <div className="mt-stack-sm flex flex-col gap-stack-md">
              <button
                className="w-full flex items-center justify-center gap-stack-sm bg-primary-container text-on-primary font-headline-md text-headline-md rounded-DEFAULT py-stack-md transition-colors hover:bg-primary disabled:opacity-60"
                type="submit"
                disabled={submitting}
              >
                <span>{submitting ? "Creating account…" : "Register Account"}</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
              <div className="text-center">
                <span className="font-body-md text-body-md text-on-surface-variant">Already have an account?</span>
                <Link
                  className="font-headline-md text-headline-md text-primary-container hover:text-primary transition-colors ml-1"
                  href="/signin"
                >
                  Log in
                </Link>
              </div>
            </div>
          </form>

          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-container/20 to-transparent" />
        </div>
      </div>
    </div>
  );
}
