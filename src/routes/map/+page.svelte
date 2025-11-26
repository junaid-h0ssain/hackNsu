<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { subscribeToReports } from '$lib/services/reportService';
	import LazyMap from '$lib/components/map/LazyMap.svelte';
	import type { Report } from '$lib/types';
	import type { Unsubscribe } from 'firebase/firestore';

	let reports: Report[] = $state([]);
	let filteredReports: Report[] = $state([]);
	let isLoading = $state(true);
	let unsubscribe: Unsubscribe | null = null;
	let selectedReport: Report | null = $state(null);
	let selectedCrimeType = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let showFilters = $state(false);
	let mapCenter = $state({ lat: 23.8103, lng: 90.4125 });

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
		if (selectedCrimeType) filtered = filtered.filter(r => r.crimeType === selectedCrimeType);
		if (startDate) {
			const start = new Date(startDate);
			filtered = filtered.filter(r => (r.createdAt?.toDate?.() || new Date()) >= start);
		}
		if (endDate) {
			const end = new Date(endDate);
			end.setHours(23, 59, 59, 999);
			filtered = filtered.filter(r => (r.createdAt?.toDate?.() || new Date()) <= end);
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
		selectedReport = filteredReports.find(r => r.id === event.detail) || null;
	}

	function closeDetailPanel() { 
		selectedReport = null; 
	}

	function formatTimestamp(timestamp: any): string {
		if (!timestamp) return 'Just now';
		const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
		return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function getSeverityColor(severity: string): string {
		if (severity === 'high') return 'severity-high';
		if (severity === 'medium') return 'severity-medium';
		if (severity === 'low') return 'severity-low';
		return 'severity-unknown';
	}

	function calculateMapCenter(reportsList: Report[]) {
		if (reportsList.length === 0) return;
		const validReports = reportsList.filter(r => 
			r.location && typeof r.location.latitude === 'number' && typeof r.location.longitude === 'number'
		);
		if (validReports.length === 0) return;
		const sumLat = validReports.reduce((sum, r) => sum + r.location.latitude, 0);
		const sumLng = validReports.reduce((sum, r) => sum + r.location.longitude, 0);
		mapCenter = { lat: sumLat / validReports.length, lng: sumLng / validReports.length };
	}

	$effect(() => { 
		if (reports.length > 0) {
			applyFilters();
			calculateMapCenter(reports);
		}
	});

	onMount(() => {
		unsubscribe = subscribeToReports({ status: 'active' }, (updatedReports) => {
			reports = updatedReports;
			applyFilters();
			isLoading = false;
		});
	});

	onDestroy(() => { if (unsubscribe) unsubscribe(); });
</script>

<svelte:head><title>Crime Map - CrimeWatch</title></svelte:head>

<div class="map-page">
	<div class="page-header">
		<div class="header-content">
			<h1>Crime Map</h1>
			<p>Explore crime reports in your area. Click on markers to see details.</p>
		</div>
		<button class="btn-filter" onclick={() => showFilters = !showFilters}>
			{showFilters ? 'Hide Filters' : 'Show Filters'}
		</button>
	</div>

	{#if showFilters}
	<div class="filter-panel">
		<div class="filter-row">
			<div class="filter-group">
				<label for="crimeType">Crime Type</label>
				<select id="crimeType" bind:value={selectedCrimeType} onchange={applyFilters}>
					{#each crimeTypes as type}<option value={type.value}>{type.label}</option>{/each}
				</select>
			</div>
			<div class="filter-group">
				<label for="startDate">From</label>
				<input type="date" id="startDate" bind:value={startDate} onchange={applyFilters} />
			</div>
			<div class="filter-group">
				<label for="endDate">To</label>
				<input type="date" id="endDate" bind:value={endDate} onchange={applyFilters} />
			</div>
		</div>
		<div class="filter-actions">
			<button class="btn-secondary" onclick={clearFilters}>Clear</button>
			<span class="report-count">{filteredReports.length} of {reports.length} reports</span>
		</div>
	</div>
	{/if}

	<div class="map-legend">
		<span class="legend-title">Severity:</span>
		<span class="legend-item"><span class="dot high"></span>High</span>
		<span class="legend-item"><span class="dot medium"></span>Medium</span>
		<span class="legend-item"><span class="dot low"></span>Low</span>
	</div>

	<div class="map-detail-container">
		<div class="map-container" class:with-panel={selectedReport}>
			{#if isLoading}
				<div class="loading-overlay"><div class="spinner"></div><p>Loading crime reports...</p></div>
			{/if}
			<LazyMap reports={filteredReports} center={mapCenter} on:markerClick={handleMarkerClick} />
		</div>

		{#if selectedReport}
		<aside class="detail-panel">
			<div class="panel-header">
				<h2>Crime Details</h2>
				<button class="close-btn" onclick={closeDetailPanel} aria-label="Close panel">✕</button>
			</div>
			<div class="panel-content">
				{#if selectedReport.aiAnalysis}
				<div class="severity-badge {getSeverityColor(selectedReport.aiAnalysis.severity)}">
					{selectedReport.aiAnalysis.severity.toUpperCase()} SEVERITY
				</div>
				{/if}
				<h3 class="report-title">{selectedReport.title}</h3>
				<div class="crime-type-badge">{selectedReport.crimeType}</div>
				<div class="meta-info">
					<span>By {selectedReport.authorName}</span>
					<span>•</span>
					<span>{formatTimestamp(selectedReport.createdAt)}</span>
				</div>
				<div class="section">
					<h4>Description</h4>
					<p>{selectedReport.description}</p>
				</div>
				<div class="section">
					<h4>Location</h4>
					{#if selectedReport.location?.address}
						<p class="location-address">{selectedReport.location.address}</p>
					{:else if selectedReport.location}
						<p class="coords">{selectedReport.location.latitude.toFixed(5)}, {selectedReport.location.longitude.toFixed(5)}</p>
					{/if}
					{#if selectedReport.location}
						<a href="https://www.google.com/maps?q={selectedReport.location.latitude},{selectedReport.location.longitude}" target="_blank" rel="noopener" class="maps-link">Open in Google Maps →</a>
					{/if}
				</div>
				{#if selectedReport.aiAnalysis}
				<div class="section">
					<h4>AI Analysis</h4>
					<p class="ai-summary">{selectedReport.aiAnalysis.summary}</p>
					{#if selectedReport.aiAnalysis.categories?.length > 0}
					<div class="categories">
						{#each selectedReport.aiAnalysis.categories as cat}<span class="tag">{cat}</span>{/each}
					</div>
					{/if}
				</div>
				{/if}
				<div class="stats-row">
					<span class="upvotes">↑ {selectedReport.upvotes || 0}</span>
					<span class="downvotes">↓ {selectedReport.downvotes || 0}</span>
					<span class="comments">💬 {selectedReport.commentCount || 0}</span>
				</div>
				{#if selectedReport.mediaUrls?.length > 0}
				<div class="section">
					<h4>Evidence ({selectedReport.mediaUrls.length})</h4>
					<div class="media-grid">
						{#each selectedReport.mediaUrls as url, i}
							<a href={url} target="_blank" rel="noopener" class="media-item"><img src={url} alt="Evidence {i+1}" /></a>
						{/each}
					</div>
				</div>
				{/if}
			</div>
		</aside>
		{/if}
	</div>
</div>


<style>
	.map-page {
		padding: 1rem;
		max-width: 1600px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-content h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: #111827;
		margin: 0;
	}

	.header-content p {
		color: #6b7280;
		margin: 0.25rem 0 0 0;
		font-size: 0.9rem;
	}

	.btn-filter {
		padding: 0.5rem 1rem;
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s;
	}

	.btn-filter:hover {
		background: #e5e7eb;
	}

	.filter-panel {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1rem;
		margin-bottom: 1rem;
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
		gap: 0.25rem;
	}

	.filter-group label {
		font-size: 0.8rem;
		font-weight: 500;
		color: #374151;
	}

	.filter-group select,
	.filter-group input {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.9rem;
	}

	.filter-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.btn-secondary {
		padding: 0.5rem 1rem;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 500;
	}

	.btn-secondary:hover {
		background: #f9fafb;
	}

	.report-count {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.map-legend {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.legend-title {
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8rem;
		color: #6b7280;
	}

	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow: 0 1px 3px rgba(0,0,0,0.2);
	}

	.dot.high { background: #ef4444; }
	.dot.medium { background: #f59e0b; }
	.dot.low { background: #10b981; }

	.map-detail-container {
		display: flex;
		gap: 1rem;
		height: calc(100vh - 280px);
		min-height: 500px;
	}

	.map-container {
		flex: 1;
		position: relative;
		border-radius: 0.75rem;
		overflow: hidden;
		border: 1px solid #e5e7eb;
		transition: all 0.3s;
	}

	.map-container.with-panel {
		flex: 2;
	}

	.loading-overlay {
		position: absolute;
		inset: 0;
		background: rgba(255,255,255,0.9);
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
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.detail-panel {
		width: 380px;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #e5e7eb;
		background: #f9fafb;
	}

	.panel-header h2 {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0;
	}

	.close-btn {
		width: 32px;
		height: 32px;
		border: none;
		background: #e5e7eb;
		border-radius: 50%;
		cursor: pointer;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background: #d1d5db;
	}

	.panel-content {
		padding: 1rem;
		overflow-y: auto;
		flex: 1;
	}

	.severity-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
	}

	.severity-high { background: #fee2e2; color: #991b1b; }
	.severity-medium { background: #fef3c7; color: #92400e; }
	.severity-low { background: #d1fae5; color: #065f46; }
	.severity-unknown { background: #f3f4f6; color: #6b7280; }

	.report-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.crime-type-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		background: #dbeafe;
		color: #1e40af;
		border-radius: 0.375rem;
		font-size: 0.8rem;
		font-weight: 500;
		text-transform: capitalize;
		margin-bottom: 0.75rem;
	}

	.meta-info {
		display: flex;
		gap: 0.5rem;
		font-size: 0.8rem;
		color: #6b7280;
		margin-bottom: 1rem;
	}

	.section {
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #f3f4f6;
	}

	.section:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}

	.section h4 {
		font-size: 0.8rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 0.5rem 0;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.section p {
		margin: 0;
		color: #4b5563;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.location-address {
		color: #374151;
	}

	.coords {
		font-family: monospace;
		font-size: 0.8rem;
		color: #6b7280;
	}

	.maps-link {
		display: inline-block;
		margin-top: 0.5rem;
		color: #2563eb;
		font-size: 0.8rem;
		text-decoration: none;
	}

	.maps-link:hover {
		text-decoration: underline;
	}

	.ai-summary {
		background: #f9fafb;
		padding: 0.75rem;
		border-radius: 0.375rem;
		font-style: italic;
	}

	.categories {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-top: 0.5rem;
	}

	.tag {
		padding: 0.25rem 0.5rem;
		background: #e0e7ff;
		color: #4338ca;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.stats-row {
		display: flex;
		gap: 1rem;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.upvotes { color: #10b981; font-weight: 600; }
	.downvotes { color: #ef4444; font-weight: 600; }
	.comments { color: #6b7280; }

	.media-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.media-item {
		aspect-ratio: 1;
		border-radius: 0.375rem;
		overflow: hidden;
	}

	.media-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	@media (max-width: 768px) {
		.map-detail-container {
			flex-direction: column;
			height: auto;
		}

		.map-container {
			height: 400px;
		}

		.detail-panel {
			width: 100%;
			max-height: 50vh;
		}
	}
</style>
