/**
 * 設定ごとの確率データ
 */
export interface SettingData {
  /** 設定 (1, 2, ..., 6 など) */
  setting: number;
  /** 確率分母 (例: 1/120なら 120) */
  denominator: number;
}

/**
 * カウント要素（子役・ボーナス）の定義
 */
export interface CounterElement {
  /** プログラム識別用ID (例: 'grape', 'reg_solo') */
  id: string;
  /** 表示名 (例: 'ぶどう', '単独REG') */
  name: string;
  /** ボーナスかどうか */
  isBonus?: boolean;
  /** 親要素ID（この要素が別の要素の内訳である場合） */
  parentId?: string;
  /** 各設定ごとの確率データ */
  probabilities: SettingData[];
}

/**
 * 機種の定義
 */
export interface MachineData {
  /** 機種ID */
  id: string;
  /** 機種名 */
  machineName: string;
  /** メーカー */
  maker: string;
  /** 存在する設定リスト (例: [1, 2, 3, 4, 5, 6]) */
  settings: number[];
  /** カウントする要素のリスト */
  elements: CounterElement[];
}

/**
 * カウント状態
 */
export type Counts = Record<string, number>;

/**
 * アプリの状態
 */
export interface AppState {
  /** 選択中の機種 */
  currentMachine: MachineData | null;
  /** 打ち始めゲーム数 */
  startGames: number;
  /** 現在ゲーム数 */
  currentGames: number;
  /** 要素ごとのカウント */
  counts: Counts;
  /** 推測計算から無視する要素 */
  ignoredElements: Record<string, boolean>;
  /** マイナスモード */
  minusMode: boolean;
  /** 設定表示モード */
  showSettings: boolean;
}

/**
 * 設定推測結果（1件分）
 */
export interface SettingEstimation {
  setting: number;
  percentage: number; // 0〜100
}

/**
 * 設定推測結果（全設定分）
 */
export type EstimationResult = SettingEstimation[];

/**
 * ローカルストレージに保存するデータ
 */
export interface StorageData {
  machineId: string;
  startGames: number;
  currentGames: number;
  counts: Counts;
  ignoredElements?: Record<string, boolean>;
  timestamp: number;
}
