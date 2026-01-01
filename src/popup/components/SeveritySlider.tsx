import { ColorBlindnessType, isAnomalyType } from '../../lib/colorblind-filters';

interface SeveritySliderProps {
  filterType: ColorBlindnessType;
  severity: number;
  onSeverityChange: (severity: number) => void;
  disabled?: boolean;
}

export function SeveritySlider({ 
  filterType, 
  severity, 
  onSeverityChange,
  disabled = false 
}: SeveritySliderProps) {
  const isAnomaly = isAnomalyType(filterType);
  
  if (!isAnomaly) {
    return null;
  }
  
  return (
    <div className="severity-slider">
      <div className="flex items-center justify-between mb-2">
        <label 
          htmlFor="severity-range" 
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Severity
        </label>
        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
          {severity}%
        </span>
      </div>
      
      <div className="relative">
        <input
          id="severity-range"
          type="range"
          min="0"
          max="100"
          value={severity}
          onChange={(e) => onSeverityChange(parseInt(e.target.value, 10))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none 
                     cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                     accent-emerald-500"
          style={{
            background: disabled 
              ? undefined 
              : `linear-gradient(to right, #10b981 0%, #10b981 ${severity}%, #e5e7eb ${severity}%, #e5e7eb 100%)`
          }}
        />
        
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
          <span>Mild</span>
          <span>Moderate</span>
          <span>Severe</span>
        </div>
      </div>
      
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Adjust how strongly the color vision deficiency affects your view.
      </p>
    </div>
  );
}

