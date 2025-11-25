<script lang="ts">
	import { goto } from '$app/navigation';
	import { isAuthenticated, authLoading } from '$lib/stores/authStore';
	import ReportList from '$lib/components/reports/ReportList.svelte';
	import ReportForm from '$lib/components/reports/ReportForm.svelte';

	let showReportForm = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');

	function handleCreateReport() {
		if (!$isAuthenticated) {
			goto('/login');
			return;
		}
		showReportForm = true;
	}

	function handleReportSuccess(event: CustomEvent<string>) {
		showReportForm = false;
		successMessage = 'Report submitted successfully!';
		setTimeout(() => {
			successMessage = '';
		}, 5000);
	}

	function handleReportError(event: CustomEvent<string>) {
		errorMessage = event.detail || 'Failed to submit report';
		setTimeout(() => {
			errorMessage = '';
		}, 5000);
	}

	function closeReportForm() {
		showReportForm = false;
	}
</script>

<svelte:head>
	<title>Crime Feed - CrimeWatch</title>
	<meta name="description" content="View and report crimes in your community. Stay informed about local incidents." />
</svelte:head>

<div class="home-page">
	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-content">
			<h1>Community Crime Reporting</h1>
			<p>Report incidents, verify reports, and stay informed about safety in your area.</p>
			<button class="btn-create-report" onclick={handleCreateReport}>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="12" y1="5" x2="12" y2="19"/>
					<line x1="5" y1="12" x2="19" y2="12"/>
				</svg>
				Create Report
			</button>
		</div>
	</section>

	<!-- Success/Error Messages -->
	{#if successMessage}
		<div class="message success-message">
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
				<polyline points="22 4 12 14.01 9 11.01"/>
			</svg>
			{successMessage}
		</div>
	{/if}

	{#if errorMessage}
		<div class="message error-message">
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10"/>
				<line x1="12" y1="8" x2="12" y2="12"/>
				<line x1="12" y1="16" x2="12.01" y2="16"/>
			</svg>
			{errorMessage}
		</div>
	{/if}

	<!-- Report Form Modal -->
	{#if showReportForm}
		<div class="modal-overlay" onclick={closeReportForm}>
			<div class="modal-content" onclick={(e) => e.stopPropagation()}>
				<button class="modal-close" onclick={closeReportForm} aria-label="Close form">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
				<ReportForm on:success={handleReportSuccess} on:error={handleReportError} />
			</div>
		</div>
	{/if}

	<!-- Crime Feed -->
	<section class="feed-section">
		<ReportList />
	</section>
</div>

<style>
	.home-page {
		width: 100%;
	}

	/* Hero Section */
	.hero {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 1rem;
		padding: 3rem 2rem;
		margin-bottom: 2rem;
		text-align: center;
		color: white;
	}

	.hero-content h1 {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.75rem 0;
	}

	.hero-content p {
		font-size: 1.125rem;
		opacity: 0.9;
		margin: 0 0 1.5rem 0;
	}

	.btn-create-report {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		background-color: white;
		color: #667eea;
		font-size: 1rem;
		font-weight: 600;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.btn-create-report:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
	}

	/* Messages */
	.message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		font-size: 0.9375rem;
		font-weight: 500;
	}

	.success-message {
		background-color: #d1fae5;
		color: #065f46;
		border: 1px solid #a7f3d0;
	}

	.error-message {
		background-color: #fee2e2;
		color: #991b1b;
		border: 1px solid #fecaca;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		z-index: 200;
		padding: 2rem 1rem;
		overflow-y: auto;
	}

	.modal-content {
		position: relative;
		background-color: white;
		border-radius: 1rem;
		max-width: 800px;
		width: 100%;
		max-height: calc(100vh - 4rem);
		overflow-y: auto;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		padding: 0.5rem;
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		border-radius: 0.5rem;
		z-index: 10;
		transition: all 0.2s;
	}

	.modal-close:hover {
		background-color: #f3f4f6;
		color: #1f2937;
	}

	/* Feed Section */
	.feed-section {
		width: 100%;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero {
			padding: 2rem 1rem;
			border-radius: 0.75rem;
		}

		.hero-content h1 {
			font-size: 1.5rem;
		}

		.hero-content p {
			font-size: 1rem;
		}

		.modal-overlay {
			padding: 1rem 0.5rem;
		}

		.modal-content {
			border-radius: 0.75rem;
		}
	}
</style>
