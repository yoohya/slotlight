import type { CounterElement } from './types';

/**
 * 要素に設定差があるか判定（全設定で同じ確率でなければ設定差あり）
 */
function hasSettingDiff(element: CounterElement): boolean {
  if (element.probabilities.length === 0) return false;
  const firstDenom = element.probabilities[0].denominator;
  return element.probabilities.some((p) => p.denominator !== firstDenom);
}

/**
 * 要素の実測値から最も近い設定を判定
 */
export function getClosestSetting(element: CounterElement, actualDenom: number): number | null {
  if (!hasSettingDiff(element)) return null;

  const probs = element.probabilities;
  if (probs.length === 0) return null;

  // 最も良い確率（分母が小さい）と最も悪い確率（分母が大きい）を取得
  const sortedByDenom = [...probs].sort((a, b) => a.denominator - b.denominator);
  const bestProb = sortedByDenom[0]; // 分母最小（最高設定側）
  const worstProb = sortedByDenom[sortedByDenom.length - 1]; // 分母最大（最低設定側）

  // 最高設定より良い結果なら最高設定
  if (actualDenom <= bestProb.denominator) return bestProb.setting;
  // 最低設定より悪い結果なら最低設定
  if (actualDenom >= worstProb.denominator) return worstProb.setting;

  // 範囲内なら最も近い設定を探す
  let closestSetting = probs[0].setting;
  let minDiff = Infinity;

  for (const prob of probs) {
    const diff = Math.abs(actualDenom - prob.denominator);
    if (diff < minDiff) {
      minDiff = diff;
      closestSetting = prob.setting;
    }
  }

  return closestSetting;
}
