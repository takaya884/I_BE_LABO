import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ItemUnitForm } from "@/components/ItemUnitForm";

export default async function NewUnitPage() {
  const { store } = await requireProfile();
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items")
    .select("id, name, country, denomination")
    .eq("store_id", store.id)
    .eq("tracking_type", "individual")
    .eq("archived", false)
    .order("name");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">コインを登録</h1>
        <p className="text-sm text-brand-500">1枚ずつ個体管理します</p>
      </div>
      <div className="card p-6">
        <ItemUnitForm storeId={store.id} items={items ?? []} />
      </div>
    </div>
  );
}
