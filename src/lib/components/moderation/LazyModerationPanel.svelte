<script lang="ts">
	import { onMount } from 'svelte';
	import type { Report } from '$lib/types';

	export let reportId: string;
	export let report: Report | null = null;
	export let commentId: string | null = null;
	export let userId: string | null = null;
	export let targetType: 'report' | 'comment' | 'user' = 'report';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let ModerationPanelComponent: any = null;
	let isLoading = true;
	let loadError: string | null = null;

	onMount(async () => {
		try {
			const module = await import('./ModerationPanel.svelte');
			ModerationPanelComponent = module.default;
		} catch (error) {
			console.error('Failed to load ModerationPanel:', error);
			loadError = 'Failed to load moderation panel';
		} finally {
			isLoading = false;
		}
	});
</script>

{#if isLoading}
	<div class="lazy-loading" role="status" aria-live="polite">
		<div class="spinner-small"></div>
	</div>
{:else if loadError}
	<div class="lazy-error" role="alert">
		<p>{loadError}</p>
	</div>
{:else if ModerationPanelComponent}
	<svelte:component 
		this={ModerationPanelComponent} 
		{reportId} 
		{report} 
		{commentId} 
		{userId} 
		{targetType} 
	/>
{/if}

<style>
	.lazy-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.spinner-small {
		width: 24px;
		height: 24px;
		border: 3px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.lazy-error {
		padding: 0.5rem;
		color: #ef4444;
		font-size: 0.75rem;
	}
</style>
