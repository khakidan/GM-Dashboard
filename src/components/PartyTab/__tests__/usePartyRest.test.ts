import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useParty } from '../hooks/useParty';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import * as sheetsService from '../../../services/sheetsService';
import { queueWrite } from '../../../services/writeQueue';

vi.mock('../../../services/sheetsService', () => ({
  fetchSheetData: vi.fn(),
  updateSheetData: vi.fn(),
  appendSheetData: vi.fn(),
  batchUpdateSpreadsheet: vi.fn(),
  fetchSpreadsheetMetadata: vi.fn(),
  getSpreadsheetId: vi.fn().mockReturnValue('mock-spreadsheet-id'),
}));

vi.mock('../../../services/writeQueue', () => ({
  queueWrite: vi.fn(),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn()
}));

describe('useParty - REST and Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for findRowIndexById inside dbOperations
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['char-1'], ['pc-1'], ['pc-2'], ['pc-3'], ['pc-rest-write-1'], ['pc-longrest-write-1']] });
  });
  afterEach(() => vi.restoreAllMocks());

  it('handleLongRest resets all resource pools that restore on long rest', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ 
      id: 'char-1', 
      resourcePools: JSON.stringify([{ name: 'Rage', current: 0, max: 3, reset: 'long' }]) 
    }] };

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

    const stateUpdater = updateStateSpy.mock.calls[0][0];
    const nextState = stateUpdater(mockState);
    const updatedPools = JSON.parse(nextState.characters[0].resourcePools);
    expect(updatedPools[0].current).toBe(3);
  });

  it('handleShortRest resets only pools that restore on short rest', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ 
      id: 'char-1', 
      resourcePools: JSON.stringify([
        { name: 'Ki', current: 0, max: 3, reset: 'short' },
        { name: 'Rage', current: 0, max: 3, reset: 'long' }
      ]) 
    }] };

    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleShortRest([{ characterId: 'char-1', hpToAdd: 0, newHitDiceUsed: '{}' }]);
    });

    const stateUpdater = updateStateSpy.mock.calls[0][0];
    const nextState = stateUpdater(mockState);
    const updatedPools = JSON.parse(nextState.characters[0].resourcePools);
    
    expect(updatedPools[0].current).toBe(3); // Ki reset
    expect(updatedPools[1].current).toBe(0); // Rage not reset
  });

  it('handleLongRest resets hit dice used to empty', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ 
      id: 'char-1', 
      hitDiceConfig: '1d10',
      hitDiceUsed: '{"d10":1}'
    }] };

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

    const stateUpdater = updateStateSpy.mock.calls[0][0];
    const nextState = stateUpdater(mockState);
    expect(nextState.characters[0].hitDiceUsed).toBe('{"d10":0}');
  });

  describe('Rest Selection and Pool Logic', () => {
    it('Short rest applies ONLY to selected PCs', async () => {
      const updateStateSpy = vi.fn();
      const char1 = { id: 'pc-1', currentHp: 10, maxHp: 20, resourcePools: JSON.stringify([{ name: 'Rage', current: 3, max: 5, reset: 'short' }]) };
      const char2 = { id: 'pc-2', currentHp: 10, maxHp: 20, resourcePools: JSON.stringify([{ name: 'Ki Points', current: 1, max: 10, reset: 'short' }]) };
      const char3 = { id: 'pc-3', currentHp: 10, maxHp: 20, resourcePools: JSON.stringify([{ name: 'Spell Slots', current: 0, max: 8, reset: 'short' }]) };
      
      const mockState = { characters: [char1, char2, char3] };

      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());

      await act(async () => {
        await result.current.handleShortRest([
          { characterId: 'pc-1', hpToAdd: 0, newHitDiceUsed: '{}' },
          { characterId: 'pc-3', hpToAdd: 0, newHitDiceUsed: '{}' }
        ]);
      });

      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);

      const updatedPc1 = nextState.characters.find((c: any) => c.id === 'pc-1');
      const updatedPc2 = nextState.characters.find((c: any) => c.id === 'pc-2');
      const updatedPc3 = nextState.characters.find((c: any) => c.id === 'pc-3');

      expect(JSON.parse(updatedPc1.resourcePools)[0].current).toBe(5);
      expect(JSON.parse(updatedPc3.resourcePools)[0].current).toBe(8);
      // pc-2 was not in the results array, so it should NOT be changed by the map in useParty.ts
      expect(updatedPc2.resourcePools).toBe(char2.resourcePools);
    });

    it('Short rest does not restore long-rest pools', async () => {
      const updateStateSpy = vi.fn();
      const char = { 
        id: 'pc-1', 
        currentHp: 10,
        maxHp: 20,
        resourcePools: JSON.stringify([
          { name: 'Rage', current: 2, max: 5, reset: 'short' },
          { name: 'Superiority Dice', current: 1, max: 4, reset: 'long' }
        ]) 
      };
      const mockState = { characters: [char] };

      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());

      await act(async () => {
        await result.current.handleShortRest([{ characterId: 'pc-1', hpToAdd: 0, newHitDiceUsed: '{}' }]);
      });

      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);
      const pools = JSON.parse(nextState.characters[0].resourcePools);
      
      expect(pools.find((p: any) => p.name === 'Rage').current).toBe(5);
      expect(pools.find((p: any) => p.name === 'Superiority Dice').current).toBe(1);
    });

    it('Long rest applies ONLY to selected PCs', async () => {
      const updateStateSpy = vi.fn();
      const char1 = { 
        id: 'pc-1', 
        maxHp: 50, 
        currentHp: 10,
        resourcePools: JSON.stringify([{ name: 'Rage', current: 0, max: 5, reset: 'short' }])
      };
      const char2 = { 
        id: 'pc-2', 
        maxHp: 40, 
        currentHp: 8,
        resourcePools: JSON.stringify([{ name: 'Spell Slots', current: 0, max: 10, reset: 'long' }])
      };
      const mockState = { characters: [char1, char2] };

      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());

      await act(async () => {
        await result.current.handleLongRest(['pc-1']);
      });

      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);
      
      const updatedPc1 = nextState.characters.find((c: any) => c.id === 'pc-1');
      const updatedPc2 = nextState.characters.find((c: any) => c.id === 'pc-2');

      expect(updatedPc1.currentHp).toBe(50);
      expect(JSON.parse(updatedPc1.resourcePools)[0].current).toBe(5);
      
      expect(updatedPc2.currentHp).toBe(8);
      expect(JSON.parse(updatedPc2.resourcePools)[0].current).toBe(0);
    });

    it('Long rest restores currentHp to maxHp', async () => {
      const updateStateSpy = vi.fn();
      const char = { id: 'pc-1', currentHp: 15, maxHp: 100 };
      const mockState = { characters: [char] };

      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());

      await act(async () => {
        await result.current.handleLongRest(['pc-1']);
      });

      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);
      expect(nextState.characters[0].currentHp).toBe(100);
    });
  });

  describe('Workflows - Database Integrity', () => {
    it('short rest writes resourcePools at index 22 for selected PC', async () => {
      const char = { 
        id: 'pc-rest-write-1', 
        currentHp: 10, 
        maxHp: 20, 
        resourcePools: JSON.stringify([{ name: 'Rage', current: 2, max: 5, reset: 'short' }]) 
      };
      const mockState = { characters: [char] };
      vi.mocked(useAppState).mockReturnValue({ state: mockState as any, updateState: vi.fn(), getSnapshot: vi.fn() } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleShortRest([{ characterId: 'pc-rest-write-1', hpToAdd: 0, newHitDiceUsed: '{}' }]);
      });

      expect(queueWrite).toHaveBeenCalled();
      const calls = vi.mocked(queueWrite).mock.calls;
      const writtenRow = calls[0][2][0];
      const pools = JSON.parse(writtenRow[22]);
      expect(pools[0].name).toBe('Rage');
      expect(pools[0].current).toBe(5);
      expect(calls[0][1]).toContain('Characters!');
    });

    it('short rest does NOT call DB for unselected PCs', async () => {
      const pc1 = { id: 'pc-1', currentHp: 10, maxHp: 20, resourcePools: JSON.stringify([{ name: 'Rage', current: 2, max: 5, reset: 'short' }]) };
      const pc2 = { id: 'pc-2', currentHp: 10, maxHp: 20, resourcePools: JSON.stringify([{ name: 'Ki', current: 3, max: 10, reset: 'short' }]) };
      const mockState = { characters: [pc1, pc2] };
      vi.mocked(useAppState).mockReturnValue({ state: mockState as any, updateState: vi.fn(), getSnapshot: vi.fn() } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleShortRest([{ characterId: 'pc-1', hpToAdd: 0, newHitDiceUsed: '{}' }]);
      });

      expect(queueWrite).toHaveBeenCalledTimes(1);
      const writtenRow = vi.mocked(queueWrite).mock.calls[0][2][0];
      expect(writtenRow[0]).toBe('pc-1');
    });

    it('long rest writes currentHp, hitDiceUsed, and resourcePools to sheet at correct indices', async () => {
      const char = { 
        id: 'pc-longrest-write-1', 
        currentHp: 20, 
        maxHp: 80,
        level: 10,
        hitDiceConfig: '10d10',
        hitDiceUsed: '{"d10":5}',
        resourcePools: JSON.stringify([{ name: 'Spell Slots', current: 0, max: 8, reset: 'long' }]) 
      };
      const mockState = { characters: [char] };
      vi.mocked(useAppState).mockReturnValue({ state: mockState as any, updateState: vi.fn(), getSnapshot: vi.fn() } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleLongRest(['pc-longrest-write-1']);
      });

      expect(queueWrite).toHaveBeenCalled();
      const writtenRow = vi.mocked(queueWrite).mock.calls[0][2][0];
      
      expect(writtenRow[6]).toBe(80); // currentHp
      expect(JSON.parse(writtenRow[21])).toEqual({ d10: 0 }); // hitDiceUsed reset (recovers 5 of 5)
      const pools = JSON.parse(writtenRow[22]);
      expect(pools[0].name).toBe('Spell Slots');
      expect(pools[0].current).toBe(8);
    });

    it('long rest does NOT call DB for unselected PCs', async () => {
      const pc1 = { id: 'pc-1', currentHp: 10, maxHp: 60 };
      const pc2 = { id: 'pc-2', currentHp: 5, maxHp: 40 };
      const mockState = { characters: [pc1, pc2] };
      vi.mocked(useAppState).mockReturnValue({ state: mockState as any, updateState: vi.fn(), getSnapshot: vi.fn() } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleLongRest(['pc-1']);
      });

      expect(queueWrite).toHaveBeenCalledTimes(1);
      const writtenRow = vi.mocked(queueWrite).mock.calls[0][2][0];
      expect(writtenRow[0]).toBe('pc-1');
    });
  });
});
