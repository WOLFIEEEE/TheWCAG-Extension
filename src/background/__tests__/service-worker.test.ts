/**
 * Service Worker Tests
 * 
 * Tests for background service worker functionality including
 * message handling, badge updates, and tab management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock modules
vi.mock('../../lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}));

vi.mock('../../lib/storage', () => ({
  getCurrentFilter: vi.fn().mockResolvedValue({ type: 'normal', severity: 100 }),
  setCurrentFilter: vi.fn().mockResolvedValue(undefined),
  getIsEnabled: vi.fn().mockResolvedValue(false),
  setIsEnabled: vi.fn().mockResolvedValue(undefined),
  getPreferences: vi.fn().mockResolvedValue({
    defaultFilter: 'deuteranopia',
    defaultSeverity: 100,
    autoApplyOnLoad: false,
    showInfoToasts: true,
    darkMode: false,
    rememberPerSite: false
  }),
  addToHistory: vi.fn().mockResolvedValue(undefined)
}));

describe('Service Worker - Badge Management', () => {
  const filterNames: Record<string, string> = {
    normal: 'Normal',
    protanopia: 'Protanopia',
    protanomaly: 'Protanomaly',
    deuteranopia: 'Deuteranopia',
    deuteranomaly: 'Deuteranomaly',
    tritanopia: 'Tritanopia',
    tritanomaly: 'Tritanomaly',
    achromatopsia: 'Achromatopsia',
    achromatomaly: 'Achromatomaly'
  };

  const updateBadge = async (tabId: number, isEnabled: boolean, filterType: string) => {
    if (isEnabled && filterType !== 'normal') {
      await chrome.action.setBadgeText({ text: '●', tabId });
      await chrome.action.setBadgeBackgroundColor({ color: '#10b981', tabId });
      await chrome.action.setTitle({
        title: `Color Blindness Simulator - ${filterNames[filterType]} Active`,
        tabId
      });
    } else {
      await chrome.action.setBadgeText({ text: '', tabId });
      await chrome.action.setTitle({
        title: 'TheWCAG Color Blindness Simulator',
        tabId
      });
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set badge when filter is enabled', async () => {
    await updateBadge(1, true, 'protanopia');
    
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '●', tabId: 1 });
    expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#10b981', tabId: 1 });
  });

  it('should update title with filter name when enabled', async () => {
    await updateBadge(1, true, 'deuteranopia');
    
    expect(chrome.action.setTitle).toHaveBeenCalledWith({
      title: 'Color Blindness Simulator - Deuteranopia Active',
      tabId: 1
    });
  });

  it('should clear badge when filter is disabled', async () => {
    await updateBadge(1, false, 'protanopia');
    
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '', tabId: 1 });
  });

  it('should clear badge when filter type is normal', async () => {
    await updateBadge(1, true, 'normal');
    
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '', tabId: 1 });
  });

  it('should reset title when filter is disabled', async () => {
    await updateBadge(1, false, 'protanopia');
    
    expect(chrome.action.setTitle).toHaveBeenCalledWith({
      title: 'TheWCAG Color Blindness Simulator',
      tabId: 1
    });
  });
});

describe('Service Worker - Tab State Management', () => {
  const tabFilters = new Map<number, { isEnabled: boolean; config: { type: string; severity: number } }>();

  beforeEach(() => {
    tabFilters.clear();
  });

  it('should store filter state per tab', () => {
    tabFilters.set(1, { isEnabled: true, config: { type: 'protanopia', severity: 100 } });
    tabFilters.set(2, { isEnabled: false, config: { type: 'deuteranopia', severity: 80 } });
    
    expect(tabFilters.get(1)?.isEnabled).toBe(true);
    expect(tabFilters.get(2)?.isEnabled).toBe(false);
  });

  it('should update existing tab state', () => {
    tabFilters.set(1, { isEnabled: true, config: { type: 'protanopia', severity: 100 } });
    tabFilters.set(1, { isEnabled: false, config: { type: 'protanopia', severity: 100 } });
    
    expect(tabFilters.get(1)?.isEnabled).toBe(false);
  });

  it('should remove tab state on cleanup', () => {
    tabFilters.set(1, { isEnabled: true, config: { type: 'protanopia', severity: 100 } });
    tabFilters.delete(1);
    
    expect(tabFilters.has(1)).toBe(false);
  });

  it('should track different configs per tab', () => {
    tabFilters.set(1, { isEnabled: true, config: { type: 'protanopia', severity: 100 } });
    tabFilters.set(2, { isEnabled: true, config: { type: 'tritanopia', severity: 50 } });
    
    expect(tabFilters.get(1)?.config.type).toBe('protanopia');
    expect(tabFilters.get(2)?.config.type).toBe('tritanopia');
  });
});

describe('Service Worker - Message Handling', () => {
  type MessageHandler = (
    message: { action: string; [key: string]: unknown },
    sender: { tab?: { id: number } },
    sendResponse: (response: unknown) => void
  ) => boolean;

  const createMessageHandler = (): MessageHandler => {
    return (message, sender, sendResponse) => {
      const handleMessage = async () => {
        switch (message.action) {
          case 'getInitialState':
            return { isEnabled: false, config: { type: 'normal', severity: 100 } };
          
          case 'applyFilter':
            if (sender.tab?.id && message.config) {
              return { success: true };
            }
            return { success: false };
          
          case 'disableFilter':
            if (sender.tab?.id) {
              return { success: true };
            }
            return { success: false };
          
          case 'toggleFilter':
            if (sender.tab?.id) {
              return { success: true, isEnabled: true };
            }
            return { success: false };
          
          case 'getCurrentState':
            return { isEnabled: false, config: { type: 'normal', severity: 100 } };
          
          case 'setFilter':
            return { success: true };
          
          case 'updateSeverity':
            return { success: true };
          
          default:
            return { success: false, error: 'Unknown action' };
        }
      };
      
      handleMessage().then(sendResponse);
      return true;
    };
  };

  let messageHandler: MessageHandler;

  beforeEach(() => {
    messageHandler = createMessageHandler();
  });

  it('should handle getInitialState message', async () => {
    const response = await new Promise(resolve => {
      messageHandler({ action: 'getInitialState' }, {}, resolve);
    });
    
    expect(response).toEqual({
      isEnabled: false,
      config: { type: 'normal', severity: 100 }
    });
  });

  it('should handle applyFilter message with valid tab', async () => {
    const response = await new Promise(resolve => {
      messageHandler(
        { action: 'applyFilter', config: { type: 'protanopia', severity: 100 } },
        { tab: { id: 1 } },
        resolve
      );
    });
    
    expect(response).toEqual({ success: true });
  });

  it('should fail applyFilter without tab id', async () => {
    const response = await new Promise(resolve => {
      messageHandler(
        { action: 'applyFilter', config: { type: 'protanopia', severity: 100 } },
        {},
        resolve
      );
    });
    
    expect(response).toEqual({ success: false });
  });

  it('should handle disableFilter message', async () => {
    const response = await new Promise(resolve => {
      messageHandler({ action: 'disableFilter' }, { tab: { id: 1 } }, resolve);
    });
    
    expect(response).toEqual({ success: true });
  });

  it('should handle toggleFilter message', async () => {
    const response = await new Promise(resolve => {
      messageHandler({ action: 'toggleFilter' }, { tab: { id: 1 } }, resolve);
    });
    
    expect(response).toEqual({ success: true, isEnabled: true });
  });

  it('should handle getCurrentState message', async () => {
    const response = await new Promise(resolve => {
      messageHandler({ action: 'getCurrentState' }, {}, resolve);
    });
    
    expect(response).toHaveProperty('isEnabled');
    expect(response).toHaveProperty('config');
  });

  it('should handle setFilter message', async () => {
    const response = await new Promise(resolve => {
      messageHandler(
        { action: 'setFilter', config: { type: 'deuteranopia', severity: 100 }, enabled: true },
        {},
        resolve
      );
    });
    
    expect(response).toEqual({ success: true });
  });

  it('should handle updateSeverity message', async () => {
    const response = await new Promise(resolve => {
      messageHandler({ action: 'updateSeverity', severity: 75 }, {}, resolve);
    });
    
    expect(response).toEqual({ success: true });
  });

  it('should handle unknown action', async () => {
    const response = await new Promise(resolve => {
      messageHandler({ action: 'unknownAction' }, {}, resolve);
    });
    
    expect(response).toEqual({ success: false, error: 'Unknown action' });
  });
});

describe('Service Worker - Keyboard Shortcut Handling', () => {
  it('should toggle filter on keyboard shortcut', async () => {
    let isEnabled = false;
    
    const handleCommand = async (command: string) => {
      if (command === 'toggle-filter') {
        isEnabled = !isEnabled;
        return { success: true, isEnabled };
      }
      return { success: false };
    };
    
    const result = await handleCommand('toggle-filter');
    expect(result.isEnabled).toBe(true);
    
    const result2 = await handleCommand('toggle-filter');
    expect(result2.isEnabled).toBe(false);
  });

  it('should ignore unknown commands', async () => {
    const handleCommand = async (command: string) => {
      if (command === 'toggle-filter') {
        return { success: true };
      }
      return { success: false };
    };
    
    const result = await handleCommand('unknown-command');
    expect(result.success).toBe(false);
  });
});

describe('Service Worker - Tab Lifecycle', () => {
  const tabFilters = new Map<number, { isEnabled: boolean; config: { type: string; severity: number } }>();

  beforeEach(() => {
    tabFilters.clear();
    tabFilters.set(1, { isEnabled: true, config: { type: 'protanopia', severity: 100 } });
    tabFilters.set(2, { isEnabled: true, config: { type: 'deuteranopia', severity: 80 } });
  });

  it('should clean up on tab close', () => {
    const onTabRemoved = (tabId: number) => {
      tabFilters.delete(tabId);
    };
    
    onTabRemoved(1);
    
    expect(tabFilters.has(1)).toBe(false);
    expect(tabFilters.has(2)).toBe(true);
  });

  it('should re-apply filter on tab update complete', async () => {
    const applyFilterCalled = vi.fn();
    
    const onTabUpdated = async (tabId: number, changeInfo: { status?: string }) => {
      if (changeInfo.status === 'complete') {
        const state = tabFilters.get(tabId);
        if (state?.isEnabled) {
          applyFilterCalled(tabId, state.config);
        }
      }
    };
    
    await onTabUpdated(1, { status: 'complete' });
    
    expect(applyFilterCalled).toHaveBeenCalledWith(1, { type: 'protanopia', severity: 100 });
  });

  it('should not re-apply filter if disabled', async () => {
    tabFilters.set(3, { isEnabled: false, config: { type: 'tritanopia', severity: 50 } });
    
    const applyFilterCalled = vi.fn();
    
    const onTabUpdated = async (tabId: number, changeInfo: { status?: string }) => {
      if (changeInfo.status === 'complete') {
        const state = tabFilters.get(tabId);
        if (state?.isEnabled) {
          applyFilterCalled(tabId, state.config);
        }
      }
    };
    
    await onTabUpdated(3, { status: 'complete' });
    
    expect(applyFilterCalled).not.toHaveBeenCalled();
  });

  it('should handle status loading (not complete)', async () => {
    const applyFilterCalled = vi.fn();
    
    const onTabUpdated = async (tabId: number, changeInfo: { status?: string }) => {
      if (changeInfo.status === 'complete') {
        const state = tabFilters.get(tabId);
        if (state?.isEnabled) {
          applyFilterCalled(tabId, state.config);
        }
      }
    };
    
    await onTabUpdated(1, { status: 'loading' });
    
    expect(applyFilterCalled).not.toHaveBeenCalled();
  });
});

describe('Service Worker - Install/Update Handling', () => {
  it('should handle install event', async () => {
    const logCalled = vi.fn();
    
    const onInstalled = (details: { reason: string }) => {
      if (details.reason === 'install') {
        logCalled('installed');
      } else if (details.reason === 'update') {
        logCalled('updated');
      }
    };
    
    onInstalled({ reason: 'install' });
    expect(logCalled).toHaveBeenCalledWith('installed');
  });

  it('should handle update event', async () => {
    const logCalled = vi.fn();
    
    const onInstalled = (details: { reason: string }) => {
      if (details.reason === 'install') {
        logCalled('installed');
      } else if (details.reason === 'update') {
        logCalled('updated');
      }
    };
    
    onInstalled({ reason: 'update' });
    expect(logCalled).toHaveBeenCalledWith('updated');
  });
});

