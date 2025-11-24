<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { addComment, subscribeToComments, deleteComment } from '$lib/services/commentService';
	import { isAuthenticated, currentUser } from '$lib/stores/authStore';
	import type { Comment } from '$lib/types';

	export let reportId: string;

	let comments: Comment[] = [];
	let commentText = '';
	let loading = false;
	let submitting = false;
	let error: string | null = null;
	let unsubscribe: (() => void) | null = null;

	// Subscribe to real-time comment updates on mount
	onMount(() => {
		loading = true;
		unsubscribe = subscribeToComments(reportId, (updatedComments) => {
			comments = updatedComments;
			loading = false;
		});
	});

	// Cleanup subscription on unmount
	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	async function handleSubmit() {
		if (!$isAuthenticated) {
			error = 'You must be logged in to comment';
			return;
		}

		if (!commentText.trim()) {
			error = 'Comment cannot be empty';
			return;
		}

		submitting = true;
		error = null;

		try {
			await addComment(reportId, commentText);
			commentText = '';
		} catch (err) {
			console.error('Failed to add comment:', err);
			error = 'Failed to add comment. Please try again.';
		} finally {
			submitting = false;
		}
	}

	async function handleDelete(commentId: string) {
		if (!confirm('Are you sure you want to delete this comment?')) {
			return;
		}

		try {
			await deleteComment(reportId, commentId);
		} catch (err) {
			console.error('Failed to delete comment:', err);
			error = 'Failed to delete comment. Please try again.';
		}
	}

	function formatDate(timestamp: any): string {
		if (!timestamp) return '';
		
		// Handle Firestore Timestamp
		const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
		
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		
		return date.toLocaleDateString();
	}
</script>

<div class="space-y-4">
	<h3 class="text-lg font-semibold">Comments ({comments.length})</h3>

	<!-- Comment Input Form -->
	{#if $isAuthenticated}
		<form on:submit|preventDefault={handleSubmit} class="space-y-2">
			<textarea
				bind:value={commentText}
				placeholder="Add a comment..."
				rows="3"
				disabled={submitting}
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
			></textarea>
			<div class="flex justify-end">
				<button
					type="submit"
					disabled={submitting || !commentText.trim()}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{submitting ? 'Posting...' : 'Post Comment'}
				</button>
			</div>
		</form>
	{:else}
		<p class="text-sm text-gray-600">Please log in to comment</p>
	{/if}

	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}

	<!-- Comments List -->
	<div class="space-y-3">
		{#if loading}
			<p class="text-sm text-gray-500">Loading comments...</p>
		{:else if comments.length === 0}
			<p class="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
		{:else}
			{#each comments as comment (comment.id)}
				<div class="bg-gray-50 rounded-lg p-4 space-y-2">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<span class="font-medium text-sm">{comment.authorName}</span>
								<span class="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
							</div>
							<p class="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
						</div>
						{#if $currentUser && comment.authorId === $currentUser.uid}
							<button
								on:click={() => handleDelete(comment.id)}
								class="text-red-600 hover:text-red-700 text-sm ml-2"
								aria-label="Delete comment"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
