import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MenuForm } from "@/components/MenuForm";

export default async function EditMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile, store } = await requireProfile();
  const supabase = await createClient();
  const { data: menu } = await supabase
    .from("experience_menus")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!menu) notFound();

  const { data: boms } = await supabase
    .from("boms")
    .select("*")
    .eq("menu_id", id);

  const { data: items } = await supabase
    .from("items")
    .select("id, name, tracking_type, unit")
    .eq("store_id", store.id)
    .order("name");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-brand-900">体験メニューを編集</h1>
      <div className="card p-6">
        <MenuForm
          tenantId={profile.tenant_id}
          storeId={store.id}
          items={items ?? []}
          initial={menu}
          initialBoms={boms ?? []}
        />
      </div>
    </div>
  );
}
