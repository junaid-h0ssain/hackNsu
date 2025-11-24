import {
	ref,
	uploadBytesResumable,
	deleteObject,
	getDownloadURL as firebaseGetDownloadURL,
	type UploadTask,
	type StorageReference
} from 'firebase/storage';
import { storage } from '$lib/firebase/config';

/**
 * StorageService provides media upload/download functionality using Firebase Storage
 * Handles file validation, upload progress tracking, and URL retrieval
 */

// Constants for file validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

/**
 * Validation error types
 */
export class FileValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'FileValidationError';
	}
}

/**
 * Upload progress callback type
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * Validate file size and type
 * @throws {FileValidationError} if validation fails
 */
function validateFile(file: File): void {
	// Check file size
	if (file.size > MAX_FILE_SIZE) {
		throw new FileValidationError(
			`File size exceeds 10MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
		);
	}

	// Check file type
	if (!ALLOWED_TYPES.includes(file.type)) {
		throw new FileValidationError(
			`File type not allowed. Allowed types: images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, OGG, MOV). Got: ${file.type}`
		);
	}
}

/**
 * Upload a file to Firebase Storage with progress tracking
 * @param file - The file to upload
 * @param path - Storage path (e.g., 'reports/reportId/filename.jpg')
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Promise resolving to the download URL
 * @throws {FileValidationError} if file validation fails
 */
export async function uploadFile(
	file: File,
	path: string,
	onProgress?: UploadProgressCallback
): Promise<string> {
	// Validate file before upload
	validateFile(file);

	// Create storage reference
	const storageRef: StorageReference = ref(storage, path);

	// Create upload task
	const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

	// Return promise that resolves with download URL
	return new Promise((resolve, reject) => {
		uploadTask.on(
			'state_changed',
			(snapshot) => {
				// Calculate and report progress
				const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
				if (onProgress) {
					onProgress(progress);
				}
			},
			(error) => {
				// Handle upload errors
				reject(error);
			},
			async () => {
				// Upload completed successfully, get download URL
				try {
					const downloadURL = await firebaseGetDownloadURL(uploadTask.snapshot.ref);
					resolve(downloadURL);
				} catch (error) {
					reject(error);
				}
			}
		);
	});
}

/**
 * Delete a file from Firebase Storage
 * @param url - The download URL or storage path of the file to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteFile(url: string): Promise<void> {
	try {
		// Create reference from URL or path
		let storageRef: StorageReference;

		if (url.startsWith('http')) {
			// If it's a full URL, extract the path
			// Firebase Storage URLs have format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?...
			const urlObj = new URL(url);
			const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);

			if (pathMatch) {
				const encodedPath = pathMatch[1];
				const decodedPath = decodeURIComponent(encodedPath);
				storageRef = ref(storage, decodedPath);
			} else {
				throw new Error('Invalid Firebase Storage URL');
			}
		} else {
			// If it's already a path, use it directly
			storageRef = ref(storage, url);
		}

		await deleteObject(storageRef);
	} catch (error: any) {
		// If file doesn't exist, don't throw error
		if (error.code === 'storage/object-not-found') {
			console.warn('File not found, skipping deletion:', url);
			return;
		}
		throw error;
	}
}

/**
 * Get the download URL for a file in Firebase Storage
 * @param path - Storage path (e.g., 'reports/reportId/filename.jpg')
 * @returns Promise resolving to the download URL
 */
export async function getDownloadURL(path: string): Promise<string> {
	const storageRef: StorageReference = ref(storage, path);
	return await firebaseGetDownloadURL(storageRef);
}

/**
 * Helper function to generate a unique filename
 * @param originalName - Original filename
 * @param prefix - Optional prefix (e.g., reportId)
 * @returns Unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string, prefix?: string): string {
	const timestamp = Date.now();
	const randomString = Math.random().toString(36).substring(2, 8);
	const extension = originalName.split('.').pop();
	const baseName = originalName.split('.').slice(0, -1).join('.');

	if (prefix) {
		return `${prefix}_${timestamp}_${randomString}_${baseName}.${extension}`;
	}

	return `${timestamp}_${randomString}_${baseName}.${extension}`;
}

/**
 * Upload multiple files with progress tracking
 * @param files - Array of files to upload
 * @param basePath - Base storage path (e.g., 'reports/reportId')
 * @param onProgress - Optional callback for overall progress (0-100)
 * @returns Promise resolving to array of download URLs
 */
export async function uploadMultipleFiles(
	files: File[],
	basePath: string,
	onProgress?: UploadProgressCallback
): Promise<string[]> {
	const uploadPromises: Promise<string>[] = [];
	const progressMap = new Map<number, number>();

	files.forEach((file, index) => {
		const filename = generateUniqueFilename(file.name);
		const path = `${basePath}/${filename}`;

		const uploadPromise = uploadFile(file, path, (fileProgress) => {
			// Track individual file progress
			progressMap.set(index, fileProgress);

			// Calculate overall progress
			if (onProgress) {
				const totalProgress =
					Array.from(progressMap.values()).reduce((sum, p) => sum + p, 0) / files.length;
				onProgress(totalProgress);
			}
		});

		uploadPromises.push(uploadPromise);
	});

	return await Promise.all(uploadPromises);
}
