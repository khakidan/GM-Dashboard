import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NewPlayerDialog } from '../NewPlayerDialog';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
const MockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', MockResizeObserver);

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className, onClick }: any) => <div className={className} onClick={onClick}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('NewPlayerDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders without crashing', () => {
    const { container } = render(<NewPlayerDialog {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  describe('TAB 4 INTERACTIONS', () => {
    it('Adding a resource via the form adds it to the list', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /Resources/i }));
      
      fireEvent.click(screen.getByRole('button', { name: /\+ Add Resource/i }));
      
      const newNameInput = screen.getByPlaceholderText('e.g. Rage, Ki Points');
      fireEvent.change(newNameInput, { target: { value: 'Mana Points' } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      
      expect(screen.getByText('Mana Points')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('e.g. Rage, Ki Points')).not.toBeInTheDocument(); // form closed
    });

    it('Deleting a resource removes it from the list', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText('e.g. Barbarian, Monk, Vitalist'), { target: { value: 'Barbarian' } });
      fireEvent.click(screen.getByRole('button', { name: /Resources/i }));
      
      expect(screen.getByText('Rage')).toBeInTheDocument();
      const deleteBtn = screen.getByTitle('Delete');
      fireEvent.click(deleteBtn);
      
      expect(screen.queryByText('Rage')).not.toBeInTheDocument();
    });

    it('Changing class resets pools if not customized, but retains if customized', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      const classInput = screen.getByPlaceholderText('e.g. Barbarian, Monk, Vitalist');
      
      // Initial class Monk -> gets Ki Points
      fireEvent.change(classInput, { target: { value: 'Monk' } });
      fireEvent.click(screen.getByRole('button', { name: /Resources/i }));
      expect(screen.getByText('Ki Points')).toBeInTheDocument();
      
      // Delete it (this marks as customized)
      fireEvent.click(screen.getByTitle('Delete'));
      expect(screen.queryByText('Ki Points')).not.toBeInTheDocument();
      
      // Change class again -> should NOT add new suggestions
      fireEvent.click(screen.getByRole('button', { name: /Identity/i }));
      fireEvent.change(classInput, { target: { value: 'Barbarian' } });
      fireEvent.click(screen.getByRole('button', { name: /Resources/i }));
      
      expect(screen.queryByText('Rage')).not.toBeInTheDocument(); // protected by customized flag
    });
  });

  describe('SUBMIT BUTTON STATE', () => {
    it('Submit is disabled when playerName is empty', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      const playerInput = screen.getByPlaceholderText('e.g. Sarah');
      const characterInput = screen.getByPlaceholderText('e.g. Drogar');
      fireEvent.change(characterInput, { target: { value: 'Aragorn' } });
      const submitBtn = screen.getByRole('button', { name: 'Add Character' });
      expect(submitBtn).toBeDisabled();
    });

    it('Submit is disabled when characterName is empty', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      const playerInput = screen.getByPlaceholderText('e.g. Sarah');
      fireEvent.change(playerInput, { target: { value: 'John' } });
      const submitBtn = screen.getByRole('button', { name: 'Add Character' });
      expect(submitBtn).toBeDisabled();
    });

    it('Submit is enabled when both playerName and characterName are filled in', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      const playerInput = screen.getByPlaceholderText('e.g. Sarah');
      const characterInput = screen.getByPlaceholderText('e.g. Drogar');
      
      fireEvent.change(playerInput, { target: { value: 'John' } });
      fireEvent.change(characterInput, { target: { value: 'Aragorn' } });
      
      const submitBtn = screen.getByRole('button', { name: 'Add Character' });
      expect(submitBtn).not.toBeDisabled();
    });

    it('Submit is disabled on Tab 2 if Tab 1 fields are empty', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
      const submitBtn = screen.getByRole('button', { name: 'Add Character' });
      expect(submitBtn).toBeDisabled();
    });
  });

  describe('SUBMISSION', () => {
    it('Filling in Player Name and Character Name then clicking "Add Character" calls onConfirm', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      const playerInput = screen.getByPlaceholderText('e.g. Sarah');
      const characterInput = screen.getByPlaceholderText('e.g. Drogar');
      
      fireEvent.change(playerInput, { target: { value: 'John' } });
      fireEvent.change(characterInput, { target: { value: 'Aragorn' } });
      
      const submitBtn = screen.getByRole('button', { name: 'Add Character' });
      fireEvent.click(submitBtn);
      
      expect(defaultProps.onConfirm).toHaveBeenCalled();
      expect(defaultProps.onConfirm).toHaveBeenCalledWith(expect.objectContaining({
        playerName: 'John',
        characterName: 'Aragorn',
        level: 1,
        statusId: 1,
        ac: 10,
        maxHp: 10,
        currentHp: 10,
        passivePerception: 10,
        tempHp: 0,
        tempHpMax: 0,
        conditions: '',
        isActive: true,
        notes: '',
        resistances: '',
        immunities: '',
        vulnerabilities: '',
        tempAc: 0,
        deathSavesFails: 0,
        deathSavesSuccesses: 0,
        hitDiceConfig: '',
        hitDiceUsed: '{}',
        abilityScores: expect.stringContaining('"STR":10'),
        proficiencies: expect.stringContaining('"proficiencyBonus":2'),
        resourcePools: '[]',
      }));
    });

    it('Submitting after setting class to "Fighter" includes resourcePools as JSON in payload', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText('e.g. Sarah'), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText('e.g. Drogar'), { target: { value: 'Aragorn' } });
      fireEvent.change(screen.getByPlaceholderText('e.g. Barbarian, Monk, Vitalist'), { target: { value: 'Fighter' } });
      
      fireEvent.click(screen.getByRole('button', { name: 'Add Character' }));
      
      expect(defaultProps.onConfirm).toHaveBeenCalled();
      const callArgs = vi.mocked(defaultProps.onConfirm).mock.calls[0][0];
      
      const parsedPools = JSON.parse(callArgs.resourcePools);
      expect(Array.isArray(parsedPools)).toBe(true);
      expect(parsedPools.length).toBeGreaterThan(0);
      expect(parsedPools.some((p: any) => p.name === 'Action Surge')).toBe(true);
    });

    it('Submitting with a manually added pool includes it in the payload', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText('e.g. Sarah'), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText('e.g. Drogar'), { target: { value: 'Aragorn' } });
      
      fireEvent.click(screen.getByRole('button', { name: /Resources/i }));
      fireEvent.click(screen.getByRole('button', { name: /\+ Add Resource/i }));
      fireEvent.change(screen.getByPlaceholderText('e.g. Rage, Ki Points'), { target: { value: 'Mana Points' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      
      fireEvent.click(screen.getByRole('button', { name: 'Add Character' }));
      
      expect(defaultProps.onConfirm).toHaveBeenCalled();
      const callArgs = vi.mocked(defaultProps.onConfirm).mock.calls[0][0];
      
      const parsedPools = JSON.parse(callArgs.resourcePools);
      expect(Array.isArray(parsedPools)).toBe(true);
      expect(parsedPools.some((p: any) => p.name === 'Mana Points')).toBe(true);
    });

    it('Filling in AC and Max HP then submitting includes those values in the onConfirm payload', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      
      // Tab 1
      fireEvent.change(screen.getByPlaceholderText('e.g. Sarah'), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText('e.g. Drogar'), { target: { value: 'Aragorn' } });
      
      // Tab 2
      fireEvent.click(screen.getByRole('button', { name: /Combat Stats/i }));
      const acInputs = screen.getAllByRole('spinbutton');
      fireEvent.change(acInputs[0], { target: { value: '18' } });
      fireEvent.change(acInputs[1], { target: { value: '45' } });

      fireEvent.click(screen.getByRole('button', { name: 'Add Character' }));
      
      expect(defaultProps.onConfirm).toHaveBeenCalledWith(expect.objectContaining({
        ac: 18,
        maxHp: 45,
        currentHp: 45, // currentHp in the payload equals maxHp value
      }));
    });

    it('Submitting after changing ability scores includes abilityScores as a JSON string and calculated passive perception', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      
      // Tab 1
      fireEvent.change(screen.getByPlaceholderText('e.g. Sarah'), { target: { value: 'John' } });
      fireEvent.change(screen.getByPlaceholderText('e.g. Drogar'), { target: { value: 'Aragorn' } });
      
      // Tab 3
      fireEvent.click(screen.getByRole('button', { name: /Abilities/i }));
      
      // Find WIS input (+2 modifier for Wis 14)
      const inputs = screen.getAllByRole('spinbutton');
      // STR, DEX, CON, INT, WIS(index 4), CHA, PB
      fireEvent.change(inputs[4], { target: { value: '14' } });

      fireEvent.click(screen.getByRole('button', { name: 'Add Character' }));
      
      expect(defaultProps.onConfirm).toHaveBeenCalledWith(expect.objectContaining({
        // 10 + 2 (wis modifier) = 12
        passivePerception: 12,
        abilityScores: expect.stringContaining('"WIS":14'),
      }));
    });

    it('onConfirm is NOT called when playerName is empty', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      const submitBtn = screen.getByRole('button', { name: 'Add Character' });
      fireEvent.click(submitBtn);
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('CLOSE', () => {
    it('Clicking × calls onClose', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      const closeBtn = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeBtn);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('Clicking Cancel calls onClose', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelBtn);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
