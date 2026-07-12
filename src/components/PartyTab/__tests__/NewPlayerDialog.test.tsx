import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NewPlayerDialog } from '../NewPlayerDialog';
import { getResourcePoolSuggestions } from '../../../lib/resourcePoolScaling';

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: () => ({
    state: { statuses: { '1': 'Active', '2': 'Inactive', '3': 'Deceased' } }
  })
}));

// Mock ResizeObserver
const MockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', MockResizeObserver);

describe('NewPlayerDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  afterEach(() => cleanup());

  it('renders without crashing and shows the first tab', () => {
    const { container } = render(<NewPlayerDialog {...defaultProps} />);
    expect(screen.getByLabelText(/player name/i)).toBeInTheDocument();
  });

  it('getResourcePoolSuggestions returns correct Rage max for a level 6 Barbarian', () => {
    const suggestions = getResourcePoolSuggestions('Barbarian', 6, []);
    const rage = suggestions.find(s => s.name.toLowerCase() === 'rage');
    expect(rage).toBeDefined();
    expect(rage!.suggestedMax).toBe(4);
  });

  it('getResourcePoolSuggestions returns correct Ki Points max for a level 5 Monk', () => {
    const suggestions = getResourcePoolSuggestions('Monk', 5, []);
    const ki = suggestions.find(s => s.name.toLowerCase() === 'ki points');
    expect(ki).toBeDefined();
    expect(ki!.suggestedMax).toBe(5);
  });

  it('getResourcePoolSuggestions returns level-1 defaults for a level 1 Barbarian', () => {
    const suggestions = getResourcePoolSuggestions('Barbarian', 1, []);
    const rage = suggestions.find(s => s.name.toLowerCase() === 'rage');
    expect(rage).toBeDefined();
    expect(rage!.suggestedMax).toBe(2);
  });

  it('submitting the form with name, class, and level calls onConfirm with correct character fields', async () => {
    const onConfirmMock = vi.fn();

    const { getByPlaceholderText, getByRole, container } = render(
      <NewPlayerDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirmMock}
      />
    );

    // Fill in required Identity tab fields
    fireEvent.change(
      getByPlaceholderText('e.g. Sarah'),
      { target: { value: 'Alice' } }
    );
    fireEvent.change(
      getByPlaceholderText('e.g. Drogar'),
      { target: { value: 'Aria' } }
    );

    // Fill in the class textbox
    const classInput = getByPlaceholderText(
      'e.g. Barbarian, Monk, Vitalist'
    );
    fireEvent.change(classInput, {
      target: { value: 'Fighter' }
    });

    // Set level to 5
    const levelInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    expect(levelInput).not.toBeNull();
    fireEvent.change(levelInput, {
      target: { value: '5' }
    });

    // Submit the form — the Add Character
    // button is always visible
    fireEvent.click(
      getByRole('button',
        { name: /add character/i }
      )
    );

    expect(onConfirmMock)
      .toHaveBeenCalledOnce();

    const payload =
      onConfirmMock.mock.calls[0][0];

    // Assert correct identity fields
    expect(payload.playerName)
      .toBe('Alice');
    expect(payload.characterName)
      .toBe('Aria');
    expect(payload.class).toBe('Fighter');
    expect(payload.level).toBe(5);

    // Assert proficiency bonus reflects
    // level 5 (should be +3, not default +2)
    const profs = JSON.parse(
      payload.proficiencies
    );
    expect(profs.proficiencyBonus).toBe(3);

    // Assert saving throws were
    // auto-assigned for Fighter (STR, CON)
    expect(profs.savingThrows)
      .toContain('STR');
    expect(profs.savingThrows)
      .toContain('CON');
    expect(payload.statusName).toBe('Active');
  });
});
