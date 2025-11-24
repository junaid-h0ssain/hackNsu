import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIAnalysis, CrimeAnalysis, SeverityLevel } from '$lib/types';

/**
 * AIService provides AI-powered analysis using Google Gemini API
 * Includes rate limiting, text analysis, and image analysis capabilities
 */

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Rate limiter configuration: 15 requests per minute
const MAX_REQUESTS_PER_MINUTE = 15;
const MINUTE_MS = 60000;

// Request queue for rate limiting
interface RequestTimestamp {
	timestamp: number;
}

const requestQueue: RequestTimestamp[] = [];

/**
 * Rate limiter that ensures we don't exceed API limits
 * Implements a sliding window rate limiter
 */
async function rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
	const now = Date.now();

	// Remove requests older than 1 minute
	while (requestQueue.length > 0 && now - requestQueue[0].timestamp >= MINUTE_MS) {
		requestQueue.shift();
	}

	// Check if we've hit the rate limit
	if (requestQueue.length >= MAX_REQUESTS_PER_MINUTE) {
		const oldestRequest = requestQueue[0];
		const waitTime = MINUTE_MS - (now - oldestRequest.timestamp);

		console.log(`Rate limit reached. Waiting ${waitTime}ms before next request.`);

		// Wait until we can make another request
		await new Promise((resolve) => setTimeout(resolve, waitTime + 100));

		// Recursively call to check again after waiting
		return rateLimitedRequest(fn);
	}

	// Add current request to queue
	requestQueue.push({ timestamp: now });

	// Execute the function
	return await fn();
}

/**
 * Extract severity level from AI response text
 */
function extractSeverity(text: string): SeverityLevel {
	const lower = text.toLowerCase();

	// Look for severity indicators
	if (
		lower.includes('high severity') ||
		lower.includes('severe') ||
		lower.includes('critical') ||
		lower.includes('dangerous') ||
		lower.includes('violent')
	) {
		return 'high';
	}

	if (
		lower.includes('medium severity') ||
		lower.includes('moderate') ||
		lower.includes('concerning')
	) {
		return 'medium';
	}

	return 'low';
}

/**
 * Extract crime categories from AI response text
 */
function extractCategories(text: string): string[] {
	const lower = text.toLowerCase();
	const categories: string[] = [];

	// Common crime categories
	const categoryKeywords: Record<string, string[]> = {
		theft: ['theft', 'stealing', 'stolen', 'robbery', 'burglary', 'larceny'],
		assault: ['assault', 'attack', 'violence', 'battery', 'fight'],
		vandalism: ['vandalism', 'damage', 'graffiti', 'destruction'],
		fraud: ['fraud', 'scam', 'deception', 'forgery'],
		'drug-related': ['drug', 'narcotics', 'substance'],
		harassment: ['harassment', 'stalking', 'threatening'],
		'traffic-violation': ['traffic', 'speeding', 'reckless driving'],
		trespassing: ['trespass', 'unauthorized entry'],
		'public-disturbance': ['disturbance', 'noise', 'disorderly']
	};

	// Check for each category
	for (const [category, keywords] of Object.entries(categoryKeywords)) {
		if (keywords.some((keyword) => lower.includes(keyword))) {
			categories.push(category);
		}
	}

	// If no categories found, return 'other'
	if (categories.length === 0) {
		categories.push('other');
	}

	return categories;
}

/**
 * Extract confidence score from AI response text
 * Returns a value between 0 and 1
 */
function extractConfidence(text: string): number {
	const lower = text.toLowerCase();

	// Look for explicit confidence mentions
	const confidenceMatch = lower.match(/confidence[:\s]+(\d+)%/);
	if (confidenceMatch) {
		return parseInt(confidenceMatch[1]) / 100;
	}

	// Look for certainty indicators
	if (lower.includes('certain') || lower.includes('clear') || lower.includes('definite')) {
		return 0.9;
	}

	if (lower.includes('likely') || lower.includes('probable')) {
		return 0.75;
	}

	if (lower.includes('possible') || lower.includes('might')) {
		return 0.6;
	}

	if (lower.includes('uncertain') || lower.includes('unclear')) {
		return 0.4;
	}

	// Default confidence
	return 0.7;
}

/**
 * Analyze crime report text using Gemini API
 * @param description - The crime report description
 * @returns Promise resolving to AI analysis results
 */
export async function analyzeText(description: string): Promise<AIAnalysis> {
	try {
		return await rateLimitedRequest(async () => {
			const prompt = `Analyze this crime report and provide:
1. A brief summary (2-3 sentences)
2. Severity level (low/medium/high)
3. Crime categories (e.g., theft, assault, vandalism, fraud, etc.)
4. Your confidence in this analysis

Report: ${description}

Please provide a structured analysis.`;

			const result = await model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();

			// Parse the response
			const summary = text.substring(0, 300).trim();
			const severity = extractSeverity(text);
			const categories = extractCategories(text);
			const confidence = extractConfidence(text);

			return {
				summary,
				severity,
				categories,
				confidence
			};
		});
	} catch (error) {
		console.error('AI text analysis failed:', error);
		throw error;
	}
}

/**
 * Analyze an image using Gemini API
 * @param imageUrl - URL of the image to analyze
 * @returns Promise resolving to image analysis description
 */
export async function analyzeImage(imageUrl: string): Promise<string> {
	try {
		return await rateLimitedRequest(async () => {
			// Fetch the image and convert to base64
			const imageData = await fetchImageAsBase64(imageUrl);

			const prompt =
				'Describe what you see in this image that might be relevant to a crime report. Focus on visible evidence, damage, people, vehicles, or any suspicious activity.';

			const result = await model.generateContent([
				prompt,
				{
					inlineData: {
						data: imageData,
						mimeType: 'image/jpeg'
					}
				}
			]);

			const response = await result.response;
			return response.text();
		});
	} catch (error) {
		console.error('AI image analysis failed:', error);
		throw error;
	}
}

/**
 * Analyze a complete crime report with description and images
 * @param description - The crime report description
 * @param imageUrls - Array of image URLs to analyze
 * @returns Promise resolving to comprehensive crime analysis
 */
export async function analyzeCrimeReport(
	description: string,
	imageUrls: string[] = []
): Promise<CrimeAnalysis> {
	try {
		// Analyze text first
		const textAnalysis = await analyzeText(description);

		// Analyze images if provided
		const imageAnalysis: string[] = [];
		for (const imageUrl of imageUrls) {
			try {
				const analysis = await analyzeImage(imageUrl);
				imageAnalysis.push(analysis);
			} catch (error) {
				console.error(`Failed to analyze image ${imageUrl}:`, error);
				// Continue with other images even if one fails
			}
		}

		// Combine analyses
		return {
			summary: textAnalysis.summary,
			severity: textAnalysis.severity,
			categories: textAnalysis.categories,
			confidence: textAnalysis.confidence,
			imageAnalysis: imageAnalysis.length > 0 ? imageAnalysis : undefined
		};
	} catch (error) {
		console.error('Crime report analysis failed:', error);
		throw error;
	}
}

/**
 * Fetch an image from URL and convert to base64
 * @param url - Image URL
 * @returns Promise resolving to base64 encoded image data
 */
async function fetchImageAsBase64(url: string): Promise<string> {
	try {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.statusText}`);
		}

		const blob = await response.blob();

		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				const base64String = reader.result as string;
				// Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
				const base64Data = base64String.split(',')[1];
				resolve(base64Data);
			};
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	} catch (error) {
		console.error('Failed to fetch and convert image:', error);
		throw error;
	}
}

/**
 * Get current rate limit status
 * Useful for debugging and monitoring
 */
export function getRateLimitStatus(): {
	requestsInLastMinute: number;
	remainingRequests: number;
} {
	const now = Date.now();

	// Clean up old requests
	while (requestQueue.length > 0 && now - requestQueue[0].timestamp >= MINUTE_MS) {
		requestQueue.shift();
	}

	return {
		requestsInLastMinute: requestQueue.length,
		remainingRequests: Math.max(0, MAX_REQUESTS_PER_MINUTE - requestQueue.length)
	};
}
