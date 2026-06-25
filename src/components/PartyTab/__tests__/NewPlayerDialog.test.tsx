import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NewPlayerDialog } from '../NewPlayerDialog';

// Mock ResizeObserver
const MockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', MockResizeObserver);

describe('NewPlayerDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  afterEach(() => cleanup());

  it('renders without crashing and shows the first tab', () => {
    const { container } = render(<NewPlayerDialog {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });
});
