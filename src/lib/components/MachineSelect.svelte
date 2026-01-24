<script lang="ts">
  import { getMachineList } from '../machines';
  import { appStore } from '../store';
  import type { MachineData } from '../types';

  const machines = getMachineList();
  const STORAGE_KEY = 'slotlight_data';

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

  const savedData = getSavedData();

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
      {#each machines as machine (machine.id)}
        {@const hasSavedData = savedData?.machineId === machine.id && savedData.totalGames > 0}
        <button
          class="relative flex items-center justify-between p-4 bg-bg-card rounded-xl border transition-all text-left active:scale-[0.98] {hasSavedData ? 'border-success/50 hover:border-success' : 'border-border hover:border-gray-600'} hover:bg-bg-card-hover"
          onclick={() => handleSelect(machine)}
        >
          <div class="flex-1">
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
        </button>
      {/each}
    </div>
  </main>
</div>
