<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { isAuthenticated, authLoading, userRole } from '$lib/stores/authStore';
	import { subscribeToReports } from '$lib/services/reportService';
	import LazyModerationPanel from '$lib/components/moderation/LazyModerationPanel.svelte';
	import type { Report, FilterOptions } from '$lib/types';
	import type { Unsubscribe } from 'firebase/firestore';

	let reports: Report[] = $state([]);
	let isLoading = $state(true);
	let unsubscribe: Unsubscribe | null = null;
	let selectedReport: Report | null = $state(null);
	let viewMode: 'all' | 'flagged' = $state('all');

	$effect(() => {
		if (!$authLoading) {
			if (!$isAuthenticated) {
				goto('/login');
			} else if ($userRole !== 'moderator' && $userRole !== 'admin') {
				goto('/');
			}
		}
	});

	function loadReports() {
		if (unsubscribe) unsubscribe();
		isLoading = true;
		const filters: FilterOptions = viewMode === 'flagged' ? { status: 'flagged' } : {};
		unsubscribe = subscribeToReports(filters, (updatedReports) => {
			reports = updatedReports;
			isLoading = false;
		});
	}

	function selectReport(report: Report) {
		selectedReport = report;
	}

	function closeReportDetail() {
		selectedReport = null;
	}

	function formatDate(timestamp: any): string {
		if (!timestamp) return 'N/A';
		try {
			const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
			return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
		} catch { return 'N/A'; }
	}

	function getStatusClass(status: string): string {
		if (status === 'flagged') return 'status-flagged';
		if (status === 'removed') return 'status-removed';
		return 'status-active';
	}

	onMount(() => loadReports());
	onDestroy(() => { if (unsubscribe) unsubscribe(); });
</script>

<svelte:head>
	<title>Moderation - CrimeWatch</title>
</svelte:head>

<div class="mod-page">
	{#if $authLoading}
		<div class="center"><div class="spinner"></div><p>Loading...</p></div>
	{:else if $isAuthenticated && ($userRole === 'moderator' || $userRole === 'admin')}
		<div class="mod-container">
			<div class="header">
				<div><h1>Moderation Panel</h1><p>Manage reports</p></div>
				<div class="toggle">
					<button class:active={viewMode === 'all'} onclick={() => { viewMode = 'all'; loadReports(); }}>All</button>
					<button class:active={viewMode === 'flagged'} onclick={() => { viewMode = 'flagged'; loadReports(); }}>Flagged</button>
				</div>
			</div>
			{#if isLoading}
				<div class="center"><div class="spinner"></div></div>
			{:else if reports.length === 0}
				<div class="center"><p>No reports found</p></div>
			{:else}
				<div class="table-wrap">
					<table>
						<thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
						<tbody>
							{#each reports as r (r.id)}
								<tr>
									<td>{r.title}</td>
									<td><span class="type">{r.crimeType}</span></td>
									<td><span class="status {getStatusClass(r.status)}">{r.status}</span></td>
									<td>{formatDate(r.createdAt)}</td>
									<td><button onclick={() => selectReport(r)}>View</button></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
		{#if selectedReport}
			<div class="overlay" onclick={closeReportDetail}>
				<div class="modal" onclick={(e) => e.stopPropagation()}>
					<div class="modal-head"><h2>Report Details</h2><button onclick={closeReportDetail}>×</button></div>
					<div class="modal-body">
						<h3>{selectedReport.title}</h3>
						<p>{selectedReport.description}</p>
						<p><strong>Author:</strong> {selectedReport.authorName}</p>
						<LazyModerationPanel reportId={selectedReport.id} report={selectedReport} targetType="report" />
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="center"><h2>Access Denied</h2><a href="/">Home</a></div>
	{/if}
</div>

<style>
	.mod-page { min-height: calc(100vh - 200px); }
	.mod-container { max-width: 1200px; margin: 0 auto; }
	.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
	.header h1 { font-size: 1.5rem; font-weight: 700; margin: 0; }
	.header p { color: #6b7280; margin: 0.25rem 0 0; }
	.toggle { display: flex; gap: 0.5rem; }
	.toggle button { padding: 0.5rem 1rem; background: white; border: 1px solid #d1d5db; border-radius: 0.5rem; cursor: pointer; }
	.toggle button.active { background: #3b82f6; color: white; border-color: #3b82f6; }
	.center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; color: #6b7280; }
	.spinner { width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	.table-wrap { background: white; border: 1px solid #e5e7eb; border-radius: 0.75rem; overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; min-width: 500px; }
	th { padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; background: #f9fafb; text-transform: uppercase; }
	td { padding: 1rem; border-bottom: 1px solid #f3f4f6; font-size: 0.875rem; }
	.type { padding: 0.25rem 0.5rem; background: #dbeafe; color: #1e40af; border-radius: 0.25rem; font-size: 0.75rem; }
	.status { padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
	.status-active { background: #d1fae5; color: #065f46; }
	.status-flagged { background: #fef3c7; color: #92400e; }
	.status-removed { background: #fee2e2; color: #991b1b; }
	td button { padding: 0.375rem 0.75rem; background: white; border: 1px solid #d1d5db; border-radius: 0.375rem; cursor: pointer; }
	td button:hover { background: #f9fafb; }
	.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-start; justify-content: center; z-index: 200; padding: 2rem 1rem; overflow-y: auto; }
	.modal { background: white; border-radius: 0.75rem; max-width: 600px; width: 100%; }
	.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
	.modal-head h2 { font-size: 1.25rem; font-weight: 700; margin: 0; }
	.modal-head button { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; }
	.modal-body { padding: 1.5rem; }
	.modal-body h3 { font-size: 1.125rem; font-weight: 600; margin: 0 0 0.5rem; }
	.modal-body p { color: #6b7280; margin: 0 0 1rem; }
</style>
