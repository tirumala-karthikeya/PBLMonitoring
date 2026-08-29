"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Incorrect email or password.");
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
    <div className="min-h-screen flex items-center justify-center font-body-md text-on-background bg-[#F8FAFC]">
      <div className="w-full max-w-[1200px] mx-auto px-gutter grid md:grid-cols-2 gap-container-margin items-center">
        {/* Branding Side */}
        <div className="hidden md:flex flex-col justify-center h-full max-w-md">
          <div className="mb-stack-lg flex items-center gap-stack-sm">
            <span className="material-symbols-outlined text-primary-container text-4xl">school</span>
            <h1 className="font-display text-display text-on-background">Mantra4Change</h1>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface-variant mb-stack-md">PBL Monitoring Platform</h2>
          <p className="font-body-lg text-body-lg text-outline">
            Empowering administrators and policymakers with clear, precise institutional data analysis and monitoring tools.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg md:p-container-margin w-full max-w-md mx-auto">
          <div className="md:hidden flex flex-col items-center mb-stack-lg text-center">
            <span className="material-symbols-outlined text-primary-container text-4xl mb-stack-sm">school</span>
            <h1 className="font-headline-lg text-headline-lg text-on-background">Mantra4Change</h1>
            <p className="font-body-md text-body-md text-outline mt-base">PBL Monitoring</p>
          </div>

          <div className="mb-stack-lg">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-base">Sign In</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Access your dashboard to continue monitoring.</p>
          </div>

          <form className="space-y-stack-md" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded border border-error-container bg-error-container/40 px-3 py-2 text-body-md font-body-md text-error">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-base">
              <label className="font-label-md text-label-md text-on-surface uppercase" htmlFor="email">
                Email Address
              </label>
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-background rounded font-body-md text-body-md py-2 px-3 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 transition-all duration-150"
                id="email"
                name="email"
                placeholder="admin@mantra4change.org"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-base">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface uppercase" htmlFor="password">
                  Password
                </label>
                <span className="font-body-md text-body-md text-outline">Forgot Password?</span>
              </div>
              <div className="relative">
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-background rounded font-body-md text-body-md py-2 px-3 pr-10 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 transition-all duration-150"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface-variant transition-colors"
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            <button
              className="w-full bg-primary-container text-on-primary font-headline-md text-headline-md py-3 px-4 rounded hover:bg-primary transition-colors duration-150 flex items-center justify-center gap-stack-sm mt-stack-lg disabled:opacity-60"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign In"}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </form>

          <div className="mt-stack-lg pt-stack-md border-t border-outline-variant text-center">
            <p className="font-body-md text-body-md text-outline">
              Need an account?{" "}
              <Link className="text-primary hover:underline" href="/signup">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
