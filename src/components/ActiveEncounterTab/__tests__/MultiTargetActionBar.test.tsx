import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MultiTargetActionBar } from '../MultiTargetActionBar';

describe('MultiTargetActionBar', () => {
  afterEach(cleanup);

  const defaultProps = {
    selectedCount: 2,
    onApplyDamage: vi.fn(),
    onApplyHealing: vi.fn(),
    onApplyCondition: vi.fn(),
    onClearSelection: vi.fn(),
  };

  it('renders correctly when combatants are selected', () => {
    render(<MultiTargetActionBar {...defaultProps} />);
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('Targets')).toBeDefined();
    expect(screen.getByPlaceholderText('Amount')).toBeDefined();
    expect(screen.getByPlaceholderText('e.g. Paralyzed')).toBeDefined();
  });

  it('does not render when selectedCount is 0', () => {
    const { container } = render(<MultiTargetActionBar {...defaultProps} selectedCount={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onApplyDamage with correct values', () => {
    const onApplyDamage = vi.fn();
    render(<MultiTargetActionBar {...defaultProps} onApplyDamage={onApplyDamage} />);
    
    const damageInput = screen.getByPlaceholderText('Amt');
    const typeSelect = screen.getByRole('combobox');
    const goBtn = screen.getByText('Apply Damage');

    fireEvent.change(damageInput, { target: { value: '15' } });
    fireEvent.change(typeSelect, { target: { value: 'fire' } });
    fireEvent.click(goBtn);

    expect(onApplyDamage).toHaveBeenCalledWith(15, 'fire');
  });

  it('calls onApplyHealing with correct values', () => {
    const onApplyHealing = vi.fn();
    render(<MultiTargetActionBar {...defaultProps} onApplyHealing={onApplyHealing} />);
    
    const healInput = screen.getByPlaceholderText('Amount');
    const healBtn = screen.getByText('Apply Healing');

    fireEvent.change(healInput, { target: { value: '20' } });
    fireEvent.click(healBtn);

    expect(onApplyHealing).toHaveBeenCalledWith(20);
  });

  it('calls onApplyCondition with correct values', () => {
    const onApplyCondition = vi.fn();
    render(<MultiTargetActionBar {...defaultProps} onApplyCondition={onApplyCondition} />);
    
    const condInput = screen.getByPlaceholderText('e.g. Paralyzed');
    const addBtn = screen.getByText('Add Condition');

    fireEvent.change(condInput, { target: { value: 'Stunned' } });
    fireEvent.click(addBtn);

    expect(onApplyCondition).toHaveBeenCalledWith('Stunned');
  });

  it('calls onClearSelection when X is clicked', () => {
    const onClearSelection = vi.fn();
    render(<MultiTargetActionBar {...defaultProps} onClearSelection={onClearSelection} />);
    
    const closeBtn = screen.getByTitle('Clear selection and exit');
    fireEvent.click(closeBtn);

    expect(onClearSelection).toHaveBeenCalled();
  });
});
