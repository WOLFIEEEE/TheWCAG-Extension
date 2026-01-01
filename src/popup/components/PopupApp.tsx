import { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './Header';
import { Tabs, TabId } from './Tabs';
import { FilterSelector } from './FilterSelector';
import { FilterToggle } from './FilterToggle';
import { SeveritySlider } from './SeveritySlider';
import { FilterInfo } from './FilterInfo';
import { Settings } from './Settings';
import { Toast } from './Toast';
import { ErrorBoundary } from './ErrorBoundary';
import type { ColorBlindnessType, FilterConfig } from '../../lib/colorblind-filters';
import { getDefaultSeverity, isAnomalyType, isValidType, sanitizeSeverity } from '../../lib/colorblind-filters';
import type { ColorBlindPreferences } from '../../lib/storage';
import {
  getPreferences,
  updatePreferences,
  getCurrentFilter,
  setCurrentFilter,
  getIsEnabled,
  setIsEnabled,
  exportData,
  importData,
  clearHistory,
  resetToDefaults
} from '../../lib/storage';
import { createLogger } from '../../lib/logger';
import { MAX_IMPORT_FILE_SIZE, isValidImportFileSize } from '../../lib/validation';
import { debounce } from '../../lib/debounce';
import { isRestrictedPage, getUserMessage } from '../../lib/errors';

const logger = createLogger('PopupApp');

// Debounce delay for severity changes (ms)
const SEVERITY_DEBOUNCE_DELAY = 150;

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

export function PopupApp() {
  // State
  const [activeTab, setActiveTab] = useState<TabId>('simulator');
  const [filterType, setFilterType] = useState<ColorBlindnessType>('deuteranopia');
  const [severity, setSeverity] = useState(100);
  const [isEnabled, setIsEnabledState] = useState(false);
  const [preferences, setPreferences] = useState<ColorBlindPreferences>({
    defaultFilter: 'deuteranopia',
    defaultSeverity: 100,
    autoApplyOnLoad: false,
    showInfoToasts: true,
    darkMode: false,
    rememberPerSite: false
  });
  const [toast, setToast] = useState<ToastState>({ 
    message: '', 
    type: 'info', 
    visible: false 
  });
  const [isLoading, setIsLoading] = useState(true);

  // Show toast notification
  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    if (!preferences.showInfoToasts && type === 'info') return;
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  }, [preferences.showInfoToasts]);

  // Load initial state
  useEffect(() => {
    const loadState = async () => {
      try {
        const [prefs, currentFilter, enabled] = await Promise.all([
          getPreferences(),
          getCurrentFilter(),
          getIsEnabled()
        ]);
        
        setPreferences(prefs);
        setFilterType(currentFilter.type || prefs.defaultFilter);
        setSeverity(currentFilter.severity ?? prefs.defaultSeverity);
        setIsEnabledState(enabled);
        
        // Apply dark mode
        if (prefs.darkMode) {
          document.documentElement.classList.add('dark');
        }
      } catch (error) {
        logger.error('Error loading state:', error);
        showToast('Error loading settings', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadState();
  }, [showToast]);

  // Apply filter to page
  const applyFilter = useCallback(async (config: FilterConfig, enabled: boolean) => {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab?.id) {
        showToast('No active tab found', 'error');
        return;
      }
      
      // Check for restricted pages
      if (tab.url) {
        const restricted = isRestrictedPage(tab.url);
        if (restricted.restricted) {
          showToast('Cannot apply filters on this page', 'error');
          return;
        }
      }
      
      // Send message to background
      await chrome.runtime.sendMessage({
        action: 'setFilter',
        config,
        enabled
      });
      
      // Update local state
      await setCurrentFilter(config);
      await setIsEnabled(enabled);
      
    } catch (error) {
      logger.error('Error applying filter:', error);
      const message = getUserMessage(error);
      showToast(message, 'error');
    }
  }, [showToast]);

  // Handle filter type change with validation
  const handleFilterChange = useCallback(async (type: ColorBlindnessType) => {
    // Validate filter type
    if (!isValidType(type)) {
      logger.warn('Invalid filter type received:', type);
      return;
    }
    
    setFilterType(type);
    
    // Get appropriate severity for this type
    const newSeverity = isAnomalyType(type) ? severity : getDefaultSeverity(type);
    setSeverity(sanitizeSeverity(newSeverity));
    
    const config: FilterConfig = { type, severity: newSeverity };
    
    // Auto-apply if enabled
    if (isEnabled && type !== 'normal') {
      await applyFilter(config, true);
      showToast(`Applied ${type} simulation`, 'success');
    } else if (type === 'normal' && isEnabled) {
      await applyFilter(config, false);
      setIsEnabledState(false);
      showToast('Simulation disabled', 'info');
    }
  }, [severity, isEnabled, applyFilter, showToast]);

  // Handle toggle with validation
  const handleToggle = useCallback(async () => {
    if (!isValidType(filterType) || filterType === 'normal') {
      showToast('Select a filter type first', 'info');
      return;
    }
    
    const newEnabled = !isEnabled;
    setIsEnabledState(newEnabled);
    
    const config: FilterConfig = { type: filterType, severity: sanitizeSeverity(severity) };
    await applyFilter(config, newEnabled);
    
    showToast(
      newEnabled ? `${filterType} simulation enabled` : 'Simulation disabled',
      'success'
    );
  }, [filterType, severity, isEnabled, applyFilter, showToast]);

  // Create debounced filter application
  const debouncedApplyFilter = useMemo(() => {
    return debounce(async (config: FilterConfig) => {
      await applyFilter(config, true);
    }, SEVERITY_DEBOUNCE_DELAY);
  }, [applyFilter]);

  // Handle severity change with validation and debouncing
  const handleSeverityChange = useCallback((newSeverity: number) => {
    const sanitized = sanitizeSeverity(newSeverity);
    setSeverity(sanitized);
    
    if (isEnabled && isValidType(filterType)) {
      const config: FilterConfig = { type: filterType, severity: sanitized };
      debouncedApplyFilter(config);
    }
  }, [filterType, isEnabled, debouncedApplyFilter]);

  // Handle dark mode toggle
  const handleToggleDarkMode = useCallback(async () => {
    const newDarkMode = !preferences.darkMode;
    document.documentElement.classList.toggle('dark', newDarkMode);
    
    setPreferences(prev => ({ ...prev, darkMode: newDarkMode }));
    await updatePreferences({ darkMode: newDarkMode });
  }, [preferences.darkMode]);

  // Handle preferences update
  const handleUpdatePreferences = useCallback(async (updates: Partial<ColorBlindPreferences>) => {
    try {
      setPreferences(prev => ({ ...prev, ...updates }));
      await updatePreferences(updates);
      showToast('Settings updated', 'success');
    } catch (error) {
      logger.error('Error updating preferences:', error);
      showToast('Error updating settings', 'error');
    }
  }, [showToast]);

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'colorblind-simulator-data.json';
      a.click();
      
      URL.revokeObjectURL(url);
      showToast('Data exported successfully', 'success');
    } catch (error) {
      logger.error('Error exporting data:', error);
      showToast('Error exporting data', 'error');
    }
  }, [showToast]);

  // Handle import with validation
  const handleImport = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      try {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        // Validate file size
        if (!isValidImportFileSize(file.size)) {
          const maxSizeMB = (MAX_IMPORT_FILE_SIZE / (1024 * 1024)).toFixed(1);
          showToast(`File too large. Maximum size is ${maxSizeMB}MB`, 'error');
          return;
        }
        
        const text = await file.text();
        
        // Parse and validate JSON
        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch {
          showToast('Invalid JSON file format', 'error');
          return;
        }
        
        // Import with validation (throws if invalid)
        await importData(data);
        
        // Reload state
        const prefs = await getPreferences();
        setPreferences(prefs);
        
        const currentFilter = await getCurrentFilter();
        setFilterType(currentFilter.type || prefs.defaultFilter);
        setSeverity(currentFilter.severity ?? prefs.defaultSeverity);
        
        showToast('Data imported successfully', 'success');
      } catch (error) {
        logger.error('Error importing data:', error);
        const message = error instanceof Error ? error.message : 'Error importing data';
        showToast(message, 'error');
      }
    };
    
    input.click();
  }, [showToast]);

  // Handle clear history
  const handleClearHistory = useCallback(async () => {
    try {
      await clearHistory();
      showToast('History cleared', 'success');
    } catch (error) {
      logger.error('Error clearing history:', error);
      showToast('Error clearing history', 'error');
    }
  }, [showToast]);

  // Handle reset defaults
  const handleResetDefaults = useCallback(async () => {
    try {
      await resetToDefaults();
      
      // Reload defaults
      const prefs = await getPreferences();
      setPreferences(prefs);
      setFilterType(prefs.defaultFilter);
      setSeverity(prefs.defaultSeverity);
      setIsEnabledState(false);
      
      showToast('Settings reset to defaults', 'success');
    } catch (error) {
      logger.error('Error resetting defaults:', error);
      showToast('Error resetting settings', 'error');
    }
  }, [showToast]);

  if (isLoading) {
    return (
      <div className="w-[360px] h-[500px] flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`w-[360px] min-h-[500px] flex flex-col bg-white dark:bg-gray-900 ${preferences.darkMode ? 'dark' : ''}`}>
        <Header 
          darkMode={preferences.darkMode} 
          onToggleDarkMode={handleToggleDarkMode} 
        />
        
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 overflow-auto">
          {activeTab === 'simulator' && (
            <div className="p-4 space-y-5">
              <FilterSelector
                selectedFilter={filterType}
                onFilterChange={handleFilterChange}
              />
              
              <FilterToggle
                isEnabled={isEnabled}
                filterType={filterType}
                onToggle={handleToggle}
              />
              
              <SeveritySlider
                filterType={filterType}
                severity={severity}
                onSeverityChange={handleSeverityChange}
                disabled={!isEnabled}
              />
              
              {/* Quick keyboard shortcut hint */}
              <div className="text-center text-xs text-gray-400 dark:text-gray-500 pt-2">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                  Alt+Shift+C
                </kbd>
                {' '}to toggle filter
              </div>
            </div>
          )}
          
          {activeTab === 'info' && (
            <div className="p-4">
              <FilterInfo 
                filterType={filterType} 
                isEnabled={isEnabled} 
              />
            </div>
          )}
          
          {activeTab === 'settings' && (
            <Settings
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
              onExportData={handleExport}
              onImportData={handleImport}
              onClearHistory={handleClearHistory}
              onResetDefaults={handleResetDefaults}
            />
          )}
        </main>
        
        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onClose={() => setToast(prev => ({ ...prev, visible: false }))}
        />
      </div>
    </ErrorBoundary>
  );
}

export default PopupApp;
