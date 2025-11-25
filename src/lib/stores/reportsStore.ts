import { writable, derived, type Readable } from 'svelte/store';
import { subscribeToReports } from '$lib/services/reportService';
import type { Report, FilterOptions } from '$lib/types';
import type { Unsubscribe } from 'firebase/firestore';

/**
 * ReportsStore manages crime reports state reactively
 * Provides real-time updates via Firestore listeners
 * Optimized for performance with listener lifecycle management
 */

interface ReportsState {
	reports: Report[];
	loading: boolean;
	error: string | null;
	filters: FilterOptions;
	isActive: boolean; // Track if listener is active
	lastUpdated: number | null; // Track last update timestamp
}

// Track active listeners for debugging and optimization
let activeListenerCount = 0;

function createReportsStore() {
	const { subscribe, set, update } = writable<ReportsState>({
		reports: [],
		loading: false,
		error: null,
		filters: {},
		isActive: false,
		lastUpdated: null
	});

	let unsubscribe: Unsubscribe | null = null;
	let visibilityHandler: (() => void) | null = null;
	let currentFilters: FilterOptions = {};

	/**
	 * Internal function to attach listener
	 */
	const attachListener = (filters: FilterOptions) => {
		if (unsubscribe) {
			unsubscribe();
			activeListenerCount--;
		}

		currentFilters = filters;

		try {
			unsubscribe = subscribeToReports(filters, (reports) => {
				update((state) => ({
					...state,
					reports,
					loading: false,
					error: null,
					isActive: true,
					lastUpdated: Date.now()
				}));
			});
			activeListenerCount++;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe to reports';
			update((state) => ({
				...state,
				loading: false,
				error: errorMessage,
				isActive: false
			}));
		}
	};

	/**
	 * Internal function to detach listener
	 */
	const detachListener = () => {
		if (unsubscribe) {
			unsubscribe();
			unsubscribe = null;
			activeListenerCount--;
		}
		update((state) => ({
			...state,
			isActive: false
		}));
	};

	/**
	 * Handle page visibility changes to pause/resume listeners
	 */
	const setupVisibilityHandler = () => {
		if (typeof document === 'undefined') return;

		visibilityHandler = () => {
			if (document.visibilityState === 'hidden') {
				// Page is hidden, detach listener to save resources
				detachListener();
			} else if (document.visibilityState === 'visible') {
				// Page is visible again, reattach listener
				attachListener(currentFilters);
			}
		};

		document.addEventListener('visibilitychange', visibilityHandler);
	};

	/**
	 * Clean up visibility handler
	 */
	const cleanupVisibilityHandler = () => {
		if (visibilityHandler && typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', visibilityHandler);
			visibilityHandler = null;
		}
	};

	return {
		subscribe,

		/**
		 * Subscribe to real-time report updates with optional filters
		 * Automatically manages listener lifecycle based on page visibility
		 * @param filters - Optional filter criteria (crime type, date range, status)
		 */
		subscribeToReports: (filters: FilterOptions = {}) => {
			// Set loading state
			update((state) => ({
				...state,
				loading: true,
				error: null,
				filters
			}));

			// Set up visibility handler for automatic pause/resume
			setupVisibilityHandler();

			// Attach the listener
			attachListener(filters);
		},

		/**
		 * Update filter criteria and resubscribe
		 * @param filters - New filter criteria
		 */
		setFilters: (filters: FilterOptions) => {
			update((state) => ({
				...state,
				filters,
				loading: true,
				error: null
			}));

			// Reattach with new filters
			attachListener(filters);
		},

		/**
		 * Pause real-time updates (useful when component is not visible)
		 */
		pause: () => {
			detachListener();
		},

		/**
		 * Resume real-time updates
		 */
		resume: () => {
			attachListener(currentFilters);
		},

		/**
		 * Unsubscribe from real-time updates and clean up
		 */
		unsubscribe: () => {
			detachListener();
			cleanupVisibilityHandler();

			update((state) => ({
				...state,
				reports: [],
				loading: false,
				error: null,
				isActive: false,
				lastUpdated: null
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
		},

		/**
		 * Get active listener count (for debugging)
		 */
		getActiveListenerCount: () => activeListenerCount
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

/**
 * Derived store that returns whether the listener is active
 */
export const reportsListenerActive: Readable<boolean> = derived(
	reportsStore,
	($reportsStore) => $reportsStore.isActive
);

/**
 * Derived store that returns the last update timestamp
 */
export const reportsLastUpdated: Readable<number | null> = derived(
	reportsStore,
	($reportsStore) => $reportsStore.lastUpdated
);
