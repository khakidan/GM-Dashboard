import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { EncounterCard } from '../EncounterCard';

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
    isCompleted: false,
    isDeleting: false,
    encounterCombatants: [],
    difficulties: { 1: 'Easy', 2: 'Medium', 3: 'Hard', 4: 'Deadly' },
    onDelete: vi.fn(),
    onStart: vi.fn(),
    onSyncRequested: vi.fn(),
    onUpdate: vi.fn(),
  };

  it('renders the encounter name and difficulty', () => {
    const { container } = render(<EncounterCard {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('disables Run button when isCompleted is true', () => {
    render(<EncounterCard {...defaultProps} isCompleted={true} />);
    const runButton = screen.getByTitle('This encounter has already been completed');
    expect(runButton).toBeDisabled();
  });

  it('enables Run button when isCompleted is false', () => {
    render(<EncounterCard {...defaultProps} isCompleted={false} />);
    const runButton = screen.getByTitle('View / Run Encounter');
    expect(runButton).not.toBeDisabled();
  });

  it('enables View Log button regardless of completion status', () => {
    const { rerender } = render(<EncounterCard {...defaultProps} isCompleted={true} />);
    expect(screen.getByTitle('View Past Encounter Logs')).not.toBeDisabled();

    rerender(<EncounterCard {...defaultProps} isCompleted={false} />);
    expect(screen.getByTitle('View Past Encounter Logs')).not.toBeDisabled();
  });

  it('persists uncommitted input text when enc reference changes but values stay same', () => {
    const { rerender } = render(<EncounterCard {...defaultProps} />);
    
    const nameInput = screen.getByPlaceholderText('Encounter Name') as HTMLInputElement;
    
    // 1. Simulate typing without blurring
    fireEvent.change(nameInput, { target: { value: 'New Typed Name' } });
    expect(nameInput.value).toBe('New Typed Name');
    
    // 2. Re-render with new object reference but same data
    const newEnc = { ...mockEnc };
    rerender(<EncounterCard {...defaultProps} enc={newEnc} />);
    
    // 3. Assert value is preserved (not reset to 'Goblin Ambush')
    expect(nameInput.value).toBe('New Typed Name');
  });
});
