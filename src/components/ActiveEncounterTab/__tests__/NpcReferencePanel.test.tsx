import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { NpcReferencePanel } from '../NpcReferencePanel';
import { makeCombatant } from '../../../test-utils/fixtures/combatantFixtures';

describe('NpcReferencePanel', () => {
  afterEach(() => cleanup());

  it('renders nothing when combatant has no stat block content', () => {
    const emptyNpc = makeCombatant({
      type: 'npc',
      speed: '',
      senses: '',
      languages: '',
      challengeRating: '',
      traits: '',
      actions: '',
      reactions: '',
      legendaryActionsList: '',
    });

    const { container } = render(<NpcReferencePanel combatant={emptyNpc} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders stat block content after toggle button is clicked', () => {
    const npcWithContent = makeCombatant({
      type: 'npc',
      challengeRating: '2',
      speed: '30 ft., climb 20 ft.',
      senses: 'Darkvision 60 ft.',
      languages: 'Common, Goblin',
    });

    render(<NpcReferencePanel combatant={npcWithContent} />);
    
    expect(screen.queryByText('Darkvision 60 ft.')).not.toBeInTheDocument();

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Darkvision 60 ft.')).toBeInTheDocument();
    expect(screen.getByText('Common, Goblin')).toBeInTheDocument();
  });
});
