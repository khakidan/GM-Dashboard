import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GMTabContent } from '../GMTabContent';
import { useAppState } from '../../hooks/useAppState';
import { MemoryRouter } from 'react-router-dom';

// Mock useAppState
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
        encounters: [
          { id: 'enc_1', name: 'Goblins!', location: 'Forest', difficultyId: '1', currentRound: 0 }
        ],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: 'enc_1',
          combatants: [
            { id: 'c1', name: 'Hero 1', type: 'pc', initiative: 12, ac: 15, maxHp: 20, currentHp: 20, tempHp: 0, conditions: '', notes: '' }
          ],
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

  it("renders ActiveEncounterTab when activeTab is 'combat'", () => {
    render(
      <MemoryRouter>
        <GMTabContent
          activeTab="combat"
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

    expect(screen.getByText('Goblins!')).toBeInTheDocument();
    expect(screen.getByText('Round 1')).toBeInTheDocument();
  });

  it('does not render multiple tabs simultaneously', () => {
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

    expect(screen.queryByText('Goblins!')).toBeNull();
  });

  it("renders NPCLibraryTab when activeTab is 'npc-library'", () => {
    render(
      <MemoryRouter>
        <GMTabContent
          activeTab="npc-library"
          hasActiveEncounter={false}
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

    // NPCLibraryTab renders search/add button or relevant page headers
    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
  });

  it('falls back gracefully to EncountersTab if activeTab is unrecognized', () => {
    render(
      <MemoryRouter>
        <GMTabContent
          activeTab={'invalid-tab' as any}
          hasActiveEncounter={false}
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

    // Should fall back to encounters tab which shows "Encounters Library" from state
    expect(screen.getByText('Encounters Library')).toBeInTheDocument();
  });
});
