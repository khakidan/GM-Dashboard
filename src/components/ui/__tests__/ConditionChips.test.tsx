import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ConditionChips } from '../ConditionChips';

describe('ConditionChips', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders correctly with given conditions', () => {
    render(
      <ConditionChips
        value="poisoned, hasted"
        onChange={() => {}}
      />
    );

    expect(screen.getByText('poisoned')).toBeDefined();
    expect(screen.getByText('hasted')).toBeDefined();
  });

  it('adding a concentration effect triggers onConcentrationEffectAdded and does not automatically append concentrating', async () => {
    const onChange = vi.fn();
    const onConcentrationEffectAdded = vi.fn();

    render(
      <ConditionChips
        value=""
        onChange={onChange}
        onConcentrationEffectAdded={onConcentrationEffectAdded}
      />
    );

    const input = screen.getByPlaceholderText('Add condition or effect...');
    fireEvent.change(input, { target: { value: 'hasted' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('hasted');
      expect(onConcentrationEffectAdded).toHaveBeenCalledWith('hasted');
    });
  });
});
