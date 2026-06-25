import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PlayerView } from '../PlayerView';
import { useAppState } from '../../hooks/useAppState';

// Mock the useAppState hook
vi.mock('../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('PlayerView Component', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // Test 1: When combatState has no active encounter the component renders a waiting/standby message
  it('renders a waiting/standby message when combatState has no active encounter', () => {
    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test Campaign',
        hasInitialSynced: true,
        characters: [],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: null,
          combatants: [],
          activeTurnId: null,
          round: 1,
          concentrationLinks: {},
        },
      },
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    } as any);

    render(<PlayerView />);
    expect(screen.getByText(/Waiting for GM to start the encounter/i)).toBeInTheDocument();
    expect(screen.queryByText(/Round/i)).toBeNull();
  });
});
