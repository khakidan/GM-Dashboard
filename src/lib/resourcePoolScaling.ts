import { ResourcePool } from './resourcePools';
import { CLASS_RESOURCE_SUGGESTIONS } from './classResources';

export interface ResourcePoolSuggestion {
  name: string;
  suggestedMax: number;
  currentMax: number | undefined;
    // undefined = this pool does not exist yet (new pool)
  reset: 'short' | 'long' | 'none';
  isAutoDerived: boolean;
    // true = value comes from a level table (high confidence)
    // false = value is pre-filled from current max or
    //         class default (GM should review)
  isNew: boolean;
    // true = pool does not exist on character yet
}

const POOL_LEVEL_TABLES: Record<string, Record<number, number>> = {
  'rage': {
    1: 2, 2: 2, 3: 3, 4: 3, 5: 3, 6: 4, 7: 4, 8: 4,
    9: 4, 10: 4, 11: 4, 12: 5, 13: 5, 14: 5, 15: 5,
    16: 5, 17: 6, 18: 6, 19: 6, 20: 99
      // 20 = unlimited; store as 99 as a sentinel
  },
  'ki points': {
    1: 0, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8,
    9: 9, 10: 10, 11: 11, 12: 12, 13: 13, 14: 14,
    15: 15, 16: 16, 17: 17, 18: 18, 19: 19, 20: 20
  },
  'sorcery points': {
    1: 0, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8,
    9: 9, 10: 10, 11: 11, 12: 12, 13: 13, 14: 14,
    15: 15, 16: 16, 17: 17, 18: 18, 19: 19, 20: 20
  },
  'action surge': {
    1: 0, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1,
    7: 1, 8: 1, 9: 1, 10: 1, 11: 1, 12: 1,
    13: 1, 14: 1, 15: 1, 16: 1, 17: 2,
    18: 2, 19: 2, 20: 2
  },
  'channel divinity': {
    1: 0, 2: 1, 3: 1, 4: 1, 5: 1, 6: 2,
    7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2,
    13: 2, 14: 2, 15: 2, 16: 2, 17: 2,
    18: 3, 19: 3, 20: 3
  },
  'lay on hands': {
    1: 5, 2: 10, 3: 15, 4: 20, 5: 25,
    6: 30, 7: 35, 8: 40, 9: 45, 10: 50,
    11: 55, 12: 60, 13: 65, 14: 70,
    15: 75, 16: 80, 17: 85, 18: 90,
    19: 95, 20: 100
  },
  'warlock spell slots': {
    1: 1, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2,
    7: 2, 8: 2, 9: 2, 10: 2, 11: 3,
    12: 3, 13: 3, 14: 3, 15: 3, 16: 3,
    17: 4, 18: 4, 19: 4, 20: 4
  },
  'sneak attack (d6)': {
    1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3,
    7: 4, 8: 4, 9: 5, 10: 5, 11: 6,
    12: 6, 13: 7, 14: 7, 15: 8, 16: 8,
    17: 9, 18: 9, 19: 10, 20: 10
  },
  'wild shape': {
    1: 0, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2,
    7: 2, 8: 2, 9: 2, 10: 2, 11: 2,
    12: 2, 13: 2, 14: 2, 15: 2, 16: 2,
    17: 2, 18: 2, 19: 2, 20: 99
      // 20 = unlimited; store as 99 as a sentinel
  }
};

function getAutoScaledMax(
  poolName: string,
  level: number
): number | null {
  const normalizedKey = poolName.trim().toLowerCase();
  const table = POOL_LEVEL_TABLES[normalizedKey];
  if (!table) {
    return null;
  }
  const clampedLevel = Math.max(1, Math.min(20, level));
  return table[clampedLevel] ?? null;
}

export function getResourcePoolSuggestions(
  className: string,
  newLevel: number,
  currentPools: ResourcePool[]
): ResourcePoolSuggestion[] {
  const suggestions: ResourcePoolSuggestion[] = [];

  // PASS 1 — Scale existing pools
  for (const pool of currentPools) {
    const autoMax = getAutoScaledMax(pool.name, newLevel);
    let suggestedMax = pool.max;
    let isAutoDerived = false;

    if (autoMax !== null && autoMax > 0) {
      suggestedMax = autoMax;
      isAutoDerived = true;
    }

    suggestions.push({
      name: pool.name,
      suggestedMax,
      currentMax: pool.max,
      reset: pool.reset,
      isAutoDerived,
      isNew: false
    });
  }

  // PASS 2 — Suggest new pools from class defaults
  // Find matching class key case-insensitively
  const classKey = Object.keys(CLASS_RESOURCE_SUGGESTIONS).find(
    (k) => k.toLowerCase() === className.trim().toLowerCase()
  );

  if (classKey) {
    const classDefaults = CLASS_RESOURCE_SUGGESTIONS[classKey];
    for (const pool of classDefaults) {
      const exists = currentPools.some(
        (cp) => cp.name.trim().toLowerCase() === pool.name.trim().toLowerCase()
      );

      if (!exists) {
        const autoMax = getAutoScaledMax(pool.name, newLevel);
        let suggestedMax = pool.max;
        let isAutoDerived = false;

        if (autoMax !== null) {
          suggestedMax = autoMax;
          isAutoDerived = true;
        }

        if (suggestedMax > 0) {
          suggestions.push({
            name: pool.name,
            suggestedMax,
            currentMax: undefined,
            reset: pool.reset,
            isAutoDerived,
            isNew: true
          });
        }
      }
    }
  }

  return suggestions;
}
