import { requireProfile } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, store } = await requireProfile();

  return (
    <AppShell
      storeName={store.name}
      displayName={profile.display_name}
      role={profile.role}
    >
      {children}
    </AppShell>
  );
}
