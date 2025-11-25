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
	limit,
	startAfter,
	type Unsubscribe,
	type Query,
	type DocumentData,
	type DocumentSnapshot,
	Timestamp
} from 'firebase/firestore';
import { db, auth } from '$lib/firebase/config';
import { uploadMultipleFiles, deleteFile } from './storageService';
import { analyzeCrimeReport } from './lazyAiService';
import type { Report, CreateReportInput, FilterOptions } from '$lib/types';
import { queryCache, generateCacheKey, type PaginatedResult, type PaginationCursor } from '$lib/utils/cache';

// Default page size for pagination
const DEFAULT_PAGE_SIZE = 20;

// Cache TTL for reports (5 minutes)
const REPORTS_CACHE_TTL = 5 * 60 * 1000;

// Store for last document snapshots (for pagination)
const lastDocSnapshots: Map<string, DocumentSnapshot> = new Map();

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

		// Invalidate cache after creating a new report
		invalidateReportsCache();

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
 * Get reports with optional filtering (with caching)
 */
export async function getReports(filters: FilterOptions = {}): Promise<Report[]> {
	const cacheKey = generateCacheKey('reports', filters);
	
	// Check cache first
	const cached = queryCache.get<Report[]>(cacheKey);
	if (cached) {
		return cached;
	}

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

		// Cache the results
		queryCache.set(cacheKey, reports, REPORTS_CACHE_TTL);

		return reports;
	} catch (error) {
		console.error('Failed to get reports:', error);
		throw error;
	}
}

/**
 * Get paginated reports with optional filtering
 * @param filters - Filter options
 * @param pageSize - Number of reports per page (default: 20)
 * @param cursor - Pagination cursor from previous request
 * @returns Paginated result with reports and cursor
 */
export async function getReportsPaginated(
	filters: FilterOptions = {},
	pageSize: number = DEFAULT_PAGE_SIZE,
	cursor?: PaginationCursor
): Promise<PaginatedResult<Report>> {
	const cacheKey = generateCacheKey('reports_paginated', { 
		...filters, 
		pageSize, 
		lastDocId: cursor?.lastDocId 
	});
	
	// Check cache first
	const cached = queryCache.get<PaginatedResult<Report>>(cacheKey);
	if (cached) {
		return cached;
	}

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

		// Add pagination
		if (cursor?.lastDocId) {
			const lastDocSnapshot = lastDocSnapshots.get(cursor.lastDocId);
			if (lastDocSnapshot) {
				constraints.push(startAfter(lastDocSnapshot));
			}
		}

		// Request one extra to check if there are more results
		constraints.push(limit(pageSize + 1));

		if (constraints.length > 0) {
			q = query(q, ...constraints);
		}

		const querySnapshot = await getDocs(q);
		const docs = querySnapshot.docs;
		
		// Check if there are more results
		const hasMore = docs.length > pageSize;
		const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

		const reports: Report[] = resultDocs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as Report[];

		// Store last document snapshot for next pagination
		const lastDoc = resultDocs[resultDocs.length - 1];
		if (lastDoc) {
			lastDocSnapshots.set(lastDoc.id, lastDoc);
		}

		const result: PaginatedResult<Report> = {
			data: reports,
			cursor: {
				lastDocId: lastDoc?.id || null,
				hasMore
			},
			totalFetched: reports.length
		};

		// Cache the results
		queryCache.set(cacheKey, result, REPORTS_CACHE_TTL);

		return result;
	} catch (error) {
		console.error('Failed to get paginated reports:', error);
		throw error;
	}
}

/**
 * Invalidate reports cache (call after creating/updating/deleting reports)
 */
export function invalidateReportsCache(): void {
	queryCache.invalidateByPrefix('reports');
	lastDocSnapshots.clear();
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

		// Invalidate cache after updating a report
		invalidateReportsCache();
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

		// Invalidate cache after deleting a report
		invalidateReportsCache();
	} catch (error) {
		console.error('Failed to delete report:', error);
		throw error;
	}
}
