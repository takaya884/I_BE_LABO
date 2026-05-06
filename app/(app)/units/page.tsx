import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatYen } from "@/lib/utils";

const statusLabel: Record<string, string> = {
  in_stock: "在庫",
  reserved: "予約",
  consumed: "消費済",
  lost: "紛失",
};

const statusBadgeClass: Record<string, string> = {
  in_stock: "bg-emerald-100 text-emerald-800",
  reserved: "bg-amber-100 text-amber-800",
  consumed: "bg-brand-100 text-brand-700",
  lost: "bg-red-100 text-red-800",
};

export default async function UnitsPage() {
  const { store } = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("item_units")
    .select("*, items(name, country, denomination)")
    .eq("store_id", store.id)
    .order("status")
    .order("acquired_at", { ascending: false });

  const list = (data as any[] | null) ?? [];

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">コイン個体一覧</h1>
          <p className="page-subtitle">1枚 1レコードで管理</p>
        </div>
        <Link href="/units/new" className="btn-primary self-start sm:self-auto">
          ＋ コイン登録
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="empty">まだコインが登録されていません。</div>
      ) : (
        <>
          {/* デスクトップ */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>状態</th>
                  <th>商品</th>
                  <th>国 / 額面</th>
                  <th>年号</th>
                  <th>状態（質）</th>
                  <th>仕入</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className={`badge ${statusBadgeClass[u.status] ?? ""}`}>
                        {statusLabel[u.status]}
                      </span>
                    </td>
                    <td className="font-medium">{u.items?.name}</td>
                    <td className="text-sm text-brand-500">
                      {[u.items?.country, u.items?.denomination].filter(Boolean).join(" · ")}
                    </td>
                    <td className="whitespace-nowrap">{u.year ?? "—"}</td>
                    <td>{u.condition ?? "—"}</td>
                    <td className="whitespace-nowrap">{formatYen(u.acquisition_cost)}</td>
                    <td className="text-right">
                      <Link
                        href={`/units/${u.id}`}
                        className="text-sm font-medium text-accent-700 hover:underline"
                      >
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* モバイル */}
          <ul className="space-y-3 md:hidden">
            {list.map((u) => (
              <li key={u.id}>
                <Link href={`/units/${u.id}`} className="mobile-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-brand-900">
                        {u.items?.name ?? "—"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-brand-500">
                        {[u.items?.country, u.items?.denomination]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </div>
                    <span className={`badge shrink-0 ${statusBadgeClass[u.status] ?? ""}`}>
                      {statusLabel[u.status]}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-brand-100 pt-2 text-sm">
                    <div>
                      <p className="mobile-card-label">年号</p>
                      <p className="font-medium">{u.year ?? "—"}</p>
                    </div>
                    <div>
                      <p className="mobile-card-label">質</p>
                      <p className="font-medium">{u.condition ?? "—"}</p>
                    </div>
                    <div>
                      <p className="mobile-card-label">仕入</p>
                      <p className="font-medium">{formatYen(u.acquisition_cost)}</p>
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
