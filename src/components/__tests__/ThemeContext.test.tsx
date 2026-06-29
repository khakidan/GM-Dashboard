import { STORAGE_KEYS } from '../../lib/constants';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

function TestComponent() {
  const { theme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('provides default theme value and sets data-theme on root html node', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value').textContent).toBe('sleek-modern');
    expect(document.documentElement.getAttribute('data-theme')).toBe('sleek-modern');
  });
});
