import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NpcLegendarySection } from '../NpcLegendarySection';

describe('NpcLegendarySection', () => {
  afterEach(() => cleanup());

  it('renders legendary action and resistance inputs correctly', () => {
    render(
      <NpcLegendarySection
        legendaryActions={3}
        legendaryResistances={2}
        onUpdate={vi.fn()}
      />
    );

    const actionInput = screen.getByTestId('legendary-actions-input') as HTMLInputElement;
    expect(actionInput).toBeInTheDocument();
    expect(actionInput.value).toBe('3');

    const resistanceInput = screen.getByTestId('legendary-resistances-input') as HTMLInputElement;
    expect(resistanceInput).toBeInTheDocument();
    expect(resistanceInput.value).toBe('2');
  });
});
