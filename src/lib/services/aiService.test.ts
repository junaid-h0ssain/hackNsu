import { describe, it, expect, vi } from 'vitest';

// Mock Google Generative AI
const mockGenerateContent = vi.fn();

vi.mock('@google/generative-ai', () => {
	return {
		GoogleGenerativeAI: class {
			constructor() {}
			getGenerativeModel() {
				return {
					generateContent: mockGenerateContent
				};
			}
		}
	};
});

// Import after mocking
const { getRateLimitStatus, analyzeText, analyzeCrimeReport } = await import('./aiService');

describe('AIService', () => {
	describe('getRateLimitStatus', () => {
		it('should return initial rate limit status', () => {
			const status = getRateLimitStatus();
			expect(status).toHaveProperty('requestsInLastMinute');
			expect(status).toHaveProperty('remainingRequests');
			expect(status.requestsInLastMinute).toBeGreaterThanOrEqual(0);
			expect(status.remainingRequests).toBeGreaterThanOrEqual(0);
			expect(status.remainingRequests).toBeLessThanOrEqual(15);
		});

		it('should have correct total of requests and remaining', () => {
			const status = getRateLimitStatus();
			expect(status.requestsInLastMinute + status.remainingRequests).toBeLessThanOrEqual(15);
		});
	});

	describe('analyzeText', () => {
		it('should analyze text and return structured results', async () => {
			// Mock AI response
			mockGenerateContent.mockResolvedValueOnce({
				response: {
					text: () =>
						'This is a high severity theft incident. The report describes a burglary with stolen items. Confidence: 85%'
				}
			});

			const result = await analyzeText('Someone broke into my car and stole my laptop');

			expect(result).toHaveProperty('summary');
			expect(result).toHaveProperty('severity');
			expect(result).toHaveProperty('categories');
			expect(result).toHaveProperty('confidence');
			expect(result.severity).toBe('high');
			expect(result.categories).toContain('theft');
			expect(result.confidence).toBeGreaterThan(0);
			expect(result.confidence).toBeLessThanOrEqual(1);
		});

		it('should handle medium severity cases', async () => {
			mockGenerateContent.mockResolvedValueOnce({
				response: {
					text: () => 'This is a moderate severity vandalism case with graffiti damage.'
				}
			});

			const result = await analyzeText('Graffiti on my fence');

			expect(result.severity).toBe('medium');
			expect(result.categories).toContain('vandalism');
		});

		it('should default to low severity when unclear', async () => {
			mockGenerateContent.mockResolvedValueOnce({
				response: {
					text: () => 'This appears to be a minor incident with unclear details.'
				}
			});

			const result = await analyzeText('Something happened');

			expect(result.severity).toBe('low');
		});
	});

	describe('analyzeCrimeReport', () => {
		it('should analyze crime report without images', async () => {
			mockGenerateContent.mockResolvedValueOnce({
				response: {
					text: () => 'High severity assault incident. Violence reported. Confidence: 90%'
				}
			});

			const result = await analyzeCrimeReport('I was attacked in the park');

			expect(result).toHaveProperty('summary');
			expect(result).toHaveProperty('severity');
			expect(result).toHaveProperty('categories');
			expect(result).toHaveProperty('confidence');
			expect(result.severity).toBe('high');
			expect(result.categories).toContain('assault');
			expect(result.imageAnalysis).toBeUndefined();
		});
	});
});
