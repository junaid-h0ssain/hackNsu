<script lang="ts">
	import { signInWithEmail, signInWithPhone, confirmPhoneCode } from '$lib/services/authService';
	import { ErrorAlert, Spinner } from '$lib/components/ui';
	import { parseError } from '$lib/utils/errorHandling';
	import type { ConfirmationResult } from 'firebase/auth';
	import type { User } from '$lib/types';

	interface Props {
		onSuccess?: (user: User) => void;
	}

	let { onSuccess }: Props = $props();

	// Form state
	let loginMethod: 'email' | 'phone' = $state('email');
	let email = $state('');
	let password = $state('');
	let phoneNumber = $state('');
	let otpCode = $state('');
	let loading = $state(false);
	let error = $state('');
	let showOtpInput = $state(false);
	let confirmationResult: ConfirmationResult | null = $state(null);
	let recaptchaContainer: HTMLElement | null = $state(null);

	async function handleEmailLogin() {
		if (!email || !password) {
			error = 'Please enter both email and password';
			return;
		}

		loading = true;
		error = '';

		try {
			const user = await signInWithEmail(email, password);
			onSuccess?.(user);
		} catch (err: any) {
			console.error('Email login error:', err);
			if (err.code === 'auth/user-not-found') {
				error = 'No account found with this email';
			} else if (err.code === 'auth/wrong-password') {
				error = 'Incorrect password';
			} else if (err.code === 'auth/invalid-email') {
				error = 'Invalid email address';
			} else if (err.code === 'auth/too-many-requests') {
				error = 'Too many failed attempts. Please try again later';
			} else {
				error = 'Login failed. Please try again';
			}
		} finally {
			loading = false;
		}
	}

	async function handlePhoneLogin() {
		if (!phoneNumber) {
			error = 'Please enter a phone number';
			return;
		}

		loading = true;
		error = '';

		try {
			if (!recaptchaContainer) {
				throw new Error('reCAPTCHA container not found');
			}

			confirmationResult = await signInWithPhone(phoneNumber, recaptchaContainer);
			showOtpInput = true;
		} catch (err: any) {
			console.error('Phone login error:', err);
			if (err.code === 'auth/invalid-phone-number') {
				error = 'Invalid phone number format';
			} else if (err.code === 'auth/too-many-requests') {
				error = 'Too many requests. Please try again later';
			} else {
				error = 'Failed to send OTP. Please try again';
			}
		} finally {
			loading = false;
		}
	}

	async function handleOtpConfirm() {
		if (!otpCode || !confirmationResult) {
			error = 'Please enter the OTP code';
			return;
		}

		loading = true;
		error = '';

		try {
			const user = await confirmPhoneCode(confirmationResult, otpCode);
			onSuccess?.(user);
		} catch (err: any) {
			console.error('OTP confirmation error:', err);
			if (err.code === 'auth/invalid-verification-code') {
				error = 'Invalid OTP code';
			} else if (err.code === 'auth/code-expired') {
				error = 'OTP code has expired. Please request a new one';
			} else {
				error = 'Failed to verify OTP. Please try again';
			}
		} finally {
			loading = false;
		}
	}

	function switchMethod(method: 'email' | 'phone') {
		loginMethod = method;
		error = '';
		showOtpInput = false;
		confirmationResult = null;
	}
</script>

<div class="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
	<h2 class="text-2xl font-bold mb-6 text-center">Login</h2>

	<!-- Login method tabs -->
	<div class="flex mb-6 border-b">
		<button
			class="flex-1 py-2 px-4 text-center {loginMethod === 'email'
				? 'border-b-2 border-blue-500 text-blue-500 font-semibold'
				: 'text-gray-500'}"
			onclick={() => switchMethod('email')}
			disabled={loading}
		>
			Email
		</button>
		<button
			class="flex-1 py-2 px-4 text-center {loginMethod === 'phone'
				? 'border-b-2 border-blue-500 text-blue-500 font-semibold'
				: 'text-gray-500'}"
			onclick={() => switchMethod('phone')}
			disabled={loading}
		>
			Phone
		</button>
	</div>

	<!-- Error message -->
	{#if error}
		<div class="mb-4">
			<ErrorAlert error={error} dismissible={true} on:dismiss={() => error = ''} />
		</div>
	{/if}

	<!-- Email login form -->
	{#if loginMethod === 'email'}
		<form onsubmit={(e) => { e.preventDefault(); handleEmailLogin(); }}>
			<div class="mb-4">
				<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
					Email Address
				</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="your@email.com"
					disabled={loading}
					required
				/>
			</div>

			<div class="mb-6">
				<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
					Password
				</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="••••••••"
					disabled={loading}
					required
				/>
			</div>

			<button
				type="submit"
				class="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
				disabled={loading}
			>
				{#if loading}
					<Spinner size="sm" color="text-white" />
					<span>Signing in...</span>
				{:else}
					Sign In
				{/if}
			</button>
		</form>
	{/if}

	<!-- Phone login form -->
	{#if loginMethod === 'phone'}
		{#if !showOtpInput}
			<form onsubmit={(e) => { e.preventDefault(); handlePhoneLogin(); }}>
				<div class="mb-6">
					<label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
						Phone Number
					</label>
					<input
						id="phone"
						type="tel"
						bind:value={phoneNumber}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="+1234567890"
						disabled={loading}
						required
					/>
					<p class="mt-1 text-xs text-gray-500">Include country code (e.g., +1 for US)</p>
				</div>

				<!-- reCAPTCHA container -->
				<div bind:this={recaptchaContainer} id="recaptcha-container"></div>

				<button
					type="submit"
					class="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
					disabled={loading}
				>
					{#if loading}
						<Spinner size="sm" color="text-white" />
						<span>Sending OTP...</span>
					{:else}
						Send OTP
					{/if}
				</button>
			</form>
		{:else}
			<form onsubmit={(e) => { e.preventDefault(); handleOtpConfirm(); }}>
				<div class="mb-4">
					<p class="text-sm text-gray-600 mb-4">
						Enter the verification code sent to {phoneNumber}
					</p>
					<label for="otp" class="block text-sm font-medium text-gray-700 mb-2">
						OTP Code
					</label>
					<input
						id="otp"
						type="text"
						bind:value={otpCode}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="123456"
						disabled={loading}
						maxlength="6"
						required
					/>
				</div>

				<button
					type="submit"
					class="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mb-2 flex items-center justify-center gap-2"
					disabled={loading}
				>
					{#if loading}
						<Spinner size="sm" color="text-white" />
						<span>Verifying...</span>
					{:else}
						Verify OTP
					{/if}
				</button>

				<button
					type="button"
					class="w-full py-2 px-4 text-blue-500 hover:text-blue-600 disabled:text-gray-400"
					onclick={() => {
						showOtpInput = false;
						confirmationResult = null;
						otpCode = '';
					}}
					disabled={loading}
				>
					Use different number
				</button>
			</form>
		{/if}
	{/if}
</div>
