<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { vote, removeVote, getUserVote } from '$lib/services/voteService';
	import { isAuthenticated } from '$lib/stores/authStore';
	import type { VoteType } from '$lib/types';

	export let reportId: string;
	export let upvotes: number = 0;
	export let downvotes: number = 0;

	let userVote: VoteType | null = null;
	let loading = false;
	let error: string | null = null;

	// Load user's current vote on mount
	onMount(async () => {
		if ($isAuthenticated) {
			await loadUserVote();
		}
	});

	async function loadUserVote() {
		try {
			const vote = await getUserVote(reportId);
			userVote = vote?.voteType || null;
		} catch (err) {
			console.error('Failed to load user vote:', err);
		}
	}

	async function handleVote(voteType: VoteType) {
		if (!$isAuthenticated) {
			error = 'You must be logged in to vote';
			return;
		}

		loading = true;
		error = null;

		try {
			if (userVote === voteType) {
				// User clicked the same vote button, remove the vote
				await removeVote(reportId);
				userVote = null;
			} else {
				// User clicked a different vote button or is voting for the first time
				await vote(reportId, voteType);
				userVote = voteType;
			}
		} catch (err) {
			console.error('Failed to vote:', err);
			error = 'Failed to vote. Please try again.';
		} finally {
			loading = false;
		}
	}

	function handleUpvote() {
		handleVote('up');
	}

	function handleDownvote() {
		handleVote('down');
	}
</script>

<div class="flex items-center gap-4">
	<div class="flex items-center gap-2">
		<button
			on:click={handleUpvote}
			disabled={loading || !$isAuthenticated}
			class="flex items-center gap-1 px-3 py-2 rounded-lg transition-colors {userVote === 'up'
				? 'bg-green-100 text-green-700 hover:bg-green-200'
				: 'bg-gray-100 text-gray-600 hover:bg-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed"
			aria-label="Upvote"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
					clip-rule="evenodd"
				/>
			</svg>
			<span class="font-medium">{upvotes}</span>
		</button>
	</div>

	<div class="flex items-center gap-2">
		<button
			on:click={handleDownvote}
			disabled={loading || !$isAuthenticated}
			class="flex items-center gap-1 px-3 py-2 rounded-lg transition-colors {userVote === 'down'
				? 'bg-red-100 text-red-700 hover:bg-red-200'
				: 'bg-gray-100 text-gray-600 hover:bg-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed"
			aria-label="Downvote"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
					clip-rule="evenodd"
				/>
			</svg>
			<span class="font-medium">{downvotes}</span>
		</button>
	</div>
</div>

{#if error}
	<p class="text-sm text-red-600 mt-2">{error}</p>
{/if}
