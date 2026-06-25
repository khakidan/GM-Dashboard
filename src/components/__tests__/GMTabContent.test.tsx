import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GMTabContent } from '../GMTabContent';
import { useAppState } from '../../hooks/useAppState';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('GMTabContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test Campaign',
        hasInitialSynced: true,
        characters: [
          { id: '1', characterName: 'Hero 1', ac: 15, maxHp: 20, currentHp: 20, tempHp: 0, conditions: '', notes: '' }
        ],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: 'enc_1',
          combatants: [],
          activeTurnId: 'c1',
          round: 1,
          concentrationLinks: {},
        },
      },
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders PartyTab when activeTab is 'party'", () => {
    render(
      <MemoryRouter>
        <GMTabContent
          activeTab="party"
          hasActiveEncounter={true}
          clearEncounter={vi.fn()}
          startEncounter={vi.fn()}
          isGoogleConnected={false}
          handleSignIn={vi.fn()}
          handleSignOut={vi.fn()}
          setIsGoogleConnected={vi.fn()}
          handleSyncWithSheets={vi.fn().mockResolvedValue(undefined)}
          addLog={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue('Hero 1')).toBeInTheDocument();
    expect(screen.queryByText('Round 1')).toBeNull();
  });
});
