/**
 * Toast Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple Toast implementation for testing
function Toast({
  message,
  type,
  visible,
  onClose
}: {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
  onClose: () => void;
}) {
  if (!visible) {
    return null;
  }

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  return (
    <div 
      role="alert" 
      className={`toast ${colors[type]}`}
      data-testid="toast"
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        aria-label="Close notification"
        className="toast-close"
      >
        ×
      </button>
    </div>
  );
}

describe('Toast', () => {
  it('should render when visible', () => {
    render(
      <Toast
        message="Test message"
        type="success"
        visible={true}
        onClose={vi.fn()}
      />
    );
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    render(
      <Toast
        message="Test message"
        type="success"
        visible={false}
        onClose={vi.fn()}
      />
    );
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should display message', () => {
    render(
      <Toast
        message="Filter applied successfully"
        type="success"
        visible={true}
        onClose={vi.fn()}
      />
    );
    
    expect(screen.getByText('Filter applied successfully')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    
    render(
      <Toast
        message="Test"
        type="info"
        visible={true}
        onClose={handleClose}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Close notification'));
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should have correct styling for success type', () => {
    render(
      <Toast
        message="Success"
        type="success"
        visible={true}
        onClose={vi.fn()}
      />
    );
    
    const toast = screen.getByTestId('toast');
    expect(toast).toHaveClass('bg-green-500');
  });

  it('should have correct styling for error type', () => {
    render(
      <Toast
        message="Error"
        type="error"
        visible={true}
        onClose={vi.fn()}
      />
    );
    
    const toast = screen.getByTestId('toast');
    expect(toast).toHaveClass('bg-red-500');
  });

  it('should have correct styling for info type', () => {
    render(
      <Toast
        message="Info"
        type="info"
        visible={true}
        onClose={vi.fn()}
      />
    );
    
    const toast = screen.getByTestId('toast');
    expect(toast).toHaveClass('bg-blue-500');
  });
});

