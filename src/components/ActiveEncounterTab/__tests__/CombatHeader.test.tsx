import '@testing-library/jest-dom/vitest';
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
    selectedCount: 0,
    onOpenTools: vi.fn(),
    onRollNpcInit: vi.fn(),
    onResetCombat: vi.fn(),
    onNextTurn: vi.fn(),
    onToggleMultiTargetMode: vi.fn(),
    onDeleteSelected: vi.fn(),
    onCancelSelection: vi.fn(),
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
    expect(screen.getByText('Test Encounter')).toBeInTheDocument();
    expect(screen.getByText('Test Loc • Easy')).toBeInTheDocument();
  });

  describe('Selection Mode', () => {
    it('shows the selection header when isMultiTargetMode is true', () => {
      render(
        <MemoryRouter>
          <CombatHeader {...defaultProps} isMultiTargetMode={true} selectedCount={2} />
        </MemoryRouter>
      );
      expect(screen.getByText('Combatants Selected')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete Selected/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('Delete Selected button is disabled when selectedCount is 0', () => {
      render(
        <MemoryRouter>
          <CombatHeader {...defaultProps} isMultiTargetMode={true} selectedCount={0} />
        </MemoryRouter>
      );
      const deleteBtn = screen.getByRole('button', { name: /Delete Selected/i }) as HTMLButtonElement;
      expect(deleteBtn.disabled).toBe(true);
    });

    it('clicking Delete Selected calls the onDeleteSelected prop', () => {
      const onDeleteSelected = vi.fn();
      render(
        <MemoryRouter>
          <CombatHeader {...defaultProps} isMultiTargetMode={true} selectedCount={1} onDeleteSelected={onDeleteSelected} />
        </MemoryRouter>
      );
      fireEvent.click(screen.getByRole('button', { name: /Delete Selected/i }));
      expect(onDeleteSelected).toHaveBeenCalledTimes(1);
    });

    it('clicking Cancel calls the onCancelSelection prop', () => {
      const onCancelSelection = vi.fn();
      render(
        <MemoryRouter>
          <CombatHeader {...defaultProps} isMultiTargetMode={true} onCancelSelection={onCancelSelection} />
        </MemoryRouter>
      );
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
      expect(onCancelSelection).toHaveBeenCalledTimes(1);
    });
  });

  it('The round number is rendered', () => {
    render(
      <MemoryRouter>
        <CombatHeader {...defaultProps} />
      </MemoryRouter>
    );
    expect(screen.getByText('Round 3')).toBeInTheDocument();
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
    expect(btn).toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: /Call for Initiative/i })).toBeInTheDocument();
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

  describe('Updated Layout and Buttons', () => {
    it('The ? button is NOT rendered in the header, and key shortcut badges are present', () => {
      render(
        <MemoryRouter>
          <CombatHeader {...defaultProps} />
        </MemoryRouter>
      );

      // The ? button is NOT rendered in the header
      expect(screen.queryByTitle(/cheat sheet/i)).toBeNull();

      // SELECT button is present with S shortcut badge
      const selectBtn = screen.getByRole('button', { name: /Select/i });
      expect(selectBtn).toBeInTheDocument();
      expect(selectBtn.textContent).toContain('S');

      // BROADCAST button is present with B badge
      const broadcastLink = screen.getByRole('link', { name: /Broadcast/i });
      expect(broadcastLink).toBeInTheDocument();
      expect(broadcastLink.textContent).toContain('B');

      // CALL FOR INITIATIVE button is present with C badge
      const callInitBtn = screen.getByRole('button', { name: /Call for Initiative/i });
      expect(callInitBtn).toBeInTheDocument();
      expect(callInitBtn.textContent).toContain('C');
    });

    it('Secondary buttons (Tools, Roll NPC Init, Reset) have the custom compact style', () => {
      render(
        <MemoryRouter>
          <CombatHeader {...defaultProps} />
        </MemoryRouter>
      );

      const items = [
        { btn: screen.getByRole('button', { name: /Tools/i }) },
        { btn: screen.getByRole('button', { name: /Roll NPC Init/i }) },
        { btn: screen.getByRole('button', { name: /Reset/i }) },
      ];

      items.forEach(({ btn }) => {
        expect(btn).toBeInTheDocument();
        expect(btn.className).toContain('text-xs');
        expect(btn.className).toContain('font-medium');
        expect(btn.className).toContain('px-2');
        expect(btn.className).toContain('py-1');
        expect(btn.className).toContain('border-gray-300');
        expect(btn.className).toContain('text-gray-500');
        expect(btn.className).toContain('rounded');
        expect(btn.className).toContain('bg-transparent');
      });
    });

    it('asserts the updated 2-row layout of the header', () => {
      render(
        <MemoryRouter>
          <CombatHeader {...defaultProps} />
        </MemoryRouter>
      );

      const backBtn = screen.getByRole('button', { name: /Back to Encounters/i });
      const title = screen.getByText('Running Combat');
      const nextTurnBtn = screen.getByRole('button', { name: /Next Turn/i });

      // Sibling / Parent hierarchy checks for Row 1
      const row1 = backBtn.closest('.flex-row');
      expect(row1).toBeInTheDocument();
      expect(row1?.contains(title)).toBe(true);

      // Back to Encounters is positioned after (to the right of) the encounter title in the DOM
      expect(title.compareDocumentPosition(backBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      // Parent container only has 2 rows (Row 1 and Row 2 with buttons), meaning no dedicated top row for back link
      const p6Container = row1?.parentElement;
      expect(p6Container).toBeInTheDocument();
      expect(p6Container?.children.length).toBe(2);

      // The button row containing NEXT TURN is the second row in the header
      const buttonRow = nextTurnBtn.closest('.flex-row');
      expect(buttonRow).toBeInTheDocument();
      expect(p6Container?.children[1]).toBe(buttonRow);
    });
  });
});
