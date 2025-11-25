<script lang="ts">
	import { onMount } from 'svelte';
	import type { Report } from '$lib/types';
	import type { ComponentType } from 'svelte';

	export let reports: Report[] = [];
	export let center: { lat: number; lng: number } = { lat: 23.8103, lng: 90.4125 };

	let CrimeMapComponent: ComponentType | null = null;
	let isLoading = true;
	let loadError: string | null = null;

	onMount(async () => {
		try {
			const module = await import('./CrimeMap.svelte');
			CrimeMapComponent = module.default;
		} catch (error) {
			console.error('Failed to load CrimeMap:', error);
			loadError = 'Failed to load map component';
		} finally {
			isLoading = false;
		}
	});
</script>

{#if isLoading}
	<div class="lazy-loading" role="status" aria-live="polite">
		<div class="spinner"></div>
		<p>Loading map...</p>
	</div>
{:else if loadError}
	<div class="lazy-error" role="alert">
		<p>{loadError}</p>
		<button onclick={() => location.reload()}>Retry</button>
	</div>
{:else if CrimeMapComponent}
	<svelte:component this={CrimeMapComponent} {reports} {center} on:markerClick />
{/if}

<style>
	.lazy-loading, .lazy-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		background-color: #f9fafb;
		border-radius: 0.5rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.lazy-loading p, .lazy-error p {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.lazy-error {
		color: #ef4444;
	}

	.lazy-error button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
	}

	.lazy-error button:hover {
		background-color: #2563eb;
	}
</style>
