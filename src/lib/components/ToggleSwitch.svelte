<script lang="ts">
  export let checked = false;
  export let onChange: (checked: boolean) => void = () => {};
</script>

<label class="toggle-switch">
  <input type="checkbox" bind:checked on:change={() => onChange(checked)} />
  <span class="toggle-slider"></span>
</label>

<style>
  .toggle-switch {
    position: relative;
    width: 50px;
    height: 26px;
    display: inline-block;
  }

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: var(--bg-card);
    border-radius: 26px;
    transition: background 0.2s;
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    left: 3px;
    bottom: 3px;
    background: var(--text-primary);
    border-radius: 50%;
    transition: transform 0.2s;
  }

  input:checked + .toggle-slider {
    background: var(--accent);
  }

  input:checked + .toggle-slider::before {
    transform: translateX(24px);
  }
</style>
