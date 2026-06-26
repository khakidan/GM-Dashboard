import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CombatSidebar } from '../CombatSidebar';

describe('CombatSidebar', () => {
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
    const { container } = render(<CombatSidebar {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('submitting the Create NPC form calls onAddNpc with the full NPC data object', () => {
    const onAddNpc = vi.fn();
    render(<CombatSidebar {...defaultProps} onAddNpc={onAddNpc} />);
    
    // Switch to Create NPC tab
    fireEvent.click(screen.getByText('Create NPC'));

    // Fill out the required fields (Name is on Identity tab)
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'New Test NPC' } });

    // Switch to Combat tab for AC and HP
    fireEvent.click(screen.getByRole('button', { name: 'Combat' }));
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
});
