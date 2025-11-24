import { writable, derived, type Readable } from 'svelte/store';
import { doc, getDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as authSignOut } from '$lib/services/authService';
import { db } from '$lib/firebase/config';
import type { User, UserRole } from '$lib/types';

/**
 * AuthStore manages authentication state reactively
 * Syncs with Firebase Auth and Firestore user data
 */

interface AuthState {
	firebaseUser: FirebaseUser | null;
	userData: User | null;
	loading: boolean;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		firebaseUser: null,
		userData: null,
		loading: true
	});

	// Listen to Firebase auth state changes
	onAuthStateChanged(async (firebaseUser) => {
		if (firebaseUser) {
			// User is signed in, fetch user data from Firestore
			try {
				const userDocRef = doc(db, 'users', firebaseUser.uid);
				const userDoc = await getDoc(userDocRef);

				if (userDoc.exists()) {
					const userData = { id: userDoc.id, ...userDoc.data() } as User;
					set({
						firebaseUser,
						userData,
						loading: false
					});
				} else {
					// User document doesn't exist
					set({
						firebaseUser,
						userData: null,
						loading: false
					});
				}
			} catch (error) {
				console.error('Error fetching user data:', error);
				set({
					firebaseUser,
					userData: null,
					loading: false
				});
			}
		} else {
			// User is signed out
			set({
				firebaseUser: null,
				userData: null,
				loading: false
			});
		}
	});

	return {
		subscribe,
		signOut: async () => {
			await authSignOut();
		}
	};
}

export const authStore = createAuthStore();

/**
 * Derived store that returns true if user is authenticated
 */
export const isAuthenticated: Readable<boolean> = derived(
	authStore,
	($authStore) => $authStore.firebaseUser !== null
);

/**
 * Derived store that returns the current user's role
 * Defaults to 'citizen' if no user is authenticated
 */
export const userRole: Readable<UserRole> = derived(
	authStore,
	($authStore) => $authStore.userData?.role || 'citizen'
);

/**
 * Derived store that returns the current user data
 */
export const currentUser: Readable<User | null> = derived(
	authStore,
	($authStore) => $authStore.userData
);

/**
 * Derived store that returns loading state
 */
export const authLoading: Readable<boolean> = derived(
	authStore,
	($authStore) => $authStore.loading
);
