import { writable, derived, type Readable } from 'svelte/store';
import { subscribeToReports } from '$lib/services/reportService';
import type { Report, FilterOptions } from '$lib/types';
import type { Unsubscribe } from 'firebase/firestore';

/**
 * ReportsStore manages crime reports state reactively
 * Provides real-time updates via Firestore listeners
 */

interface ReportsState {
	reports: Report[];
	loading: boolean;
	error: string | null;
	filters: FilterOptions;
}

function createReportsStore() {
	const { subscribe, set, update } = writable<ReportsState>({
		reports: [],
		loading: false,
		error: null,
		filters: {}
	});

	let unsubscribe: Unsubscribe | null = null;

	return {
		subscribe,

		/**
		 * Subscribe to real-time report updates with optional filters
		 * @param filters - Optional filter criteria (crime type, date range, status)
		 */
		subscribeToReports: (filters: FilterOptions = {}) => {
			// Unsubscribe from previous listener if exists
			if (unsubscribe) {
				unsubscribe();
			}

			// Set loading state
			update((state) => ({
				...state,
				loading: true,
				error: null,
				filters
			}));

			try {
				// Set up new listener
				unsubscribe = subscribeToReports(filters, (reports) => {
					update((state) => ({
						...state,
						reports,
						loading: false,
						error: null
					}));
				});
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe to reports';
				update((state) => ({
					...state,
					loading: false,
					error: errorMessage
				}));
			}
		},

		/**
		 * Update filter criteria and resubscribe
		 * @param filters - New filter criteria
		 */
		setFilters: (filters: FilterOptions) => {
			update((state) => ({
				...state,
				filters
			}));

			// Resubscribe with new filters
			if (unsubscribe) {
				unsubscribe();
			}

			update((state) => ({
				...state,
				loading: true,
				error: null
			}));

			try {
				unsubscribe = subscribeToReports(filters, (reports) => {
					update((state) => ({
						...state,
						reports,
						loading: false,
						error: null
					}));
				});
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to update filters';
				update((state) => ({
					...state,
					loading: false,
					error: errorMessage
				}));
			}
		},

		/**
		 * Unsubscribe from real-time updates
		 */
		unsubscribe: () => {
			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}

			update((state) => ({
				...state,
				reports: [],
				loading: false,
				error: null
			}));
		},

		/**
		 * Clear error state
		 */
		clearError: () => {
			update((state) => ({
				...state,
				error: null
			}));
		}
	};
}

export const reportsStore = createReportsStore();

/**
 * Derived store that returns just the reports array
 */
export const reports: Readable<Report[]> = derived(
	reportsStore,
	($reportsStore) => $reportsStore.reports
);

/**
 * Derived store that returns loading state
 */
export const reportsLoading: Readable<boolean> = derived(
	reportsStore,
	($reportsStore) => $reportsStore.loading
);

/**
 * Derived store that returns error state
 */
export const reportsError: Readable<string | null> = derived(
	reportsStore,
	($reportsStore) => $reportsStore.error
);

/**
 * Derived store that returns current filters
 */
export const reportsFilters: Readable<FilterOptions> = derived(
	reportsStore,
	($reportsStore) => $reportsStore.filters
);

/**
 * Derived store that returns the count of reports
 */
export const reportsCount: Readable<number> = derived(
	reportsStore,
	($reportsStore) => $reportsStore.reports.length
);
