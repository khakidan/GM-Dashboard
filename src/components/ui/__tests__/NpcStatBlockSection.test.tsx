import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { NpcStatBlockSection, formatActionMeta } from '../NpcStatBlockSection';
import { NpcAction } from '../../../types';

describe('NpcStatBlockSection', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('returns null / renders nothing when items is []', () => {
      const { container } = render(
        <NpcStatBlockSection title="Traits" items={[]} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders the section title when items is non-empty', () => {
      render(
        <NpcStatBlockSection
          title="Traits"
          items={[{ name: 'Keen Hearing', description: 'The NPC has keen hearing.' }]}
        />
      );
      expect(screen.getByText('Traits')).toBeInTheDocument();
    });

    it('renders the item name', () => {
      render(
        <NpcStatBlockSection
          title="Traits"
          items={[{ name: 'Keen Hearing', description: 'The NPC has keen hearing.' }]}
        />
      );
      expect(screen.getByText('Keen Hearing')).toBeInTheDocument();
    });

    it('renders the item description', () => {
      render(
        <NpcStatBlockSection
          title="Traits"
          items={[{ name: 'Keen Hearing', description: 'The NPC has keen hearing.' }]}
        />
      );
      expect(screen.getByText('The NPC has keen hearing.')).toBeInTheDocument();
    });

    it('renders the meta line when meta is non-empty', () => {
      render(
        <NpcStatBlockSection
          title="Actions"
          items={[
            {
              name: 'Bite',
              description: 'Melee Weapon Attack.',
              meta: '+5 to hit | 1d6+3 piercing',
            },
          ]}
        />
      );
      expect(screen.getByText('+5 to hit | 1d6+3 piercing')).toBeInTheDocument();
    });

    it('does not render a meta element when meta is undefined or empty', () => {
      render(
        <NpcStatBlockSection
          title="Traits"
          items={[{ name: 'Keen Hearing', description: 'The NPC has keen hearing.', meta: '' }]}
        />
      );
      const metaSpan = screen.queryByText('+5 to hit');
      expect(metaSpan).toBeNull();
    });
  });

  describe('Multiple items', () => {
    it('renders N items when items has N elements', () => {
      render(
        <NpcStatBlockSection
          title="Traits"
          items={[
            { name: 'Trait A', description: 'Desc A' },
            { name: 'Trait B', description: 'Desc B' },
            { name: 'Trait C', description: 'Desc C' },
          ]}
        />
      );
      expect(screen.getByText('Trait A')).toBeInTheDocument();
      expect(screen.getByText('Trait B')).toBeInTheDocument();
      expect(screen.getByText('Trait C')).toBeInTheDocument();
    });
  });

  describe('formatActionMeta', () => {
    it('attackBonus + damage -> "+N to hit | damage"', () => {
      const action: NpcAction = {
        name: 'Slash',
        description: 'Melee weapon attack.',
        attackBonus: 7,
        damage: '2d8+4 fire',
      };
      expect(formatActionMeta(action)).toBe('+7 to hit | 2d8+4 fire');
    });

    it('saveDC + saveType -> "DC N Type save"', () => {
      const action: NpcAction = {
        name: 'Fire Breath',
        description: 'Exhales fire.',
        saveDC: 15,
        saveType: 'Con',
      };
      expect(formatActionMeta(action)).toBe('DC 15 Con save');
    });

    it('recharge prefix appears when set', () => {
      const action: NpcAction = {
        name: 'Breath',
        description: 'Cool breath.',
        recharge: 'Recharge 5-6',
        attackBonus: 5,
        damage: '3d6 cold',
      };
      expect(formatActionMeta(action)).toBe('Recharge 5-6 | +5 to hit | 3d6 cold');
    });

    it('empty fields are omitted from the output', () => {
      const action: NpcAction = {
        name: 'Action',
        description: 'Simple action.',
        attackBonus: 0,
      };
      expect(formatActionMeta(action)).toBe('+0 to hit');
    });

    it('returns empty string when no mechanical fields set', () => {
      const action: NpcAction = {
        name: 'Plain',
        description: 'No mechanics.',
      };
      expect(formatActionMeta(action)).toBe('');
    });
  });
});
