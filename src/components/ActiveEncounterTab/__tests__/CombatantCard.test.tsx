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
    healthInput: '',
    currentRound: 1,
    onHealthInputChange: vi.fn(),
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
    // The Eye button is the third button (HEAL is 0, DMG is 1, Eye is 2)
    fireEvent.click(buttons[2]);
    expect(onToggleExpand).toHaveBeenCalled();
  });

  it('The conditions section is visible when the card is expanded', () => {
    render(<CombatantCard {...defaultProps} isExpanded={true} />);
    // The text 'Conditions' and input are rendered
    expect(screen.getByText('Conditions')).toBeDefined();
    expect(screen.getByDisplayValue('Poisoned')).toBeDefined();
  });

  it('Clicking the Remove button calls the onRemove prop with the combatant id', () => {
    const onRemoveCombatant = vi.fn();
    render(<CombatantCard {...defaultProps} isExpanded={true} onRemoveCombatant={onRemoveCombatant} />);
    fireEvent.click(screen.getByRole('button', { name: /Remove/i }));
    expect(onRemoveCombatant).toHaveBeenCalledTimes(1);
  });

  it('Clicking the HEAL button calls onHealthChange with isDamage false', () => {
    const onHealthSubmit = vi.fn();
    render(<CombatantCard {...defaultProps} onHealthSubmit={onHealthSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /HEAL/i }));
    expect(onHealthSubmit).toHaveBeenCalledWith(false);
  });

  it('Clicking the DMG button calls onHealthChange with isDamage true', () => {
    const onHealthSubmit = vi.fn();
    render(<CombatantCard {...defaultProps} onHealthSubmit={onHealthSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /DMG/i }));
    expect(onHealthSubmit).toHaveBeenCalledWith(true);
  });

  it('Typing a number and pressing Enter in the HP input calls onHealthChange', () => {
    const onHealthSubmit = vi.fn();
    render(<CombatantCard {...defaultProps} onHealthSubmit={onHealthSubmit} healthInput="5" />);
    // Input placeholder is "0" for health.
    const input = screen.getAllByPlaceholderText('0')[0];
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onHealthSubmit).toHaveBeenCalledWith(true);
  });
});
