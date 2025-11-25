<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authStore, isAuthenticated, userRole, authLoading } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { children } = $props();

	let mobileMenuOpen = $state(false);

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	// Check if current path matches
	function isActive(path: string): boolean {
		return $page.url.pathname === path;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Crime Reporting Platform</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<!-- Skip to main content link for keyboard users -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<!-- Live region for screen reader announcements -->
<div id="sr-announcements" class="sr-live" aria-live="polite" aria-atomic="true"></div>

<div class="app-container">
	<!-- Navigation Bar -->
	<nav class="navbar" role="navigation" aria-label="Main navigation">
		<div class="nav-content">
			<!-- Logo/Brand -->
			<a href="/" class="nav-brand" onclick={closeMobileMenu} aria-label="CrimeWatch Home">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
					<circle cx="12" cy="10" r="3"/>
				</svg>
				<span>CrimeWatch</span>
			</a>

			<!-- Desktop Navigation -->
			<div class="nav-links desktop-nav">
				<a href="/" class="nav-link" class:active={isActive('/')}>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
						<polyline points="9 22 9 12 15 12 15 22"/>
					</svg>
					Feed
				</a>
				<a href="/map" class="nav-link" class:active={isActive('/map')}>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
						<line x1="9" y1="3" x2="9" y2="18"/>
						<line x1="15" y1="6" x2="15" y2="21"/>
					</svg>
					Map
				</a>

				{#if $isAuthenticated}
					<a href="/profile" class="nav-link" class:active={isActive('/profile')}>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
							<circle cx="12" cy="7" r="4"/>
						</svg>
						Profile
					</a>
				{/if}

				{#if $userRole === 'admin'}
					<a href="/admin" class="nav-link" class:active={isActive('/admin')}>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
							<circle cx="12" cy="12" r="3"/>
						</svg>
						Admin
					</a>
				{/if}

				{#if $userRole === 'moderator' || $userRole === 'admin'}
					<a href="/moderation" class="nav-link" class:active={isActive('/moderation')}>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
						</svg>
						Moderation
					</a>
				{/if}
			</div>

			<!-- Auth Buttons (Desktop) -->
			<div class="nav-auth desktop-nav">
				{#if $authLoading}
					<div class="auth-loading">
						<div class="spinner-small"></div>
					</div>
				{:else if $isAuthenticated}
					<button class="btn-logout" onclick={handleLogout}>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
							<polyline points="16 17 21 12 16 7"/>
							<line x1="21" y1="12" x2="9" y2="12"/>
						</svg>
						Logout
					</button>
				{:else}
					<a href="/login" class="btn-login">Login</a>
					<a href="/register" class="btn-register">Register</a>
				{/if}
			</div>

			<!-- Mobile Menu Button -->
			<button 
				class="mobile-menu-btn" 
				onclick={toggleMobileMenu} 
				aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
				aria-expanded={mobileMenuOpen}
				aria-controls="mobile-navigation">
				{#if mobileMenuOpen}
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="3" y1="12" x2="21" y2="12"/>
						<line x1="3" y1="6" x2="21" y2="6"/>
						<line x1="3" y1="18" x2="21" y2="18"/>
					</svg>
				{/if}
			</button>
		</div>

		<!-- Mobile Navigation -->
		{#if mobileMenuOpen}
			<div id="mobile-navigation" class="mobile-nav" role="menu" aria-label="Mobile navigation">
				<a href="/" class="mobile-nav-link" class:active={isActive('/')} onclick={closeMobileMenu}>
					Feed
				</a>
				<a href="/map" class="mobile-nav-link" class:active={isActive('/map')} onclick={closeMobileMenu}>
					Map
				</a>

				{#if $isAuthenticated}
					<a href="/profile" class="mobile-nav-link" class:active={isActive('/profile')} onclick={closeMobileMenu}>
						Profile
					</a>
				{/if}

				{#if $userRole === 'admin'}
					<a href="/admin" class="mobile-nav-link" class:active={isActive('/admin')} onclick={closeMobileMenu}>
						Admin
					</a>
				{/if}

				{#if $userRole === 'moderator' || $userRole === 'admin'}
					<a href="/moderation" class="mobile-nav-link" class:active={isActive('/moderation')} onclick={closeMobileMenu}>
						Moderation
					</a>
				{/if}

				<div class="mobile-auth">
					{#if $authLoading}
						<div class="auth-loading">
							<div class="spinner-small"></div>
						</div>
					{:else if $isAuthenticated}
						<button class="btn-logout-mobile" onclick={() => { handleLogout(); closeMobileMenu(); }}>
							Logout
						</button>
					{:else}
						<a href="/login" class="btn-login-mobile" onclick={closeMobileMenu}>Login</a>
						<a href="/register" class="btn-register-mobile" onclick={closeMobileMenu}>Register</a>
					{/if}
				</div>
			</div>
		{/if}
	</nav>

	<!-- Main Content -->
	<main id="main-content" class="main-content" role="main" tabindex="-1">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="footer">
		<p>&copy; {new Date().getFullYear()} CrimeWatch. All rights reserved.</p>
	</footer>
</div>

<style>
	.app-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: #f9fafb;
	}

	/* Navbar */
	.navbar {
		background-color: white;
		border-bottom: 1px solid #e5e7eb;
		position: sticky;
		top: 0;
		z-index: 100;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.nav-content {
		max-width: 1280px;
		margin: 0 auto;
		padding: 0 1rem;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.nav-brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.25rem;
		font-weight: 700;
		color: #1f2937;
		text-decoration: none;
	}

	.nav-brand svg {
		color: #3b82f6;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		color: #6b7280;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.nav-link:hover {
		color: #1f2937;
		background-color: #f3f4f6;
	}

	.nav-link.active {
		color: #3b82f6;
		background-color: #eff6ff;
	}

	.nav-auth {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.auth-loading {
		padding: 0.5rem;
	}

	.spinner-small {
		width: 20px;
		height: 20px;
		border: 2px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.btn-login {
		padding: 0.5rem 1rem;
		color: #3b82f6;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.btn-login:hover {
		background-color: #eff6ff;
	}

	.btn-register {
		padding: 0.5rem 1rem;
		background-color: #3b82f6;
		color: white;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.btn-register:hover {
		background-color: #2563eb;
	}

	.btn-logout {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		background-color: white;
		color: #6b7280;
		border: 1px solid #e5e7eb;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-logout:hover {
		background-color: #f9fafb;
		color: #ef4444;
		border-color: #fecaca;
	}

	/* Mobile Menu */
	.mobile-menu-btn {
		display: none;
		padding: 0.5rem;
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		border-radius: 0.5rem;
	}

	.mobile-menu-btn:hover {
		background-color: #f3f4f6;
	}

	.mobile-nav {
		display: none;
		flex-direction: column;
		padding: 1rem;
		border-top: 1px solid #e5e7eb;
		background-color: white;
	}

	.mobile-nav-link {
		padding: 0.75rem 1rem;
		color: #6b7280;
		text-decoration: none;
		font-size: 1rem;
		font-weight: 500;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.mobile-nav-link:hover {
		background-color: #f3f4f6;
		color: #1f2937;
	}

	.mobile-nav-link.active {
		color: #3b82f6;
		background-color: #eff6ff;
	}

	.mobile-auth {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.btn-login-mobile,
	.btn-register-mobile,
	.btn-logout-mobile {
		padding: 0.75rem 1rem;
		text-align: center;
		text-decoration: none;
		font-size: 1rem;
		font-weight: 500;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.btn-login-mobile {
		color: #3b82f6;
		background-color: #eff6ff;
	}

	.btn-register-mobile {
		color: white;
		background-color: #3b82f6;
	}

	.btn-logout-mobile {
		color: #ef4444;
		background-color: #fef2f2;
		border: none;
		cursor: pointer;
	}

	/* Main Content */
	.main-content {
		flex: 1;
		width: 100%;
		max-width: 1280px;
		margin: 0 auto;
		padding: 1.5rem 1rem;
	}

	/* Footer */
	.footer {
		background-color: white;
		border-top: 1px solid #e5e7eb;
		padding: 1.5rem;
		text-align: center;
		color: #6b7280;
		font-size: 0.875rem;
	}

	/* Desktop Navigation */
	.desktop-nav {
		display: flex;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.desktop-nav {
			display: none;
		}

		.mobile-menu-btn {
			display: block;
		}

		.mobile-nav {
			display: flex;
		}

		.main-content {
			padding: 1rem 0.5rem;
		}
	}
</style>
