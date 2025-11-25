import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '$lib/firebase/config';
import type { User, UserRole } from '$lib/types';

/**
 * UserManagementService provides admin operations for managing user roles
 * Includes promoting users to moderator and demoting moderators to citizen
 * Requires admin privileges to execute
 */

/**
 * Check if the current user has admin privileges
 */
async function checkAdminPermissions(): Promise<void> {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User must be authenticated to perform admin actions');
	}

	const userDocRef = doc(db, 'users', currentUser.uid);
	const userDoc = await getDoc(userDocRef);

	if (!userDoc.exists()) {
		throw new Error('User data not found');
	}

	const userData = userDoc.data() as User;
	if (userData.role !== 'admin') {
		throw new Error('User does not have admin permissions');
	}
}

/**
 * Get user data from Firestore
 */
async function getUserData(userId: string): Promise<User> {
	const userDocRef = doc(db, 'users', userId);
	const userDoc = await getDoc(userDocRef);

	if (!userDoc.exists()) {
		throw new Error(`User with ID ${userId} not found`);
	}

	return { uid: userDoc.id, ...userDoc.data() } as User;
}

/**
 * Update user role in Firestore
 */
async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
	const userRef = doc(db, 'users', userId);

	await updateDoc(userRef, {
		role: newRole,
		updatedAt: serverTimestamp()
	});
}

/**
 * Promote a user to moderator role
 * Requires admin privileges
 * Updates the user's role in Firestore
 */
export async function promoteToModerator(userId: string): Promise<User> {
	await checkAdminPermissions();

	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User must be authenticated');
	}

	// Prevent self-promotion (though admins are already at highest level)
	if (currentUser.uid === userId) {
		throw new Error('Cannot modify your own role');
	}

	try {
		// Get current user data
		const userData = await getUserData(userId);

		// Check if user is already a moderator or admin
		if (userData.role === 'moderator') {
			throw new Error('User is already a moderator');
		}

		if (userData.role === 'admin') {
			throw new Error('Cannot modify admin role');
		}

		// Update role to moderator
		await updateUserRole(userId, 'moderator');

		console.log(`User ${userId} promoted to moderator successfully`);

		// Return updated user data
		return await getUserData(userId);
	} catch (error) {
		console.error('Failed to promote user to moderator:', error);
		throw error;
	}
}

/**
 * Demote a moderator to citizen role
 * Requires admin privileges
 * Updates the user's role in Firestore
 */
export async function demoteToUser(userId: string): Promise<User> {
	await checkAdminPermissions();

	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User must be authenticated');
	}

	// Prevent self-demotion
	if (currentUser.uid === userId) {
		throw new Error('Cannot modify your own role');
	}

	try {
		// Get current user data
		const userData = await getUserData(userId);

		// Check if user is a citizen (already demoted)
		if (userData.role === 'citizen') {
			throw new Error('User is already a citizen');
		}

		// Prevent demoting admins
		if (userData.role === 'admin') {
			throw new Error('Cannot demote admin users');
		}

		// Update role to citizen
		await updateUserRole(userId, 'citizen');

		console.log(`User ${userId} demoted to citizen successfully`);

		// Return updated user data
		return await getUserData(userId);
	} catch (error) {
		console.error('Failed to demote user to citizen:', error);
		throw error;
	}
}

/**
 * Get all users (for admin panel display)
 * Requires admin privileges
 */
export async function getAllUsers(): Promise<User[]> {
	await checkAdminPermissions();

	try {
		const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
		const usersRef = collection(db, 'users');
		const q = query(usersRef, orderBy('createdAt', 'desc'));
		const querySnapshot = await getDocs(q);

		const users: User[] = querySnapshot.docs.map((doc) => ({
			uid: doc.id,
			...doc.data()
		})) as User[];

		return users;
	} catch (error) {
		console.error('Failed to get all users:', error);
		throw error;
	}
}

/**
 * Refresh the current user's session to reflect role changes
 * This forces Firebase to reload the user's token and custom claims
 */
export async function refreshUserSession(): Promise<void> {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('No user is currently signed in');
	}

	try {
		// Force token refresh
		await currentUser.getIdToken(true);
		
		// Reload user data
		await currentUser.reload();

		console.log('User session refreshed successfully');
	} catch (error) {
		console.error('Failed to refresh user session:', error);
		throw error;
	}
}
