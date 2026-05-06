import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ConsumeForm } from "@/components/ConsumeForm";

export default async function ConsumePage() {
  const { store } = await requireProfile();
  const supabase = await createClient();

  const { data: menus } = await supabase
    .from("experience_menus")
    .select("*, boms(item_id, quantity, is_optional, items(name, tracking_type, unit, country, denomination))")
    .eq("store_id", store.id)
    .eq("archived", false)
    .order("name");

  const { data: units } = await supabase
    .from("item_units")
    .select("id, item_id, year, condition")
    .eq("store_id", store.id)
    .eq("status", "in_stock")
    .order("year", { ascending: false });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">体験を実施</h1>
        <p className="page-subtitle">
          メニューを選んで「実施」を押すと、必要な部材が自動で在庫から差し引かれます
        </p>
      </div>
      <div className="card p-4 sm:p-6">
        <ConsumeForm storeId={store.id} menus={menus ?? []} units={units ?? []} />
      </div>
    </div>
  );
}
