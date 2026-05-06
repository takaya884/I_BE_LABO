import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "I.BE LABO 在庫管理",
  description: "コインリング体験ワークショップ向け 在庫管理システム",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
