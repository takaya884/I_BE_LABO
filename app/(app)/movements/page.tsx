import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { movementLabel } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export default async function MovementsPage() {
  const { store } = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock_movements")
    .select("*, items(name, tracking_type, unit), experience_menus(name)")
    .eq("store_id", store.id)
    .order("occurred_at", { ascending: false })
    .limit(200);

  const list = (data as any[] | null) ?? [];

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">入出庫履歴</h1>
          <p className="page-subtitle">直近 200 件</p>
        </div>
        <Link href="/movements/new" className="btn-primary self-start sm:self-auto">
          ＋ 入出庫を登録
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="empty">履歴がありません。</div>
      ) : (
        <>
          {/* デスクトップ */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>日時</th>
                  <th>種別</th>
                  <th>商品</th>
                  <th className="text-right">数量</th>
                  <th>関連メニュー</th>
                  <th>メモ</th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap">{formatDateTime(m.occurred_at)}</td>
                    <td>
                      <span className="badge bg-accent-50 text-accent-700">
                        {movementLabel[m.movement_type as keyof typeof movementLabel]}
                      </span>
                    </td>
                    <td className="font-medium">{m.items?.name ?? "—"}</td>
                    <td className="whitespace-nowrap text-right">
                      {m.quantity}
                      <span className="ml-0.5 text-xs text-brand-500">
                        {m.items?.tracking_type === "individual" ? "枚" : m.items?.unit ?? ""}
                      </span>
                    </td>
                    <td className="text-sm text-brand-500">
                      {m.experience_menus?.name ?? "—"}
                    </td>
                    <td className="text-sm">{m.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* モバイル */}
          <ul className="space-y-3 md:hidden">
            {list.map((m) => (
              <li key={m.id} className="mobile-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-brand-900">
                      {m.items?.name ?? "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-brand-500">
                      {formatDateTime(m.occurred_at)}
                    </p>
                  </div>
                  <span className="badge shrink-0 bg-accent-50 text-accent-700">
                    {movementLabel[m.movement_type as keyof typeof movementLabel]}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-brand-100 pt-2">
                  <p className="mobile-card-label">数量</p>
                  <p className="text-lg font-semibold">
                    {m.quantity}
                    <span className="ml-0.5 text-xs font-medium text-brand-500">
                      {m.items?.tracking_type === "individual" ? "枚" : m.items?.unit ?? ""}
                    </span>
                  </p>
                </div>
                {(m.experience_menus?.name || m.note) && (
                  <div className="space-y-1 border-t border-brand-100 pt-2 text-sm">
                    {m.experience_menus?.name && (
                      <div>
                        <span className="mobile-card-label">関連メニュー</span>
                        <span className="ml-2 text-brand-700">{m.experience_menus.name}</span>
                      </div>
                    )}
                    {m.note && (
                      <div>
                        <span className="mobile-card-label">メモ</span>
                        <span className="ml-2 text-brand-700">{m.note}</span>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
