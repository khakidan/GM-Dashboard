export interface ParsedRoll {
  groups: Array<{
    count: number;
    sides: number;
    modifier?: number;
  }>;
  modifier: number;
  advantage: boolean;
  disadvantage: boolean;
  dropLowest: boolean;
}

export interface RollResult {
  groups: Array<{
    sides: number;
    rolls: number[];    // individual die results
    kept: number[];     // after drop/adv/dis
    subtotal: number;
  }>;
  modifier: number;
  total: number;
  notation: string;    // the original input
  timestamp: number;
}

/**
 * Parses standard D&D 5e dice notation into structured data.
 * @param input The dice notation string to parse (e.g., "2d6", "1d20+5", "2d6+1d4", "1d20 adv", "4d6 drop")
 */
export function parseDiceNotation(input: string): ParsedRoll {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Empty dice notation input");
  }

  const normalized = trimmed.toLowerCase();

  // Parse flags
  const advantage = /\b(adv|advantage)\b/.test(normalized);
  const disadvantage = /\b(dis|disadvantage)\b/.test(normalized);
  const dropLowest = /\b(drop|drop-lowest|droplowest)\b/.test(normalized);

  // Strip flags out to parse groups and modifiers cleanly
  let cleanStr = normalized
    .replace(/\b(adv|advantage|dis|disadvantage|drop|drop-lowest|droplowest)\b/g, '')
    .trim();

  // Validate characters. Only allowed: digits, 'd', '+', '-', and whitespace
  const isValid = /^[0-9d+\-\s]*$/.test(cleanStr);
  if (!isValid) {
    throw new Error(`Invalid dice notation: "${input}"`);
  }

  const groups: ParsedRoll['groups'] = [];
  let modifier = 0;

  // Match positive/negative dice groups or flat modifiers.
  // Term matches:
  // Capture 1: sign (+ or -)
  // Non-capturing group: either dice group (count"d"sides) or flat value
  // Capture 2: count of dice group
  // Capture 3: sides of dice group
  // Capture 4: flat value
  const termRegex = /([+-]?)\s*(?:(\d*)d(\d+)|(\d+))/gi;
  let match;
  let hasAtLeastOneDiceOrModifier = false;

  while ((match = termRegex.exec(cleanStr)) !== null) {
    // If the matched string is completely empty, skip (shouldn't happen with regex, but safe)
    if (match[0].trim() === "") continue;

    const sign = match[1] === '-' ? -1 : 1;
    const diceCountStr = match[2];
    const diceSidesStr = match[3];
    const flatValueStr = match[4];

    if (diceSidesStr !== undefined) {
      // It's a dice group e.g. "2d6" or "d20"
      const count = diceCountStr === "" ? 1 : parseInt(diceCountStr, 10);
      const sides = parseInt(diceSidesStr, 10);
      if (isNaN(count) || count < 0) {
        throw new Error(`Invalid dice count in notation: "${input}"`);
      }
      if (isNaN(sides) || sides <= 0) {
        throw new Error(`Invalid dice sides in notation: "${input}"`);
      }
      
      groups.push({
        count: sign * count,
        sides: sides,
      });
      hasAtLeastOneDiceOrModifier = true;
    } else if (flatValueStr !== undefined) {
      // It's a flat modifier e.g. "5" or "-3"
      const val = parseInt(flatValueStr, 10);
      if (isNaN(val)) {
        throw new Error(`Invalid flat modifier in notation: "${input}"`);
      }
      modifier += sign * val;
      hasAtLeastOneDiceOrModifier = true;
    }
  }

  // Make sure at least one group or modifier was parsed, and verify no stray text caused an empty parse
  if (!hasAtLeastOneDiceOrModifier || groups.length === 0 && modifier === 0) {
    throw new Error(`Invalid dice notation: "${input}"`);
  }

  return {
    groups,
    modifier,
    advantage,
    disadvantage,
    dropLowest,
  };
}

/**
 * Executes rolls based on a ParsedRoll payload.
 * Uses Math.random() directly.
 */
export function rollDice(parsed: ParsedRoll, originalNotation: string = ""): RollResult {
  const groups: RollResult['groups'] = [];
  let total = 0;

  for (const group of parsed.groups) {
    const isNegative = group.count < 0;
    const count = Math.abs(group.count);
    const sides = group.sides;

    const rolls: number[] = [];
    let kept: number[] = [];

    // Roll d20 special cases under advantage/disadvantage
    if ((parsed.advantage || parsed.disadvantage) && sides === 20 && count === 1) {
      // Roll 2 dice
      const d1 = Math.floor(Math.random() * 20) + 1;
      const d2 = Math.floor(Math.random() * 20) + 1;
      rolls.push(d1, d2);

      if (parsed.advantage) {
        kept.push(Math.max(d1, d2));
      } else {
        kept.push(Math.min(d1, d2));
      }
    } else {
      // Standard roll rules
      for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
      }

      // Populate kept
      if (parsed.dropLowest && count > 1) {
        // Drop the lowest single roll
        const sorted = [...rolls].sort((a, b) => a - b);
        // Kept elements are everything except the first (lowest)
        kept = sorted.slice(1);
      } else if (parsed.advantage && count > 0) {
        // Double count rolls to roll an extra die and drop lowest, or roll count + 1 and keep count highest
        // We'll roll 1 extra die and drop the lowest
        const extraRoll = Math.floor(Math.random() * sides) + 1;
        const allRolls = [...rolls, extraRoll];
        rolls.push(extraRoll);
        const sorted = [...allRolls].sort((a, b) => a - b);
        kept = sorted.slice(1);
      } else if (parsed.disadvantage && count > 0) {
        // Roll 1 extra die and drop the highest
        const extraRoll = Math.floor(Math.random() * sides) + 1;
        const allRolls = [...rolls, extraRoll];
        rolls.push(extraRoll);
        const sorted = [...allRolls].sort((a, b) => b - a); // descending to easily slice off the highest
        kept = sorted.slice(1); // kept the smaller ones
      } else {
        // No modifications
        kept = [...rolls];
      }
    }

    const baseSum = kept.reduce((sum, val) => sum + val, 0);
    const subtotal = isNegative ? -baseSum : baseSum;
    total += subtotal;

    groups.push({
      sides,
      rolls,
      kept,
      subtotal,
    });
  }

  total += parsed.modifier;

  return {
    groups,
    modifier: parsed.modifier,
    total,
    notation: originalNotation || formatNotation(parsed),
    timestamp: Date.now(),
  };
}

/**
 * Reconstructs standard dice notation string from ParsedRoll
 */
function formatNotation(parsed: ParsedRoll): string {
  const parts: string[] = [];

  for (const group of parsed.groups) {
    const absCount = Math.abs(group.count);
    const prefix = group.count < 0 ? "-" : (parts.length > 0 ? "+" : "");
    parts.push(`${prefix}${absCount}d${group.sides}`);
  }

  if (parsed.modifier !== 0) {
    const prefix = parsed.modifier > 0 ? `+${parsed.modifier}` : `${parsed.modifier}`;
    parts.push(prefix);
  }

  if (parsed.advantage) parts.push("adv");
  if (parsed.disadvantage) parts.push("dis");
  if (parsed.dropLowest) parts.push("drop");

  return parts.join(" ").replace(/\s\+/g, "+").replace(/\s-/g, "-");
}
