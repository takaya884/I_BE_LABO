# I.BE LABO 在庫管理システム

コインリング体験ワークショップ向けの在庫管理 SaaS。
**マルチテナント (本部 → 店舗) 対応**で、フランチャイズ展開を前提に設計しています。

> 構想・設計の全体像は [`inventory-system-concept.md`](./inventory-system-concept.md) を参照。

---

## 機能 (MVP)

- 商品マスタ（コイン / 部材 / 工具 / 完成品）
- 個体管理（コイン1枚＝1レコード、写真添付）と数量管理を1つのスキーマで両立
- 入庫 / 出庫 / 棚卸調整の登録（履歴は append-only）
- 在庫一覧（在庫切れ警告つき）
- 体験メニュー + BOM（部品構成表）
- **「体験を実施」ボタンで BOM 分の在庫を一括消費**（DB 関数 `consume_experience`）
- ダッシュボード（KPI / アラート / 直近履歴）
- 認証（Supabase Auth、メール+パスワード）
- スマホ対応レスポンシブ UI

---

## 技術スタック

| | |
|---|---|
| フレームワーク | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS |
| DB / 認証 / Storage | Supabase (PostgreSQL) |
| ホスティング想定 | Vercel |

バックエンドサーバーは別途用意せず、Next.js の Server Components / API を Vercel 上で動かす構成です。

---

## セットアップ

### 1. Supabase プロジェクトを作る

1. https://supabase.com にサインアップ → 新規プロジェクト作成
2. Project Settings → API から URL と anon key を控える
3. Project Settings → Storage で **`coin-photos` バケット** を作成（Public 推奨）

### 2. DB マイグレーション適用

Supabase Dashboard の SQL Editor で、順番に貼り付けて実行：

```
supabase/migrations/0001_init.sql   ← スキーマ + RLS + RPC
supabase/migrations/0002_seed.sql   ← (任意) サンプルデータ
```

> CLI を使う場合：`supabase db push` でも可。

### 3. 環境変数

```bash
cp .env.example .env.local
# 取得した値を埋める
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. 起動

```bash
npm install
npm run dev
# → http://localhost:3000
```

### 5. 初回ログイン

1. `/login` で **新規登録**（メール + パスワード）
2. （Supabase 設定で email confirmation を OFF にしておくとスムーズ）
3. 自動的に `/onboarding` に遷移 → 本部・店舗を作成
4. ダッシュボードへ

> シードデータの店舗 (`名古屋本店`) を再利用したい場合は、onboarding でテナント名 / 店舗名を一致させてください（既存があれば再利用される）。

---

## ディレクトリ構成

```
app/
  (app)/                 認証必須の店舗運用画面
    page.tsx             ダッシュボード
    items/               商品マスタ
    units/               コイン個体
    stock/               在庫一覧
    movements/           入出庫履歴・登録
    menus/               体験メニュー + BOM
    consume/             体験を実施（一括消費）
  login/                 ログイン
  onboarding/            初期セットアップ
components/              フォーム・共通UI
lib/
  supabase/              Supabase クライアント (server / client / middleware)
  auth.ts                認証ガード
  types.ts               ドメイン型
  utils.ts               フォーマッタ等
supabase/
  migrations/            DDL + シード
middleware.ts            認証ミドルウェア
```

---

## 主な DB テーブル

| テーブル | 役割 |
|---|---|
| `tenants` / `stores` | FC 本部・店舗（マルチテナント） |
| `profiles` | Supabase ユーザーと店舗の紐付け（role 管理） |
| `items` | 商品マスタ（`tracking_type` で個体/数量） |
| `item_units` | コイン1枚=1レコードの個体 |
| `stock_balances` | 数量管理品の在庫（トリガー自動更新） |
| `stock_movements` | append-only 履歴 |
| `experience_menus` / `boms` | 体験メニューと部品構成 |

RLS で `current_tenant_id()` スコープを強制 → 店舗を超えたデータアクセスが起きません。

`consume_experience(menu_id, store_id, unit_overrides)` RPC が「体験 1 件実施」のコア処理。BOM を辿って必要分の在庫を一括消費します。

---

## 次にやること（Phase 2 以降）

- 役割別権限の細分化（`tenant_admin` / `store_manager` / `staff`）
- 店舗間在庫移動 UI
- 本部ダッシュボード（全店横断 KPI）
- 予約システム連携（体験予約時に在庫を仮押さえ）
- 仕入先マスタ + 発注書発行
- レシート / 売上レポート（会計ソフト連携）
- EC 在庫共有

---

## ライセンス

I.BE LABO 専用。社外配布禁止。
