import { MIN_LATITUDE, MAX_LATITUDE, MIN_LONGITUDE, MAX_LONGITUDE, MAX_MEDIA_FILE_SIZE } from './constants';
import type { Location, CreateReportInput, UserRole, ReportStatus, VoteType } from '$lib/types';

/**
 * Validates if a latitude value is within valid range (-90 to 90)
 */
export function isValidLatitude(lat: number): boolean {
  return typeof lat === 'number' && !isNaN(lat) && lat >= MIN_LATITUDE && lat <= MAX_LATITUDE;
}

/**
 * Validates if a longitude value is within valid range (-180 to 180)
 */
export function isValidLongitude(lng: number): boolean {
  return typeof lng === 'number' && !isNaN(lng) && lng >= MIN_LONGITUDE && lng <= MAX_LONGITUDE;
}

/**
 * Validates if coordinates are within valid ranges
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return isValidLatitude(lat) && isValidLongitude(lng);
}

/**
 * Validates a Location object
 */
export function isValidLocation(location: Location): boolean {
  if (!location || typeof location !== 'object') {
    return false;
  }
  
  if (!isValidCoordinates(location.latitude, location.longitude)) {
    return false;
  }
  
  // Address is optional, but if provided must be a non-empty string
  if (location.address !== undefined && !isNonEmptyString(location.address)) {
    return false;
  }
  
  return true;
}

/**
 * Validates if a string is not empty or only whitespace
 */
export function isNonEmptyString(str: string): boolean {
  return typeof str === 'string' && str.trim().length > 0;
}

/**
 * Validates if a file is an image or video
 */
export function isValidMediaType(file: File): boolean {
  return file.type.startsWith('image/') || file.type.startsWith('video/');
}

/**
 * Validates if a file size is within the limit
 */
export function isValidFileSize(file: File, maxSize: number = MAX_MEDIA_FILE_SIZE): boolean {
  return file.size <= maxSize;
}

/**
 * Validates if a media file meets all requirements (type and size)
 */
export function isValidMediaFile(file: File): boolean {
  return isValidMediaType(file) && isValidFileSize(file);
}

/**
 * Validates an array of media files
 */
export function areValidMediaFiles(files: File[]): boolean {
  if (!Array.isArray(files)) {
    return false;
  }
  return files.every(file => isValidMediaFile(file));
}

/**
 * Validates CreateReportInput data
 */
export function isValidReportInput(input: CreateReportInput): boolean {
  if (!input || typeof input !== 'object') {
    return false;
  }
  
  // Title must be non-empty
  if (!isNonEmptyString(input.title)) {
    return false;
  }
  
  // Description must be non-empty
  if (!isNonEmptyString(input.description)) {
    return false;
  }
  
  // Crime type must be non-empty
  if (!isNonEmptyString(input.crimeType)) {
    return false;
  }
  
  // Location must be valid
  if (!isValidLocation(input.location)) {
    return false;
  }
  
  // Media files are optional, but if provided must be valid
  if (input.mediaFiles !== undefined) {
    if (!Array.isArray(input.mediaFiles)) {
      return false;
    }
    if (!areValidMediaFiles(input.mediaFiles)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates if a user role is valid
 */
export function isValidUserRole(role: string): role is UserRole {
  return role === 'citizen' || role === 'moderator' || role === 'admin';
}

/**
 * Validates if a report status is valid
 */
export function isValidReportStatus(status: string): status is ReportStatus {
  return status === 'active' || status === 'flagged' || status === 'removed';
}

/**
 * Validates if a vote type is valid
 */
export function isValidVoteType(voteType: string): voteType is VoteType {
  return voteType === 'up' || voteType === 'down';
}

/**
 * Validates if an email address is valid
 */
export function isValidEmail(email: string): boolean {
  if (!isNonEmptyString(email)) {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates if a phone number is valid (basic validation)
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!isNonEmptyString(phone)) {
    return false;
  }
  // Basic validation: starts with + and contains only digits and spaces
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Validates if a comment text is valid
 */
export function isValidCommentText(text: string): boolean {
  return isNonEmptyString(text) && text.trim().length <= 1000;
}

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
