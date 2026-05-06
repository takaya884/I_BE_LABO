import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ItemUnitForm } from "@/components/ItemUnitForm";
import type { ItemUnit } from "@/lib/types";

export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { store } = await requireProfile();
  const supabase = await createClient();
  const { data: unit } = await supabase
    .from("item_units")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!unit) notFound();

  const { data: items } = await supabase
    .from("items")
    .select("id, name, country, denomination")
    .eq("store_id", store.id)
    .eq("tracking_type", "individual")
    .order("name");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">コインを編集</h1>
      </div>
      <div className="card p-6">
        <ItemUnitForm storeId={store.id} items={items ?? []} initial={unit as ItemUnit} />
      </div>
    </div>
  );
}
