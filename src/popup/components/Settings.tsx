import { useState } from 'react';
import type { ColorBlindPreferences } from '../../lib/storage';
import { ColorBlindnessType, FILTER_INFO, getAllFilterTypes } from '../../lib/colorblind-filters';

interface SettingsProps {
  preferences: ColorBlindPreferences;
  onUpdatePreferences: (updates: Partial<ColorBlindPreferences>) => void;
  onExportData: () => void;
  onImportData: () => void;
  onClearHistory: () => void;
  onResetDefaults: () => void;
}

export function Settings({
  preferences,
  onUpdatePreferences,
  onExportData,
  onImportData,
  onClearHistory,
  onResetDefaults
}: SettingsProps) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  
  const filterTypes = getAllFilterTypes().filter(t => t !== 'normal');
  
  return (
    <div className="settings space-y-6 p-4">
      {/* Default Filter */}
      <div>
        <label 
          htmlFor="default-filter" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Default Filter Type
        </label>
        <select
          id="default-filter"
          value={preferences.defaultFilter}
          onChange={(e) => onUpdatePreferences({ 
            defaultFilter: e.target.value as ColorBlindnessType 
          })}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 
                     dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          {filterTypes.map((type) => (
            <option key={type} value={type}>
              {FILTER_INFO[type].name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          This filter will be selected by default when you open the popup.
        </p>
      </div>
      
      {/* Default Severity */}
      <div>
        <label 
          htmlFor="default-severity" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Default Severity: {preferences.defaultSeverity}%
        </label>
        <input
          id="default-severity"
          type="range"
          min="10"
          max="100"
          step="10"
          value={preferences.defaultSeverity}
          onChange={(e) => onUpdatePreferences({ 
            defaultSeverity: parseInt(e.target.value, 10) 
          })}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none 
                     cursor-pointer accent-emerald-500"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Default intensity for anomaly-type filters.
        </p>
      </div>
      
      {/* Toggle options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Auto-apply on page load
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Automatically apply filter when pages load
            </p>
          </div>
          <button
            onClick={() => onUpdatePreferences({ 
              autoApplyOnLoad: !preferences.autoApplyOnLoad 
            })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full 
                       transition-colors ${
              preferences.autoApplyOnLoad 
                ? 'bg-emerald-500' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
            role="switch"
            aria-checked={preferences.autoApplyOnLoad}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow 
                         transition-transform ${
                preferences.autoApplyOnLoad ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show notifications
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Show toast messages for actions
            </p>
          </div>
          <button
            onClick={() => onUpdatePreferences({ 
              showInfoToasts: !preferences.showInfoToasts 
            })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full 
                       transition-colors ${
              preferences.showInfoToasts 
                ? 'bg-emerald-500' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
            role="switch"
            aria-checked={preferences.showInfoToasts}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow 
                         transition-transform ${
                preferences.showInfoToasts ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Remember per site
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Save filter settings for each website
            </p>
          </div>
          <button
            onClick={() => onUpdatePreferences({ 
              rememberPerSite: !preferences.rememberPerSite 
            })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full 
                       transition-colors ${
              preferences.rememberPerSite 
                ? 'bg-emerald-500' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
            role="switch"
            aria-checked={preferences.rememberPerSite}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow 
                         transition-transform ${
                preferences.rememberPerSite ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      
      {/* Data management */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Data Management
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExportData}
            className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 
                       text-gray-700 dark:text-gray-300 rounded-lg
                       hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Export Data
          </button>
          <button
            onClick={onImportData}
            className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 
                       text-gray-700 dark:text-gray-300 rounded-lg
                       hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Import Data
          </button>
        </div>
      </div>
      
      {/* Danger zone */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">
          Danger Zone
        </h3>
        
        <div className="space-y-2">
          {!showConfirmClear ? (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 
                         border border-red-300 dark:border-red-700 rounded-lg
                         hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Clear History
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onClearHistory();
                  setShowConfirmClear(false);
                }}
                className="flex-1 px-3 py-2 text-sm text-white bg-red-600 
                           rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 
                           bg-gray-100 dark:bg-gray-800 rounded-lg
                           hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          
          {!showConfirmReset ? (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 
                         border border-red-300 dark:border-red-700 rounded-lg
                         hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Reset to Defaults
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onResetDefaults();
                  setShowConfirmReset(false);
                }}
                className="flex-1 px-3 py-2 text-sm text-white bg-red-600 
                           rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 
                           bg-gray-100 dark:bg-gray-800 rounded-lg
                           hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* About section */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          TheWCAG Color Blindness Simulator v1.0.0
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          <a 
            href="https://thewcag.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            thewcag.com
          </a>
        </p>
      </div>
    </div>
  );
}
