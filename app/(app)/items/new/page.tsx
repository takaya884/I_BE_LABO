import { requireProfile } from "@/lib/auth";
import { ItemForm } from "@/components/ItemForm";

export default async function NewItemPage() {
  const { profile, store } = await requireProfile();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">商品を新規登録</h1>
        <p className="text-sm text-brand-500">
          ヴィンテージコインは「個体管理」、消耗品・工具は「数量管理」を選択
        </p>
      </div>
      <div className="card p-6">
        <ItemForm tenantId={profile.tenant_id} storeId={store.id} />
      </div>
    </div>
  );
}
