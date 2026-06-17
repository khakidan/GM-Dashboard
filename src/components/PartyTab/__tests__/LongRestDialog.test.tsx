import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { LongRestDialog } from '../LongRestDialog';
import { Character } from '../../../types';

describe('LongRestDialog', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockCharacters: Character[] = [
    {
      id: 'char-1',
      playerName: 'Matt',
      characterName: 'Caleb',
      level: 5,
      ac: 12,
      maxHp: 30,
      currentHp: 15,
      tempHp: 0,
      tempHpMax: 0,
      passivePerception: 13,
      statusId: 1,
      statusName: 'Active',
      notes: '',
      conditions: '',
      isActive: true,
      class: 'Wizard',
      hitDiceConfig: '5d8',
      hitDiceUsed: '{"d8":2}',
    },
    {
      id: 'char-2',
      playerName: 'Marisha',
      characterName: 'Beau',
      level: 5,
      ac: 16,
      maxHp: 45,
      currentHp: 40,
      tempHp: 5,
      tempHpMax: 0,
      passivePerception: 14,
      statusId: 1,
      statusName: 'Active',
      notes: '',
      conditions: '',
      isActive: true,
      class: 'Monk',
      hitDiceConfig: '5d8',
      hitDiceUsed: '{"d8":0}',
    },
  ];

  const defaultProps = {
    isOpen: true,
    characters: mockCharacters,
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  it('All active characters are listed with checkboxes checked by default', () => {
    const { container } = render(<LongRestDialog {...defaultProps} />);

    expect(screen.getByText('Caleb')).toBeDefined();
    expect(screen.getByText('Beau')).toBeDefined();

    // Verify checked by default
    const checkbox1 = container.querySelector('#checkbox-char-1') as HTMLInputElement;
    const checkbox2 = container.querySelector('#checkbox-char-2') as HTMLInputElement;

    expect(checkbox1.checked).toBe(true);
    expect(checkbox2.checked).toBe(true);
  });

  it('Unchecking a character removes them from the confirmed selection', () => {
    const { container } = render(<LongRestDialog {...defaultProps} />);

    // Click the row for Beau to uncheck her
    const row2 = container.querySelector('#char-row-char-2');
    expect(row2).toBeDefined();
    if (row2) fireEvent.click(row2);

    const checkbox2 = container.querySelector('#checkbox-char-2') as HTMLInputElement;
    expect(checkbox2.checked).toBe(false);
  });

  it('Apply button is disabled when no characters are checked', () => {
    const { container } = render(<LongRestDialog {...defaultProps} />);

    const applyBtn = container.querySelector('#long-rest-apply-btn') as HTMLButtonElement;
    expect(applyBtn.disabled).toBe(false);

    // Uncheck both
    const row1 = container.querySelector('#char-row-char-1');
    const row2 = container.querySelector('#char-row-char-2');
    if (row1) fireEvent.click(row1);
    if (row2) fireEvent.click(row2);

    expect(applyBtn.disabled).toBe(true);
    expect(applyBtn.getAttribute('title')).toBe('Select at least one character');
  });

  it('onConfirm is called with only the IDs of checked characters', () => {
    const onConfirmMock = vi.fn();
    const { container } = render(<LongRestDialog {...defaultProps} onConfirm={onConfirmMock} />);

    // Uncheck Beau (char-2)
    const row2 = container.querySelector('#char-row-char-2');
    if (row2) fireEvent.click(row2);

    const applyBtn = container.querySelector('#long-rest-apply-btn') as HTMLButtonElement;
    fireEvent.click(applyBtn);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    expect(onConfirmMock).toHaveBeenCalledWith(['char-1']);
  });

  it('onClose is called when Cancel is clicked', () => {
    const onCloseMock = vi.fn();
    const { container } = render(<LongRestDialog {...defaultProps} onClose={onCloseMock} />);

    const cancelBtn = container.querySelector('#long-rest-cancel-btn') as HTMLButtonElement;
    fireEvent.click(cancelBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
