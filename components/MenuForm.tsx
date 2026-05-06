"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ItemOpt = {
  id: string;
  name: string;
  tracking_type: "individual" | "quantity";
  unit: string | null;
};

type BomRow = { item_id: string; quantity: number; is_optional: boolean };

type Props = {
  tenantId: string;
  storeId: string;
  items: ItemOpt[];
  initial?: any;
  initialBoms?: BomRow[];
};

export function MenuForm({ tenantId, storeId, items, initial, initialBoms }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "0");
  const [duration, setDuration] = useState(initial?.duration_minutes?.toString() ?? "90");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [boms, setBoms] = useState<BomRow[]>(
    initialBoms?.map((b) => ({
      item_id: b.item_id,
      quantity: b.quantity,
      is_optional: b.is_optional,
    })) ?? [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addBom() {
    setBoms([...boms, { item_id: items[0]?.id ?? "", quantity: 1, is_optional: false }]);
  }
  function removeBom(idx: number) {
    setBoms(boms.filter((_, i) => i !== idx));
  }
  function updateBom(idx: number, patch: Partial<BomRow>) {
    setBoms(boms.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const menuPayload = {
      tenant_id: tenantId,
      store_id: storeId,
      name,
      price: Number(price),
      duration_minutes: duration ? Number(duration) : null,
      description: description || null,
    };

    let menuId = initial?.id as string | undefined;
    if (menuId) {
      const { error } = await supabase
        .from("experience_menus")
        .update(menuPayload)
        .eq("id", menuId);
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      await supabase.from("boms").delete().eq("menu_id", menuId);
    } else {
      const { data, error } = await supabase
        .from("experience_menus")
        .insert(menuPayload)
        .select("id")
        .single();
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      menuId = data.id;
    }

    if (boms.length > 0 && menuId) {
      const insert = boms
        .filter((b) => b.item_id)
        .map((b) => ({ ...b, menu_id: menuId }));
      const { error } = await supabase.from("boms").insert(insert);
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.push("/menus");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label">メニュー名</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="コインリング"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">価格 (円)</label>
          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">所要時間 (分)</label>
          <input
            type="number"
            min="0"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="label">説明</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input min-h-20"
        />
      </div>

      <div className="border-t border-brand-100 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-brand-900">必要部材 (BOM)</h3>
          <button type="button" onClick={addBom} className="btn-secondary text-sm">
            ＋ 部材を追加
          </button>
        </div>
        {boms.length === 0 ? (
          <p className="text-sm text-brand-500">「＋ 部材を追加」で 1 回の体験で必要な部材を登録</p>
        ) : (
          <div className="space-y-2">
            {boms.map((b, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={b.item_id}
                  onChange={(e) => updateBom(idx, { item_id: e.target.value })}
                  className="input flex-1"
                >
                  <option value="">選択</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name}
                      {it.tracking_type === "individual" ? "（個体）" : `（${it.unit}）`}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={b.quantity}
                  onChange={(e) =>
                    updateBom(idx, { quantity: Number(e.target.value) })
                  }
                  className="input w-24"
                />
                <label className="flex items-center gap-1 text-xs text-brand-500">
                  <input
                    type="checkbox"
                    checked={b.is_optional}
                    onChange={(e) =>
                      updateBom(idx, { is_optional: e.target.checked })
                    }
                  />
                  任意
                </label>
                <button
                  type="button"
                  onClick={() => removeBom(idx)}
                  className="text-sm text-red-600"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "保存中…" : initial ? "更新する" : "登録する"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          キャンセル
        </button>
      </div>
    </form>
  );
}
