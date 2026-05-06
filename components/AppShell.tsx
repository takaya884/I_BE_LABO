"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";

type NavItem = { href: string; label: string; icon: string };

const navItems: NavItem[] = [
  { href: "/", label: "ダッシュボード", icon: "📊" },
  { href: "/items", label: "商品マスタ", icon: "📦" },
  { href: "/units", label: "コイン個体", icon: "🪙" },
  { href: "/stock", label: "在庫一覧", icon: "📋" },
  { href: "/movements", label: "入出庫履歴", icon: "🔄" },
  { href: "/menus", label: "体験メニュー", icon: "💍" },
  { href: "/consume", label: "体験を実施", icon: "✨" },
];

type Props = {
  storeName: string;
  displayName: string | null;
  role: string;
  children: React.ReactNode;
};

export function AppShell({ storeName, displayName, role, children }: Props) {
  const pathname = usePathname();
  // デスクトップ折りたたみ状態
  const [collapsed, setCollapsed] = useState(false);
  // モバイルドロワー
  const [mobileOpen, setMobileOpen] = useState(false);

  // 復元/保存
  useEffect(() => {
    const saved = localStorage.getItem("ibelabo:sidebarCollapsed");
    if (saved === "1") setCollapsed(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("ibelabo:sidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // ルート変更でモバイルドロワーは閉じる
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarWidth = collapsed ? "md:w-20" : "md:w-64";

  return (
    <div className="min-h-screen bg-brand-50">
      {/* モバイルヘッダー */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-100 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="メニューを開く"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-200 text-brand-700 hover:bg-brand-50"
        >
          <span className="text-xl leading-none">☰</span>
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-accent-600">I.BE LABO</p>
          <p className="text-sm font-semibold text-brand-900">{storeName}</p>
        </div>
        <div className="h-10 w-10" />
      </header>

      {/* モバイル用オーバーレイ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-brand-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <div className="md:flex">
        {/* サイドバー */}
        <aside
          className={[
            "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-brand-100 bg-white shadow-xl transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
            "md:sticky md:top-0 md:z-10 md:h-screen md:translate-x-0 md:shadow-none",
            sidebarWidth,
          ].join(" ")}
        >
          {/* ロゴ + 折りたたみ */}
          <div className="flex items-center justify-between border-b border-brand-100 px-4 py-4">
            <Link
              href="/"
              className={`flex items-center gap-3 ${collapsed ? "md:justify-center md:gap-0" : ""}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 text-lg text-white shadow-glow">
                💍
              </div>
              <div className={collapsed ? "md:hidden" : ""}>
                <p className="text-[10px] uppercase tracking-wider text-accent-600">I.BE LABO</p>
                <p className="truncate text-sm font-semibold text-brand-900">{storeName}</p>
              </div>
            </Link>

            {/* モバイル: 閉じる */}
            <button
              onClick={() => setMobileOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-500 hover:bg-brand-100 md:hidden"
              aria-label="メニューを閉じる"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </div>

          {/* ナビ */}
          <nav className="flex-1 overflow-y-auto p-3">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={[
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                        active
                          ? "bg-gradient-to-r from-accent-50 to-transparent text-accent-700 shadow-sm ring-1 ring-accent-100"
                          : "text-brand-700 hover:bg-brand-50",
                        collapsed ? "md:justify-center md:px-2" : "",
                      ].join(" ")}
                    >
                      <span className="text-lg leading-none">{item.icon}</span>
                      <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* フッター: ユーザー情報 + ログアウト */}
          <div className="border-t border-brand-100 p-3">
            <div
              className={`mb-3 rounded-lg bg-brand-50 p-3 ${collapsed ? "md:hidden" : ""}`}
            >
              <p className="truncate text-sm font-medium text-brand-900">
                {displayName ?? "ユーザー"}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-accent-600">
                {role}
              </p>
            </div>

            {collapsed ? (
              <div className="hidden flex-col items-center gap-2 md:flex">
                <LogoutButton compact />
              </div>
            ) : (
              <LogoutButton />
            )}

            {/* デスクトップ: 折りたたみトグル */}
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="mt-2 hidden w-full items-center justify-center gap-2 rounded-lg border border-brand-200 px-2 py-2 text-xs text-brand-500 hover:bg-brand-50 md:flex"
              title={collapsed ? "メニューを開く" : "メニューを閉じる"}
            >
              <span className="text-base leading-none">{collapsed ? "›" : "‹"}</span>
              <span className={collapsed ? "md:hidden" : ""}>サイドメニューを閉じる</span>
            </button>
          </div>
        </aside>

        {/* メイン */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
