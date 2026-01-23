# Slotlight 開発コンテキスト

## プロジェクト概要
スロット機の子役カウンター PWA アプリ。スマホ横向きでの利用を想定。

## 技術スタック
- Svelte 5 + TypeScript
- Vite 7
- Tailwind CSS (v4, @tailwindcss/vite)
- PWA (vite-plugin-pwa)

## 主要機能

### 1. 子役カウンター
- タップで+1、右クリック/長押しで-1
- マイナスモード：ONにすると加算/減算が反転
- 総回転数の+10/+100/+1000ボタン

### 2. 設定推測（ベイズ推定）
- `src/lib/logic.ts` に計算ロジック
- 対数尤度 + Log-Sum-Exp Trick でアンダーフロー対策
- 各設定の確率（%）をバーグラフで表示

### 3. 設定表示
- 各カウンターカードに推測設定バッジを表示
- 設定差がある要素のみ対象

## ファイル構成
```
src/
├── App.svelte              # メインコンポーネント
├── app.css                 # Tailwind CSS エントリ
├── main.ts                 # エントリポイント
└── lib/
    ├── logic.ts            # 設定推測ロジック（ベイズ推定）
    ├── estimation.ts       # getClosestSetting（最近接設定判定）
    ├── store.ts            # Svelte store
    ├── types.ts            # 型定義
    ├── machines.ts         # 機種データローダー
    ├── data/
    │   └── machines.json   # 機種データ（JSON）
    └── components/
        ├── CounterScreen.svelte  # メイン画面（横向きUI）
        ├── MachineSelect.svelte  # 機種選択画面
        └── (旧コンポーネント多数 - 未使用)
```

## 型定義 (src/lib/types.ts)
```typescript
interface SettingData {
  setting: number;      // 設定番号
  denominator: number;  // 確率分母
}

interface CounterElement {
  id: string;
  name: string;
  isBonus?: boolean;
  parentId?: string;    // 親要素ID（内訳の場合）
  probabilities: SettingData[];
}

interface MachineData {
  id: string;
  machineName: string;
  maker: string;
  settings: number[];   // [1,2,3,4,5,6] など
  elements: CounterElement[];
}

interface SettingEstimation {
  setting: number;
  percentage: number;   // 0-100
}

type EstimationResult = SettingEstimation[];
```

## 機種データ形式 (machines.json)
```json
[
  {
    "id": "my-juggler-v",
    "machineName": "マイジャグラーV",
    "maker": "北電子",
    "settings": [1, 2, 3, 4, 5, 6],
    "elements": [
      {
        "id": "grape",
        "name": "ぶどう",
        "probabilities": [
          { "setting": 1, "denominator": 5.98 },
          ...
        ]
      }
    ]
  }
]
```

## GitHub Pages デプロイ

### 設定済み
- `.github/workflows/deploy.yml` - GitHub Actions ワークフロー
- `vite.config.ts` に `base: '/slotlight/'` を設定

### 未完了
- リポジトリがプライベートのため GitHub Pages が利用不可
- 公開リポジトリに変更するか、GitHub Pro が必要

### デプロイ後のURL
```
https://yoohya.github.io/slotlight/
```

## 次のステップ
1. リポジトリを公開に変更（または GitHub Pro へアップグレード）
2. GitHub Pages を有効化:
   ```bash
   gh api repos/yoohya/slotlight/pages -X POST -f build_type=workflow
   ```
3. Actions が自動実行されてデプロイ完了

## UI の特徴
- ダークテーマ（黒/ダークグレー）
- 横向きレイアウト（3列×2行グリッド）
- ヘッダー: 戻るボタン、機種名、トグルスイッチ（±/推測）、設定ボタン、総回転数、リセット
- サイドパネル: 設定推測結果（トグルで表示/非表示）

## コマンド
```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run preview  # ビルド結果プレビュー
```
