<script lang="ts">
  import { appStore } from './lib/store';
  import MachineSelect from './lib/components/MachineSelect.svelte';
  import CounterScreen from './lib/components/CounterScreen.svelte';

  $: currentMachine = $appStore.currentMachine;
</script>

{#if currentMachine}
  <CounterScreen />
{:else}
  <MachineSelect />
{/if}
