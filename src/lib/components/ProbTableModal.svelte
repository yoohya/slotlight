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

  // 設定の色クラス取得
  function getSettingColorClass(setting: number): string {
    const colorClasses: Record<number, string> = {
      1: 'text-setting-1',
      2: 'text-setting-2',
      3: 'text-setting-3',
      4: 'text-setting-4',
      5: 'text-setting-5',
      6: 'text-setting-6',
    };
    return colorClasses[setting] ?? 'text-gray-400';
  }

  // 分母の基準ラベルを取得
  function getDenominatorLabel(element: CounterElement): string {
    if (element.denominatorElementId) {
      const refEl = machine.elements.find((el) => el.id === element.denominatorElementId);
      return refEl ? `${refEl.name}回数` : '要素カウント';
    }
    switch (element.denominatorType) {
      case 'normal': return '通常G数';
      case 'at': return 'ATG数';
      case 'total': return '総G数';
      default: return '総G数';
    }
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
    class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    onclick={handleBackdropClick}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="bg-bg-card rounded-2xl p-5 w-full max-w-md shadow-2xl border border-border">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold">{machine.machineName}</h3>
        <span class="text-xs text-gray-500">確率表</span>
      </div>

      <!-- Tables Container -->
      <div class="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
        {#each elementsWithDiff as element (element.id)}
          <div class="bg-bg-primary rounded-xl p-3">
            <!-- Element Name & Denominator Label -->
            <div class="flex items-center gap-2 mb-2">
              <h4 class="text-sm font-bold text-accent">{element.name}</h4>
              <span class="text-[10px] text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded">{getDenominatorLabel(element)}</span>
            </div>

            <!-- Table -->
            <div class="grid grid-cols-3 gap-1 text-xs">
              <!-- Header -->
              <div class="text-gray-500 font-semibold py-1">設定</div>
              <div class="text-gray-500 font-semibold py-1 text-center">確率</div>
              <div class="text-gray-500 font-semibold py-1 text-right">%</div>

              <!-- Rows -->
              {#each machine.settings as setting (setting)}
                {@const denom = getDenominator(element, setting) ?? 0}
                {@const prob = denom > 0 ? (1 / denom * 100).toFixed(3) : '0.000'}
                <div class="py-1.5 font-semibold {getSettingColorClass(setting)}">設定{setting}</div>
                <div class="py-1.5 text-center tabular-nums">1/{denom.toFixed(2)}</div>
                <div class="py-1.5 text-right tabular-nums text-gray-400">{prob}%</div>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <!-- Close Button -->
      <button
        class="w-full mt-4 py-3 rounded-xl bg-accent hover:bg-red-500 font-semibold transition-colors active:scale-[0.98]"
        onclick={onClose}
      >
        閉じる
      </button>
    </div>
  </div>
{/if}
