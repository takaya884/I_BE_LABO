import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { categoryLabel, type Item } from "@/lib/types";
import { formatYen } from "@/lib/utils";

export default async function ItemsPage() {
  const { store } = await requireProfile();
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("store_id", store.id)
    .eq("archived", false)
    .order("category")
    .order("name");

  const list = (items as Item[] | null) ?? [];

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">商品マスタ</h1>
          <p className="page-subtitle">コイン・部材・工具を一括管理</p>
        </div>
        <Link href="/items/new" className="btn-primary self-start sm:self-auto">
          ＋ 新規登録
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          商品がまだ登録されていません。「＋ 新規登録」から追加してください。
        </div>
      ) : (
        <>
          {/* デスクトップ: テーブル */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>区分</th>
                  <th>名称</th>
                  <th>追跡方法</th>
                  <th>単価</th>
                  <th>警告水準</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((it) => (
                  <tr key={it.id}>
                    <td>
                      <span className="badge bg-brand-100 text-brand-700">
                        {categoryLabel[it.category]}
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
                    <td>
                      {it.tracking_type === "individual" ? (
                        <span className="badge bg-amber-100 text-amber-800">個体</span>
                      ) : (
                        <span className="badge bg-emerald-100 text-emerald-800">
                          数量 ({it.unit})
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap">{formatYen(it.unit_cost)}</td>
                    <td className="whitespace-nowrap">
                      {it.reorder_point ?? 0}
                      {it.unit ?? ""}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/items/${it.id}`}
                        className="text-sm font-medium text-accent-700 hover:underline"
                      >
                        編集
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* モバイル: カード */}
          <ul className="space-y-3 md:hidden">
            {list.map((it) => (
              <li key={it.id}>
                <Link href={`/items/${it.id}`} className="mobile-card">
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
                    <span className="badge shrink-0 bg-brand-100 text-brand-700">
                      {categoryLabel[it.category]}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {it.tracking_type === "individual" ? (
                      <span className="badge bg-amber-100 text-amber-800">個体管理</span>
                    ) : (
                      <span className="badge bg-emerald-100 text-emerald-800">
                        数量管理 ({it.unit})
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-brand-100 pt-2 text-sm">
                    <div>
                      <p className="mobile-card-label">単価</p>
                      <p className="font-medium">{formatYen(it.unit_cost)}</p>
                    </div>
                    <div>
                      <p className="mobile-card-label">警告水準</p>
                      <p className="font-medium">
                        {it.reorder_point ?? 0}
                        {it.unit ?? ""}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
