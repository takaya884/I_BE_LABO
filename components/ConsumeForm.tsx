"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Bom = {
  item_id: string;
  quantity: number;
  is_optional: boolean;
  items: {
    name: string;
    tracking_type: "individual" | "quantity";
    unit: string | null;
    country: string | null;
    denomination: string | null;
  };
};

type Menu = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number | null;
  boms: Bom[];
};

type Unit = {
  id: string;
  item_id: string;
  year: number | null;
  condition: string | null;
};

type Props = {
  storeId: string;
  menus: Menu[];
  units: Unit[];
};

export function ConsumeForm({ storeId, menus, units }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [menuId, setMenuId] = useState(menus[0]?.id ?? "");
  const [unitOverrides, setUnitOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedMenu = useMemo(() => menus.find((m) => m.id === menuId), [menus, menuId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMenu) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    const overrides = Object.entries(unitOverrides)
      .filter(([, v]) => !!v)
      .map(([item_id, item_unit_id]) => ({ item_id, item_unit_id }));

    const { error } = await supabase.rpc("consume_experience", {
      p_menu_id: selectedMenu.id,
      p_store_id: storeId,
      p_unit_overrides: overrides,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(`「${selectedMenu.name}」を1件実施しました。在庫を更新しました。`);
    setUnitOverrides({});
    router.refresh();
  }

  if (menus.length === 0) {
    return (
      <p className="text-sm text-brand-500">
        まずは「体験メニュー」から BOM 付きでメニューを作成してください。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label">体験メニュー</label>
        <select
          value={menuId}
          onChange={(e) => {
            setMenuId(e.target.value);
            setUnitOverrides({});
          }}
          className="input"
        >
          {menus.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}（¥{m.price.toLocaleString()}）
            </option>
          ))}
        </select>
      </div>

      {selectedMenu && (
        <div className="rounded-md bg-brand-50 p-4">
          <h4 className="mb-2 text-sm font-medium text-brand-900">消費される部材</h4>
          <ul className="space-y-2 text-sm">
            {selectedMenu.boms.filter((b) => !b.is_optional).map((b) => {
              const isIndiv = b.items.tracking_type === "individual";
              const candidates = units.filter((u) => u.item_id === b.item_id);
              return (
                <li key={b.item_id} className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {b.items.name}
                    {b.items.country ? `（${b.items.country}）` : ""}
                  </span>
                  <span className="text-brand-500">
                    × {b.quantity}
                    {isIndiv ? "枚" : b.items.unit ?? ""}
                  </span>
                  {isIndiv && (
                    <select
                      value={unitOverrides[b.item_id] ?? ""}
                      onChange={(e) =>
                        setUnitOverrides({
                          ...unitOverrides,
                          [b.item_id]: e.target.value,
                        })
                      }
                      className="input ml-auto max-w-xs text-xs"
                    >
                      <option value="">自動選択（古いものから）</option>
                      {candidates.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.year ?? "年号不明"} / {u.condition ?? "—"}
                        </option>
                      ))}
                    </select>
                  )}
                </li>
              );
            })}
            {selectedMenu.boms.filter((b) => b.is_optional).map((b) => (
              <li key={b.item_id} className="text-xs text-brand-500">
                （任意）{b.items.name} × {b.quantity}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          ✓ {success}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "処理中…" : "✨ 体験を実施（在庫を消費）"}
        </button>
      </div>
    </form>
  );
}
