import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import SchoolsClient from "./SchoolsClient";

export default async function SchoolsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <AppShell
      pageTitle="Schools"
      user={{ fullName: session.user.name ?? "User", email: session.user.email ?? "", role: session.user.role }}
    >
      <SchoolsClient />
    </AppShell>
  );
}
