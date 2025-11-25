<script lang="ts">
	import { goto } from '$app/navigation';
	import { isAuthenticated, authLoading } from '$lib/stores/authStore';
	import Profile from '$lib/components/profile/Profile.svelte';

	// Redirect if not authenticated
	$effect(() => {
		if (!$authLoading && !$isAuthenticated) {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>Profile - CrimeWatch</title>
	<meta name="description" content="View and manage your CrimeWatch profile, reports, and activity." />
</svelte:head>

<div class="profile-page">
	{#if $authLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading...</p>
		</div>
	{:else if $isAuthenticated}
		<Profile />
	{:else}
		<div class="redirect-message">
			<p>Redirecting to login...</p>
		</div>
	{/if}
</div>

<style>
	.profile-page {
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
</style>
