/**
 * FilterToggle Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple FilterToggle implementation for testing
function FilterToggle({
  isEnabled,
  filterType,
  onToggle
}: {
  isEnabled: boolean;
  filterType: string;
  onToggle: () => void;
}) {
  const isNormal = filterType === 'normal';
  
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <span>Enable Simulation</span>
          <p>{isEnabled ? 'Filter is active' : 'Filter is inactive'}</p>
        </div>
        <button
          onClick={onToggle}
          disabled={isNormal}
          role="switch"
          aria-checked={isEnabled}
          aria-label="Toggle simulation"
          className={isEnabled ? 'toggle-on' : 'toggle-off'}
        >
          <span className="toggle-indicator" />
        </button>
      </div>
    </div>
  );
}

describe('FilterToggle', () => {
  it('should render toggle button', () => {
    render(
      <FilterToggle
        isEnabled={false}
        filterType="deuteranopia"
        onToggle={vi.fn()}
      />
    );
    
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('should show enabled state', () => {
    render(
      <FilterToggle
        isEnabled={true}
        filterType="protanopia"
        onToggle={vi.fn()}
      />
    );
    
    expect(screen.getByText('Filter is active')).toBeInTheDocument();
  });

  it('should show disabled state', () => {
    render(
      <FilterToggle
        isEnabled={false}
        filterType="protanopia"
        onToggle={vi.fn()}
      />
    );
    
    expect(screen.getByText('Filter is inactive')).toBeInTheDocument();
  });

  it('should call onToggle when clicked', () => {
    const handleToggle = vi.fn();
    
    render(
      <FilterToggle
        isEnabled={false}
        filterType="deuteranopia"
        onToggle={handleToggle}
      />
    );
    
    fireEvent.click(screen.getByRole('switch'));
    
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when filter type is normal', () => {
    render(
      <FilterToggle
        isEnabled={false}
        filterType="normal"
        onToggle={vi.fn()}
      />
    );
    
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('should have correct aria-checked attribute', () => {
    const { rerender } = render(
      <FilterToggle
        isEnabled={false}
        filterType="protanopia"
        onToggle={vi.fn()}
      />
    );
    
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    
    rerender(
      <FilterToggle
        isEnabled={true}
        filterType="protanopia"
        onToggle={vi.fn()}
      />
    );
    
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });
});

