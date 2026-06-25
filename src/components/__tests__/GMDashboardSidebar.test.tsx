import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { GMDashboardSidebar } from '../GMDashboardSidebar';

describe('GMDashboardSidebar', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders with a fixed w-16 width class and no dynamic width classes', () => {
    const { container } = render(
      <GMDashboardSidebar
        activeTab="party"
        onTabChange={vi.fn()}
        campaignName="Test Campaign"
        isSyncing={false}
        activeEncounterId="enc-123"
      />
    );

    const aside = container.querySelector('aside');
    expect(aside).toBeDefined();
    expect(aside?.className).toContain('w-16');
    expect(aside?.className).not.toContain('w-64');
    expect(aside?.className).not.toContain('w-20');
  });
});

