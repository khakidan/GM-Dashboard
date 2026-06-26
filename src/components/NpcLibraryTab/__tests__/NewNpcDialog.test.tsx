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
    fireEvent.click(getByRole('button', { name: 'Combat' }));
    fireEvent.change(getByLabelText(/^Max HP/i), { target: { value: '100' } });

    fireEvent.click(getByRole('button', { name: /Add NPC/i }));

    expect(onConfirmMock).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Dragon',
      maxHp: 100,
      legendaryActions: 0,
      legendaryResistances: 0,
    }));
  });

  it('NPC creation passes abilityScores from form data, not hardcoded "{}"', () => {
    const onConfirmMock = vi.fn();
    const { getByLabelText, getByRole } = render(
      <NewNpcDialog isOpen={true} onClose={vi.fn()} onConfirm={onConfirmMock} />
    );

    fireEvent.change(getByLabelText(/^NPC Name/i), { target: { value: 'Goblin' } });
    fireEvent.click(getByRole('button', { name: /Add NPC/i }));

    expect(onConfirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        abilityScores: expect.not.stringMatching(/^{}$/),
      })
    );
  });

  it('NPC creation derives proficiency bonus from CR', () => {
    const onConfirmMock = vi.fn();
    const { getByLabelText, getByRole } = render(
      <NewNpcDialog isOpen={true} onClose={vi.fn()} onConfirm={onConfirmMock} />
    );

    fireEvent.change(getByLabelText(/^NPC Name/i), { target: { value: 'Dragon' } });
    fireEvent.change(getByLabelText(/^CR/i), { target: { value: '5' } });
    fireEvent.blur(getByLabelText(/^CR/i));
    fireEvent.click(getByRole('button', { name: /Add NPC/i }));

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    const call = onConfirmMock.mock.calls[0][0];
    const profs = JSON.parse(call.proficiencies);
    expect(profs.proficiencyBonus).toBe(3);
  });

  it('NPC creation with fractional CR uses correct proficiency bonus', () => {
    const onConfirmMock = vi.fn();
    const { getByLabelText, getByRole } = render(
      <NewNpcDialog isOpen={true} onClose={vi.fn()} onConfirm={onConfirmMock} />
    );

    fireEvent.change(getByLabelText(/^NPC Name/i), { target: { value: 'Goblin' } });
    fireEvent.change(getByLabelText(/^CR/i), { target: { value: '1/4' } });
    fireEvent.blur(getByLabelText(/^CR/i));
    fireEvent.click(getByRole('button', { name: /Add NPC/i }));

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    const call = onConfirmMock.mock.calls[0][0];
    const profs = JSON.parse(call.proficiencies);
    expect(profs.proficiencyBonus).toBe(2);
  });
});
