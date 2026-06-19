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
import type { Combatant } from '../../../types';
import { useDashboardStore } from '../../../hooks/useAppState';

vi.mock('../../../lib/diceRoller', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/diceRoller')>();
  return {
    ...actual,
    rollDice: vi.fn(actual.rollDice)
  };
});

describe('CombatantCard', () => {
  afterEach(() => cleanup());

  const defaultCombatant: Combatant = {
    id: 'c1',
    name: 'Goblin',
    type: 'npc',
    ac: 15,
    maxHp: 30,
    currentHp: 15,
    initiative: 10,
    conditions: 'Poisoned',
    notes: 'Some notes',
    passivePerception: 10,
  };

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
      expect(checkbox).toBeDefined();
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
      expect(button).toBeDefined();
      expect(screen.queryByText('REACTION USED')).toBeNull();
    });

    it('Verify reaction pill renders in USED state when reactionUsed is true', () => {
      render(<CombatantCard {...defaultProps} c={{ ...defaultCombatant, reactionUsed: true }} />);
      const button = screen.getByRole('button', { name: /REACTION USED/i });
      expect(button).toBeDefined();
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

  describe('Collapsed Header Layout Refactoring', () => {
    it('The collapsed card header contains exactly two direct child flex containers', () => {
      render(<CombatantCard {...defaultProps} />);
      const row = screen.getByTestId('collapsed-card-row');
      expect(row).toBeDefined();
      
      const leftContainer = screen.getByTestId('left-container');
      const rightContainer = screen.getByTestId('right-container');
      
      expect(leftContainer).toBeDefined();
      expect(rightContainer).toBeDefined();
      
      // Verify that leftContainer and rightContainer are indeed direct children of row
      expect(row.children.length).toBe(2);
      expect(row.children[0]).toBe(leftContainer);
      expect(row.children[1]).toBe(rightContainer);
    });

    it('The combatant name, initiative bubble, DMG button, and HEAL button are in the correct containers', () => {
      render(<CombatantCard {...defaultProps} />);
      const leftContainer = screen.getByTestId('left-container');
      const rightContainer = screen.getByTestId('right-container');
      
      // Verify combatant name inside left container
      const nameEl = screen.getByText('Goblin');
      expect(leftContainer.contains(nameEl)).toBe(true);
      
      // Verify initiative bubble inside left container
      const initLabel = screen.getByText('Init');
      expect(leftContainer.contains(initLabel)).toBe(true);
      
      // Verify DMG and HEAL buttons inside right container
      const dmgBtn = screen.getByRole('button', { name: /DMG/i });
      const healBtn = screen.getByRole('button', { name: /HEAL/i });
      
      expect(rightContainer.contains(dmgBtn)).toBe(true);
      expect(rightContainer.contains(healBtn)).toBe(true);
    });

    it('The left and right containers have correct flex alignment classes', () => {
      render(<CombatantCard {...defaultProps} />);
      const leftContainer = screen.getByTestId('left-container');
      const rightContainer = screen.getByTestId('right-container');
      
      // Check for alignment classes (justify-start / items-center or justify-end / items-center)
      expect(leftContainer.className).toContain('justify-start');
      expect(leftContainer.className).toContain('items-center');
      expect(rightContainer.className).toContain('justify-end');
      expect(rightContainer.className).toContain('items-center');
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
      expect(indicator).toBeDefined();
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
      expect(indicator).toBeDefined();
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
      expect(indicator).toBeDefined();
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
      expect(pill).toBeDefined();
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
      expect(pill).toBeDefined();
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
});
