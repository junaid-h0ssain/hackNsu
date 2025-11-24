import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase modules before importing the service
vi.mock('firebase/storage', () => ({
	ref: vi.fn(),
	uploadBytesResumable: vi.fn(),
	deleteObject: vi.fn(),
	getDownloadURL: vi.fn()
}));

vi.mock('$lib/firebase/config', () => ({
	storage: {}
}));

// Now import the service after mocking
const { FileValidationError, generateUniqueFilename } = await import('./storageService');

describe('StorageService', () => {
	describe('generateUniqueFilename', () => {
		it('should generate unique filename with timestamp', () => {
			const filename = generateUniqueFilename('test.jpg');
			expect(filename).toMatch(/^\d+_[a-z0-9]+_test\.jpg$/);
		});

		it('should include prefix when provided', () => {
			const filename = generateUniqueFilename('test.jpg', 'report123');
			expect(filename).toMatch(/^report123_\d+_[a-z0-9]+_test\.jpg$/);
		});

		it('should handle filenames with multiple dots', () => {
			const filename = generateUniqueFilename('my.test.file.jpg');
			expect(filename).toMatch(/^\d+_[a-z0-9]+_my\.test\.file\.jpg$/);
		});

		it('should generate different filenames on subsequent calls', () => {
			const filename1 = generateUniqueFilename('test.jpg');
			const filename2 = generateUniqueFilename('test.jpg');
			expect(filename1).not.toBe(filename2);
		});
	});

	describe('FileValidationError', () => {
		it('should create error with correct name', () => {
			const error = new FileValidationError('Test error');
			expect(error.name).toBe('FileValidationError');
			expect(error.message).toBe('Test error');
		});
	});
});
