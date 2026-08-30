"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { NAV_ITEMS } from "@/lib/nav-items";

export type AppShellUser = {
  fullName: string;
  email: string;
};

export default function AppShell({
  pageTitle,
  user,
  children,
}: {
  pageTitle: string;
  user: AppShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="bg-surface text-on-surface min-h-screen flex">
      {/* SideNavBar */}
      <nav className="hidden md:flex w-[260px] h-screen fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant flex-col py-stack-lg z-20">
        <div className="px-gutter mb-stack-lg flex items-center gap-stack-sm">
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">monitoring</span>
          </div>
          <div>
            <h1 className="text-headline-md font-headline-md font-extrabold text-primary leading-tight">
              PBL Monitoring
            </h1>
            <p className="text-label-md font-label-md text-on-surface-variant">Mantra4Change</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-base px-stack-sm mt-stack-md">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={
                  active
                    ? "flex items-center gap-stack-md px-gutter py-stack-sm rounded-DEFAULT text-primary font-bold border-r-2 border-primary bg-surface-container-low transition-colors"
                    : "flex items-center gap-stack-md px-gutter py-stack-sm rounded-DEFAULT text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
                }
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  data-weight={active ? "fill" : undefined}
                >
                  {item.icon}
                </span>
                <span className="text-body-md font-body-md font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="px-gutter mt-auto pt-stack-lg border-t border-outline-variant">
          <div className="flex items-center gap-stack-sm">
            <Link
              href="/settings"
              title="View profile"
              className="flex items-center gap-stack-sm flex-1 min-w-0 rounded-DEFAULT hover:bg-surface-container-low transition-colors p-1 -m-1"
            >
              <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden shrink-0 flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">account_circle</span>
              </div>
              <div className="truncate flex-1">
                <p className="text-body-md font-body-md text-on-surface font-semibold truncate">
                  {user.fullName}
                </p>
                <p className="text-label-md font-label-md text-on-surface-variant truncate">{user.email}</p>
              </div>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              aria-label="Sign out"
              title="Sign out"
              className="p-1.5 rounded-DEFAULT text-on-surface-variant hover:text-error hover:bg-error-container transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-0 md:ml-[260px] min-h-screen">
        {/* TopAppBar */}
        <header className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center h-16 px-container-margin z-10 w-full shrink-0">
          <h2 className="text-headline-md font-headline-md font-bold text-primary">{pageTitle}</h2>
          <div className="flex items-center gap-stack-sm text-on-surface-variant">
            <button
              disabled
              title="No notifications system in this build"
              className="p-2 rounded-full opacity-40 cursor-not-allowed"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <Link
              href="/help"
              title="Help & Support"
              className="p-2 hover:text-primary cursor-pointer active:scale-95 transition-transform rounded-full hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined">help</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 bg-[#F8FAFC] p-container-margin">
          <div className="max-w-[1200px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
