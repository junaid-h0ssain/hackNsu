import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signInWithPhoneNumber,
	signOut as firebaseSignOut,
	onAuthStateChanged as firebaseOnAuthStateChanged,
	type User as FirebaseUser,
	type ConfirmationResult,
	type Unsubscribe,
	RecaptchaVerifier
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '$lib/firebase/config';
import type { User } from '$lib/types';

/**
 * AuthService provides authentication functionality using Firebase Auth
 * Supports email/password and phone/OTP authentication methods
 */

/**
 * Sign up a new user with email and password
 * Creates user document in Firestore with default role
 */
export async function signUpWithEmail(
	email: string,
	password: string,
	displayName?: string
): Promise<User> {
	const userCredential = await createUserWithEmailAndPassword(auth, email, password);
	const firebaseUser = userCredential.user;

	// Create user document in Firestore
	const userData: User = {
		uid: firebaseUser.uid,
		email: firebaseUser.email || undefined,
		displayName: displayName || firebaseUser.displayName || undefined,
		role: 'citizen',
		createdAt: serverTimestamp() as any,
		updatedAt: serverTimestamp() as any,
		suspended: false
	};

	await setDoc(doc(db, 'users', firebaseUser.uid), userData);

	return userData;
}

/**
 * Sign in an existing user with email and password
 * Retrieves user data from Firestore
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
	const userCredential = await signInWithEmailAndPassword(auth, email, password);
	const firebaseUser = userCredential.user;

	// Get user data from Firestore
	const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

	if (!userDoc.exists()) {
		throw new Error('User data not found');
	}

	return { id: userDoc.id, ...userDoc.data() } as User;
}

/**
 * Initialize phone authentication with reCAPTCHA verification
 * Returns a ConfirmationResult to be used with confirmPhoneCode
 */
export async function signInWithPhone(
	phoneNumber: string,
	recaptchaContainer: HTMLElement
): Promise<ConfirmationResult> {
	// Create reCAPTCHA verifier
	const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
		size: 'invisible'
	});

	// Send OTP
	const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);

	return confirmationResult;
}

/**
 * Confirm phone authentication with OTP code
 * Creates user document in Firestore if new user
 */
export async function confirmPhoneCode(
	confirmationResult: ConfirmationResult,
	code: string
): Promise<User> {
	const userCredential = await confirmationResult.confirm(code);
	const firebaseUser = userCredential.user;

	// Check if user document exists
	const userDocRef = doc(db, 'users', firebaseUser.uid);
	const userDoc = await getDoc(userDocRef);

	if (!userDoc.exists()) {
		// Create new user document
		const userData: User = {
			uid: firebaseUser.uid,
			phoneNumber: firebaseUser.phoneNumber || undefined,
			displayName: firebaseUser.displayName || undefined,
			role: 'citizen',
			createdAt: serverTimestamp() as any,
			updatedAt: serverTimestamp() as any,
			suspended: false
		};

		await setDoc(userDocRef, userData);
		return userData;
	}

	return { id: userDoc.id, ...userDoc.data() } as User;
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
	await firebaseSignOut(auth);
}

/**
 * Get the currently authenticated user
 * Returns null if no user is signed in
 */
export function getCurrentUser(): FirebaseUser | null {
	return auth.currentUser;
}

/**
 * Listen to authentication state changes
 * Callback is invoked whenever the user signs in or out
 */
export function onAuthStateChanged(
	callback: (user: FirebaseUser | null) => void
): Unsubscribe {
	return firebaseOnAuthStateChanged(auth, callback);
}
