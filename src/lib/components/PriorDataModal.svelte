<script lang="ts">
  import type { MachineData, PriorData, Counts } from '../types';
  import { calculateEstimationsWithPrior } from '../logic';

  export let isOpen = false;
  export let machine: MachineData | null = null;
  export let onConfirm: (priorData: PriorData) => void;
  export let onClose: () => void;

  let priorGames = '';
  let priorCounts: Counts = {};
  let showEstimation = false;

  $: if (isOpen && machine) {
    priorGames = '';
    priorCounts = {};
    showEstimation = false;
    // 履歴確認可能な要素のカウントを初期化
    machine.elements.forEach(el => {
      if (el.visibleInHistory) {
        priorCounts[el.id] = 0;
      }
    });
  }

  $: visibleElements = machine?.elements.filter(el => el.visibleInHistory) || [];

  $: estimation = (machine && showEstimation && parseInt(priorGames, 10) > 0)
    ? calculateEstimationsWithPrior(machine, {
        games: parseInt(priorGames, 10),
        counts: priorCounts
      }, 0, 0, {}, {})
    : [];

  function adjustCount(elementId: string, delta: number) {
    priorCounts[elementId] = Math.max(0, (priorCounts[elementId] || 0) + delta);
    priorCounts = { ...priorCounts };
  }

  function handleShowEstimation() {
    const games = parseInt(priorGames, 10);
    if (isNaN(games) || games <= 0) {
      return;
    }
    showEstimation = true;
  }

  function handleConfirm() {
    const games = parseInt(priorGames, 10);
    if (isNaN(games) || games <= 0) {
      return;
    }
    onConfirm({
      games,
      counts: priorCounts
    });
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function getSettingColorClass(setting: number): string {
    const colorClasses: Record<number, string> = {
      1: 'bg-setting-1',
      2: 'bg-setting-2',
      3: 'bg-setting-3',
      4: 'bg-setting-4',
      5: 'bg-setting-5',
      6: 'bg-setting-6',
    };
    return colorClasses[setting] ?? 'bg-gray-500';
  }
</script>

{#if isOpen && machine}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onclick={handleBackdropClick}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="bg-bg-card rounded-2xl p-5 mx-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
      onclick={(e) => e.stopPropagation()}
      role="document"
    >
      <h3 class="text-lg font-bold mb-2 text-center">台の履歴情報を入力</h3>
      <p class="text-xs text-gray-400 text-center mb-4">{machine.machineName}</p>

      <div class="space-y-4">
        <!-- 台の現在ゲーム数 -->
        <div>
          <label class="block text-sm text-gray-400 mb-2">台の現在ゲーム数</label>
          <input
            type="number"
            inputmode="numeric"
            class="w-full px-3 py-2.5 rounded-xl bg-bg-primary border border-border text-center text-lg font-bold tabular-nums focus:outline-none focus:border-blue-500"
            bind:value={priorGames}
            placeholder="0"
          />
        </div>

        {#if visibleElements.length > 0}
          <div class="border-t border-border pt-4">
            <p class="text-sm text-gray-400 mb-3">履歴で確認できる回数</p>
            {#each visibleElements as element (element.id)}
              <div class="mb-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-semibold">{element.name}</span>
                  <span class="text-xl font-bold tabular-nums">{priorCounts[element.id] || 0}</span>
                </div>
                <div class="grid grid-cols-4 gap-1.5">
                  <button
                    class="py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 font-bold text-sm transition-all active:scale-95"
                    onclick={() => adjustCount(element.id, 10)}
                  >
                    +10
                  </button>
                  <button
                    class="py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 font-bold text-sm transition-all active:scale-95"
                    onclick={() => adjustCount(element.id, 1)}
                  >
                    +1
                  </button>
                  <button
                    class="py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-bold text-sm transition-all active:scale-95"
                    onclick={() => adjustCount(element.id, -1)}
                  >
                    -1
                  </button>
                  <button
                    class="py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-bold text-sm transition-all active:scale-95"
                    onclick={() => adjustCount(element.id, -10)}
                  >
                    -10
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if !showEstimation}
          <button
            class="w-full py-3 rounded-xl bg-purple-500/20 border-2 border-purple-500/50 hover:bg-purple-500/30 hover:border-purple-500 font-semibold transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            onclick={handleShowEstimation}
            disabled={!priorGames || parseInt(priorGames, 10) <= 0}
          >
            この時点の設定推測を見る
          </button>
        {:else}
          <div class="border-t border-border pt-4">
            <h4 class="text-sm font-bold text-gray-400 mb-3">前提情報による設定推測</h4>
            <div class="space-y-1.5">
              {#each estimation as item (item.setting)}
                {@const maxPercentage = Math.max(...estimation.map(e => e.percentage))}
                {@const barWidth = maxPercentage > 0 ? (item.percentage / maxPercentage) * 100 : 0}
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-semibold w-8 text-right">設{item.setting}</span>
                  <div class="flex-1 h-5 bg-black/30 rounded overflow-hidden">
                    <div
                      class="h-full rounded transition-all duration-300 {getSettingColorClass(item.setting)}"
                      style="width: {barWidth}%"
                    ></div>
                  </div>
                  <span class="text-xs font-bold tabular-nums w-12 text-right">{item.percentage.toFixed(1)}%</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <div class="flex gap-3 mt-5 sticky bottom-0 bg-bg-card pt-3">
        <button
          class="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 font-semibold transition-colors active:scale-95"
          onclick={onClose}
        >
          キャンセル
        </button>
        <button
          class="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 font-semibold transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          onclick={handleConfirm}
          disabled={!priorGames || parseInt(priorGames, 10) <= 0}
        >
          打ち始める
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .active\:scale-98:active {
    transform: scale(0.98);
  }
  .active\:scale-95:active {
    transform: scale(0.95);
  }
</style>
