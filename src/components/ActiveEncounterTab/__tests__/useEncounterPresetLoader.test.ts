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
          rechargeAbilities: [
            { name: 'Breath', rechargeOn: '5-6' }
          ],
        },
        {
          id: 'npc2',
          name: 'Goblin',
          ac: 12,
          maxHp: 10,
          currentHp: 10,
          tempHp: 0,
          legendaryActions: 0,
          legendaryResistances: undefined,
        }
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
    
    (getSnapshot as any).mockReturnValue(mockState);
  });

  describe('ERROR PATHS', () => {
    it('When the DB insert call inside handleAddNpc throws, state is rolled back to the pre-insertion snapshot', async () => {
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
      
      // Asserts that we rolled back returning exactly the snapshot
      const containsOrc = resState.combatState.combatants.some((c: any) => c.name === 'Orc');
      expect(containsOrc).toBe(false);

      expect(toast.error).toHaveBeenCalledWith('Failed to save changes. Please try again.', expect.objectContaining({
        description: 'DB Failed'
      }));
      expect(consoleErrorSpy).toHaveBeenCalledWith('[DB Error]', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('When handleAddPreset throws, state is rolled back and error is logged', async () => {
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
      // Pre-insertion length was 1
      expect(count).toBe(1);

      expect(toast.error).toHaveBeenCalledWith('Failed to save changes. Please try again.', expect.objectContaining({
        description: 'Network Error'
      }));
      expect(consoleErrorSpy).toHaveBeenCalledWith('[DB Error]', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('TEMPLATE INITIALIZATION', () => {
    it('When an NPC template has legendaryActions of 3, the created combatant has correct max and remaining', async () => {
      (addEncounterCombatantDB as any).mockResolvedValue([{ id: 'mock-ec' }]);
       const { result } = renderHook(() => useEncounterPresetLoader(undefined, vi.fn()));

       await act(async () => {
         await result.current.handleAddPreset('npc', 'npc1', 1);
       });

       const optimisticUpdater = mockUpdateState.mock.calls[0][0];
       const stateAfterOptimistic = optimisticUpdater({ ...mockState, combatState: { combatants: [] }, encounterCombatants: [] });

       const addedCombatant = stateAfterOptimistic.combatState.combatants[0];
       
       expect(addedCombatant.legendaryActions).toEqual({
         max: 3,
         remaining: 3
       });
    });

    it('When an NPC template has legendaryResistances of 2, the created combatant has the correct max and remaining values', async () => {
      (addEncounterCombatantDB as any).mockResolvedValue([{ id: 'mock-ec' }]);
       const { result } = renderHook(() => useEncounterPresetLoader(undefined, vi.fn()));

       await act(async () => {
         await result.current.handleAddPreset('npc', 'npc1', 1);
       });

       const optimisticUpdater = mockUpdateState.mock.calls[0][0];
       const stateAfterOptimistic = optimisticUpdater({ ...mockState, combatState: { combatants: [] }, encounterCombatants: [] });

       const addedCombatant = stateAfterOptimistic.combatState.combatants[0];
       
       expect(addedCombatant.legendaryResistances).toEqual({
         max: 2,
         remaining: 2
       });
    });

    it('When an NPC template has rechargeAbilities defined, each ability in the created combatant has isCharged: true', async () => {
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
         rechargeOn: '5-6',
         isCharged: true
       }]);
    });
  });

  describe('BOUNDARY CONDITIONS', () => {
    it('If the NPC template has legendaryActions of 0 or undefined, the created combatant does NOT have a legendaryActions field', async () => {
      (addEncounterCombatantDB as any).mockResolvedValue([{ id: 'mock-ec' }]);
       const { result } = renderHook(() => useEncounterPresetLoader(undefined, vi.fn()));

       await act(async () => {
         await result.current.handleAddPreset('npc', 'npc2', 1);
       });

       const optimisticUpdater = mockUpdateState.mock.calls[0][0];
       const stateAfterOptimistic = optimisticUpdater({ ...mockState, combatState: { combatants: [] }, encounterCombatants: [] });

       const addedCombatant = stateAfterOptimistic.combatState.combatants[0];
       
       expect(addedCombatant.legendaryActions).toBeUndefined();
       expect(addedCombatant.legendaryResistances).toBeUndefined();
    });
  });
});
