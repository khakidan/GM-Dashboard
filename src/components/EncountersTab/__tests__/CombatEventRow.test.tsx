import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CombatEventRow } from '../CombatEventRow';
import { CombatEvent } from '../../../lib/combatLog';

describe('CombatEventRow', () => {
  const baseEvent: CombatEvent = {
    id: '1',
    timestamp: Date.now(),
    type: 'death-save',
    targetName: 'Aria',
  };

  it('renders success death save correctly', () => {
    const event: CombatEvent = {
      ...baseEvent,
      condition: 'success',
      resourceName: 'Death Save Successes',
      resourceBefore: 1,
      resourceAfter: 2,
    };

    render(<CombatEventRow event={event} />);
    
    // Check for the specific text generated in the component for success
    expect(screen.getByText(/Aria rolled a death saving throw: Success \(Death Save Successes: 1 -> 2\)/i)).toBeInTheDocument();
  });

  it('renders failure death save correctly', () => {
    const event: CombatEvent = {
      ...baseEvent,
      condition: 'failure',
      resourceName: 'Death Save Failures',
      resourceBefore: 0,
      resourceAfter: 1,
    };

    render(<CombatEventRow event={event} />);
    
    // Check for the specific text generated in the component for failure
    expect(screen.getByText(/Aria rolled a death saving throw: Failure \(Death Save Failures: 0 -> 1\)/i)).toBeInTheDocument();
  });
});
