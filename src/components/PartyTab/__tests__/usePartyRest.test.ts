import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useParty } from '../hooks/useParty';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { updateCharacterDB } from '../../../services/dbOperations';
import { makeCharacter } from '../../../__tests__/fixtures/characterFixtures';

vi.mock('../../../services/dbOperations', () => ({
  updateCharacterDB: vi.fn(),
  addCharacterDB: vi.fn(),
  deleteCharacterFully: vi.fn(),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

const mockFireConcentrationAlert = vi.fn();
vi.mock('../../../lib/concentrationCheck', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/concentrationCheck')>();
  return {
    ...actual,
    fireConcentrationAlert: (...args: any[]) => mockFireConcentrationAlert(...args),
  };
});

describe('useParty - REST and Recovery', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.resetAllMocks(); });

  describe('handleLongRest basic expectations', () => {
    it('handleLongRest with [id1] applies long rest only to character id1, not to id2', async () => {
      const mockActiveChar1 = makeCharacter({ id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 100, currentHp: 50, conditions: 'exhaustion 4', tempHpMax: 0, tempHp: 0, hitDiceConfig: '4d12', hitDiceUsed: '{"d12":2}' });
      const mockActiveChar2 = makeCharacter({ id: 'char-2', characterName: 'Drogar', isActive: true, maxHp: 160, currentHp: 80, conditions: '', tempHpMax: 0, tempHp: 0, hitDiceConfig: '4d10', hitDiceUsed: '{"d10":2}' });

      const mockState = {
        characters: [mockActiveChar1, mockActiveChar2],
        combatState: {
          combatants: []
        }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleLongRest(['char-1']);
      });

      expect(updateStateSpy).toHaveBeenCalled();
      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);

      const updatedMaeve = nextState.characters.find((c: any) => c.id === 'char-1');
      const updatedDrogar = nextState.characters.find((c: any) => c.id === 'char-2');

      // Maeve is updated
      expect(updatedMaeve.currentHp).toBe(100);
      expect(updatedMaeve.tempHp).toBe(0);
      // Drogar is NOT updated because his ID was not passed
      expect(updatedDrogar.currentHp).toBe(80);
    });

    it('handleLongRest restores currentHp to maxHp and calls applyLongRestHitDiceRecovery for selected characters', async () => {
      const mockActiveChar1 = makeCharacter({ id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 100, currentHp: 50, conditions: 'exhaustion 4', tempHpMax: 0, tempHp: 0, hitDiceConfig: '4d12', hitDiceUsed: '{"d12":2}' });

      const mockState = {
        characters: [mockActiveChar1],
        combatState: {
          combatants: []
        }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleLongRest(['char-1']);
      });

      expect(updateStateSpy).toHaveBeenCalled();
      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);

      const updatedMaeve = nextState.characters.find((c: any) => c.id === 'char-1');
      expect(updatedMaeve.currentHp).toBe(100);
      // d12 pool of 4, recover ceil(4/2) = 2, so 2 - 2 = 0 used
      expect(updatedMaeve.hitDiceUsed).toBe('{"d12":0}');

      expect(updateCharacterDB).toHaveBeenCalledWith(expect.objectContaining({
        currentHp: 100,
        hitDiceUsed: '{"d12":0}'
      }), mockActiveChar1);
    });
  });

  describe('handleShortRest basic expectations', () => {
    it('handleShortRest adds hpToAdd to currentHp without exceeding maxHp and updates hitDiceUsed', async () => {
      const mockActiveChar = { id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 50, currentHp: 20, tempHp: 5, hitDiceConfig: '4d8', hitDiceUsed: '{"d8":1}' };
      
      const mockState = {
        characters: [mockActiveChar],
        combatState: { combatants: [] }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      vi.mocked(updateCharacterDB).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleShortRest([
          { characterId: 'char-1', hpToAdd: 40, newHitDiceUsed: '{"d8":2}' }
        ]);
      });

      // Verify the state updater function restores and maps correctly
      expect(updateStateSpy).toHaveBeenCalled();
      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);
      
      const updatedActive = nextState.characters.find((c: any) => c.id === 'char-1');

      // Max HP is 50, temp HP is 5. Max allowed HP is maxHp + tempHp = 55. But 20 + 40 = 60. So capped at 55.
      expect(updatedActive.currentHp).toBe(55);
      expect(updatedActive.hitDiceUsed).toBe('{"d8":2}');

      // Verify updateCharacterDB called
      expect(updateCharacterDB).toHaveBeenCalledWith({ currentHp: 55, hitDiceUsed: '{"d8":2}', resourcePools: '[]' }, mockActiveChar);
    });

    it('handleShortRest rolls back on DB failure', async () => {
      const mockActiveChar = { id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 50, currentHp: 20, tempHp: 0, hitDiceConfig: '4d12', hitDiceUsed: '{"d12":1}' };
      
      const mockState = {
        characters: [mockActiveChar],
        combatState: { combatants: [] }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      vi.mocked(updateCharacterDB).mockRejectedValue(new Error('DB Error'));

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleShortRest([
          { characterId: 'char-1', hpToAdd: 10, newHitDiceUsed: '{"d12":2}' }
        ]);
      });

      // Verification of rollback
      expect(updateStateSpy).toHaveBeenCalledWith(mockState);
      expect(result.current.globalError).toBe('Failed to save short rest. Please try again.');
    });
  });

  describe('hitDice specific DB write path tests (REST)', () => {
    it('calls updateCharacterDB with the new hitDiceUsed when handleShortRest completes', async () => {
      const mockChar = { id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 50, currentHp: 20, hitDiceConfig: '4d12', hitDiceUsed: '{"d12":1}' };
      const mockState = {
        characters: [mockChar],
        combatState: { combatants: [] }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);
      vi.mocked(updateCharacterDB).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleShortRest([
          { characterId: 'char-1', hpToAdd: 15, newHitDiceUsed: '{"d12":2}' }
        ]);
      });

      expect(updateCharacterDB).toHaveBeenCalledWith({ currentHp: 35, hitDiceUsed: '{"d12":2}', resourcePools: '[]' }, mockChar);
    });

    it('calls updateCharacterDB with partially recovered hitDiceUsed for 7d8 config (7 spent -> 3 spent) when handleLongRest completes', async () => {
      const mockChar = {
        id: 'char-7d8',
        characterName: 'Caleb',
        isActive: true,
        maxHp: 40,
        currentHp: 10,
        hitDiceConfig: '7d8',
        hitDiceUsed: '{"d8":7}',
        tempHpMax: 0,
        tempHp: 0,
        deathSavesFails: 0,
        deathSavesSuccesses: 0
      };
      const mockState = {
        characters: [mockChar],
        combatState: { combatants: [] }
      };

      const updateStateSpy = vi.fn();
      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);
      vi.mocked(updateCharacterDB).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleLongRest(['char-7d8']);
      });

      expect(updateCharacterDB).toHaveBeenCalledWith({
        currentHp: 40,
        tempHp: 0,
        hitDiceUsed: '{"d8":3}',
        deathSavesFails: 0,
        deathSavesSuccesses: 0,
        resourcePools: '[]'
      }, mockChar);
    });

    it('handleLongRest writes partially recovered hitDiceUsed and not default {}', async () => {
      const mockChar = { id: 'char-1', characterName: 'Maeve', isActive: true, maxHp: 50, currentHp: 20, hitDiceConfig: '7d8', hitDiceUsed: '{"d8":7}', tempHpMax: 0, tempHp: 0, deathSavesFails: 0, deathSavesSuccesses: 0 };
      const mockState = { characters: [mockChar], combatState: { combatants: [] } };
      vi.mocked(useAppState).mockReturnValue({ state: mockState as any, updateState: vi.fn(), getSnapshot: vi.fn() } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);
      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleLongRest(['char-1']);
      });
      expect(updateCharacterDB).toHaveBeenCalledWith(expect.objectContaining({
        hitDiceUsed: '{"d8":3}'
      }), mockChar);
    });
  });
});
