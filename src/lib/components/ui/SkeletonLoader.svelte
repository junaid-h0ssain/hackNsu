<script lang="ts">
  export let variant: 'text' | 'card' | 'avatar' | 'button' = 'text';
  export let lines: number = 1;
  export let width: string = '100%';
  export let height: string = 'auto';

  function getLineWidth(index: number, total: number): string {
    if (index === total - 1 && total > 1) return 'w-3/4';
    return 'w-full';
  }
</script>

<div class="skeleton-container" style="width: {width}; height: {height};" aria-busy="true" aria-label="Loading content">
  {#if variant === 'text'}
    {#each Array(lines) as _, i}
      <div
        class="skeleton-line bg-gray-200 rounded animate-pulse {getLineWidth(i, lines)}"
        style="height: 1rem; margin-bottom: {i < lines - 1 ? '0.5rem' : '0'};"
      ></div>
    {/each}
  {:else if variant === 'card'}
    <div class="skeleton-card bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div class="skeleton-line bg-gray-200 rounded animate-pulse h-4 w-3/4"></div>
      <div class="skeleton-line bg-gray-200 rounded animate-pulse h-4 w-full"></div>
      <div class="skeleton-line bg-gray-200 rounded animate-pulse h-4 w-5/6"></div>
      <div class="flex gap-2 mt-4">
        <div class="skeleton-line bg-gray-200 rounded animate-pulse h-8 w-20"></div>
        <div class="skeleton-line bg-gray-200 rounded animate-pulse h-8 w-20"></div>
      </div>
    </div>
  {:else if variant === 'avatar'}
    <div class="skeleton-avatar bg-gray-200 rounded-full animate-pulse" style="width: 48px; height: 48px;"></div>
  {:else if variant === 'button'}
    <div class="skeleton-button bg-gray-200 rounded animate-pulse" style="height: 40px; width: 100px;"></div>
  {/if}
</div>

<style>
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .animate-pulse {
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
