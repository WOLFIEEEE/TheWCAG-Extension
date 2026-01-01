/**
 * Custom error classes and error handling utilities
 */

/**
 * Base extension error class
 */
export class ExtensionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly userMessage: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = 'ExtensionError';
  }
}

/**
 * Error codes for different error types
 */
export const ErrorCodes = {
  // Content script errors
  CONTENT_SCRIPT_NOT_READY: 'CONTENT_SCRIPT_NOT_READY',
  FILTER_APPLICATION_FAILED: 'FILTER_APPLICATION_FAILED',
  DOM_MANIPULATION_FAILED: 'DOM_MANIPULATION_FAILED',
  
  // Storage errors
  STORAGE_READ_FAILED: 'STORAGE_READ_FAILED',
  STORAGE_WRITE_FAILED: 'STORAGE_WRITE_FAILED',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  
  // Import/Export errors
  IMPORT_INVALID_FORMAT: 'IMPORT_INVALID_FORMAT',
  IMPORT_FILE_TOO_LARGE: 'IMPORT_FILE_TOO_LARGE',
  EXPORT_FAILED: 'EXPORT_FAILED',
  
  // Communication errors
  MESSAGE_SEND_FAILED: 'MESSAGE_SEND_FAILED',
  TAB_NOT_FOUND: 'TAB_NOT_FOUND',
  
  // Restricted page errors
  RESTRICTED_PAGE: 'RESTRICTED_PAGE',
  EXTENSION_PAGE: 'EXTENSION_PAGE',
  
  // Validation errors
  INVALID_FILTER_TYPE: 'INVALID_FILTER_TYPE',
  INVALID_SEVERITY: 'INVALID_SEVERITY',
  
  // Unknown
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * User-friendly error messages
 */
export const UserMessages: Record<ErrorCode, string> = {
  [ErrorCodes.CONTENT_SCRIPT_NOT_READY]: 'Please reload the page and try again.',
  [ErrorCodes.FILTER_APPLICATION_FAILED]: 'Unable to apply the filter. Try reloading the page.',
  [ErrorCodes.DOM_MANIPULATION_FAILED]: 'Unable to modify the page. The page may be protected.',
  [ErrorCodes.STORAGE_READ_FAILED]: 'Unable to load your settings. Using defaults.',
  [ErrorCodes.STORAGE_WRITE_FAILED]: 'Unable to save your settings. Please try again.',
  [ErrorCodes.STORAGE_QUOTA_EXCEEDED]: 'Storage is full. Please clear some history.',
  [ErrorCodes.IMPORT_INVALID_FORMAT]: 'The file format is invalid. Please use a valid JSON file.',
  [ErrorCodes.IMPORT_FILE_TOO_LARGE]: 'The file is too large. Maximum size is 1MB.',
  [ErrorCodes.EXPORT_FAILED]: 'Unable to export data. Please try again.',
  [ErrorCodes.MESSAGE_SEND_FAILED]: 'Unable to communicate with the page. Try reloading.',
  [ErrorCodes.TAB_NOT_FOUND]: 'No active tab found. Please click on a webpage first.',
  [ErrorCodes.RESTRICTED_PAGE]: 'This extension cannot run on this page.',
  [ErrorCodes.EXTENSION_PAGE]: 'This extension cannot run on extension pages.',
  [ErrorCodes.INVALID_FILTER_TYPE]: 'Invalid filter type selected.',
  [ErrorCodes.INVALID_SEVERITY]: 'Invalid severity value.',
  [ErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
};

/**
 * Create an ExtensionError with user-friendly message
 */
export function createError(
  code: ErrorCode,
  technicalMessage?: string,
  recoverable: boolean = true
): ExtensionError {
  const userMessage = UserMessages[code];
  const message = technicalMessage || userMessage;
  return new ExtensionError(message, code, userMessage, recoverable);
}

/**
 * Check if a URL is a restricted page
 */
export function isRestrictedPage(url: string): { restricted: boolean; reason?: ErrorCode } {
  if (!url) {
    return { restricted: false };
  }
  
  // Chrome internal pages
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return { restricted: true, reason: ErrorCodes.EXTENSION_PAGE };
  }
  
  // Edge internal pages
  if (url.startsWith('edge://')) {
    return { restricted: true, reason: ErrorCodes.RESTRICTED_PAGE };
  }
  
  // Firefox internal pages
  if (url.startsWith('about:') || url.startsWith('moz-extension://')) {
    return { restricted: true, reason: ErrorCodes.RESTRICTED_PAGE };
  }
  
  // Web store pages
  if (
    url.includes('chrome.google.com/webstore') ||
    url.includes('microsoftedge.microsoft.com/addons') ||
    url.includes('addons.mozilla.org')
  ) {
    return { restricted: true, reason: ErrorCodes.RESTRICTED_PAGE };
  }
  
  // View source pages
  if (url.startsWith('view-source:')) {
    return { restricted: true, reason: ErrorCodes.RESTRICTED_PAGE };
  }
  
  return { restricted: false };
}

/**
 * Get user-friendly message for an error
 */
export function getUserMessage(error: unknown): string {
  if (error instanceof ExtensionError) {
    return error.userMessage;
  }
  
  if (error instanceof Error) {
    // Check for known error patterns
    if (error.message.includes('Extension context invalidated')) {
      return UserMessages[ErrorCodes.CONTENT_SCRIPT_NOT_READY];
    }
    if (error.message.includes('Could not establish connection')) {
      return UserMessages[ErrorCodes.MESSAGE_SEND_FAILED];
    }
    if (error.message.includes('QUOTA_BYTES')) {
      return UserMessages[ErrorCodes.STORAGE_QUOTA_EXCEEDED];
    }
  }
  
  return UserMessages[ErrorCodes.UNKNOWN_ERROR];
}

/**
 * Check if an error is recoverable
 */
export function isRecoverable(error: unknown): boolean {
  if (error instanceof ExtensionError) {
    return error.recoverable;
  }
  return true;
}

