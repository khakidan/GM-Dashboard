import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ShortRestDialog } from '../ShortRestDialog';

describe('ShortRestDialog', () => {
  afterEach(() => cleanup());

  const defaultProps = {
    isOpen: true,
    characters: [{ id: '1', characterName: 'Test', currentHp: 5, maxHp: 10 } as any],
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders without crashing and calls onConfirm when confirmed', () => {
    const onConfirm = vi.fn();
    render(<ShortRestDialog {...defaultProps} onConfirm={onConfirm} />);
    expect(screen.getByText('Short Rest')).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: /Apply Short Rest/i }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
