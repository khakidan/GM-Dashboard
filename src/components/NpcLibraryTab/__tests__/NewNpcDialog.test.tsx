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
    fireEvent.click(getByRole('tab', { name: 'Combat' }));
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

  it('action added on Stat Block tab is included in actions JSON on confirm', async () => {
    const onConfirmMock = vi.fn();
    const { getByLabelText, getByRole, getByText } = render(
      <NewNpcDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirmMock}
      />
    );

    // Fill in required name on Identity tab (already the default tab)
    fireEvent.change(
      getByLabelText(/^NPC Name/i),
      { target: { value: 'Troll' } }
    );

    // Navigate to Stat Block tab
    fireEvent.click(
      getByRole('tab',
        { name: /stat block/i }
      )
    );

    // Click "Add Action" button
    fireEvent.click(
      getByText('Add Action')
    );

    // Fill in the action name field
    const actionNameInput =
      document.querySelector(
        'input[placeholder="Action name (e.g. Bite)"]'
      ) as HTMLInputElement;
    expect(actionNameInput).not.toBeNull();
    fireEvent.change(actionNameInput, {
      target: { value: 'Claw Attack' }
    });

    // Fill in the action description
    const actionDescInput =
      document.querySelector(
        'textarea[placeholder="Full action description"]'
      ) as HTMLTextAreaElement;
    if (actionDescInput) {
      fireEvent.change(actionDescInput, {
        target: {
          value: 'Melee weapon attack'
        }
      });
      fireEvent.blur(actionDescInput);
    }

    // Submit the form
    fireEvent.click(
      getByRole('button',
        { name: /add npc/i }
      )
    );

    expect(onConfirmMock)
      .toHaveBeenCalled();

    const payload =
      onConfirmMock.mock.calls[0][0];

    // Actions should be a JSON string
    // containing the action we added
    const actions = JSON.parse(
      payload.actions
    );
    expect(actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Claw Attack',
        })
      ])
    );
  });

  it('does not call onConfirm when NPC name is empty', () => {
    const onConfirmMock = vi.fn();
    const { getByRole } = render(
      <NewNpcDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirmMock}
      />
    );

    // Do NOT fill in the name field —
    // leave it at the default empty value

    // Click Add NPC
    fireEvent.click(
      getByRole('button',
        { name: /add npc/i }
      )
    );

    // onConfirm should never be called
    // because name is empty
    expect(onConfirmMock)
      .not.toHaveBeenCalled();
  });
});
