import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { SpellcastingStatsRow } from '../SpellcastingStatsRow';
import { AbilityScores } from '../../../lib/abilityScores';
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
});
