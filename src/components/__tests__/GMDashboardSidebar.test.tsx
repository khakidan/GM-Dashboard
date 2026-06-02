import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { GMDashboardSidebar } from '../GMDashboardSidebar';

describe('GMDashboardSidebar', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a button for each of the tabs', () => {
    render(
      <GMDashboardSidebar
        activeTab="party"
        onTabChange={vi.fn()}
        isOpen={true}
        onToggle={vi.fn()}
        campaignName="Test Campaign"
        isSyncing={false}
        activeEncounterId="enc-123"
      />
    );

    expect(screen.getByText('Party Roster')).toBeDefined();
    expect(screen.getByText('NPC Library')).toBeDefined();
    expect(screen.getByText('Encounters')).toBeDefined();
    expect(screen.getByText('Active Combat')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('the active tab button has a visually distinct active state class', () => {
    render(
      <GMDashboardSidebar
        activeTab="party"
        onTabChange={vi.fn()}
        isOpen={true}
        onToggle={vi.fn()}
        campaignName="Test Campaign"
        isSyncing={false}
        activeEncounterId="enc-123"
      />
    );

    const partyButton = screen.getByTitle('Party Roster');
    expect(partyButton.className).toContain('text-white');
    expect(partyButton.className).toContain('bg-[#3f3f37]');

    const npcButton = screen.getByTitle('NPC Library');
    expect(npcButton.className).not.toContain('bg-[#3f3f37] text-white');
  });

  it('clicking a tab button calls onTabChange with the correct tab key', () => {
    const handleTabChange = vi.fn();
    render(
      <GMDashboardSidebar
        activeTab="party"
        onTabChange={handleTabChange}
        isOpen={true}
        onToggle={vi.fn()}
        campaignName="Test Campaign"
        isSyncing={false}
        activeEncounterId="enc-123"
      />
    );

    const npcButton = screen.getByTitle('NPC Library');
    fireEvent.click(npcButton);

    expect(handleTabChange).toHaveBeenCalledWith('npc-library');
  });
});
