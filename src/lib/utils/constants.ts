// File size limits
export const MAX_MEDIA_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

// Pagination
export const REPORTS_PER_PAGE = 20;

// AI API limits
export const MAX_AI_REQUESTS_PER_MINUTE = 15;

// Performance targets
export const TARGET_PAGE_LOAD_TIME_MS = 2000;
export const TARGET_REALTIME_UPDATE_LATENCY_MS = 1000;

// Map settings
export const DEFAULT_MAP_CENTER = { lat: 23.8103, lng: 90.4125 }; // Dhaka, Bangladesh
export const DEFAULT_MAP_ZOOM = 13;
export const MARKER_CLUSTERING_THRESHOLD = 50;

// Coordinate validation
export const MIN_LATITUDE = -90;
export const MAX_LATITUDE = 90;
export const MIN_LONGITUDE = -180;
export const MAX_LONGITUDE = 180;

// User roles
export const USER_ROLES = {
  CITIZEN: 'citizen',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const;

// Report status
export const REPORT_STATUS = {
  ACTIVE: 'active',
  FLAGGED: 'flagged',
  REMOVED: 'removed',
} as const;

// Vote types
export const VOTE_TYPES = {
  UP: 'up',
  DOWN: 'down',
} as const;

// Crime severity levels
export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

// Moderation actions
export const MODERATION_ACTIONS = {
  FLAG: 'flag',
  REMOVE: 'remove',
  SUSPEND: 'suspend',
  RESTORE: 'restore',
} as const;

// Target types for moderation
export const MODERATION_TARGET_TYPES = {
  REPORT: 'report',
  COMMENT: 'comment',
  USER: 'user',
} as const;
