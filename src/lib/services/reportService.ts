import {
	collection,
	doc,
	getDoc,
	getDocs,
	addDoc,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	onSnapshot,
	serverTimestamp,
	type Unsubscribe,
	type Query,
	type DocumentData,
	Timestamp
} from 'firebase/firestore';
import { db, auth } from '$lib/firebase/config';
import { uploadMultipleFiles, deleteFile } from './storageService';
import { analyzeCrimeReport } from './aiService';
import type { Report, CreateReportInput, FilterOptions } from '$lib/types';

/**
 * ReportService provides CRUD operations for crime reports
 * Integrates with AI analysis and media storage
 */

/**
 * Create a new crime report with AI analysis and media uploads
 */
export async function createReport(reportInput: CreateReportInput): Promise<string> {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User must be authenticated to create a report');
	}

	try {
		const reportRef = await addDoc(collection(db, 'reports'), {
			authorId: currentUser.uid,
			authorName: currentUser.displayName || currentUser.email || 'Anonymous',
			title: reportInput.title,
			description: reportInput.description,
			crimeType: reportInput.crimeType,
			location: reportInput.location,
			mediaUrls: [],
			upvotes: 0,
			downvotes: 0,
			commentCount: 0,
			status: 'active',
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});

		const reportId = reportRef.id;
		const mediaUrls: string[] = [];

		if (reportInput.mediaFiles && reportInput.mediaFiles.length > 0) {
			try {
				const uploadedUrls = await uploadMultipleFiles(
					reportInput.mediaFiles,
					`reports/${reportId}`
				);
				mediaUrls.push(...uploadedUrls);
			} catch (error) {
				console.error('Failed to upload media files:', error);
			}
		}

		let aiAnalysis = undefined;
		try {
			const analysis = await analyzeCrimeReport(reportInput.description, mediaUrls);
			aiAnalysis = {
				summary: analysis.summary,
				severity: analysis.severity,
				categories: analysis.categories,
				confidence: analysis.confidence
			};
		} catch (error) {
			console.error('AI analysis failed:', error);
		}

		await updateDoc(reportRef, {
			mediaUrls,
			...(aiAnalysis && { aiAnalysis }),
			updatedAt: serverTimestamp()
		});

		return reportId;
	} catch (error) {
		console.error('Failed to create report:', error);
		throw error;
	}
}

/**
 * Get a single report by ID
 */
export async function getReport(reportId: string): Promise<Report> {
	try {
		const reportRef = doc(db, 'reports', reportId);
		const reportDoc = await getDoc(reportRef);

		if (!reportDoc.exists()) {
			throw new Error(`Report with ID ${reportId} not found`);
		}

		return {
			id: reportDoc.id,
			...reportDoc.data()
		} as Report;
	} catch (error) {
		console.error('Failed to get report:', error);
		throw error;
	}
}

/**
 * Get reports with optional filtering
 */
export async function getReports(filters: FilterOptions = {}): Promise<Report[]> {
	try {
		let q: Query<DocumentData> = collection(db, 'reports');
		const constraints = [];

		if (filters.status) {
			constraints.push(where('status', '==', filters.status));
		} else {
			constraints.push(where('status', '==', 'active'));
		}

		if (filters.crimeType) {
			constraints.push(where('crimeType', '==', filters.crimeType));
		}

		if (filters.startDate) {
			constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
		}

		if (filters.endDate) {
			constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
		}

		constraints.push(orderBy('createdAt', 'desc'));

		if (constraints.length > 0) {
			q = query(q, ...constraints);
		}

		const querySnapshot = await getDocs(q);
		const reports: Report[] = querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as Report[];

		return reports;
	} catch (error) {
		console.error('Failed to get reports:', error);
		throw error;
	}
}

/**
 * Subscribe to real-time report updates with optional filtering
 */
export function subscribeToReports(
	filters: FilterOptions = {},
	callback: (reports: Report[]) => void
): Unsubscribe {
	try {
		let q: Query<DocumentData> = collection(db, 'reports');
		const constraints = [];

		if (filters.status) {
			constraints.push(where('status', '==', filters.status));
		} else {
			constraints.push(where('status', '==', 'active'));
		}

		if (filters.crimeType) {
			constraints.push(where('crimeType', '==', filters.crimeType));
		}

		if (filters.startDate) {
			constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
		}

		if (filters.endDate) {
			constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
		}

		constraints.push(orderBy('createdAt', 'desc'));

		if (constraints.length > 0) {
			q = query(q, ...constraints);
		}

		const unsubscribe = onSnapshot(
			q,
			(querySnapshot) => {
				const reports: Report[] = querySnapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data()
				})) as Report[];

				callback(reports);
			},
			(error) => {
				console.error('Error in reports subscription:', error);
			}
		);

		return unsubscribe;
	} catch (error) {
		console.error('Failed to subscribe to reports:', error);
		throw error;
	}
}

/**
 * Update an existing report
 */
export async function updateReport(reportId: string, updates: Partial<Report>): Promise<void> {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User must be authenticated to update a report');
	}

	try {
		const report = await getReport(reportId);

		if (report.authorId !== currentUser.uid) {
			throw new Error('User is not authorized to update this report');
		}

		const { id, authorId, authorName, createdAt, ...allowedUpdates } = updates as any;

		const reportRef = doc(db, 'reports', reportId);
		await updateDoc(reportRef, {
			...allowedUpdates,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		console.error('Failed to update report:', error);
		throw error;
	}
}

/**
 * Delete a report and its associated media
 */
export async function deleteReport(reportId: string): Promise<void> {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User must be authenticated to delete a report');
	}

	try {
		const report = await getReport(reportId);

		if (report.authorId !== currentUser.uid) {
			throw new Error('User is not authorized to delete this report');
		}

		if (report.mediaUrls && report.mediaUrls.length > 0) {
			for (const mediaUrl of report.mediaUrls) {
				try {
					await deleteFile(mediaUrl);
				} catch (error) {
					console.error(`Failed to delete media file ${mediaUrl}:`, error);
				}
			}
		}

		const reportRef = doc(db, 'reports', reportId);
		await deleteDoc(reportRef);
	} catch (error) {
		console.error('Failed to delete report:', error);
		throw error;
	}
}
