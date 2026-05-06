"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MovementType } from "@/lib/types";

type ItemOpt = {
  id: string;
  name: string;
  tracking_type: "individual" | "quantity";
  unit: string | null;
  country: string | null;
  denomination: string | null;
};

type UnitOpt = {
  id: string;
  item_id: string;
  year: number | null;
  condition: string | null;
  status: string;
};

type Props = {
  storeId: string;
  profileId: string;
  items: ItemOpt[];
  units: UnitOpt[];
};

const TYPES: { value: MovementType; label: string }[] = [
  { value: "inbound", label: "入庫" },
  { value: "outbound", label: "出庫（破損・廃棄）" },
  { value: "adjustment", label: "棚卸調整（差分）" },
];

export function MovementForm({ storeId, profileId, items, units }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [movementType, setMovementType] = useState<MovementType>("inbound");
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [unitId, setUnitId] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = useMemo(() => items.find((i) => i.id === itemId), [items, itemId]);
  const isIndividual = selectedItem?.tracking_type === "individual";
  const itemUnits = useMemo(
    () => units.filter((u) => u.item_id === itemId),
    [units, itemId],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isIndividual) {
      if (movementType === "inbound") {
        // 個体管理品の入庫は item_units 画面で個体登録 → 自動的に在庫扱いとする運用
        setError("コインの新規入庫は「コイン個体」画面から個別に登録してください");
        setLoading(false);
        return;
      }
      if (!unitId) {
        setError("対象のコイン個体を選択してください");
        setLoading(false);
        return;
      }
    }

    let qty = Number(quantity);
    if (isIndividual) qty = 1;

    // 棚卸調整は「差分」を受け付ける（負の値もOK）
    const payload: any = {
      store_id: storeId,
      item_id: itemId,
      item_unit_id: isIndividual ? unitId : null,
      movement_type: movementType,
      quantity: movementType === "adjustment" ? qty : Math.abs(qty),
      performed_by: profileId,
      note: note || null,
    };

    const { error } = await supabase.from("stock_movements").insert(payload);

    if (!error && isIndividual) {
      const newStatus =
        movementType === "outbound"
          ? "lost"
          : movementType === "consume"
            ? "consumed"
            : "in_stock";
      await supabase.from("item_units").update({ status: newStatus }).eq("id", unitId);
    }

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/movements");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">種別</label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              type="button"
              key={t.value}
              onClick={() => setMovementType(t.value)}
              className={`btn ${
                movementType === t.value ? "btn-primary" : "btn-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">商品</label>
        <select
          required
          value={itemId}
          onChange={(e) => {
            setItemId(e.target.value);
            setUnitId("");
          }}
          className="input"
        >
          {items.map((it) => (
            <option key={it.id} value={it.id}>
              {it.name}
              {it.tracking_type === "individual" ? "（個体）" : `（${it.unit ?? "数量"}）`}
            </option>
          ))}
        </select>
      </div>

      {isIndividual && movementType !== "inbound" && (
        <div>
          <label className="label">対象のコイン個体</label>
          <select
            required
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="input"
          >
            <option value="">選択してください</option>
            {itemUnits.map((u) => (
              <option key={u.id} value={u.id} disabled={u.status !== "in_stock"}>
                {u.year ?? "—"} / {u.condition ?? "—"} ({u.status})
              </option>
            ))}
          </select>
        </div>
      )}

      {!isIndividual && (
        <div>
          <label className="label">
            {movementType === "adjustment" ? "差分（増は正、減は負）" : "数量"}
          </label>
          <input
            type="number"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="input"
          />
        </div>
      )}

      <div>
        <label className="label">メモ</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input min-h-20"
          placeholder="例：仕入先から納品 / 棚卸で 2個少なかった など"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "登録中…" : "登録する"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          キャンセル
        </button>
      </div>
    </form>
  );
}
