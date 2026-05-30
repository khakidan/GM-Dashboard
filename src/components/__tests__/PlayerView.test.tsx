// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PlayerView } from '../PlayerView';
import { useAppState } from '../../hooks/useAppState';
import { getHealthStatus } from '../../lib/combatLogic';
import type { Combatant } from '../../types';

// Mock the useAppState hook
vi.mock('../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('PlayerView Component', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // Test 1: When combatState has no active encounter the component renders a waiting/standby message
  it('renders a waiting/standby message when combatState has no active encounter', () => {
    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test Campaign',
        characters: [],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: null,
          combatants: [],
          activeTurnId: null,
          round: 1,
        },
      },
      updateState: vi.fn(),
    });

    render(<PlayerView />);
    expect(screen.getByText(/Waiting for GM to start the encounter/i)).toBeDefined();
    expect(screen.queryByText(/Round/i)).toBeNull();
  });

  // Test 2: When combatants are present each combatant name is rendered
  it('renders each combatant name (first word) when combatants are present', () => {
    const combatants: Combatant[] = [
      { id: 'c1', name: 'Lidda Halfling', type: 'pc', ac: 15, maxHp: 30, currentHp: 30, initiative: 15, passivePerception: 12 },
      { id: 'c2', name: 'Orkish Marauder', type: 'npc', ac: 13, maxHp: 20, currentHp: 15, initiative: 10, passivePerception: 10 },
    ];

    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test Campaign',
        characters: [],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: 'enc-123',
          combatants,
          activeTurnId: null,
          round: 1,
        },
      },
      updateState: vi.fn(),
    });

    render(<PlayerView />);
    expect(screen.getByText('Lidda Halfling')).toBeDefined();
    expect(screen.getByText('Orkish Marauder')).toBeDefined();
  });

  // Test 3: The health status label (Healthy, Injured, Bloodied, Defeated) is shown correctly for each combatant based on their HP ratio, using the getHealthStatus function from combatLogic.ts
  // Test 4: A combatant with currentHp of 0 shows the Defeated status
  // Test 5: A combatant with currentHp equal to maxHp shows the Healthy status
  it('displays the correct health status label (Full, Healthy, Injured, Bloodied, Defeated) using getHealthStatus from combatLogic.ts', () => {
    const combatants: Combatant[] = [
      { id: 'c1', name: 'Althea', type: 'pc', ac: 15, maxHp: 20, currentHp: 20, initiative: 20, passivePerception: 12 }, // Full (20/20 = 1.0)
      { id: 'c1_2', name: 'Alt', type: 'pc', ac: 15, maxHp: 20, currentHp: 19, initiative: 18, passivePerception: 12 }, // Healthy (19/20)
      { id: 'c2', name: 'Bergar', type: 'pc', ac: 15, maxHp: 20, currentHp: 15, initiative: 15, passivePerception: 12 }, // Injured (15/20 = 0.75)
      { id: 'c3', name: 'Clarissa', type: 'pc', ac: 15, maxHp: 20, currentHp: 8, initiative: 10, passivePerception: 12 },  // Bloodied (8/20 = 0.4)
      { id: 'c4', name: 'Doran', type: 'pc', ac: 15, maxHp: 20, currentHp: 0, initiative: 5, passivePerception: 12 },   // Defeated (0/20 = 0.0)
    ];

    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test Campaign',
        characters: [],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: 'enc-123',
          combatants,
          activeTurnId: null,
          round: 2,
        },
      },
      updateState: vi.fn(),
    });

    render(<PlayerView />);

    // Validate each expected status text on screen
    expect(screen.getByText('Full')).toBeDefined();
    expect(screen.getByText('Healthy')).toBeDefined();
    expect(screen.getByText('Injured')).toBeDefined();
    expect(screen.getByText('Bloodied')).toBeDefined();
    expect(screen.getByText('Defeated')).toBeDefined();

    // Verify calling getHealthStatus from combatLogic matches the output
    expect(getHealthStatus(20, 20).label).toBe('Full');
    expect(getHealthStatus(19, 20).label).toBe('Healthy');
    expect(getHealthStatus(15, 20).label).toBe('Injured');
    expect(getHealthStatus(8, 20).label).toBe('Bloodied');
    expect(getHealthStatus(0, 20).label).toBe('Defeated');
  });

  // Test 6: The active turn combatant is visually distinguished from others
  it('visually distinguishes the active turn combatant with special style classes', () => {
    const combatants: Combatant[] = [
      { id: 'c1', name: 'Lidda', type: 'pc', ac: 15, maxHp: 30, currentHp: 30, initiative: 15, passivePerception: 12 },
      { id: 'c2', name: 'Marauder', type: 'npc', ac: 13, maxHp: 20, currentHp: 15, initiative: 10, passivePerception: 10 },
    ];

    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test Campaign',
        characters: [],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: 'enc-123',
          combatants,
          activeTurnId: 'c1', // Lidda is active
          round: 1,
        },
      },
      updateState: vi.fn(),
    });

    render(<PlayerView />);

    const activeName = screen.getByText('Lidda');
    const inactiveName = screen.getByText('Marauder');

    // Active name gets text-[#c5b358], inactive name gets text-[#2c2c26]
    expect(activeName.className).toContain('text-[#c5b358]');
    expect(inactiveName.className).not.toContain('text-[#c5b358]');
    expect(inactiveName.className).toContain('text-[#2c2c26]');
  });

  // Test 7: Conditions are displayed when a combatant has a non-empty conditions string
  it('displays conditions when a combatant has conditions', () => {
    const combatants: Combatant[] = [
      { id: 'c1', name: 'Lidda', type: 'pc', ac: 15, maxHp: 30, currentHp: 30, initiative: 15, passivePerception: 12, conditions: 'Poisoned, Charmed' },
    ];

    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test Campaign',
        characters: [],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: 'enc-123',
          combatants,
          activeTurnId: null,
          round: 1,
        },
      },
      updateState: vi.fn(),
    });

    render(<PlayerView />);
    expect(screen.getByText('Poisoned, Charmed')).toBeDefined();
  });

  // Test 8: The component renders without errors when the combatants array is empty
  it('renders peace message without errors when combatants list is empty', () => {
    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test Campaign',
        characters: [],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: 'enc-123',
          combatants: [],
          activeTurnId: null,
          round: 1,
        },
      },
      updateState: vi.fn(),
    });

    render(<PlayerView />);
    expect(screen.getByText(/Peace reigns.*for now/i)).toBeDefined();
  });

  // Test 9: 6 combatants → container has max-w-7xl, no grid-cols-2 or lg:grid-cols-2
  it('has max-w-7xl and no grid columns when 6 combatants are present', () => {
    const combatants: Combatant[] = Array.from({ length: 6 }, (_, i) => ({
      id: `c${i}`,
      name: `Combatant ${i}`,
      type: 'pc',
      ac: 15,
      maxHp: 20,
      currentHp: 20,
      initiative: 20 - i,
      passivePerception: 12
    }));

    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test Campaign',
        characters: [],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: 'enc-123',
          combatants,
          activeTurnId: null,
          round: 1,
        },
      },
      updateState: vi.fn(),
    });

    const { container } = render(<PlayerView />);
    const listContainer = container.querySelector('table')?.parentElement?.parentElement;
    expect(listContainer).toBeDefined();
    expect(listContainer?.className).toContain('max-w-7xl');
    expect(listContainer?.className).not.toContain('lg:grid-cols-2');
    expect(listContainer?.className).not.toContain('max-w-5xl');
    expect(listContainer?.className).not.toContain('max-w-4xl');
  });

  // Test 10: 10 combatants → container has max-w-7xl, no grid-cols-2
  it('has max-w-7xl and no grid columns when 10 combatants are present', () => {
    const combatants: Combatant[] = Array.from({ length: 10 }, (_, i) => ({
      id: `c${i}`,
      name: `Combatant ${i}`,
      type: 'pc',
      ac: 15,
      maxHp: 20,
      currentHp: 20,
      initiative: 20 - i,
      passivePerception: 12
    }));

    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test Campaign',
        characters: [],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: 'enc-123',
          combatants,
          activeTurnId: null,
          round: 1,
        },
      },
      updateState: vi.fn(),
    });

    const { container } = render(<PlayerView />);
    const listContainer = container.querySelector('table')?.parentElement?.parentElement;
    expect(listContainer).toBeDefined();
    expect(listContainer?.className).toContain('max-w-7xl');
    expect(listContainer?.className).not.toContain('lg:grid-cols-2');
    expect(listContainer?.className).not.toContain('max-w-5xl');
    expect(listContainer?.className).not.toContain('max-w-4xl');
  });

  // Test 11: 11 combatants → container has max-w-7xl AND grid-cols-2 classes
  it('has max-w-7xl and two-column grid classes when 11 combatants are present', () => {
    const combatants: Combatant[] = Array.from({ length: 11 }, (_, i) => ({
      id: `c${i}`,
      name: `Combatant ${i}`,
      type: 'pc',
      ac: 15,
      maxHp: 20,
      currentHp: 20,
      initiative: 20 - i,
      passivePerception: 12
    }));

    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test Campaign',
        characters: [],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: 'enc-123',
          combatants,
          activeTurnId: null,
          round: 1,
        },
      },
      updateState: vi.fn(),
    });

    const { container } = render(<PlayerView />);
    const listContainer = container.querySelector('table')?.parentElement?.parentElement;
    expect(listContainer).toBeDefined();
    expect(listContainer?.className).toContain('max-w-7xl');
    expect(listContainer?.className).toContain('lg:grid-cols-2');
    expect(listContainer?.className).not.toContain('max-w-5xl');
    expect(listContainer?.className).not.toContain('max-w-4xl');
  });
});
