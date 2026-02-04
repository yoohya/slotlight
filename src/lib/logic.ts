// logic.ts
import type { CounterElement, MachineData, SettingEstimation } from './types';

/**
 * 実際のカウント数を計算（現在カウント - 開始カウント）
 */
export function getActualCount(
  elementId: string,
  counts: Record<string, number>,
  startCounts: Record<string, number> = {}
): number {
  const current = counts[elementId] ?? 0;
  const start = startCounts[elementId] ?? 0;
  return Math.max(0, current - start);
}

/**
 * 要素のdenominatorTypeに応じたゲーム数を返す
 * denominatorElementIdが指定されている場合は、その要素のカウントを試行回数として使う
 */
export function getSpinsForElement(
  element: CounterElement,
  totalSpins: number,
  normalSpins: number,
  counts?: Record<string, number>,
  startCounts?: Record<string, number>
): number {
  if (element.denominatorElementId && counts) {
    return getActualCount(element.denominatorElementId, counts, startCounts);
  }
  switch (element.denominatorType) {
    case 'normal':
      return normalSpins;
    case 'at':
      return Math.max(0, totalSpins - normalSpins);
    case 'total':
      return totalSpins;
    default:
      // denominatorType未指定の場合はtotalSpinsを使用（後方互換）
      return totalSpins;
  }
}

/**
 * ベイズ推定を用いて設定期待度を計算する
 * @param machineData 機種データ
 * @param totalSpins 総回転数 (通常時+AT時)
 * @param normalSpins 通常時ゲーム数
 * @param counts 各要素のカウント数 (n) { 'grape': 100, 'reg_solo': 2 ... }
 * @param ignoredElements 推測計算から無視する要素
 * @param startCounts 各要素の開始カウント（打ち始め時の値）
 */
export function calculateEstimations(
  machineData: MachineData,
  totalSpins: number,
  normalSpins: number,
  counts: Record<string, number>,
  ignoredElements: Record<string, boolean> = {},
  startCounts: Record<string, number> = {}
): SettingEstimation[] {

  if (totalSpins <= 0) {
    // 回転数が0の場合は均等割り
    const prob = 100 / machineData.settings.length;
    return machineData.settings.map(s => ({ setting: s, percentage: prob }));
  }

  // 1. 各設定ごとの対数尤度(Log Likelihood)を計算
  const logLikelihoods = machineData.settings.map(setting => {
    let sumLogLike = 0;

    // 各要素（ぶどう、REG等）についてループ
    for (const element of machineData.elements) {
      // 無視された要素はスキップ
      if (ignoredElements[element.id]) continue;

      // 実際のカウント数（現在 - 開始）
      const count = getActualCount(element.id, counts, startCounts);
      const probData = element.probabilities.find(p => p.setting === setting);

      if (!probData) continue;

      // この要素に対応するゲーム数を取得
      const N = getSpinsForElement(element, totalSpins, normalSpins, counts, startCounts);
      if (N <= 0) continue;

      // 確率 p を計算 (分母から変換)
      const p = 1 / probData.denominator;

      // 対数尤度の加算: n * log(p) + (N - n) * log(1 - p)
      // Math.log は自然対数
      const successPart = count * Math.log(p);
      const failPart = (N - count) * Math.log(1 - p);

      sumLogLike += (successPart + failPart);
    }

    return { setting, logLike: sumLogLike };
  });

  // 2. アンダーフロー対策（Log-Sum-Exp Trick）
  // 最大値を引いてからexpを計算することで、数値の大きさを扱いやすい範囲に正規化する
  const maxLogLike = Math.max(...logLikelihoods.map(l => l.logLike));

  const likelihoods = logLikelihoods.map(item => {
    return {
      setting: item.setting,
      // exp(x - max)
      relativeProb: Math.exp(item.logLike - maxLogLike)
    };
  });

  // 3. 全体の合計を求めてパーセント化
  const totalLikelihood = likelihoods.reduce((sum, item) => sum + item.relativeProb, 0);

  return likelihoods.map(item => {
    // 0除算回避
    const percentage = totalLikelihood === 0
      ? 0
      : (item.relativeProb / totalLikelihood) * 100;

    return {
      setting: item.setting,
      percentage: parseFloat(percentage.toFixed(2)) // 小数点第2位まで
    };
  });
}
