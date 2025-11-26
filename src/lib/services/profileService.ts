import {
	doc,
	getDoc,
	setDoc,
	updateDoc,
	collection,
	query,
	where,
	orderBy,
	getDocs,
	collectionGroup,
	serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '$lib/firebase/config';
import type { User, Report, Vote, Comment } from '$lib/types';

/**
 * ProfileService provides operations for user profile management
 * Supports viewing and editing profiles, and retrieving user activity
 */

export interface UserProfile extends User {
	reportCount?: number;
	voteCount?: number;
	commentCount?: number;
}

export interface UpdateProfileInput {
	displayName?: string;
	email?: string;
	phoneNumber?: string;
}

export interface UserActivity {
	votes: (Vote & { reportTitle?: string })[];
	comments: (Comment & { reportTitle?: string })[];
}

/**
 * Get a user's profile by user ID
 * Returns user data from Firestore
 * Creates a new profile if user is authenticated but document doesn't exist
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
	try {
		const userDocRef = doc(db, 'users', userId);
		const userDoc = await getDoc(userDocRef);

		if (!userDoc.exists()) {
			// Check if this is the current authenticated user - if so, create their profile
			const currentUser = auth.currentUser;
			if (currentUser && currentUser.uid === userId) {
				const newUserData: User = {
					uid: userId,
					role: 'citizen',
					createdAt: serverTimestamp() as any,
					updatedAt: serverTimestamp() as any,
					suspended: false
				};

				// Add optional fields if available
				if (currentUser.phoneNumber) newUserData.phoneNumber = currentUser.phoneNumber;
				if (currentUser.email) newUserData.email = currentUser.email;
				if (currentUser.displayName) newUserData.displayName = currentUser.displayName;

				await setDoc(userDocRef, newUserData);
				return newUserData as UserProfile;
			}

			throw new Error(`User with ID ${userId} not found`);
		}

		const userData = { uid: userDoc.id, ...userDoc.data() } as UserProfile;
		return userData;
	} catch (error) {
		console.error('Failed to get user profile:', error);
		throw error;
	}
}


/**
 * Update the current user's profile
 * Only allows updating displayName, email, and phoneNumber
 */
export async function updateProfile(updates: UpdateProfileInput): Promise<void> {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User must be authenticated to update profile');
	}

	try {
		const userDocRef = doc(db, 'users', currentUser.uid);
		const userDoc = await getDoc(userDocRef);

		if (!userDoc.exists()) {
			throw new Error('User profile not found');
		}

		// Filter out undefined values and only allow specific fields
		const allowedUpdates: Record<string, any> = {};
		
		if (updates.displayName !== undefined) {
			allowedUpdates.displayName = updates.displayName;
		}
		if (updates.email !== undefined) {
			allowedUpdates.email = updates.email;
		}
		if (updates.phoneNumber !== undefined) {
			allowedUpdates.phoneNumber = updates.phoneNumber;
		}

		if (Object.keys(allowedUpdates).length === 0) {
			return; // Nothing to update
		}

		await updateDoc(userDocRef, {
			...allowedUpdates,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		console.error('Failed to update profile:', error);
		throw error;
	}
}

/**
 * Get all reports submitted by a user
 * Returns reports ordered by creation date (newest first)
 */
export async function getUserReports(userId: string): Promise<Report[]> {
	try {
		const reportsRef = collection(db, 'reports');
		const q = query(
			reportsRef,
			where('authorId', '==', userId),
			orderBy('createdAt', 'desc')
		);

		const querySnapshot = await getDocs(q);
		const reports: Report[] = querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as Report[];

		return reports;
	} catch (error) {
		console.error('Failed to get user reports:', error);
		throw error;
	}
}

/**
 * Get user's activity including votes and comments
 * Returns votes and comments with associated report titles
 */
export async function getUserActivity(userId: string): Promise<UserActivity> {
	try {
		// Get user's votes using collection group query
		const votesQuery = query(
			collectionGroup(db, 'votes'),
			where('userId', '==', userId)
		);
		const votesSnapshot = await getDocs(votesQuery);
		
		const votes: (Vote & { reportTitle?: string })[] = [];
		for (const voteDoc of votesSnapshot.docs) {
			const voteData = voteDoc.data();
			const reportId = voteData.reportId;
			
			// Get report title
			let reportTitle: string | undefined;
			try {
				const reportDoc = await getDoc(doc(db, 'reports', reportId));
				if (reportDoc.exists()) {
					reportTitle = reportDoc.data().title;
				}
			} catch {
				// Report may have been deleted
			}
			
			votes.push({
				id: voteDoc.id,
				...voteData,
				reportTitle
			} as Vote & { reportTitle?: string });
		}

		// Get user's comments using collection group query
		const commentsQuery = query(
			collectionGroup(db, 'comments'),
			where('authorId', '==', userId),
			orderBy('createdAt', 'desc')
		);
		const commentsSnapshot = await getDocs(commentsQuery);
		
		const comments: (Comment & { reportTitle?: string })[] = [];
		for (const commentDoc of commentsSnapshot.docs) {
			const commentData = commentDoc.data();
			const reportId = commentData.reportId;
			
			// Get report title
			let reportTitle: string | undefined;
			try {
				const reportDoc = await getDoc(doc(db, 'reports', reportId));
				if (reportDoc.exists()) {
					reportTitle = reportDoc.data().title;
				}
			} catch {
				// Report may have been deleted
			}
			
			comments.push({
				id: commentDoc.id,
				...commentData,
				reportTitle
			} as Comment & { reportTitle?: string });
		}

		return { votes, comments };
	} catch (error) {
		console.error('Failed to get user activity:', error);
		throw error;
	}
}
