"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Item, ItemCategory, TrackingType } from "@/lib/types";

type Props = {
  tenantId: string;
  storeId: string;
  initial?: Item;
};

export function ItemForm({ tenantId, storeId, initial }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [category, setCategory] = useState<ItemCategory>(initial?.category ?? "coin");
  const [trackingType, setTrackingType] = useState<TrackingType>(
    initial?.tracking_type ?? "individual",
  );
  const [name, setName] = useState(initial?.name ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [denomination, setDenomination] = useState(initial?.denomination ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "個");
  const [unitCost, setUnitCost] = useState<string>(initial?.unit_cost?.toString() ?? "");
  const [reorderPoint, setReorderPoint] = useState<string>(
    initial?.reorder_point?.toString() ?? "0",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      tenant_id: tenantId,
      store_id: storeId,
      category,
      tracking_type: trackingType,
      name,
      country: country || null,
      denomination: denomination || null,
      unit: trackingType === "quantity" ? unit : null,
      unit_cost: unitCost ? Number(unitCost) : null,
      reorder_point: reorderPoint ? Number(reorderPoint) : 0,
      notes: notes || null,
    };

    const { error } =
      initial != null
        ? await supabase.from("items").update(payload).eq("id", initial.id)
        : await supabase.from("items").insert(payload);

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/items");
    router.refresh();
  }

  async function handleArchive() {
    if (!initial) return;
    if (!confirm("この商品をアーカイブしますか？")) return;
    setLoading(true);
    const { error } = await supabase
      .from("items")
      .update({ archived: true })
      .eq("id", initial.id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/items");
    router.refresh();
  }

  const isCoin = category === "coin";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">区分</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory)}
            className="input"
          >
            <option value="coin">コイン</option>
            <option value="material">部材</option>
            <option value="tool">工具</option>
            <option value="finished">完成品</option>
          </select>
        </div>
        <div>
          <label className="label">追跡方法</label>
          <select
            value={trackingType}
            onChange={(e) => setTrackingType(e.target.value as TrackingType)}
            className="input"
          >
            <option value="individual">個体管理（1枚ずつ）</option>
            <option value="quantity">数量管理（在庫数）</option>
          </select>
          <p className="mt-1 text-xs text-brand-500">
            ヴィンテージコイン → 個体 ／ スチールウールやコーティング剤 → 数量
          </p>
        </div>
      </div>

      <div>
        <label className="label">名称</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder={isCoin ? "シックスペンス" : "スチールウール"}
        />
      </div>

      {isCoin && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">国</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="input"
              placeholder="イギリス"
            />
          </div>
          <div>
            <label className="label">額面</label>
            <input
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
              className="input"
              placeholder="6 pence"
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {trackingType === "quantity" && (
          <div>
            <label className="label">単位</label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="input"
              placeholder="個 / 枚 / ml"
            />
          </div>
        )}
        <div>
          <label className="label">単価（仕入原価）</label>
          <input
            type="number"
            min="0"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">在庫切れ警告水準</label>
          <input
            type="number"
            min="0"
            value={reorderPoint}
            onChange={(e) => setReorderPoint(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">メモ</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input min-h-20"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "保存中…" : initial ? "更新する" : "登録する"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            キャンセル
          </button>
        </div>
        {initial && (
          <button type="button" onClick={handleArchive} className="text-sm text-red-600">
            アーカイブ
          </button>
        )}
      </div>
    </form>
  );
}
