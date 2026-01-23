<script lang="ts">
  import { getMachineList } from '../machines';
  import { appStore } from '../store';
  import type { MachineData } from '../types';

  const machines = getMachineList();

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
        <button
          class="flex items-center justify-between p-4 bg-bg-card rounded-xl border border-border hover:bg-bg-card-hover hover:border-gray-600 active:scale-[0.98] transition-all text-left"
          onclick={() => handleSelect(machine)}
        >
          <div>
            <div class="font-semibold">{machine.machineName}</div>
            <div class="text-xs text-gray-500 mt-1">{machine.maker}</div>
          </div>
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      {/each}
    </div>
  </main>
</div>
