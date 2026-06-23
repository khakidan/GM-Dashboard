import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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

  it('renders without any toggle, hamburger, or close buttons', () => {
    const { container } = render(
      <GMDashboardSidebar
        activeTab="party"
        onTabChange={vi.fn()}
        campaignName="Test Campaign"
        isSyncing={false}
        activeEncounterId="enc-123"
      />
    );

    const toggleBtn = container.querySelector('#sidebar-toggle-btn');
    expect(toggleBtn).toBeNull();
  });

  it('renders nav icons with appropriate aria-label and tooltip elements', () => {
    const { container } = render(
      <GMDashboardSidebar
        activeTab="party"
        onTabChange={vi.fn()}
        campaignName="Test Campaign"
        isSyncing={false}
        activeEncounterId="enc-123"
      />
    );

    // Each button has an aria-label
    expect(screen.getByRole('button', { name: 'Party Roster' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'NPC Library' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Active Combat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All Campaigns' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();

    // Tooltips render correctly and are hidden by default (has opacity-0 class)
    const tooltips = container.querySelectorAll('.opacity-0');
    expect(tooltips.length).toBeGreaterThan(0);

    const tooltipTexts = Array.from(tooltips).map(el => el.textContent?.trim());
    expect(tooltipTexts).toContain('Party Roster');
    expect(tooltipTexts).toContain('NPC Library');
    expect(tooltipTexts).toContain('Active Combat');
    expect(tooltipTexts).toContain('Settings');
    expect(tooltipTexts).toContain('All Campaigns');
  });

  it('the active tab button has a visually distinct active state class', () => {
    render(
      <GMDashboardSidebar
        activeTab="party"
        onTabChange={vi.fn()}
        campaignName="Test Campaign"
        isSyncing={false}
        activeEncounterId="enc-123"
      />
    );

    const partyButton = screen.getByRole('button', { name: 'Party Roster' });
    expect(partyButton.className).toContain('bg-[#e5e1d8]');
    expect(partyButton.className).toContain('text-[#2c2c26]');

    const npcButton = screen.getByRole('button', { name: 'NPC Library' });
    // Use regex with word boundaries to ensure we don't match hover:bg-[#e5e1d8]/60
    expect(npcButton.className).not.toMatch(/\bbg-\[#e5e1d8\]\b/);
    expect(npcButton.className).toContain('text-[#5a5a40]');
  });

  it('clicking a tab button calls onTabChange with the correct tab key', () => {
    const handleTabChange = vi.fn();
    render(
      <GMDashboardSidebar
        activeTab="party"
        onTabChange={handleTabChange}
        campaignName="Test Campaign"
        isSyncing={false}
        activeEncounterId="enc-123"
      />
    );

    const npcButton = screen.getByRole('button', { name: 'NPC Library' });
    fireEvent.click(npcButton);

    expect(handleTabChange).toHaveBeenCalledWith('npc-library');
  });
});

