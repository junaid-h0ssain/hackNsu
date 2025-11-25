<script lang="ts">
	import { signUpWithEmail, signInWithPhone, confirmPhoneCode } from '$lib/services/authService';
	import { ErrorAlert, Spinner } from '$lib/components/ui';
	import type { ConfirmationResult } from 'firebase/auth';
	import type { User } from '$lib/types';

	interface Props {
		onSuccess?: (user: User) => void;
	}

	let { onSuccess }: Props = $props();

	// Form state
	let registrationMethod: 'email' | 'phone' = $state('email');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let displayName = $state('');
	let phoneNumber = $state('');
	let otpCode = $state('');
	let loading = $state(false);
	let error = $state('');
	let showOtpInput = $state(false);
	let confirmationResult: ConfirmationResult | null = $state(null);
	let recaptchaContainer: HTMLElement | null = $state(null);

	async function handleEmailRegistration() {
		// Validation
		if (!email || !password || !confirmPassword) {
			error = 'Please fill in all required fields';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		loading = true;
		error = '';

		try {
			const user = await signUpWithEmail(email, password, displayName || undefined);
			onSuccess?.(user);
		} catch (err: any) {
			console.error('Email registration error:', err);
			if (err.code === 'auth/email-already-in-use') {
				error = 'An account with this email already exists. Please login instead';
			} else if (err.code === 'auth/invalid-email') {
				error = 'Invalid email address';
			} else if (err.code === 'auth/weak-password') {
				error = 'Password is too weak. Please use a stronger password';
			} else if (err.code === 'auth/operation-not-allowed') {
				error = 'Email/password registration is not enabled';
			} else {
				error = 'Registration failed. Please try again';
			}
		} finally {
			loading = false;
		}
	}

	async function handlePhoneRegistration() {
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
			console.error('Phone registration error:', err);
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
		registrationMethod = method;
		error = '';
		showOtpInput = false;
		confirmationResult = null;
	}
</script>

<div class="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
	<h2 class="text-2xl font-bold mb-6 text-center">Create Account</h2>

	<!-- Registration method tabs -->
	<div class="flex mb-6 border-b">
		<button
			class="flex-1 py-2 px-4 text-center {registrationMethod === 'email'
				? 'border-b-2 border-blue-500 text-blue-500 font-semibold'
				: 'text-gray-500'}"
			onclick={() => switchMethod('email')}
			disabled={loading}
		>
			Email
		</button>
		<button
			class="flex-1 py-2 px-4 text-center {registrationMethod === 'phone'
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

	<!-- Email registration form -->
	{#if registrationMethod === 'email'}
		<form onsubmit={(e) => { e.preventDefault(); handleEmailRegistration(); }}>
			<div class="mb-4">
				<label for="displayName" class="block text-sm font-medium text-gray-700 mb-2">
					Display Name (Optional)
				</label>
				<input
					id="displayName"
					type="text"
					bind:value={displayName}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="John Doe"
					disabled={loading}
				/>
			</div>

			<div class="mb-4">
				<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
					Email Address *
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

			<div class="mb-4">
				<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
					Password *
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
				<p class="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
			</div>

			<div class="mb-6">
				<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
					Confirm Password *
				</label>
				<input
					id="confirmPassword"
					type="password"
					bind:value={confirmPassword}
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
					<span>Creating account...</span>
				{:else}
					Create Account
				{/if}
			</button>
		</form>
	{/if}

	<!-- Phone registration form -->
	{#if registrationMethod === 'phone'}
		{#if !showOtpInput}
			<form onsubmit={(e) => { e.preventDefault(); handlePhoneRegistration(); }}>
				<div class="mb-6">
					<label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
						Phone Number *
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
						OTP Code *
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
