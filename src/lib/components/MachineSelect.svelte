<script lang="ts">
  import { getMachineList } from '../machines';
  import { appStore } from '../store';
  import type { MachineData } from '../types';

  const machines = getMachineList();
  const STORAGE_KEY = 'slotlight_data';
  const FAVORITES_KEY = 'slotlight_favorites';

  // 保存データを取得
  function getSavedData(): { machineId: string; totalGames: number } | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      const totalGames = Math.max(0, (parsed.currentGames || 0) - (parsed.startGames || 0));
      return {
        machineId: parsed.machineId,
        totalGames,
      };
    } catch {
      return null;
    }
  }

  // お気に入り機種を取得
  function getFavorites(): Set<string> {
    try {
      const data = localStorage.getItem(FAVORITES_KEY);
      if (!data) return new Set();
      return new Set(JSON.parse(data));
    } catch {
      return new Set();
    }
  }

  // お気に入り機種を保存
  function saveFavorites(favorites: Set<string>) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  }

  const savedData = getSavedData();
  let favorites = $state(getFavorites());

  // お気に入りをトグル
  function toggleFavorite(e: MouseEvent, machineId: string) {
    e.stopPropagation();
    if (favorites.has(machineId)) {
      favorites.delete(machineId);
    } else {
      favorites.add(machineId);
    }
    favorites = new Set(favorites); // リアクティブ更新
    saveFavorites(favorites);
  }

  // お気に入り順にソートした機種リスト
  const sortedMachines = $derived(
    [...machines].sort((a, b) => {
      const aFav = favorites.has(a.id) ? 1 : 0;
      const bFav = favorites.has(b.id) ? 1 : 0;
      return bFav - aFav;
    })
  );

  function handleSelect(machine: MachineData) {
    appStore.selectMachine(machine);
  }
</script>

<div class="h-full flex flex-col bg-bg-primary">
  <!-- Header -->
  <header class="flex items-center justify-center py-4 border-b border-border">
    <div class="text-center">
      <h1 class="text-2xl font-bold bg-gradient-to-r from-accent to-red-400 bg-clip-text text-transparent">
        Slotlight
      </h1>
      <p class="text-xs text-gray-500 mt-1">子役カウンター</p>
    </div>
  </header>

  <!-- Machine List -->
  <main class="flex-1 overflow-auto p-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
      {#each sortedMachines as machine (machine.id)}
        {@const hasSavedData = savedData?.machineId === machine.id && savedData.totalGames > 0}
        {@const isFavorite = favorites.has(machine.id)}
        <div
          class="relative flex items-center justify-between p-4 bg-bg-card rounded-xl border transition-all text-left cursor-pointer active:scale-[0.98] {hasSavedData ? 'border-success/50 hover:border-success' : 'border-border hover:border-gray-600'} hover:bg-bg-card-hover"
          onclick={() => handleSelect(machine)}
          onkeydown={(e) => e.key === 'Enter' && handleSelect(machine)}
          role="button"
          tabindex="0"
        >
          <!-- Favorite Button -->
          <button
            class="absolute top-2 right-8 p-1.5 rounded-lg transition-all hover:bg-white/10 active:scale-90 z-10"
            onclick={(e) => toggleFavorite(e, machine.id)}
            aria-label={isFavorite ? 'お気に入り解除' : 'お気に入り登録'}
          >
            <svg class="w-5 h-5 transition-colors {isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500 fill-none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </button>

          <div class="flex-1 pr-8">
            <div class="font-semibold">{machine.machineName}</div>
            <div class="text-xs text-gray-500 mt-1">{machine.maker}</div>
            {#if hasSavedData}
              <div class="flex items-center gap-1 mt-2">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-semibold">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  プレイ中
                </span>
                <span class="text-[10px] text-gray-500">{savedData.totalGames.toLocaleString()}G</span>
              </div>
            {/if}
          </div>
          <svg class="w-5 h-5 text-gray-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      {/each}
    </div>
  </main>
</div>
