import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NewNpcDialog } from '../NewNpcDialog';

describe('NewNpcDialog', () => {
  afterEach(() => cleanup());

  it('renders correctly and calls onConfirm with correct form data', () => {
    const onConfirmMock = vi.fn();
    const { getByLabelText, getByRole } = render(
      <NewNpcDialog isOpen={true} onClose={vi.fn()} onConfirm={onConfirmMock} />
    );

    fireEvent.change(getByLabelText(/^NPC Name/i), { target: { value: 'Dragon' } });
    fireEvent.change(getByLabelText(/^Max HP/i), { target: { value: '100' } });

    fireEvent.click(getByRole('button', { name: /Add NPC/i }));

    expect(onConfirmMock).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Dragon',
      maxHp: 100,
      legendaryActions: 0,
      legendaryResistances: 0,
    }));
  });
});
