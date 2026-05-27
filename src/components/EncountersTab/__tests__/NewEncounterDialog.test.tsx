import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { NewEncounterDialog } from '../NewEncounterDialog';

describe('NewEncounterDialog', () => {
  afterEach(cleanup);

  const mockDifficulties = [
    { id: 1, name: 'Easy' },
    { id: 2, name: 'Medium' },
    { id: 3, name: 'Hard' },
    { id: 4, name: 'Deadly' },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    difficulties: mockDifficulties,
  };

  it('renders correctly when open', () => {
    render(<NewEncounterDialog {...defaultProps} />);
    expect(screen.getByText('Plan New Encounter')).toBeDefined();
    expect(screen.getByPlaceholderText('e.g. Goblin Ambush')).toBeDefined();
    expect(screen.getByPlaceholderText('e.g. Whispering Woods')).toBeDefined();
  });

  it('Confirm button is disabled when name is empty', () => {
    render(<NewEncounterDialog {...defaultProps} />);
    const confirmBtn = screen.getByText('Add Encounter →') as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);

    fireEvent.change(screen.getByPlaceholderText('e.g. Goblin Ambush'), { target: { value: 'Boss Fight' } });
    expect(confirmBtn.disabled).toBe(false);

    fireEvent.change(screen.getByPlaceholderText('e.g. Goblin Ambush'), { target: { value: ' ' } });
    expect(confirmBtn.disabled).toBe(true);
  });

  it('calls onConfirm with correct fields', () => {
    const onConfirmMock = vi.fn();
    render(<NewEncounterDialog {...defaultProps} onConfirm={onConfirmMock} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Goblin Ambush'), { target: { value: 'Dragon Cave' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Whispering Woods'), { target: { value: 'Mount Doom' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '3' } }); // Hard

    fireEvent.click(screen.getByText('Add Encounter →'));

    expect(onConfirmMock).toHaveBeenCalledWith({
      name: 'Dragon Cave',
      location: 'Mount Doom',
      difficultyId: 3,
    });
  });

  it('calls onClose when Cancel is clicked', () => {
    const onCloseMock = vi.fn();
    render(<NewEncounterDialog {...defaultProps} onClose={onCloseMock} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCloseMock).toHaveBeenCalled();
  });
});
