import type { NextAuthConfig } from "next-auth";

const PROTECTED_PATHS = ["/dashboard", "/reports", "/schools", "/settings", "/help"];

// Edge-safe config (no Prisma/bcrypt here), consumed by middleware.
// The full config with the Credentials provider lives in auth.ts.
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/signin" },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = PROTECTED_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
  },
  providers: [],
};
