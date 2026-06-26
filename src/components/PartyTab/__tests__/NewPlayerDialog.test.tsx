import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NewPlayerDialog } from '../NewPlayerDialog';
import { getResourcePoolSuggestions } from '../../../lib/resourcePoolScaling';

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

  it('getResourcePoolSuggestions returns correct Rage max for a level 6 Barbarian', () => {
    const suggestions = getResourcePoolSuggestions('Barbarian', 6, []);
    const rage = suggestions.find(s => s.name.toLowerCase() === 'rage');
    expect(rage).toBeDefined();
    expect(rage!.suggestedMax).toBe(4);
  });

  it('getResourcePoolSuggestions returns correct Ki Points max for a level 5 Monk', () => {
    const suggestions = getResourcePoolSuggestions('Monk', 5, []);
    const ki = suggestions.find(s => s.name.toLowerCase() === 'ki points');
    expect(ki).toBeDefined();
    expect(ki!.suggestedMax).toBe(5);
  });

  it('getResourcePoolSuggestions returns level-1 defaults for a level 1 Barbarian', () => {
    const suggestions = getResourcePoolSuggestions('Barbarian', 1, []);
    const rage = suggestions.find(s => s.name.toLowerCase() === 'rage');
    expect(rage).toBeDefined();
    expect(rage!.suggestedMax).toBe(2);
  });
});
