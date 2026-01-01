# Architecture Documentation

## Overview

The Color Blindness Simulator is a Chrome Extension built with Manifest V3, React, TypeScript, and Vite. It uses SVG color matrix filters to simulate various types of color vision deficiency.

## System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chrome Extension                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌─────────────────┐    ┌───────────────┐  │
│  │    Popup     │    │ Service Worker  │    │ Content Script│  │
│  │   (React)    │◄──►│  (Background)   │◄──►│  (Per Tab)    │  │
│  └──────────────┘    └─────────────────┘    └───────────────┘  │
│         │                    │                      │           │
│         ▼                    ▼                      ▼           │
│  ┌──────────────┐    ┌─────────────────┐    ┌───────────────┐  │
│  │  DevTools    │    │ Chrome Storage  │    │  DOM + SVG    │  │
│  │   Panel      │    │     (Local)     │    │   Filters     │  │
│  └──────────────┘    └─────────────────┘    └───────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Popup UI (`src/popup/`)

The main user interface displayed when clicking the extension icon.

**Key Components:**
- `PopupApp.tsx` - Main application container
- `FilterSelector.tsx` - Dropdown for selecting filter type
- `FilterToggle.tsx` - Enable/disable switch
- `SeveritySlider.tsx` - Intensity control for anomaly types
- `Settings.tsx` - User preferences panel
- `FilterInfo.tsx` - Information about selected filter
- `Toast.tsx` - Notification messages
- `ErrorBoundary.tsx` - Error handling wrapper

**State Management:**
- Local React state with `useState` and `useCallback`
- Chrome Storage for persistence
- No external state library needed

### 2. Service Worker (`src/background/`)

Background script running in the extension context (Manifest V3).

**Responsibilities:**
- Tab state management
- Badge updates
- Keyboard shortcut handling
- Message routing between popup and content scripts
- Install/update handling

**Key Data Structures:**
```typescript
// Per-tab filter state
Map<tabId, { isEnabled: boolean; config: FilterConfig }>
```

### 3. Content Script (`src/content/`)

Injected into every web page to apply color filters.

**Responsibilities:**
- SVG filter injection
- CSS filter application
- Message handling from popup/background
- DOM manipulation

**Filter Application:**
```
1. Generate SVG filter with color matrix
2. Inject SVG element into document body
3. Apply CSS filter to <html> element
4. Add marker class for detection
```

### 4. DevTools Panel (`src/devtools/`)

Integrated panel in Chrome DevTools for developers.

**Features:**
- Quick select grid for filter types
- Same functionality as popup
- Better integration with developer workflow

### 5. Shared Library (`src/lib/`)

Shared utilities used across all components.

**Modules:**
- `colorblind-filters.ts` - Color matrices and filter generation
- `storage.ts` - Chrome storage wrapper
- `validation.ts` - Zod schemas for data validation
- `logger.ts` - Centralized logging
- `errors.ts` - Error handling utilities
- `debounce.ts` - Rate limiting utilities

## Data Flow

### Filter Application Flow

```
User clicks toggle
       │
       ▼
┌──────────────┐
│    Popup     │ 1. Update local state
└──────┬───────┘
       │
       ▼ chrome.runtime.sendMessage
┌──────────────┐
│Service Worker│ 2. Update tab state
│              │ 3. Update badge
└──────┬───────┘
       │
       ▼ chrome.tabs.sendMessage
┌──────────────┐
│Content Script│ 4. Inject SVG filter
│              │ 5. Apply CSS filter
└──────────────┘
```

### State Persistence Flow

```
┌──────────────┐     ┌──────────────┐
│   Popup/     │     │   Chrome     │
│   DevTools   │◄───►│   Storage    │
└──────────────┘     │   (Local)    │
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Restore    │
                     │   on Load    │
                     └──────────────┘
```

## Storage Schema

```typescript
interface StorageData {
  // User preferences
  preferences: {
    defaultFilter: ColorBlindnessType;
    defaultSeverity: number; // 0-100
    autoApplyOnLoad: boolean;
    showInfoToasts: boolean;
    darkMode: boolean;
    rememberPerSite: boolean;
  };
  
  // Current filter state
  currentFilter: {
    type: ColorBlindnessType;
    severity: number;
  };
  
  // Filter enabled state
  isEnabled: boolean;
  
  // Filter history (last 50)
  filterHistory: Array<{
    type: ColorBlindnessType;
    severity: number;
    timestamp: number;
    url?: string;
  }>;
  
  // Per-site settings
  siteSettings: {
    [hostname: string]: FilterConfig;
  };
}
```

## Color Matrix Filters

The extension uses SVG `feColorMatrix` filters based on scientific research:

```svg
<filter id="colorblind-filter" color-interpolation-filters="sRGB">
  <feColorMatrix type="matrix" values="..."/>
</filter>
```

### Matrix Format

5x4 matrix in row-major order:
```
| R' |   | R->R  G->R  B->R  A->R  offset-R |   | R |
| G' | = | R->G  G->G  B->G  A->G  offset-G | × | G |
| B' |   | R->B  G->B  B->B  A->B  offset-B |   | B |
| A' |   | R->A  G->A  B->A  A->A  offset-A |   | A |
```

### Severity Interpolation

For anomaly types, the matrix is interpolated between identity and full effect:

```typescript
interpolatedValue = identity + (target - identity) × severity
```

## Message Types

### Popup → Background

```typescript
type PopupMessage = 
  | { action: 'setFilter'; config: FilterConfig; enabled: boolean }
  | { action: 'getCurrentState' }
  | { action: 'updateSeverity'; severity: number };
```

### Background → Content

```typescript
type ContentMessage = 
  | { action: 'applyFilter'; config: FilterConfig }
  | { action: 'removeFilter' }
  | { action: 'toggleFilter' }
  | { action: 'getFilterState' }
  | { action: 'updateSeverity'; severity: number };
```

## Security Considerations

1. **Content Security Policy**: Strict CSP for extension pages
2. **Input Validation**: Zod schemas for all user input
3. **Restricted Pages**: Detection and handling of chrome:// pages
4. **No Remote Code**: All code bundled locally
5. **Minimal Permissions**: Only required permissions requested

## Build System

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  TypeScript │────►│    Vite     │────►│    dist/    │
│   Source    │     │   + CRXJS   │     │   Bundle    │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Build Output:**
- Minified JavaScript bundles
- CSS (Tailwind processed)
- manifest.json (processed)
- Icons and static assets

## Testing Strategy

```
┌─────────────────────────────────────────────────────┐
│                    Unit Tests                        │
│  - colorblind-filters.ts                            │
│  - storage.ts                                       │
│  - validation.ts                                    │
│  - React components                                 │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                 Integration Tests                    │
│  - Message passing                                  │
│  - Content script behavior                          │
│  - Service worker logic                             │
└─────────────────────────────────────────────────────┘
```

## Performance Considerations

1. **GPU Acceleration**: SVG filters use hardware acceleration
2. **No Per-Frame Processing**: Filters applied via CSS
3. **Debounced Updates**: Severity slider changes are debounced
4. **Efficient Storage**: Limited history size
5. **Lazy Loading**: Components loaded on demand

## Browser Compatibility

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome  | 95+     | Full support |
| Edge    | 95+     | Full support (Chromium) |
| Brave   | 1.32+   | Full support (Chromium) |

**Limitations:**
- Cannot run on chrome:// pages
- Cannot run on web store pages
- Cannot run on other extension pages

