import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ShortcutCheatSheet } from '../ShortcutCheatSheet';

describe('ShortcutCheatSheet', () => {
  afterEach(() => cleanup());

  it('renders nothing when isOpen is false and renders shortcuts when isOpen is true', () => {
    const { container, rerender } = render(
      <ShortcutCheatSheet isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();

    rerender(<ShortcutCheatSheet isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });
});
