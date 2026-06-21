import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConditionPopover } from '../ConditionPopover';
import '@testing-library/jest-dom/vitest';

describe('ConditionPopover Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders children and does not show popover content by default', () => {
    render(
      <ConditionPopover conditionName="blinded" category="condition">
        <span data-testid="trigger-chip">Blinded</span>
      </ConditionPopover>
    );

    expect(screen.getByTestId('trigger-chip')).toBeInTheDocument();
    expect(screen.queryByTestId('condition-popover-content')).toBeNull();
  });

  it('shows popover content after a 300ms delay on mouseenter, and hides immediately on mouseleave', async () => {
    const { act } = await import('@testing-library/react');

    render(
      <ConditionPopover conditionName="blinded" category="condition">
        <span data-testid="trigger-chip">Blinded</span>
      </ConditionPopover>
    );

    const trigger = screen.getByTestId('trigger-chip');

    // Trigger mouse enter
    act(() => {
      fireEvent.mouseEnter(trigger);
    });
    expect(screen.queryByTestId('condition-popover-content')).toBeNull();

    // Advance timer by 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('condition-popover-content')).toBeInTheDocument();

    // Trigger mouse leave
    act(() => {
      fireEvent.mouseLeave(trigger);
    });
    expect(screen.queryByTestId('condition-popover-content')).toBeNull();
  });

  it('toggles visibility on click/touch', () => {
    render(
      <ConditionPopover conditionName="blinded" category="condition">
        <span data-testid="trigger-chip">Blinded</span>
      </ConditionPopover>
    );

    const trigger = screen.getByTestId('trigger-chip');

    // Click once to show
    fireEvent.click(trigger);
    expect(screen.getByTestId('condition-popover-content')).toBeInTheDocument();

    // Click again to hide
    fireEvent.click(trigger);
    expect(screen.queryByTestId('condition-popover-content')).toBeNull();
  });

  it('shows condition name and rules text for a known condition', () => {
    render(
      <ConditionPopover conditionName="blinded" category="condition">
        <span data-testid="trigger-chip">Blinded</span>
      </ConditionPopover>
    );

    fireEvent.click(screen.getByTestId('trigger-chip'));

    expect(screen.getAllByText('Blinded').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Can't see. Attacks against you have advantage/i)).toBeInTheDocument();
    expect(screen.getByText(/Automatically fails any ability check that requires sight/i)).toBeInTheDocument();
  });

  it('shows fallback text for an unknown/custom condition', () => {
    render(
      <ConditionPopover conditionName="Super Buffed" category="custom">
        <span data-testid="trigger-chip">Super Buffed</span>
      </ConditionPopover>
    );

    fireEvent.click(screen.getByTestId('trigger-chip'));

    expect(screen.getAllByText('Super Buffed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Custom status — no official rules text available/i)).toBeInTheDocument();
  });

  it('category badge shows appropriate categories', () => {
    const { rerender } = render(
      <ConditionPopover conditionName="blinded" category="condition">
        <span data-testid="trigger">Blinded</span>
      </ConditionPopover>
    );

    fireEvent.click(screen.getByTestId('trigger'));
    expect(screen.getByText('Condition')).toBeInTheDocument();

    rerender(
      <ConditionPopover conditionName="hasted" category="effect">
        <span data-testid="trigger">Hasted</span>
      </ConditionPopover>
    );
    expect(screen.getByText('Spell')).toBeInTheDocument();

    rerender(
      <ConditionPopover conditionName="Super Buffed" category="custom">
        <span data-testid="trigger">Super Buffed</span>
      </ConditionPopover>
    );
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });
});
