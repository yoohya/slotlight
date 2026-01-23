// logic.ts
import type { MachineData, SettingEstimation } from './types';

/**
 * ベイズ推定を用いて設定期待度を計算する
 * @param machineData 機種データ
 * @param totalSpins 総回転数 (N)
 * @param counts 各要素のカウント数 (n) { 'grape': 100, 'reg_solo': 2 ... }
 */
export function calculateEstimations(
  machineData: MachineData,
  totalSpins: number,
  counts: Record<string, number>
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
      const count = counts[element.id] || 0; // ユーザーの入力値
      const probData = element.probabilities.find(p => p.setting === setting);

      if (!probData) continue;

      // 確率 p を計算 (分母から変換)
      const p = 1 / probData.denominator;

      // 対数尤度の加算: n * log(p) + (N - n) * log(1 - p)
      // Math.log は自然対数
      const successPart = count * Math.log(p);
      const failPart = (totalSpins - count) * Math.log(1 - p);

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
