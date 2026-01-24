<script lang="ts">
  import { appStore, estimation, totalGames } from '../store';
  import { getClosestSetting } from '../estimation';
  import ProbTableModal from './ProbTableModal.svelte';
  import type { CounterElement } from '../types';

  let showResetConfirm = false;
  let showEstimation = false;
  let showProbTable = false;
  let showStartGamesInput = false;
  let startGamesInputValue = '';

  $: machine = $appStore.currentMachine!;
  $: startGames = $appStore.startGames;
  $: currentGames = $appStore.currentGames;
  $: counts = $appStore.counts;
  $: minusMode = $appStore.minusMode;
  $: showSettings = $appStore.showSettings;

  // 設定差があるか判定
  function hasSettingDiff(element: CounterElement): boolean {
    if (element.probabilities.length === 0) return false;
    const firstDenom = element.probabilities[0].denominator;
    return element.probabilities.some((p) => p.denominator !== firstDenom);
  }

  // 実測確率の分母を計算
  function getActualDenom(elementId: string): number | null {
    const count = counts[elementId] ?? 0;
    return count > 0 && $totalGames > 0 ? $totalGames / count : null;
  }

  // 確率テキスト
  function getProbText(elementId: string): string {
    const denom = getActualDenom(elementId);
    return denom ? `1/${denom.toFixed(2)}` : '-';
  }

  // 設定バッジのテキストと色クラス
  function getSettingBadge(element: CounterElement): { text: string; colorClass: string } | null {
    if (!hasSettingDiff(element)) return null;
    const denom = getActualDenom(element.id);
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

  function handleCounterClick(elementId: string) {
    const delta = minusMode ? -1 : 1;
    appStore.updateCount(elementId, delta);
  }

  function handleCounterRightClick(e: MouseEvent, elementId: string) {
    e.preventDefault();
    const delta = minusMode ? 1 : -1;
    appStore.updateCount(elementId, delta);
  }

  function handleGamesDelta(delta: number) {
    const actualDelta = minusMode ? -delta : delta;
    appStore.updateCurrentGames(actualDelta);
  }

  function toggleMinusMode() {
    appStore.toggleMinusMode();
  }

  function toggleShowSettings() {
    appStore.toggleShowSettings();
  }

  function openStartGamesInput() {
    startGamesInputValue = startGames.toString();
    showStartGamesInput = true;
  }

  function confirmStartGames() {
    const value = parseInt(startGamesInputValue, 10);
    if (!isNaN(value) && value >= 0) {
      appStore.setStartGames(value);
      // 現在ゲーム数も同じ値に設定（打ち始めから開始）
      if (currentGames < value) {
        appStore.setCurrentGames(value);
      }
    }
    showStartGamesInput = false;
  }
</script>

<div class="h-full flex flex-col bg-bg-primary">
  <!-- Header -->
  <header class="bg-bg-card border-b border-border">
    <!-- Row 1: Navigation & Title -->
    <div class="flex items-center justify-between px-3 py-2">
      <div class="flex items-center gap-2">
        <button
          class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-card-hover active:scale-95 transition-transform"
          onclick={handleBack}
          aria-label="戻る"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-base font-bold">{machine.machineName}</h1>
      </div>

      <!-- Landscape: All controls in one row -->
      <div class="hidden landscape:flex items-center gap-2">
        <!-- Minus Mode Toggle (Slider) -->
        <label class="flex items-center gap-1 cursor-pointer">
          <span class="text-[10px] text-gray-400">{minusMode ? '−' : '+'}</span>
          <button
            type="button"
            role="switch"
            aria-checked={minusMode}
            aria-label="マイナスモード"
            class="relative w-9 h-5 rounded-full transition-colors {minusMode ? 'bg-accent' : 'bg-gray-600'}"
            onclick={toggleMinusMode}
          >
            <span
              class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform {minusMode ? 'translate-x-4' : 'translate-x-0'}"
            ></span>
          </button>
        </label>

        <!-- Show Settings Toggle -->
        <button
          class="px-2 py-1 text-xs font-semibold rounded transition-colors {showSettings ? 'bg-success text-white' : 'bg-bg-card-hover text-gray-400'}"
          onclick={toggleShowSettings}
          aria-label="設定表示"
        >
          設定
        </button>

        <!-- Prob Table Button -->
        <button
          class="px-2 py-1 text-xs font-semibold rounded transition-colors bg-bg-card-hover text-gray-400 hover:bg-gray-600"
          onclick={() => showProbTable = true}
          aria-label="確率表"
        >
          確率
        </button>

        <!-- Estimation Panel Toggle (Slider) -->
        <label class="flex items-center gap-1 cursor-pointer">
          <span class="text-[10px] text-gray-400">推測</span>
          <button
            type="button"
            role="switch"
            aria-checked={showEstimation}
            aria-label="設定推測パネル"
            class="relative w-9 h-5 rounded-full transition-colors {showEstimation ? 'bg-blue-500' : 'bg-gray-600'}"
            onclick={() => showEstimation = !showEstimation}
          >
            <span
              class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform {showEstimation ? 'translate-x-4' : 'translate-x-0'}"
            ></span>
          </button>
        </label>

        <!-- Games Display -->
        <div class="flex items-center gap-2 ml-2">
          <button
            class="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
            onclick={openStartGamesInput}
            title="打ち始めゲーム数を設定"
          >
            開始:<span class="tabular-nums">{startGames.toLocaleString()}</span>
          </button>
          <span class="text-[10px] text-gray-500">現在:</span>
          <span class="text-sm font-bold tabular-nums">{currentGames.toLocaleString()}</span>
          <div class="flex gap-0.5">
            {#each [10, 100, 1000] as delta}
              <button
                class="px-1.5 py-1 text-[10px] font-semibold rounded transition-colors active:scale-95 {minusMode ? 'bg-accent/80 hover:bg-accent' : 'bg-bg-card-hover hover:bg-gray-600'}"
                onclick={() => handleGamesDelta(delta)}
              >
                {minusMode ? `−${delta}` : `+${delta}`}
              </button>
            {/each}
          </div>
          <span class="text-[10px] text-blue-400 ml-1">総回転:</span>
          <span class="text-sm font-bold tabular-nums text-blue-400">{$totalGames.toLocaleString()}</span>
        </div>

        <button
          class="ml-1 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-card-hover active:scale-95 transition-transform"
          onclick={handleReset}
          aria-label="リセット"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <!-- Portrait: Only reset button in first row -->
      <div class="flex landscape:hidden items-center gap-2">
        <button
          class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-card-hover active:scale-95 transition-transform"
          onclick={handleReset}
          aria-label="リセット"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Row 2: Controls (Portrait only) -->
    <div class="flex landscape:hidden items-center justify-between px-3 py-1.5 border-t border-border/50">
      <div class="flex items-center gap-2">
        <!-- Minus Mode Toggle -->
        <label class="flex items-center gap-1 cursor-pointer">
          <span class="text-[10px] text-gray-400">{minusMode ? '−' : '+'}</span>
          <button
            type="button"
            role="switch"
            aria-checked={minusMode}
            aria-label="マイナスモード"
            class="relative w-9 h-5 rounded-full transition-colors {minusMode ? 'bg-accent' : 'bg-gray-600'}"
            onclick={toggleMinusMode}
          >
            <span
              class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform {minusMode ? 'translate-x-4' : 'translate-x-0'}"
            ></span>
          </button>
        </label>

        <!-- Show Settings Toggle -->
        <button
          class="px-2 py-1 text-xs font-semibold rounded transition-colors {showSettings ? 'bg-success text-white' : 'bg-bg-card-hover text-gray-400'}"
          onclick={toggleShowSettings}
        >
          設定
        </button>

        <!-- Prob Table Button -->
        <button
          class="px-2 py-1 text-xs font-semibold rounded transition-colors bg-bg-card-hover text-gray-400 hover:bg-gray-600"
          onclick={() => showProbTable = true}
        >
          確率
        </button>

        <!-- Estimation Panel Toggle -->
        <label class="flex items-center gap-1 cursor-pointer">
          <span class="text-[10px] text-gray-400">推測</span>
          <button
            type="button"
            role="switch"
            aria-checked={showEstimation}
            aria-label="設定推測パネル"
            class="relative w-9 h-5 rounded-full transition-colors {showEstimation ? 'bg-blue-500' : 'bg-gray-600'}"
            onclick={() => showEstimation = !showEstimation}
          >
            <span
              class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform {showEstimation ? 'translate-x-4' : 'translate-x-0'}"
            ></span>
          </button>
        </label>
      </div>

      <!-- Games counter -->
      <div class="flex items-center gap-1">
        <button
          class="text-[10px] text-gray-500 hover:text-gray-300"
          onclick={openStartGamesInput}
        >
          開始:<span class="tabular-nums">{startGames.toLocaleString()}</span>
        </button>
        <span class="text-[10px] text-gray-500">現在:</span>
        <span class="text-sm font-bold tabular-nums">{currentGames.toLocaleString()}</span>
        <div class="flex gap-0.5">
          {#each [10, 100, 1000] as delta}
            <button
              class="px-1.5 py-1 text-[10px] font-semibold rounded transition-colors active:scale-95 {minusMode ? 'bg-accent/80 hover:bg-accent' : 'bg-bg-card-hover hover:bg-gray-600'}"
              onclick={() => handleGamesDelta(delta)}
            >
              {minusMode ? `−${delta}` : `+${delta}`}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Row 3: Total Games (Portrait only) -->
    <div class="flex landscape:hidden items-center justify-center px-3 py-1 border-t border-border/50 bg-blue-500/10">
      <span class="text-[10px] text-blue-400">総回転:</span>
      <span class="text-sm font-bold tabular-nums text-blue-400 ml-1">{$totalGames.toLocaleString()}</span>
    </div>
  </header>

  <!-- Main Content -->
  <div class="flex-1 flex flex-col landscape:flex-row overflow-hidden">
    <!-- Counter Grid -->
    <main class="flex-1 p-2 overflow-auto">
      <div class="grid grid-cols-2 landscape:grid-cols-3 gap-2 h-full portrait:auto-rows-fr" style="--landscape-rows: repeat(2, 1fr);">
        {#each machine.elements as element (element.id)}
          {@const count = counts[element.id] ?? 0}
          {@const badge = showSettings ? getSettingBadge(element) : null}
          <button
            class="relative flex flex-col items-center justify-center rounded-xl border transition-all cursor-pointer active:scale-[0.98] min-h-[80px] landscape:min-h-0 {minusMode ? 'bg-accent/10 border-accent/50 hover:bg-accent/20' : 'bg-bg-card border-border hover:bg-bg-card-hover'}"
            onclick={() => handleCounterClick(element.id)}
            oncontextmenu={(e) => handleCounterRightClick(e, element.id)}
          >
            <!-- Element Name & Setting Badge -->
            <div class="absolute top-2 left-0 right-0 flex items-center justify-between px-2">
              <span class="text-sm font-bold text-gray-300">{element.name}</span>
              {#if badge}
                <span class="text-[9px] font-bold px-1 py-0.5 rounded {badge.colorClass}">
                  {badge.text}
                </span>
              {/if}
            </div>

            <!-- Count -->
            <span class="text-3xl font-bold tabular-nums">{count}</span>

            <!-- Probability -->
            <span class="absolute bottom-1.5 text-[10px] text-gray-500">
              {getProbText(element.id)}
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

  <!-- Start Games Input Modal -->
  {#if showStartGamesInput}
    <div
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onclick={() => showStartGamesInput = false}
      onkeydown={(e) => e.key === 'Escape' && (showStartGamesInput = false)}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div
        class="bg-bg-card rounded-2xl p-6 mx-4 max-w-sm w-full"
        onclick={(e) => e.stopPropagation()}
        role="document"
      >
        <h3 class="text-lg font-bold mb-4 text-center">打ち始めゲーム数</h3>
        <input
          type="number"
          inputmode="numeric"
          class="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border text-center text-xl font-bold tabular-nums focus:outline-none focus:border-blue-500"
          bind:value={startGamesInputValue}
          onkeydown={(e) => e.key === 'Enter' && confirmStartGames()}
        />
        <p class="text-xs text-gray-500 text-center mt-2">台に表示されているゲーム数を入力</p>
        <div class="flex gap-3 mt-4">
          <button
            class="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 font-semibold transition-colors"
            onclick={() => showStartGamesInput = false}
          >
            キャンセル
          </button>
          <button
            class="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 font-semibold transition-colors"
            onclick={confirmStartGames}
          >
            設定
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
</div>
