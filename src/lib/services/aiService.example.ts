/**
 * Example usage of AIService
 * This file demonstrates how to use the AI analysis service
 */

import { analyzeText, analyzeImage, analyzeCrimeReport, getRateLimitStatus } from './aiService';

// Example 1: Analyze text only
async function exampleTextAnalysis() {
	const description = 'Someone broke into my car last night and stole my laptop and phone';

	try {
		const analysis = await analyzeText(description);
		console.log('Text Analysis Result:', analysis);
		// Output:
		// {
		//   summary: "A burglary occurred where a car was broken into...",
		//   severity: "high",
		//   categories: ["theft", "burglary"],
		//   confidence: 0.85
		// }
	} catch (error) {
		console.error('Analysis failed:', error);
	}
}

// Example 2: Analyze a complete crime report with images
async function exampleCrimeReportAnalysis() {
	const description = 'Graffiti vandalism on the side of my building';
	const imageUrls = [
		'https://example.com/image1.jpg',
		'https://example.com/image2.jpg'
	];

	try {
		const analysis = await analyzeCrimeReport(description, imageUrls);
		console.log('Crime Report Analysis:', analysis);
		// Output:
		// {
		//   summary: "Vandalism incident involving graffiti...",
		//   severity: "medium",
		//   categories: ["vandalism"],
		//   confidence: 0.75,
		//   imageAnalysis: [
		//     "The image shows spray-painted graffiti on a brick wall...",
		//     "Additional graffiti visible on the lower section..."
		//   ]
		// }
	} catch (error) {
		console.error('Analysis failed:', error);
	}
}

// Example 3: Check rate limit status
function exampleRateLimitCheck() {
	const status = getRateLimitStatus();
	console.log('Rate Limit Status:', status);
	// Output:
	// {
	//   requestsInLastMinute: 5,
	//   remainingRequests: 10
	// }
}

// Example 4: Handle rate limiting gracefully
async function exampleWithRateLimiting() {
	const reports = [
		'Report 1 description',
		'Report 2 description',
		'Report 3 description'
		// ... up to 20 reports
	];

	for (const report of reports) {
		try {
			// Check rate limit before making request
			const status = getRateLimitStatus();
			console.log(`Processing report. Remaining requests: ${status.remainingRequests}`);

			// The service automatically handles rate limiting
			const analysis = await analyzeText(report);
			console.log('Analysis complete:', analysis.summary);
		} catch (error) {
			console.error('Failed to analyze report:', error);
		}
	}
}

// Example 5: Error handling
async function exampleErrorHandling() {
	try {
		const analysis = await analyzeText('Crime report description');
		console.log('Success:', analysis);
	} catch (error) {
		// Handle different error types
		if (error instanceof Error) {
			if (error.message.includes('API key')) {
				console.error('Invalid API key. Please check your environment variables.');
			} else if (error.message.includes('rate limit')) {
				console.error('Rate limit exceeded. Please wait before retrying.');
			} else {
				console.error('Analysis failed:', error.message);
			}
		}
	}
}

export {
	exampleTextAnalysis,
	exampleCrimeReportAnalysis,
	exampleRateLimitCheck,
	exampleWithRateLimiting,
	exampleErrorHandling
};
