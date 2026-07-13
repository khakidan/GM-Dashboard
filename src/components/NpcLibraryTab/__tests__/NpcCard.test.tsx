import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { NpcCard } from '../NpcCard';
import { NPC } from '../../../types';
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('NpcCard', () => {
  afterEach(() => cleanup());

  it('adds a new trait with a synthetic _key', () => {
    const mockNpc: NPC = {
      id: 'npc-1',
      name: 'Goblin',
      ac: 15,
      maxHp: 7,
      notes: '',
      abilityScores: JSON.stringify({ STR: 8, DEX: 14, CON: 10, INT: 10, WIS: 10, CHA: 8 }),
      proficiencies: JSON.stringify({}),
      speed: '30ft.',
      senses: '',
      languages: '',
      challengeRating: '0.25',
      traits: JSON.stringify([{ name: 'Nimble', description: 'Moves quickly' }]),
      actions: '[]',
      reactions: '[]',
      legendaryActionsList: '[]',
    };
    
    let updatedNpc: any = null;
    const onUpdate = (data: Partial<NPC>) => { updatedNpc = data; };

    // Use a wrapper component to manage expansion state
    const TestWrapper = () => {
      const [expanded, setExpanded] = React.useState(false);
      return (
        <NpcCard 
          npc={mockNpc} 
          isSyncing={false} 
          isExpanded={expanded} 
          onToggleExpand={() => setExpanded(!expanded)} 
          onUpdate={onUpdate} 
          onDelete={vi.fn()} 
        />
      );
    };

    const { getByLabelText, getByRole } = render(<TestWrapper />);

    // Expand NpcCard
    const expandButton = getByLabelText('Expand NPC card');
    fireEvent.click(expandButton);

    // Click "Add Trait" button
    const addTraitButton = getByRole('button', { name: /Add Trait/i });
    fireEvent.click(addTraitButton);

    // Verify new trait is added and has a _key
    expect(updatedNpc).not.toBeNull();
    const updatedTraits = JSON.parse(updatedNpc.traits);
    const newTrait = updatedTraits[updatedTraits.length - 1];
    
    expect(newTrait.name).toBe(''); // Default empty item
    expect(newTrait._key).toBeDefined();
    expect(typeof newTrait._key).toBe('string');
    expect(newTrait._key!.length).toBeGreaterThan(0);
  });
});
