import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
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

  it('catches a render error and displays the fallback UI instead of crashing', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.queryByTestId('child')).toBeNull();
    expect(screen.getByText('Something went wrong on this page')).not.toBeNull();
    expect(screen.getByText('Simulated intentional render/compile error')).not.toBeNull();
  });
});
