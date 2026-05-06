"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fn =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error } = await fn;
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="auth-bg flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 text-2xl text-white shadow-glow">
            💍
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
            I.BE LABO 在庫管理
          </h1>
          <p className="mt-2 text-sm text-brand-500">
            コインリング体験ワークショップのための在庫管理
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-brand-100/70 p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === "signin"
                  ? "bg-white text-brand-900 shadow-sm"
                  : "text-brand-500 hover:text-brand-700"
              }`}
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === "signup"
                  ? "bg-white text-brand-900 shadow-sm"
                  : "text-brand-500 hover:text-brand-700"
              }`}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">メールアドレス</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">パスワード</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                placeholder="6文字以上"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
              {loading ? "処理中…" : mode === "signin" ? "ログインする" : "アカウント作成"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-brand-500">
          © I.BE LABO Inventory
        </p>
      </div>
    </main>
  );
}
