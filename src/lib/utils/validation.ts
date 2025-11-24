import { MIN_LATITUDE, MAX_LATITUDE, MIN_LONGITUDE, MAX_LONGITUDE } from './constants';

/**
 * Validates if a latitude value is within valid range (-90 to 90)
 */
export function isValidLatitude(lat: number): boolean {
  return typeof lat === 'number' && lat >= MIN_LATITUDE && lat <= MAX_LATITUDE;
}

/**
 * Validates if a longitude value is within valid range (-180 to 180)
 */
export function isValidLongitude(lng: number): boolean {
  return typeof lng === 'number' && lng >= MIN_LONGITUDE && lng <= MAX_LONGITUDE;
}

/**
 * Validates if coordinates are within valid ranges
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return isValidLatitude(lat) && isValidLongitude(lng);
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
export function isValidFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
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
