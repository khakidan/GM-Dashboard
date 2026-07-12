import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CharacterCard } from '../CharacterCard';

describe('CharacterCard', () => {
  afterEach(() => cleanup());

  const mockCharacter = {
    id: 'char123',
    playerName: 'John Doe',
    characterName: 'Aethelgard the Valiant',
    ac: 18,
    maxHp: 45,
    tempHp: 0,
    currentHp: 40,
    conditions: 'None',
    passivePerception: 14,
    level: 4,
    statusId: 1,
    statusName: 'Active',
    notes: 'Brave warrior.',
    isActive: true,
    class: 'Fighter',
    tempAc: 0,
    hitDiceConfig: '',
    hitDiceUsed: '{}',
    abilityScores: '{}',
    proficiencies: '{}',
  };

  const defaultProps = {
    character: mockCharacter,
    statuses: { '1': 'Active', '2': 'Inactive', '3': 'Deceased' },
    isSyncing: false,
    isExpanded: false,
    onToggleExpand: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onLevelUpClick: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<CharacterCard {...defaultProps} />);
  });
});
