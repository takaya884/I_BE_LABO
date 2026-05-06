import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MovementForm } from "@/components/MovementForm";

export default async function NewMovementPage() {
  const { profile, store } = await requireProfile();
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items")
    .select("id, name, tracking_type, unit, country, denomination")
    .eq("store_id", store.id)
    .eq("archived", false)
    .order("name");

  const { data: units } = await supabase
    .from("item_units")
    .select("id, item_id, year, condition, status")
    .eq("store_id", store.id)
    .order("year", { ascending: false });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">入出庫を登録</h1>
        <p className="text-sm text-brand-500">入庫 / 出庫 / 棚卸調整を記録</p>
      </div>
      <div className="card p-6">
        <MovementForm
          storeId={store.id}
          profileId={profile.id}
          items={items ?? []}
          units={units ?? []}
        />
      </div>
    </div>
  );
}
