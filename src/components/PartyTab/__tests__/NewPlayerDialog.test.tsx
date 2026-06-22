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

  describe('RENDERING', () => {
    it('renders when isOpen is true', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      expect(screen.getByRole('heading', { name: 'Add Character' })).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<NewPlayerDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('heading', { name: 'Add Character' })).not.toBeInTheDocument();
    });

    it('all 4 tab labels are visible', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Identity/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Combat Stats/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Abilities/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Resources/i })).toBeInTheDocument();
    });

    it('Tab 1 is active by default', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      expect(screen.getByPlaceholderText('e.g. Sarah')).toBeInTheDocument();
    });
  });

  describe('TAB 1 CONTENT', () => {
    it('Player Name input is present', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      expect(screen.getByPlaceholderText('e.g. Sarah')).toBeInTheDocument();
    });

    it('Character Name input is present', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      expect(screen.getByPlaceholderText('e.g. Drogar')).toBeInTheDocument();
    });

    it('Class input is present', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      expect(screen.getByPlaceholderText('e.g. Barbarian, Monk, Vitalist')).toBeInTheDocument();
    });

    it('Level input is present', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      const levelInput = screen.getByRole('spinbutton');
      expect(levelInput).toBeInTheDocument();
    });

    it('Status select is present', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('helper text is present', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      expect(screen.getByText('Used to suggest starting resources on the Resources tab')).toBeInTheDocument();
    });
  });

  describe('TAB NAVIGATION — clicking', () => {
    it('Clicking "Combat Stats" tab makes Tab 2 active', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /Combat Stats/i }));
      expect(screen.getByText('Combat Stats — coming soon')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('e.g. Sarah')).not.toBeInTheDocument();
    });

    it('Clicking "Abilities" tab makes Tab 3 active', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /Abilities/i }));
      expect(screen.getByText('Abilities — coming soon')).toBeInTheDocument();
    });

    it('Clicking "Resources" tab makes Tab 4 active', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /Resources/i }));
      expect(screen.getByText('Resources — coming soon')).toBeInTheDocument();
    });

    it('Clicking "Identity" tab from Tab 3 returns to Tab 1', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /Abilities/i }));
      fireEvent.click(screen.getByRole('button', { name: /Identity/i }));
      expect(screen.getByPlaceholderText('e.g. Sarah')).toBeInTheDocument();
    });
  });

  describe('TAB NAVIGATION — Next/Previous', () => {
    it('"Next →" button is present on Tab 1', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Next →' })).toBeInTheDocument();
    });

    it('Clicking Next advances to Tab 2', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
      expect(screen.getByText('Combat Stats — coming soon')).toBeInTheDocument();
    });

    it('"← Previous" button appears on Tab 2 and clicking returns to Tab 1', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
      const prevBtn = screen.getByRole('button', { name: '← Previous' });
      expect(prevBtn).toBeInTheDocument();
      fireEvent.click(prevBtn);
      expect(screen.getByPlaceholderText('e.g. Sarah')).toBeInTheDocument();
    });

    it('"Next →" is not present on Tab 4', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /Resources/i }));
      expect(screen.queryByRole('button', { name: 'Next →' })).not.toBeInTheDocument();
    });

    it('"← Previous" is not present on Tab 1', () => {
      render(<NewPlayerDialog {...defaultProps} />);
      expect(screen.queryByRole('button', { name: '← Previous' })).not.toBeInTheDocument();
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
        abilityScores: '{}',
        proficiencies: '{}',
        resourcePools: '[]',
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
