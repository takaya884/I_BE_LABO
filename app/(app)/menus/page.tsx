import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatYen } from "@/lib/utils";

export default async function MenusPage() {
  const { store } = await requireProfile();
  const supabase = await createClient();
  const { data: menus } = await supabase
    .from("experience_menus")
    .select("*, boms(quantity, items(name, unit, tracking_type))")
    .eq("store_id", store.id)
    .eq("archived", false)
    .order("name");

  const list = (menus as any[] | null) ?? [];

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">体験メニュー</h1>
          <p className="page-subtitle">体験 1 回あたりに必要な部材（BOM）を定義</p>
        </div>
        <Link href="/menus/new" className="btn-primary self-start sm:self-auto">
          ＋ 新規メニュー
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="empty">まだメニューがありません。</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((m) => (
            <div key={m.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-brand-900">{m.name}</h3>
                  <p className="text-sm text-brand-500">
                    {formatYen(m.price)} / {m.duration_minutes ?? "—"}分
                  </p>
                </div>
                <Link
                  href={`/menus/${m.id}`}
                  className="shrink-0 text-sm font-medium text-accent-700 hover:underline"
                >
                  編集
                </Link>
              </div>
              {m.description && (
                <p className="mt-2 text-sm text-brand-700">{m.description}</p>
              )}
              <div className="mt-3 border-t border-brand-100 pt-3">
                <p className="mobile-card-label mb-1.5">必要部材（BOM）</p>
                {m.boms?.length === 0 ? (
                  <p className="text-xs text-brand-500">まだ部材が登録されていません</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {m.boms?.map((b: any, idx: number) => (
                      <li key={idx} className="flex items-center justify-between gap-2">
                        <span className="truncate">{b.items?.name}</span>
                        <span className="shrink-0 text-brand-500">
                          × {b.quantity}
                          {b.items?.tracking_type === "individual" ? "枚" : b.items?.unit ?? ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
