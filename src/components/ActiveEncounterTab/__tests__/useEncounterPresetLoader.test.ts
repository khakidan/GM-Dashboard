import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEncounterPresetLoader } from '../hooks/useEncounterPresetLoader';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { toast } from 'sonner';
import { addNpcDB, addEncounterCombatantDB } from '../../../services/dbOperations';

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('../../../services/dbOperations', () => ({
  addNpcDB: vi.fn(),
  addEncounterCombatantDB: vi.fn(),
}));

describe('useEncounterPresetLoader', () => {
  let mockState: any;
  let mockUpdateState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockState = {
      npcs: [
        {
          id: 'npc1',
          name: 'Dragon',
          ac: 18,
          maxHp: 100,
          currentHp: 100,
          tempHp: 0,
          legendaryActions: 3,
          legendaryResistances: 2,
          actions: JSON.stringify([
            { name: 'Breath', recharge: 'Recharge 5-6' }
          ]),
          rechargeAbilities: [
            { name: 'Breath', rechargeOn: '5-6' }
          ],
        },
      ],
      characters: [],
      encounterCombatants: [],
      combatState: {
        combatants: [{ id: 'c1', name: 'Existing', type: 'pc' }],
      },
      encounters: []
    };

    mockUpdateState = vi.fn().mockImplementation((updater) => {
      let newState = typeof updater === 'function' ? updater(mockState) : updater;
      mockState = { ...mockState, ...newState };
      return newState;
    });

    (useAppState as any).mockReturnValue({
      state: mockState,
      updateState: mockUpdateState,
    });
    
    (getSnapshot as any).mockImplementation(() => mockState);
  });

  it('handleAddNpc builds a combatant with correct rechargeAbilities derived from actions recharge field', async () => {
    (addNpcDB as any).mockResolvedValue({ id: 'real-npc' });
    (addEncounterCombatantDB as any).mockResolvedValue([{ id: 'real-ec' }]);

    const { result } = renderHook(() => useEncounterPresetLoader(undefined, vi.fn()));

    await act(async () => {
      await result.current.handleAddNpc({
        name: 'Orc',
        ac: 10,
        maxHp: 20,
        tempHp: 0,
        currentHp: 20,
        conditions: '',
        notes: '',
        resistances: '',
        immunities: '',
        vulnerabilities: '',
        legendaryActions: 0,
        legendaryResistances: 0,
        rechargeAbilities: [],
        abilityScores: '{}',
        proficiencies: '{}',
        speed: '',
        senses: '',
        languages: '',
        challengeRating: '',
        traits: '[]',
        actions: JSON.stringify([{ name: 'Cinderfall', recharge: 'Recharge 5-6' }]),
        reactions: '[]',
        legendaryActionsList: '[]',
        spellcastingAbility: '',
      });
    });

    const optimisticUpdater = mockUpdateState.mock.calls[0][0];
    const stateAfterOptimistic = optimisticUpdater({ ...mockState, combatState: { combatants: [] }, encounterCombatants: [] });
    const addedCombatant = stateAfterOptimistic.combatState.combatants[0];

    expect(addedCombatant.rechargeAbilities).toEqual([{
      name: 'Cinderfall',
      rechargeOn: 5,
      isCharged: true
    }]);
  });

  it('handleAddNpc rolls back state when the DB insert fails', async () => {
    (addNpcDB as any).mockRejectedValue(new Error('DB Failed'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useEncounterPresetLoader(undefined, vi.fn()));

    await expect(
      act(async () => {
        await result.current.handleAddNpc({
          name: 'Orc',
          ac: 10,
          maxHp: 20,
          tempHp: 0,
          currentHp: 20,
          conditions: '',
          notes: '',
          resistances: '',
          immunities: '',
          vulnerabilities: '',
          legendaryActions: 0,
          legendaryResistances: 0,
          rechargeAbilities: [],
          abilityScores: '{}',
          proficiencies: '{}',
          speed: '',
          senses: '',
          languages: '',
          challengeRating: '',
          traits: '[]',
          actions: '[]',
          reactions: '[]',
          legendaryActionsList: '[]',
          spellcastingAbility: '',
        });
      })
    ).rejects.toThrow('DB Failed');

    const updaterFallback = mockUpdateState.mock.calls[mockUpdateState.mock.calls.length - 1][0];
    const resState = typeof updaterFallback === 'function' ? updaterFallback(mockState) : updaterFallback;
    
    const containsOrc = resState.combatState.combatants.some((c: any) => c.name === 'Orc');
    expect(containsOrc).toBe(false);

    expect(toast.error).toHaveBeenCalledWith('Failed to add Orc to the encounter. Please try again.', expect.objectContaining({
      description: 'DB Failed'
    }));

    consoleErrorSpy.mockRestore();
  });

  it('handleAddPreset rolls back state when the DB insert fails', async () => {
    (addEncounterCombatantDB as any).mockRejectedValue(new Error('Network Error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useEncounterPresetLoader(undefined, vi.fn()));

    await expect(
      act(async () => {
        await result.current.handleAddPreset('npc', 'npc1', 1);
      })
    ).rejects.toThrow('Network Error');

    const updaterFallback = mockUpdateState.mock.calls[mockUpdateState.mock.calls.length - 1][0];
    const resState = typeof updaterFallback === 'function' ? updaterFallback(mockState) : updaterFallback;
    
    const count = resState.combatState.combatants.length;
    expect(count).toBe(1);

    expect(toast.error).toHaveBeenCalledWith('Failed to add Dragon to the encounter. Please try again.', expect.objectContaining({
      description: 'Network Error'
    }));

    consoleErrorSpy.mockRestore();
  });

  it('handleAddPreset derives rechargeAbilities from npcTemplate.actions correctly', async () => {
    (addEncounterCombatantDB as any).mockResolvedValue([{ id: 'mock-ec' }]);
    const { result } = renderHook(() => useEncounterPresetLoader(undefined, vi.fn()));

    await act(async () => {
      await result.current.handleAddPreset('npc', 'npc1', 1);
    });

    const optimisticUpdater = mockUpdateState.mock.calls[0][0];
    const stateAfterOptimistic = optimisticUpdater({ ...mockState, combatState: { combatants: [] }, encounterCombatants: [] });
    const addedCombatant = stateAfterOptimistic.combatState.combatants[0];
    
    expect(addedCombatant.rechargeAbilities).toEqual([{
      name: 'Breath',
      rechargeOn: 5,
      isCharged: true
    }]);
  });

  it('verifies rollback captures state BEFORE optimistic update', async () => {
    // 1. Initial state has 1 combatant
    const initialState = { ...mockState };
    (addEncounterCombatantDB as any).mockRejectedValue(new Error('Rollback Test Error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useEncounterPresetLoader(undefined, vi.fn()));

    await expect(
      act(async () => {
        await result.current.handleAddPreset('npc', 'npc1', 1);
      })
    ).rejects.toThrow('Rollback Test Error');

    // The last call to updateState should be the rollback
    const rollbackUpdater = mockUpdateState.mock.calls[mockUpdateState.mock.calls.length - 1][0];
    const rolledBackState = typeof rollbackUpdater === 'function' ? rollbackUpdater(mockState) : rollbackUpdater;

    // 2. State should be back to 1 combatant, NOT 2
    expect(rolledBackState.combatState.combatants.length).toBe(1);
    expect(rolledBackState.combatState.combatants[0].name).toBe('Existing');
    
    // Explicitly verify it's NOT the optimistic state (which would have 2 combatants)
    expect(rolledBackState.combatState.combatants.length).not.toBe(2);

    consoleErrorSpy.mockRestore();
  });
});
