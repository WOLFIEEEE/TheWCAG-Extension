/**
 * Content Script for Color Blindness Simulator
 * 
 * Handles injecting SVG filters into the page and applying/removing
 * color blindness simulation filters.
 */

import type { ColorBlindnessType, FilterConfig } from '../lib/colorblind-filters';
import { createLogger } from '../lib/logger';
import { isRestrictedPage } from '../lib/errors';

const logger = createLogger('ContentScript');

// Check if we're on a restricted page
const restrictedCheck = isRestrictedPage(window.location.href);
if (restrictedCheck.restricted) {
  logger.debug('Content script loaded on restricted page, skipping initialization');
}

// Filter element ID
const FILTER_SVG_ID = 'colorblind-simulator-svg';
const FILTER_ID = 'colorblind-filter';

// Current state
let currentConfig: FilterConfig | null = null;
let isEnabled = false;

/**
 * Generate SVG filter string based on configuration
 */
function generateSVGFilterString(config: FilterConfig): string {
  const matrices: Record<Exclude<ColorBlindnessType, 'normal'>, number[]> = {
    protanopia: [
      0.567, 0.433, 0.000, 0, 0,
      0.558, 0.442, 0.000, 0, 0,
      0.000, 0.242, 0.758, 0, 0,
      0.000, 0.000, 0.000, 1, 0
    ],
    protanomaly: [
      0.817, 0.183, 0.000, 0, 0,
      0.333, 0.667, 0.000, 0, 0,
      0.000, 0.125, 0.875, 0, 0,
      0.000, 0.000, 0.000, 1, 0
    ],
    deuteranopia: [
      0.625, 0.375, 0.000, 0, 0,
      0.700, 0.300, 0.000, 0, 0,
      0.000, 0.300, 0.700, 0, 0,
      0.000, 0.000, 0.000, 1, 0
    ],
    deuteranomaly: [
      0.800, 0.200, 0.000, 0, 0,
      0.258, 0.742, 0.000, 0, 0,
      0.000, 0.142, 0.858, 0, 0,
      0.000, 0.000, 0.000, 1, 0
    ],
    tritanopia: [
      0.950, 0.050, 0.000, 0, 0,
      0.000, 0.433, 0.567, 0, 0,
      0.000, 0.475, 0.525, 0, 0,
      0.000, 0.000, 0.000, 1, 0
    ],
    tritanomaly: [
      0.967, 0.033, 0.000, 0, 0,
      0.000, 0.733, 0.267, 0, 0,
      0.000, 0.183, 0.817, 0, 0,
      0.000, 0.000, 0.000, 1, 0
    ],
    achromatopsia: [
      0.299, 0.587, 0.114, 0, 0,
      0.299, 0.587, 0.114, 0, 0,
      0.299, 0.587, 0.114, 0, 0,
      0.000, 0.000, 0.000, 1, 0
    ],
    achromatomaly: [
      0.618, 0.320, 0.062, 0, 0,
      0.163, 0.775, 0.062, 0, 0,
      0.163, 0.320, 0.516, 0, 0,
      0.000, 0.000, 0.000, 1, 0
    ]
  };

  const identityMatrix = [
    1, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, 1, 0
  ];

  if (config.type === 'normal') {
    return identityMatrix.join(' ');
  }

  const targetMatrix = matrices[config.type];
  
  // Interpolate for anomaly types based on severity
  if (config.type.includes('anomaly') || config.type === 'achromatomaly') {
    const severity = Math.max(0, Math.min(100, config.severity)) / 100;
    const interpolated = identityMatrix.map((val, i) => {
      return val + (targetMatrix[i] - val) * severity;
    });
    return interpolated.join(' ');
  }

  return targetMatrix.join(' ');
}

/**
 * Inject SVG filter into the page
 */
function injectSVGFilter(config: FilterConfig): void {
  // Remove existing filter
  removeFilter();

  if (config.type === 'normal') {
    return;
  }

  const matrixValues = generateSVGFilterString(config);

  // Create SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('id', FILTER_SVG_ID);
  svg.setAttribute('style', 'position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none;');
  svg.setAttribute('aria-hidden', 'true');

  svg.innerHTML = `
    <defs>
      <filter id="${FILTER_ID}" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="${matrixValues}"/>
      </filter>
    </defs>
  `;

  // Insert at the beginning of body
  if (document.body) {
    document.body.insertBefore(svg, document.body.firstChild);
  }
}

/**
 * Apply the CSS filter to the page
 */
function applyFilter(): void {
  document.documentElement.style.setProperty('filter', `url(#${FILTER_ID})`);
  document.documentElement.style.setProperty('-webkit-filter', `url(#${FILTER_ID})`);
  
  // Add class for potential CSS hooks
  document.documentElement.classList.add('colorblind-filter-active');
}

/**
 * Remove the filter from the page
 */
function removeFilter(): void {
  // Remove SVG element
  const existingSvg = document.getElementById(FILTER_SVG_ID);
  if (existingSvg) {
    existingSvg.remove();
  }

  // Remove CSS filter
  document.documentElement.style.removeProperty('filter');
  document.documentElement.style.removeProperty('-webkit-filter');
  
  // Remove class
  document.documentElement.classList.remove('colorblind-filter-active');
}

/**
 * Apply color blindness filter
 */
function applyColorBlindFilter(config: FilterConfig): void {
  currentConfig = config;
  isEnabled = true;

  if (config.type === 'normal') {
    removeFilter();
    return;
  }

  injectSVGFilter(config);
  applyFilter();
}

/**
 * Disable filter
 */
function disableFilter(): void {
  isEnabled = false;
  removeFilter();
}

/**
 * Toggle filter on/off
 */
function toggleFilter(): void {
  if (isEnabled && currentConfig) {
    disableFilter();
  } else if (currentConfig && currentConfig.type !== 'normal') {
    applyColorBlindFilter(currentConfig);
  }
}

/**
 * Get current filter state
 */
function getFilterState(): { isEnabled: boolean; config: FilterConfig | null } {
  return { isEnabled, config: currentConfig };
}

// Message types
interface ApplyFilterMessage {
  action: 'applyFilter';
  config: FilterConfig;
}

interface RemoveFilterMessage {
  action: 'removeFilter';
}

interface ToggleFilterMessage {
  action: 'toggleFilter';
}

interface GetStateMessage {
  action: 'getFilterState';
}

interface UpdateSeverityMessage {
  action: 'updateSeverity';
  severity: number;
}

type ContentMessage = 
  | ApplyFilterMessage 
  | RemoveFilterMessage 
  | ToggleFilterMessage 
  | GetStateMessage
  | UpdateSeverityMessage;

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((
  message: ContentMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => {
  try {
    switch (message.action) {
      case 'applyFilter':
        applyColorBlindFilter(message.config);
        sendResponse({ success: true });
        break;

      case 'removeFilter':
        disableFilter();
        sendResponse({ success: true });
        break;

      case 'toggleFilter':
        toggleFilter();
        sendResponse({ success: true, isEnabled });
        break;

      case 'getFilterState':
        sendResponse(getFilterState());
        break;

      case 'updateSeverity':
        if (currentConfig) {
          currentConfig.severity = message.severity;
          if (isEnabled) {
            applyColorBlindFilter(currentConfig);
          }
        }
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    logger.error('Content script error:', error);
    sendResponse({ success: false, error: String(error) });
  }

  return true; // Keep message channel open for async response
});

// Initialize - check if there's a stored filter state
async function initialize(): Promise<void> {
  try {
    // Request initial state from background
    const response = await chrome.runtime.sendMessage({ action: 'getInitialState' });
    
    if (response && response.isEnabled && response.config) {
      applyColorBlindFilter(response.config);
    }
  } catch (error) {
    // Background may not be ready yet, that's ok
    logger.debug('Content script initialized, waiting for commands');
  }
}

// Run initialization when DOM is ready (skip on restricted pages)
if (!restrictedCheck.restricted) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
}

// Export for potential testing
export {
  applyColorBlindFilter,
  disableFilter,
  toggleFilter,
  getFilterState,
  removeFilter
};
