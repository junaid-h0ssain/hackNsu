import { describe, it, expect } from 'vitest';
import {
  isValidLatitude,
  isValidLongitude,
  isValidCoordinates,
  isValidLocation,
  isNonEmptyString,
  isValidMediaType,
  isValidFileSize,
  isValidMediaFile,
  areValidMediaFiles,
  isValidReportInput,
  isValidUserRole,
  isValidReportStatus,
  isValidVoteType,
  isValidEmail,
  isValidPhoneNumber,
  isValidCommentText,
  sanitizeInput,
} from './validation';
import type { Location, CreateReportInput } from '$lib/types';

describe('Coordinate Validation', () => {
  describe('isValidLatitude', () => {
    it('should accept valid latitudes', () => {
      expect(isValidLatitude(0)).toBe(true);
      expect(isValidLatitude(45)).toBe(true);
      expect(isValidLatitude(-45)).toBe(true);
      expect(isValidLatitude(90)).toBe(true);
      expect(isValidLatitude(-90)).toBe(true);
    });

    it('should reject invalid latitudes', () => {
      expect(isValidLatitude(91)).toBe(false);
      expect(isValidLatitude(-91)).toBe(false);
      expect(isValidLatitude(180)).toBe(false);
      expect(isValidLatitude(NaN)).toBe(false);
    });
  });

  describe('isValidLongitude', () => {
    it('should accept valid longitudes', () => {
      expect(isValidLongitude(0)).toBe(true);
      expect(isValidLongitude(90)).toBe(true);
      expect(isValidLongitude(-90)).toBe(true);
      expect(isValidLongitude(180)).toBe(true);
      expect(isValidLongitude(-180)).toBe(true);
    });

    it('should reject invalid longitudes', () => {
      expect(isValidLongitude(181)).toBe(false);
      expect(isValidLongitude(-181)).toBe(false);
      expect(isValidLongitude(360)).toBe(false);
      expect(isValidLongitude(NaN)).toBe(false);
    });
  });

  describe('isValidCoordinates', () => {
    it('should accept valid coordinate pairs', () => {
      expect(isValidCoordinates(0, 0)).toBe(true);
      expect(isValidCoordinates(45, 90)).toBe(true);
      expect(isValidCoordinates(-45, -90)).toBe(true);
      expect(isValidCoordinates(90, 180)).toBe(true);
      expect(isValidCoordinates(-90, -180)).toBe(true);
    });

    it('should reject invalid coordinate pairs', () => {
      expect(isValidCoordinates(91, 0)).toBe(false);
      expect(isValidCoordinates(0, 181)).toBe(false);
      expect(isValidCoordinates(91, 181)).toBe(false);
      expect(isValidCoordinates(NaN, 0)).toBe(false);
      expect(isValidCoordinates(0, NaN)).toBe(false);
    });
  });

  describe('isValidLocation', () => {
    it('should accept valid location objects', () => {
      const location: Location = { latitude: 45, longitude: 90 };
      expect(isValidLocation(location)).toBe(true);
    });

    it('should accept location with valid address', () => {
      const location: Location = { 
        latitude: 45, 
        longitude: 90, 
        address: '123 Main St' 
      };
      expect(isValidLocation(location)).toBe(true);
    });

    it('should reject location with invalid coordinates', () => {
      const location: Location = { latitude: 91, longitude: 90 };
      expect(isValidLocation(location)).toBe(false);
    });

    it('should reject location with empty address', () => {
      const location: Location = { 
        latitude: 45, 
        longitude: 90, 
        address: '   ' 
      };
      expect(isValidLocation(location)).toBe(false);
    });
  });
});

describe('String Validation', () => {
  describe('isNonEmptyString', () => {
    it('should accept non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('  hello  ')).toBe(true);
    });

    it('should reject empty or whitespace strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString('\t\n')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should accept valid phone numbers', () => {
      expect(isValidPhoneNumber('+1234567890')).toBe(true);
      expect(isValidPhoneNumber('+1 (234) 567-8900')).toBe(true);
      expect(isValidPhoneNumber('1234567890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhoneNumber('123')).toBe(false);
      expect(isValidPhoneNumber('')).toBe(false);
      expect(isValidPhoneNumber('abc')).toBe(false);
    });
  });

  describe('isValidCommentText', () => {
    it('should accept valid comment text', () => {
      expect(isValidCommentText('This is a comment')).toBe(true);
      expect(isValidCommentText('A'.repeat(1000))).toBe(true);
    });

    it('should reject invalid comment text', () => {
      expect(isValidCommentText('')).toBe(false);
      expect(isValidCommentText('   ')).toBe(false);
      expect(isValidCommentText('A'.repeat(1001))).toBe(false);
    });
  });
});

describe('File Validation', () => {
  describe('isValidMediaType', () => {
    it('should accept image files', () => {
      const imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(isValidMediaType(imageFile)).toBe(true);
    });

    it('should accept video files', () => {
      const videoFile = new File([''], 'test.mp4', { type: 'video/mp4' });
      expect(isValidMediaType(videoFile)).toBe(true);
    });

    it('should reject non-media files', () => {
      const textFile = new File([''], 'test.txt', { type: 'text/plain' });
      expect(isValidMediaType(textFile)).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    it('should accept files within size limit', () => {
      const smallFile = new File(['a'.repeat(1000)], 'test.jpg');
      expect(isValidFileSize(smallFile, 10000)).toBe(true);
    });

    it('should reject files exceeding size limit', () => {
      const largeFile = new File(['a'.repeat(20000)], 'test.jpg');
      expect(isValidFileSize(largeFile, 10000)).toBe(false);
    });
  });

  describe('isValidMediaFile', () => {
    it('should accept valid media files', () => {
      const validFile = new File(['a'.repeat(1000)], 'test.jpg', { type: 'image/jpeg' });
      expect(isValidMediaFile(validFile)).toBe(true);
    });

    it('should reject files with invalid type', () => {
      const invalidFile = new File(['a'.repeat(1000)], 'test.txt', { type: 'text/plain' });
      expect(isValidMediaFile(invalidFile)).toBe(false);
    });
  });

  describe('areValidMediaFiles', () => {
    it('should accept array of valid media files', () => {
      const files = [
        new File([''], 'test1.jpg', { type: 'image/jpeg' }),
        new File([''], 'test2.mp4', { type: 'video/mp4' }),
      ];
      expect(areValidMediaFiles(files)).toBe(true);
    });

    it('should reject array with invalid files', () => {
      const files = [
        new File([''], 'test1.jpg', { type: 'image/jpeg' }),
        new File([''], 'test2.txt', { type: 'text/plain' }),
      ];
      expect(areValidMediaFiles(files)).toBe(false);
    });

    it('should accept empty array', () => {
      expect(areValidMediaFiles([])).toBe(true);
    });
  });
});

describe('Report Input Validation', () => {
  describe('isValidReportInput', () => {
    it('should accept valid report input', () => {
      const input: CreateReportInput = {
        title: 'Test Report',
        description: 'Test description',
        crimeType: 'theft',
        location: { latitude: 45, longitude: 90 },
      };
      expect(isValidReportInput(input)).toBe(true);
    });

    it('should accept report with media files', () => {
      const input: CreateReportInput = {
        title: 'Test Report',
        description: 'Test description',
        crimeType: 'theft',
        location: { latitude: 45, longitude: 90 },
        mediaFiles: [new File([''], 'test.jpg', { type: 'image/jpeg' })],
      };
      expect(isValidReportInput(input)).toBe(true);
    });

    it('should reject report with empty title', () => {
      const input: CreateReportInput = {
        title: '',
        description: 'Test description',
        crimeType: 'theft',
        location: { latitude: 45, longitude: 90 },
      };
      expect(isValidReportInput(input)).toBe(false);
    });

    it('should reject report with invalid location', () => {
      const input: CreateReportInput = {
        title: 'Test Report',
        description: 'Test description',
        crimeType: 'theft',
        location: { latitude: 91, longitude: 90 },
      };
      expect(isValidReportInput(input)).toBe(false);
    });
  });
});

describe('Type Validation', () => {
  describe('isValidUserRole', () => {
    it('should accept valid user roles', () => {
      expect(isValidUserRole('citizen')).toBe(true);
      expect(isValidUserRole('moderator')).toBe(true);
      expect(isValidUserRole('admin')).toBe(true);
    });

    it('should reject invalid user roles', () => {
      expect(isValidUserRole('invalid')).toBe(false);
      expect(isValidUserRole('')).toBe(false);
    });
  });

  describe('isValidReportStatus', () => {
    it('should accept valid report statuses', () => {
      expect(isValidReportStatus('active')).toBe(true);
      expect(isValidReportStatus('flagged')).toBe(true);
      expect(isValidReportStatus('removed')).toBe(true);
    });

    it('should reject invalid report statuses', () => {
      expect(isValidReportStatus('invalid')).toBe(false);
      expect(isValidReportStatus('')).toBe(false);
    });
  });

  describe('isValidVoteType', () => {
    it('should accept valid vote types', () => {
      expect(isValidVoteType('up')).toBe(true);
      expect(isValidVoteType('down')).toBe(true);
    });

    it('should reject invalid vote types', () => {
      expect(isValidVoteType('invalid')).toBe(false);
      expect(isValidVoteType('')).toBe(false);
    });
  });
});

describe('Input Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should escape quotes', () => {
      expect(sanitizeInput('He said "hello"')).toBe('He said &quot;hello&quot;');
      expect(sanitizeInput("It's working")).toBe('It&#x27;s working');
    });

    it('should not modify safe text', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World');
    });
  });
});
