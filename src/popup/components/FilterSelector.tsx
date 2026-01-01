import { 
  ColorBlindnessType, 
  FILTER_INFO, 
  getFiltersByCategory 
} from '../../lib/colorblind-filters';

interface FilterSelectorProps {
  selectedFilter: ColorBlindnessType;
  onFilterChange: (filter: ColorBlindnessType) => void;
  disabled?: boolean;
}

export function FilterSelector({ 
  selectedFilter, 
  onFilterChange,
  disabled = false 
}: FilterSelectorProps) {
  const categories = getFiltersByCategory();
  
  return (
    <div className="filter-selector">
      <label 
        htmlFor="filter-type" 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Color Blindness Type
      </label>
      
      <select
        id="filter-type"
        value={selectedFilter}
        onChange={(e) => onFilterChange(e.target.value as ColorBlindnessType)}
        disabled={disabled}
        className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 
                   dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 
                   focus:ring-emerald-500 focus:border-emerald-500 
                   text-gray-900 dark:text-gray-100 text-sm
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors duration-200"
      >
        {Object.entries(categories).map(([category, types]) => (
          <optgroup key={category} label={category}>
            {types.map((type) => (
              <option key={type} value={type}>
                {FILTER_INFO[type].name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      
      {selectedFilter !== 'normal' && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {FILTER_INFO[selectedFilter].description}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <span className="font-medium">Affects:</span>
              <span>{FILTER_INFO[selectedFilter].affectedCone}</span>
            </span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span>{FILTER_INFO[selectedFilter].prevalence}</span>
          </div>
        </div>
      )}
    </div>
  );
}

