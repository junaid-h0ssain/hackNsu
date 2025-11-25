<script lang="ts">
	import { goto } from '$app/navigation';
	import { isAuthenticated, authLoading } from '$lib/stores/authStore';
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
	import type { User } from '$lib/types';

	// Redirect if already authenticated
	$effect(() => {
		if (!$authLoading && $isAuthenticated) {
			goto('/');
		}
	});

	function handleLoginSuccess(event: CustomEvent<User>) {
		goto('/');
	}
</script>

<svelte:head>
	<title>Login - CrimeWatch</title>
	<meta name="description" content="Login to CrimeWatch to report crimes and interact with the community." />
</svelte:head>

<div class="login-page">
	{#if $authLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading...</p>
		</div>
	{:else if !$isAuthenticated}
		<div class="login-container">
			<div class="login-header">
				<a href="/" class="back-link">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="19" y1="12" x2="5" y2="12"/>
						<polyline points="12 19 5 12 12 5"/>
					</svg>
					Back to Home
				</a>
			</div>

			<LoginForm onSuccess={handleLoginSuccess} />

			<div class="login-footer">
				<p>Don't have an account? <a href="/register">Register here</a></p>
			</div>
		</div>
	{/if}
</div>

<style>
	.login-page {
		min-height: calc(100vh - 200px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
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

	.login-container {
		width: 100%;
		max-width: 450px;
	}

	.login-header {
		margin-bottom: 1.5rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: #6b7280;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: #3b82f6;
	}

	.login-footer {
		margin-top: 1.5rem;
		text-align: center;
	}

	.login-footer p {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.login-footer a {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
	}

	.login-footer a:hover {
		text-decoration: underline;
	}

	@media (max-width: 768px) {
		.login-page {
			padding: 1rem 0.5rem;
		}
	}
</style>
