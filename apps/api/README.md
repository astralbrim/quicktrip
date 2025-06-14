# QuickTrip API

QuickTripアプリケーションのバックエンドAPI（Cloudflare Workers + Hono）

## 環境変数の設定

### 1. 環境変数ファイルの作成

```bash
# .dev.vars.exampleをコピーして設定ファイルを作成
cp .dev.vars.example .dev.vars
```

### 2. 必要な環境変数

#### JWT_SECRET（必須）
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```
- ユーザー認証用のJWT秘密鍵
- 本番環境では強力な秘密鍵を使用してください

#### OPENROUTESERVICE_API_KEY（オプション）
```
OPENROUTESERVICE_API_KEY=your-openrouteservice-api-key-here
```
- 正確な移動時間計算のために使用
- 設定しない場合は距離ベースの推定値を使用
- **取得方法**: https://openrouteservice.org/ でアカウント作成
- 無料プランでは1日1000リクエストまで利用可能

**APIキーの有効化方法**:
```bash
# .dev.varsファイル内でコメントアウトを解除
# OPENROUTESERVICE_API_KEY=your-key-here
# ↓
OPENROUTESERVICE_API_KEY=your-key-here
```

#### DATABASE_URL（開発環境のみ）
```
DATABASE_URL="file:./dev.db"
```
- 開発環境用のローカルデータベース
- 本番環境ではCloudflare D1を使用

## セットアップ手順

### 1. 依存関係のインストール
```bash
pnpm install
```

### 2. 環境変数の設定
```bash
# 環境変数ファイルをコピー
cp .dev.vars.example .dev.vars

# .dev.varsファイルを編集して実際の値を設定
```

### 3. データベースのセットアップ
```bash
# データベースマイグレーション
pnpm db:migrate

# 初期データのシード（オプション）
pnpm db:seed
```

### 4. 開発サーバーの起動
```bash
pnpm dev
```

APIサーバーが `http://localhost:8787` で起動します。

## API仕様

### 認証エンドポイント
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/google` - Google OAuth

### 場所検索エンドポイント
- `POST /api/places/search` - 場所検索
- `GET /api/places/:id` - 場所詳細取得

### ユーザーエンドポイント
- `GET /api/users/profile` - プロフィール取得
- `POST /api/users/search-history` - 検索履歴保存
- `GET /api/users/search-history` - 検索履歴取得

## 外部API

### Overpass API（OpenStreetMap）
- **APIキー**: 不要
- **用途**: 実際の場所データの取得
- **制限**: リクエスト頻度制限あり
- **公式サイト**: https://overpass-api.de/

### OpenRouteService API
- **APIキー**: 必要（オプション）
- **用途**: 正確な移動時間・ルート計算
- **制限**: 無料プランで1日1000リクエスト
- **公式サイト**: https://openrouteservice.org/

## デプロイ

### Cloudflare Workersへのデプロイ
```bash
# 本番環境へのデプロイ
pnpm deploy
```

### 環境変数の設定（本番環境）
```bash
# Cloudflare Workersの環境変数を設定
wrangler secret put JWT_SECRET
wrangler secret put OPENROUTESERVICE_API_KEY
```

## トラブルシューティング

### Overpass API 400エラー
- クエリ構文エラーの可能性
- ネットワーク接続を確認
- 一時的なサーバー過負荷の場合は少し待ってから再試行

### OpenRouteService 401エラー
- APIキーが正しく設定されているか確認
- APIキーの有効性を確認
- レート制限に達していないか確認

### データベース接続エラー
- `.dev.vars`ファイルが存在するか確認
- データベースマイグレーションが実行されているか確認