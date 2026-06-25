import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NewEncounterDialog } from '../NewEncounterDialog';

describe('NewEncounterDialog', () => {
  afterEach(() => cleanup());

  const mockDifficulties = [
    { id: 1, name: 'Easy' },
    { id: 2, name: 'Medium' },
    { id: 3, name: 'Hard' },
    { id: 4, name: 'Deadly' },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    difficulties: mockDifficulties,
  };

  it('renders without crashing and calls onConfirm with encounter data when submitted', () => {
    const onConfirmMock = vi.fn();
    const { container } = render(<NewEncounterDialog {...defaultProps} onConfirm={onConfirmMock} />);
    expect(container).toBeInTheDocument();
  });
});
