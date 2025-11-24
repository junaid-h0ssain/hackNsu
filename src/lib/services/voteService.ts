import {
	collection,
	doc,
	getDoc,
	setDoc,
	deleteDoc,
	runTransaction,
	serverTimestamp,
	increment
} from 'firebase/firestore';
import { db, auth } from '$lib/firebase/config';
import type { Vote, VoteType } from '$lib/types';

/**
 * VoteService provides voting operations for crime reports
 * Ensures one vote per user per report using userId as document ID
 * Updates vote counts atomically using Firestore transactions
 */

/**
 * Vote on a report (upvote or downvote)
 * If user has already voted, changes the vote
 * Uses Firestore transaction to ensure atomic updates
 */
export async function vote(reportId: string, voteType: VoteType): Promise<void> {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User must be authenticated to vote');
	}

	try {
		const voteRef = doc(db, 'reports', reportId, 'votes', currentUser.uid);
		const reportRef = doc(db, 'reports', reportId);

		await runTransaction(db, async (transaction) => {
			const voteDoc = await transaction.get(voteRef);
			const reportDoc = await transaction.get(reportRef);

			if (!reportDoc.exists()) {
				throw new Error(`Report with ID ${reportId} not found`);
			}

			const currentReport = reportDoc.data();
			const currentUpvotes = currentReport.upvotes || 0;
			const currentDownvotes = currentReport.downvotes || 0;

			if (voteDoc.exists()) {
				// User has already voted, update the vote
				const existingVote = voteDoc.data() as Vote;
				const oldVoteType = existingVote.voteType;

				if (oldVoteType === voteType) {
					// Same vote type, no change needed
					return;
				}

				// Change vote: decrement old vote count, increment new vote count
				if (oldVoteType === 'up') {
					transaction.update(reportRef, {
						upvotes: Math.max(0, currentUpvotes - 1),
						downvotes: currentDownvotes + 1,
						updatedAt: serverTimestamp()
					});
				} else {
					transaction.update(reportRef, {
						upvotes: currentUpvotes + 1,
						downvotes: Math.max(0, currentDownvotes - 1),
						updatedAt: serverTimestamp()
					});
				}

				// Update the vote document
				transaction.update(voteRef, {
					voteType,
					createdAt: serverTimestamp()
				});
			} else {
				// New vote
				if (voteType === 'up') {
					transaction.update(reportRef, {
						upvotes: currentUpvotes + 1,
						updatedAt: serverTimestamp()
					});
				} else {
					transaction.update(reportRef, {
						downvotes: currentDownvotes + 1,
						updatedAt: serverTimestamp()
					});
				}

				// Create the vote document
				transaction.set(voteRef, {
					reportId,
					userId: currentUser.uid,
					voteType,
					createdAt: serverTimestamp()
				});
			}
		});
	} catch (error) {
		console.error('Failed to vote:', error);
		throw error;
	}
}

/**
 * Remove a user's vote from a report
 * Uses Firestore transaction to ensure atomic updates
 */
export async function removeVote(reportId: string): Promise<void> {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User must be authenticated to remove vote');
	}

	try {
		const voteRef = doc(db, 'reports', reportId, 'votes', currentUser.uid);
		const reportRef = doc(db, 'reports', reportId);

		await runTransaction(db, async (transaction) => {
			const voteDoc = await transaction.get(voteRef);
			const reportDoc = await transaction.get(reportRef);

			if (!reportDoc.exists()) {
				throw new Error(`Report with ID ${reportId} not found`);
			}

			if (!voteDoc.exists()) {
				// No vote to remove
				return;
			}

			const existingVote = voteDoc.data() as Vote;
			const currentReport = reportDoc.data();
			const currentUpvotes = currentReport.upvotes || 0;
			const currentDownvotes = currentReport.downvotes || 0;

			// Decrement the appropriate vote count
			if (existingVote.voteType === 'up') {
				transaction.update(reportRef, {
					upvotes: Math.max(0, currentUpvotes - 1),
					updatedAt: serverTimestamp()
				});
			} else {
				transaction.update(reportRef, {
					downvotes: Math.max(0, currentDownvotes - 1),
					updatedAt: serverTimestamp()
				});
			}

			// Delete the vote document
			transaction.delete(voteRef);
		});
	} catch (error) {
		console.error('Failed to remove vote:', error);
		throw error;
	}
}

/**
 * Get the current user's vote on a report
 * Returns null if the user hasn't voted
 */
export async function getUserVote(reportId: string): Promise<Vote | null> {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		return null;
	}

	try {
		const voteRef = doc(db, 'reports', reportId, 'votes', currentUser.uid);
		const voteDoc = await getDoc(voteRef);

		if (!voteDoc.exists()) {
			return null;
		}

		return {
			id: voteDoc.id,
			...voteDoc.data()
		} as Vote;
	} catch (error) {
		console.error('Failed to get user vote:', error);
		throw error;
	}
}
