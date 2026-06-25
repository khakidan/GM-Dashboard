import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { EncounterCard } from '../EncounterCard';

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: () => ({
    state: { activeEncounterId: null, difficulties: { 1: 'Easy', 2: 'Medium', 3: 'Hard', 4: 'Deadly' }, encounterCombatants: [], npcs: [] },
    updateState: vi.fn(),
  }),
}));

describe('EncounterCard', () => {
  afterEach(() => cleanup());

  const mockEnc = {
    id: '1',
    name: 'Goblin Ambush',
    location: 'Forest Path',
    difficultyId: 2,
    difficultyName: 'Medium',
    status: 'planned' as const,
    npcDefinitions: '',
  };

  const defaultProps = {
    enc: mockEnc,
    isDeleting: false,
    onDelete: vi.fn(),
    onStart: vi.fn(),
    onSyncRequested: vi.fn(),
  };

  it('renders the encounter name and difficulty', () => {
    const { container } = render(<EncounterCard {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });
});
