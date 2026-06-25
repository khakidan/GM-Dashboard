import '@testing-library/jest-dom/vitest';
// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import React from 'react';
import { render as originalRender, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import * as diceRoller from '../../../lib/diceRoller';
import { CombatantCard } from '../CombatantCard';
import type { Combatant, NPC } from '../../../types';
import { useDashboardStore } from '../../../hooks/useAppState';
import { updateCharacterDB } from '../../../services/dbOperations';
import { makeCombatant } from '../../../test-utils/fixtures/combatantFixtures';

vi.mock('../../../services/dbOperations', () => ({
  updateCharacterDB: vi.fn(),
  updateNpcInstanceConditionsDB: vi.fn(),
  updateInitiativeDB: vi.fn(),
  updateDeathSavesDB: vi.fn(),
  updateEncounterStateDB: vi.fn(),
}));

vi.mock('../../../lib/diceRoller', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/diceRoller')>();
  return {
    ...actual,
    rollDice: vi.fn(actual.rollDice)
  };
});

describe('CombatantCard', () => {
  afterEach(() => cleanup());

  const defaultCombatant: Combatant = makeCombatant({
    currentHp: 15,
    conditions: 'Poisoned',
    notes: 'Some notes',
  });

  beforeEach(() => {
    // Reset store state before each test
    useDashboardStore.setState({
      combatState: {
        activeEncounterId: null,
        activeTurnId: null,
        round: 1,
        combatants: [defaultCombatant],
        concentrationLinks: {},
        selectedIds: [],
        isSelectionMode: false,
        syncingIds: [],
        expandedIds: [],
      },
    });
  });

  const render = (element: React.ReactElement) => {
    const updateStoreWithProps = (props: any) => {
      const c = props.c || defaultCombatant;
      const combatantId = c.id;

      useDashboardStore.setState(prev => {
        const currentCombatants = prev.combatState?.combatants || [];
        const updatedCombatants = currentCombatants.some(com => com.id === combatantId)
          ? currentCombatants.map(com => com.id === combatantId ? { ...com, ...c } : com)
          : [...currentCombatants, c];

        return {
          ...prev,
          combatState: {
            ...prev.combatState,
            combatants: updatedCombatants,
            activeTurnId: props.isActive ? combatantId : (prev.combatState?.activeTurnId === combatantId ? null : prev.combatState?.activeTurnId),
            selectedIds: props.isSelected 
              ? Array.from(new Set([...(prev.combatState?.selectedIds || []), combatantId]))
              : (prev.combatState?.selectedIds || []).filter(id => id !== combatantId),
            isSelectionMode: props.isSelectable !== undefined ? props.isSelectable : !!prev.combatState?.isSelectionMode,
            syncingIds: props.isSyncing
              ? Array.from(new Set([...(prev.combatState?.syncingIds || []), combatantId]))
              : (prev.combatState?.syncingIds || []).filter(id => id !== combatantId),
          }
        };
      });
    };

    const props = element.props as any;
    updateStoreWithProps(props);
    const { isActive, isSelectable, isSelected, isSyncing, ...rest } = props;
    const result = originalRender(React.cloneElement(element, rest));

    return {
      ...result,
      rerender: (newElement: React.ReactElement) => {
        const newProps = newElement.props as any;
        updateStoreWithProps(newProps);
        const { isActive: newIsActive, isSelectable: newIsSelectable, isSelected: newIsSelected, isSyncing: newIsSyncing, ...newRest } = newProps;
        result.rerender(React.cloneElement(newElement, newRest));
      }
    };
  };

  const defaultProps = {
    c: defaultCombatant,
    isActive: false,
    isExpanded: false,
    isSyncing: false,
    damageInput: '',
    healInput: '',
    currentRound: 1,
    onDamageInputChange: vi.fn(),
    onHealInputChange: vi.fn(),
    onHealthSubmit: vi.fn(),
    onToggleExpand: vi.fn(),
    onUpdateCombatant: vi.fn(),
    onRemoveCombatant: vi.fn(),
    isSelectable: false,
    isSelected: false,
    onToggleSelect: vi.fn(),
  };

  it('The combatant name and AC are rendered', () => {
    render(<CombatantCard {...defaultProps} />);
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    expect(screen.getByText('(AC 15)')).toBeInTheDocument();
  });

  describe('Selectable State', () => {
    it('renders a checkbox when isSelectable is true', () => {
      render(<CombatantCard {...defaultProps} isSelectable={true} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('the checkbox is checked when isSelected is true', () => {
      render(<CombatantCard {...defaultProps} isSelectable={true} isSelected={true} />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('clicking the checkbox calls onToggleSelect', () => {
      const onToggleSelect = vi.fn();
      render(<CombatantCard {...defaultProps} isSelectable={true} onToggleSelect={onToggleSelect} />);
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(onToggleSelect).toHaveBeenCalledTimes(1);
    });
  });

  it('The current HP value is displayed', () => {
    render(<CombatantCard {...defaultProps} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('The Active badge is shown when isActive is true', () => {
    const { rerender } = render(<CombatantCard {...defaultProps} isActive={true} />);
    expect(screen.getByText('Active')).toBeInTheDocument();

    rerender(<CombatantCard {...defaultProps} isActive={false} />);
    expect(screen.queryByText('Active')).toBeNull();
  });

  it('Clicking the expand/collapse button toggles the expanded section', () => {
    const onToggleExpand = vi.fn();
    render(<CombatantCard {...defaultProps} onToggleExpand={onToggleExpand} />);
    const buttons = screen.getAllByRole('button');
    // The Expand button is either 3rd or 4th depending on what's rendered, let's target by aria or title
    fireEvent.click(buttons.find(b => !b.textContent?.includes('DMG') && !b.textContent?.includes('HEAL') && !b.textContent?.includes('REACTION') && (!b.textContent?.includes('REMOVE') || b.textContent === '')) || buttons[3]);
    expect(onToggleExpand).toHaveBeenCalled();
  });

  it('The conditions section is visible when the card is expanded', () => {
    render(<CombatantCard {...defaultProps} isExpanded={true} />);
    // The text 'Conditions' and input are rendered
    expect(screen.getByText('Conditions')).toBeInTheDocument();
  });

  it('Clicking the Remove button calls the onRemove prop with the combatant id', () => {
    const onRemoveCombatant = vi.fn();
    render(<CombatantCard {...defaultProps} isExpanded={true} onRemoveCombatant={onRemoveCombatant} />);
    fireEvent.click(screen.getByRole('button', { name: /Remove Combatant/i }));
    expect(onRemoveCombatant).toHaveBeenCalledTimes(1);
  });

  it('Clicking the HEAL button calls onHealthChange with isDamage false', () => {
    const onHealthSubmit = vi.fn();
    render(<CombatantCard {...defaultProps} onHealthSubmit={onHealthSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /HEAL/i }));
    expect(onHealthSubmit).toHaveBeenCalledWith(false, null);
  });

  it('Clicking the DMG button calls onHealthChange with isDamage true', () => {
    const onHealthSubmit = vi.fn();
    render(<CombatantCard {...defaultProps} onHealthSubmit={onHealthSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /DMG/i }));
    expect(onHealthSubmit).toHaveBeenCalledWith(true, null);
  });

  it('Typing a number and pressing Enter in the damage input calls onHealthChange for damage', () => {
    const onHealthSubmit = vi.fn();
    render(<CombatantCard {...defaultProps} onHealthSubmit={onHealthSubmit} damageInput="5" />);
    const input = screen.getAllByPlaceholderText('0')[0]; // damage input is first
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onHealthSubmit).toHaveBeenCalledWith(true, null);
  });

  describe('Mechanical Badges', () => {
    it('SPD 0 badge renders when combatant has grappled condition', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'grappled'}} />);
      expect(screen.getByText('SPD 0')).toBeInTheDocument();
    });

    it('NO ACT badge renders when combatant has stunned condition', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'stunned'}} />);
      expect(screen.getByText('NO ACT')).toBeInTheDocument();
    });

    it('DISADV badge renders when combatant has poisoned condition', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'poisoned'}} />);
      expect(screen.getByText('DISADV')).toBeInTheDocument();
    });

    it('VULN badge renders when combatant has restrained condition', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'restrained'}} />);
      expect(screen.getByText('VULN')).toBeInTheDocument();
    });

    it('AUTO CRIT badge renders when combatant has paralyzed condition', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'paralyzed'}} />);
      expect(screen.getByText('AUTO CRIT')).toBeInTheDocument();
    });

    it('No badges render when combatant has no conditions', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: ''}} />);
      expect(screen.queryByText('SPD 0')).toBeNull();
      expect(screen.queryByText('NO ACT')).toBeNull();
      expect(screen.queryByText('DISADV')).toBeNull();
      expect(screen.queryByText('VULN')).toBeNull();
      expect(screen.queryByText('AUTO CRIT')).toBeNull();
    });
  });

  describe('Combat Mechanics Panel', () => {
    it('Combat Mechanics panel renders when combatant has paralyzed condition', () => {
      render(<CombatantCard {...defaultProps} isExpanded={true} c={{...defaultCombatant, conditions: 'paralyzed'}} />);
      expect(screen.getByText('Combat Mechanics')).toBeInTheDocument();
      expect(screen.getByText('Speed: Locked')).toBeInTheDocument();
    });

    it('Panel does not render when conditions string is empty', () => {
      render(<CombatantCard {...defaultProps} isExpanded={true} c={{...defaultCombatant, conditions: ''}} />);
      expect(screen.queryByText('Combat Mechanics')).toBeNull();
    });

    it('Auto-crit row appears when combatant has unconscious condition', () => {
      render(<CombatantCard {...defaultProps} isExpanded={true} c={{...defaultCombatant, conditions: 'unconscious'}} />);
      expect(screen.getByText(/Melee hits: Auto-crit/i)).toBeInTheDocument();
    });
  });

  describe('Indicator Dots', () => {
    it('Red dot renders when combatant has an official condition', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'poisoned'}} />);
      expect(screen.getByTitle('Active conditions')).toBeInTheDocument();
      expect(screen.queryByTitle('Active effects')).toBeNull();
    });

    it('Blue dot renders when combatant has an effect', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'hasted'}} />);
      expect(screen.getByTitle('Active effects')).toBeInTheDocument();
      expect(screen.queryByTitle('Active conditions')).toBeNull();
    });

    it('Both dots render when combatant has both a condition and an effect', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'poisoned, hasted'}} />);
      expect(screen.getByTitle('Active conditions')).toBeInTheDocument();
      expect(screen.getByTitle('Active effects')).toBeInTheDocument();
    });

    it('Neither dot renders when conditions string is empty', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: ''}} />);
      expect(screen.queryByTitle('Active conditions')).toBeNull();
      expect(screen.queryByTitle('Active effects')).toBeNull();
    });
    
    it('Red dot does not render when combatant has only an effect (and vice versa)', () => {
      const { unmount } = render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'hasted'}} />);
      expect(screen.queryByTitle('Active conditions')).toBeNull();
      unmount();
      
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'poisoned'}} />);
      expect(screen.queryByTitle('Active effects')).toBeNull();
    });
  });

  describe('Concentration Effects', () => {
    it('calls onConcentrationPrompt when a concentration effect is added', async () => {
      const onConcentrationPrompt = vi.fn();
      render(
        <CombatantCard
          {...defaultProps}
          isExpanded={true}
          onConcentrationPrompt={onConcentrationPrompt}
          c={{ ...defaultCombatant, conditions: '' }}
        />
      );

      const input = screen.getByPlaceholderText('Add condition or effect...');
      fireEvent.change(input, { target: { value: 'hasted' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      const skipBtn = await screen.findByRole('button', { name: 'Skip' });
      fireEvent.click(skipBtn);

      await waitFor(() => {
        expect(onConcentrationPrompt).toHaveBeenCalledWith('hasted', 'Goblin');
      });
    });
  });

  describe('Reaction Tracker', () => {
    it('Verify reaction pill renders in AVAILABLE state when reactionUsed is false', () => {
      render(<CombatantCard {...defaultProps} c={{ ...defaultCombatant, reactionUsed: false }} />);
      const button = screen.getByRole('button', { name: /REACTION(?! USED)/i });
      expect(button).toBeInTheDocument();
      expect(screen.queryByText('REACTION USED')).toBeNull();
    });

    it('Verify reaction pill renders in USED state when reactionUsed is true', () => {
      render(<CombatantCard {...defaultProps} c={{ ...defaultCombatant, reactionUsed: true }} />);
      const button = screen.getByRole('button', { name: /REACTION USED/i });
      expect(button).toBeInTheDocument();
      expect(screen.queryByText(/^REACTION$/)).toBeNull();
    });

    it('Verify clicking the pill in AVAILABLE state calls updateCombatant with reactionUsed: true', () => {
      const onUpdateCombatant = vi.fn();
      render(<CombatantCard {...defaultProps} onUpdateCombatant={onUpdateCombatant} c={{ ...defaultCombatant, reactionUsed: false }} />);
      const button = screen.getByRole('button', { name: /REACTION(?! USED)/i });
      fireEvent.click(button);
      expect(onUpdateCombatant).toHaveBeenCalledWith({ reactionUsed: true });
    });

    it('Verify clicking the pill in USED state calls updateCombatant with reactionUsed: false', () => {
      const onUpdateCombatant = vi.fn();
      render(<CombatantCard {...defaultProps} onUpdateCombatant={onUpdateCombatant} c={{ ...defaultCombatant, reactionUsed: true }} />);
      const button = screen.getByRole('button', { name: /REACTION USED/i });
      fireEvent.click(button);
      expect(onUpdateCombatant).toHaveBeenCalledWith({ reactionUsed: false });
    });
  });

  describe('NPC Recharge Abilities', () => {
    it('Recharge section is not rendered for PC combatants', () => {
      const pcCombatant: Combatant = {
        ...defaultCombatant,
        type: 'pc',
        rechargeAbilities: [{ name: 'Breath Weapon', rechargeOn: 5, isCharged: true }]
      };
      render(<CombatantCard {...defaultProps} isExpanded={true} c={pcCombatant} />);
      expect(screen.queryByText('Recharge Abilities')).toBeNull();
    });

    it('Recharge section is not rendered for NPCs with no rechargeAbilities', () => {
      render(<CombatantCard {...defaultProps} isExpanded={true} c={{ ...defaultCombatant, rechargeAbilities: [] }} />);
      expect(screen.queryByText('Recharge Abilities')).toBeNull();
    });

    it('Recharge section renders ability name and READY badge when isCharged is true', () => {
      const npc: Combatant = {
        ...defaultCombatant,
        type: 'npc',
        rechargeAbilities: [{ name: 'Breath Weapon', rechargeOn: 5, isCharged: true }]
      };
      render(<CombatantCard {...defaultProps} isExpanded={true} c={npc} />);
      expect(screen.getByText('Breath Weapon')).toBeInTheDocument();
      expect(screen.getByText('READY')).toBeInTheDocument();
      expect(screen.queryByText('SPENT')).toBeNull();
      expect(screen.queryByRole('button', { name: /Roll Recharge/i })).toBeNull();
    });

    it('Recharge section renders SPENT badge and Roll Recharge button when isCharged is false', () => {
      const npc: Combatant = {
        ...defaultCombatant,
        type: 'npc',
        rechargeAbilities: [{ name: 'Breath Weapon', rechargeOn: 5, isCharged: false }]
      };
      render(<CombatantCard {...defaultProps} isExpanded={true} c={npc} />);
      expect(screen.getByText('Breath Weapon')).toBeInTheDocument();
      expect(screen.getByText('SPENT')).toBeInTheDocument();
      expect(screen.queryByText('READY')).toBeNull();
      expect(screen.getByRole('button', { name: /Roll Recharge/i })).toBeInTheDocument();
    });

    it('Clicking Roll Recharge calls rollDice with a 1d6', async () => {
      const npc: Combatant = {
        ...defaultCombatant,
        type: 'npc',
        rechargeAbilities: [{ name: 'Breath Weapon', rechargeOn: 5, isCharged: false }]
      };
      render(<CombatantCard {...defaultProps} isExpanded={true} c={npc} />);
      const rollBtn = screen.getByRole('button', { name: /Roll Recharge/i });
      fireEvent.click(rollBtn);

      expect(diceRoller.rollDice).toHaveBeenCalled();
    });

    it('If roll >= rechargeOn, isCharged becomes true', async () => {
      const onUpdateCombatant = vi.fn();
      const npc: Combatant = {
        ...defaultCombatant,
        type: 'npc',
        rechargeAbilities: [{ name: 'Breath Weapon', rechargeOn: 5, isCharged: false }]
      };
      
      // Mock roll to return 5 (which is >= 5, so success)
      vi.mocked(diceRoller.rollDice).mockReturnValueOnce({
        groups: [],
        modifier: 0,
        total: 5,
        notation: '1D6',
        timestamp: Date.now()
      });

      render(<CombatantCard {...defaultProps} isExpanded={true} onUpdateCombatant={onUpdateCombatant} c={npc} />);
      const rollBtn = screen.getByRole('button', { name: /Roll Recharge/i });
      fireEvent.click(rollBtn);

      expect(onUpdateCombatant).toHaveBeenCalledWith({
        rechargeAbilities: [{ name: 'Breath Weapon', rechargeOn: 5, isCharged: true }]
      });
    });

    it('If roll < rechargeOn, isCharged remains false', async () => {
      const onUpdateCombatant = vi.fn();
      const npc: Combatant = {
        ...defaultCombatant,
        type: 'npc',
        rechargeAbilities: [{ name: 'Breath Weapon', rechargeOn: 5, isCharged: false }]
      };

      // Mock roll to return 3 (which is < 5, so failure)
      vi.mocked(diceRoller.rollDice).mockReturnValueOnce({
        groups: [],
        modifier: 0,
        total: 3,
        notation: '1D6',
        timestamp: Date.now()
      });

      render(<CombatantCard {...defaultProps} isExpanded={true} onUpdateCombatant={onUpdateCombatant} c={npc} />);
      const rollBtn = screen.getByRole('button', { name: /Roll Recharge/i });
      fireEvent.click(rollBtn);

      expect(onUpdateCombatant).toHaveBeenCalledWith({
        rechargeAbilities: [{ name: 'Breath Weapon', rechargeOn: 5, isCharged: false }]
      });
    });
  });

  describe('Legendary Trackers inside CombatantCard', () => {
    it('does not render Legendary Action or Resistance sections if they are undefined', () => {
      const npc: Combatant = {
        ...defaultCombatant,
        type: 'npc',
        legendaryActions: undefined,
        legendaryResistances: undefined
      };
      render(<CombatantCard {...defaultProps} isExpanded={true} c={npc} />);
      expect(screen.queryByText('Legendary Resistances')).toBeNull();
      expect(screen.queryByText('Legendary Actions')).toBeNull();
    });

    it('renders correct numbers of filled and empty resistance pips, status text, and trigger onClick handlers correctly', () => {
      const onUpdateCombatant = vi.fn();
      const npc: Combatant = {
        ...defaultCombatant,
        type: 'npc',
        legendaryResistances: { max: 3, remaining: 2 }
      };

      const { container } = render(<CombatantCard {...defaultProps} isExpanded={true} onUpdateCombatant={onUpdateCombatant} c={npc} />);
      
      // Header and status text are correct
      expect(screen.getByText('Legendary Resistances')).toBeInTheDocument();
      expect(screen.getByText('2 / 3 remaining')).toBeInTheDocument();

      // Pips: 2 are filled (clickable), 1 is empty (disabled)
      const pip0 = container.querySelector('#btn-resistance-pip-0-c1');
      const pip1 = container.querySelector('#btn-resistance-pip-1-c1');
      const pip2 = container.querySelector('#btn-resistance-pip-2-c1');

      expect(pip0).not.toBeNull();
      expect(pip1).not.toBeNull();
      expect(pip2).not.toBeNull();

      // Clicking pip0 (which is filled) decrements remaining to 1
      fireEvent.click(pip0!);
      expect(onUpdateCombatant).toHaveBeenCalledWith({
        legendaryResistances: { max: 3, remaining: 1 }
      });
    });

    it('Clicking the Restore All button for Legendary Resistances resets remaining to max', () => {
      const onUpdateCombatant = vi.fn();
      const npc: Combatant = {
        ...defaultCombatant,
        type: 'npc',
        legendaryResistances: { max: 3, remaining: 1 }
      };

      const { container } = render(<CombatantCard {...defaultProps} isExpanded={true} onUpdateCombatant={onUpdateCombatant} c={npc} />);
      
      const restoreBtn = container.querySelector('#btn-restore-resistances-c1');
      expect(restoreBtn).not.toBeNull();

      fireEvent.click(restoreBtn!);
      expect(onUpdateCombatant).toHaveBeenCalledWith({
        legendaryResistances: { max: 3, remaining: 3 }
      });
    });

    it('renders the correct Legendary Actions status text, allows spending an action, and triggers Restore All', () => {
      const onUpdateCombatant = vi.fn();
      const npc: Combatant = {
        ...defaultCombatant,
        type: 'npc',
        legendaryActions: { max: 3, remaining: 3 }
      };

      const { container } = render(<CombatantCard {...defaultProps} isExpanded={true} onUpdateCombatant={onUpdateCombatant} c={npc} />);

      expect(screen.getByText('Legendary Actions')).toBeInTheDocument();
      expect(screen.getByText('3 / 3 remaining')).toBeInTheDocument();

      const pip0 = container.querySelector('#btn-action-pip-0-c1');
      expect(pip0).not.toBeNull();
      fireEvent.click(pip0!);

      expect(onUpdateCombatant).toHaveBeenCalledWith({
        legendaryActions: { max: 3, remaining: 2 }
      });

      const restoreBtn = container.querySelector('#btn-restore-actions-c1');
      expect(restoreBtn).not.toBeNull();
      fireEvent.click(restoreBtn!);

      expect(onUpdateCombatant).toHaveBeenCalledWith({
        legendaryActions: { max: 3, remaining: 3 }
      });
    });
  });

  describe('At-a-glance Status Indicators on Collapsed Row', () => {
    it('legendary actions badge shows 2/3 when legendaryActions is { max: 3, remaining: 2 }', () => {
      const npc: Combatant = {
        ...defaultCombatant,
        type: 'npc',
        legendaryActions: { max: 3, remaining: 2 }
      };

      render(<CombatantCard {...defaultProps} c={npc} />);
      const indicator = screen.getByTestId('legendary-actions-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator.textContent).toContain('2/3');
    });

    it('legendary actions badge is NOT shown for PC combatants', () => {
      const pc: Combatant = {
        ...defaultCombatant,
        type: 'pc',
        legendaryActions: { max: 3, remaining: 2 }
      };

      render(<CombatantCard {...defaultProps} c={pc} />);
      expect(screen.queryByTestId('legendary-actions-indicator')).toBeNull();
    });

    it('legendary actions badge is NOT shown when legendaryActions is undefined', () => {
      const npc: Combatant = {
        ...defaultCombatant,
        type: 'npc',
        legendaryActions: undefined
      };

      render(<CombatantCard {...defaultProps} c={npc} />);
      expect(screen.queryByTestId('legendary-actions-indicator')).toBeNull();
    });

    it('legendary resistances badge shows correct remaining/max text', () => {
      const npc: Combatant = {
        ...defaultCombatant,
        type: 'npc',
        legendaryResistances: { max: 3, remaining: 1 }
      };

      render(<CombatantCard {...defaultProps} c={npc} />);
      const indicator = screen.getByTestId('legendary-resistances-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator.textContent).toContain('1/3');
    });

    it('legendary resistances badge uses gray styling when remaining is 0', () => {
      const npc: Combatant = {
        ...defaultCombatant,
        type: 'npc',
        legendaryResistances: { max: 3, remaining: 0 }
      };

      render(<CombatantCard {...defaultProps} c={npc} />);
      const indicator = screen.getByTestId('legendary-resistances-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator.className).toContain('bg-gray-100');
      expect(indicator.className).toContain('text-gray-400');
    });

    it('a charged recharge ability shows an emerald-colored indicator with the ability name', () => {
      const npc: Combatant = {
        ...defaultCombatant,
        type: 'npc',
        rechargeAbilities: [{ name: 'Fire Breath', rechargeOn: 6, isCharged: true }]
      };

      render(<CombatantCard {...defaultProps} c={npc} />);
      const pill = screen.getByTestId('recharge-indicator-fire-breath');
      expect(pill).toBeInTheDocument();
      expect(pill.textContent).toContain('Fire Breath');
      expect(pill.className).toContain('bg-emerald-5');
    });

    it('a spent recharge ability shows a red indicator', () => {
      const npc: Combatant = {
        ...defaultCombatant,
        type: 'npc',
        rechargeAbilities: [{ name: 'Cold Breath', rechargeOn: 5, isCharged: false }]
      };

      render(<CombatantCard {...defaultProps} c={npc} />);
      const pill = screen.getByTestId('recharge-indicator-cold-breath');
      expect(pill).toBeInTheDocument();
      expect(pill.textContent).toContain('Cold Breath');
      expect(pill.className).toContain('bg-red-5');
    });

    it('clicking a charged recharge pill calls onUpdateCombatant with isCharged: false for that ability', () => {
      const onUpdateCombatant = vi.fn();
      const npc: Combatant = {
        ...defaultCombatant,
        type: 'npc',
        rechargeAbilities: [{ name: 'Fire Breath', rechargeOn: 6, isCharged: true }]
      };

      render(<CombatantCard {...defaultProps} onUpdateCombatant={onUpdateCombatant} c={npc} />);
      const pill = screen.getByTestId('recharge-indicator-fire-breath');
      fireEvent.click(pill);

      expect(onUpdateCombatant).toHaveBeenCalledWith({
        rechargeAbilities: [{ name: 'Fire Breath', rechargeOn: 6, isCharged: false }]
      });
    });

    it('no indicators are rendered on a PC combatant even if the combatant somehow has these fields defined', () => {
      const pc: Combatant = {
        ...defaultCombatant,
        type: 'pc',
        legendaryActions: { max: 3, remaining: 3 },
        legendaryResistances: { max: 3, remaining: 3 },
        rechargeAbilities: [{ name: 'Breath Weapon', rechargeOn: 5, isCharged: true }]
      };

      render(<CombatantCard {...defaultProps} c={pc} />);
      expect(screen.queryByTestId('compact-indicators')).toBeNull();
    });
  });

  describe('Compact and Expanded PC Resource Trackers', () => {
    it('renders both resource groups in the compact header row of a PC with two resource pools and uses flex-wrap', () => {
      const pc: Combatant = {
        ...defaultCombatant,
        id: 'c-multi',
        name: 'Hero',
        type: 'pc',
        characterId: 'char-multi'
      };
      useDashboardStore.setState(prev => ({
        ...prev,
        characters: [
          {
            id: 'char-multi',
            playerName: 'Player 1',
            characterName: 'Hero',
            ac: 15, maxHp: 30, tempHp: 0, currentHp: 30, conditions: '', passivePerception: 10, level: 5, statusId: 1, statusName: 'Active', notes: '', isActive: true, class: 'Hero', hitDiceConfig: '1d8', hitDiceUsed: '0', abilityScores: '{}', proficiencies: '{}',
            resourcePools: JSON.stringify([
              { name: 'Infused Items', current: 4, max: 4, reset: 'long' },
              { name: 'Spell Slots', current: 7, max: 10, reset: 'long' }
            ])
          }
        ]
      }));

      const { container } = render(<CombatantCard {...defaultProps} c={pc} />);
      
      expect(screen.getByText('Infused It...')).toBeInTheDocument();
      expect(screen.getByText('Spell Slot...')).toBeInTheDocument();

      const compactRow = container.querySelector('.flex-wrap');
      expect(compactRow).toBeInTheDocument();
    });

    it('renders exactly one resource group in the compact row of a PC with one pool with proper text', () => {
      const pc: Combatant = {
        ...defaultCombatant,
        id: 'c-single',
        name: 'Simple Hero',
        type: 'pc',
        characterId: 'char-single'
      };
      useDashboardStore.setState(prev => ({
        ...prev,
        characters: [
          {
            id: 'char-single',
            playerName: 'Player 1',
            characterName: 'Simple Hero',
            ac: 15, maxHp: 30, tempHp: 0, currentHp: 30, conditions: '', passivePerception: 10, level: 5, statusId: 1, statusName: 'Active', notes: '', isActive: true, class: 'Hero', hitDiceConfig: '1d8', hitDiceUsed: '0', abilityScores: '{}', proficiencies: '{}',
            resourcePools: JSON.stringify([
              { name: 'Ki Points', current: 4, max: 4, reset: 'short' }
            ])
          }
        ]
      }));

      render(<CombatantCard {...defaultProps} c={pc} />);
      
      expect(screen.getByText('Ki Points')).toBeInTheDocument();
      expect(screen.getByText('4/4')).toBeInTheDocument();
      expect(screen.queryByText('Spell Slots')).toBeNull();
    });

    it('renders no compact resource row if pools are empty or if it is an NPC', () => {
      // Case 1: PC with empty pools
      const pcEmpty: Combatant = {
        ...defaultCombatant,
        id: 'c-empty',
        name: 'Empty PC',
        type: 'pc',
        characterId: 'char-empty'
      };
      useDashboardStore.setState(prev => ({
        ...prev,
        characters: [
          {
            id: 'char-empty',
            playerName: 'Player 1',
            characterName: 'Empty PC',
            ac: 15, maxHp: 30, tempHp: 0, currentHp: 30, conditions: '', passivePerception: 10, level: 5, statusId: 1, statusName: 'Active', notes: '', isActive: true, class: 'Hero', hitDiceConfig: '1d8', hitDiceUsed: '0', abilityScores: '{}', proficiencies: '{}',
            resourcePools: '[]'
          }
        ]
      }));

      const { container: containerPC } = render(<CombatantCard {...defaultProps} c={pcEmpty} />);
      expect(containerPC.querySelector('[id^="compact-pool-"]')).toBeNull();

      // Case 2: NPC combatant
      const npc: Combatant = {
        ...defaultCombatant,
        id: 'c-npc',
        name: 'Monster',
        type: 'npc',
      };
      useDashboardStore.setState(prev => ({ ...prev, characters: [] }));

      const { container: containerNPC } = render(<CombatantCard {...defaultProps} c={npc} />);
      expect(containerNPC.querySelector('[id^="compact-pool-"]')).toBeNull();
    });

    it('shows counter format (e.g. 2/3) and does not render rounded-full pip elements', () => {
      const pc: Combatant = {
        ...defaultCombatant,
        id: 'c-format',
        name: 'Hero',
        type: 'pc',
        characterId: 'char-format'
      };
      useDashboardStore.setState(prev => ({
        ...prev,
        characters: [
          {
            id: 'char-format',
            playerName: 'Player 1',
            characterName: 'Hero',
            ac: 15, maxHp: 30, tempHp: 0, currentHp: 30, conditions: '', passivePerception: 10, level: 5, statusId: 1, statusName: 'Active', notes: '', isActive: true, class: 'Hero', hitDiceConfig: '1d8', hitDiceUsed: '0', abilityScores: '{}', proficiencies: '{}',
            resourcePools: JSON.stringify([
              { name: 'Ki Points', current: 2, max: 3, reset: 'short' }
            ])
          }
        ]
      }));

      const { container } = render(<CombatantCard {...defaultProps} c={pc} />);
      expect(screen.getByText('2/3')).toBeInTheDocument();
      
      const compactRow = container.querySelector('[id^="compact-pool-"]');
      expect(compactRow).toBeInTheDocument();
      const pips = compactRow?.querySelectorAll('.rounded-full');
      expect(pips?.length || 0).toBe(0);
    });

    it('handles increment/decrement interactions on compact resource buttons and respects disabled states', async () => {
      const pc: Combatant = {
        ...defaultCombatant,
        id: 'c-int',
        name: 'Hero',
        type: 'pc',
        characterId: 'char-int'
      };
      
      const charMock = {
        id: 'char-int',
        playerName: 'Player 1',
        characterName: 'Hero',
        ac: 15, maxHp: 30, tempHp: 0, currentHp: 30, conditions: '', passivePerception: 10, level: 5, statusId: 1, statusName: 'Active', notes: '', isActive: true, class: 'Hero', hitDiceConfig: '1d8', hitDiceUsed: '0', abilityScores: '{}', proficiencies: '{}',
        resourcePools: JSON.stringify([
          { name: 'Infused Items', current: 4, max: 4, reset: 'long' },
          { name: 'Spell Slots', current: 7, max: 10, reset: 'long' },
          { name: 'Rage', current: 0, max: 2, reset: 'long' }
        ])
      };

      useDashboardStore.setState(prev => ({
        ...prev,
        characters: [charMock]
      }));

      vi.mocked(updateCharacterDB).mockResolvedValue(undefined as any);

      const { container } = render(<CombatantCard {...defaultProps} c={pc} />);

      // Verify recover button for Infused Items is disabled initially (4/4)
      const recoverInfusedBtn = container.querySelector('#compact-recover-c-int-infused-items') as HTMLButtonElement;
      expect(recoverInfusedBtn).toBeInTheDocument();
      expect(recoverInfusedBtn.disabled).toBe(true);

      const spendInfusedBtn = container.querySelector('#compact-spend-c-int-infused-items') as HTMLButtonElement;
      expect(spendInfusedBtn).toBeInTheDocument();
      expect(spendInfusedBtn.disabled).toBe(false);

      fireEvent.click(spendInfusedBtn);

      expect(updateCharacterDB).toHaveBeenCalledWith(
        {
          resourcePools: JSON.stringify([
            { name: 'Infused Items', current: 3, max: 4, reset: 'long' },
            { name: 'Spell Slots', current: 7, max: 10, reset: 'long' },
            { name: 'Rage', current: 0, max: 2, reset: 'long' }
          ])
        },
        expect.objectContaining({ id: 'char-int' })
      );

      // Verify recover button for Infused Items is no longer disabled after spending (3/4)
      expect(recoverInfusedBtn.disabled).toBe(false);

      const recoverSpellBtn = container.querySelector('#compact-recover-c-int-spell-slots') as HTMLButtonElement;
      expect(recoverSpellBtn).toBeInTheDocument();
      expect(recoverSpellBtn.disabled).toBe(false);

      fireEvent.click(recoverSpellBtn);

      expect(updateCharacterDB).toHaveBeenCalledWith(
        {
          resourcePools: JSON.stringify([
            { name: 'Infused Items', current: 3, max: 4, reset: 'long' },
            { name: 'Spell Slots', current: 8, max: 10, reset: 'long' },
            { name: 'Rage', current: 0, max: 2, reset: 'long' }
          ])
        },
        expect.objectContaining({ id: 'char-int' })
      );

      const spendRageBtn = container.querySelector('#compact-spend-c-int-rage') as HTMLButtonElement;
      expect(spendRageBtn).toBeInTheDocument();
      expect(spendRageBtn.disabled).toBe(true);
    });

    it('Bardic Inspiration renders with a truncated label and Rage renders without truncation', () => {
      const pc: Combatant = {
        ...defaultCombatant,
        id: 'c-trunc',
        name: 'Bard',
        type: 'pc',
        characterId: 'char-trunc'
      };
      useDashboardStore.setState(prev => ({
        ...prev,
        characters: [
          {
            id: 'char-trunc',
            playerName: 'Player 1',
            characterName: 'Bard',
            ac: 15, maxHp: 30, tempHp: 0, currentHp: 30, conditions: '', passivePerception: 10, level: 5, statusId: 1, statusName: 'Active', notes: '', isActive: true, class: 'Bard', hitDiceConfig: '1d8', hitDiceUsed: '0', abilityScores: '{}', proficiencies: '{}',
            resourcePools: JSON.stringify([
              { name: 'Bardic Inspiration', current: 3, max: 5, reset: 'long' },
              { name: 'Rage', current: 2, max: 2, reset: 'long' }
            ])
          }
        ]
      }));
      render(<CombatantCard {...defaultProps} c={pc} />);
      expect(screen.getByText('Bardic Ins...')).toBeInTheDocument();
      expect(screen.getByText('Rage')).toBeInTheDocument();
    });

    it('shows ResourcePoolsSection in expanded PC card, but not for NPC cards', () => {
      // PC Expanded
      const pc: Combatant = {
        ...defaultCombatant,
        id: 'c-pc-expanded',
        name: 'Hero',
        type: 'pc',
        characterId: 'char-expanded'
      };
      
      const charMock = {
        id: 'char-expanded',
        playerName: 'Player 1',
        characterName: 'Hero',
        ac: 15, maxHp: 30, tempHp: 0, currentHp: 30, conditions: '', passivePerception: 10, level: 5, statusId: 1, statusName: 'Active', notes: '', isActive: true, class: 'Hero', hitDiceConfig: '1d8', hitDiceUsed: '0', abilityScores: '{}', proficiencies: '{}',
        resourcePools: JSON.stringify([
          { name: 'Ki Points', current: 2, max: 3, reset: 'short' }
        ])
      };

      useDashboardStore.setState(prev => ({
        ...prev,
        characters: [charMock]
      }));

      render(<CombatantCard {...defaultProps} c={pc} isExpanded={true} />);
      expect(screen.getByText('Class Resource Trackers')).toBeInTheDocument();

      // NPC Expanded
      const npc: Combatant = {
        ...defaultCombatant,
        id: 'c-npc-expanded',
        name: 'Goblin',
        type: 'npc'
      };

      const { container: containerNPC } = render(<CombatantCard {...defaultProps} c={npc} isExpanded={true} />);
      expect(containerNPC.querySelector('#resource-pools-section')).toBeNull();
    });
  });

  describe('StatBlock Integration in Expanded Card', () => {
    it('ranks and renders read-only StatBlock for a PC when character data is available', () => {
      const pc: Combatant = {
        ...defaultCombatant,
        id: 'combat-pc-char-stat',
        name: 'Hero',
        type: 'pc',
        characterId: 'char-stat'
      };
      
      const charMock = {
        id: 'char-stat',
        playerName: 'Player 1',
        characterName: 'Hero',
        ac: 15, maxHp: 30, tempHp: 0, currentHp: 30, conditions: '', passivePerception: 10, level: 5, statusId: 1, statusName: 'Active', notes: '', isActive: true, class: 'Hero', hitDiceConfig: '1d8', hitDiceUsed: '0',
        abilityScores: JSON.stringify({ STR: 18, DEX: 14, CON: 16, INT: 10, WIS: 12, CHA: 8 }),
        proficiencies: JSON.stringify({
          proficiencyBonus: 3,
          jackOfAllTrades: false,
          savingThrows: ['STR', 'CON'],
          skills: { Athletics: 'proficient' },
          passiveBonuses: { perception: 0, insight: 0, investigation: 0 },
        }),
      };

      useDashboardStore.setState(prev => ({
        ...prev,
        characters: [charMock]
      }));

      const { container } = render(<CombatantCard {...defaultProps} c={pc} isExpanded={true} />);
      
      // In read-only mode, ability score should render as text, not input
      const strBox = container.querySelector('#ability-box-str');
      expect(strBox).toBeInTheDocument();
      expect(strBox?.textContent).toContain('18');
      expect(container.querySelector('#ability-score-str')).toBeNull(); // Should be null because readOnly={true}
    });

    it('ranks and renders read-only StatBlock for an NPC when NPC template data is available in library', () => {
      const npc: Combatant = {
        ...defaultCombatant,
        id: 'combat-npc-npc-stat-0-123456789',
        name: 'Goblin Template',
        type: 'npc',
      };
      
      const npcMock = {
        id: 'npc-stat',
        name: 'Goblin Template',
        ac: 15,
        maxHp: 30,
        tempHp: 0,
        currentHp: 30,
        conditions: '',
        notes: '',
        resistances: '',
        immunities: '',
        vulnerabilities: '',
        legendaryActions: 0,
        legendaryResistances: 0,
        rechargeAbilities: [],
        abilityScores: JSON.stringify({ STR: 12, DEX: 15, CON: 10, INT: 10, WIS: 8, CHA: 8 }),
        proficiencies: JSON.stringify({
          proficiencyBonus: 2,
          jackOfAllTrades: false,
          savingThrows: [],
          skills: {},
          passiveBonuses: { perception: 0, insight: 0, investigation: 0 },
        }),
      };

      useDashboardStore.setState(prev => ({
        ...prev,
        npcs: [npcMock as NPC]
      }));

      const { container } = render(<CombatantCard {...defaultProps} c={npc} isExpanded={true} />);
      
      const dexBox = container.querySelector('#ability-box-dex');
      expect(dexBox).toBeInTheDocument();
      expect(dexBox?.textContent).toContain('15');
      expect(container.querySelector('#ability-score-dex')).toBeNull(); // Should be null because readOnly={true}
    });
  });
});
