# Slotlight

パチスロの子役カウンター＆設定推測PWAアプリ

## 概要

Slotlightは、パチスロ（主にジャグラーシリーズ）の子役をカウントし、ベイズ推定を用いて設定を推測するWebアプリケーションです。PWA対応のため、スマートフォンのホーム画面に追加してネイティブアプリのように使用できます。

**Demo**: https://yoohya.github.io/slotlight/

## 機能

- **子役カウント**: ぶどう、チェリー、BIG、REGなどをタップでカウント
- **設定推測**: ベイズ推定による設定1〜6の確率表示
- **確率表示**: 実測確率をリアルタイムで計算・表示
- **確率表**: 各機種の設定別確率を一覧表示
- **ゲーム数管理**: 打ち始め・現在ゲーム数から総回転数を自動計算
- **データ保存**: ローカルストレージに自動保存、ブラウザを閉じても継続可能
- **PWA対応**: オフライン動作、ホーム画面への追加が可能
- **レスポンシブ**: 横画面・縦画面両対応

## 対応機種

- マイジャグラーV
- アイムジャグラーEX
- ファンキージャグラー2
- ゴーゴージャグラー3
- ハッピージャグラーVⅢ

## 技術スタック

- [Svelte 5](https://svelte.dev/) - UIフレームワーク
- [TypeScript](https://www.typescriptlang.org/) - 型安全な開発
- [Vite](https://vitejs.dev/) - ビルドツール
- [Tailwind CSS v4](https://tailwindcss.com/) - スタイリング
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) - PWA対応

## 開発

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## PWAとしてインストール

### iPhone/iPad
1. Safariで https://yoohya.github.io/slotlight/ を開く
2. 共有ボタン（□に↑）をタップ
3. 「ホーム画面に追加」を選択

### Android
1. Chromeで https://yoohya.github.io/slotlight/ を開く
2. メニューから「ホーム画面に追加」または「アプリをインストール」を選択

## ライセンス

MIT
