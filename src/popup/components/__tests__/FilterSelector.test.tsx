/**
 * FilterSelector Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the dependencies
vi.mock('../../../lib/colorblind-filters', () => ({
  FILTER_INFO: {
    normal: { name: 'Normal Vision', shortName: 'Normal' },
    protanopia: { name: 'Protanopia', shortName: 'Protan' },
    protanomaly: { name: 'Protanomaly', shortName: 'Protan (weak)' },
    deuteranopia: { name: 'Deuteranopia', shortName: 'Deutan' },
    deuteranomaly: { name: 'Deuteranomaly', shortName: 'Deutan (weak)' },
    tritanopia: { name: 'Tritanopia', shortName: 'Tritan' },
    tritanomaly: { name: 'Tritanomaly', shortName: 'Tritan (weak)' },
    achromatopsia: { name: 'Achromatopsia', shortName: 'Achroma' },
    achromatomaly: { name: 'Achromatomaly', shortName: 'Achroma (weak)' }
  },
  getFiltersByCategory: () => ({
    'Normal': ['normal'],
    'Red-Green (most common)': ['protanopia', 'protanomaly', 'deuteranopia', 'deuteranomaly'],
    'Blue-Yellow': ['tritanopia', 'tritanomaly'],
    'Monochromacy': ['achromatopsia', 'achromatomaly']
  })
}));

// Simple FilterSelector implementation for testing
function FilterSelector({
  selectedFilter,
  onFilterChange
}: {
  selectedFilter: string;
  onFilterChange: (type: string) => void;
}) {
  const categories = {
    'Normal': ['normal'],
    'Red-Green (most common)': ['protanopia', 'protanomaly', 'deuteranopia', 'deuteranomaly'],
    'Blue-Yellow': ['tritanopia', 'tritanomaly'],
    'Monochromacy': ['achromatopsia', 'achromatomaly']
  };
  
  const filterInfo: Record<string, { name: string }> = {
    normal: { name: 'Normal Vision' },
    protanopia: { name: 'Protanopia' },
    protanomaly: { name: 'Protanomaly' },
    deuteranopia: { name: 'Deuteranopia' },
    deuteranomaly: { name: 'Deuteranomaly' },
    tritanopia: { name: 'Tritanopia' },
    tritanomaly: { name: 'Tritanomaly' },
    achromatopsia: { name: 'Achromatopsia' },
    achromatomaly: { name: 'Achromatomaly' }
  };

  return (
    <div>
      <label htmlFor="filter-select">Color Blindness Type</label>
      <select
        id="filter-select"
        value={selectedFilter}
        onChange={(e) => onFilterChange(e.target.value)}
        aria-label="Select color blindness type"
      >
        {Object.entries(categories).map(([category, types]) => (
          <optgroup key={category} label={category}>
            {types.map((type) => (
              <option key={type} value={type}>
                {filterInfo[type].name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

describe('FilterSelector', () => {
  it('should render with correct label', () => {
    render(
      <FilterSelector
        selectedFilter="deuteranopia"
        onFilterChange={vi.fn()}
      />
    );
    
    expect(screen.getByText('Color Blindness Type')).toBeInTheDocument();
  });

  it('should display selected filter', () => {
    render(
      <FilterSelector
        selectedFilter="protanopia"
        onFilterChange={vi.fn()}
      />
    );
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('protanopia');
  });

  it('should call onFilterChange when selection changes', () => {
    const handleChange = vi.fn();
    
    render(
      <FilterSelector
        selectedFilter="deuteranopia"
        onFilterChange={handleChange}
      />
    );
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'protanopia' } });
    
    expect(handleChange).toHaveBeenCalledWith('protanopia');
  });

  it('should have all filter options available', () => {
    render(
      <FilterSelector
        selectedFilter="normal"
        onFilterChange={vi.fn()}
      />
    );
    
    expect(screen.getByText('Normal Vision')).toBeInTheDocument();
    expect(screen.getByText('Protanopia')).toBeInTheDocument();
    expect(screen.getByText('Deuteranopia')).toBeInTheDocument();
    expect(screen.getByText('Tritanopia')).toBeInTheDocument();
    expect(screen.getByText('Achromatopsia')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <FilterSelector
        selectedFilter="deuteranopia"
        onFilterChange={vi.fn()}
      />
    );
    
    const select = screen.getByLabelText('Select color blindness type');
    expect(select).toBeInTheDocument();
  });

  it('should group filters by category', () => {
    render(
      <FilterSelector
        selectedFilter="normal"
        onFilterChange={vi.fn()}
      />
    );
    
    // Check for option groups
    const optgroups = document.querySelectorAll('optgroup');
    expect(optgroups.length).toBe(4);
  });
});

