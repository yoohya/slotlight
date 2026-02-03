<script lang="ts">
  import type { MachineData } from '../types';

  export let machine: MachineData;
  export let isOpen = false;
  export let onClose: () => void;

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

  // 機械割の値の色（100%を境に色分け）
  function getRateColorClass(rate: number): string {
    if (rate >= 100) return 'text-success';
    return 'text-gray-300';
  }

  function getRate(setting: number): number | null {
    const entry = machine.payoutRates?.find((p) => p.setting === setting);
    return entry?.rate ?? null;
  }

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
        <span class="text-xs text-gray-500">機械割</span>
      </div>

      <!-- Table -->
      {#if machine.payoutRates && machine.payoutRates.length > 0}
        <div class="bg-bg-primary rounded-xl p-3">
          <div class="grid grid-cols-2 gap-1 text-xs">
            <!-- Header -->
            <div class="text-gray-500 font-semibold py-1">設定</div>
            <div class="text-gray-500 font-semibold py-1 text-right">機械割</div>

            <!-- Rows -->
            {#each machine.settings as setting (setting)}
              {@const rate = getRate(setting)}
              <div class="py-1.5 font-semibold {getSettingColorClass(setting)}">設定{setting}</div>
              <div class="py-1.5 text-right tabular-nums font-semibold {rate !== null ? getRateColorClass(rate) : 'text-gray-600'}">
                {rate !== null ? `${rate.toFixed(1)}%` : '-'}
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="text-center text-gray-500 text-sm py-8">データなし</div>
      {/if}

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
