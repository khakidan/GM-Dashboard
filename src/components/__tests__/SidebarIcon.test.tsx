import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SidebarIcon } from '../SidebarIcon';
import { Search } from 'lucide-react';

describe('SidebarIcon', () => {
  it('renders the icon and label as an aria-label or accessible text', () => {
    const { container } = render(
      <SidebarIcon icon={<Search data-testid="search-icon" />} label="Search Tool" onClick={() => {}} />
    );
    expect(screen.getByTestId('search-icon')).toBeDefined();
    expect(screen.getByLabelText('Search Tool')).toBeDefined();
    expect(screen.getByText('Search Tool')).toBeDefined(); // Tooltip text
  });

  it('applies active styling when isActive is true', () => {
    render(<SidebarIcon icon={<Search />} label="Active Tool" isActive={true} onClick={() => {}} />);
    const button = screen.getByLabelText('Active Tool');
    expect(button.className).toContain('bg-[#3f3f37]');
    expect(button.className).toContain('text-white');
    expect(button.className).toContain('ring-[#c5b358]/30');
  });

  it('applies inactive styling when isActive is false', () => {
    render(<SidebarIcon icon={<Search />} label="Inactive Tool" isActive={false} onClick={() => {}} />);
    const button = screen.getByLabelText('Inactive Tool');
    expect(button.className).toContain('text-stone-400');
    expect(button.className).toContain('hover:text-stone-200');
    expect(button.className).not.toContain('text-white');
    expect(button.className).not.toContain('ring-[#c5b358]');
  });

  it('tooltip has opacity-0 by default and is visually hidden', () => {
    render(<SidebarIcon icon={<Search />} label="Tooltip Test" onClick={() => {}} />);
    const tooltip = screen.getByText('Tooltip Test');
    expect(tooltip.className).toContain('opacity-0');
    expect(tooltip.className).toContain('group-hover:opacity-100');
  });

  it('aria-label attribute is set correctly from aria-label prop', () => {
    render(<SidebarIcon icon={<Search />} label="Tooltip Base" aria-label="Custom Aria Label" onClick={() => {}} />);
    const button = screen.getByLabelText('Custom Aria Label');
    expect(button).toBeDefined();
  });

  it('onClick fires when button is clicked', () => {
    const clickSpy = vi.fn();
    render(<SidebarIcon icon={<Search />} label="Click Me" onClick={clickSpy} />);
    fireEvent.click(screen.getByLabelText('Click Me'));
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
