import type { ResourcePool } from './resourcePools';

export const CLASS_RESOURCE_SUGGESTIONS: Record<string, ResourcePool[]> = {
  'Barbarian': [
    { name: 'Rage', current: 2, max: 2, reset: 'long' },
  ],
  'Bard': [
    { name: 'Bardic Inspiration', current: 3, max: 3, reset: 'long' },
  ],
  'Cleric': [
    { name: 'Channel Divinity', current: 0, max: 0, reset: 'short' },
    { name: 'Spell Slots', current: 2, max: 2, reset: 'long' },
  ],
  'Druid': [
    { name: 'Wild Shape', current: 0, max: 0, reset: 'short' },
    { name: 'Spell Slots', current: 2, max: 2, reset: 'long' },
  ],
  'Fighter': [
    { name: 'Action Surge', current: 0, max: 0, reset: 'short' },
    { name: 'Second Wind', current: 1, max: 1, reset: 'short' },
  ],
  'Monk': [
    { name: 'Ki Points', current: 0, max: 0, reset: 'short' },
  ],
  'Paladin': [
    { name: 'Channel Divinity', current: 0, max: 0, reset: 'short' },
    { name: 'Lay on Hands', current: 5, max: 5, reset: 'long' },
  ],
  'Ranger': [],
  'Sorcerer': [
    { name: 'Sorcery Points', current: 0, max: 0, reset: 'long' },
    { name: 'Spell Slots', current: 2, max: 2, reset: 'long' },
  ],
  'Rogue': [
    { name: 'Sneak Attack (d6)', current: 1, max: 1, reset: 'long' },
  ],
  'Warlock': [
    { name: 'Warlock Spell Slots', current: 1, max: 1, reset: 'short' },
  ],
  'Wizard': [
    { name: 'Spell Slots', current: 2, max: 2, reset: 'long' },
  ],
  'Artificer': [
    { name: 'Infused Items', current: 2, max: 2, reset: 'long' },
    { name: 'Spell Slots', current: 2, max: 2, reset: 'long' },
  ],
};

// Returns suggested resource pools for the given class name.
// Match is case-insensitive.
// Returns [] for unknown or empty class names — never returns null.
// Returns deep copies so mutations by the caller do not affect the template data.
export function getClassResourceSuggestions(className: string): ResourcePool[] {
  if (!className?.trim()) return [];
  const key = Object.keys(CLASS_RESOURCE_SUGGESTIONS).find(
    (k) => k.toLowerCase() === className.toLowerCase().trim()
  );
  if (!key) return [];
  return CLASS_RESOURCE_SUGGESTIONS[key].map((pool) => ({ ...pool }));
}
