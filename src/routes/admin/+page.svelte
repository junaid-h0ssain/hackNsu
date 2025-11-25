<script lang="ts">
	import { goto } from '$app/navigation';
	import { isAuthenticated, authLoading, userRole } from '$lib/stores/authStore';
	import LazyUserManagement from '$lib/components/admin/LazyUserManagement.svelte';

	// Redirect if not authenticated or not admin
	$effect(() => {
		if (!$authLoading) {
			if (!$isAuthenticated) {
				goto('/login');
			} else if ($userRole !== 'admin') {
				goto('/');
			}
		}
	});
</script>

<svelte:head>
	<title>Admin Panel - CrimeWatch</title>
	<meta name="description" content="Admin panel for managing users and roles on CrimeWatch." />
</svelte:head>

<div class="admin-page">
	{#if $authLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading...</p>
		</div>
	{:else if $isAuthenticated && $userRole === 'admin'}
		<LazyUserManagement />
	{:else if !$isAuthenticated}
		<div class="redirect-message">
			<p>Redirecting to login...</p>
		</div>
	{:else}
		<div class="access-denied">
			<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
				<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
			</svg>
			<h2>Access Denied</h2>
			<p>You don't have permission to access this page.</p>
			<a href="/" class="btn-home">Return to Home</a>
		</div>
	{/if}
</div>

<style>
	.admin-page {
		min-height: calc(100vh - 200px);
	}

	.loading-state,
	.redirect-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		color: #6b7280;
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

	.access-denied {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		text-align: center;
		padding: 2rem;
	}

	.access-denied svg {
		color: #ef4444;
		margin-bottom: 1.5rem;
	}

	.access-denied h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.access-denied p {
		color: #6b7280;
		margin: 0 0 1.5rem 0;
	}

	.btn-home {
		display: inline-flex;
		align-items: center;
		padding: 0.75rem 1.5rem;
		background-color: #3b82f6;
		color: white;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		transition: background-color 0.2s;
	}

	.btn-home:hover {
		background-color: #2563eb;
	}
</style>
