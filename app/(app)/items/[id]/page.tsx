import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ItemForm } from "@/components/ItemForm";
import type { Item } from "@/lib/types";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile, store } = await requireProfile();
  const supabase = await createClient();
  const { data: item } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
  if (!item) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">商品を編集</h1>
      </div>
      <div className="card p-6">
        <ItemForm tenantId={profile.tenant_id} storeId={store.id} initial={item as Item} />
      </div>
    </div>
  );
}
