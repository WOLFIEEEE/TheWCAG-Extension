import { Fragment } from 'react';
import { ColorBlindnessType, FILTER_INFO } from '../../lib/colorblind-filters';

interface FilterInfoProps {
  filterType: ColorBlindnessType;
  isEnabled: boolean;
}

// Color palette examples for each type
const COLOR_EXAMPLES: Record<ColorBlindnessType, { confused: string[][]; description: string }> = {
  normal: {
    confused: [],
    description: 'Full color perception'
  },
  protanopia: {
    confused: [
      ['#FF0000', '#000000'], // Red appears dark
      ['#FF0000', '#00FF00'], // Red/Green confusion
      ['#FFA500', '#FFFF00'], // Orange/Yellow similar
    ],
    description: 'Difficulty with red and green. Red appears very dark or black.'
  },
  protanomaly: {
    confused: [
      ['#FF0000', '#CC4400'],
      ['#FF6600', '#AAAA00'],
    ],
    description: 'Reduced red sensitivity. Colors appear shifted toward green.'
  },
  deuteranopia: {
    confused: [
      ['#00FF00', '#FF0000'],
      ['#00FF00', '#FFFF00'],
      ['#0000FF', '#FF00FF'],
    ],
    description: 'Difficulty distinguishing green from red and some blues from purples.'
  },
  deuteranomaly: {
    confused: [
      ['#00FF00', '#88AA00'],
      ['#FF6600', '#CCCC00'],
    ],
    description: 'Reduced green sensitivity. Most common form of color blindness.'
  },
  tritanopia: {
    confused: [
      ['#0000FF', '#00FF00'],
      ['#FFFF00', '#FF69B4'],
      ['#00FFFF', '#FFFFFF'],
    ],
    description: 'Difficulty with blue and yellow. Blue appears greenish.'
  },
  tritanomaly: {
    confused: [
      ['#0000FF', '#008888'],
      ['#FFFF00', '#FFAAAA'],
    ],
    description: 'Reduced blue sensitivity. Blue and yellow appear muted.'
  },
  achromatopsia: {
    confused: [
      ['#FF0000', '#00FF00', '#0000FF'],
    ],
    description: 'Complete color blindness. Only sees shades of gray.'
  },
  achromatomaly: {
    confused: [
      ['#FF0000', '#808080'],
      ['#00FF00', '#808080'],
    ],
    description: 'Severely reduced color perception. Colors appear very desaturated.'
  }
};

export function FilterInfo({ filterType, isEnabled }: FilterInfoProps) {
  const info = FILTER_INFO[filterType];
  const examples = COLOR_EXAMPLES[filterType];
  
  return (
    <div className="filter-info p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
      {/* Status indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div 
          className={`w-2 h-2 rounded-full ${
            isEnabled && filterType !== 'normal' 
              ? 'bg-emerald-500 animate-pulse' 
              : 'bg-gray-400'
          }`} 
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isEnabled && filterType !== 'normal' ? 'Simulation Active' : 'Simulation Off'}
        </span>
      </div>
      
      {/* Filter details */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {info.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {examples.description}
          </p>
        </div>
        
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
            <span className="text-gray-500 dark:text-gray-400 block">Affected</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {info.affectedCone}
            </span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
            <span className="text-gray-500 dark:text-gray-400 block">Prevalence</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {info.prevalence}
            </span>
          </div>
        </div>
        
        {/* Color confusion examples */}
        {examples.confused.length > 0 && (
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
              Colors that may appear similar:
            </span>
            <div className="flex flex-wrap gap-2">
              {examples.confused.map((group, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-1 bg-white dark:bg-gray-800 
                             p-1.5 rounded-lg shadow-sm"
                >
                  {group.map((color, j) => (
                    <Fragment key={j}>
                      <div 
                        className="w-5 h-5 rounded border border-gray-200 dark:border-gray-600"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                      {j < group.length - 1 && (
                        <span className="text-gray-400 text-xs">≈</span>
                      )}
                    </Fragment>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Tips */}
      {filterType !== 'normal' && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Tip:</strong> Use this simulation to test if your designs rely 
            too heavily on color to convey information.
          </p>
        </div>
      )}
    </div>
  );
}

