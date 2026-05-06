"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ItemUnit, ItemUnitStatus } from "@/lib/types";

type ItemOption = {
  id: string;
  name: string;
  country: string | null;
  denomination: string | null;
};

type Props = {
  storeId: string;
  items: ItemOption[];
  initial?: ItemUnit;
};

export function ItemUnitForm({ storeId, items, initial }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [itemId, setItemId] = useState(initial?.item_id ?? items[0]?.id ?? "");
  const [serial, setSerial] = useState(initial?.serial ?? "");
  const [year, setYear] = useState(initial?.year?.toString() ?? "");
  const [condition, setCondition] = useState(initial?.condition ?? "");
  const [cost, setCost] = useState(initial?.acquisition_cost?.toString() ?? "");
  const [acquiredAt, setAcquiredAt] = useState(initial?.acquired_at ?? "");
  const [status, setStatus] = useState<ItemUnitStatus>(initial?.status ?? "in_stock");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let photoUrl = initial?.photo_url ?? null;
    if (photoFile) {
      const path = `${storeId}/${itemId}/${Date.now()}-${photoFile.name}`;
      const { error: upErr } = await supabase.storage
        .from("coin-photos")
        .upload(path, photoFile, { upsert: false });
      if (upErr) {
        setError(`写真アップロード失敗: ${upErr.message}`);
        setLoading(false);
        return;
      }
      const { data } = supabase.storage.from("coin-photos").getPublicUrl(path);
      photoUrl = data.publicUrl;
    }

    const payload = {
      item_id: itemId,
      store_id: storeId,
      serial: serial || null,
      year: year ? Number(year) : null,
      condition: condition || null,
      acquisition_cost: cost ? Number(cost) : null,
      acquired_at: acquiredAt || null,
      status,
      photo_url: photoUrl,
      notes: notes || null,
    };

    const { error } =
      initial != null
        ? await supabase.from("item_units").update(payload).eq("id", initial.id)
        : await supabase.from("item_units").insert(payload);

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/units");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">商品</label>
        <select
          required
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          className="input"
        >
          {items.length === 0 && <option value="">まずは個体管理の商品を作成してください</option>}
          {items.map((it) => (
            <option key={it.id} value={it.id}>
              {it.name}
              {it.country ? ` (${it.country}` : ""}
              {it.denomination ? ` ${it.denomination}` : ""}
              {it.country ? ")" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label">年号</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="input"
            placeholder="1962"
          />
        </div>
        <div>
          <label className="label">状態（質）</label>
          <input
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="input"
            placeholder="mint / fine / worn"
          />
        </div>
        <div>
          <label className="label">管理番号</label>
          <input
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label">仕入価格</label>
          <input
            type="number"
            min="0"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">取得日</label>
          <input
            type="date"
            value={acquiredAt}
            onChange={(e) => setAcquiredAt(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">ステータス</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ItemUnitStatus)}
            className="input"
          >
            <option value="in_stock">在庫</option>
            <option value="reserved">予約</option>
            <option value="consumed">消費済</option>
            <option value="lost">紛失</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">写真（任意）</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        {initial?.photo_url && (
          <a
            href={initial.photo_url}
            target="_blank"
            rel="noreferrer"
            className="ml-2 text-xs text-brand-500 hover:underline"
          >
            現在の写真を見る
          </a>
        )}
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
