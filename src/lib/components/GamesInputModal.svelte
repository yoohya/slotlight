<script lang="ts">
  export let isOpen = false;
  export let currentValue: number;
  export let onConfirm: (value: number) => void;
  export let onClose: () => void;

  let inputValue = '';

  $: if (isOpen) {
    inputValue = currentValue > 0 ? String(currentValue) : '';
  }

  function handleConfirm() {
    const value = parseInt(inputValue, 10);
    if (!isNaN(value) && value >= 0) {
      onConfirm(value);
    }
    onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleConfirm();
    }
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
      <input
        type="number"
        bind:value={inputValue}
        on:keydown={handleKeydown}
        inputmode="numeric"
        pattern="[0-9]*"
        min="0"
      />
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
    max-width: 320px;
  }

  h3 {
    font-size: 1rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  input {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1.25rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: var(--bg-primary);
    color: var(--text-primary);
    text-align: center;
    margin-bottom: 1rem;
  }

  input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .modal-buttons {
    display: flex;
    gap: 0.75rem;
  }

  .modal-buttons button {
    flex: 1;
    padding: 0.75rem;
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
