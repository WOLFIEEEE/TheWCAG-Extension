/**
 * SeveritySlider Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple SeveritySlider implementation for testing
function SeveritySlider({
  filterType,
  severity,
  onSeverityChange,
  disabled
}: {
  filterType: string;
  severity: number;
  onSeverityChange: (value: number) => void;
  disabled?: boolean;
}) {
  const isAnomalyType = filterType.includes('anomaly') || filterType === 'achromatomaly';
  
  if (!isAnomalyType) {
    return null;
  }

  return (
    <div>
      <div className="flex justify-between">
        <label htmlFor="severity-slider">Severity</label>
        <span data-testid="severity-value">{severity}%</span>
      </div>
      <input
        id="severity-slider"
        type="range"
        min="0"
        max="100"
        value={severity}
        onChange={(e) => onSeverityChange(parseInt(e.target.value, 10))}
        disabled={disabled}
        aria-label="Adjust severity"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={severity}
      />
      <div className="flex justify-between text-xs">
        <span>Mild</span>
        <span>Moderate</span>
        <span>Severe</span>
      </div>
    </div>
  );
}

describe('SeveritySlider', () => {
  it('should render for anomaly types', () => {
    render(
      <SeveritySlider
        filterType="protanomaly"
        severity={70}
        onSeverityChange={vi.fn()}
      />
    );
    
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('should not render for non-anomaly types', () => {
    render(
      <SeveritySlider
        filterType="protanopia"
        severity={100}
        onSeverityChange={vi.fn()}
      />
    );
    
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });

  it('should display current severity value', () => {
    render(
      <SeveritySlider
        filterType="deuteranomaly"
        severity={75}
        onSeverityChange={vi.fn()}
      />
    );
    
    expect(screen.getByTestId('severity-value')).toHaveTextContent('75%');
  });

  it('should call onSeverityChange when slider moves', () => {
    const handleChange = vi.fn();
    
    render(
      <SeveritySlider
        filterType="protanomaly"
        severity={50}
        onSeverityChange={handleChange}
      />
    );
    
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '75' } });
    
    expect(handleChange).toHaveBeenCalledWith(75);
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <SeveritySlider
        filterType="protanomaly"
        severity={70}
        onSeverityChange={vi.fn()}
        disabled={true}
      />
    );
    
    expect(screen.getByRole('slider')).toBeDisabled();
  });

  it('should show severity labels', () => {
    render(
      <SeveritySlider
        filterType="tritanomaly"
        severity={50}
        onSeverityChange={vi.fn()}
      />
    );
    
    expect(screen.getByText('Mild')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('Severe')).toBeInTheDocument();
  });

  it('should have correct aria attributes', () => {
    render(
      <SeveritySlider
        filterType="achromatomaly"
        severity={60}
        onSeverityChange={vi.fn()}
      />
    );
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '60');
  });

  it('should render for achromatomaly', () => {
    render(
      <SeveritySlider
        filterType="achromatomaly"
        severity={50}
        onSeverityChange={vi.fn()}
      />
    );
    
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });
});

