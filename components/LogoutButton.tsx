"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (compact) {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        title="ログアウト"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
      >
        <span className="text-lg">⏻</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="btn-secondary w-full justify-center text-brand-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
    >
      <span>⏻</span>
      <span>{loading ? "ログアウト中…" : "ログアウト"}</span>
    </button>
  );
}
