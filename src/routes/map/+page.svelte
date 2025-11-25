<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { subscribeToReports } from '$lib/services/reportService';
	import LazyMap from '$lib/components/map/LazyMap.svelte';
	import type { Report, FilterOptions } from '$lib/types';
	import type { Unsubscribe } from 'firebase/firestore';

	// State
	let reports: Report[] = $state([]);
	let filteredReports: Report[] = $state([]);
	let isLoading = $state(true);
	let unsubscribe: Unsubscribe | null = null;

	// Filter state
	let selectedCrimeType = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let showFilters = $state(false);

	// Crime type options
	const crimeTypes = [
		{ value: '', label: 'All Types' },
		{ value: 'theft', label: 'Theft' },
		{ value: 'assault', label: 'Assault' },
		{ value: 'vandalism', label: 'Vandalism' },
		{ value: 'burglary', label: 'Burglary' },
		{ value: 'fraud', label: 'Fraud' },
		{ value: 'robbery', label: 'Robbery' },
		{ value: 'harassment', label: 'Harassment' },
		{ value: 'other', label: 'Other' }
	];

	function applyFilters() {
		let filtered = [...reports];

		// Filter by crime type
		if (selectedCrimeType) {
			filtered = filtered.filter(r => r.crimeType === selectedCrimeType);
		}

		// Filter by start date
		if (startDate) {
			const start = new Date(startDate);
			filtered = filtered.filter(r => {
				const reportDate = r.createdAt?.toDate?.() || new Date();
				return reportDate >= start;
			});
		}

		// Filter by end date
		if (endDate) {
			const end = new Date(endDate);
			end.setHours(23, 59, 59, 999);
			filtered = filtered.filter(r => {
				const reportDate = r.createdAt?.toDate?.() || new Date();
				return reportDate <= end;
			});
		}

		filteredReports = filtered;
	}

	function clearFilters() {
		selectedCrimeType = '';
		startDate = '';
		endDate = '';
		filteredReports = reports;
	}

	function handleMarkerClick(event: CustomEvent<string>) {
		const reportId = event.detail;
		// Could navigate to report detail or show a modal
		console.log('Marker clicked:', reportId);
	}

	// Apply filters when filter values change
	$effect(() => {
		if (reports.length > 0) {
			applyFilters();
		}
	});

	onMount(() => {
		const filters: FilterOptions = { status: 'active' };
		
		unsubscribe = subscribeToReports(filters, (updatedReports) => {
			reports = updatedReports;
			applyFilters();
			isLoading = false;
		});
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
</script>

<svelte:head>
	<title>Crime Map - CrimeWatch</title>
	<meta name="description" content="View crime reports on an interactive map. Explore incidents in your area." />
</svelte:head>

<div class="map-page">
	<!-- Header -->
	<div class="page-header">
		<div class="header-content">
			<h1>Crime Map</h1>
			<p>Explore crime reports in your area</p>
		</div>
		<button class="btn-filter" onclick={() => showFilters = !showFilters}>
			<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
			</svg>
			{showFilters ? 'Hide Filters' : 'Show Filters'}
		</button>
	</div>

	<!-- Filter Panel -->
	{#if showFilters}
		<div class="filter-panel">
			<div class="filter-row">
				<div class="filter-group">
					<label for="crimeType">Crime Type</label>
					<select id="crimeType" bind:value={selectedCrimeType}>
						{#each crimeTypes as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</div>

				<div class="filter-group">
					<label for="startDate">From Date</label>
					<input type="date" id="startDate" bind:value={startDate} />
				</div>

				<div class="filter-group">
					<label for="endDate">To Date</label>
					<input type="date" id="endDate" bind:value={endDate} />
				</div>
			</div>

			<div class="filter-actions">
				<button class="btn-secondary" onclick={clearFilters}>
					Clear Filters
				</button>
				<span class="filter-count">
					Showing {filteredReports.length} of {reports.length} reports
				</span>
			</div>
		</div>
	{/if}

	<!-- Map Container -->
	<div class="map-container">
		{#if isLoading}
			<div class="loading-overlay">
				<div class="spinner"></div>
				<p>Loading map data...</p>
			</div>
		{/if}
		<LazyMap reports={filteredReports} on:markerClick={handleMarkerClick} />
	</div>

	<!-- Legend -->
	<div class="map-legend">
		<h3>Severity Legend</h3>
		<div class="legend-items">
			<div class="legend-item">
				<span class="legend-marker high"></span>
				<span>High</span>
			</div>
			<div class="legend-item">
				<span class="legend-marker medium"></span>
				<span>Medium</span>
			</div>
			<div class="legend-item">
				<span class="legend-marker low"></span>
				<span>Low</span>
			</div>
			<div class="legend-item">
				<span class="legend-marker unknown"></span>
				<span>Unknown</span>
			</div>
		</div>
	</div>
</div>

<style>
	.map-page {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: calc(100vh - 180px);
		min-height: 600px;
	}

	/* Header */
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-content h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
		margin: 0;
	}

	.header-content p {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0.25rem 0 0 0;
	}

	.btn-filter {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background-color: white;
		color: #374151;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-filter:hover {
		background-color: #f9fafb;
		border-color: #9ca3af;
	}

	/* Filter Panel */
	.filter-panel {
		background-color: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1.25rem;
	}

	.filter-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.filter-group label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #374151;
	}

	.filter-group select,
	.filter-group input {
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		transition: border-color 0.2s;
	}

	.filter-group select:focus,
	.filter-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.filter-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.btn-secondary {
		padding: 0.5rem 1rem;
		background-color: white;
		color: #6b7280;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-secondary:hover {
		background-color: #f9fafb;
	}

	.filter-count {
		font-size: 0.8125rem;
		color: #6b7280;
	}

	/* Map Container */
	.map-container {
		position: relative;
		flex: 1;
		min-height: 400px;
		background-color: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(255, 255, 255, 0.9);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 10;
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

	.loading-overlay p {
		color: #6b7280;
		font-size: 0.875rem;
	}

	/* Legend */
	.map-legend {
		background-color: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
	}

	.map-legend h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 0.75rem 0;
	}

	.legend-items {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: #6b7280;
	}

	.legend-marker {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.legend-marker.high {
		background-color: #ef4444;
	}

	.legend-marker.medium {
		background-color: #f59e0b;
	}

	.legend-marker.low {
		background-color: #10b981;
	}

	.legend-marker.unknown {
		background-color: #6b7280;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.map-page {
			height: auto;
			min-height: auto;
		}

		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.btn-filter {
			width: 100%;
			justify-content: center;
		}

		.filter-row {
			grid-template-columns: 1fr;
		}

		.filter-actions {
			flex-direction: column;
			gap: 0.75rem;
			align-items: stretch;
		}

		.btn-secondary {
			width: 100%;
		}

		.filter-count {
			text-align: center;
		}

		.map-container {
			min-height: 500px;
		}

		.legend-items {
			gap: 1rem;
		}
	}
</style>
