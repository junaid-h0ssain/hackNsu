import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Comment } from '$lib/types';

// Mock Firebase modules before importing the service
vi.mock('firebase/firestore', () => ({
	collection: vi.fn(),
	doc: vi.fn(),
	getDoc: vi.fn(),
	getDocs: vi.fn(),
	addDoc: vi.fn(),
	deleteDoc: vi.fn(),
	query: vi.fn(),
	orderBy: vi.fn(),
	onSnapshot: vi.fn(),
	serverTimestamp: vi.fn(() => ({ _seconds: Date.now() / 1000 })),
	increment: vi.fn((n) => ({ _increment: n })),
	runTransaction: vi.fn()
}));

vi.mock('$lib/firebase/config', () => ({
	db: {},
	auth: {
		currentUser: {
			uid: 'test-user-id',
			email: 'test@example.com',
			displayName: 'Test User'
		}
	}
}));

describe('CommentService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('addComment', () => {
		it('should throw error if user is not authenticated', async () => {
			// Mock unauthenticated user
			const { auth } = await import('$lib/firebase/config');
			auth.currentUser = null;

			const { addComment } = await import('./commentService');

			await expect(addComment('report-id', 'Test comment')).rejects.toThrow(
				'User must be authenticated to add a comment'
			);
		});

		it('should throw error if comment text is empty', async () => {
			const { auth } = await import('$lib/firebase/config');
			auth.currentUser = {
				uid: 'test-user-id',
				email: 'test@example.com',
				displayName: 'Test User'
			} as any;

			const { addComment } = await import('./commentService');

			await expect(addComment('report-id', '')).rejects.toThrow(
				'Comment text cannot be empty'
			);
		});

		it('should throw error if comment text is only whitespace', async () => {
			const { auth } = await import('$lib/firebase/config');
			auth.currentUser = {
				uid: 'test-user-id',
				email: 'test@example.com',
				displayName: 'Test User'
			} as any;

			const { addComment } = await import('./commentService');

			await expect(addComment('report-id', '   ')).rejects.toThrow(
				'Comment text cannot be empty'
			);
		});
	});

	describe('deleteComment', () => {
		it('should throw error if user is not authenticated', async () => {
			const { auth } = await import('$lib/firebase/config');
			auth.currentUser = null;

			const { deleteComment } = await import('./commentService');

			await expect(deleteComment('report-id', 'comment-id')).rejects.toThrow(
				'User must be authenticated to delete a comment'
			);
		});
	});
});
