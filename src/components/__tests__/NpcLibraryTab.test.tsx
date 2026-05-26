import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NpcLibraryTab } from '../NpcLibraryTab';
import { useAppState } from '../../hooks/useAppState';

// Mock useAppState
vi.mock('../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

// Mock dbOperations
vi.mock('../../services/dbOperations', () => ({
  resetNpcHpDB: vi.fn().mockResolvedValue({}),
}));

describe('NpcLibraryTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders "No NPCs loaded" message correctly when state contains no npcs', () => {
    vi.mocked(useAppState).mockReturnValue({
      state: {
        characters: [],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        combatState: {
          activeEncounterId: null,
          combatants: [],
          turnIndex: 0,
          round: 1,
        },
      },
      updateState: vi.fn(),
    });

    render(<NpcLibraryTab />);

    expect(screen.getByText(/No NPCs loaded in library/i)).toBeDefined();
    expect(screen.getByText(/Library Content/i)).toBeDefined();
  });

  it('renders a list of NPCs from application state', () => {
    const mockNpcs = [
      {
        id: 'npc_goblin',
        name: 'Goblin Scout',
        ac: 12,
        maxHp: 15,
        tempHp: 0,
        currentHp: 15,
        conditions: '',
        notes: 'Small and stealthy.',
      },
      {
        id: 'npc_orc',
        name: 'Orc Warrior',
        ac: 13,
        maxHp: 30,
        tempHp: 0,
        currentHp: 20, // Damaged, should display Reset HP button
        conditions: 'Poisoned',
        notes: 'Fierce battle hardened leader.',
      },
    ];

    vi.mocked(useAppState).mockReturnValue({
      state: {
        characters: [],
        encounters: [],
        npcs: mockNpcs,
        encounterCombatants: [],
        combatState: {
          activeEncounterId: null,
          combatants: [],
          turnIndex: 0,
          round: 1,
        },
      },
      updateState: vi.fn(),
    });

    render(<NpcLibraryTab />);

    // Check goblin info
    expect(screen.getByText('Goblin Scout')).toBeDefined();
    expect(screen.getByText('(AC 12)')).toBeDefined();

    // Check Orc info
    expect(screen.getByText('Orc Warrior')).toBeDefined();
    expect(screen.getByText('(AC 13)')).toBeDefined();
    expect(screen.getByText('Poisoned')).toBeDefined();

    // Check that damaged Orc has a visible Reset HP button
    const orcCard = document.getElementById('npc-card-npc_orc');
    expect(orcCard).toBeDefined();
    const resetButton = orcCard?.querySelector('#btn-reset-hp-npc_orc');
    expect(resetButton).toBeDefined();

    // The goblin shouldn't have a reset button since its current HP equals max HP
    const goblinCard = document.getElementById('npc-card-npc_goblin');
    const goblinResetBtn = goblinCard?.querySelector('#btn-reset-hp-npc_goblin');
    expect(goblinResetBtn).toBeNull();
  });
});
