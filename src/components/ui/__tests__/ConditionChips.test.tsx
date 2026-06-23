import '@testing-library/jest-dom/vitest';
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

    expect(screen.getByText('poisoned')).toBeInTheDocument();
    expect(screen.getByText('hasted')).toBeInTheDocument();
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

  it('wraps each chip in a ConditionPopover and is able to trigger popover', async () => {
    render(
      <ConditionChips
        value="blinded"
        onChange={() => {}}
      />
    );

    const chip = screen.getByText('blinded');
    expect(chip).toBeInTheDocument();

    // The container should have the test popover target ID
    const popoverContainer = chip.closest('[id^="popover-container-"]');
    expect(popoverContainer).toBeInTheDocument();

    // Initially popover content is hidden
    expect(screen.queryByTestId('condition-popover-content')).toBeNull();

    // Click to toggle
    fireEvent.click(chip);
    
    // Now rules/summary content is visible on screen
    expect(screen.getByTestId('condition-popover-content')).toBeInTheDocument();
    expect(screen.getByText("Can't see. Attacks against you have advantage; yours have disadvantage.")).toBeInTheDocument();
  });

  it('triggers onConditionAdded when a chip is added but not when removed', async () => {
    const onChange = vi.fn();
    const onConditionAdded = vi.fn();

    const { rerender } = render(
      <ConditionChips
        value="blinded"
        onChange={onChange}
        onConditionAdded={onConditionAdded}
      />
    );

    const input = screen.getByPlaceholderText('');
    fireEvent.change(input, { target: { value: 'poisoned' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(onConditionAdded).toHaveBeenCalledWith('poisoned');
    });

    onConditionAdded.mockClear();

    // Rerender with 'poisoned' included so we can click to remove it
    rerender(
      <ConditionChips
        value="blinded, poisoned"
        onChange={onChange}
        onConditionAdded={onConditionAdded}
      />
    );

    const removeButton = screen.getByLabelText('Remove poisoned');
    fireEvent.click(removeButton);

    expect(onConditionAdded).not.toHaveBeenCalled();
  });

  it('adding an incapacitating condition removes "concentrating" if present', async () => {
    const onChange = vi.fn();

    render(
      <ConditionChips
        value="concentrating, poisoned"
        onChange={onChange}
      />
    );

    const input = screen.getByPlaceholderText('');
    fireEvent.change(input, { target: { value: 'stunned' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      // onChange is called twice:
      // 1. commitChip adds 'stunned' (value becomes "concentrating, poisoned, stunned")
      // 2. automation removes 'concentrating' (value becomes "poisoned, stunned")
      const calls = onChange.mock.calls.map(call => call[0]);
      expect(calls).toContain('poisoned, stunned');
    });
  });

  it('adding a non-incapacitating condition does not remove "concentrating"', async () => {
    const onChange = vi.fn();

    render(
      <ConditionChips
        value="concentrating"
        onChange={onChange}
      />
    );

    const input = screen.getByPlaceholderText('');
    fireEvent.change(input, { target: { value: 'poisoned' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('concentrating, poisoned');
      expect(onChange).not.toHaveBeenCalledWith('poisoned');
    });
  });

  it('calls onExhaustionDeath when "exhaustion 6" is added', async () => {
    const onExhaustionDeath = vi.fn();

    render(
      <ConditionChips
        value=""
        onChange={() => {}}
        onExhaustionDeath={onExhaustionDeath}
      />
    );

    const input = screen.getByPlaceholderText('Add condition or effect...');
    fireEvent.change(input, { target: { value: 'exhaustion 6' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(onExhaustionDeath).toHaveBeenCalled();
    });
  });
});
