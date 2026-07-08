import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AddCombatantDialog } from '../AddCombatantDialog';

describe('AddCombatantDialog', () => {
  afterEach(() => cleanup());
  
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    npcs: [],
    characters: [],
    onAddPreset: vi.fn(),
    onAddNpc: vi.fn(),
  };

  it('renders without crashing with required props', () => {
    const { container } = render(<AddCombatantDialog {...defaultProps} />);
    expect(screen.getByRole('tab', { name: /create npc/i })).toBeInTheDocument();
  });

  it('submitting the Create NPC form calls onAddNpc with the full NPC data object', () => {
    const onAddNpc = vi.fn();
    render(<AddCombatantDialog {...defaultProps} onAddNpc={onAddNpc} />);
    
    // Switch to Create NPC tab
    fireEvent.click(screen.getByText('Create NPC'));

    // Fill out the required fields (Name is on Identity tab)
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'New Test NPC' } });

    // Switch to Combat tab for AC and HP
    fireEvent.click(screen.getByRole('tab', { name: 'Combat' }));
    fireEvent.change(screen.getByLabelText(/AC/), { target: { value: '18' } });
    fireEvent.change(screen.getByLabelText(/HP/), { target: { value: '45' } });

    // Submit form
    const createBtn = screen.getByText('Create & Add to Encounter');
    fireEvent.click(createBtn);

    expect(onAddNpc).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Test NPC',
      ac: 18,
      maxHp: 45,
    }));
  });

  it('CREATE NPC tab embeds CR-derived proficiency bonus in proficiencies', () => {
    const onAddNpcMock = vi.fn();
    render(<AddCombatantDialog {...defaultProps} onAddNpc={onAddNpcMock} />);
    
    // Switch to Create NPC tab
    fireEvent.click(screen.getByText('Create NPC'));

    // Fill in the NPC name field (required for submit)
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Test CR NPC' } });

    // CR is on the Identity tab.
    const crInput = screen.getByLabelText(/CR/);
    fireEvent.change(crInput, { target: { value: '5' } });
    fireEvent.blur(crInput);

    // Submit form
    const createBtn = screen.getByText('Create & Add to Encounter');
    fireEvent.click(createBtn);

    expect(onAddNpcMock).toHaveBeenCalledTimes(1);
    const call = onAddNpcMock.mock.calls[0][0];
    const profs = JSON.parse(call.proficiencies);
    expect(profs.proficiencyBonus).toBe(3);
    expect(call.abilityScores).not.toBe('{}');
  });
});
