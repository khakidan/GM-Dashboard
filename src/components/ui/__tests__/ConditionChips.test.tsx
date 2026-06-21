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
});
