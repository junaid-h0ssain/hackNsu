/**
 * Lazy-loaded AI Service
 * This module provides dynamic imports for the AI service to enable code splitting
 * The heavy Google Generative AI SDK is only loaded when AI analysis is needed
 */

import type { AIAnalysis, CrimeAnalysis } from '$lib/types';

// Cached module reference
let aiServiceModule: typeof import('./aiService') | null = null;

/**
 * Dynamically load the AI service module
 */
async function loadAiService() {
	if (!aiServiceModule) {
		aiServiceModule = await import('./aiService');
	}
	return aiServiceModule;
}

/**
 * Lazy-loaded text analysis
 * @param description - The crime report description
 * @returns Promise resolving to AI analysis results
 */
export async function analyzeText(description: string): Promise<AIAnalysis> {
	const service = await loadAiService();
	return service.analyzeText(description);
}

/**
 * Lazy-loaded image analysis
 * @param imageUrl - URL of the image to analyze
 * @returns Promise resolving to image analysis description
 */
export async function analyzeImage(imageUrl: string): Promise<string> {
	const service = await loadAiService();
	return service.analyzeImage(imageUrl);
}

/**
 * Lazy-loaded crime report analysis
 * @param description - The crime report description
 * @param imageUrls - Array of image URLs to analyze
 * @returns Promise resolving to comprehensive crime analysis
 */
export async function analyzeCrimeReport(
	description: string,
	imageUrls: string[] = []
): Promise<CrimeAnalysis> {
	const service = await loadAiService();
	return service.analyzeCrimeReport(description, imageUrls);
}

/**
 * Get current rate limit status (lazy-loaded)
 */
export async function getRateLimitStatus(): Promise<{
	requestsInLastMinute: number;
	remainingRequests: number;
}> {
	const service = await loadAiService();
	return service.getRateLimitStatus();
}
