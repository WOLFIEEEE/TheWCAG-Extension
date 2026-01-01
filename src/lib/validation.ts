/**
 * Data validation schemas using Zod
 * 
 * Provides comprehensive validation for imported data and user inputs.
 */

import { z } from 'zod';

/**
 * Color blindness type enum
 */
export const ColorBlindnessTypeSchema = z.enum([
  'normal',
  'protanopia',
  'protanomaly',
  'deuteranopia',
  'deuteranomaly',
  'tritanopia',
  'tritanomaly',
  'achromatopsia',
  'achromatomaly'
]);

/**
 * Filter configuration schema
 */
export const FilterConfigSchema = z.object({
  type: ColorBlindnessTypeSchema,
  severity: z.number().min(0).max(100).default(100)
});

/**
 * User preferences schema
 */
export const ColorBlindPreferencesSchema = z.object({
  defaultFilter: ColorBlindnessTypeSchema.default('deuteranopia'),
  defaultSeverity: z.number().min(0).max(100).default(100),
  autoApplyOnLoad: z.boolean().default(false),
  showInfoToasts: z.boolean().default(true),
  darkMode: z.boolean().default(false),
  rememberPerSite: z.boolean().default(false)
});

/**
 * Filter history entry schema
 */
export const FilterHistoryEntrySchema = z.object({
  type: ColorBlindnessTypeSchema,
  severity: z.number().min(0).max(100),
  timestamp: z.number().positive(),
  url: z.string().url().optional()
});

/**
 * Per-site filter settings schema
 */
export const SiteFilterSettingsSchema = z.record(
  z.string().min(1), // hostname key
  FilterConfigSchema
);

/**
 * Complete storage data schema for import/export
 */
export const StorageDataSchema = z.object({
  preferences: ColorBlindPreferencesSchema.optional(),
  filterHistory: z.array(FilterHistoryEntrySchema).max(50).optional(),
  siteSettings: SiteFilterSettingsSchema.optional(),
  currentFilter: FilterConfigSchema.optional(),
  isEnabled: z.boolean().optional()
});

/**
 * Hostname validation schema
 */
export const HostnameSchema = z.string()
  .min(1)
  .max(253)
  .regex(
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    'Invalid hostname format'
  );

/**
 * Validate imported storage data
 * @param data - Raw data to validate
 * @returns Validated and normalized storage data
 * @throws Error if validation fails
 */
export function validateStorageData(data: unknown): z.infer<typeof StorageDataSchema> {
  const result = StorageDataSchema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.issues
      .map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    throw new Error(`Invalid data format: ${errors}`);
  }
  
  return result.data;
}

/**
 * Validate filter configuration
 * @param config - Raw filter config
 * @returns Validated filter config
 * @throws Error if validation fails
 */
export function validateFilterConfig(config: unknown): z.infer<typeof FilterConfigSchema> {
  const result = FilterConfigSchema.safeParse(config);
  
  if (!result.success) {
    throw new Error('Invalid filter configuration');
  }
  
  return result.data;
}

/**
 * Validate color blindness type
 * @param type - Type string to validate
 * @returns true if valid
 */
export function isValidColorBlindnessType(type: unknown): type is z.infer<typeof ColorBlindnessTypeSchema> {
  return ColorBlindnessTypeSchema.safeParse(type).success;
}

/**
 * Validate severity value
 * @param severity - Severity value to validate
 * @returns Normalized severity (0-100)
 */
export function validateSeverity(severity: unknown): number {
  if (typeof severity !== 'number' || isNaN(severity)) {
    return 100; // default
  }
  return Math.max(0, Math.min(100, Math.round(severity)));
}

/**
 * Validate hostname
 * @param hostname - Hostname to validate
 * @returns true if valid
 */
export function isValidHostname(hostname: unknown): hostname is string {
  return HostnameSchema.safeParse(hostname).success;
}

/**
 * Sanitize string input
 * @param input - String to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeString(input: unknown, maxLength: number = 255): string {
  if (typeof input !== 'string') {
    return '';
  }
  // Remove control characters and trim
  // Using character class with explicit ranges to satisfy linter
  let result = '';
  for (const char of input) {
    const code = char.charCodeAt(0);
    // Keep only printable ASCII characters (32-126) and extended characters
    if (code >= 32 && code !== 127) {
      result += char;
    }
  }
  return result.trim().slice(0, maxLength);
}

/**
 * Maximum file size for imports (1MB)
 */
export const MAX_IMPORT_FILE_SIZE = 1024 * 1024;

/**
 * Validate import file size
 * @param size - File size in bytes
 * @returns true if within limit
 */
export function isValidImportFileSize(size: number): boolean {
  return size > 0 && size <= MAX_IMPORT_FILE_SIZE;
}

// Type exports
export type ValidatedStorageData = z.infer<typeof StorageDataSchema>;
export type ValidatedFilterConfig = z.infer<typeof FilterConfigSchema>;
export type ValidatedPreferences = z.infer<typeof ColorBlindPreferencesSchema>;

