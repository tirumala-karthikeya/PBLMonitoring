import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <AppShell
      pageTitle="Program Overview"
      user={{ fullName: session.user.name ?? "User", email: session.user.email ?? "", role: session.user.role }}
    >
      <DashboardClient />
    </AppShell>
  );
}
