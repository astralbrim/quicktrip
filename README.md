# ちょいでかけ (QuickTrip) - Phase 1

地元の人のためのカジュアルなお出かけ先検索サービス

## 📋 実装完了機能（Phase 1）

- ✅ モノレポセットアップ（Turborepo + pnpm）
- ✅ バックエンドAPI（Hono + Cloudflare Workers + D1）
- ✅ ユーザー認証（メール/パスワード + NextAuth）
- ✅ 基本的な地図表示（Leaflet + React Leaflet）
- ✅ 現在地取得・30分圏内検索
- ✅ 検索履歴機能
- ✅ レスポンシブデザイン

## 🚀 ローカル開発環境の起動

### 1. 依存関係のインストール
```bash
pnpm install
```

### 2. 共有パッケージのビルド
```bash
npx turbo build --filter=@quicktrip/shared
```

### 3. バックエンドAPIの起動
```bash
# 別のターミナルで実行
cd apps/api
pnpm dev
```
➜ APIサーバー: http://localhost:8787

### 4. フロントエンドの起動
```bash
# 新しいターミナルで実行
cd apps/web
pnpm dev
```
➜ Webアプリ: http://localhost:3000

## 🧪 動作確認手順

1. **アカウント作成**
   - http://localhost:3000 にアクセス
   - 「新規登録」からアカウントを作成

2. **ログイン**
   - 作成したアカウントでログイン

3. **地図表示確認**
   - 位置情報の許可を求められたら「許可」をクリック
   - 現在地が地図の中心に表示される
   - 30分圏内にモックスポット（東京スカイツリー、上野公園、スターバックス）が表示される

4. **検索機能確認**
   - 時間や移動手段を変更して「検索」ボタンをクリック
   - 地図上のマーカーをクリックして詳細ポップアップを確認

## 🛠️ 技術スタック

### フロントエンド
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- NextAuth.js
- React Leaflet
- Zustand
- TanStack Query

### バックエンド
- Hono
- Cloudflare Workers
- Cloudflare D1 (SQLite)
- Prisma
- JWT認証

### 開発ツール
- Turborepo
- pnpm
- ESLint
- Prettier

## 📁 プロジェクト構造

```
quicktrip/
├── apps/
│   ├── web/          # Next.js フロントエンド
│   └── api/          # Hono バックエンド
├── packages/
│   └── shared/       # 共通型定義・定数
├── CLAUDE.md         # AI開発者向けガイド
└── README.md         # このファイル
```

## 🔧 開発コマンド

```bash
# 全体のビルド
pnpm build

# 全体の開発サーバー起動
pnpm dev

# リント
pnpm lint

# 型チェック
pnpm type-check

# フォーマット
pnpm format
```

## 📝 次のフェーズ（Phase 2）の予定

- 詳細フィルター機能
- リスト表示切り替え
- カテゴリー別表示
- UIの改善
- 実際の外部API連携（現在はモックデータ）

## 🐛 トラブルシューティング

### ポート番号の競合
- API: ポート8787
- Web: ポート3000
これらのポートが使用中の場合は、プロセスを終了してから再起動してください。

### 位置情報が取得できない場合
- ブラウザで位置情報の許可を確認
- HTTPSでない場合は位置情報が取得できない場合があります（ローカル開発では問題なし）