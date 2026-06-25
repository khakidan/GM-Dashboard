import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ShortcutCheatSheet } from '../ShortcutCheatSheet';

describe('ShortcutCheatSheet', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ShortcutCheatSheet isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders without crashing when isOpen is true', () => {
    const { container } = render(
      <ShortcutCheatSheet isOpen={true} onClose={vi.fn()} />
    );
    expect(container).toBeInTheDocument();
  });

  it('triggers onClose when Close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(
      <ShortcutCheatSheet isOpen={true} onClose={onCloseMock} />
    );
    const closeBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when Escape key is pressed', () => {
    const onCloseMock = vi.fn();
    render(
      <ShortcutCheatSheet isOpen={true} onClose={onCloseMock} />
    );

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
