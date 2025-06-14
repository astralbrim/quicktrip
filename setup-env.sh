#!/bin/bash

# QuickTrip環境変数セットアップスクリプト

echo "🚀 QuickTrip環境変数セットアップ"
echo "================================="

# バックエンド環境変数の設定
echo "📡 バックエンドAPI環境変数を設定中..."
if [ ! -f "apps/api/.dev.vars" ]; then
    cp apps/api/.dev.vars.example apps/api/.dev.vars
    echo "✅ apps/api/.dev.varsファイルを作成しました"
else
    echo "⚠️  apps/api/.dev.varsファイルは既に存在します"
fi

# フロントエンド環境変数の設定
echo "🖥️  フロントエンド環境変数を設定中..."
if [ ! -f "apps/web/.env.local" ]; then
    cat > apps/web/.env.local << 'EOF'
# NextAuth設定
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-change-this

# OAuth設定（オプション）
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GITHUB_CLIENT_ID=your-github-client-id
# GITHUB_CLIENT_SECRET=your-github-client-secret

# API URL
NEXT_PUBLIC_API_URL=http://localhost:8787
EOF
    echo "✅ apps/web/.env.localファイルを作成しました"
else
    echo "⚠️  apps/web/.env.localファイルは既に存在します"
fi

echo ""
echo "🎉 環境変数セットアップ完了!"
echo ""
echo "📝 次のステップ:"
echo "1. apps/api/.dev.vars でJWT_SECRETを設定"
echo "2. （オプション）OpenRouteService APIキーを取得・設定"
echo "3. apps/web/.env.local でNEXTAUTH_SECRETを設定"
echo "4. 開発サーバーを起動: pnpm dev"
echo ""
echo "🔗 OpenRouteService APIキー取得: https://openrouteservice.org/"
echo "🔗 詳細なセットアップ手順: apps/api/README.md"