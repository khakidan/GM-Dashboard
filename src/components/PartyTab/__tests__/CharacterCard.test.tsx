// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { CharacterCard } from '../CharacterCard';
import type { Character } from '../../../types';

describe('CharacterCard', () => {
  const mockCharacter: Character = {
    id: 'char123',
    playerName: 'John Doe',
    characterName: 'Aethelgard the Valiant',
    ac: 18,
    maxHp: 45,
    tempHp: 0,
    currentHp: 40,
    conditions: 'None',
    passivePerception: 14,
    level: 4,
    statusId: 1,
    statusName: 'Active',
    notes: 'Brave warrior.',
    isActive: true,
    class: 'Fighter',
    tempAc: 0,
    hitDiceConfig: '',
    hitDiceUsed: '{}',
    abilityScores: '{}',
    proficiencies: '{}',
  };

  const defaultProps = {
    character: mockCharacter,
    isSyncing: false,
    isExpanded: false,
    onToggleExpand: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onLevelUpClick: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('The AC modifier spinner renders with value 0 when character.tempAc is 0 or undefined', () => {
    const charWithZeroTempAc = { ...mockCharacter, tempAc: 0 };
    const { rerender } = render(<CharacterCard {...defaultProps} character={charWithZeroTempAc} />);

    const spinner = screen.getByTestId('ac-mod-spinner') as HTMLInputElement;
    expect(spinner.value).toBe('0');

    // Also template-render with tempAc as undefined
    const charWithUndefinedTempAc = { ...mockCharacter, tempAc: undefined };
    rerender(<CharacterCard {...defaultProps} character={charWithUndefinedTempAc} />);
    
    expect(spinner.value).toBe('0');
  });

  it('The AC modifier spinner renders with value 2 when character.tempAc is 2', () => {
    const charWithTwoTempAc = { ...mockCharacter, tempAc: 2 };
    render(<CharacterCard {...defaultProps} character={charWithTwoTempAc} />);

    const spinner = screen.getByTestId('ac-mod-spinner') as HTMLInputElement;
    expect(spinner.value).toBe('2');
  });

  it('When the spinner value changes to 3, handleUpdate is called with { tempAc: 3 }', async () => {
    const onUpdateMock = vi.fn();
    render(<CharacterCard {...defaultProps} onUpdate={onUpdateMock} />);

    const spinner = screen.getByTestId('ac-mod-spinner') as HTMLInputElement;
    fireEvent.change(spinner, { target: { value: '3' } });

    // Ensure the display updates instantaneously (local state)
    expect(spinner.value).toBe('3');

    // It should not call onUpdate immediately (under 600ms debounce)
    expect(onUpdateMock).not.toHaveBeenCalled();

    // Fast-forward by 600ms
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(onUpdateMock).toHaveBeenCalledTimes(1);
    expect(onUpdateMock).toHaveBeenCalledWith({ tempAc: 3 });
  });

  it('When the spinner value is non-zero, the effective AC is correctly calculated', () => {
    const charWithTempAc = { ...mockCharacter, ac: 18, tempAc: -2 };
    render(<CharacterCard {...defaultProps} character={charWithTempAc} />);

    const effAcDisplay = screen.getByTestId('eff-ac');
    expect(effAcDisplay.textContent).toBe('16 (-2)');
  });
});
