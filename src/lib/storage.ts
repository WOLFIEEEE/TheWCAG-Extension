/**
 * Storage utilities for Color Blindness Simulator
 */

import type { ColorBlindnessType, FilterConfig } from './colorblind-filters';
import { createLogger } from './logger';
import { validateStorageData, validateSeverity, isValidColorBlindnessType } from './validation';

const logger = createLogger('Storage');

// Preferences interface
export interface ColorBlindPreferences {
  defaultFilter: ColorBlindnessType;
  defaultSeverity: number;
  autoApplyOnLoad: boolean;
  showInfoToasts: boolean;
  darkMode: boolean;
  rememberPerSite: boolean;
}

// Filter history entry
export interface FilterHistoryEntry {
  type: ColorBlindnessType;
  severity: number;
  timestamp: number;
  url?: string;
}

// Per-site filter settings
export interface SiteFilterSettings {
  [hostname: string]: FilterConfig;
}

// Active filter state per tab
export interface TabFilterState {
  isEnabled: boolean;
  config: FilterConfig;
}

// Complete storage data structure
export interface StorageData {
  preferences: ColorBlindPreferences;
  filterHistory: FilterHistoryEntry[];
  siteSettings: SiteFilterSettings;
  currentFilter: FilterConfig;
  isEnabled: boolean;
}

// Default preferences
const DEFAULT_PREFERENCES: ColorBlindPreferences = {
  defaultFilter: 'deuteranopia',
  defaultSeverity: 100,
  autoApplyOnLoad: false,
  showInfoToasts: true,
  darkMode: false,
  rememberPerSite: false
};

// Default filter config
const DEFAULT_FILTER_CONFIG: FilterConfig = {
  type: 'normal',
  severity: 100
};

// Storage keys
const STORAGE_KEYS = {
  PREFERENCES: 'colorblind_preferences',
  HISTORY: 'colorblind_history',
  SITE_SETTINGS: 'colorblind_site_settings',
  CURRENT_FILTER: 'colorblind_current_filter',
  IS_ENABLED: 'colorblind_is_enabled'
} as const;

const MAX_HISTORY_ITEMS = 50;

/**
 * Get user preferences
 */
export async function getPreferences(): Promise<ColorBlindPreferences> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.PREFERENCES);
    return { ...DEFAULT_PREFERENCES, ...result[STORAGE_KEYS.PREFERENCES] };
  } catch (error) {
    logger.error('Error getting preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Update user preferences
 */
export async function updatePreferences(
  updates: Partial<ColorBlindPreferences>
): Promise<void> {
  try {
    const current = await getPreferences();
    const updated = { ...current, ...updates };
    await chrome.storage.local.set({ [STORAGE_KEYS.PREFERENCES]: updated });
  } catch (error) {
    logger.error('Error updating preferences:', error);
    throw error;
  }
}

/**
 * Get current filter configuration
 */
export async function getCurrentFilter(): Promise<FilterConfig> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CURRENT_FILTER);
    return result[STORAGE_KEYS.CURRENT_FILTER] || DEFAULT_FILTER_CONFIG;
  } catch (error) {
    logger.error('Error getting current filter:', error);
    return DEFAULT_FILTER_CONFIG;
  }
}

/**
 * Set current filter configuration
 */
export async function setCurrentFilter(config: FilterConfig): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.CURRENT_FILTER]: config });
  } catch (error) {
    logger.error('Error setting current filter:', error);
    throw error;
  }
}

/**
 * Get filter enabled state
 */
export async function getIsEnabled(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.IS_ENABLED);
    return result[STORAGE_KEYS.IS_ENABLED] ?? false;
  } catch (error) {
    logger.error('Error getting enabled state:', error);
    return false;
  }
}

/**
 * Set filter enabled state
 */
export async function setIsEnabled(enabled: boolean): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.IS_ENABLED]: enabled });
  } catch (error) {
    logger.error('Error setting enabled state:', error);
    throw error;
  }
}

/**
 * Get filter history
 */
export async function getFilterHistory(): Promise<FilterHistoryEntry[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY);
    return result[STORAGE_KEYS.HISTORY] || [];
  } catch (error) {
    logger.error('Error getting filter history:', error);
    return [];
  }
}

/**
 * Add entry to filter history
 */
export async function addToHistory(
  type: ColorBlindnessType,
  severity: number,
  url?: string
): Promise<void> {
  try {
    const history = await getFilterHistory();
    
    const entry: FilterHistoryEntry = {
      type,
      severity,
      timestamp: Date.now(),
      url
    };
    
    // Remove duplicate if exists
    const filtered = history.filter(
      h => !(h.type === type && h.severity === severity)
    );
    
    // Add to beginning
    filtered.unshift(entry);
    
    // Limit history size
    const trimmed = filtered.slice(0, MAX_HISTORY_ITEMS);
    
    await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: trimmed });
  } catch (error) {
    logger.error('Error adding to history:', error);
  }
}

/**
 * Clear filter history
 */
export async function clearHistory(): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: [] });
  } catch (error) {
    logger.error('Error clearing history:', error);
    throw error;
  }
}

/**
 * Get site-specific filter settings
 */
export async function getSiteSettings(): Promise<SiteFilterSettings> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SITE_SETTINGS);
    return result[STORAGE_KEYS.SITE_SETTINGS] || {};
  } catch (error) {
    logger.error('Error getting site settings:', error);
    return {};
  }
}

/**
 * Set filter for a specific site
 */
export async function setSiteFilter(
  hostname: string,
  config: FilterConfig
): Promise<void> {
  try {
    const settings = await getSiteSettings();
    settings[hostname] = config;
    await chrome.storage.local.set({ [STORAGE_KEYS.SITE_SETTINGS]: settings });
  } catch (error) {
    logger.error('Error setting site filter:', error);
    throw error;
  }
}

/**
 * Get filter for a specific site
 */
export async function getSiteFilter(
  hostname: string
): Promise<FilterConfig | null> {
  try {
    const settings = await getSiteSettings();
    return settings[hostname] || null;
  } catch (error) {
    logger.error('Error getting site filter:', error);
    return null;
  }
}

/**
 * Remove filter for a specific site
 */
export async function removeSiteFilter(hostname: string): Promise<void> {
  try {
    const settings = await getSiteSettings();
    delete settings[hostname];
    await chrome.storage.local.set({ [STORAGE_KEYS.SITE_SETTINGS]: settings });
  } catch (error) {
    logger.error('Error removing site filter:', error);
    throw error;
  }
}

/**
 * Export all data
 */
export async function exportData(): Promise<StorageData> {
  try {
    const [preferences, filterHistory, siteSettings, currentFilter, isEnabled] =
      await Promise.all([
        getPreferences(),
        getFilterHistory(),
        getSiteSettings(),
        getCurrentFilter(),
        getIsEnabled()
      ]);
    
    return {
      preferences,
      filterHistory,
      siteSettings,
      currentFilter,
      isEnabled
    };
  } catch (error) {
    logger.error('Error exporting data:', error);
    throw error;
  }
}

/**
 * Import data with validation
 * @param rawData - Raw data to import (will be validated)
 * @throws Error if data is invalid
 */
export async function importData(rawData: unknown): Promise<void> {
  try {
    // Validate imported data
    const data = validateStorageData(rawData);
    
    const updates: Record<string, unknown> = {};
    
    if (data.preferences) {
      // Validate and merge with defaults
      const validatedPrefs = {
        ...DEFAULT_PREFERENCES,
        defaultFilter: isValidColorBlindnessType(data.preferences.defaultFilter) 
          ? data.preferences.defaultFilter 
          : DEFAULT_PREFERENCES.defaultFilter,
        defaultSeverity: validateSeverity(data.preferences.defaultSeverity),
        autoApplyOnLoad: Boolean(data.preferences.autoApplyOnLoad),
        showInfoToasts: data.preferences.showInfoToasts !== false,
        darkMode: Boolean(data.preferences.darkMode),
        rememberPerSite: Boolean(data.preferences.rememberPerSite)
      };
      updates[STORAGE_KEYS.PREFERENCES] = validatedPrefs;
    }
    
    if (data.filterHistory) {
      // Filter valid history entries and limit size
      const validHistory = data.filterHistory
        .filter(entry => 
          isValidColorBlindnessType(entry.type) &&
          typeof entry.severity === 'number' &&
          typeof entry.timestamp === 'number'
        )
        .slice(0, MAX_HISTORY_ITEMS);
      updates[STORAGE_KEYS.HISTORY] = validHistory;
    }
    
    if (data.siteSettings) {
      // Validate site settings
      const validSiteSettings: SiteFilterSettings = {};
      for (const [hostname, config] of Object.entries(data.siteSettings)) {
        if (
          typeof hostname === 'string' && 
          hostname.length > 0 &&
          isValidColorBlindnessType(config.type)
        ) {
          validSiteSettings[hostname] = {
            type: config.type,
            severity: validateSeverity(config.severity)
          };
        }
      }
      updates[STORAGE_KEYS.SITE_SETTINGS] = validSiteSettings;
    }
    
    if (data.currentFilter && isValidColorBlindnessType(data.currentFilter.type)) {
      updates[STORAGE_KEYS.CURRENT_FILTER] = {
        type: data.currentFilter.type,
        severity: validateSeverity(data.currentFilter.severity)
      };
    }
    
    if (typeof data.isEnabled === 'boolean') {
      updates[STORAGE_KEYS.IS_ENABLED] = data.isEnabled;
    }
    
    await chrome.storage.local.set(updates);
  } catch (error) {
    logger.error('Error importing data:', error);
    throw error;
  }
}

/**
 * Clear all data
 */
export async function clearAllData(): Promise<void> {
  try {
    await chrome.storage.local.remove([
      STORAGE_KEYS.PREFERENCES,
      STORAGE_KEYS.HISTORY,
      STORAGE_KEYS.SITE_SETTINGS,
      STORAGE_KEYS.CURRENT_FILTER,
      STORAGE_KEYS.IS_ENABLED
    ]);
  } catch (error) {
    logger.error('Error clearing all data:', error);
    throw error;
  }
}

/**
 * Reset to defaults
 */
export async function resetToDefaults(): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.PREFERENCES]: DEFAULT_PREFERENCES,
      [STORAGE_KEYS.CURRENT_FILTER]: DEFAULT_FILTER_CONFIG,
      [STORAGE_KEYS.IS_ENABLED]: false
    });
  } catch (error) {
    logger.error('Error resetting to defaults:', error);
    throw error;
  }
}

// Listen for storage changes
export function onStorageChange(
  callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === 'local') {
      callback(changes);
    }
  };
  
  chrome.storage.onChanged.addListener(listener);
  
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}
