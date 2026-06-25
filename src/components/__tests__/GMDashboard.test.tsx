import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { GMDashboard } from '../GMDashboard';
import { STORAGE_KEYS } from '../../lib/constants';

vi.mock('../GMTabContent', () => ({
  GMTabContent: ({ activeTab }: { activeTab: string }) => <div data-testid="gm-tab-content">{activeTab}</div>
}));

vi.mock('../../hooks/useAppState', () => ({
  useAppState: () => ({
    state: {
      hasInitialSynced: true,
      encounters: [],
      combatState: {
        activeEncounterId: null
      }
    }
  })
}));

describe('GMDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.stubGlobal('indexedDB', {
      open: vi.fn(() => ({
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
      })),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('When localStorage is empty, the app defaults to party', () => {
    const { getByTestId } = render(<GMDashboard />);
    expect(getByTestId('gm-tab-content').textContent).toBe('party');
  });
});

