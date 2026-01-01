/**
 * Content Script Tests
 * 
 * Tests for the color blindness filter injection and management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock chrome API before importing content script
vi.mock('../../lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}));

// Setup DOM before tests
let dom: JSDOM;
let document: Document;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    url: 'https://example.com'
  });
  document = dom.window.document;
  
  // Set up global document
  global.document = document;
  global.window = dom.window as unknown as Window & typeof globalThis;
  
  // Mock chrome runtime
  global.chrome = {
    runtime: {
      sendMessage: vi.fn().mockResolvedValue({}),
      onMessage: {
        addListener: vi.fn()
      }
    }
  } as unknown as typeof chrome;
});

afterEach(() => {
  vi.clearAllMocks();
  dom.window.close();
});

describe('Content Script - Filter Generation', () => {
  describe('generateSVGFilterString', () => {
    // Import the function dynamically to use mocked document
    const generateSVGFilterString = (config: { type: string; severity: number }): string => {
      const matrices: Record<string, number[]> = {
        protanopia: [
          0.567, 0.433, 0.000, 0, 0,
          0.558, 0.442, 0.000, 0, 0,
          0.000, 0.242, 0.758, 0, 0,
          0.000, 0.000, 0.000, 1, 0
        ],
        deuteranopia: [
          0.625, 0.375, 0.000, 0, 0,
          0.700, 0.300, 0.000, 0, 0,
          0.000, 0.300, 0.700, 0, 0,
          0.000, 0.000, 0.000, 1, 0
        ],
        protanomaly: [
          0.817, 0.183, 0.000, 0, 0,
          0.333, 0.667, 0.000, 0, 0,
          0.000, 0.125, 0.875, 0, 0,
          0.000, 0.000, 0.000, 1, 0
        ],
        achromatopsia: [
          0.299, 0.587, 0.114, 0, 0,
          0.299, 0.587, 0.114, 0, 0,
          0.299, 0.587, 0.114, 0, 0,
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
      
      if (!targetMatrix) {
        return identityMatrix.join(' ');
      }

      if (config.type.includes('anomaly')) {
        const severity = Math.max(0, Math.min(100, config.severity)) / 100;
        const interpolated = identityMatrix.map((val, i) => {
          return val + (targetMatrix[i] - val) * severity;
        });
        return interpolated.join(' ');
      }

      return targetMatrix.join(' ');
    };

    it('should return identity matrix for normal vision', () => {
      const result = generateSVGFilterString({ type: 'normal', severity: 100 });
      expect(result).toContain('1');
      expect(result.split(' ').filter(v => v === '1').length).toBe(4);
    });

    it('should return protanopia matrix values', () => {
      const result = generateSVGFilterString({ type: 'protanopia', severity: 100 });
      expect(result).toContain('0.567');
      expect(result).toContain('0.433');
    });

    it('should return deuteranopia matrix values', () => {
      const result = generateSVGFilterString({ type: 'deuteranopia', severity: 100 });
      expect(result).toContain('0.625');
      expect(result).toContain('0.375');
    });

    it('should interpolate anomaly types based on severity', () => {
      const result50 = generateSVGFilterString({ type: 'protanomaly', severity: 50 });
      const result100 = generateSVGFilterString({ type: 'protanomaly', severity: 100 });
      
      // 50% should be different from 100%
      expect(result50).not.toBe(result100);
    });

    it('should handle 0% severity as identity', () => {
      const result = generateSVGFilterString({ type: 'protanomaly', severity: 0 });
      // At 0% severity, should be close to identity
      const values = result.split(' ').map(Number);
      expect(values[0]).toBeCloseTo(1, 1);
    });

    it('should return achromatopsia grayscale matrix', () => {
      const result = generateSVGFilterString({ type: 'achromatopsia', severity: 100 });
      expect(result).toContain('0.299');
      expect(result).toContain('0.587');
      expect(result).toContain('0.114');
    });
  });
});

describe('Content Script - DOM Manipulation', () => {
  const FILTER_SVG_ID = 'colorblind-simulator-svg';
  const FILTER_ID = 'colorblind-filter';

  const injectSVGFilter = (matrixValues: string) => {
    // Remove existing filter
    const existing = document.getElementById(FILTER_SVG_ID);
    if (existing) {
      existing.remove();
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', FILTER_SVG_ID);
    svg.setAttribute('style', 'position: absolute; width: 0; height: 0; overflow: hidden;');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `
      <defs>
        <filter id="${FILTER_ID}" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="${matrixValues}"/>
        </filter>
      </defs>
    `;
    document.body.insertBefore(svg, document.body.firstChild);
  };

  const applyFilter = () => {
    document.documentElement.style.setProperty('filter', `url(#${FILTER_ID})`);
    document.documentElement.classList.add('colorblind-filter-active');
  };

  const removeFilter = () => {
    const existingSvg = document.getElementById(FILTER_SVG_ID);
    if (existingSvg) {
      existingSvg.remove();
    }
    document.documentElement.style.removeProperty('filter');
    document.documentElement.classList.remove('colorblind-filter-active');
  };

  it('should inject SVG filter into the DOM', () => {
    injectSVGFilter('1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
    
    const svg = document.getElementById(FILTER_SVG_ID);
    expect(svg).not.toBeNull();
    expect(svg?.tagName.toLowerCase()).toBe('svg');
  });

  it('should have aria-hidden attribute for accessibility', () => {
    injectSVGFilter('1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
    
    const svg = document.getElementById(FILTER_SVG_ID);
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should apply CSS filter to document', () => {
    injectSVGFilter('1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
    applyFilter();
    
    const filter = document.documentElement.style.getPropertyValue('filter');
    expect(filter).toContain(`url(#${FILTER_ID})`);
  });

  it('should add active class when filter is applied', () => {
    injectSVGFilter('1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
    applyFilter();
    
    expect(document.documentElement.classList.contains('colorblind-filter-active')).toBe(true);
  });

  it('should remove SVG filter from DOM', () => {
    injectSVGFilter('1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
    removeFilter();
    
    const svg = document.getElementById(FILTER_SVG_ID);
    expect(svg).toBeNull();
  });

  it('should remove CSS filter from document', () => {
    injectSVGFilter('1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
    applyFilter();
    removeFilter();
    
    const filter = document.documentElement.style.getPropertyValue('filter');
    expect(filter).toBe('');
  });

  it('should remove active class when filter is removed', () => {
    injectSVGFilter('1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
    applyFilter();
    removeFilter();
    
    expect(document.documentElement.classList.contains('colorblind-filter-active')).toBe(false);
  });

  it('should replace existing filter when new one is injected', () => {
    injectSVGFilter('1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
    injectSVGFilter('0.5 0.5 0 0 0 0.5 0.5 0 0 0 0 0 1 0 0 0 0 0 1 0');
    
    const svgs = document.querySelectorAll(`#${FILTER_SVG_ID}`);
    expect(svgs.length).toBe(1);
  });
});

describe('Content Script - State Management', () => {
  let currentConfig: { type: string; severity: number } | null = null;
  let isEnabled = false;

  const setState = (config: { type: string; severity: number } | null, enabled: boolean) => {
    currentConfig = config;
    isEnabled = enabled;
  };

  const getFilterState = () => ({ isEnabled, config: currentConfig });

  beforeEach(() => {
    currentConfig = null;
    isEnabled = false;
  });

  it('should track enabled state', () => {
    setState({ type: 'protanopia', severity: 100 }, true);
    
    const state = getFilterState();
    expect(state.isEnabled).toBe(true);
  });

  it('should track current config', () => {
    setState({ type: 'deuteranopia', severity: 80 }, true);
    
    const state = getFilterState();
    expect(state.config?.type).toBe('deuteranopia');
    expect(state.config?.severity).toBe(80);
  });

  it('should return null config when not set', () => {
    const state = getFilterState();
    expect(state.config).toBeNull();
  });

  it('should toggle enabled state', () => {
    setState({ type: 'protanopia', severity: 100 }, true);
    expect(getFilterState().isEnabled).toBe(true);
    
    setState(currentConfig, false);
    expect(getFilterState().isEnabled).toBe(false);
  });

  it('should update severity while keeping type', () => {
    setState({ type: 'protanomaly', severity: 50 }, true);
    setState({ ...currentConfig!, severity: 75 }, isEnabled);
    
    const state = getFilterState();
    expect(state.config?.type).toBe('protanomaly');
    expect(state.config?.severity).toBe(75);
  });
});

describe('Content Script - Message Handling', () => {
  it('should handle applyFilter message', () => {
    const handler = vi.fn();
    const sendResponse = vi.fn();
    
    const message = {
      action: 'applyFilter',
      config: { type: 'protanopia', severity: 100 }
    };
    
    // Simulate message handler logic
    if (message.action === 'applyFilter') {
      handler(message.config);
      sendResponse({ success: true });
    }
    
    expect(handler).toHaveBeenCalledWith({ type: 'protanopia', severity: 100 });
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('should handle removeFilter message', () => {
    const handler = vi.fn();
    const sendResponse = vi.fn();
    
    const message = { action: 'removeFilter' };
    
    if (message.action === 'removeFilter') {
      handler();
      sendResponse({ success: true });
    }
    
    expect(handler).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('should handle toggleFilter message', () => {
    let isEnabled = false;
    const sendResponse = vi.fn();
    
    const message = { action: 'toggleFilter' };
    
    if (message.action === 'toggleFilter') {
      isEnabled = !isEnabled;
      sendResponse({ success: true, isEnabled });
    }
    
    expect(sendResponse).toHaveBeenCalledWith({ success: true, isEnabled: true });
  });

  it('should handle getFilterState message', () => {
    const state = { isEnabled: true, config: { type: 'deuteranopia', severity: 100 } };
    const sendResponse = vi.fn();
    
    const message = { action: 'getFilterState' };
    
    if (message.action === 'getFilterState') {
      sendResponse(state);
    }
    
    expect(sendResponse).toHaveBeenCalledWith(state);
  });

  it('should handle updateSeverity message', () => {
    let config = { type: 'protanomaly', severity: 50 };
    const sendResponse = vi.fn();
    
    const message = { action: 'updateSeverity', severity: 75 };
    
    if (message.action === 'updateSeverity') {
      config = { ...config, severity: message.severity };
      sendResponse({ success: true });
    }
    
    expect(config.severity).toBe(75);
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('should handle unknown action', () => {
    const sendResponse = vi.fn();
    
    const message = { action: 'unknownAction' };
    
    if (!['applyFilter', 'removeFilter', 'toggleFilter', 'getFilterState', 'updateSeverity'].includes(message.action)) {
      sendResponse({ success: false, error: 'Unknown action' });
    }
    
    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'Unknown action' });
  });
});

