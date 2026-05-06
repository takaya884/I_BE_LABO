import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MenuForm } from "@/components/MenuForm";

export default async function NewMenuPage() {
  const { profile, store } = await requireProfile();
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items")
    .select("id, name, tracking_type, unit")
    .eq("store_id", store.id)
    .eq("archived", false)
    .order("name");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-brand-900">体験メニューを新規作成</h1>
      <div className="card p-6">
        <MenuForm tenantId={profile.tenant_id} storeId={store.id} items={items ?? []} />
      </div>
    </div>
  );
}
