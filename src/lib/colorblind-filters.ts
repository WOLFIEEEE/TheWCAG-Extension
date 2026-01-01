/**
 * Color Blindness Simulation Filters
 * 
 * Based on research by Brettel, Viénot and Mollon (1997) and 
 * Machado, Oliveira and Fernandes (2009) for accurate simulation
 * of color vision deficiencies.
 */

export type ColorBlindnessType = 
  | 'normal'
  | 'protanopia'
  | 'protanomaly'
  | 'deuteranopia'
  | 'deuteranomaly'
  | 'tritanopia'
  | 'tritanomaly'
  | 'achromatopsia'
  | 'achromatomaly';

export interface FilterConfig {
  type: ColorBlindnessType;
  severity: number; // 0-100, used for anomaly types
}

export interface FilterInfo {
  type: ColorBlindnessType;
  name: string;
  shortName: string;
  description: string;
  affectedCone: string;
  prevalence: string;
  category: 'normal' | 'red-green' | 'blue-yellow' | 'monochromacy';
}

/**
 * Color matrix values for each type of color blindness.
 * These are 5x4 matrices in row-major order for use with SVG feColorMatrix.
 * Format: [R->R, G->R, B->R, A->R, offset-R, R->G, G->G, B->G, A->G, offset-G, ...]
 */
const COLOR_MATRICES: Record<Exclude<ColorBlindnessType, 'normal'>, number[]> = {
  // Protanopia (red-blind) - no red cone function
  protanopia: [
    0.567, 0.433, 0.000, 0, 0,
    0.558, 0.442, 0.000, 0, 0,
    0.000, 0.242, 0.758, 0, 0,
    0.000, 0.000, 0.000, 1, 0
  ],
  
  // Protanomaly (red-weak) - reduced red cone function
  protanomaly: [
    0.817, 0.183, 0.000, 0, 0,
    0.333, 0.667, 0.000, 0, 0,
    0.000, 0.125, 0.875, 0, 0,
    0.000, 0.000, 0.000, 1, 0
  ],
  
  // Deuteranopia (green-blind) - no green cone function
  deuteranopia: [
    0.625, 0.375, 0.000, 0, 0,
    0.700, 0.300, 0.000, 0, 0,
    0.000, 0.300, 0.700, 0, 0,
    0.000, 0.000, 0.000, 1, 0
  ],
  
  // Deuteranomaly (green-weak) - reduced green cone function
  deuteranomaly: [
    0.800, 0.200, 0.000, 0, 0,
    0.258, 0.742, 0.000, 0, 0,
    0.000, 0.142, 0.858, 0, 0,
    0.000, 0.000, 0.000, 1, 0
  ],
  
  // Tritanopia (blue-blind) - no blue cone function
  tritanopia: [
    0.950, 0.050, 0.000, 0, 0,
    0.000, 0.433, 0.567, 0, 0,
    0.000, 0.475, 0.525, 0, 0,
    0.000, 0.000, 0.000, 1, 0
  ],
  
  // Tritanomaly (blue-weak) - reduced blue cone function
  tritanomaly: [
    0.967, 0.033, 0.000, 0, 0,
    0.000, 0.733, 0.267, 0, 0,
    0.000, 0.183, 0.817, 0, 0,
    0.000, 0.000, 0.000, 1, 0
  ],
  
  // Achromatopsia (complete color blindness) - grayscale
  achromatopsia: [
    0.299, 0.587, 0.114, 0, 0,
    0.299, 0.587, 0.114, 0, 0,
    0.299, 0.587, 0.114, 0, 0,
    0.000, 0.000, 0.000, 1, 0
  ],
  
  // Achromatomaly (partial color blindness) - reduced saturation
  achromatomaly: [
    0.618, 0.320, 0.062, 0, 0,
    0.163, 0.775, 0.062, 0, 0,
    0.163, 0.320, 0.516, 0, 0,
    0.000, 0.000, 0.000, 1, 0
  ]
};

// Identity matrix for normal vision
const IDENTITY_MATRIX: number[] = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0
];

/**
 * Information about each color blindness type
 */
export const FILTER_INFO: Record<ColorBlindnessType, FilterInfo> = {
  normal: {
    type: 'normal',
    name: 'Normal Vision',
    shortName: 'Normal',
    description: 'Standard color vision with full color perception.',
    affectedCone: 'None',
    prevalence: '~92% of population',
    category: 'normal'
  },
  protanopia: {
    type: 'protanopia',
    name: 'Protanopia',
    shortName: 'Protan',
    description: 'Complete absence of red cone photoreceptors. Red appears as dark brown/black, unable to distinguish red from green.',
    affectedCone: 'L-cone (red)',
    prevalence: '~1% of males',
    category: 'red-green'
  },
  protanomaly: {
    type: 'protanomaly',
    name: 'Protanomaly',
    shortName: 'Protan (weak)',
    description: 'Reduced sensitivity of red cone photoreceptors. Red, orange, and yellow appear shifted toward green.',
    affectedCone: 'L-cone (red) - reduced',
    prevalence: '~1% of males',
    category: 'red-green'
  },
  deuteranopia: {
    type: 'deuteranopia',
    name: 'Deuteranopia',
    shortName: 'Deutan',
    description: 'Complete absence of green cone photoreceptors. Unable to distinguish green from red.',
    affectedCone: 'M-cone (green)',
    prevalence: '~1% of males',
    category: 'red-green'
  },
  deuteranomaly: {
    type: 'deuteranomaly',
    name: 'Deuteranomaly',
    shortName: 'Deutan (weak)',
    description: 'Reduced sensitivity of green cone photoreceptors. Most common form of color blindness.',
    affectedCone: 'M-cone (green) - reduced',
    prevalence: '~5% of males',
    category: 'red-green'
  },
  tritanopia: {
    type: 'tritanopia',
    name: 'Tritanopia',
    shortName: 'Tritan',
    description: 'Complete absence of blue cone photoreceptors. Unable to distinguish blue from green, yellow from pink.',
    affectedCone: 'S-cone (blue)',
    prevalence: '~0.01% of population',
    category: 'blue-yellow'
  },
  tritanomaly: {
    type: 'tritanomaly',
    name: 'Tritanomaly',
    shortName: 'Tritan (weak)',
    description: 'Reduced sensitivity of blue cone photoreceptors. Blue appears more greenish.',
    affectedCone: 'S-cone (blue) - reduced',
    prevalence: '~0.01% of population',
    category: 'blue-yellow'
  },
  achromatopsia: {
    type: 'achromatopsia',
    name: 'Achromatopsia',
    shortName: 'Achroma',
    description: 'Complete color blindness. Only perceives shades of gray. Often accompanied by light sensitivity.',
    affectedCone: 'All cones',
    prevalence: '~0.003% of population',
    category: 'monochromacy'
  },
  achromatomaly: {
    type: 'achromatomaly',
    name: 'Achromatomaly',
    shortName: 'Achroma (weak)',
    description: 'Partial color blindness with severely reduced color perception. Colors appear very desaturated.',
    affectedCone: 'All cones - reduced',
    prevalence: 'Very rare',
    category: 'monochromacy'
  }
};

/**
 * Get the color matrix for a specific type with optional severity interpolation
 */
export function getColorMatrix(config: FilterConfig): number[] {
  if (config.type === 'normal') {
    return [...IDENTITY_MATRIX];
  }
  
  const targetMatrix = COLOR_MATRICES[config.type];
  
  // For full deficiency types (not anomaly), use full matrix
  if (!config.type.includes('anomaly') && !config.type.includes('achromatomaly')) {
    return [...targetMatrix];
  }
  
  // For anomaly types, interpolate based on severity
  const severity = Math.max(0, Math.min(100, config.severity)) / 100;
  
  return IDENTITY_MATRIX.map((identityVal, i) => {
    const targetVal = targetMatrix[i];
    return identityVal + (targetVal - identityVal) * severity;
  });
}

/**
 * Generate SVG filter element string
 */
export function generateSVGFilter(config: FilterConfig): string {
  if (config.type === 'normal') {
    return '';
  }
  
  const matrix = getColorMatrix(config);
  const matrixString = matrix.join(' ');
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg" style="position: absolute; width: 0; height: 0; overflow: hidden;">
      <defs>
        <filter id="colorblind-filter" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="${matrixString}"/>
        </filter>
      </defs>
    </svg>
  `.trim();
}

/**
 * Generate inline SVG filter for injection
 */
export function generateSVGFilterElement(config: FilterConfig): SVGSVGElement | null {
  if (config.type === 'normal') {
    return null;
  }
  
  const svgString = generateSVGFilter(config);
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  return doc.documentElement as unknown as SVGSVGElement;
}

/**
 * Get CSS filter string for fallback or simple application
 */
export function generateCSSFilter(config: FilterConfig): string {
  if (config.type === 'normal') {
    return 'none';
  }
  
  // For grayscale types, we can use CSS grayscale filter
  if (config.type === 'achromatopsia') {
    return 'grayscale(100%)';
  }
  
  if (config.type === 'achromatomaly') {
    const severity = config.severity / 100;
    return `grayscale(${severity * 100}%)`;
  }
  
  // For other types, we need to use SVG filter reference
  return 'url(#colorblind-filter)';
}

/**
 * Get all available filter types
 */
export function getAllFilterTypes(): ColorBlindnessType[] {
  return [
    'normal',
    'protanopia',
    'protanomaly',
    'deuteranopia',
    'deuteranomaly',
    'tritanopia',
    'tritanomaly',
    'achromatopsia',
    'achromatomaly'
  ];
}

/**
 * Get filter types grouped by category
 */
export function getFiltersByCategory(): Record<string, ColorBlindnessType[]> {
  return {
    'Normal': ['normal'],
    'Red-Green (most common)': ['protanopia', 'protanomaly', 'deuteranopia', 'deuteranomaly'],
    'Blue-Yellow': ['tritanopia', 'tritanomaly'],
    'Monochromacy': ['achromatopsia', 'achromatomaly']
  };
}

/**
 * Check if a filter type is an anomaly (severity-adjustable)
 */
export function isAnomalyType(type: ColorBlindnessType): boolean {
  return type.includes('anomaly') || type === 'achromatomaly';
}

/**
 * Get default severity for a filter type
 */
export function getDefaultSeverity(type: ColorBlindnessType): number {
  if (isAnomalyType(type)) {
    return 70; // Default 70% severity for anomaly types
  }
  return 100; // Full effect for complete deficiency types
}

/**
 * Create a default filter config
 */
export function createDefaultConfig(): FilterConfig {
  return {
    type: 'normal',
    severity: 100
  };
}

/**
 * Valid color blindness types - used for validation
 * @internal
 */
const VALID_TYPES: Set<ColorBlindnessType> = new Set([
  'normal',
  'protanopia',
  'protanomaly',
  'deuteranopia',
  'deuteranomaly',
  'tritanopia',
  'tritanomaly',
  'achromatopsia',
  'achromatomaly'
]);

/**
 * Check if a value is a valid color blindness type
 * @param type - The value to check
 * @returns True if the value is a valid ColorBlindnessType
 * @example
 * ```typescript
 * isValidType('protanopia') // true
 * isValidType('invalid') // false
 * ```
 */
export function isValidType(type: unknown): type is ColorBlindnessType {
  return typeof type === 'string' && VALID_TYPES.has(type as ColorBlindnessType);
}

/**
 * Sanitize and validate severity value
 * @param severity - The severity value to sanitize
 * @returns A valid severity value between 0 and 100
 * @example
 * ```typescript
 * sanitizeSeverity(150) // 100
 * sanitizeSeverity(-10) // 0
 * sanitizeSeverity(75) // 75
 * ```
 */
export function sanitizeSeverity(severity: unknown): number {
  if (typeof severity !== 'number' || isNaN(severity)) {
    return 100;
  }
  return Math.max(0, Math.min(100, Math.round(severity)));
}

/**
 * Validate and normalize a filter config
 */
export function normalizeConfig(config: Partial<FilterConfig>): FilterConfig {
  const type = isValidType(config.type) ? config.type : 'normal';
  const severity = sanitizeSeverity(config.severity);
  
  return { type, severity };
}

