export interface HitDiePool {
  die: number;    // die size: 6, 8, 10, 12
  count: number;  // total dice in this pool
}

export interface HitDiePoolStatus extends HitDiePool {
  used: number;      // how many spent
  remaining: number; // count - used (min 0)
}

// Parses "4d12+3d10" → 
//   [{die:12,count:4},{die:10,count:3}]
// Parses "7d8" → [{die:8,count:7}]
// Returns [] for empty or unparseable input
export function parseHitDiceConfig(config: string): HitDiePool[] {
  if (!config || typeof config !== 'string') return [];
  const trimmed = config.trim();
  if (!trimmed) return [];

  const parts = trimmed.split('+');
  const pools: HitDiePool[] = [];

  for (const part of parts) {
    const cleanPart = part.trim();
    if (!cleanPart) return [];
    const match = cleanPart.match(/^(\d+)d(6|8|10|12)$/i);
    if (!match) return [];
    pools.push({
      die: parseInt(match[2], 10),
      count: parseInt(match[1], 10),
    });
  }
  return pools;
}

// Parses '{"d12":1,"d10":0}' → {d12:1,d10:0}
// Returns {} for empty string or invalid JSON
export function parseHitDiceUsed(usedJson: string): Record<string, number> {
  if (!usedJson || typeof usedJson !== 'string') return {};
  const trimmed = usedJson.trim();
  if (!trimmed) return {};
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const result: Record<string, number> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'number') {
          result[key] = value;
        }
      }
      return result;
    }
    return {};
  } catch {
    return {};
  }
}

// Serializes {d12:1,d10:0} → '{"d12":1,"d10":0}'
export function serializeHitDiceUsed(used: Record<string, number>): string {
  return JSON.stringify(used);
}

// Combines config + usedJson into a full 
// status array for rendering
export function getHitDiceStatus(config: string, usedJson: string): HitDiePoolStatus[] {
  const pools = parseHitDiceConfig(config);
  const used = parseHitDiceUsed(usedJson);
  return pools.map(pool => {
    const spent = used[`d${pool.die}`] ?? 0;
    return {
      ...pool,
      used: spent,
      remaining: Math.max(0, pool.count - spent),
    };
  });
}

// Returns total hit dice count across all pools
// "4d12+3d10" → 7
export function getTotalHitDiceCount(config: string): number {
  const pools = parseHitDiceConfig(config);
  return pools.reduce((sum, pool) => sum + pool.count, 0);
}

// Calculates new hitDiceUsed after a long rest
// Rule: recover ceil(totalCount / 2) spent dice
// Recovery order: smallest die type first
//   (conserves larger dice)
// Cannot recover more than were spent
// Returns new serialized usedJson
export function applyLongRestHitDiceRecovery(config: string, usedJson: string): string {
  const totalCount = getTotalHitDiceCount(config);
  let recoveryLeft = Math.ceil(totalCount / 2);

  const used = parseHitDiceUsed(usedJson);
  const activeKeys = Object.keys(used).filter(key => /^d\d+$/.test(key) && used[key] > 0);

  if (recoveryLeft <= 0 || activeKeys.length === 0) {
    return serializeHitDiceUsed(used);
  }

  // Sort keys by die size ascending (smallest first)
  const sortedKeys = activeKeys.sort((a, b) => {
    const sizeA = parseInt(a.slice(1), 10);
    const sizeB = parseInt(b.slice(1), 10);
    return sizeA - sizeB;
  });

  for (const key of sortedKeys) {
    const spent = used[key];
    const recover = Math.min(spent, recoveryLeft);
    used[key] = spent - recover;
    recoveryLeft -= recover;
    if (recoveryLeft <= 0) break;
  }

  return serializeHitDiceUsed(used);
}

// Applies spending N dice of a given type
// Returns updated usedJson or throws if 
// trying to spend more than available
export function spendHitDice(
  config: string,
  usedJson: string,
  dieSize: number,
  count: number
): string {
  if (count < 0) {
    throw new Error('Cannot spend a negative number of hit dice');
  }
  if (count === 0) {
    return serializeHitDiceUsed(parseHitDiceUsed(usedJson));
  }

  const pools = parseHitDiceConfig(config);
  const matchingPool = pools.find(p => p.die === dieSize);
  const maxCount = matchingPool ? matchingPool.count : 0;

  const used = parseHitDiceUsed(usedJson);
  const key = `d${dieSize}`;
  const currentUsed = used[key] ?? 0;

  if (currentUsed + count > maxCount) {
    throw new Error(`Cannot spend ${count} d${dieSize} hit dice; only ${maxCount - currentUsed} remaining.`);
  }

  used[key] = currentUsed + count;
  return serializeHitDiceUsed(used);
}

export const CLASS_HIT_DIE_MAP: Record<string, number> = {
  barbarian: 12,
  fighter: 10,
  paladin: 10,
  ranger: 10,
  artificer: 8,
  bard: 8,
  cleric: 8,
  druid: 8,
  monk: 8,
  rogue: 8,
  warlock: 8,
  sorcerer: 6,
  wizard: 6,
};

// Returns the hit die size for a class name,
// case-insensitive. Returns null for 
// unrecognised classes (homebrew, etc.)
export function getHitDieForClass(className: string): number | null {
  if (!className || typeof className !== 'string') return null;
  return CLASS_HIT_DIE_MAP[className.toLowerCase().trim()] ?? null;
}

// Adds `count` dice of `dieSize` to an 
// existing config string.
// "4d12+3d10" + dieSize:10 → "4d12+4d10"
// "7d8" + dieSize:6 → "7d8+1d6"
// "" + dieSize:12 → "1d12"
// Pools are sorted largest die first.
export function addHitDieToConfig(
  currentConfig: string,
  dieSize: number,
  count: number = 1
): string {
  const pools = parseHitDiceConfig(currentConfig);
  const existing = pools.find(p => p.die === dieSize);
  if (existing) {
    existing.count += count;
  } else {
    pools.push({ die: dieSize, count });
  }
  pools.sort((a, b) => b.die - a.die);
  return pools
    .map(p => `${p.count}d${p.die}`)
    .join('+');
}

// Parses a class string that may contain 
// multiple classes separated by "/" or ","
// "Barbarian/Fighter" → ["Barbarian","Fighter"]
// "Monk" → ["Monk"]
// Handles whitespace around separators
export function parseClassString(classStr: string): string[] {
  if (!classStr?.trim()) return [];
  return classStr
    .split(/[\/,]/)
    .map(c => c.trim())
    .filter(Boolean);
}

// Given a class string like "Barbarian/Fighter"
// and a level, suggests a hitDiceConfig.
// Distributes levels evenly (this is an 
// approximation — the GM can override).
// For known classes uses CLASS_HIT_DIE_MAP.
// Returns empty string if no classes found.
export function suggestHitDiceConfig(
  classStr: string,
  totalLevel: number
): string {
  const classes = parseClassString(classStr);
  if (!classes.length) return '';
  
  // Distribute levels as evenly as possible
  const perClass = Math.floor(totalLevel / classes.length);
  const remainder = totalLevel % classes.length;
  
  const dieCounts: Record<number, number> = {};
  classes.forEach((cls, i) => {
    const dieSize = getHitDieForClass(cls);
    if (!dieSize) return;
    const count = perClass + (i < remainder ? 1 : 0);
    dieCounts[dieSize] = (dieCounts[dieSize] || 0) + count;
  });
  
  const entries = Object.entries(dieCounts);
  if (entries.length === 0) return '';

  return entries
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([die, count]) => `${count}d${die}`)
    .join('+');
}
