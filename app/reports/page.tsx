import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <AppShell
      pageTitle="Grant Reporting Assistant"
      user={{ fullName: session.user.name ?? "User", email: session.user.email ?? "" }}
    >
      <ReportsClient />
    </AppShell>
  );
}
