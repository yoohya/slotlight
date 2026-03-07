<script lang="ts">
  import type { MachineData } from '../types';

  export let isOpen = false;
  export let machine: MachineData | null = null;
  export let onSelectMode: (mode: 'fresh' | 'midway') => void;
  export let onClose: () => void;

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
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
      class="bg-bg-card rounded-2xl p-6 mx-4 max-w-sm w-full"
      onclick={(e) => e.stopPropagation()}
      role="document"
    >
      <h3 class="text-lg font-bold mb-2 text-center">{machine.machineName}</h3>
      <p class="text-sm text-gray-400 text-center mb-6">打ち始めの状況を選択してください</p>

      <div class="space-y-3">
        <button
          class="w-full py-4 rounded-xl bg-blue-500/20 border-2 border-blue-500/50 hover:bg-blue-500/30 hover:border-blue-500 transition-all active:scale-98 text-left px-4"
          onclick={() => onSelectMode('fresh')}
        >
          <div class="font-bold text-blue-400 mb-1">最初から打つ</div>
          <div class="text-xs text-gray-400">0Gから打ち始める場合</div>
        </button>

        <button
          class="w-full py-4 rounded-xl bg-orange-500/20 border-2 border-orange-500/50 hover:bg-orange-500/30 hover:border-orange-500 transition-all active:scale-98 text-left px-4"
          onclick={() => onSelectMode('midway')}
        >
          <div class="font-bold text-orange-400 mb-1">途中から打つ</div>
          <div class="text-xs text-gray-400">台の履歴情報を入力する場合</div>
        </button>
      </div>

      <button
        class="w-full mt-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 font-semibold transition-colors"
        onclick={onClose}
      >
        キャンセル
      </button>
    </div>
  </div>
{/if}

<style>
  .active\:scale-98:active {
    transform: scale(0.98);
  }
</style>
