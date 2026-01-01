import { describe, it, expect } from 'vitest';
import {
  FilterConfig,
  getColorMatrix,
  generateSVGFilter,
  generateCSSFilter,
  getAllFilterTypes,
  getFiltersByCategory,
  isAnomalyType,
  getDefaultSeverity,
  createDefaultConfig,
  normalizeConfig,
  FILTER_INFO
} from '../colorblind-filters';

describe('colorblind-filters', () => {
  describe('getColorMatrix', () => {
    it('should return identity matrix for normal vision', () => {
      const config: FilterConfig = { type: 'normal', severity: 100 };
      const matrix = getColorMatrix(config);
      
      // Identity matrix
      expect(matrix[0]).toBe(1); // R->R
      expect(matrix[6]).toBe(1); // G->G
      expect(matrix[12]).toBe(1); // B->B
      expect(matrix[18]).toBe(1); // A->A
    });
    
    it('should return correct matrix for protanopia', () => {
      const config: FilterConfig = { type: 'protanopia', severity: 100 };
      const matrix = getColorMatrix(config);
      
      // Protanopia reduces red channel
      expect(matrix[0]).toBeCloseTo(0.567, 2);
      expect(matrix[1]).toBeCloseTo(0.433, 2);
    });
    
    it('should return correct matrix for deuteranopia', () => {
      const config: FilterConfig = { type: 'deuteranopia', severity: 100 };
      const matrix = getColorMatrix(config);
      
      expect(matrix[0]).toBeCloseTo(0.625, 2);
      expect(matrix[1]).toBeCloseTo(0.375, 2);
    });
    
    it('should return correct matrix for tritanopia', () => {
      const config: FilterConfig = { type: 'tritanopia', severity: 100 };
      const matrix = getColorMatrix(config);
      
      expect(matrix[0]).toBeCloseTo(0.95, 2);
      expect(matrix[1]).toBeCloseTo(0.05, 2);
    });
    
    it('should return grayscale matrix for achromatopsia', () => {
      const config: FilterConfig = { type: 'achromatopsia', severity: 100 };
      const matrix = getColorMatrix(config);
      
      // Grayscale uses same values for R, G, B channels
      expect(matrix[0]).toBeCloseTo(0.299, 2); // R
      expect(matrix[1]).toBeCloseTo(0.587, 2); // G
      expect(matrix[2]).toBeCloseTo(0.114, 2); // B
    });
    
    it('should interpolate severity for anomaly types', () => {
      const config50: FilterConfig = { type: 'protanomaly', severity: 50 };
      const config100: FilterConfig = { type: 'protanomaly', severity: 100 };
      
      const matrix50 = getColorMatrix(config50);
      const matrix100 = getColorMatrix(config100);
      
      // 50% severity should be between identity and full effect
      expect(matrix50[0]).toBeLessThan(1);
      expect(matrix50[0]).toBeGreaterThan(matrix100[0]);
    });
    
    it('should handle 0% severity as identity', () => {
      const config: FilterConfig = { type: 'deuteranomaly', severity: 0 };
      const matrix = getColorMatrix(config);
      
      // Should be close to identity
      expect(matrix[0]).toBeCloseTo(1, 1);
      expect(matrix[6]).toBeCloseTo(1, 1);
    });
  });
  
  describe('generateSVGFilter', () => {
    it('should return empty string for normal vision', () => {
      const config: FilterConfig = { type: 'normal', severity: 100 };
      const svg = generateSVGFilter(config);
      
      expect(svg).toBe('');
    });
    
    it('should return valid SVG for protanopia', () => {
      const config: FilterConfig = { type: 'protanopia', severity: 100 };
      const svg = generateSVGFilter(config);
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('<filter');
      expect(svg).toContain('id="colorblind-filter"');
      expect(svg).toContain('<feColorMatrix');
    });
    
    it('should include color matrix values', () => {
      const config: FilterConfig = { type: 'deuteranopia', severity: 100 };
      const svg = generateSVGFilter(config);
      
      expect(svg).toContain('0.625');
      expect(svg).toContain('0.375');
    });
  });
  
  describe('generateCSSFilter', () => {
    it('should return "none" for normal vision', () => {
      const config: FilterConfig = { type: 'normal', severity: 100 };
      const css = generateCSSFilter(config);
      
      expect(css).toBe('none');
    });
    
    it('should return grayscale for achromatopsia', () => {
      const config: FilterConfig = { type: 'achromatopsia', severity: 100 };
      const css = generateCSSFilter(config);
      
      expect(css).toBe('grayscale(100%)');
    });
    
    it('should return grayscale with severity for achromatomaly', () => {
      const config: FilterConfig = { type: 'achromatomaly', severity: 50 };
      const css = generateCSSFilter(config);
      
      expect(css).toBe('grayscale(50%)');
    });
    
    it('should return SVG filter reference for other types', () => {
      const config: FilterConfig = { type: 'protanopia', severity: 100 };
      const css = generateCSSFilter(config);
      
      expect(css).toBe('url(#colorblind-filter)');
    });
  });
  
  describe('getAllFilterTypes', () => {
    it('should return all 9 filter types', () => {
      const types = getAllFilterTypes();
      
      expect(types).toHaveLength(9);
      expect(types).toContain('normal');
      expect(types).toContain('protanopia');
      expect(types).toContain('protanomaly');
      expect(types).toContain('deuteranopia');
      expect(types).toContain('deuteranomaly');
      expect(types).toContain('tritanopia');
      expect(types).toContain('tritanomaly');
      expect(types).toContain('achromatopsia');
      expect(types).toContain('achromatomaly');
    });
  });
  
  describe('getFiltersByCategory', () => {
    it('should return filters grouped by category', () => {
      const categories = getFiltersByCategory();
      
      expect(Object.keys(categories)).toHaveLength(4);
      expect(categories['Normal']).toContain('normal');
      expect(categories['Red-Green (most common)']).toContain('protanopia');
      expect(categories['Blue-Yellow']).toContain('tritanopia');
      expect(categories['Monochromacy']).toContain('achromatopsia');
    });
  });
  
  describe('isAnomalyType', () => {
    it('should return true for anomaly types', () => {
      expect(isAnomalyType('protanomaly')).toBe(true);
      expect(isAnomalyType('deuteranomaly')).toBe(true);
      expect(isAnomalyType('tritanomaly')).toBe(true);
      expect(isAnomalyType('achromatomaly')).toBe(true);
    });
    
    it('should return false for non-anomaly types', () => {
      expect(isAnomalyType('normal')).toBe(false);
      expect(isAnomalyType('protanopia')).toBe(false);
      expect(isAnomalyType('deuteranopia')).toBe(false);
      expect(isAnomalyType('tritanopia')).toBe(false);
      expect(isAnomalyType('achromatopsia')).toBe(false);
    });
  });
  
  describe('getDefaultSeverity', () => {
    it('should return 70 for anomaly types', () => {
      expect(getDefaultSeverity('protanomaly')).toBe(70);
      expect(getDefaultSeverity('deuteranomaly')).toBe(70);
      expect(getDefaultSeverity('achromatomaly')).toBe(70);
    });
    
    it('should return 100 for complete deficiency types', () => {
      expect(getDefaultSeverity('protanopia')).toBe(100);
      expect(getDefaultSeverity('deuteranopia')).toBe(100);
      expect(getDefaultSeverity('tritanopia')).toBe(100);
      expect(getDefaultSeverity('achromatopsia')).toBe(100);
    });
  });
  
  describe('createDefaultConfig', () => {
    it('should return default config with normal type', () => {
      const config = createDefaultConfig();
      
      expect(config.type).toBe('normal');
      expect(config.severity).toBe(100);
    });
  });
  
  describe('normalizeConfig', () => {
    it('should provide defaults for missing values', () => {
      const config = normalizeConfig({});
      
      expect(config.type).toBe('normal');
      expect(config.severity).toBe(100);
    });
    
    it('should clamp severity to 0-100 range', () => {
      expect(normalizeConfig({ severity: -10 }).severity).toBe(0);
      expect(normalizeConfig({ severity: 150 }).severity).toBe(100);
      expect(normalizeConfig({ severity: 50 }).severity).toBe(50);
    });
    
    it('should preserve valid values', () => {
      const config = normalizeConfig({ type: 'protanopia', severity: 80 });
      
      expect(config.type).toBe('protanopia');
      expect(config.severity).toBe(80);
    });
  });
  
  describe('FILTER_INFO', () => {
    it('should have info for all filter types', () => {
      const types = getAllFilterTypes();
      
      types.forEach((type) => {
        expect(FILTER_INFO[type]).toBeDefined();
        expect(FILTER_INFO[type].name).toBeTruthy();
        expect(FILTER_INFO[type].description).toBeTruthy();
        expect(FILTER_INFO[type].affectedCone).toBeTruthy();
        expect(FILTER_INFO[type].prevalence).toBeTruthy();
      });
    });
    
    it('should have correct categories', () => {
      expect(FILTER_INFO.normal.category).toBe('normal');
      expect(FILTER_INFO.protanopia.category).toBe('red-green');
      expect(FILTER_INFO.tritanopia.category).toBe('blue-yellow');
      expect(FILTER_INFO.achromatopsia.category).toBe('monochromacy');
    });
  });
});

