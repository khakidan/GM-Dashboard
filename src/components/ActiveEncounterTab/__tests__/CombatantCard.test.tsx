// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CombatantCard } from '../CombatantCard';
import type { Combatant } from '../../../types';

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
  };

  it('The combatant name and AC are rendered', () => {
    render(<CombatantCard {...defaultProps} />);
    expect(screen.getByText('Goblin')).toBeDefined();
    expect(screen.getByText('(AC 15)')).toBeDefined();
  });

  it('The current HP value is displayed', () => {
    render(<CombatantCard {...defaultProps} />);
    expect(screen.getByText('15')).toBeDefined();
  });

  it('The Active badge is shown when isActive is true', () => {
    const { rerender } = render(<CombatantCard {...defaultProps} isActive={true} />);
    expect(screen.getByText('Active')).toBeDefined();

    rerender(<CombatantCard {...defaultProps} isActive={false} />);
    expect(screen.queryByText('Active')).toBeNull();
  });

  it('Clicking the expand/collapse button toggles the expanded section', () => {
    const onToggleExpand = vi.fn();
    render(<CombatantCard {...defaultProps} onToggleExpand={onToggleExpand} />);
    const buttons = screen.getAllByRole('button');
    // The Expand button is either 3rd or 4th depending on what's rendered, let's target by aria or title
    fireEvent.click(buttons.find(b => !b.textContent?.includes('DMG') && !b.textContent?.includes('HEAL') && (!b.textContent?.includes('REMOVE') || b.textContent === '')) || buttons[3]);
    expect(onToggleExpand).toHaveBeenCalled();
  });

  it('The conditions section is visible when the card is expanded', () => {
    render(<CombatantCard {...defaultProps} isExpanded={true} />);
    // The text 'Conditions' and input are rendered
    expect(screen.getByText('Conditions')).toBeDefined();
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
      expect(screen.getByText('SPD 0')).toBeDefined();
    });

    it('NO ACT badge renders when combatant has stunned condition', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'stunned'}} />);
      expect(screen.getByText('NO ACT')).toBeDefined();
    });

    it('DISADV badge renders when combatant has poisoned condition', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'poisoned'}} />);
      expect(screen.getByText('DISADV')).toBeDefined();
    });

    it('VULN badge renders when combatant has restrained condition', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'restrained'}} />);
      expect(screen.getByText('VULN')).toBeDefined();
    });

    it('AUTO CRIT badge renders when combatant has paralyzed condition', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'paralyzed'}} />);
      expect(screen.getByText('AUTO CRIT')).toBeDefined();
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
      expect(screen.getByText('Combat Mechanics')).toBeDefined();
      expect(screen.getByText('Speed: Locked')).toBeDefined();
    });

    it('Panel does not render when conditions string is empty', () => {
      render(<CombatantCard {...defaultProps} isExpanded={true} c={{...defaultCombatant, conditions: ''}} />);
      expect(screen.queryByText('Combat Mechanics')).toBeNull();
    });

    it('Auto-crit row appears when combatant has unconscious condition', () => {
      render(<CombatantCard {...defaultProps} isExpanded={true} c={{...defaultCombatant, conditions: 'unconscious'}} />);
      expect(screen.getByText(/Melee hits: Auto-crit/i)).toBeDefined();
    });
  });

  describe('Indicator Dots', () => {
    it('Red dot renders when combatant has an official condition', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'poisoned'}} />);
      expect(screen.getByTitle('Active conditions')).toBeDefined();
      expect(screen.queryByTitle('Active effects')).toBeNull();
    });

    it('Blue dot renders when combatant has an effect', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'hasted'}} />);
      expect(screen.getByTitle('Active effects')).toBeDefined();
      expect(screen.queryByTitle('Active conditions')).toBeNull();
    });

    it('Both dots render when combatant has both a condition and an effect', () => {
      render(<CombatantCard {...defaultProps} c={{...defaultCombatant, conditions: 'poisoned, hasted'}} />);
      expect(screen.getByTitle('Active conditions')).toBeDefined();
      expect(screen.getByTitle('Active effects')).toBeDefined();
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
});
