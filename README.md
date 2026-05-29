
# README.MD

## ディレクトリ構成

このリポジトリは、フロントエンドとバックエンドAPIを分けた構成になっています。

```text
citrus-app/
├── frontend/                  # Next.js フロントエンド
│   ├── app/                   # App Router のページ・グローバルCSS
│   │   ├── 1_Top/             # Topページ
│   │   │   └── page.tsx
│   │   ├── 2_Input/           # 好み入力ページ
│   │   │   └── page.tsx
│   │   ├── 3_Output/          # 推薦結果ページ
│   │   │   └── page.tsx
│   │   ├── globals.css        # アプリ全体のCSS
│   │   ├── layout.tsx         # 全ページ共通レイアウト
│   │   └── page.tsx           # ルートページ
│   │
│   ├── components/            # 再利用コンポーネント
│   │   ├── CitrusImage.tsx    # 柑橘画像表示コンポーネント
│   │   ├── InputTasteRadarChart.tsx
│   │   │                       # 入力中の好みを表示するレーダーチャート
│   │   └── TasteRadarChart.tsx
│   │                           # 結果画面・Topサンプル用レーダーチャート
│   │
│   ├── lib/                   # フロントエンド共通ロジック
│   │   ├── context.tsx        # アプリ状態管理
│   │   └── types.ts           # フロントエンド共通型定義
│   │
│   ├── public/                # 静的ファイル
│   │   └── other_images/      # Topアイコン、背景画像、no image など
│   │
│   ├── package.json           # frontend の依存関係・npm scripts
│   └── next.config.ts         # Next.js 設定
│
├── worker/                    # Cloudflare Workers バックエンド
│   ├── src/                   # Worker のソースコード
│   │   └── routes/            # APIルート・推薦計算ロジック
│   │
│   ├── package.json           # worker の依存関係・npm scripts
│   └── wrangler.toml          # Cloudflare Workers 設定
│
├── README.md                  # プロジェクト説明
└── .gitignore


## Cloudflare 構成

- Cloudflare Pages
    - frontend を配信する場所

- Cloudflare Workers
    - APIと推薦計算を動かす場所

- Cloudflare D1
    - 品種データやクリックログを保存する場所

- Cloudflare R2
    - 将来的に大量の柑橘画像や静的素材を置く場所

## 開発時によく使うコマンド

### frontend

```bash
# frontend ディレクトリへ移動
cd frontend

# ESLintでコード品質・構文・Next.jsの警告を確認する
npm run lint

# 本番用にビルドできるか確認する
npm run build

# ローカル開発サーバーを起動する
# 通常は http://localhost:3000 で確認できる
npm run dev

# worker ディレクトリへ移動
cd worker

# TypeScriptの型チェックを行う
# Cloudflare Worker側の型エラーを事前に確認する
npx tsc --noEmit

# Cloudflare Workersへデプロイする
# wrangler.toml の設定に基づいてデプロイされる
npx wrangler deploy

---
# 協調フィルタリングの計算ロジック

「あなたの好み（6項目）」に似た入力をした過去の人たちが、実際に反応（購入リンクをクリック）した柑橘を上位に出す推薦です。
厳密なユーザーIDの協調フィルタリングではなく、「入力の近さ」を使って“似た人”を近似します。

## 入力
6つの好み（甘さ/酸味/苦味/香り/ジューシーさ/食感）を 1〜6 で入力
これを 6次元ベクトル x とみなします
## 過去ログ（学習データの代わり）
過去の各セッションには次が保存されています。

そのときの入力（6項目）
提示された上位3件の柑橘
各順位について、購入リンク（Amazon/楽天/ふるさと納税）のどれかがクリックされたか
ここで「その順位のリンクが1つでもクリックされていれば liked=1、なければ 0」として扱います。

## 計算手順（要点）
- 新しい入力 x と、過去の各入力 x_i の距離（ユークリッド距離）を計算
- 距離を類似度に変換（近いほど大きい値）
    - similarity = 1 / (1 + distance)
- 類似度が高い過去ログ上位 k 件だけを使用（近傍を絞ってノイズを減らす）
- 各柑橘ごとに、類似度で重み付けした liked の平均をスコアにする
    - score(item) = Σ(similarity * liked) / Σ(similarity)
- スコア上位3件を結果として返す