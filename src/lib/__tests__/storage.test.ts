/**
 * Storage Tests
 * 
 * Tests for Chrome storage operations and data management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the logger
vi.mock('../logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}));

// Mock the validation module
vi.mock('../validation', () => ({
  validateStorageData: vi.fn((data) => data),
  validateSeverity: vi.fn((severity) => Math.max(0, Math.min(100, severity ?? 100))),
  isValidColorBlindnessType: vi.fn((type) => 
    ['normal', 'protanopia', 'protanomaly', 'deuteranopia', 'deuteranomaly', 
     'tritanopia', 'tritanomaly', 'achromatopsia', 'achromatomaly'].includes(type)
  )
}));

// Create storage mock data
let mockStorage: Record<string, unknown> = {};

// Mock Chrome storage
const mockChromeStorage = {
  local: {
    get: vi.fn((key: string) => {
      return Promise.resolve({ [key]: mockStorage[key] });
    }),
    set: vi.fn((data: Record<string, unknown>) => {
      Object.assign(mockStorage, data);
      return Promise.resolve();
    }),
    remove: vi.fn((keys: string[]) => {
      keys.forEach(key => delete mockStorage[key]);
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      mockStorage = {};
      return Promise.resolve();
    })
  },
  onChanged: {
    addListener: vi.fn(),
    removeListener: vi.fn()
  }
};

// Set up chrome mock globally
vi.stubGlobal('chrome', { storage: mockChromeStorage });

// Import after mocking
import {
  getPreferences,
  updatePreferences,
  getCurrentFilter,
  setCurrentFilter,
  getIsEnabled,
  setIsEnabled,
  getFilterHistory,
  addToHistory,
  clearHistory,
  getSiteSettings,
  setSiteFilter,
  getSiteFilter,
  removeSiteFilter,
  exportData,
  importData,
  clearAllData,
  resetToDefaults
} from '../storage';

describe('Storage - Preferences', () => {
  beforeEach(() => {
    mockStorage = {};
    vi.clearAllMocks();
  });

  it('should return default preferences when none are stored', async () => {
    const prefs = await getPreferences();
    
    expect(prefs.defaultFilter).toBe('deuteranopia');
    expect(prefs.defaultSeverity).toBe(100);
    expect(prefs.autoApplyOnLoad).toBe(false);
  });

  it('should merge stored preferences with defaults', async () => {
    mockStorage['colorblind_preferences'] = { darkMode: true };
    
    const prefs = await getPreferences();
    
    expect(prefs.darkMode).toBe(true);
    expect(prefs.defaultFilter).toBe('deuteranopia'); // default
  });

  it('should update preferences', async () => {
    await updatePreferences({ darkMode: true, autoApplyOnLoad: true });
    
    expect(mockChromeStorage.local.set).toHaveBeenCalled();
    expect(mockStorage['colorblind_preferences']).toMatchObject({
      darkMode: true,
      autoApplyOnLoad: true
    });
  });

  it('should preserve existing preferences when updating', async () => {
    mockStorage['colorblind_preferences'] = { 
      defaultFilter: 'protanopia',
      showInfoToasts: false 
    };
    
    await updatePreferences({ darkMode: true });
    
    const stored = mockStorage['colorblind_preferences'] as Record<string, unknown>;
    expect(stored.defaultFilter).toBe('protanopia');
    expect(stored.showInfoToasts).toBe(false);
    expect(stored.darkMode).toBe(true);
  });
});

describe('Storage - Current Filter', () => {
  beforeEach(() => {
    mockStorage = {};
    vi.clearAllMocks();
  });

  it('should return default filter when none is stored', async () => {
    const filter = await getCurrentFilter();
    
    expect(filter.type).toBe('normal');
    expect(filter.severity).toBe(100);
  });

  it('should return stored filter', async () => {
    mockStorage['colorblind_current_filter'] = { type: 'protanopia', severity: 80 };
    
    const filter = await getCurrentFilter();
    
    expect(filter.type).toBe('protanopia');
    expect(filter.severity).toBe(80);
  });

  it('should save current filter', async () => {
    await setCurrentFilter({ type: 'deuteranopia', severity: 75 });
    
    expect(mockStorage['colorblind_current_filter']).toEqual({
      type: 'deuteranopia',
      severity: 75
    });
  });
});

describe('Storage - Enabled State', () => {
  beforeEach(() => {
    mockStorage = {};
    vi.clearAllMocks();
  });

  it('should return false when no state is stored', async () => {
    const isEnabled = await getIsEnabled();
    
    expect(isEnabled).toBe(false);
  });

  it('should return stored enabled state', async () => {
    mockStorage['colorblind_is_enabled'] = true;
    
    const isEnabled = await getIsEnabled();
    
    expect(isEnabled).toBe(true);
  });

  it('should save enabled state', async () => {
    await setIsEnabled(true);
    
    expect(mockStorage['colorblind_is_enabled']).toBe(true);
  });
});

describe('Storage - Filter History', () => {
  beforeEach(() => {
    mockStorage = {};
    vi.clearAllMocks();
  });

  it('should return empty array when no history exists', async () => {
    const history = await getFilterHistory();
    
    expect(history).toEqual([]);
  });

  it('should return stored history', async () => {
    const historyData = [
      { type: 'protanopia', severity: 100, timestamp: Date.now() }
    ];
    mockStorage['colorblind_history'] = historyData;
    
    const history = await getFilterHistory();
    
    expect(history).toEqual(historyData);
  });

  it('should add to history', async () => {
    await addToHistory('protanopia', 100, 'https://example.com');
    
    const stored = mockStorage['colorblind_history'] as Array<unknown>;
    expect(stored).toBeDefined();
    expect(stored.length).toBe(1);
  });

  it('should remove duplicates when adding to history', async () => {
    mockStorage['colorblind_history'] = [
      { type: 'protanopia', severity: 100, timestamp: Date.now() - 1000 }
    ];
    
    await addToHistory('protanopia', 100, 'https://example.com');
    
    const stored = mockStorage['colorblind_history'] as Array<unknown>;
    expect(stored.length).toBe(1);
  });

  it('should limit history to 50 items', async () => {
    const largeHistory = Array.from({ length: 60 }, (_, i) => ({
      type: 'deuteranopia',
      severity: 50 + i,
      timestamp: Date.now() - i * 1000
    }));
    mockStorage['colorblind_history'] = largeHistory;
    
    await addToHistory('protanopia', 100);
    
    const stored = mockStorage['colorblind_history'] as Array<unknown>;
    expect(stored.length).toBeLessThanOrEqual(50);
  });

  it('should clear history', async () => {
    mockStorage['colorblind_history'] = [
      { type: 'protanopia', severity: 100, timestamp: Date.now() }
    ];
    
    await clearHistory();
    
    expect(mockStorage['colorblind_history']).toEqual([]);
  });
});

describe('Storage - Site Settings', () => {
  beforeEach(() => {
    mockStorage = {};
    vi.clearAllMocks();
  });

  it('should return empty object when no settings exist', async () => {
    const settings = await getSiteSettings();
    
    expect(settings).toEqual({});
  });

  it('should return stored site settings', async () => {
    mockStorage['colorblind_site_settings'] = {
      'example.com': { type: 'protanopia', severity: 100 }
    };
    
    const settings = await getSiteSettings();
    
    expect(settings['example.com']).toEqual({ type: 'protanopia', severity: 100 });
  });

  it('should set site filter', async () => {
    await setSiteFilter('example.com', { type: 'deuteranopia', severity: 80 });
    
    const stored = mockStorage['colorblind_site_settings'] as Record<string, unknown>;
    expect(stored['example.com']).toEqual({ type: 'deuteranopia', severity: 80 });
  });

  it('should get site filter', async () => {
    mockStorage['colorblind_site_settings'] = {
      'example.com': { type: 'tritanopia', severity: 50 }
    };
    
    const filter = await getSiteFilter('example.com');
    
    expect(filter).toEqual({ type: 'tritanopia', severity: 50 });
  });

  it('should return null for non-existent site', async () => {
    const filter = await getSiteFilter('nonexistent.com');
    
    expect(filter).toBeNull();
  });

  it('should remove site filter', async () => {
    mockStorage['colorblind_site_settings'] = {
      'example.com': { type: 'protanopia', severity: 100 },
      'other.com': { type: 'deuteranopia', severity: 80 }
    };
    
    await removeSiteFilter('example.com');
    
    const stored = mockStorage['colorblind_site_settings'] as Record<string, unknown>;
    expect(stored['example.com']).toBeUndefined();
    expect(stored['other.com']).toBeDefined();
  });
});

describe('Storage - Export/Import', () => {
  beforeEach(() => {
    mockStorage = {};
    vi.clearAllMocks();
  });

  it('should export all data', async () => {
    mockStorage = {
      colorblind_preferences: { darkMode: true },
      colorblind_history: [{ type: 'protanopia', severity: 100, timestamp: Date.now() }],
      colorblind_current_filter: { type: 'deuteranopia', severity: 80 },
      colorblind_is_enabled: true,
      colorblind_site_settings: { 'example.com': { type: 'tritanopia', severity: 50 } }
    };
    
    const exported = await exportData();
    
    expect(exported).toHaveProperty('preferences');
    expect(exported).toHaveProperty('filterHistory');
    expect(exported).toHaveProperty('currentFilter');
    expect(exported).toHaveProperty('isEnabled');
    expect(exported).toHaveProperty('siteSettings');
  });

  it('should import data', async () => {
    const importedData = {
      preferences: { darkMode: true },
      currentFilter: { type: 'protanopia', severity: 100 },
      isEnabled: true
    };
    
    await importData(importedData);
    
    expect(mockChromeStorage.local.set).toHaveBeenCalled();
  });

  it('should handle partial imports', async () => {
    await importData({ preferences: { darkMode: true } });
    
    expect(mockChromeStorage.local.set).toHaveBeenCalled();
  });
});

describe('Storage - Clear and Reset', () => {
  beforeEach(() => {
    mockStorage = {
      colorblind_preferences: { darkMode: true },
      colorblind_history: [{ type: 'protanopia', severity: 100, timestamp: Date.now() }],
      colorblind_current_filter: { type: 'deuteranopia', severity: 80 },
      colorblind_is_enabled: true
    };
    vi.clearAllMocks();
  });

  it('should clear all data', async () => {
    await clearAllData();
    
    expect(mockChromeStorage.local.remove).toHaveBeenCalled();
  });

  it('should reset to defaults', async () => {
    await resetToDefaults();
    
    expect(mockChromeStorage.local.set).toHaveBeenCalled();
    const setCall = mockChromeStorage.local.set.mock.calls[0][0];
    expect(setCall['colorblind_is_enabled']).toBe(false);
  });
});

describe('Storage - Error Handling', () => {
  beforeEach(() => {
    mockStorage = {};
    vi.clearAllMocks();
  });

  it('should handle storage get error gracefully', async () => {
    mockChromeStorage.local.get.mockRejectedValueOnce(new Error('Storage error'));
    
    const prefs = await getPreferences();
    
    // Should return defaults on error
    expect(prefs.defaultFilter).toBe('deuteranopia');
  });

  it('should throw on storage set error', async () => {
    mockChromeStorage.local.set.mockRejectedValueOnce(new Error('Storage error'));
    
    await expect(updatePreferences({ darkMode: true })).rejects.toThrow();
  });

  it('should handle get enabled state error', async () => {
    mockChromeStorage.local.get.mockRejectedValueOnce(new Error('Storage error'));
    
    const isEnabled = await getIsEnabled();
    
    expect(isEnabled).toBe(false);
  });

  it('should handle get filter history error', async () => {
    mockChromeStorage.local.get.mockRejectedValueOnce(new Error('Storage error'));
    
    const history = await getFilterHistory();
    
    expect(history).toEqual([]);
  });
});

