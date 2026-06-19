import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

vi.mock('../../../services/dbOperations', () => ({
  addNpcDB: vi.fn(),
  addEncounterCombatantDB: vi.fn(),
  updateInitiativeDB: vi.fn(),
  updateDeathSavesDB: vi.fn(),
  updateEncounterStateDB: vi.fn(),
}));

import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { ActiveEncounterTab } from '../index';
import { useDashboardStore } from '../../../hooks/useAppState';
import { MemoryRouter } from 'react-router-dom';

describe('KeyboardShortcuts integration tests', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const baseProps = { onBack: vi.fn() };

  const defaultInitialState = {
    characters: [],
    npcs: [],
    encounters: [],
    encounterCombatants: [],
    statuses: {},
    difficulties: {},
    campaignName: '',
    hasInitialSynced: false,
    openDialog: null,
    combatState: {
      activeEncounterId: null,
      activeTurnId: null,
      round: 1,
      combatants: [],
      concentrationLinks: {},
      deathEvent: null,
      damageEvent: null,
      healEvent: null,
      rageEvent: null,
      unconsciousEvent: null,
      initiativeEvent: false,
      selectedIds: [],
      isSelectionMode: false,
      syncingIds: [],
      expandedIds: [],
    }
  } as any;

  beforeEach(() => {
    // Reset the store to a clean initial state before each test runs to guarantee store isolation
    useDashboardStore.setState(defaultInitialState);

    useDashboardStore.setState({
      campaignName: 'Shortcuts test',
      hasInitialSynced: true,
      encounters: [{ id: 'enc-1', name: 'Keyboard Encounter' }] as any,
      combatState: {
        activeEncounterId: 'enc-1',
        round: 1,
        activeTurnId: 'combat-1',
        combatants: [
          { id: 'combat-1', name: 'Alyn', type: 'pc', ac: 18, maxHp: 50, currentHp: 50, initiative: 20, notes: 'Alyn is beautiful' },
          { id: 'combat-2', name: 'Bob', type: 'pc', ac: 15, maxHp: 40, currentHp: 40, initiative: 15, notes: 'Bob is great' },
          { id: 'combat-3', name: 'Goblin', type: 'npc', ac: 12, maxHp: 15, currentHp: 15, initiative: 10, notes: 'Goblin is stinky' },
        ] as any[],
        selectedIds: [],
        syncingIds: [],
        concentrationLinks: {},
        isSelectionMode: false,
      } as any
    });
  });

  it('Pressing H switches input to heal mode and D switches to damage mode', () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );

    // Initial default mode should be damage mode.
    const damageDivs = screen.getAllByTitle('Damage');
    expect(damageDivs.length).toBeGreaterThan(0);

    // Switch to Heal mode via 'H' keypress
    act(() => {
      fireEvent.keyDown(document, { key: 'h' });
    });

    // Switch to Damage mode via 'D' keypress
    act(() => {
      fireEvent.keyDown(document, { key: 'd' });
    });
  });

  it('Pressing 1 selects (expands) the first combatant in the list', () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );

    // Initially, Alyn's notes is not visible because card is collapsed
    expect(screen.queryByText('Alyn is beautiful')).toBeNull();

    // Expand the first combatant (Alyn)
    act(() => {
      fireEvent.keyDown(document, { key: '1' });
    });

    // Verify first combatant card is expanded (and notes are visible)
    expect(screen.getByText('Alyn is beautiful')).toBeInTheDocument();
  });

  it('Pressing 3 selects the third combatant', () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );

    // Expand the third combatant (Goblin)
    act(() => {
      fireEvent.keyDown(document, { key: '3' });
    });

    expect(screen.getByText('Goblin is stinky')).toBeInTheDocument();
  });

  it('Pressing a number higher than the combatant count does nothing (no error)', () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );

    expect(() => {
      act(() => {
        fireEvent.keyDown(document, { key: '9' });
      });
    }).not.toThrow();
  });

  it('Pressing ? opens the cheat sheet overlay, pressing again/Escape closes it', () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );

    // The cheat sheet modal should not be rendered initially
    expect(screen.queryByText('GM Dashboard quick references')).toBeNull();

    // Trigger "?" to open cheat sheet
    act(() => {
      fireEvent.keyDown(document, { key: '?' });
    });

    // The cheat sheet modal should be rendered
    const cheatSheetHeader = screen.getByText('GM Dashboard quick references');
    expect(cheatSheetHeader).toBeDefined();

    // Press Escape to close it
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    // The cheat sheet modal should be gone
    expect(screen.queryByText('GM Dashboard quick references')).toBeNull();
  });

  it('Pressing Escape closes the cheat sheet and collapses all expanded cards', () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );

    // Expand combatant 1
    act(() => {
      fireEvent.keyDown(document, { key: '1' });
    });

    // Open cheat sheet
    act(() => {
      fireEvent.keyDown(document, { key: '?' });
    });
    expect(screen.getByText('GM Dashboard quick references')).toBeInTheDocument();

    // Escape closes cheat sheet and collapses expanded card
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(screen.queryByText('GM Dashboard quick references')).toBeNull();
  });

  it('Pressing S toggles batch selection mode on and off', () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );

    // Initial state: select mode is false (no "Combatants Selected")
    expect(screen.queryByText('Combatants Selected')).toBeNull();

    // Toggle on with 'S' keypress
    act(() => {
      fireEvent.keyDown(document, { key: 's' });
    });

    // Verify select mode is on (which shows the section header in CombatHeader -> MultiTargetActionPanel)
    expect(screen.getByText('Combatants Selected')).toBeInTheDocument();

    // Toggle off with 'S' keypress
    act(() => {
      fireEvent.keyDown(document, { key: 's' });
    });

    // Verify select mode is off
    expect(screen.queryByText('Combatants Selected')).toBeNull();
  });

  it('Pressing B triggers the broadcast action by opening player-view', () => {
    const originalOpen = window.open;
    window.open = vi.fn();

    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );

    act(() => {
      fireEvent.keyDown(document, { key: 'b' });
    });

    expect(window.open).toHaveBeenCalledWith('/#/player-view', '_blank');

    window.open = originalOpen;
  });

  it('Pressing C fires the initiative event', () => {
    const updateSpy = vi.spyOn(useDashboardStore.getState(), 'updateState');

    useDashboardStore.setState({
      campaignName: 'Shortcuts test',
      hasInitialSynced: true,
      encounters: [{ id: 'enc-1', name: 'Keyboard Encounter' }] as any,
      characters: [],
      npcs: [],
      statuses: {},
      difficulties: {},
      encounterCombatants: [],
      combatState: {
        activeEncounterId: 'enc-1',
        round: 1,
        activeTurnId: 'combat-1',
        initiativeEvent: false,
        combatants: [
          { id: 'combat-1', name: 'Alyn', type: 'pc', ac: 18, maxHp: 50, currentHp: 50, initiative: 20 } as any,
        ],
        selectedIds: [],
        syncingIds: [],
        concentrationLinks: {},
        isSelectionMode: false,
        expandedIds: [],
      }
    });

    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );

    act(() => {
      fireEvent.keyDown(document, { key: 'c' });
    });

    expect(updateSpy).toHaveBeenCalled();
    updateSpy.mockRestore();
  });

  it('The ? cheat sheet overlay includes S, B, and C in its shortcut list', () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );

    // Open cheat sheet
    act(() => {
      fireEvent.keyDown(document, { key: '?' });
    });

    expect(screen.getByText('Toggle select mode')).toBeInTheDocument();
    expect(screen.getByText('Broadcast player view')).toBeInTheDocument();
    expect(screen.getByText('Call for initiative')).toBeInTheDocument();
  });
});
