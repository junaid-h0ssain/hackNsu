<script lang="ts">
  import { errorStore } from '$lib/stores/errorStore';
  import ErrorAlert from './ErrorAlert.svelte';

  function handleDismiss(index: number) {
    errorStore.removeError(index);
  }
</script>

<div class="global-error-display fixed top-4 right-4 z-50 w-full max-w-md space-y-2" aria-live="polite">
  {#each $errorStore.errors as error, index (index)}
    <ErrorAlert
      {error}
      dismissible={true}
      showRetry={error.retryable}
      on:dismiss={() => handleDismiss(index)}
    />
  {/each}
</div>

<style>
  .global-error-display {
    pointer-events: none;
  }

  .global-error-display :global(.error-alert) {
    pointer-events: auto;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
</style>
