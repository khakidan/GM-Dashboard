import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CommandPalette } from '../CommandPalette';
import { useAppState } from '../../hooks/useAppState';

vi.mock('../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock global ResizeObserver using a proper ES6 class constructor
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    // Mock HTML Element scrollIntoView for jsdom environment
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    vi.mocked(useAppState).mockReturnValue({
      state: {
        characters: [],
        combatState: {
          activeEncounterId: 'enc_1',
          combatants: [],
          activeTurnId: 'c1',
          round: 1,
          concentrationLinks: {},
        },
        conditions: [
          { name: 'Blinded', description: 'A blinded creature cannot see and automatically fails any ability check that requires sight.', source: 'SRD' },
          { name: 'Charmed', description: 'A charmed creature cannot attack the charmer or target the charmer with harmful abilities or magical effects.', source: 'SRD' },
        ],
        spells: [
          {
            name: 'Fireball',
            level: 3,
            school: 'Evocation',
            castingTime: '1 action',
            range: '150 feet',
            components: 'V, S, M',
            materials: 'a tiny ball of bat guano and sulfur',
            duration: 'Instantaneous',
            concentration: false,
            ritual: false,
            classes: 'Sorcerer, Wizard',
            description: 'A bright streak flashes from your pointing finger to a point you choose.',
            higherLevel: 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.',
            source: 'SRD',
          },
          {
            name: 'Bless',
            level: 1,
            school: 'Enchantment',
            castingTime: '1 action',
            range: '30 feet',
            components: 'V, S, M',
            materials: 'a sprinkling of holy water',
            duration: 'Up to 1 minute',
            concentration: true,
            ritual: false,
            classes: 'Cleric, Paladin',
            description: 'You bless up to three creatures of your choice within range.',
            higherLevel: '',
            source: 'SRD',
          },
        ],
      } as any,
      updateState: vi.fn(),
    } as any);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    ambientFiles: [],
    onPlayAmbient: vi.fn(),
    currentAmbientId: null,
    activeMood: null,
    assignments: {
      mood_calm: null,
      mood_tense: null,
      mood_epic: null,
      mood_creepy: null,
      mood_mysterious: null,
    } as any,
    activateMood: vi.fn(),
  };

  it('renders without crashing and shows the search input', () => {
    render(<CommandPalette {...defaultProps} />);

    // The search input should be visible
    expect(
      screen.getByPlaceholderText('Type a command or search...')
    ).toBeInTheDocument();
  });

  it('long rest command opens longRest dialog', async () => {
    const updateStateMock = vi.fn();

    // Mock useAppState with active and inactive characters
    vi.mocked(useAppState).mockReturnValue({
      state: {
        characters: [
          { id: 'char-1', isActive: true },
          { id: 'char-2', isActive: false },
          { id: 'char-3', isActive: true },
        ],
        combatState: {
          activeEncounterId: 'enc_1',
          combatants: [],
          activeTurnId: 'c1',
          round: 1,
          concentrationLinks: {},
        },
        conditions: [],
        spells: [],
      } as any,
      updateState: updateStateMock,
    } as any);

    render(<CommandPalette {...defaultProps} />);

    // Find and click the Long Rest command
    const longRestItem = screen.getByText('Long Rest');
    fireEvent.click(longRestItem);

    // Assert updateState was called with the openDialog action
    expect(updateStateMock).toHaveBeenCalled();
    const updateFn = updateStateMock.mock.calls[0][0];
    const prevMockState = { openDialog: null };
    expect(updateFn(prevMockState)).toEqual({ openDialog: 'longRest' });
  });

  it('typing 2+ characters shows matching condition in search results', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'bl' } });
    expect(screen.getByText('Blinded')).toBeInTheDocument();
  });

  it('does not show condition results with fewer than 2 characters', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'b' } });
    expect(screen.queryByText('Blinded')).not.toBeInTheDocument();
  });

  it('selecting a condition opens the detail dialog with its description', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'blind' } });
    const item = screen.getByText('Blinded');
    fireEvent.click(item);
    expect(
      screen.getByText(/cannot see and automatically fails/i)
    ).toBeInTheDocument();
  });

  it('typing a spell name shows it in search results with level and school', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'fireball' } });
    expect(screen.getByText('Fireball')).toBeInTheDocument();
    expect(screen.getByText(/Level 3/i)).toBeInTheDocument();
  });

  it('selecting a concentration spell shows the Concentration badge in the detail dialog', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'bless' } });
    const item = screen.getByText('Bless');
    fireEvent.click(item);
    expect(screen.getByText('Concentration')).toBeInTheDocument();
  });

  it('selecting a non-concentration spell does not show the Concentration badge', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'fireball' } });
    const item = screen.getByText('Fireball');
    fireEvent.click(item);
    expect(screen.queryByText('Concentration')).not.toBeInTheDocument();
  });
});
