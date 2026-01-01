import { ColorBlindnessType, FILTER_INFO } from '../../lib/colorblind-filters';

interface FilterToggleProps {
  isEnabled: boolean;
  filterType: ColorBlindnessType;
  onToggle: () => void;
  disabled?: boolean;
}

export function FilterToggle({ 
  isEnabled, 
  filterType, 
  onToggle,
  disabled = false 
}: FilterToggleProps) {
  const isNormal = filterType === 'normal';
  const canEnable = !isNormal;
  
  return (
    <div className="filter-toggle">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Simulation
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isEnabled && canEnable 
              ? `${FILTER_INFO[filterType].shortName} active` 
              : 'Not active'
            }
          </span>
        </div>
        
        <button
          onClick={onToggle}
          disabled={disabled || !canEnable}
          className={`
            relative inline-flex h-7 w-14 items-center rounded-full 
            transition-colors duration-200 ease-in-out focus:outline-none 
            focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
            dark:focus:ring-offset-gray-900
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isEnabled && canEnable
              ? 'bg-emerald-500' 
              : 'bg-gray-300 dark:bg-gray-600'
            }
          `}
          role="switch"
          aria-checked={isEnabled && canEnable}
          aria-label="Toggle color blindness simulation"
        >
          <span
            className={`
              inline-block h-5 w-5 transform rounded-full bg-white shadow-lg
              transition-transform duration-200 ease-in-out
              ${isEnabled && canEnable ? 'translate-x-8' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
      
      {isNormal && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Select a color blindness type to enable simulation
        </p>
      )}
    </div>
  );
}

