<script lang="ts">
  import { appStore, estimation, totalGames, normalGames, atGames, needsNormalGames } from '../store';
  import { getClosestSetting } from '../estimation';
  import { getSpinsForElement } from '../logic';
  import ProbTableModal from './ProbTableModal.svelte';
  import PayoutRateModal from './PayoutRateModal.svelte';
  import type { CounterElement } from '../types';

  let showResetConfirm = false;
  let showEstimation = false;
  let showProbTable = false;
  let showPayoutRate = false;
  let showGamesModal = false;
  let modalStart = '';
  let modalTotal = '';
  let modalNormal = '';
  let modalAt = '';
  let flashingElements: Set<string> = new Set();

  $: machine = $appStore.currentMachine!;
  $: startGames = $appStore.startGames;
  $: counts = $appStore.counts;
  $: ignoredElements = $appStore.ignoredElements;
  $: minusMode = $appStore.minusMode;
  $: showSettings = $appStore.showSettings;
  $: hasNormalGames = needsNormalGames(machine);

  // 設定差があるか判定
  function hasSettingDiff(element: CounterElement): boolean {
    if (element.probabilities.length === 0) return false;
    const firstDenom = element.probabilities[0].denominator;
    return element.probabilities.some((p) => p.denominator !== firstDenom);
  }

  // 要素に対応するゲーム数を取得
  function getElementSpins(element: CounterElement): number {
    return getSpinsForElement(element, $totalGames, $normalGames, counts);
  }

  // 実測確率の分母を計算
  function getActualDenom(element: CounterElement): number | null {
    const count = counts[element.id] ?? 0;
    const spins = getElementSpins(element);
    return count > 0 && spins > 0 ? spins / count : null;
  }

  // 確率テキスト
  function getProbText(element: CounterElement): string {
    const denom = getActualDenom(element);
    return denom ? `1/${denom.toFixed(2)}` : '-';
  }

  // 設定バッジのテキストと色クラス
  function getSettingBadge(element: CounterElement): { text: string; colorClass: string } | null {
    if (!hasSettingDiff(element)) return null;
    const denom = getActualDenom(element);
    if (!denom) return null;

    const setting = getClosestSetting(element, denom);
    if (!setting) return null;

    const colorClasses: Record<number, string> = {
      1: 'bg-setting-1',
      2: 'bg-setting-2',
      3: 'bg-setting-3',
      4: 'bg-setting-4',
      5: 'bg-setting-5',
      6: 'bg-setting-6',
    };

    return {
      text: `設定${setting}`,
      colorClass: colorClasses[setting] ?? 'bg-gray-500',
    };
  }

  // 設定の色クラス取得
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

  function handleBack() {
    appStore.clearMachine();
  }

  function handleReset() {
    showResetConfirm = true;
  }

  function confirmReset() {
    appStore.resetCounts();
    showResetConfirm = false;
  }

  function triggerFlash(elementId: string) {
    flashingElements.add(elementId);
    flashingElements = flashingElements; // trigger reactivity
    setTimeout(() => {
      flashingElements.delete(elementId);
      flashingElements = flashingElements; // trigger reactivity
    }, 150);
  }

  function handleCounterClick(elementId: string) {
    const delta = minusMode ? -1 : 1;
    appStore.updateCount(elementId, delta);
    triggerFlash(elementId);
  }

  function handleCounterRightClick(e: MouseEvent, elementId: string) {
    e.preventDefault();
    const delta = minusMode ? 1 : -1;
    appStore.updateCount(elementId, delta);
    triggerFlash(elementId);
  }

  function toggleMinusMode() {
    appStore.toggleMinusMode();
  }

  function toggleShowSettings() {
    appStore.toggleShowSettings();
  }

  function handleToggleIgnore(e: Event, elementId: string) {
    e.stopPropagation();
    appStore.toggleIgnoreElement(elementId);
  }

  function openGamesModal() {
    modalStart = startGames.toString();
    modalTotal = $totalGames.toString();
    modalNormal = $normalGames.toString();
    modalAt = $atGames.toString();
    showGamesModal = true;
  }

  function confirmGamesModal() {
    const start = parseInt(modalStart, 10);
    const total = parseInt(modalTotal, 10);
    if (isNaN(start) || start < 0 || isNaN(total) || total < 0) {
      showGamesModal = false;
      return;
    }
    appStore.setStartGames(start);
    appStore.setCurrentGames(start + total);
    if (hasNormalGames) {
      const normal = parseInt(modalNormal, 10);
      if (!isNaN(normal) && normal >= 0) {
        const clamped = Math.min(normal, total);
        appStore.setNormalGames(clamped);
      }
    }
    showGamesModal = false;
  }

  // 総回転 = 通常 + AT
  function autoCalcTotal() {
    const normal = parseInt(modalNormal, 10);
    const at = parseInt(modalAt, 10);
    if (!isNaN(normal) && !isNaN(at)) {
      modalTotal = (normal + at).toString();
    }
  }

  // 通常 = 総回転 − AT
  function autoCalcNormal() {
    const total = parseInt(modalTotal, 10);
    const at = parseInt(modalAt, 10);
    if (!isNaN(total) && !isNaN(at)) {
      modalNormal = Math.max(0, total - at).toString();
    }
  }

  // AT = 総回転 − 通常
  function autoCalcAt() {
    const total = parseInt(modalTotal, 10);
    const normal = parseInt(modalNormal, 10);
    if (!isNaN(total) && !isNaN(normal)) {
      modalAt = Math.max(0, total - normal).toString();
    }
  }
</script>

<div class="h-full flex flex-col bg-bg-primary">
  <!-- Header -->
  <header class="bg-bg-card border-b border-border">
    <!-- Row 1: Navigation, Title & Menu Buttons -->
    <div class="flex items-center justify-between px-2 py-1.5">
      <div class="flex items-center gap-1.5">
        <button
          class="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-card-hover hover:bg-gray-600 active:scale-95 transition-all"
          onclick={handleBack}
          aria-label="戻る"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-sm font-bold truncate max-w-[120px] landscape:max-w-none">{machine.machineName}</h1>
      </div>

      <!-- Menu Buttons -->
      <div class="flex items-center gap-1">
        <button
          class="px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 {minusMode ? 'bg-accent text-white' : 'bg-bg-card-hover text-gray-400 hover:bg-gray-600'}"
          onclick={toggleMinusMode}
        >
          {minusMode ? '−' : '+'}
        </button>
        <button
          class="px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 {showSettings ? 'bg-success text-white' : 'bg-bg-card-hover text-gray-400 hover:bg-gray-600'}"
          onclick={toggleShowSettings}
        >
          設定
        </button>
        <button
          class="px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 {showEstimation ? 'bg-blue-500 text-white' : 'bg-bg-card-hover text-gray-400 hover:bg-gray-600'}"
          onclick={() => showEstimation = !showEstimation}
        >
          推測
        </button>
        <button
          class="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-card-hover hover:bg-gray-600 active:scale-95 transition-all"
          onclick={handleReset}
          aria-label="リセット"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Row 2: Payout Rate & Prob Table Buttons + Games Summary -->
    <div class="flex items-center justify-between px-2 py-1.5 border-t border-border/50 bg-bg-primary/50">
      <div class="flex items-center gap-1">
        <button
          class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-bg-card-hover text-gray-400 hover:bg-gray-600 transition-all active:scale-95"
          onclick={() => showPayoutRate = true}
        >
          機械割
        </button>
        <button
          class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-bg-card-hover text-gray-400 hover:bg-gray-600 transition-all active:scale-95"
          onclick={() => showProbTable = true}
        >
          確率表
        </button>
      </div>
      <button
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-bg-card-hover hover:bg-gray-600 transition-all active:scale-95"
        onclick={openGamesModal}
      >
        <span class="text-[10px] text-blue-400">総回転</span>
        <span class="text-sm font-bold tabular-nums text-blue-400">{$totalGames.toLocaleString()}</span>
        {#if hasNormalGames}
          <span class="text-gray-600">|</span>
          <span class="text-[10px] text-green-400">通常</span>
          <span class="text-sm font-bold tabular-nums text-green-400">{$normalGames.toLocaleString()}</span>
          <span class="text-gray-600">|</span>
          <span class="text-[10px] text-purple-400">AT</span>
          <span class="text-sm font-bold tabular-nums text-purple-400">{$atGames.toLocaleString()}</span>
        {/if}
      </button>
    </div>
  </header>

  <!-- Main Content -->
  <div class="flex-1 flex flex-col landscape:flex-row overflow-hidden">
    <!-- Counter Grid -->
    <main class="flex-1 p-2 overflow-auto">
      <div class="grid grid-cols-2 landscape:grid-cols-3 gap-3 h-full portrait:auto-rows-fr" style="--landscape-rows: repeat(2, 1fr);">
        {#each machine.elements as element (element.id)}
          {@const count = counts[element.id] ?? 0}
          {@const badge = showSettings ? getSettingBadge(element) : null}
          {@const isFlashing = flashingElements.has(element.id)}
          {@const isIgnored = !!ignoredElements[element.id]}
          <button
            class="relative flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-150 cursor-pointer active:scale-[0.97] active:shadow-none active:translate-y-0.5 min-h-[80px] landscape:min-h-0 shadow-lg hover:shadow-xl {minusMode ? 'bg-gradient-to-b from-red-900/40 to-red-950/60 border-accent/50 hover:from-red-900/50 hover:to-red-950/70' : 'bg-gradient-to-b from-gray-700 to-gray-800 border-gray-600 hover:from-gray-600 hover:to-gray-700'} {isFlashing ? (minusMode ? 'bg-gradient-to-b from-accent/60 to-accent/40 border-accent shadow-accent/30' : 'bg-gradient-to-b from-success/50 to-success/30 border-success shadow-success/30') : ''} {isIgnored ? 'opacity-40' : ''}"
            onclick={() => handleCounterClick(element.id)}
            oncontextmenu={(e) => handleCounterRightClick(e, element.id)}
          >
            <!-- Element Name & Setting Badge -->
            <div class="absolute top-2 left-0 right-0 flex items-center justify-between px-2">
              <span class="text-sm font-bold text-gray-300">{element.name}</span>
              <div class="flex items-center gap-1">
                {#if badge}
                  <span class="text-[9px] font-bold px-1 py-0.5 rounded {badge.colorClass}">
                    {badge.text}
                  </span>
                {/if}
                <!-- Ignore Toggle -->
                <span
                  role="button"
                  tabindex="0"
                  class="w-5 h-5 flex items-center justify-center rounded transition-colors {isIgnored ? 'text-accent' : 'text-gray-600 hover:text-gray-400'}"
                  onclick={(e) => handleToggleIgnore(e, element.id)}
                  onkeydown={(e) => e.key === 'Enter' && handleToggleIgnore(e, element.id)}
                  aria-label={isIgnored ? '推測に含める' : '推測から除外'}
                >
                  {#if isIgnored}
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  {:else}
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  {/if}
                </span>
              </div>
            </div>

            <!-- Count -->
            <span class="text-3xl font-bold tabular-nums">{count}</span>

            <!-- Probability -->
            <span class="absolute bottom-1.5 text-[10px] text-gray-500">
              {getProbText(element)}
            </span>
          </button>
        {/each}
      </div>
    </main>

    <!-- Estimation Panel -->
    {#if showEstimation}
      <!-- Landscape: Side panel -->
      <aside class="hidden landscape:block w-48 bg-bg-card border-l border-border p-2 overflow-auto">
        <h3 class="text-xs font-bold text-gray-400 mb-2">設定推測</h3>
        <div class="space-y-1.5">
          {#each $estimation as item (item.setting)}
            {@const maxPercentage = Math.max(...$estimation.map(e => e.percentage))}
            {@const barWidth = maxPercentage > 0 ? (item.percentage / maxPercentage) * 100 : 0}
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-semibold w-6 text-right">設{item.setting}</span>
              <div class="flex-1 h-4 bg-black/30 rounded overflow-hidden">
                <div
                  class="h-full rounded transition-all duration-300 {getSettingColorClass(item.setting)}"
                  style="width: {barWidth}%"
                ></div>
              </div>
              <span class="text-[10px] font-bold tabular-nums w-10 text-right">{item.percentage.toFixed(1)}%</span>
            </div>
          {/each}
        </div>
      </aside>

      <!-- Portrait: Bottom panel -->
      <aside class="landscape:hidden bg-bg-card border-t border-border p-2 overflow-auto max-h-[30vh]">
        <h3 class="text-xs font-bold text-gray-400 mb-2">設定推測</h3>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1">
          {#each $estimation as item (item.setting)}
            {@const maxPercentage = Math.max(...$estimation.map(e => e.percentage))}
            {@const barWidth = maxPercentage > 0 ? (item.percentage / maxPercentage) * 100 : 0}
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-semibold w-6 text-right">設{item.setting}</span>
              <div class="flex-1 h-4 bg-black/30 rounded overflow-hidden">
                <div
                  class="h-full rounded transition-all duration-300 {getSettingColorClass(item.setting)}"
                  style="width: {barWidth}%"
                ></div>
              </div>
              <span class="text-[10px] font-bold tabular-nums w-10 text-right">{item.percentage.toFixed(1)}%</span>
            </div>
          {/each}
        </div>
      </aside>
    {/if}
  </div>

  <!-- Unified Games Setting Modal -->
  {#if showGamesModal}
    <div
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onclick={() => showGamesModal = false}
      onkeydown={(e) => e.key === 'Escape' && (showGamesModal = false)}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div
        class="bg-bg-card rounded-2xl p-6 mx-4 max-w-sm w-full"
        onclick={(e) => e.stopPropagation()}
        role="document"
      >
        <h3 class="text-lg font-bold mb-4 text-center">ゲーム数設定</h3>

        <div class="space-y-3">
          <!-- 開始 -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-400 w-16 text-right shrink-0">開始</span>
            <input
              type="number"
              inputmode="numeric"
              class="flex-1 px-3 py-2 rounded-xl bg-bg-primary border border-border text-center text-base font-bold tabular-nums focus:outline-none focus:border-blue-500"
              bind:value={modalStart}
            />
            {#if hasNormalGames}
              <div class="w-8 shrink-0"></div>
            {/if}
          </div>

          <!-- 総回転数 -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-blue-400 w-16 text-right shrink-0">総回転数</span>
            <input
              type="number"
              inputmode="numeric"
              class="flex-1 px-3 py-2 rounded-xl bg-bg-primary border border-border text-center text-base font-bold tabular-nums focus:outline-none focus:border-blue-500"
              bind:value={modalTotal}
            />
            {#if hasNormalGames}
              <button
                class="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-all active:scale-95 {modalNormal !== '' && modalAt !== '' ? 'bg-blue-500/30 text-blue-300 hover:bg-blue-500/50' : 'bg-gray-700/50 text-gray-600 cursor-not-allowed'}"
                onclick={autoCalcTotal}
                disabled={modalNormal === '' || modalAt === ''}
                title="通常 + AT"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
            {/if}
          </div>

          {#if hasNormalGames}
            <!-- 通常時 -->
            <div class="flex items-center gap-2">
              <span class="text-sm text-green-400 w-16 text-right shrink-0">通常時</span>
              <input
                type="number"
                inputmode="numeric"
                class="flex-1 px-3 py-2 rounded-xl bg-bg-primary border border-border text-center text-base font-bold tabular-nums focus:outline-none focus:border-green-500"
                bind:value={modalNormal}
              />
              <button
                class="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-all active:scale-95 {modalTotal !== '' && modalAt !== '' ? 'bg-green-500/30 text-green-300 hover:bg-green-500/50' : 'bg-gray-700/50 text-gray-600 cursor-not-allowed'}"
                onclick={autoCalcNormal}
                disabled={modalTotal === '' || modalAt === ''}
                title="総回転 − AT"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            <!-- AT時 -->
            <div class="flex items-center gap-2">
              <span class="text-sm text-purple-400 w-16 text-right shrink-0">AT時</span>
              <input
                type="number"
                inputmode="numeric"
                class="flex-1 px-3 py-2 rounded-xl bg-bg-primary border border-border text-center text-base font-bold tabular-nums focus:outline-none focus:border-purple-500"
                bind:value={modalAt}
              />
              <button
                class="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-all active:scale-95 {modalTotal !== '' && modalNormal !== '' ? 'bg-purple-500/30 text-purple-300 hover:bg-purple-500/50' : 'bg-gray-700/50 text-gray-600 cursor-not-allowed'}"
                onclick={autoCalcAt}
                disabled={modalTotal === '' || modalNormal === ''}
                title="総回転 − 通常"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          {/if}
        </div>

        <div class="flex gap-3 mt-5">
          <button
            class="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 font-semibold transition-colors"
            onclick={() => showGamesModal = false}
          >
            キャンセル
          </button>
          <button
            class="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 font-semibold transition-colors"
            onclick={confirmGamesModal}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Reset Confirmation Modal -->
  {#if showResetConfirm}
    <div
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onclick={() => showResetConfirm = false}
      onkeydown={(e) => e.key === 'Escape' && (showResetConfirm = false)}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div
        class="bg-bg-card rounded-2xl p-6 mx-4 max-w-sm w-full"
        onclick={(e) => e.stopPropagation()}
        role="document"
      >
        <h3 class="text-lg font-bold mb-4 text-center">カウントをリセットしますか？</h3>
        <div class="flex gap-3">
          <button
            class="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 font-semibold transition-colors"
            onclick={() => showResetConfirm = false}
          >
            キャンセル
          </button>
          <button
            class="flex-1 py-3 rounded-xl bg-accent hover:bg-red-500 font-semibold transition-colors"
            onclick={confirmReset}
          >
            リセット
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Prob Table Modal -->
  <ProbTableModal {machine} isOpen={showProbTable} onClose={() => showProbTable = false} />

  <!-- Payout Rate Modal -->
  <PayoutRateModal {machine} isOpen={showPayoutRate} onClose={() => showPayoutRate = false} />
</div>
