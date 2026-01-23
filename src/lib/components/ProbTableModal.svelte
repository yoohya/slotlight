<script lang="ts">
  import type { MachineData, CounterElement } from '../types';

  export let machine: MachineData;
  export let isOpen = false;
  export let onClose: () => void;

  // 設定差があるか判定
  function hasSettingDiff(element: CounterElement): boolean {
    if (element.probabilities.length === 0) return false;
    const firstDenom = element.probabilities[0].denominator;
    return element.probabilities.some((p) => p.denominator !== firstDenom);
  }

  // 特定設定の確率分母を取得
  function getDenominator(element: CounterElement, setting: number): number | null {
    const prob = element.probabilities.find((p) => p.setting === setting);
    return prob?.denominator ?? null;
  }

  $: elementsWithDiff = machine.elements.filter((el) => hasSettingDiff(el));

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

{#if isOpen}
  <div
    class="modal"
    onclick={handleBackdropClick}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="modal-content">
      <h3>{machine.machineName} 確率表</h3>

      <div class="prob-table-container">
        {#each elementsWithDiff as element (element.id)}
          <table class="prob-table">
            <caption>{element.name}</caption>
            <thead>
              <tr>
                <th>設定</th>
                <th>確率</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {#each machine.settings as setting (setting)}
                {@const denom = getDenominator(element, setting) ?? 0}
                {@const prob = denom > 0 ? (1 / denom * 100).toFixed(3) : '0.000'}
                <tr>
                  <td>設定{setting}</td>
                  <td>1/{denom.toFixed(2)}</td>
                  <td>{prob}%</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/each}
      </div>

      <div class="modal-buttons">
        <button class="btn-primary" onclick={onClose}>閉じる</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal-content {
    background: var(--bg-secondary);
    border-radius: 16px;
    padding: 1.5rem;
    width: 90%;
    max-width: 400px;
  }

  h3 {
    font-size: 1rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  .prob-table-container {
    max-height: 60vh;
    overflow-y: auto;
    margin-bottom: 1rem;
  }

  .prob-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
    margin-bottom: 1rem;
  }

  .prob-table caption {
    text-align: left;
    font-weight: 600;
    font-size: 0.875rem;
    padding: 0.5rem 0;
    color: var(--accent);
  }

  .prob-table th,
  .prob-table td {
    padding: 0.4rem 0.5rem;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .prob-table th {
    background: var(--bg-card);
    font-weight: 600;
    color: var(--text-secondary);
  }

  .prob-table td {
    font-variant-numeric: tabular-nums;
  }

  .prob-table tr:last-child td {
    border-bottom: none;
  }

  .modal-buttons {
    display: flex;
    gap: 0.75rem;
  }

  .btn-primary {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    background: var(--accent);
    color: white;
    transition: opacity 0.15s;
  }

  .btn-primary:active {
    opacity: 0.8;
  }
</style>
