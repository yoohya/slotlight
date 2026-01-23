<script lang="ts">
  import type { CounterElement } from '../types';
  import { getClosestSetting } from '../store';

  export let element: CounterElement;
  export let count: number;
  export let totalGames: number;
  export let showSettings: boolean;
  export let onClick: () => void;

  // 設定差があるか判定
  $: hasSettingDiff = element.probabilities.length > 0 &&
    element.probabilities.some((p) => p.denominator !== element.probabilities[0].denominator);

  $: actualDenom = count > 0 && totalGames > 0 ? totalGames / count : null;
  $: probText = actualDenom ? `1/${actualDenom.toFixed(2)}` : '-';

  $: closestSetting = actualDenom && hasSettingDiff
    ? getClosestSetting(element, actualDenom)
    : null;

  $: probClass = getProbClass(element, actualDenom);

  function getProbClass(el: CounterElement, actualDenom: number | null): string {
    if (!actualDenom || !hasSettingDiff) return '';

    const probs = el.probabilities;
    if (probs.length === 0) return '';

    // 最も良い確率（分母が小さい）と最も悪い確率（分母が大きい）を取得
    const sortedByDenom = [...probs].sort((a, b) => a.denominator - b.denominator);
    const bestDenom = sortedByDenom[0].denominator;
    const worstDenom = sortedByDenom[sortedByDenom.length - 1].denominator;

    if (actualDenom <= bestDenom) return 'prob-good';
    if (actualDenom >= worstDenom) return 'prob-bad';
    return '';
  }
</script>

<button
  class="counter-btn"
  class:has-setting-diff={hasSettingDiff}
  on:click={onClick}
>
  <span class="element-name">{element.name}</span>
  <span class="element-count">{count}</span>
  <span class="element-prob {probClass}">{probText}</span>
  {#if hasSettingDiff && showSettings}
    <span
      class="element-setting {closestSetting !== null && closestSetting >= 1 && closestSetting <= 6 ? `setting-${closestSetting}` : ''}"
    >
      {closestSetting !== null ? `設定${closestSetting}` : '-'}
    </span>
  {/if}
</button>

<style>
  .counter-btn {
    background: var(--bg-card);
    border: none;
    border-radius: 12px;
    padding: 1rem;
    color: var(--text-primary);
    cursor: pointer;
    transition: transform 0.1s, background 0.15s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .counter-btn:active {
    transform: scale(0.95);
    background: var(--accent);
  }

  .counter-btn.has-setting-diff {
    border: 2px solid var(--accent);
  }

  .element-name {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .element-count {
    font-size: 2rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .element-prob {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .element-prob.prob-good {
    color: var(--success);
  }

  .element-prob.prob-bad {
    color: var(--accent);
  }

  .element-setting {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
  }

  .element-setting.setting-1 { background: var(--setting-1); }
  .element-setting.setting-2 { background: var(--setting-2); }
  .element-setting.setting-3 { background: var(--setting-3); }
  .element-setting.setting-4 { background: var(--setting-4); }
  .element-setting.setting-5 { background: var(--setting-5); }
  .element-setting.setting-6 { background: var(--setting-6); }
</style>
