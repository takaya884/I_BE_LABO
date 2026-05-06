import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { movementLabel } from "@/lib/types";

export default async function Dashboard() {
  const { store } = await requireProfile();
  const supabase = await createClient();

  const [{ count: itemCount }, { count: coinCount }, { count: menuCount }] = await Promise.all([
    supabase.from("items").select("*", { count: "exact", head: true }).eq("store_id", store.id).eq("archived", false),
    supabase.from("item_units").select("*", { count: "exact", head: true }).eq("store_id", store.id).eq("status", "in_stock"),
    supabase.from("experience_menus").select("*", { count: "exact", head: true }).eq("store_id", store.id).eq("archived", false),
  ]);

  const { data: lowStock } = await supabase
    .from("items")
    .select("id, name, unit, reorder_point, stock_balances!inner(quantity)")
    .eq("store_id", store.id)
    .eq("tracking_type", "quantity")
    .eq("archived", false);

  const alerts =
    (lowStock as any[] | null)
      ?.map((it) => ({
        id: it.id,
        name: it.name,
        unit: it.unit,
        quantity: it.stock_balances?.[0]?.quantity ?? 0,
        reorder_point: it.reorder_point ?? 0,
      }))
      .filter((it) => it.quantity <= it.reorder_point) ?? [];

  const { data: recentMovements } = await supabase
    .from("stock_movements")
    .select("id, movement_type, quantity, occurred_at, items(name)")
    .eq("store_id", store.id)
    .order("occurred_at", { ascending: false })
    .limit(8);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-accent-600 via-accent-500 to-coin-500 p-6 text-white shadow-soft sm:p-8">
        <p className="text-xs uppercase tracking-wider text-white/80">ダッシュボード</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{store.name}</h1>
        <p className="mt-1 text-sm text-white/85">
          現在の在庫状況とアクティビティをまとめています
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi
          label="商品アイテム"
          value={itemCount ?? 0}
          unit="種類"
          icon="📦"
          tone="accent"
        />
        <Kpi
          label="コイン在庫"
          value={coinCount ?? 0}
          unit="枚"
          icon="🪙"
          tone="coin"
        />
        <Kpi
          label="体験メニュー"
          value={menuCount ?? 0}
          unit="種類"
          icon="💍"
          tone="brand"
        />
      </div>

      <section className="card p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-brand-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600">
              ⚠
            </span>
            在庫切れ警告
          </h2>
          <Link href="/stock" className="text-xs font-medium text-accent-600 hover:underline">
            在庫一覧へ →
          </Link>
        </div>
        {alerts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-brand-200 bg-brand-50/50 px-4 py-6 text-center text-sm text-brand-500">
            在庫は十分に確保されています
          </div>
        ) : (
          <ul className="divide-y divide-brand-100">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 py-2.5 text-sm"
              >
                <span className="font-medium text-brand-900">{a.name}</span>
                <span className="badge bg-red-50 text-red-700">
                  残り {a.quantity}
                  {a.unit ?? ""} / 警告 {a.reorder_point}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-brand-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-50 text-accent-700">
            🔄
          </span>
          最近の動き
        </h2>
        {!recentMovements || recentMovements.length === 0 ? (
          <div className="rounded-lg border border-dashed border-brand-200 bg-brand-50/50 px-4 py-6 text-center text-sm text-brand-500">
            まだ動きがありません
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="table min-w-[480px]">
              <thead>
                <tr>
                  <th>日時</th>
                  <th>種別</th>
                  <th>商品</th>
                  <th className="text-right">数量</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.map((m: any) => (
                  <tr key={m.id} className="hover:bg-brand-50/60">
                    <td className="whitespace-nowrap text-brand-700">
                      {formatDateTime(m.occurred_at)}
                    </td>
                    <td>
                      <span className="badge bg-accent-50 text-accent-700">
                        {movementLabel[m.movement_type as keyof typeof movementLabel]}
                      </span>
                    </td>
                    <td>{m.items?.name ?? "—"}</td>
                    <td className="text-right font-semibold">{m.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

type Tone = "accent" | "coin" | "brand";

function Kpi({
  label,
  value,
  unit,
  icon,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  icon: string;
  tone: Tone;
}) {
  const toneClasses: Record<Tone, string> = {
    accent: "from-accent-500 to-accent-700",
    coin: "from-coin-500 to-coin-600",
    brand: "from-brand-700 to-brand-900",
  };
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-brand-500">
          {label}
        </p>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${toneClasses[tone]} text-lg text-white shadow-soft`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold text-brand-900">
        {value.toLocaleString()}
        <span className="ml-1 text-sm font-medium text-brand-500">{unit}</span>
      </p>
    </div>
  );
}
