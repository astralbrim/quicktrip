# CLAUDE.md

このファイルは、このリポジトリでClaude Code (claude.ai/code)がコードを扱う際のガイダンスを提供します。

## プロジェクト概要

ちょいでかけ (QuickTrip) は、地元の人が指定した時間内で行ける場所を探すことができるモバイルファーストのWebアプリケーションです。徒歩、電車、車、バスなど異なる移動手段を使って、現在地から指定時間内に到達可能なスポットを検索できます。

## アーキテクチャ

このプロジェクトはモノレポ構成で、以下の構造になっています：
- **フロントエンド**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui (apps/web)
- **バックエンド**: Hono + Cloudflare Workers + D1データベース (apps/api)
- **共通**: 共通の型定義とユーティリティ (packages/shared)
- **モノレポ管理**: Turborepo + pnpm

## 開発コマンド

### 初期セットアップ
```bash
# 依存関係のインストール
pnpm install

# 全パッケージのビルド
pnpm build

# 開発サーバーの起動
pnpm dev
```

### フロントエンド (apps/web)
```bash
# 開発サーバー
cd apps/web && pnpm dev

# ビルド
cd apps/web && pnpm build

# 型チェック
cd apps/web && pnpm type-check

# リント
cd apps/web && pnpm lint
```

### バックエンド (apps/api)
```bash
# 開発サーバー
cd apps/api && pnpm dev

# Cloudflareへのデプロイ
cd apps/api && pnpm deploy

# データベースマイグレーション
cd apps/api && pnpm db:migrate

# データベースリセット
cd apps/api && pnpm db:reset
```

## 技術スタック詳細

### フロントエンド技術
- **フレームワーク**: Next.js 14 (App Router)
- **認証**: NextAuth.js (メール/パスワード + Google/GitHub OAuth)
- **地図**: Leaflet + React Leaflet
- **状態管理**: Zustand
- **データフェッチ**: TanStack Query
- **フォーム**: React Hook Form + Zod バリデーション
- **UIコンポーネント**: shadcn/ui (Radix UI ベース)
- **デプロイ**: Vercel

### バックエンド技術
- **フレームワーク**: Hono (軽量Webフレームワーク)
- **ランタイム**: Cloudflare Workers
- **データベース**: Cloudflare D1 (SQLite)
- **ORM**: Prisma (D1アダプター使用)
- **認証**: JWT トークン (jose ライブラリ)
- **デプロイ**: Cloudflare Workers

### 外部API
- **地図タイル**: OpenStreetMap
- **ジオコーディング**: Nominatim API
- **ルート計算**: OpenRouteService API
- **場所データ**: Overpass API (OpenStreetMap)

## データベース設計

### ユーザー管理
- **User**: id、email、password（OAuth用にnullable）、name、provider、タイムスタンプ
- **SearchHistory**: userId、検索パラメータ（時間、移動手段、位置、フィルター）、タイムスタンプ
- **Favorite**: userId、placeId、場所の詳細、タイムスタンプ

## 主要機能

### コア検索機能
- 時間ベースの場所検索（10分、30分、1時間、2時間のプリセット）
- 移動手段: 徒歩、電車、車、バス
- 営業時間に基づくリアルタイム場所フィルタリング
- カテゴリーベースフィルタリング（観光スポット、レジャー、公園、レストラン、カフェ）

### ユーザーエクスペリエンス
- モバイルファーストのレスポンシブデザイン
- 現在地自動取得（失敗時は住所入力にフォールバック）
- 地図表示とリスト表示の切り替え
- 検索履歴の永続化（直近5件）
- OAuth統合によるユーザーアカウント

## 開発フェーズ

### Phase 1 (MVP - 1週間目)
- ユーザー認証（メール/パスワード + Google OAuth）
- 30分圏内検索による基本地図表示
- 検索履歴保存
- レスポンシブレイアウト

### Phase 2 (2週間目)
- 高度なフィルタリング（時間、料金、設備）
- リスト/地図表示切り替え
- カテゴリー別表示
- UI改善

### Phase 3 (3週間目)
- お気に入り機能
- 住所検索
- PWAサポート
- パフォーマンス最適化

## ファイル構成

### フロントエンド構造 (apps/web)
- `app/`: Next.js App Routerページ
  - `(auth)/`: 認証ページ
  - `(main)/`: メインアプリケーションページ
  - `api/`: NextAuth APIルート
- `components/`: Reactコンポーネント
  - `ui/`: shadcn/uiコンポーネント
  - `map/`: 地図関連コンポーネント
  - `layout/`: レイアウトコンポーネント
- `hooks/`: カスタムReactフック
- `stores/`: Zustand状態ストア
- `lib/`: ユーティリティと設定

### バックエンド構造 (apps/api)
- `src/routes/`: APIルートハンドラー（auth、places、users）
- `src/middleware/`: 認証とCORSミドルウェア
- `src/services/`: ビジネスロジックサービス
- `prisma/`: データベーススキーマとマイグレーション

### 共有パッケージ (packages/shared)
- `types/`: 共通TypeScript型定義
- `constants/`: 共有定数と設定

## 環境変数

### フロントエンド (.env.local)
- NEXTAUTH_URL、NEXTAUTH_SECRET
- GOOGLE_CLIENT_ID、GOOGLE_CLIENT_SECRET
- GITHUB_CLIENT_ID、GITHUB_CLIENT_SECRET
- NEXT_PUBLIC_API_URL

### バックエンド (.dev.vars)
- JWT_SECRET
- OPENROUTESERVICE_API_KEY

## テストと品質管理

- ESLint + Prettier によるコード整形
- TypeScript による型安全性
- Zod によるランタイムバリデーション
- React Hook Form によるフォームバリデーション
- パフォーマンス目標: 初期読み込み3秒未満、検索結果2秒未満

## デプロイ

- **フロントエンド**: Vercel（GitHub連携）
- **バックエンド**: Cloudflare Workers
- **データベース**: Cloudflare D1
- **監視**: Cloudflare組み込み分析