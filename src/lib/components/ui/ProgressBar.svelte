<script lang="ts">
  export let progress: number = 0;
  export let showLabel: boolean = true;
  export let label: string = '';
  export let color: 'blue' | 'green' | 'red' | 'yellow' = 'blue';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let indeterminate: boolean = false;

  $: clampedProgress = Math.min(100, Math.max(0, progress));
  $: displayLabel = label || `${Math.round(clampedProgress)}%`;

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-500',
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4',
  };
</script>

<div class="progress-container w-full" role="progressbar" aria-valuenow={clampedProgress} aria-valuemin="0" aria-valuemax="100" aria-label={displayLabel}>
  {#if showLabel}
    <div class="flex justify-between mb-1">
      <span class="text-sm font-medium text-gray-700">{label || 'Progress'}</span>
      <span class="text-sm font-medium text-gray-700">{Math.round(clampedProgress)}%</span>
    </div>
  {/if}
  <div class="progress-track w-full bg-gray-200 rounded-full overflow-hidden {sizeClasses[size]}">
    {#if indeterminate}
      <div class="progress-bar-indeterminate {colorClasses[color]} h-full rounded-full"></div>
    {:else}
      <div
        class="progress-bar {colorClasses[color]} h-full rounded-full transition-all duration-300 ease-out"
        style="width: {clampedProgress}%"
      ></div>
    {/if}
  </div>
</div>

<style>
  .progress-bar-indeterminate {
    width: 30%;
    animation: indeterminate 1.5s ease-in-out infinite;
  }

  @keyframes indeterminate {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
  }
</style>
