<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { AppError, ErrorCategory } from '$lib/utils/errorHandling';

  export let error: AppError | string | null = null;
  export let dismissible: boolean = true;
  export let showRetry: boolean = false;

  const dispatch = createEventDispatcher<{ dismiss: void; retry: void }>();

  $: errorMessage = typeof error === 'string' ? error : error?.message || '';
  $: errorCategory = typeof error === 'string' ? 'unknown' : (error?.category || 'unknown');
  $: isRetryable = typeof error === 'object' && error?.retryable;

  const categoryStyles: Record<ErrorCategory, { bg: string; border: string; icon: string }> = {
    auth: { bg: 'bg-yellow-50', border: 'border-yellow-400', icon: '🔐' },
    network: { bg: 'bg-orange-50', border: 'border-orange-400', icon: '📡' },
    validation: { bg: 'bg-blue-50', border: 'border-blue-400', icon: '⚠️' },
    permission: { bg: 'bg-red-50', border: 'border-red-400', icon: '🚫' },
    storage: { bg: 'bg-purple-50', border: 'border-purple-400', icon: '💾' },
    ai: { bg: 'bg-indigo-50', border: 'border-indigo-400', icon: '🤖' },
    unknown: { bg: 'bg-red-50', border: 'border-red-400', icon: '❌' },
  };

  $: styles = categoryStyles[errorCategory as ErrorCategory] || categoryStyles.unknown;

  function handleDismiss() {
    dispatch('dismiss');
  }

  function handleRetry() {
    dispatch('retry');
  }
</script>

{#if error && errorMessage}
  <div
    class="error-alert {styles.bg} {styles.border} border-l-4 p-4 rounded-r-lg"
    role="alert"
    aria-live="assertive"
  >
    <div class="flex items-start">
      <span class="error-icon text-xl mr-3" aria-hidden="true">{styles.icon}</span>
      <div class="flex-1">
        <p class="error-message text-sm font-medium text-gray-800">{errorMessage}</p>
        {#if showRetry && isRetryable}
          <button
            type="button"
            on:click={handleRetry}
            class="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 underline"
          >
            Try again
          </button>
        {/if}
      </div>
      {#if dismissible}
        <button
          type="button"
          on:click={handleDismiss}
          class="ml-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
          aria-label="Dismiss error"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .error-alert {
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
