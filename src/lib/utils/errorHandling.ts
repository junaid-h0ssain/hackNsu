/**
 * Error handling utilities with retry logic and exponential backoff
 * Requirements: 9.2 - Visual feedback within 100ms, graceful error handling
 */

export type ErrorCategory = 
  | 'auth'
  | 'network'
  | 'validation'
  | 'permission'
  | 'storage'
  | 'ai'
  | 'unknown';

export interface AppError {
  message: string;
  category: ErrorCategory;
  code?: string;
  originalError?: unknown;
  retryable: boolean;
}

export const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/invalid-verification-code': 'Invalid verification code.',
  'auth/code-expired': 'Verification code expired. Please request a new one.',
  'permission-denied': 'You do not have permission to perform this action.',
  'not-found': 'The requested resource was not found.',
  'already-exists': 'This resource already exists.',
  'resource-exhausted': 'Too many requests. Please try again later.',
  'unavailable': 'Service temporarily unavailable. Please try again.',
  'storage/unauthorized': 'You do not have permission to upload files.',
  'storage/canceled': 'Upload was canceled.',
  'storage/unknown': 'An error occurred during upload.',
  'storage/object-not-found': 'File not found.',
  'storage/quota-exceeded': 'Storage quota exceeded.',
  'network-error': 'Network error. Please check your connection.',
  'timeout': 'Request timed out. Please try again.',
  'unknown': 'An unexpected error occurred. Please try again.',
};

export function parseError(error: unknown): AppError {
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as { code: string; message?: string };
    const code = firebaseError.code;
    
    let category: ErrorCategory = 'unknown';
    if (code.startsWith('auth/')) category = 'auth';
    else if (code.startsWith('storage/')) category = 'storage';
    else if (code === 'permission-denied') category = 'permission';
    else if (code === 'unavailable' || code === 'network-request-failed') category = 'network';
    
    const retryable = ['unavailable', 'resource-exhausted', 'network-request-failed', 'timeout']
      .some(c => code.includes(c));
    
    return {
      message: ERROR_MESSAGES[code] || firebaseError.message || ERROR_MESSAGES['unknown'],
      category,
      code,
      originalError: error,
      retryable,
    };
  }
  
  if (error instanceof Error) {
    const isNetworkError = error.message.toLowerCase().includes('network') ||
                          error.message.toLowerCase().includes('fetch');
    return {
      message: error.message || ERROR_MESSAGES['unknown'],
      category: isNetworkError ? 'network' : 'unknown',
      originalError: error,
      retryable: isNetworkError,
    };
  }
  
  if (typeof error === 'string') {
    return { message: error, category: 'unknown', originalError: error, retryable: false };
  }
  
  return { message: ERROR_MESSAGES['unknown'], category: 'unknown', originalError: error, retryable: false };
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

export function calculateBackoffDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  const delay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  const jitter = Math.random() * 0.1 * delay;
  return Math.min(delay + jitter, config.maxDelayMs);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>, config: Partial<RetryConfig> = {}): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const appError = parseError(error);
      
      if (!appError.retryable || attempt === fullConfig.maxAttempts) throw error;
      
      const delay = calculateBackoffDelay(attempt, fullConfig);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, appError.message);
      await sleep(delay);
    }
  }
  throw lastError;
}

export function logError(error: unknown, context?: string): void {
  const appError = parseError(error);
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}]${context ? ` [${context}]` : ''} Error:`, {
    message: appError.message,
    category: appError.category,
    code: appError.code,
    retryable: appError.retryable,
  });
}
