<script lang="ts">
  export let isOpen = false;
  export let currentValue: number;
  export let onConfirm: (value: number) => void;
  export let onClose: () => void;

  let tempValue = 0;

  $: if (isOpen) {
    tempValue = currentValue;
  }

  function adjustValue(delta: number) {
    tempValue = Math.max(0, tempValue + delta);
  }

  function handleConfirm() {
    onConfirm(tempValue);
    onClose();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

{#if isOpen}
  <div class="modal" on:click={handleBackdropClick} role="dialog" aria-modal="true">
    <div class="modal-content">
      <h3>総回転数を入力</h3>

      <div class="value-display">{tempValue}</div>

      <div class="increment-buttons">
        <button class="btn-increment" on:click={() => adjustValue(1000)}>+1000</button>
        <button class="btn-increment" on:click={() => adjustValue(100)}>+100</button>
        <button class="btn-increment" on:click={() => adjustValue(10)}>+10</button>
      </div>

      <div class="decrement-buttons">
        <button class="btn-decrement" on:click={() => adjustValue(-1000)}>-1000</button>
        <button class="btn-decrement" on:click={() => adjustValue(-100)}>-100</button>
        <button class="btn-decrement" on:click={() => adjustValue(-10)}>-10</button>
      </div>

      <div class="modal-buttons">
        <button class="btn-secondary" on:click={onClose}>キャンセル</button>
        <button class="btn-primary" on:click={handleConfirm}>確定</button>
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
    max-width: 340px;
  }

  h3 {
    font-size: 1rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  .value-display {
    font-size: 2.5rem;
    font-weight: 700;
    text-align: center;
    padding: 1rem;
    margin-bottom: 1rem;
    background: var(--bg-primary);
    border-radius: 12px;
    color: var(--accent);
  }

  .increment-buttons,
  .decrement-buttons {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .btn-increment,
  .btn-decrement {
    flex: 1;
    padding: 0.875rem;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-increment {
    background: rgba(34, 197, 94, 0.2);
    color: rgb(34, 197, 94);
    border: 2px solid rgba(34, 197, 94, 0.3);
  }

  .btn-increment:active {
    background: rgba(34, 197, 94, 0.35);
    transform: scale(0.95);
  }

  .btn-decrement {
    background: rgba(239, 68, 68, 0.2);
    color: rgb(239, 68, 68);
    border: 2px solid rgba(239, 68, 68, 0.3);
  }

  .btn-decrement:active {
    background: rgba(239, 68, 68, 0.35);
    transform: scale(0.95);
  }

  .modal-buttons {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.25rem;
  }

  .modal-buttons button {
    flex: 1;
    padding: 0.875rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .btn-primary {
    background: var(--accent);
    color: white;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
  }

  .modal-buttons button:active {
    opacity: 0.8;
  }
</style>
