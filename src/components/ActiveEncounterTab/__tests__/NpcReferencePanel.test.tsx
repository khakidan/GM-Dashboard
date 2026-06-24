import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { NpcReferencePanel } from '../NpcReferencePanel';
import { makeCombatant } from '../../../test-utils/fixtures/combatantFixtures';
import type { Combatant } from '../../../types';

describe('NpcReferencePanel', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing when the combatant has no stat block content', () => {
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

  it('renders nothing when the combatant has empty JSON lists and empty fields', () => {
    const emptyNpc = makeCombatant({
      type: 'npc',
      speed: ' ',
      senses: ' ',
      languages: ' ',
      challengeRating: ' ',
      traits: '[]',
      actions: '[]',
      reactions: '[]',
      legendaryActionsList: '[]',
    });

    const { container } = render(<NpcReferencePanel combatant={emptyNpc} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the toggle button when there is stat block content', () => {
    const npcWithContent = makeCombatant({
      type: 'npc',
      speed: '30 ft.',
    });

    render(<NpcReferencePanel combatant={npcWithContent} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('▶ Stat Block');
  });

  it('toggles open and closed state on click and renders CR, speed, senses, and languages', () => {
    const npcWithContent = makeCombatant({
      type: 'npc',
      challengeRating: '2',
      speed: '30 ft., climb 20 ft.',
      senses: 'Darkvision 60 ft.',
      languages: 'Common, Goblin',
    });

    render(<NpcReferencePanel combatant={npcWithContent} />);
    
    // Initially closed, content should not be visible
    expect(screen.queryByText('Darkvision 60 ft.')).not.toBeInTheDocument();

    const button = screen.getByRole('button');
    
    // Click to open
    fireEvent.click(button);
    expect(button).toHaveTextContent('▼ Stat Block');
    expect(screen.getByText('Darkvision 60 ft.')).toBeInTheDocument();
    expect(screen.getByText('Common, Goblin')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('30 ft., climb 20 ft.')).toBeInTheDocument();

    // Click to close
    fireEvent.click(button);
    expect(button).toHaveTextContent('▶ Stat Block');
    expect(screen.queryByText('Darkvision 60 ft.')).not.toBeInTheDocument();
  });

  it('renders traits, actions, reactions, and legendary actions sections correctly', () => {
    const npcWithSections = makeCombatant({
      type: 'npc',
      traits: JSON.stringify([
        { name: 'Nimble Escape', description: 'The goblin can take the Disengage or Hide action as a bonus action on each of its turns.' }
      ]),
      actions: JSON.stringify([
        { name: 'Scimitar', description: 'Melee Weapon Attack', attackBonus: 4, damage: '1d6+2', range: '5 ft.' }
      ]),
      reactions: JSON.stringify([
        { name: 'Shield', description: 'Gains AC bonus' }
      ]),
      legendaryActionsList: JSON.stringify([
        { name: 'Teleport', description: 'Teleports 30 feet', cost: 2 }
      ]),
    });

    render(<NpcReferencePanel combatant={npcWithSections} />);
    
    // Expand the panel
    fireEvent.click(screen.getByRole('button'));

    // Check Nimble Escape trait
    expect(screen.getByText('Nimble Escape')).toBeInTheDocument();
    expect(screen.getByText('The goblin can take the Disengage or Hide action as a bonus action on each of its turns.')).toBeInTheDocument();

    // Check Scimitar action
    expect(screen.getByText('Scimitar')).toBeInTheDocument();
    expect(screen.getByText(/Melee Weapon Attack/)).toBeInTheDocument();

    // Check Shield reaction
    expect(screen.getByText('Shield')).toBeInTheDocument();
    expect(screen.getByText('Gains AC bonus')).toBeInTheDocument();

    // Check Legendary Action
    expect(screen.getByText('Teleport (Costs 2)')).toBeInTheDocument();
    expect(screen.getByText('Teleports 30 feet')).toBeInTheDocument();
  });

  it('handles invalid JSON gracefully without crashing', () => {
    const npcWithInvalidJson = makeCombatant({
      type: 'npc',
      traits: 'invalid json string',
      actions: '[{malformed',
    });

    render(<NpcReferencePanel combatant={npcWithInvalidJson} />);
    
    // Expanding should not crash the app
    fireEvent.click(screen.getByRole('button'));
    
    // No sections should render since JSON parsed to empty array
    expect(screen.queryByText('Traits')).not.toBeInTheDocument();
    expect(screen.queryByText('Actions')).not.toBeInTheDocument();
  });
});
