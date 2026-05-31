// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CombatHeader } from '../CombatHeader';
import { MemoryRouter } from 'react-router-dom';

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

import { toast } from 'sonner';

describe('CombatHeader', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  const defaultProps = {
    round: 3,
    isMultiTargetMode: false,
    onOpenTools: vi.fn(),
    onRollNpcInit: vi.fn(),
    onResetCombat: vi.fn(),
    onNextTurn: vi.fn(),
    onToggleMultiTargetMode: vi.fn(),
    onBack: vi.fn(),
    onCallInitiative: vi.fn(),
    initiativeEvent: false,
  };

  it('The encounter name is rendered when an encounter is provided', () => {
    render(
      <MemoryRouter>
        <CombatHeader
          {...defaultProps}
          encounter={{ id: 'e1', name: 'Test Encounter', location: 'Test Loc', difficultyId: 1, difficultyName: 'Easy', npcDefinitions: '', status: 'active' }}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Test Encounter')).toBeDefined();
    expect(screen.getByText('Test Loc • Easy')).toBeDefined();
  });

  it('The round number is rendered', () => {
    render(
      <MemoryRouter>
        <CombatHeader {...defaultProps} />
      </MemoryRouter>
    );
    expect(screen.getByText('Round 3')).toBeDefined();
  });

  it('Clicking the back button calls the onBack prop', () => {
    const onBack = vi.fn();
    render(
      <MemoryRouter>
        <CombatHeader {...defaultProps} onBack={onBack} />
      </MemoryRouter>
    );
    const backBtn = screen.getByRole('button', { name: /Back to Encounters/i });
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('Clicking the Reset button calls the onResetCombat prop', () => {
    const onResetCombat = vi.fn();
    render(
      <MemoryRouter>
        <CombatHeader {...defaultProps} onResetCombat={onResetCombat} />
      </MemoryRouter>
    );
    const btn = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(btn);
    expect(onResetCombat).toHaveBeenCalledTimes(1);
  });

  it('Clicking the Next Turn button calls the onNextTurn prop', () => {
    const onNextTurn = vi.fn();
    render(
      <MemoryRouter>
        <CombatHeader {...defaultProps} onNextTurn={onNextTurn} />
      </MemoryRouter>
    );
    const btn = screen.getByRole('button', { name: /Next Turn/i });
    fireEvent.click(btn);
    expect(onNextTurn).toHaveBeenCalledTimes(1);
  });

  it('Clicking the Roll NPC Init button calls the onRollNpcInit prop', () => {
    const onRollNpcInit = vi.fn();
    render(
      <MemoryRouter>
        <CombatHeader {...defaultProps} onRollNpcInit={onRollNpcInit} />
      </MemoryRouter>
    );
    const btn = screen.getByRole('button', { name: /Roll NPC Init/i });
    fireEvent.click(btn);
    expect(onRollNpcInit).toHaveBeenCalledTimes(1);
  });

  it('The Tools button calls the onOpenTools prop callback', () => {
    const onOpenTools = vi.fn();
    render(
      <MemoryRouter>
        <CombatHeader {...defaultProps} onOpenTools={onOpenTools} />
      </MemoryRouter>
    );
    
    const btn = screen.getByRole('button', { name: /Tools/i });
    expect(btn).toBeDefined();
    fireEvent.click(btn);
    expect(onOpenTools).toHaveBeenCalledTimes(1);
  });

  it('"Call for Initiative" button is present in the rendered output', () => {
    render(
      <MemoryRouter>
        <CombatHeader
          {...defaultProps}
          initiativeEvent={false}
          onCallInitiative={vi.fn()}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Call for Initiative/i })).toBeDefined();
  });

  it('Clicking the button sets combatState.initiativeEvent to true and shows a confirmation toast', () => {
    const onCallInitiative = vi.fn(() => {
      toast('Initiative called!', {
        description: 'Players can see the overlay on the Player View.',
        duration: 3000,
      });
    });

    render(
      <MemoryRouter>
        <CombatHeader
          {...defaultProps}
          initiativeEvent={false}
          onCallInitiative={onCallInitiative}
        />
      </MemoryRouter>
    );

    const btn = screen.getByRole('button', { name: /Call for Initiative/i });
    fireEvent.click(btn);

    expect(onCallInitiative).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith('Initiative called!', expect.any(Object));
  });

  it('The button is disabled when combatState.initiativeEvent is already true', () => {
    render(
      <MemoryRouter>
        <CombatHeader
          {...defaultProps}
          initiativeEvent={true}
          onCallInitiative={vi.fn()}
        />
      </MemoryRouter>
    );

    const btn = screen.getByRole('button', { name: /Call for Initiative/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
