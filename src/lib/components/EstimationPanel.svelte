<script lang="ts">
  import type { EstimationResult } from '../types';

  export let estimation: EstimationResult;

  $: maxProb = Math.max(...estimation.map((e) => e.percentage));

  // 設定番号から色クラスを取得（1-6は専用色、それ以外はデフォルト）
  function getSettingClass(setting: number): string {
    if (setting >= 1 && setting <= 6) {
      return `setting-${setting}`;
    }
    return 'setting-default';
  }
</script>

<details class="estimation-section">
  <summary>設定推測</summary>
  <div class="estimation-bars">
    {#each estimation as item (item.setting)}
      {@const barWidth = maxProb > 0 ? (item.percentage / maxProb) * 100 : (100 / estimation.length)}
      <div class="estimation-row" data-setting={item.setting}>
        <span class="setting-label">設定{item.setting}</span>
        <div class="bar-container">
          <div class="bar {getSettingClass(item.setting)}" style="width: {barWidth}%"></div>
        </div>
        <span class="percentage">{item.percentage.toFixed(1)}%</span>
      </div>
    {/each}
  </div>
</details>

<style>
  .estimation-section {
    background: var(--bg-secondary);
    border-radius: 12px;
  }

  summary {
    padding: 1rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
    cursor: pointer;
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::after {
    content: '▼';
    font-size: 0.75rem;
    transition: transform 0.2s;
  }

  .estimation-section[open] summary::after {
    transform: rotate(180deg);
  }

  .estimation-bars {
    padding: 0 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .estimation-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .setting-label {
    width: 2.5rem;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .bar-container {
    flex: 1;
    height: 24px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .bar.setting-1 { background: var(--setting-1); }
  .bar.setting-2 { background: var(--setting-2); }
  .bar.setting-3 { background: var(--setting-3); }
  .bar.setting-4 { background: var(--setting-4); }
  .bar.setting-5 { background: var(--setting-5); }
  .bar.setting-6 { background: var(--setting-6); }
  .bar.setting-default { background: var(--accent); }

  .percentage {
    width: 3.5rem;
    text-align: right;
    font-size: 0.875rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
</style>
