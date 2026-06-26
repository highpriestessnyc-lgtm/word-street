# WORD STREET — Casa Shindy English App

英検5級から準1級まで対応の英語学習アプリ。

## 機能
- 20レベル × 8単語 = 160単語（類義語付き）
- 7モード：単語・クイズ・文章・会話・文法・長文読解・発音（プレミアム）
- 5キャラクター（SHIN/JAY/LUNA/REI/KODA）レベル解放
- XP・バッジ・進捗バー
- localStorage でセーブデータ保持

## デプロイ手順

### 1. GitHubにpush
```bash
cd word-street
git init
git add .
git commit -m "init: Word Street v1.0"
git remote add origin https://github.com/highpriestessnyc-lgtm/word-street.git
git push -u origin main
```

### 2. Vercelでデプロイ
1. vercel.com → New Project
2. Import from GitHub: `highpriestessnyc-lgtm/word-street`
3. Framework: Next.js (自動検出)
4. Deploy ボタン

### 3. ローカル開発
```bash
npm install
npm run dev
# → http://localhost:3000
```

## プレミアム課金実装（Stripe）
1. `NEXT_PUBLIC_STRIPE_KEY` を Vercel 環境変数に追加
2. `/src/app/api/checkout/route.ts` を追加（Stripe Checkout）
3. プレミアムウォールの購入ボタンを Stripe Checkout にリンク

## ブランド
Casa Shindy — casashindy.com
