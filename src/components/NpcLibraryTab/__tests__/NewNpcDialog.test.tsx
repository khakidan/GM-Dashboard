import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NewNpcDialog } from '../NewNpcDialog';

describe('NewNpcDialog', () => {
  afterEach(cleanup);

  it('renders correctly and accepts input', () => {
    const onConfirm = vi.fn();
    const { getByLabelText, getByRole, getByPlaceholderText, getAllByRole } = render(
      <NewNpcDialog isOpen={true} onClose={vi.fn()} onConfirm={onConfirm} />
    );

    expect(getByLabelText(/^NPC Name/i)).toBeDefined();
    
    // Test default values
    const legendaryActionsInput = getByLabelText(/^Legendary Actions$/i) as HTMLInputElement;
    expect(legendaryActionsInput.value).toBe('0');
    
    const legendaryResistancesInput = getByLabelText(/^Legendary Resistances$/i) as HTMLInputElement;
    expect(legendaryResistancesInput.value).toBe('0');

    // Test Recharge Abilities section
    const addAbilityButtons = getAllByRole('button', { name: /^Add Recharge Ability$/i });
    fireEvent.click(addAbilityButtons[0]);
    const abilityNameInput = getByPlaceholderText(/Ability name/i);
    fireEvent.change(abilityNameInput, { target: { value: 'Fireblast' } });
    
    // Fill required fields
    fireEvent.change(getByLabelText(/^NPC Name/i), { target: { value: 'Dragon' } });
    fireEvent.change(getByLabelText(/^Max HP/i), { target: { value: '100' } });

    // Test form submission
    fireEvent.click(getByRole('button', { name: /Add NPC/i }));

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Dragon',
      legendaryActions: 0,
      legendaryResistances: 0,
      rechargeAbilities: [ { name: 'Fireblast', rechargeOn: 5 } ]
    }));
  });

  it('shows validation error for empty ability name', () => {
    const onConfirm = vi.fn();
    const { getByLabelText, getByRole, getAllByRole, getByText } = render(
      <NewNpcDialog isOpen={true} onClose={vi.fn()} onConfirm={onConfirm} />
    );

    const addAbilityButtons = getAllByRole('button', { name: /^Add Recharge Ability$/i });
    fireEvent.click(addAbilityButtons[0]);
    
    // Fill required fields
    fireEvent.change(getByLabelText(/^NPC Name/i), { target: { value: 'Dragon' } });
    fireEvent.change(getByLabelText(/^Max HP/i), { target: { value: '100' } });

    // Try submit with empty name
    const submitBtn = getByRole('button', { name: /Add NPC/i });
    fireEvent.click(submitBtn);

    expect(onConfirm).not.toHaveBeenCalled();
    expect(getByText(/Ability name is required./i)).toBeDefined();
  });
});
