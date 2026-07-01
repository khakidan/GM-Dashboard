import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useCombatSync } from '../hooks/useCombatSync';
import { useDashboardStore, getSnapshot } from '../../../hooks/useAppState';
import {
  updateEncounterStateDB,
  updateInitiativeDB,
  deleteEncounterCombatantDB,
  updateEncounterCombatantQuantityDB,
  updateCharacterDB,
  updateNpcInstanceHpDB,
  updateNpcInstanceConditionsDB,
  updateNpcInstanceAcModDB,
} from '../../../services/dbOperations';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock('../../../services/dbOperations', () => ({
  updateEncounterStateDB: vi.fn().mockResolvedValue(true),
  updateInitiativeDB: vi.fn().mockResolvedValue(true),
  deleteEncounterCombatantDB: vi.fn().mockResolvedValue(undefined),
  updateEncounterCombatantQuantityDB: vi.fn().mockResolvedValue(undefined),
  updateCharacterDB: vi.fn().mockResolvedValue(undefined),
  updateConditionTimersDB: vi.fn().mockResolvedValue(undefined),
  updateNpcInstanceHpDB: vi.fn().mockResolvedValue(undefined),
  updateNpcInstanceConditionsDB: vi.fn().mockResolvedValue(undefined),
  updateNpcInstanceAcModDB: vi.fn().mockResolvedValue(undefined),
}));

describe('useCombatSync', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    // Setup 3 mock combatants in the store
    act(() => {
      useDashboardStore.setState({
        combatState: {
          activeEncounterId: 'enc-1',
          activeTurnId: 'c1',
          round: 1,
          selectedIds: [],
          isSelectionMode: false,
          syncingIds: [],
          expandedIds: [],
          concentrationLinks: {},
          combatStarted: true,
          combatants: [
            { id: 'c1', name: 'PC 1', type: 'pc', initiative: 20, reactionUsed: true },
            { id: 'c2', name: 'NPC 1', type: 'npc', initiative: 15, reactionUsed: true, legendaryActions: { max: 3, remaining: 1 } },
            { id: 'c3', name: 'PC 2', type: 'pc', initiative: 10, reactionUsed: true }
          ]
        },
        characters: [],
        npcs: [],
        encounters: [{ id: 'enc-1', name: 'Encounter 1' }] as any,
        encounterCombatants: []
      });
    });
  });

  it('nextTurn sorts and establishes first turn when combatStarted is false', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatStarted: false,
          activeTurnId: 'c2', // Incorrect turn before sorting
          combatants: [
            { id: 'c3', name: 'PC 2', type: 'pc', initiative: 10 },
            { id: 'c1', name: 'PC 1', type: 'pc', initiative: 20 },
            { id: 'c2', name: 'NPC 1', type: 'npc', initiative: 15 }
          ]
        }
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    // Should be sorted by initiative descending
    expect(state.combatState.combatants[0].id).toBe('c1');
    expect(state.combatState.combatants[1].id).toBe('c2');
    expect(state.combatState.combatants[2].id).toBe('c3');
    // Active turn should be the one with highest initiative
    expect(state.combatState.activeTurnId).toBe('c1');
    expect(state.combatState.combatStarted).toBe(true);
    expect(vi.mocked(updateEncounterStateDB)).toHaveBeenCalledWith('enc-1', 1, 'c1');
  });

  it('nextTurn skips NPCs at 0 HP', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: 'c1',
          combatants: [
            { id: 'c1', name: 'PC 1', type: 'pc', initiative: 20, currentHp: 50 },
            { id: 'c2', name: 'NPC 1', type: 'npc', initiative: 15, currentHp: 0 },
            { id: 'c3', name: 'PC 2', type: 'pc', initiative: 10, currentHp: 0 } // PC at 0 should NOT be skipped
          ]
        }
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    // From c1, it should skip c2 (NPC at 0 HP) and go to c3 (PC at 0 HP)
    act(() => {
      result.current.nextTurn();
    });

    const state1 = getSnapshot();
    expect(state1.combatState.activeTurnId).toBe('c3');

    // From c3, it should wrap to c1
    act(() => {
      result.current.nextTurn();
    });

    const state2 = getSnapshot();
    expect(state2.combatState.activeTurnId).toBe('c1');
    expect(state2.combatState.round).toBe(2);
  });

  it('nextTurn sets activeTurnId to null if all remaining combatants are dead NPCs', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: 'c1',
          combatants: [
            { id: 'c1', name: 'NPC 1', type: 'npc', initiative: 20, currentHp: 10 },
            { id: 'c2', name: 'NPC 2', type: 'npc', initiative: 10, currentHp: 0 }
          ]
        }
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    // Reduce c1 to 0 HP
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: prev.combatState.combatants.map(c => c.id === 'c1' ? { ...c, currentHp: 0 } : c)
        }
      }));
    });

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    expect(state.combatState.activeTurnId).toBeNull();
  });

  it('nextTurn advances activeTurnId to the next combatant in order', () => {
    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    expect(state.combatState.activeTurnId).toBe('c2');
    expect(state.combatState.round).toBe(1);
  });

  it('nextTurn increments round when wrapping from last combatant to first', () => {
    // Set active turn to the last combatant (c3)
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: 'c3'
        }
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    expect(state.combatState.activeTurnId).toBe('c1');
    expect(state.combatState.round).toBe(2);
  });

  it('nextTurn resets reactionUsed to false for the newly active combatant only', () => {
    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    const c1 = state.combatState.combatants.find(c => c.id === 'c1');
    const c2 = state.combatState.combatants.find(c => c.id === 'c2');
    const c3 = state.combatState.combatants.find(c => c.id === 'c3');

    // Newly active combatant (c2) should have reactionUsed: false
    expect(c2?.reactionUsed).toBe(false);
    // Other combatants (c1, c3) remain unchanged
    expect(c1?.reactionUsed).toBe(true);
    expect(c3?.reactionUsed).toBe(true);
  });

  it('nextTurn auto-resets legendary actions to max when an NPC becomes active', () => {
    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    const c2 = state.combatState.combatants.find(c => c.id === 'c2');

    // NPC 1 (c2) should have legendaryActions.remaining reset to max (3)
    expect(c2?.legendaryActions?.remaining).toBe(3);
  });

  it('nextTurn calls updateEncounterStateDB with the new activeTurnId', async () => {
    const { result } = renderHook(() => useCombatSync());

    await act(async () => {
      await result.current.nextTurn();
    });

    expect(vi.mocked(updateEncounterStateDB)).toHaveBeenCalledWith(
      'enc-1',        // encounter ID
      1,              // round (still 1)
      'c2'            // NEW active turn
    );
  });

  it('nextTurn calls updateEncounterStateDB with incremented round on wrap', async () => {
    // Set active turn to the last combatant (c3)
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: 'c3'
        }
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    await act(async () => {
      await result.current.nextTurn();
    });

    expect(vi.mocked(updateEncounterStateDB)).toHaveBeenCalledWith(
      'enc-1',        // encounter ID
      2,              // incremented round
      'c1'            // wraps to first
    );
  });

  it('removeCombatant calls deleteEncounterCombatantDB when quantity is 1', async () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: [
            ...prev.combatState.combatants,
            {
              id: 'c-remove',
              name: 'Goblin',
              type: 'npc',
              initiative: 5,
              encounterCombatantId: 'ec-1',
            }
          ]
        },
        encounterCombatants: [{
          id: 'ec-1',
          encounterId: 'enc-1',
          npcId: 'npc-1',
          playerId: null,
          quantity: 1,
          initiative: 5,
          conditionTimers: {},
          npcCurrentHp: 10,
          npcTempHp: 0,
          npcCurrentConditions: '',
          npcTempAcMod: 0,
        }]
      }));
    });

    const { result } = renderHook(
      () => useCombatSync()
    );

    await act(async () => {
      await result.current
        .removeCombatant('c-remove');
    });

    expect(
      vi.mocked(deleteEncounterCombatantDB)
    ).toHaveBeenCalledWith('ec-1');
  });

  it('removeCombatant calls updateEncounterCombatantQuantityDB when quantity > 1', async () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: [
            ...prev.combatState.combatants,
            {
              id: 'c-remove',
              name: 'Goblin',
              type: 'npc',
              initiative: 5,
              encounterCombatantId: 'ec-1',
            }
          ]
        },
        encounterCombatants: [{
          id: 'ec-1',
          encounterId: 'enc-1',
          npcId: 'npc-1',
          playerId: null,
          quantity: 3,
          initiative: 5,
          conditionTimers: {},
          npcCurrentHp: 10,
          npcTempHp: 0,
          npcCurrentConditions: '',
          npcTempAcMod: 0,
        }]
      }));
    });

    const { result } = renderHook(
      () => useCombatSync()
    );

    await act(async () => {
      await result.current
        .removeCombatant('c-remove');
    });

    expect(
      vi.mocked(updateEncounterCombatantQuantityDB)
    ).toHaveBeenCalledWith('ec-1', 2);
  });

  it('updateCombatant for PC calls updateCharacterDB with updated HP', async () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: [
            {
              id: 'c1',
              name: 'PC 1',
              type: 'pc',
              initiative: 20,
              characterId: 'char-1',
              encounterCombatantId: 'ec-pc-1',
              currentHp: 30,
              maxHp: 40,
              tempHp: 0,
              conditions: '',
            }
          ]
        },
        characters: [{
          id: 'char-1',
          characterName: 'Hero',
          currentHp: 30,
          maxHp: 40,
          tempHp: 0,
          conditions: '',
          level: 5,
          ac: 15,
        }] as any,
      }));
    });

    const { result } = renderHook(
      () => useCombatSync()
    );

    await act(async () => {
      await result.current.updateCombatant(
        'c1',
        { currentHp: 25 }
      );
    });

    expect(
      vi.mocked(updateCharacterDB)
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        currentHp: 25,
      }),
      expect.objectContaining({
        id: 'char-1',
      })
    );
  });

  it('updateCombatant for NPC calls updateNpcInstanceHpDB', async () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: [
            {
              id: 'c2',
              name: 'NPC 1',
              type: 'npc',
              initiative: 15,
              encounterCombatantId: 'ec-npc-1',
              currentHp: 10,
              maxHp: 20,
              tempHp: 0,
              conditions: '',
            }
          ]
        }
      }));
    });

    const { result } = renderHook(
      () => useCombatSync()
    );

    await act(async () => {
      await result.current.updateCombatant(
        'c2',
        { currentHp: 8, tempHp: 0 }
      );
    });

    expect(
      vi.mocked(updateNpcInstanceHpDB)
    ).toHaveBeenCalledWith('ec-npc-1', 8, 0);
  });

  it('rollInitForNPCs calls updateInitiativeDB for each NPC combatant', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: prev.combatState
            .combatants.map(c =>
              c.id === 'c2'
                ? { ...c,
                    encounterCombatantId:
                      'ec-npc-2' }
                : c
            )
        }
      }));
    });

    const { result } = renderHook(
      () => useCombatSync()
    );

    act(() => {
      result.current.rollInitForNPCs();
    });

    expect(
      vi.mocked(updateInitiativeDB)
    ).toHaveBeenCalledWith(
      'ec-npc-2',
      expect.any(Number)
    );
  });

  it('resetCombat calls updateInitiativeDB with 0 for each combatant', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          combatants: [
            { ...prev.combatState
                .combatants[0],
              encounterCombatantId: 'ec-1'
            },
            { ...prev.combatState
                .combatants[1],
              encounterCombatantId: 'ec-2'
            },
            { ...prev.combatState
                .combatants[2],
              encounterCombatantId: 'ec-3'
            },
          ]
        }
      }));
    });

    const { result } = renderHook(
      () => useCombatSync()
    );

    act(() => {
      result.current.resetCombat();
    });

    expect(
      vi.mocked(updateInitiativeDB)
    ).toHaveBeenCalledWith('ec-1', 0);
    expect(
      vi.mocked(updateInitiativeDB)
    ).toHaveBeenCalledWith('ec-2', 0);
    expect(
      vi.mocked(updateInitiativeDB)
    ).toHaveBeenCalledWith('ec-3', 0);
  });
});
