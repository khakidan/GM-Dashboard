import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SpellcastingStatsRow } from '../SpellcastingStatsRow';
import { AbilityScores } from '../../../types';
import '@testing-library/jest-dom/vitest';

describe('SpellcastingStatsRow Component', () => {
  afterEach(() => {
    cleanup();
  });

  const baseAbilityScores: AbilityScores = {
    STR: 10,
    DEX: 14,
    CON: 12,
    INT: 16,
    WIS: 13,
    CHA: 8,
  };
  // INT mod = +3, WIS mod = +1, CHA mod = -1

  describe('Case A — returns null', () => {
    it('returns null for non-caster class (Barbarian) without override handler', () => {
      const { container } = render(
        <SpellcastingStatsRow
          abilityScores={baseAbilityScores}
          profBonus={2}
          className="Barbarian"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('returns null when no class and no override is provided in read-only', () => {
      const { container } = render(
        <SpellcastingStatsRow
          abilityScores={baseAbilityScores}
          profBonus={2}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Case B — dropdown only (no stats yet)', () => {
    it('renders only the dropdown when override is null (None) in editable context', () => {
      const onOverrideChange = vi.fn();
      render(
        <SpellcastingStatsRow
          abilityScores={baseAbilityScores}
          profBonus={2}
          className="Wizard"
          overrideAbility={null}
          onOverrideChange={onOverrideChange}
        />
      );

      // Verify dropdown is present
      expect(screen.getByLabelText(/Spellcasting:/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toHaveValue('none');

      // Verify no spell stats values or text
      expect(screen.queryByText(/Spell Save DC:/i)).toBeNull();
      expect(screen.queryByText(/Spell Atk:/i)).toBeNull();
    });
  });

  describe('Case C — stats visible', () => {
    it('renders Spell Save DC 13 and Spell Atk +5 for Wizard with profBonus 2', () => {
      render(
        <SpellcastingStatsRow
          abilityScores={baseAbilityScores}
          profBonus={2}
          className="Wizard"
        />
      );

      expect(screen.getByText(/Spell Save DC:/i)).toBeInTheDocument();
      expect(screen.getByText('13')).toBeInTheDocument(); // 8 + 3 (INT) + 2

      expect(screen.getByText(/Spell Atk:/i)).toBeInTheDocument();
      expect(screen.getByText('+5')).toBeInTheDocument(); // 3 + 2
    });

    it('renders Spell Save DC 11 and Spell Atk +3 for Cleric with profBonus 2', () => {
      render(
        <SpellcastingStatsRow
          abilityScores={baseAbilityScores}
          profBonus={2}
          className="Cleric"
        />
      );

      expect(screen.getByText('11')).toBeInTheDocument(); // 8 + 1 (WIS) + 2
      expect(screen.getByText('+3')).toBeInTheDocument(); // 1 + 2
    });

    it('renders INT stats on Barbarian if INT override is active', () => {
      render(
        <SpellcastingStatsRow
          abilityScores={baseAbilityScores}
          profBonus={2}
          className="Barbarian"
          overrideAbility="INT"
        />
      );

      expect(screen.getByText('13')).toBeInTheDocument(); // 8 + 3 (INT) + 2
      expect(screen.getByText('+5')).toBeInTheDocument(); // 3 + 2
    });

    it('renders WIS stats with WIS override and profBonus 4', () => {
      render(
        <SpellcastingStatsRow
          abilityScores={baseAbilityScores}
          profBonus={4}
          overrideAbility="WIS"
        />
      );

      expect(screen.getByText('13')).toBeInTheDocument(); // 8 + 1 (WIS) + 4
      expect(screen.getByText('+5')).toBeInTheDocument(); // 1 + 4
    });
  });

  describe('Override dropdown behavior', () => {
    it('renders the dropdown when onOverrideChange is provided', () => {
      render(
        <SpellcastingStatsRow
          abilityScores={baseAbilityScores}
          profBonus={2}
          onOverrideChange={vi.fn()}
        />
      );

      expect(screen.getByLabelText(/Spellcasting:/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('calls onOverrideChange with undefined when selecting Auto', () => {
      const onOverrideChange = vi.fn();
      render(
        <SpellcastingStatsRow
          abilityScores={baseAbilityScores}
          profBonus={2}
          overrideAbility="INT"
          onOverrideChange={onOverrideChange}
        />
      );

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'auto' } });
      expect(onOverrideChange).toHaveBeenCalledWith(undefined);
    });

    it('calls onOverrideChange with null when selecting None', () => {
      const onOverrideChange = vi.fn();
      render(
        <SpellcastingStatsRow
          abilityScores={baseAbilityScores}
          profBonus={2}
          overrideAbility="INT"
          onOverrideChange={onOverrideChange}
        />
      );

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'none' } });
      expect(onOverrideChange).toHaveBeenCalledWith(null);
    });

    it('calls onOverrideChange with INT when selecting INT', () => {
      const onOverrideChange = vi.fn();
      render(
        <SpellcastingStatsRow
          abilityScores={baseAbilityScores}
          profBonus={2}
          overrideAbility="WIS"
          onOverrideChange={onOverrideChange}
        />
      );

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'INT' } });
      expect(onOverrideChange).toHaveBeenCalledWith('INT');
    });

    it('selects Auto when overrideAbility is undefined', () => {
      render(
        <SpellcastingStatsRow
          abilityScores={baseAbilityScores}
          profBonus={2}
          overrideAbility={undefined}
          onOverrideChange={vi.fn()}
        />
      );

      expect(screen.getByRole('combobox')).toHaveValue('auto');
    });

    it('selects None when overrideAbility is null', () => {
      render(
        <SpellcastingStatsRow
          abilityScores={baseAbilityScores}
          profBonus={2}
          overrideAbility={null}
          onOverrideChange={vi.fn()}
        />
      );

      expect(screen.getByRole('combobox')).toHaveValue('none');
    });

    it('selects WIS when overrideAbility is WIS', () => {
      render(
        <SpellcastingStatsRow
          abilityScores={baseAbilityScores}
          profBonus={2}
          overrideAbility="WIS"
          onOverrideChange={vi.fn()}
        />
      );

      expect(screen.getByRole('combobox')).toHaveValue('WIS');
    });
  });

  describe('Negative attack formatting', () => {
    it('uses a true unicode minus sign for negative spell attack bonuses', () => {
      render(
        <SpellcastingStatsRow
          abilityScores={baseAbilityScores}
          profBonus={0}
          overrideAbility="CHA" // CHA mod is -1
        />
      );

      // Verify it renders with "\u22121"
      const atkDisplay = screen.getByText(/\u22121/);
      expect(atkDisplay).toBeInTheDocument();
      expect(atkDisplay.textContent).toContain('\u22121');
    });
  });
});
