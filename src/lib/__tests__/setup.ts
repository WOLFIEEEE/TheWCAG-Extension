/**
 * Test setup file
 * 
 * Configures the test environment with necessary mocks
 */

import { vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      DEV: true,
      PROD: false,
      MODE: 'test'
    }
  }
});

// Mock Chrome API
const createChromeMock = () => ({
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined)
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn().mockResolvedValue(undefined),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    onInstalled: {
      addListener: vi.fn()
    },
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`)
  },
  tabs: {
    query: vi.fn().mockResolvedValue([{ id: 1, url: 'https://example.com' }]),
    sendMessage: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue({ id: 1, url: 'https://example.com' }),
    onRemoved: {
      addListener: vi.fn()
    },
    onUpdated: {
      addListener: vi.fn()
    }
  },
  action: {
    setBadgeText: vi.fn().mockResolvedValue(undefined),
    setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined),
    setTitle: vi.fn().mockResolvedValue(undefined)
  },
  commands: {
    onCommand: {
      addListener: vi.fn()
    }
  },
  devtools: {
    inspectedWindow: {
      tabId: 1
    },
    panels: {
      create: vi.fn()
    }
  }
});

// Set up chrome mock globally
vi.stubGlobal('chrome', createChromeMock());

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

