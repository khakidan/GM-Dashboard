import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NpcLegendarySection } from '../NpcLegendarySection';
import { NpcRechargeSection, RechargeAbility } from '../NpcRechargeSection';
import { NpcCard } from '../NpcCard';
import type { NPC } from '../../../types';

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

      expect(screen.getByText('fire breath')).toBeInTheDocument();
      expect(screen.getByText('frost bite')).toBeInTheDocument();
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
      expect(screen.getByText(/No recharge abilities/i)).toBeInTheDocument();
    });
  });

  describe('NpcCard (StatBlock Integration)', () => {
    it('renders StatBlock with ability scores when expanded', () => {
      const mockNpc = {
        id: 'npc-1',
        name: 'Goblin Warrior',
        ac: 12,
        maxHp: 15,
        tempHp: 0,
        currentHp: 15,
        conditions: '',
        notes: '',
        abilityScores: JSON.stringify({ STR: 8, DEX: 14, CON: 10, INT: 10, WIS: 8, CHA: 8 }),
        proficiencies: JSON.stringify({
          proficiencyBonus: 2,
          jackOfAllTrades: false,
          savingThrows: [],
          skills: {},
          passiveBonuses: { perception: 0, insight: 0, investigation: 0 },
        }),
      };

      const handleUpdate = vi.fn();
      const handleDelete = vi.fn();
      const handleResetHp = vi.fn();
      const handleToggleExpand = vi.fn();

      const { container } = render(
        <NpcCard
          npc={mockNpc as NPC}
          isSyncing={false}
          isExpanded={true}
          onToggleExpand={handleToggleExpand}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onResetHp={handleResetHp}
        />
      );

      // StatBlock in editable mode should render HTML input elements for scores
      const strInput = container.querySelector('#ability-score-str') as HTMLInputElement;
      expect(strInput).toBeInTheDocument();
      expect(strInput.value).toBe('8');

      const dexInput = container.querySelector('#ability-score-dex') as HTMLInputElement;
      expect(dexInput).toBeInTheDocument();
      expect(dexInput.value).toBe('14');
    });
  });
});
