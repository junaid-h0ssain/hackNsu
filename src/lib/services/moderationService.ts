import {
	collection,
	doc,
	getDoc,
	addDoc,
	updateDoc,
	deleteDoc,
	serverTimestamp,
	runTransaction,
	increment
} from 'firebase/firestore';
import { db, auth } from '$lib/firebase/config';
import type { ModerationLog, ModerationAction, ModerationTargetType, User } from '$lib/types';

/**
 * ModerationService provides operations for content moderation
 * Includes flagging reports, removing comments, and suspending users
 * All actions create moderation log entries
 */

/**
 * Check if the current user has moderator or admin privileges
 */
async function checkModeratorPermissions(): Promise<void> {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User must be authenticated to perform moderation actions');
	}

	const userDocRef = doc(db, 'users', currentUser.uid);
	const userDoc = await getDoc(userDocRef);

	if (!userDoc.exists()) {
		throw new Error('User data not found');
	}

	const userData = userDoc.data() as User;
	if (userData.role !== 'moderator' && userData.role !== 'admin') {
		throw new Error('User does not have moderator permissions');
	}
}

/**
 * Create a moderation log entry
 */
async function createModerationLog(
	action: ModerationAction,
	targetType: ModerationTargetType,
	targetId: string,
	reason?: string
): Promise<string> {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User must be authenticated to create moderation log');
	}

	try {
		const logRef = await addDoc(collection(db, 'moderation_logs'), {
			moderatorId: currentUser.uid,
			action,
			targetType,
			targetId,
			reason: reason || '',
			createdAt: serverTimestamp()
		});

		return logRef.id;
	} catch (error) {
		console.error('Failed to create moderation log:', error);
		throw error;
	}
}

/**
 * Flag a report as inappropriate
 * Changes report status to 'flagged' and creates a moderation log
 */
export async function flagReport(reportId: string, reason?: string): Promise<void> {
	await checkModeratorPermissions();

	try {
		const reportRef = doc(db, 'reports', reportId);
		const reportDoc = await getDoc(reportRef);

		if (!reportDoc.exists()) {
			throw new Error(`Report with ID ${reportId} not found`);
		}

		// Update report status to flagged
		await updateDoc(reportRef, {
			status: 'flagged',
			updatedAt: serverTimestamp()
		});

		// Create moderation log
		await createModerationLog('flag', 'report', reportId, reason);

		console.log(`Report ${reportId} flagged successfully`);
	} catch (error) {
		console.error('Failed to flag report:', error);
		throw error;
	}
}

/**
 * Remove a comment
 * Deletes the comment and decrements the report's comment count
 * Creates a moderation log entry
 */
export async function removeComment(
	reportId: string,
	commentId: string,
	reason?: string
): Promise<void> {
	await checkModeratorPermissions();

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

			// Delete the comment document
			transaction.delete(commentRef);

			// Decrement the report's comment count
			const currentCommentCount = reportDoc.data().commentCount || 0;
			transaction.update(reportRef, {
				commentCount: Math.max(0, currentCommentCount - 1),
				updatedAt: serverTimestamp()
			});
		});

		// Create moderation log
		await createModerationLog('remove', 'comment', commentId, reason);

		console.log(`Comment ${commentId} removed successfully`);
	} catch (error) {
		console.error('Failed to remove comment:', error);
		throw error;
	}
}

/**
 * Suspend a user
 * Sets the user's suspended flag to true
 * Creates a moderation log entry
 */
export async function suspendUser(userId: string, reason?: string): Promise<void> {
	await checkModeratorPermissions();

	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User must be authenticated to suspend users');
	}

	// Prevent self-suspension
	if (currentUser.uid === userId) {
		throw new Error('Cannot suspend yourself');
	}

	try {
		const userRef = doc(db, 'users', userId);
		const userDoc = await getDoc(userRef);

		if (!userDoc.exists()) {
			throw new Error(`User with ID ${userId} not found`);
		}

		// Update user suspended status
		await updateDoc(userRef, {
			suspended: true,
			updatedAt: serverTimestamp()
		});

		// Create moderation log
		await createModerationLog('suspend', 'user', userId, reason);

		console.log(`User ${userId} suspended successfully`);
	} catch (error) {
		console.error('Failed to suspend user:', error);
		throw error;
	}
}

/**
 * Get moderation logs (for admin/moderator review)
 */
export async function getModerationLogs(): Promise<ModerationLog[]> {
	await checkModeratorPermissions();

	try {
		const logsRef = collection(db, 'moderation_logs');
		const { getDocs, query, orderBy } = await import('firebase/firestore');
		const q = query(logsRef, orderBy('createdAt', 'desc'));
		const querySnapshot = await getDocs(q);

		const logs: ModerationLog[] = querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as ModerationLog[];

		return logs;
	} catch (error) {
		console.error('Failed to get moderation logs:', error);
		throw error;
	}
}
