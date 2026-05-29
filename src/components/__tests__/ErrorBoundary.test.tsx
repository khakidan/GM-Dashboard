// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

function BuggyComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Simulated intentional render/compile error');
  }
  return <div data-testid="child">No error here</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.queryByTestId('child')).not.toBeNull();
    expect(screen.queryByText('Something went wrong on this page')).toBeNull();
  });

  it('renders the fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.queryByTestId('child')).toBeNull();
    expect(screen.getByText('Something went wrong on this page')).not.toBeNull();
    expect(screen.getByText('Simulated intentional render/compile error')).not.toBeNull();
  });

  it('the Try Again button resets the error state and re-renders children', () => {
    let shouldThrow = true;
    const { rerender } = render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong on this page')).not.toBeNull();

    shouldThrow = false;
    rerender(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    const tryAgainBtn = screen.getByText('Try Again');
    fireEvent.click(tryAgainBtn);

    expect(screen.queryByText('Something went wrong on this page')).toBeNull();
    expect(screen.queryByTestId('child')).not.toBeNull();
  });
});
