import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";

const ROLE_LABELS: Record<string, string> = {
  regional_director: "Regional Director",
  school_admin: "School Admin",
  donor: "Donor",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const user = session.user;
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  return (
    <AppShell pageTitle="Settings" user={{ fullName: user.name ?? "User", email: user.email ?? "", role: user.role }}>
      <div className="space-y-stack-lg pb-stack-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
          {/* Left: identity card */}
          <div className="lg:col-span-4 flex flex-col gap-stack-lg">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="h-16 bg-surface-variant relative">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: "radial-gradient(#065F46 1px, transparent 1px)", backgroundSize: "16px 16px" }}
                />
              </div>
              <div className="px-stack-lg pb-stack-lg pt-stack-md">
                <div className="flex items-end gap-stack-md">
                  <div className="w-20 h-20 rounded-full border-4 border-surface-container-lowest bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
                    <span className="material-symbols-outlined text-[36px]">account_circle</span>
                  </div>
                  <div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">{user.name}</h2>
                    <p className="font-body-lg text-body-lg text-outline mt-1">{roleLabel}</p>
                  </div>
                </div>
                <div className="mt-stack-lg flex gap-2">
                  <span className="px-3 py-1 bg-primary-fixed text-primary-container rounded-full font-label-md text-label-md border border-primary-container/30">
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg shadow-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-md">Contact Information</h3>
              <div className="flex flex-col gap-stack-md">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline">mail</span>
                  <div>
                    <p className="font-label-md text-label-md text-outline uppercase tracking-wider">Email</p>
                    <p className="font-body-md text-body-md text-on-surface">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline">badge</span>
                  <div>
                    <p className="font-label-md text-label-md text-outline uppercase tracking-wider">Role</p>
                    <p className="font-body-md text-body-md text-on-surface">{roleLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: activity (demo data) */}
          <div className="lg:col-span-8 flex flex-col gap-stack-lg">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
              <div className="px-stack-lg py-stack-md border-b border-outline-variant flex justify-between items-center bg-surface-bright">
                <h3 className="font-headline-md text-headline-md text-on-surface">Recent Activity</h3>
                <span className="font-label-md text-label-md text-outline uppercase tracking-wider">Demo data</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      <th className="px-stack-lg py-3 font-label-md text-label-md text-outline uppercase tracking-wider w-[140px]">Date</th>
                      <th className="px-stack-lg py-3 font-label-md text-label-md text-outline uppercase tracking-wider">Action</th>
                      <th className="px-stack-lg py-3 font-label-md text-label-md text-outline uppercase tracking-wider w-[120px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    <tr>
                      <td className="px-stack-lg py-4 font-data-mono text-data-mono text-on-surface-variant">—</td>
                      <td className="px-stack-lg py-4 font-body-md text-body-md text-on-surface-variant italic">
                        Activity logging is not implemented in this assessment build — this table illustrates the
                        intended layout only.
                      </td>
                      <td className="px-stack-lg py-4">
                        <span className="px-2 py-1 bg-surface-variant text-on-surface rounded-md font-label-md text-[10px] border border-outline-variant uppercase tracking-wider">
                          Planned
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
