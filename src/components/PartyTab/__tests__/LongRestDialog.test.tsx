import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { LongRestDialog } from '../LongRestDialog';

describe('LongRestDialog', () => {
  afterEach(() => cleanup());

  const defaultProps = {
    isOpen: true,
    characters: [{ id: '1', characterName: 'Test' } as any],
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders without crashing and calls onConfirm when confirmed', () => {
    const onConfirm = vi.fn();
    render(<LongRestDialog {...defaultProps} onConfirm={onConfirm} />);
    expect(screen.getByText('Long Rest')).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: /Apply Long Rest/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('persists selection across re-renders when characters array changes while open', () => {
    const characters = [
      { id: '1', characterName: 'Char 1', statusId: 1, playerName: 'P1' },
      { id: '2', characterName: 'Char 2', statusId: 1, playerName: 'P2' },
    ] as any;
    
    const { rerender } = render(
      <LongRestDialog 
        isOpen={true} 
        characters={characters} 
        onConfirm={vi.fn()} 
        onClose={vi.fn()} 
      />
    );
    
    // Find rows and checkboxes
    const row1 = screen.getByText('Char 1').closest('div[id^="char-row-"]')!;
    const cb1 = row1.querySelector('input[type="checkbox"]') as HTMLInputElement;
    const row2 = screen.getByText('Char 2').closest('div[id^="char-row-"]')!;
    const cb2 = row2.querySelector('input[type="checkbox"]') as HTMLInputElement;

    expect(cb1.checked).toBe(true);
    expect(cb2.checked).toBe(true);

    // Deselect Char 1
    fireEvent.click(row1);
    expect(cb1.checked).toBe(false);

    // Re-render with new array reference
    rerender(
      <LongRestDialog 
        isOpen={true} 
        characters={[...characters]} 
        onConfirm={vi.fn()} 
        onClose={vi.fn()} 
      />
    );

    // Assert it's still deselected
    expect(cb1.checked).toBe(false);
    expect(cb2.checked).toBe(true);
  });
});
