// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { IrvMultiSelect } from '../IrvMultiSelect';

describe('IrvMultiSelect', () => {
  afterEach(() => {
    cleanup();
  });

  const options = ['fire', 'cold', 'poison', 'acid'];

  it('renders existing selected values as pills', () => {
    render(
      <IrvMultiSelect
        label="Resistances"
        value="fire, poison"
        onChange={() => {}}
        options={options}
      />
    );

    expect(screen.getByText('fire')).toBeDefined();
    expect(screen.getByText('poison')).toBeDefined();
    expect(screen.queryByText('cold')).toBeNull();
  });

  it('clicking × on a pill removes it and calls onChange with the updated string', async () => {
    const onChange = vi.fn();
    render(
      <IrvMultiSelect
        label="Resistances"
        value="fire, poison"
        onChange={onChange}
        options={options}
      />
    );

    const removeButtons = screen.getAllByLabelText(/Remove/i);
    // Remove 'fire' (first pill)
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('poison');
    });
  });

  it('typing in the search input filters the dropdown options', () => {
    render(
      <IrvMultiSelect
        label="Resistances"
        value=""
        onChange={() => {}}
        options={options}
      />
    );

    const input = screen.getByPlaceholderText(/Search and add.../i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'co' } });

    expect(screen.getByText('cold')).toBeDefined();
    expect(screen.queryByText('fire')).toBeNull();
    expect(screen.queryByText('acid')).toBeNull();
  });

  it('clicking a dropdown option adds it to the selection and calls onChange', async () => {
    const onChange = vi.fn();
    render(
      <IrvMultiSelect
        label="Resistances"
        value="fire"
        onChange={onChange}
        options={options}
      />
    );

    const input = screen.getByPlaceholderText('');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'co' } });

    const option = screen.getByText('cold');
    fireEvent.click(option);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('fire, cold');
    });
  });

  it('already-selected options do not appear in the dropdown', () => {
    render(
      <IrvMultiSelect
        label="Resistances"
        value="fire"
        onChange={() => {}}
        options={options}
      />
    );

    const input = screen.getByPlaceholderText('');
    fireEvent.focus(input);
    
    // 'fire' is in the options but should be filtered out because it's selected
    expect(screen.queryByRole('button', { name: /^fire$/i })).toBeNull();
    expect(screen.getByText('cold')).toBeDefined();
    expect(screen.getByText('poison')).toBeDefined();
    expect(screen.getByText('acid')).toBeDefined();
  });

  it('pressing Escape closes the dropdown without changing selection', async () => {
    render(
      <IrvMultiSelect
        label="Resistances"
        value=""
        onChange={() => {}}
        options={options}
      />
    );

    const input = screen.getByPlaceholderText(/Search and add.../i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'fire' } });

    expect(screen.getByText('fire')).toBeDefined();

    fireEvent.keyDown(input, { key: 'Escape' });

    // The dropdown should be gone
    await waitFor(() => {
      expect(screen.queryByText('fire')).toBeNull();
    }, { timeout: 1000 });
  });

  it('onChange is called with a properly formatted comma-separated string', async () => {
    const onChange = vi.fn();
    render(
      <IrvMultiSelect
        label="Resistances"
        value="fire"
        onChange={onChange}
        options={options}
      />
    );

    const input = screen.getByPlaceholderText('');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'acid' } });
    
    fireEvent.click(screen.getByText('acid'));
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('fire, acid');
    });
  });
});
