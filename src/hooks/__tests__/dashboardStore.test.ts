import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '../dashboardStore';

describe('useDashboardStore', () => {
  beforeEach(() => {
    useDashboardStore.setState({
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
      },
    });
  });

  it('characters are empty on initial state', () => {
    const state = useDashboardStore.getState();
    expect(state.characters).toEqual([]);
  });

  it('setCharacters replaces the characters array', () => {
    const mockCharacter = { id: 'char-1', characterName: 'Fighter', maxHp: 10 } as any;
    useDashboardStore.getState().updateState({
      characters: [mockCharacter],
    });
    expect(useDashboardStore.getState().characters).toEqual([mockCharacter]);
  });

  it('setCombatState updates combatants in the combat state', () => {
    const mockCombatant = { id: 'comb-1', name: 'Goblin', currentHp: 8 } as any;
    useDashboardStore.getState().updateState((prev) => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        combatants: [mockCombatant],
      },
    }));
    expect(useDashboardStore.getState().combatState.combatants).toEqual([mockCombatant]);
  });

  it('updateCombatant updates a single combatant by id without affecting others', () => {
    const comb1 = { id: 'comb-1', name: 'Goblin 1', currentHp: 8 } as any;
    const comb2 = { id: 'comb-2', name: 'Goblin 2', currentHp: 10 } as any;
    useDashboardStore.setState({
      combatState: {
        activeEncounterId: 'enc-1',
        activeTurnId: 'comb-1',
        round: 1,
        combatants: [comb1, comb2],
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
      },
    });

    useDashboardStore.getState().updateState((prev) => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        combatants: prev.combatState.combatants.map((c) =>
          c.id === 'comb-1' ? { ...c, currentHp: 5 } : c
        ),
      },
    }));

    const combatants = useDashboardStore.getState().combatState.combatants;
    expect(combatants.find((c) => c.id === 'comb-1')?.currentHp).toBe(5);
    expect(combatants.find((c) => c.id === 'comb-2')?.currentHp).toBe(10);
  });
});
