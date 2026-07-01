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
import { useDashboardStore } from '../../../hooks/dashboardStore';

import { updateEncounterStateDB } from '../../../services/dbOperations';

vi.mock('../../../services/dbOperations', () => ({
  addNpcDB: vi.fn(),
  addEncounterCombatantDB: vi.fn(),
  updateInitiativeDB: vi.fn(),
  updateDeathSavesDB: vi.fn(),
  updateEncounterStateDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../hooks/useAppState', () => {
  const mockAppStateFn = vi.fn();
  return {
    useAppState: mockAppStateFn,
    getSnapshot: vi.fn(() => {
      try {
        const result = mockAppStateFn();
        return result?.state;
      } catch {
        return null;
      }
    }),
  };
});

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
    const mockState = {
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
        combatStarted: true,
        actionContext: { sourceOverride: null, actionType: 'attack' as any },
        combatants: [
          { id: 'combat-1', initiative: 20, conditions: '', type: 'pc', currentHp: 10 },
          { id: 'combat-2', initiative: 10, conditions: '', type: 'pc', currentHp: 10 },
        ],
      }
    };

    useDashboardStore.setState(mockState as any);
    vi.mocked(useAppState).mockReturnValue({
      state: mockState,
      updateState: (fn: any) => { 
        if (typeof fn === 'function') {
          useDashboardStore.setState(fn);
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
          combatStarted: true,
          actionContext: { sourceOverride: null, actionType: 'attack' as any },
          combatants: [
            { id: 'combat-1', initiative: 20, conditions: '', type: 'pc', currentHp: 10 },
            { id: 'combat-2', initiative: 10, conditions: '', type: 'pc', currentHp: 10 },
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
              combatStarted: true,
              actionContext: { sourceOverride: null, actionType: 'attack' as any },
              combatants: [
                { id: 'combat-1', initiative: 20, conditions: '', type: 'pc', currentHp: 10 },
                { id: 'combat-2', initiative: 10, conditions: '', type: 'pc', currentHp: 10 },
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

  it('When nextTurn advances, reactionUsed is reset to false for the newly active combatant only, leaving others unaffected', () => {
    let updateStateCalledWith: any = null;
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
          combatStarted: true,
          actionContext: { sourceOverride: null, actionType: 'attack' as any },
          combatants: [
            { id: 'combat-1', initiative: 20, conditions: '', reactionUsed: true, type: 'pc', currentHp: 10 },
            { id: 'combat-2', initiative: 10, conditions: '', reactionUsed: true, type: 'pc', currentHp: 10 },
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
              combatStarted: true,
              actionContext: { sourceOverride: null, actionType: 'attack' as any },
              combatants: [
                { id: 'combat-1', initiative: 20, conditions: '', reactionUsed: true, type: 'pc', currentHp: 10 },
                { id: 'combat-2', initiative: 10, conditions: '', reactionUsed: true, type: 'pc', currentHp: 10 },
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

    const updatedCombatants = updateStateCalledWith.combatState.combatants;
    const c1 = updatedCombatants.find((c: any) => c.id === 'combat-1');
    const c2 = updatedCombatants.find((c: any) => c.id === 'combat-2');

    expect(c2.reactionUsed).toBe(false);
    expect(c1.reactionUsed).toBe(true);
  });

  it('When nextTurn advances to an NPC with Legendary Actions, the actions are auto-reset to max while Legendary Resistances do NOT auto-reset', () => {
    let updateStateCalledWith: any = null;
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
          combatStarted: true,
          actionContext: { sourceOverride: null, actionType: 'attack' as any },
          combatants: [
            { 
              id: 'combat-1', 
              initiative: 20, 
              conditions: '', 
              reactionUsed: false,
              type: 'pc',
              currentHp: 10
            },
            { 
              id: 'combat-2', 
              initiative: 10, 
              conditions: '', 
              reactionUsed: false,
              type: 'pc',
              currentHp: 10,
              legendaryActions: { max: 3, remaining: 1 },
              legendaryResistances: { max: 3, remaining: 1 }
            },
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
              combatStarted: true,
              actionContext: { sourceOverride: null, actionType: 'attack' as any },
              combatants: [
                { 
                  id: 'combat-1', 
                  initiative: 20, 
                  conditions: '', 
                  reactionUsed: false,
                  type: 'pc',
                  currentHp: 10
                },
                { 
                  id: 'combat-2', 
                  initiative: 10, 
                  conditions: '', 
                  reactionUsed: false,
                  type: 'pc',
                  currentHp: 10,
                  legendaryActions: { max: 3, remaining: 1 },
                  legendaryResistances: { max: 3, remaining: 1 }
                },
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

    const updatedCombatants = updateStateCalledWith.combatState.combatants;
    const c2 = updatedCombatants.find((c: any) => c.id === 'combat-2');

    // legendary actions must be reset to max!
    expect(c2.legendaryActions.remaining).toBe(3);
    // legendary resistances must NOT be auto-reset!
    expect(c2.legendaryResistances.remaining).toBe(1);
  });
});
