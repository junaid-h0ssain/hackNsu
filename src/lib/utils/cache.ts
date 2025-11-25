/**
 * Cache utility for Firestore queries and other data
 * Implements TTL-based caching to reduce redundant API calls
 */

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

/**
 * Pagination cursor for Firestore queries
 */
export interface PaginationCursor {
	lastDocId: string | null;
	hasMore: boolean;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
	data: T[];
	cursor: PaginationCursor;
	totalFetched: number;
}

class QueryCache {
	private cache: Map<string, CacheEntry<unknown>> = new Map();
	private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default TTL
	private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached entries

	/**
	 * Get cached data if valid
	 * @param key - Cache key
	 * @returns Cached data or null if expired/not found
	 */
	get<T>(key: string): T | null {
		const entry = this.cache.get(key) as CacheEntry<T> | undefined;
		
		if (!entry) {
			return null;
		}

		const now = Date.now();
		if (now - entry.timestamp > entry.ttl) {
			// Entry expired, remove it
			this.cache.delete(key);
			return null;
		}

		return entry.data;
	}

	/**
	 * Set cache entry with optional TTL
	 * @param key - Cache key
	 * @param data - Data to cache
	 * @param ttl - Time to live in milliseconds (default: 5 minutes)
	 */
	set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
		// Enforce max cache size by removing oldest entries
		if (this.cache.size >= this.MAX_CACHE_SIZE) {
			this.evictOldest();
		}

		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl
		});
	}

	/**
	 * Check if cache entry exists and is valid
	 * @param key - Cache key
	 * @returns true if entry exists and is not expired
	 */
	has(key: string): boolean {
		return this.get(key) !== null;
	}

	/**
	 * Get or set cache entry with factory function
	 * @param key - Cache key
	 * @param factory - Function to create data if not cached
	 * @param ttl - Time to live in milliseconds
	 * @returns Cached or newly created data
	 */
	async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
		const cached = this.get<T>(key);
		if (cached !== null) {
			return cached;
		}

		const data = await factory();
		this.set(key, data, ttl);
		return data;
	}

	/**
	 * Invalidate a specific cache entry
	 * @param key - Cache key to invalidate
	 */
	invalidate(key: string): void {
		this.cache.delete(key);
	}

	/**
	 * Invalidate all cache entries matching a prefix
	 * @param prefix - Key prefix to match
	 */
	invalidateByPrefix(prefix: string): void {
		for (const key of this.cache.keys()) {
			if (key.startsWith(prefix)) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * Clear all cache entries
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Get cache statistics
	 */
	getStats(): { size: number; keys: string[]; hitRate?: number } {
		return {
			size: this.cache.size,
			keys: Array.from(this.cache.keys())
		};
	}

	/**
	 * Evict oldest entries when cache is full
	 */
	private evictOldest(): void {
		let oldestKey: string | null = null;
		let oldestTimestamp = Infinity;

		for (const [key, entry] of this.cache.entries()) {
			if (entry.timestamp < oldestTimestamp) {
				oldestTimestamp = entry.timestamp;
				oldestKey = key;
			}
		}

		if (oldestKey) {
			this.cache.delete(oldestKey);
		}
	}

	/**
	 * Clean up expired entries
	 */
	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > entry.ttl) {
				this.cache.delete(key);
			}
		}
	}
}

// Singleton instance
export const queryCache = new QueryCache();

/**
 * Generate a cache key from filter options
 * @param prefix - Key prefix (e.g., 'reports')
 * @param filters - Filter options object
 * @returns Cache key string
 */
export function generateCacheKey(prefix: string, filters: Record<string, unknown>): string {
	const sortedFilters = Object.keys(filters)
		.sort()
		.reduce((acc, key) => {
			const value = filters[key];
			if (value !== undefined && value !== null && value !== '') {
				acc[key] = value instanceof Date ? value.toISOString() : value;
			}
			return acc;
		}, {} as Record<string, unknown>);

	return `${prefix}:${JSON.stringify(sortedFilters)}`;
}

/**
 * Image cache for optimized loading
 */
class ImageCache {
	private cache: Map<string, string> = new Map();
	private readonly MAX_SIZE = 50;

	/**
	 * Get cached image URL (potentially compressed/optimized)
	 */
	get(originalUrl: string): string | null {
		return this.cache.get(originalUrl) || null;
	}

	/**
	 * Cache an optimized image URL
	 */
	set(originalUrl: string, optimizedUrl: string): void {
		if (this.cache.size >= this.MAX_SIZE) {
			// Remove first entry (oldest)
			const firstKey = this.cache.keys().next().value;
			if (firstKey) {
				this.cache.delete(firstKey);
			}
		}
		this.cache.set(originalUrl, optimizedUrl);
	}

	/**
	 * Clear image cache
	 */
	clear(): void {
		this.cache.clear();
	}
}

export const imageCache = new ImageCache();

/**
 * Compress image before upload
 * @param file - Original image file
 * @param maxWidth - Maximum width (default: 1920)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Promise resolving to compressed blob
 */
export async function compressImage(
	file: File,
	maxWidth: number = 1920,
	quality: number = 0.8
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		// Skip compression for non-image files
		if (!file.type.startsWith('image/')) {
			resolve(file);
			return;
		}

		const img = new Image();
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		img.onload = () => {
			let { width, height } = img;

			// Calculate new dimensions
			if (width > maxWidth) {
				height = (height * maxWidth) / width;
				width = maxWidth;
			}

			canvas.width = width;
			canvas.height = height;

			if (ctx) {
				ctx.drawImage(img, 0, 0, width, height);
				canvas.toBlob(
					(blob) => {
						if (blob) {
							resolve(blob);
						} else {
							reject(new Error('Failed to compress image'));
						}
					},
					'image/jpeg',
					quality
				);
			} else {
				reject(new Error('Failed to get canvas context'));
			}
		};

		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = URL.createObjectURL(file);
	});
}
