import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MultiTargetActionPanel } from '../MultiTargetActionPanel';

describe('MultiTargetActionPanel', () => {
  afterEach(cleanup);

  const defaultProps = {
    selectedCount: 3,
    onApplyDamage: vi.fn(),
    onApplyHealing: vi.fn(),
    onApplyCondition: vi.fn(),
    onDeleteSelected: vi.fn(),
    onCancelSelection: vi.fn(),
  };

  it('renders correctly with selecting header and count', () => {
    render(<MultiTargetActionPanel {...defaultProps} />);
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('Combatants Selected')).toBeDefined();
    expect(screen.getByPlaceholderText('Amt')).toBeDefined();
    expect(screen.getByPlaceholderText('e.g. Paralyzed')).toBeDefined();
  });

  it('buttons are disabled when input fields are empty', () => {
    render(<MultiTargetActionPanel {...defaultProps} />);
    
    const damageBtn = screen.getByRole('button', { name: /Apply Damage/i }) as HTMLButtonElement;
    expect(damageBtn.disabled).toBe(true);

    const healingBtn = screen.getByRole('button', { name: /Apply Healing/i }) as HTMLButtonElement;
    expect(healingBtn.disabled).toBe(true);

    const conditionBtn = screen.getByRole('button', { name: /Add Condition/i }) as HTMLButtonElement;
    expect(conditionBtn.disabled).toBe(true);
  });

  it('buttons are disabled globally when selectedCount is 0', () => {
    render(<MultiTargetActionPanel {...defaultProps} selectedCount={0} />);
    
    // Inputs should be disabled when nothing is selected
    const damageInput = screen.getByPlaceholderText('Amt') as HTMLInputElement;
    expect(damageInput.disabled).toBe(true);

    const healingInput = screen.getByPlaceholderText('Amount') as HTMLInputElement;
    expect(healingInput.disabled).toBe(true);

    const condInput = screen.getByPlaceholderText('e.g. Paralyzed') as HTMLInputElement;
    expect(condInput.disabled).toBe(true);
  });

  it('calls onApplyDamage with correct amount and type', () => {
    const onApplyDamage = vi.fn();
    render(<MultiTargetActionPanel {...defaultProps} onApplyDamage={onApplyDamage} />);
    
    const damageInput = screen.getByPlaceholderText('Amt');
    const typeSelect = screen.getByRole('combobox');
    
    fireEvent.change(damageInput, { target: { value: '25' } });
    fireEvent.change(typeSelect, { target: { value: 'cold' } });

    const damageBtn = screen.getByRole('button', { name: /Apply Damage/i });
    fireEvent.click(damageBtn);

    expect(onApplyDamage).toHaveBeenCalledWith(25, 'cold');
  });

  it('calls onApplyHealing with correct heal amount', () => {
    const onApplyHealing = vi.fn();
    render(<MultiTargetActionPanel {...defaultProps} onApplyHealing={onApplyHealing} />);
    
    const healingInput = screen.getByPlaceholderText('Amount');
    fireEvent.change(healingInput, { target: { value: '18' } });

    const healingBtn = screen.getByRole('button', { name: /Apply Healing/i });
    fireEvent.click(healingBtn);

    expect(onApplyHealing).toHaveBeenCalledWith(18);
  });

  it('calls onApplyCondition with correct condition text', () => {
    const onApplyCondition = vi.fn();
    render(<MultiTargetActionPanel {...defaultProps} onApplyCondition={onApplyCondition} />);
    
    const condInput = screen.getByPlaceholderText('e.g. Paralyzed');
    fireEvent.change(condInput, { target: { value: 'Blinded' } });

    const conditionBtn = screen.getByRole('button', { name: /Add Condition/i });
    fireEvent.click(conditionBtn);

    expect(onApplyCondition).toHaveBeenCalledWith('Blinded');
  });

  it('clicking Delete Selected calls onDeleteSelected', () => {
    const onDeleteSelected = vi.fn();
    render(<MultiTargetActionPanel {...defaultProps} onDeleteSelected={onDeleteSelected} />);
    
    const deleteBtn = screen.getByRole('button', { name: /Delete Selected/i });
    fireEvent.click(deleteBtn);

    expect(onDeleteSelected).toHaveBeenCalledTimes(1);
  });

  it('clicking Cancel calls onCancelSelection', () => {
    const onCancelSelection = vi.fn();
    render(<MultiTargetActionPanel {...defaultProps} onCancelSelection={onCancelSelection} />);
    
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(onCancelSelection).toHaveBeenCalledTimes(1);
  });
});
