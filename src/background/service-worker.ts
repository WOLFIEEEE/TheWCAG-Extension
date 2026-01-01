/**
 * Service Worker for Color Blindness Simulator
 * 
 * Handles background tasks, badge updates, keyboard shortcuts,
 * and tab state management.
 */

import type { FilterConfig, ColorBlindnessType } from '../lib/colorblind-filters';
import { 
  getCurrentFilter, 
  setCurrentFilter, 
  getIsEnabled, 
  setIsEnabled,
  getPreferences,
  addToHistory
} from '../lib/storage';
import { createLogger } from '../lib/logger';

const logger = createLogger('ServiceWorker');

// Track active filters per tab
const tabFilters = new Map<number, { isEnabled: boolean; config: FilterConfig }>();

/**
 * Update extension badge to show filter status
 */
async function updateBadge(tabId: number, isEnabled: boolean, filterType: ColorBlindnessType): Promise<void> {
  try {
    if (isEnabled && filterType !== 'normal') {
      // Show colored dot when filter is active
      await chrome.action.setBadgeText({ text: '●', tabId });
      await chrome.action.setBadgeBackgroundColor({ color: '#10b981', tabId }); // Green
      
      // Update title to show active filter
      const filterNames: Record<ColorBlindnessType, string> = {
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
      
      await chrome.action.setTitle({ 
        title: `Color Blindness Simulator - ${filterNames[filterType]} Active`,
        tabId 
      });
    } else {
      // Clear badge when filter is off
      await chrome.action.setBadgeText({ text: '', tabId });
      await chrome.action.setTitle({ 
        title: 'TheWCAG Color Blindness Simulator',
        tabId 
      });
    }
  } catch (error) {
    logger.error('Error updating badge:', error);
  }
}

/**
 * Apply filter to a specific tab
 */
async function applyFilterToTab(tabId: number, config: FilterConfig, enabled: boolean): Promise<void> {
  try {
    // Store tab state
    tabFilters.set(tabId, { isEnabled: enabled, config });
    
    // Update badge
    await updateBadge(tabId, enabled, config.type);
    
    // Send message to content script
    if (enabled && config.type !== 'normal') {
      await chrome.tabs.sendMessage(tabId, { action: 'applyFilter', config });
    } else {
      await chrome.tabs.sendMessage(tabId, { action: 'removeFilter' });
    }
    
    // Save to storage
    await setCurrentFilter(config);
    await setIsEnabled(enabled);
    
    // Add to history if enabled
    if (enabled && config.type !== 'normal') {
      const tab = await chrome.tabs.get(tabId);
      await addToHistory(config.type, config.severity, tab.url);
    }
  } catch (error) {
    logger.error('Error applying filter to tab:', error);
  }
}

/**
 * Get initial state for a tab
 */
async function getInitialState(): Promise<{ isEnabled: boolean; config: FilterConfig }> {
  const [config, isEnabled] = await Promise.all([
    getCurrentFilter(),
    getIsEnabled()
  ]);
  
  return { isEnabled, config };
}

// Message handler
chrome.runtime.onMessage.addListener((
  message: { action: string; [key: string]: unknown },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => {
  const handleMessage = async () => {
    try {
      switch (message.action) {
        case 'getInitialState': {
          const state = await getInitialState();
          return state;
        }
        
        case 'applyFilter': {
          const tabId = sender.tab?.id;
          if (tabId && message.config) {
            await applyFilterToTab(tabId, message.config as FilterConfig, true);
          }
          return { success: true };
        }
        
        case 'disableFilter': {
          const tabId = sender.tab?.id;
          if (tabId) {
            const state = tabFilters.get(tabId);
            if (state) {
              await applyFilterToTab(tabId, state.config, false);
            }
          }
          return { success: true };
        }
        
        case 'toggleFilter': {
          const tabId = sender.tab?.id;
          if (tabId) {
            const state = tabFilters.get(tabId);
            if (state) {
              await applyFilterToTab(tabId, state.config, !state.isEnabled);
              return { success: true, isEnabled: !state.isEnabled };
            }
          }
          return { success: false };
        }
        
        case 'getCurrentState': {
          const state = await getInitialState();
          return state;
        }
        
        case 'setFilter': {
          const config = message.config as FilterConfig;
          const enabled = message.enabled as boolean;
          
          // Get active tab
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            await applyFilterToTab(tab.id, config, enabled);
          }
          return { success: true };
        }
        
        case 'updateSeverity': {
          const severity = message.severity as number;
          const currentConfig = await getCurrentFilter();
          const newConfig = { ...currentConfig, severity };
          
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            const state = tabFilters.get(tab.id);
            await applyFilterToTab(tab.id, newConfig, state?.isEnabled ?? false);
          }
          return { success: true };
        }

        default:
          return { success: false, error: 'Unknown action' };
      }
    } catch (error) {
      logger.error('Service worker error:', error);
      return { success: false, error: String(error) };
    }
  };
  
  handleMessage().then(sendResponse);
  return true; // Keep message channel open
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-filter') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const state = tabFilters.get(tab.id);
        const currentConfig = state?.config || await getCurrentFilter();
        const isCurrentlyEnabled = state?.isEnabled ?? false;
        
        await applyFilterToTab(tab.id, currentConfig, !isCurrentlyEnabled);
      }
    } catch (error) {
      logger.error('Error handling keyboard shortcut:', error);
    }
  }
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabFilters.delete(tabId);
});

// Restore filter when tab is updated (page reload)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    const state = tabFilters.get(tabId);
    const prefs = await getPreferences();
    
    if (state && state.isEnabled && prefs.autoApplyOnLoad) {
      // Re-apply filter after page load
      try {
        await chrome.tabs.sendMessage(tabId, { 
          action: 'applyFilter', 
          config: state.config 
        });
      } catch {
        // Content script may not be ready yet
        logger.debug('Waiting for content script to load');
      }
    }
  }
});

// Initialize on install/update
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    logger.info('Color Blindness Simulator installed');
  } else if (details.reason === 'update') {
    logger.info('Color Blindness Simulator updated');
  }
});

logger.info('Color Blindness Simulator service worker initialized');
