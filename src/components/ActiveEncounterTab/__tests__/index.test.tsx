// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ActiveEncounterTab } from '../index';
import { useAppState } from '../../../hooks/useAppState';

import { updateEncounterStateDB } from '../../../services/dbOperations';

vi.mock('../../../services/dbOperations', () => ({
  addNpcDB: vi.fn(),
  addEncounterCombatantDB: vi.fn(),
  updateInitiativeDB: vi.fn(),
  updateDeathSavesDB: vi.fn(),
  updateEncounterStateDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn(),
}));

import { MemoryRouter } from 'react-router-dom';

describe('ActiveEncounterTab nextTurn logic', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const baseProps = { onBack: vi.fn() };

  it('When nextTurn is called, updateEncounterStateDB is called with the updated activeTurnId', async () => {
    // Create initial state with 2 combatants
    let updateStateCalledWith: any;
    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test',
        hasInitialSynced: true,
        encounters: [{ id: 'enc-1', name: 'Test Enc' }],
        characters: [],
        npcs: [],
        statuses: {},
        difficulties: {},
        encounterCombatants: [],
        combatState: {
          activeEncounterId: 'enc-1',
          round: 1,
          activeTurnId: 'combat-1',
          combatants: [
            { id: 'combat-1', initiative: 20, conditions: '' },
            { id: 'combat-2', initiative: 10, conditions: '' },
          ],
        }
      },
      updateState: (fn: any) => { 
        if (typeof fn === 'function') {
          updateStateCalledWith = fn({
            combatState: {
              activeEncounterId: 'enc-1',
              round: 1,
              activeTurnId: 'combat-1',
              combatants: [
                { id: 'combat-1', initiative: 20, conditions: '' },
                { id: 'combat-2', initiative: 10, conditions: '' },
              ],
            }
          });
        }
      }
    } as any);

    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );

    const nextTurnBtn = screen.getByRole('button', { name: /Next Turn/i });
    fireEvent.click(nextTurnBtn);

    expect(updateEncounterStateDB).toHaveBeenCalledWith('enc-1', 1, 'combat-2');
  });

  it('When nextTurn wraps around to the first combatant, updateEncounterStateDB is called with an incremented round number', async () => {
    // Create initial state with 2 combatants, current active is the last one
    let updateStateCalledWith: any;
    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test',
        hasInitialSynced: true,
        encounters: [{ id: 'enc-1', name: 'Test Enc' }],
        characters: [],
        npcs: [],
        statuses: {},
        difficulties: {},
        encounterCombatants: [],
        combatState: {
          activeEncounterId: 'enc-1',
          round: 1,
          activeTurnId: 'combat-2',
          combatants: [
            { id: 'combat-1', initiative: 20, conditions: '' },
            { id: 'combat-2', initiative: 10, conditions: '' },
          ],
        }
      },
      updateState: (fn: any) => { 
        if (typeof fn === 'function') {
          updateStateCalledWith = fn({
            combatState: {
              activeEncounterId: 'enc-1',
              round: 1,
              activeTurnId: 'combat-2',
              combatants: [
                { id: 'combat-1', initiative: 20, conditions: '' },
                { id: 'combat-2', initiative: 10, conditions: '' },
              ],
            }
          });
        }
      }
    } as any);

    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );

    const nextTurnBtn = screen.getByRole('button', { name: /Next Turn/i });
    fireEvent.click(nextTurnBtn);

    expect(updateEncounterStateDB).toHaveBeenCalledWith('enc-1', 2, 'combat-1');
  });
});
