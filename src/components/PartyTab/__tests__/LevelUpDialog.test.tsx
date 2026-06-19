import '@testing-library/jest-dom/vitest';
// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { LevelUpDialog } from '../LevelUpDialog';
import type { Character } from '../../../types';

describe('LevelUpDialog', () => {
  afterEach(() => {
    cleanup();
  });

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
    notes: 'Brave warrior, specializes in shields.',
    isActive: true,
    class: '',
    hitDiceConfig: '',
    hitDiceUsed: '{}',
  };

  const defaultProps = {
    character: mockCharacter,
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  it('Dialog renders with current character values pre-filled', () => {
    const { container } = render(<LevelUpDialog {...defaultProps} />);

    // Name context
    expect(screen.getByText(/Aethelgard the Valiant/)).toBeInTheDocument();

    // Inputs should be pre-filled
    const levelInput = container.querySelector('#new-level-input') as HTMLInputElement;
    const acInput = container.querySelector('#new-ac-input') as HTMLInputElement;
    const maxHpInput = container.querySelector('#new-max-hp-input') as HTMLInputElement;
    const perceptionInput = container.querySelector('#new-passive-perception') as HTMLInputElement;
    const notesTextarea = container.querySelector('#new-notes') as HTMLTextAreaElement;

    // Pre-filled current level + 1
    expect(levelInput.value).toBe('5');
    // Pre-filled current ac
    expect(acInput.value).toBe('18');
    // Pre-filled current maxHp
    expect(maxHpInput.value).toBe('45');
    // Pre-filled current passivePerception
    expect(perceptionInput.value).toBe('14');
    // Pre-filled current notes
    expect(notesTextarea.value).toBe('Brave warrior, specializes in shields.');
  });

  it('HP Increase field shows 0 when Max HP has not changed', () => {
    const { container } = render(<LevelUpDialog {...defaultProps} />);
    const hpIncreaseDisplay = container.querySelector('#hp-increase-display');
    expect(hpIncreaseDisplay?.textContent).toBe('0');
  });

  it('HP Increase field updates live when Max HP input changes', () => {
    const { container } = render(<LevelUpDialog {...defaultProps} />);
    const maxHpInput = container.querySelector('#new-max-hp-input') as HTMLInputElement;
    const hpIncreaseDisplay = container.querySelector('#hp-increase-display');

    // Change Max HP from 45 to 55
    fireEvent.change(maxHpInput, { target: { value: '55' } });

    expect(hpIncreaseDisplay?.textContent).toBe('10');
  });

  it('Confirm button calls onConfirm with only changed fields', () => {
    const onConfirmMock = vi.fn();
    const { container } = render(<LevelUpDialog {...defaultProps} onConfirm={onConfirmMock} />);
    const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;

    fireEvent.click(confirmBtn);

    // Only level should be changed implicitly (from 4 to 5)
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    expect(onConfirmMock).toHaveBeenCalledWith({
      level: 5,
    });
  });

  it('When Max HP changes and the current HP checkbox is checked, onConfirm includes currentHp increase capped at new maxHp', () => {
    const onConfirmMock = vi.fn();
    const { container } = render(<LevelUpDialog {...defaultProps} onConfirm={onConfirmMock} />);
    const maxHpInput = container.querySelector('#new-max-hp-input') as HTMLInputElement;
    const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;

    // Change maxHp from 45 to 50 (+5 HP)
    fireEvent.change(maxHpInput, { target: { value: '50' } });

    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    expect(onConfirmMock).toHaveBeenCalledWith({
      level: 5,
      maxHp: 50,
      currentHp: 45, // (initial 40 + 5)
    });
  });

  it('When Max HP changes and the current HP checkbox is checked, currentHp increase is capped at new maxHp', () => {
    const onConfirmMock = vi.fn();
    // Start with current HP closer to max HP
    const nearMaxHpChar = { ...mockCharacter, currentHp: 44 }; // maxHp is 45
    const { container } = render(
      <LevelUpDialog {...defaultProps} character={nearMaxHpChar} onConfirm={onConfirmMock} />
    );
    const maxHpInput = container.querySelector('#new-max-hp-input') as HTMLInputElement;
    const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;

    // Change maxHp from 45 to 48 (+3 HP)
    // 44 + 3 = 47, capped at 48 is 47.
    fireEvent.change(maxHpInput, { target: { value: '48' } });
    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalledWith({
      level: 5,
      maxHp: 48,
      currentHp: 47,
    });
  });

  it('When Max HP changes and the current HP checkbox is unchecked, onConfirm does not include currentHp', () => {
    const onConfirmMock = vi.fn();
    const { container } = render(<LevelUpDialog {...defaultProps} onConfirm={onConfirmMock} />);
    const maxHpInput = container.querySelector('#new-max-hp-input') as HTMLInputElement;
    const alsoIncreaseHpCheckbox = container.querySelector('#also-increase-hp') as HTMLInputElement;
    const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;

    // Change maxHp from 45 to 50
    fireEvent.change(maxHpInput, { target: { value: '50' } });

    // Uncheck alsoIncreaseHp
    fireEvent.click(alsoIncreaseHpCheckbox);

    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    expect(onConfirmMock).toHaveBeenCalledWith({
      level: 5,
      maxHp: 50,
      // No currentHp in updates payload
    });
  });

  it('Cancel button calls onClose without calling onConfirm', () => {
    const onCloseMock = vi.fn();
    const onConfirmMock = vi.fn();
    const { container } = render(
      <LevelUpDialog {...defaultProps} onClose={onCloseMock} onConfirm={onConfirmMock} />
    );
    const cancelBtn = container.querySelector('#cancel-dialog-btn') as HTMLButtonElement;

    fireEvent.click(cancelBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
    expect(onConfirmMock).not.toHaveBeenCalled();
  });

  it('Level is always included in the onConfirm payload', () => {
    const onConfirmMock = vi.fn();
    const { container } = render(<LevelUpDialog {...defaultProps} onConfirm={onConfirmMock} />);
    const levelInput = container.querySelector('#new-level-input') as HTMLInputElement;
    const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;

    // Explicitly change level back to 4 (no change from current level)
    fireEvent.change(levelInput, { target: { value: '4' } });

    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    expect(onConfirmMock).toHaveBeenCalledWith({
      level: 4,
    });
  });

  it('updates hit dice and class for existing class level up', () => {
    const onConfirmMock = vi.fn();
    const wizardChar: Character = {
      ...mockCharacter,
      class: 'wizard',
      hitDiceConfig: '4d6',
    };
    const { container } = render(<LevelUpDialog {...defaultProps} character={wizardChar} onConfirm={onConfirmMock} />);
    const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;

    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalledWith(expect.objectContaining({
      level: 5,
      class: 'wizard',
      hitDiceConfig: '5d6',
    }));
  });

  it('updates hit dice and class when multiclassing into a new class', () => {
    const onConfirmMock = vi.fn();
    const wizardChar: Character = {
      ...mockCharacter,
      class: 'wizard',
      hitDiceConfig: '4d6',
    };
    const { container } = render(<LevelUpDialog {...defaultProps} character={wizardChar} onConfirm={onConfirmMock} />);
    
    // Select multiclass radio button
    const multiclassRadio = container.querySelector('#multiclass-radio-btn') as HTMLInputElement;
    fireEvent.click(multiclassRadio);

    // Type in new class name
    const classNameInput = container.querySelector('#new-class-name') as HTMLInputElement;
    fireEvent.change(classNameInput, { target: { value: 'fighter' } });

    // Select hit die size d10
    const hitDieSelect = container.querySelector('#new-class-hitdie') as HTMLSelectElement;
    fireEvent.change(hitDieSelect, { target: { value: '10' } });

    const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalledWith(expect.objectContaining({
      level: 5,
      class: 'wizard/fighter',
      hitDiceConfig: '1d10+4d6',
    }));
  });
});
