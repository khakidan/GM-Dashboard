import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NpcLegendarySection } from '../NpcLegendarySection';
import { NpcRechargeSection, RechargeAbility } from '../NpcRechargeSection';

describe('NpcCard Sub-components', () => {
  afterEach(() => {
    cleanup();
  });

  describe('NpcLegendarySection', () => {
    it('renders legendary action count when legendaryActions > 0', () => {
      const handleUpdate = vi.fn();
      render(
        <NpcLegendarySection
          legendaryActions={3}
          legendaryResistances={2}
          onUpdate={handleUpdate}
        />
      );

      const actionInput = screen.getByTestId('legendary-actions-input') as HTMLInputElement;
      expect(actionInput).toBeDefined();
      expect(actionInput.value).toBe('3');

      const resistanceInput = screen.getByTestId('legendary-resistances-input') as HTMLInputElement;
      expect(resistanceInput).toBeDefined();
      expect(resistanceInput.value).toBe('2');
    });

    it('renders 0 when legendaryActions is undefined', () => {
      const handleUpdate = vi.fn();
      render(
        <NpcLegendarySection
          legendaryActions={undefined}
          legendaryResistances={1}
          onUpdate={handleUpdate}
        />
      );

      const actionInput = screen.getByTestId('legendary-actions-input') as HTMLInputElement;
      expect(actionInput).toBeDefined();
      expect(actionInput.value).toBe('0');
    });
  });

  describe('NpcRechargeSection', () => {
    it('renders each ability name from the rechargeAbilities array', () => {
      const handleAdd = vi.fn();
      const handleRemove = vi.fn();
      const mockAbilities: RechargeAbility[] = [
        { name: 'fire breath', rechargeOn: 5 },
        { name: 'frost bite', rechargeOn: 6 }
      ];

      render(
        <NpcRechargeSection
          rechargeAbilities={mockAbilities}
          onAddAbility={handleAdd}
          onRemoveAbility={handleRemove}
        />
      );

      expect(screen.getByText('fire breath')).toBeDefined();
      expect(screen.getByText('frost bite')).toBeDefined();
      expect(screen.queryByText('No recharge abilities')).toBeNull();
    });

    it('does not render the ability list when array is empty', () => {
      const handleAdd = vi.fn();
      const handleRemove = vi.fn();

      render(
        <NpcRechargeSection
          rechargeAbilities={[]}
          onAddAbility={handleAdd}
          onRemoveAbility={handleRemove}
        />
      );

      // It should display the empty placeholder text
      expect(screen.getByText(/No recharge abilities/i)).toBeDefined();
    });
  });
});
