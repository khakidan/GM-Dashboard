import '@testing-library/jest-dom/vitest';
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

  it('calls onApplyDamage with correct amount and type when submitted', () => {
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

  it('calls onApplyHealing with correct amount when submitted', () => {
    const onApplyHealing = vi.fn();
    render(<MultiTargetActionPanel {...defaultProps} onApplyHealing={onApplyHealing} />);
    
    const healingInput = screen.getByPlaceholderText('Amount');
    fireEvent.change(healingInput, { target: { value: '18' } });

    const healingBtn = screen.getByRole('button', { name: /Apply Healing/i });
    fireEvent.click(healingBtn);

    expect(onApplyHealing).toHaveBeenCalledWith(18);
  });
});
