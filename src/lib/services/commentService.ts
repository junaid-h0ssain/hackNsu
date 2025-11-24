import {
	collection,
	doc,
	getDoc,
	getDocs,
	addDoc,
	deleteDoc,
	query,
	orderBy,
	onSnapshot,
	serverTimestamp,
	increment,
	runTransaction,
	type Unsubscribe
} from 'firebase/firestore';
import { db, auth } from '$lib/firebase/config';
import type { Comment } from '$lib/types';

/**
 * CommentService provides operations for managing comments on crime reports
 * Supports real-time updates and maintains comment counts on reports
 */

/**
 * Add a comment to a report
 * Increments the report's comment count atomically
 */
export async function addComment(reportId: string, text: string): Promise<string> {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User must be authenticated to add a comment');
	}

	if (!text || text.trim().length === 0) {
		throw new Error('Comment text cannot be empty');
	}

	try {
		const reportRef = doc(db, 'reports', reportId);
		const commentsRef = collection(db, 'reports', reportId, 'comments');

		// Use transaction to ensure atomic comment creation and count update
		const commentId = await runTransaction(db, async (transaction) => {
			const reportDoc = await transaction.get(reportRef);

			if (!reportDoc.exists()) {
				throw new Error(`Report with ID ${reportId} not found`);
			}

			// Create the comment document
			const newCommentRef = doc(commentsRef);
			transaction.set(newCommentRef, {
				reportId,
				authorId: currentUser.uid,
				authorName: currentUser.displayName || currentUser.email || 'Anonymous',
				text: text.trim(),
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp()
			});

			// Increment the report's comment count
			transaction.update(reportRef, {
				commentCount: increment(1),
				updatedAt: serverTimestamp()
			});

			return newCommentRef.id;
		});

		return commentId;
	} catch (error) {
		console.error('Failed to add comment:', error);
		throw error;
	}
}

/**
 * Get all comments for a report, ordered by createdAt (chronological order)
 */
export async function getComments(reportId: string): Promise<Comment[]> {
	try {
		const commentsRef = collection(db, 'reports', reportId, 'comments');
		const q = query(commentsRef, orderBy('createdAt', 'asc'));

		const querySnapshot = await getDocs(q);
		const comments: Comment[] = querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as Comment[];

		return comments;
	} catch (error) {
		console.error('Failed to get comments:', error);
		throw error;
	}
}

/**
 * Subscribe to real-time comment updates for a report
 * Comments are ordered chronologically by createdAt
 */
export function subscribeToComments(
	reportId: string,
	callback: (comments: Comment[]) => void
): Unsubscribe {
	try {
		const commentsRef = collection(db, 'reports', reportId, 'comments');
		const q = query(commentsRef, orderBy('createdAt', 'asc'));

		const unsubscribe = onSnapshot(
			q,
			(querySnapshot) => {
				const comments: Comment[] = querySnapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data()
				})) as Comment[];

				callback(comments);
			},
			(error) => {
				console.error('Error in comments subscription:', error);
			}
		);

		return unsubscribe;
	} catch (error) {
		console.error('Failed to subscribe to comments:', error);
		throw error;
	}
}

/**
 * Delete a comment
 * Only the comment author can delete their own comment
 * Decrements the report's comment count atomically
 */
export async function deleteComment(reportId: string, commentId: string): Promise<void> {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User must be authenticated to delete a comment');
	}

	try {
		const commentRef = doc(db, 'reports', reportId, 'comments', commentId);
		const reportRef = doc(db, 'reports', reportId);

		// Use transaction to ensure atomic comment deletion and count update
		await runTransaction(db, async (transaction) => {
			const commentDoc = await transaction.get(commentRef);
			const reportDoc = await transaction.get(reportRef);

			if (!reportDoc.exists()) {
				throw new Error(`Report with ID ${reportId} not found`);
			}

			if (!commentDoc.exists()) {
				throw new Error(`Comment with ID ${commentId} not found`);
			}

			const comment = commentDoc.data() as Comment;

			// Check if the current user is the author of the comment
			if (comment.authorId !== currentUser.uid) {
				throw new Error('User is not authorized to delete this comment');
			}

			// Delete the comment document
			transaction.delete(commentRef);

			// Decrement the report's comment count
			const currentCommentCount = reportDoc.data().commentCount || 0;
			transaction.update(reportRef, {
				commentCount: Math.max(0, currentCommentCount - 1),
				updatedAt: serverTimestamp()
			});
		});
	} catch (error) {
		console.error('Failed to delete comment:', error);
		throw error;
	}
}
