"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tenantName, setTenantName] = useState("I.BE LABO 本部");
  const [storeName, setStoreName] = useState("名古屋本店");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (existing) {
      router.push("/");
      return;
    }

    const { error: rpcErr } = await supabase.rpc("bootstrap_tenant", {
      p_tenant_name: tenantName,
      p_store_name: storeName,
    });
    if (rpcErr) {
      setError(rpcErr.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="auth-bg flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-coin-500 to-coin-600 text-2xl text-white shadow-glow">
            ✨
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            初期設定
          </h1>
          <p className="mt-2 text-sm text-brand-500">
            まずは本部（テナント）と最初の店舗を作成します
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8">
          <div>
            <label className="label">本部 / 法人名</label>
            <input
              type="text"
              required
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">店舗名</label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="input"
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
            {loading ? "作成中…" : "次へ進む"}
          </button>
        </form>
      </div>
    </main>
  );
}
