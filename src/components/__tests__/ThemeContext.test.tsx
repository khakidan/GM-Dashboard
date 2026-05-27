import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme, VisualStyle } from '../../context/ThemeContext';

function TestComponent() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={() => setTheme('sleek-modern')} data-testid="btn-sleek">
        Set Sleek Modern
      </button>
      <button onClick={() => setTheme('dnd')} data-testid="btn-dnd">
        Set DnD
      </button>
    </div>
  );
}

function ErrorThrowingComponent() {
  useTheme();
  return <div>No Error</div>;
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

    expect(screen.getByTestId('theme-value').textContent).toBe('default');
    expect(document.documentElement.getAttribute('data-theme')).toBe('default');
  });

  it('can switch theme and persist to localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const btnSleek = screen.getByTestId('btn-sleek');
    fireEvent.click(btnSleek);

    expect(screen.getByTestId('theme-value').textContent).toBe('sleek-modern');
    expect(localStorage.getItem('gm_visual_style')).toBe('sleek-modern');
    expect(document.documentElement.getAttribute('data-theme')).toBe('sleek-modern');

    const btnDnd = screen.getByTestId('btn-dnd');
    fireEvent.click(btnDnd);

    expect(screen.getByTestId('theme-value').textContent).toBe('dnd');
    expect(localStorage.getItem('gm_visual_style')).toBe('dnd');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dnd');
  });

  it('restores theme from local storage on bootstrap', () => {
    localStorage.setItem('gm_visual_style', 'sleek-modern');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value').textContent).toBe('sleek-modern');
    expect(document.documentElement.getAttribute('data-theme')).toBe('sleek-modern');
  });

  it('throws an error if used outside ThemeProvider', () => {
    expect(() => render(<ErrorThrowingComponent />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    );
  });
});
