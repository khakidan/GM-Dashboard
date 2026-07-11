export interface ResourcePool {
  name: string;       // "Rage", "Ki", "Spell Slots"
  current: number;    // How many uses remain
  max: number;        // Maximum uses
  reset: 'short' | 'long' | 'none';
  // 'short' = resets on short OR long rest
  // 'long'  = resets on long rest only
  // 'none'  = does not auto-reset (manual)
}

// Parses '[]' or valid JSON → ResourcePool[]
// Returns [] on empty string or invalid JSON
export function parseResourcePools(json: string): ResourcePool[] {
  if (!json || typeof json !== 'string' || json.trim() === '') {
    return [];
  }
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed as ResourcePool[];
    }
    return [];
  } catch {
    return [];
  }
}

// Serializes ResourcePool[] → JSON string
export function serializeResourcePools(pools: ResourcePool[]): string {
  return JSON.stringify(pools || []);
}

// Spend count pips of named resource
// current cannot go below 0
// Returns new pools array (does not mutate)
export function spendResourcePip(
  pools: ResourcePool[],
  resourceName: string,
  count: number = 1
): ResourcePool[] {
  return pools.map((pool) => {
    if (pool.name.toLowerCase() === resourceName.toLowerCase()) {
      return {
        ...pool,
        current: Math.max(0, pool.current - count),
      };
    }
    return pool;
  });
}

// Recover count pips of named resource
// current cannot exceed max
// Returns new pools array (does not mutate)
export function recoverResourcePip(
  pools: ResourcePool[],
  resourceName: string,
  count: number = 1
): ResourcePool[] {
  return pools.map((pool) => {
    if (pool.name.toLowerCase() === resourceName.toLowerCase()) {
      return {
        ...pool,
        current: Math.min(pool.max, pool.current + count),
      };
    }
    return pool;
  });
}

// On short rest: set current = max for all
// pools where reset === 'short'
// Pools with reset 'long' or 'none' unchanged
export function resetResourcesOnShortRest(pools: ResourcePool[]): ResourcePool[] {
  return pools.map((pool) => {
    if (pool.reset === 'short') {
      return {
        ...pool,
        current: pool.max,
      };
    }
    return pool;
  });
}

// On long rest: set current = max for pools where reset is 'short' or 'long' (skips 'none')
export function resetResourcesOnLongRest(pools: ResourcePool[]): ResourcePool[] {
  return pools.map((pool) => {
    if (pool.reset === 'none') {
      return pool;
    }
    return {
      ...pool,
      current: pool.max,
    };
  });
}

// Add a new resource pool.
// current starts at max (full on creation).
// If a pool with the same name already
// exists, returns pools unchanged.
export function addResourcePool(
  pools: ResourcePool[],
  pool: { name: string; max: number; reset: ResourcePool['reset'] }
): ResourcePool[] {
  const exists = pools.some(
    (p) => p.name.toLowerCase() === pool.name.toLowerCase()
  );
  if (exists) {
    return pools;
  }
  const newPool: ResourcePool = {
    name: pool.name,
    max: pool.max,
    current: pool.max,
    reset: pool.reset,
  };
  return [...pools, newPool];
}

// Remove a pool by name.
// Case-insensitive match.
export function removeResourcePool(pools: ResourcePool[], resourceName: string): ResourcePool[] {
  return pools.filter(
    (p) => p.name.toLowerCase() !== resourceName.toLowerCase()
  );
}

// Update name, max, or reset type of
// an existing pool.
// If max decreases below current,
// clamp current to new max.
export function updateResourcePool(
  pools: ResourcePool[],
  resourceName: string,
  updates: Partial<Pick<ResourcePool, 'name' | 'max' | 'reset'>>
): ResourcePool[] {
  return pools.map((pool) => {
    if (pool.name.toLowerCase() === resourceName.toLowerCase()) {
      const nextName = updates.name !== undefined ? updates.name : pool.name;
      const nextMax = updates.max !== undefined ? updates.max : pool.max;
      const nextReset = updates.reset !== undefined ? updates.reset : pool.reset;
      const nextCurrent = updates.max !== undefined ? Math.min(pool.current, updates.max) : pool.current;
      return {
        ...pool,
        name: nextName,
        max: nextMax,
        reset: nextReset,
        current: nextCurrent,
      };
    }
    return pool;
  });
}

// Maps exact effect names (lowercase) 
// to the resource pool name they 
// decrement when applied.
// Matching is case-insensitive and 
// exact — no partial matches.
export const EFFECT_RESOURCE_MAP: Record<string, string> = {
  'raging':      'rage',
  'wild shaped': 'wild shape',
};

// Returns the resource pool name to 
// decrement when this effect is applied, 
// or null if no mapping exists.
export function getResourceForEffect(
  effectName: string
): string | null {
  if (!effectName || typeof effectName !== 'string') {
    return null;
  }
  return EFFECT_RESOURCE_MAP[
    effectName.toLowerCase().trim()
  ] ?? null;
}

