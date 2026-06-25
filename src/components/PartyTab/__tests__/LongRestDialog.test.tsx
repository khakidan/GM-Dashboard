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
});
