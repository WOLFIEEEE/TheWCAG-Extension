/**
 * Chrome API mock for testing
 */

// Storage mock
const storageMock = {
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
};

// Runtime mock
const runtimeMock = {
  sendMessage: vi.fn().mockResolvedValue(undefined),
  onMessage: {
    addListener: vi.fn(),
    removeListener: vi.fn()
  },
  onInstalled: {
    addListener: vi.fn()
  },
  getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`)
};

// Tabs mock
const tabsMock = {
  query: vi.fn().mockResolvedValue([{ id: 1, url: 'https://example.com' }]),
  sendMessage: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue({ id: 1, url: 'https://example.com' }),
  onRemoved: {
    addListener: vi.fn()
  },
  onUpdated: {
    addListener: vi.fn()
  }
};

// Action mock
const actionMock = {
  setBadgeText: vi.fn().mockResolvedValue(undefined),
  setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined),
  setTitle: vi.fn().mockResolvedValue(undefined)
};

// Commands mock
const commandsMock = {
  onCommand: {
    addListener: vi.fn()
  }
};

// DevTools mock
const devtoolsMock = {
  inspectedWindow: {
    tabId: 1
  },
  panels: {
    create: vi.fn()
  }
};

// Full chrome mock
export const chromeMock = {
  storage: storageMock,
  runtime: runtimeMock,
  tabs: tabsMock,
  action: actionMock,
  commands: commandsMock,
  devtools: devtoolsMock
};

// Setup function to install mock
export function setupChromeMock(): void {
  // @ts-expect-error - Mock chrome global
  globalThis.chrome = chromeMock;
}

// Reset function to clear all mocks
export function resetChromeMock(): void {
  vi.clearAllMocks();
}

// Import vitest for types
import { vi } from 'vitest';

