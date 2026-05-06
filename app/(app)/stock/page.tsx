import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { categoryLabel, type ItemCategory } from "@/lib/types";

export default async function StockPage() {
  const { store } = await requireProfile();
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("items")
    .select("id, category, tracking_type, name, country, denomination, unit, reorder_point")
    .eq("store_id", store.id)
    .eq("archived", false)
    .order("category")
    .order("name");

  const itemIds = (items ?? []).map((i) => i.id);

  const [{ data: balances }, { data: units }] = await Promise.all([
    supabase
      .from("stock_balances")
      .select("item_id, quantity")
      .in("item_id", itemIds.length > 0 ? itemIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("item_units")
      .select("item_id, status")
      .in("item_id", itemIds.length > 0 ? itemIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const balanceMap = new Map<string, number>();
  for (const b of balances ?? []) balanceMap.set(b.item_id, b.quantity);

  const inStockMap = new Map<string, number>();
  for (const u of units ?? []) {
    if (u.status === "in_stock") {
      inStockMap.set(u.item_id, (inStockMap.get(u.item_id) ?? 0) + 1);
    }
  }

  const list = items ?? [];

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">在庫一覧</h1>
          <p className="page-subtitle">商品ごとの現在在庫</p>
        </div>
        <Link href="/movements/new" className="btn-primary self-start sm:self-auto">
          ＋ 入出庫を登録
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="empty">商品が登録されていません。</div>
      ) : (
        <>
          {/* デスクトップ */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>区分</th>
                  <th>名称</th>
                  <th>追跡</th>
                  <th className="text-right">在庫</th>
                  <th className="text-right">警告水準</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {list.map((it) => {
                  const qty =
                    it.tracking_type === "individual"
                      ? inStockMap.get(it.id) ?? 0
                      : balanceMap.get(it.id) ?? 0;
                  const warning = qty <= (it.reorder_point ?? 0);
                  return (
                    <tr key={it.id}>
                      <td>
                        <span className="badge bg-brand-100 text-brand-700">
                          {categoryLabel[it.category as ItemCategory]}
                        </span>
                      </td>
                      <td>
                        <div className="font-medium">{it.name}</div>
                        {(it.country || it.denomination) && (
                          <div className="text-xs text-brand-500">
                            {[it.country, it.denomination].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </td>
                      <td>{it.tracking_type === "individual" ? "個体" : "数量"}</td>
                      <td className="whitespace-nowrap text-right text-lg font-semibold">
                        {qty}
                        <span className="ml-0.5 text-xs text-brand-500">
                          {it.tracking_type === "individual" ? "枚" : it.unit}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-right text-brand-500">
                        {it.reorder_point ?? 0}
                      </td>
                      <td>
                        {warning ? (
                          <span className="badge bg-red-100 text-red-800">要発注</span>
                        ) : (
                          <span className="badge bg-emerald-100 text-emerald-800">OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* モバイル */}
          <ul className="space-y-3 md:hidden">
            {list.map((it) => {
              const qty =
                it.tracking_type === "individual"
                  ? inStockMap.get(it.id) ?? 0
                  : balanceMap.get(it.id) ?? 0;
              const warning = qty <= (it.reorder_point ?? 0);
              return (
                <li key={it.id} className="mobile-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-brand-900">
                        {it.name}
                      </p>
                      {(it.country || it.denomination) && (
                        <p className="mt-0.5 truncate text-xs text-brand-500">
                          {[it.country, it.denomination].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    {warning ? (
                      <span className="badge shrink-0 bg-red-100 text-red-800">要発注</span>
                    ) : (
                      <span className="badge shrink-0 bg-emerald-100 text-emerald-800">OK</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge bg-brand-100 text-brand-700">
                      {categoryLabel[it.category as ItemCategory]}
                    </span>
                    <span className="badge bg-brand-50 text-brand-700">
                      {it.tracking_type === "individual" ? "個体" : "数量"}
                    </span>
                  </div>
                  <div className="flex items-end justify-between border-t border-brand-100 pt-2">
                    <div>
                      <p className="mobile-card-label">在庫</p>
                      <p className="text-2xl font-bold text-brand-900">
                        {qty}
                        <span className="ml-0.5 text-sm font-medium text-brand-500">
                          {it.tracking_type === "individual" ? "枚" : it.unit}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="mobile-card-label">警告水準</p>
                      <p className="text-sm font-medium text-brand-700">
                        {it.reorder_point ?? 0}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
