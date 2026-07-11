export interface ConditionDescription {
  summary: string;
  rules: string[];
  note?: string;
}

export const CONDITION_DESCRIPTIONS: Record<string, ConditionDescription> = {
  // ─── STANDARD CONDITIONS ───────────
  "blinded": {
    summary: "Can't see. Attacks against you have advantage; yours have disadvantage.",
    rules: [
      "Automatically fails any ability check that requires sight.",
      "Attack rolls against the creature have advantage.",
      "The creature's attack rolls have disadvantage."
    ]
  },
  "charmed": {
    summary: "Can't attack the charmer. Charmer has social advantage.",
    rules: [
      "Can't attack the charmer or target the charmer with harmful abilities or magical effects.",
      "The charmer has advantage on any ability check to interact socially with the creature."
    ]
  },
  "deafened": {
    summary: "Can't hear. Auto-fails hearing-based checks.",
    rules: [
      "Can't hear.",
      "Automatically fails any ability check that requires hearing."
    ]
  },
  "dodging": {
    summary: "Attack rolls against you have disadvantage if you can see the attacker, and you have advantage on DEX saves. Ends if incapacitated or speed is 0.",
    rules: [
      "Attack rolls against the creature have disadvantage if it can see the attacker.",
      "The creature has advantage on Dexterity saving throws.",
      "The benefit is lost if the creature is incapacitated or if its speed drops to 0."
    ]
  },
  "frightened": {
    summary: "Disadvantage on checks and attacks while source is visible. Can't move closer to source.",
    rules: [
      "Disadvantage on ability checks and attack rolls while the source of fear is within line of sight.",
      "Can't willingly move closer to the source of its fear."
    ]
  },
  "grappled": {
    summary: "Speed becomes 0. Ends if grappler is incapacitated.",
    rules: [
      "Speed becomes 0, can't benefit from any bonus to speed.",
      "Ends if the grappler is incapacitated.",
      "Ends if an effect removes the creature from the grappler's reach."
    ]
  },
  "incapacitated": {
    summary: "Can't take actions or reactions.",
    rules: [
      "Can't take actions or reactions."
    ]
  },
  "invisible": {
    summary: "Can't be seen without magic or special sense. Your attacks have advantage; enemies have disadvantage.",
    rules: [
      "Impossible to see without magic or a special sense.",
      "Heavily obscured for hiding purposes.",
      "Attack rolls against the creature have disadvantage.",
      "The creature's attack rolls have advantage."
    ]
  },
  "paralyzed": {
    summary: "Incapacitated and can't move or speak. Auto-fails STR/DEX saves. Attacks have advantage and crit within 5 feet.",
    rules: [
      "Incapacitated — can't take actions or reactions.",
      "Can't move or speak.",
      "Automatically fails Strength and Dexterity saving throws.",
      "Attack rolls against the creature have advantage.",
      "Any attack that hits is a critical hit if the attacker is within 5 feet."
    ]
  },
  "petrified": {
    summary: "Turned to stone. Incapacitated, unaware, resistance to all damage, immune to poison and disease.",
    rules: [
      "Transformed into a solid inanimate substance. Weight ×10, ceases aging.",
      "Incapacitated — can't take actions or reactions.",
      "Can't move or speak and is unaware of surroundings.",
      "Attack rolls against the creature have advantage.",
      "Automatically fails Strength and Dexterity saving throws.",
      "Resistance to all damage.",
      "Immune to poison and disease. Existing conditions are suspended, not neutralized."
    ]
  },
  "poisoned": {
    summary: "Disadvantage on attack rolls and ability checks.",
    rules: [
      "Disadvantage on attack rolls.",
      "Disadvantage on ability checks."
    ]
  },
  "prone": {
    summary: "Can only crawl or stand up. Disadvantage on attacks. Melee attackers have advantage; ranged attackers have disadvantage.",
    rules: [
      "Only movement option is to crawl (costs double movement) unless the creature stands up (costs half movement speed).",
      "Disadvantage on attack rolls.",
      "Attack rolls against the creature have advantage if the attacker is within 5 feet.",
      "Attack rolls against the creature have disadvantage if the attacker is more than 5 feet away."
    ]
  },
  "restrained": {
    summary: "Speed 0. Attacks against you have advantage; yours have disadvantage. Disadvantage on DEX saves.",
    rules: [
      "Speed becomes 0, can't benefit from any bonus to speed.",
      "Attack rolls against the creature have advantage.",
      "The creature's attack rolls have disadvantage.",
      "Disadvantage on Dexterity saving throws."
    ]
  },
  "stunned": {
    summary: "Incapacitated, can't move. Auto-fails STR/DEX saves. Attacks against you have advantage.",
    rules: [
      "Incapacitated — can't take actions or reactions.",
      "Can't move. Can speak only falteringly.",
      "Automatically fails Strength and Dexterity saving throws.",
      "Attack rolls against the creature have advantage."
    ]
  },
  "unconscious": {
    summary: "Incapacitated, prone, unaware. Auto-fails STR/DEX saves. Attacks have advantage and crit within 5 feet.",
    rules: [
      "Incapacitated — can't take actions or reactions.",
      "Can't move or speak and is unaware of surroundings.",
      "Drops whatever it's holding and falls prone.",
      "Automatically fails Strength and Dexterity saving throws.",
      "Attack rolls against the creature have advantage.",
      "Any attack that hits is a critical hit if the attacker is within 5 feet."
    ]
  },

  // ─── EXHAUSTION LEVELS ─────────────
  "exhaustion 1": {
    summary: "Disadvantage on ability checks.",
    rules: [
      "Disadvantage on ability checks."
    ],
    note: "Exhaustion is cumulative. A long rest removes one level if the creature has had food and water."
  },
  "exhaustion 2": {
    summary: "Levels 1–2: Disadvantage on ability checks. Speed halved.",
    rules: [
      "Level 1: Disadvantage on ability checks.",
      "Level 2: Speed halved."
    ],
    note: "Effects are cumulative with lower levels."
  },
  "exhaustion 3": {
    summary: "Levels 1–3: Also disadvantage on attack rolls and saving throws.",
    rules: [
      "Level 1: Disadvantage on ability checks.",
      "Level 2: Speed halved.",
      "Level 3: Disadvantage on attack rolls and saving throws."
    ],
    note: "Effects are cumulative with lower levels."
  },
  "exhaustion 4": {
    summary: "Levels 1–4: Also hit point maximum halved.",
    rules: [
      "Level 1: Disadvantage on ability checks.",
      "Level 2: Speed halved.",
      "Level 3: Disadvantage on attack rolls and saving throws.",
      "Level 4: Hit point maximum halved."
    ],
    note: "Effects are cumulative with lower levels."
  },
  "exhaustion 5": {
    summary: "Levels 1–5: Also speed reduced to 0.",
    rules: [
      "Level 1: Disadvantage on ability checks.",
      "Level 2: Speed halved.",
      "Level 3: Disadvantage on attack rolls and saving throws.",
      "Level 4: Hit point maximum halved.",
      "Level 5: Speed reduced to 0."
    ],
    note: "Effects are cumulative with lower levels."
  },
  "exhaustion 6": {
    summary: "Death.",
    rules: [
      "The creature dies."
    ],
    note: "Effects are cumulative with all lower levels."
  },

  // ─── COMBAT EFFECTS / CLASS FEATURES ─
  "raging": {
    summary: "Barbarian rage. Advantage on STR, resistance to physical damage, bonus damage.",
    rules: [
      "Advantage on Strength checks and Strength saving throws.",
      "Bonus damage on Strength-based weapon attacks (amount varies by Barbarian level).",
      "Resistance to bludgeoning, piercing, and slashing damage.",
      "Can't cast or concentrate on spells.",
      "Lasts 1 minute. Ends early if incapacitated, or if the turn ends without attacking or taking damage."
    ]
  },
  "concentrating": {
    summary: "Maintaining a concentration spell. Breaks on damage save failure, incapacitation, or death.",
    rules: [
      "Ends if another concentration spell is cast.",
      "On taking damage: make a DC 10 or half-damage Constitution save (whichever is higher). Failure breaks concentration.",
      "Ends if incapacitated or killed.",
      "Only one concentration spell can be active at a time."
    ]
  },
  "wild shaped": {
    summary: "Druid transformed into a beast. Uses beast's HP and stats.",
    rules: [
      "Game statistics replaced by beast form, retaining personality, memories, and proficiency.",
      "Uses beast's hit point pool. Reverting to normal restores original HP (minus damage taken in beast form).",
      "Can't cast spells or take actions requiring hands while in beast form.",
      "Equipment doesn't transform. Can choose to drop, merge, or have items absorbed."
    ]
  },
  "hasted": {
    summary: "Haste: double speed, +2 AC, advantage on DEX saves, extra action. Incapacitated 1 turn when it ends.",
    rules: [
      "Speed doubled.",
      "+2 bonus to AC.",
      "Advantage on Dexterity saving throws.",
      "Gains an additional action on each turn (Attack, Dash, Disengage, Hide, or Use Object only).",
      "When the spell ends: incapacitated and can't move until the end of the next turn."
    ]
  },
  "slowed": {
    summary: "Slow: speed halved, -2 AC and DEX saves, action or bonus action only, max 1 attack per turn.",
    rules: [
      "Speed halved.",
      "-2 penalty to AC.",
      "-2 penalty to Dexterity saving throws.",
      "Can't use reactions.",
      "On its turn can use either an action or a bonus action, not both.",
      "Regardless of abilities, can make only one melee or ranged attack per turn."
    ]
  },
  "blessed": {
    summary: "Bless: add 1d4 to attack rolls and saving throws.",
    rules: [
      "Add a d4 to attack rolls.",
      "Add a d4 to saving throws."
    ]
  },
  "baned": {
    summary: "Bane: subtract 1d4 from attack rolls and saving throws.",
    rules: [
      "Subtract a d4 from attack rolls.",
      "Subtract a d4 from saving throws."
    ]
  },
  "hexed": {
    summary: "Hex: +1d6 necrotic on weapon hits. Disadvantage on chosen ability checks.",
    rules: [
      "Take an extra 1d6 necrotic damage whenever the caster hits with a weapon attack.",
      "Disadvantage on ability checks using the chosen ability score."
    ]
  },
  "hunter's mark": {
    summary: "Hunter's Mark: +1d6 weapon damage. Caster has advantage to track the target.",
    rules: [
      "Deal an extra 1d6 damage whenever the caster hits with a weapon attack.",
      "Advantage on Perception and Survival checks to find the marked creature."
    ]
  },
  "shield of faith": {
    summary: "Shield of Faith: +2 to AC.",
    rules: [
      "+2 bonus to AC."
    ]
  },
  "spirit guardians": {
    summary: "Spirit Guardians: Difficult terrain, 3d8 damage on failed WIS save when entering or starting turn in area.",
    rules: [
      "Creatures of the caster's choice entering the area or starting their turn there must succeed on a Wisdom saving throw or take 3d8 radiant (or necrotic) damage, half on a success.",
      "The area is difficult terrain for affected creatures."
    ]
  },
  "blurred": {
    summary: "Blur: attackers have disadvantage against you unless they don't rely on sight.",
    rules: [
      "Attack rolls against the creature have disadvantage.",
      "Exception: attackers that don't rely on sight or can see through magical darkness are unaffected."
    ]
  },
  "polymorphed": {
    summary: "Polymorph: transformed into a beast with the beast's stats and HP.",
    rules: [
      "New form's game statistics replace the creature's statistics.",
      "Uses the new form's hit point pool. Reverting restores original HP minus damage taken in beast form.",
      "Can't cast spells or speak.",
      "Ends when HP drops to 0 (excess damage carries to original form) or concentration breaks."
    ]
  },
  "fly": {
    summary: "Fly: flying speed of 60 feet. Falls if spell ends while aloft.",
    rules: [
      "Gains a flying speed of 60 feet.",
      "If the spell ends while the creature is still aloft, it falls unless it can stop falling in some other way."
    ]
  },
  "stoneskin": {
    summary: "Stoneskin: resistance to nonmagical bludgeoning, piercing, and slashing damage.",
    rules: [
      "Resistance to nonmagical bludgeoning, piercing, and slashing damage."
    ]
  },
  "fire shield": {
    summary: "Fire Shield: resistance to fire or cold. Melee attackers take 2d8 damage.",
    rules: [
      "Warm shield: resistance to cold damage, attacker takes 2d8 fire.",
      "Chill shield: resistance to fire damage, attacker takes 2d8 cold.",
      "When hit in melee, the attacker takes 2d8 fire or cold damage (no save)."
    ]
  },
  "firewall": {
    summary: "Wall of fire that deals damage to creatures that touch it or end their turn within 10 feet. One side of the wall (caster's choice) deals damage.",
    rules: [
      "A wall of fire that deals damage to creatures that touch it or end their turn within 10 feet.",
      "One side of the wall (caster's choice) deals damage while the other side is safe."
    ]
  },
  "mirror image": {
    summary: "Mirror Image: 3 illusory duplicates deflect attacks.",
    rules: [
      "Three duplicates mimic your actions. AC = 10 + Dex modifier.",
      "When attacked, roll d20: 3 duplicates (6+), 2 duplicates (5-6 on d8), 1 duplicate (5-6 on d10). On a hit, a duplicate is destroyed instead.",
      "Duplicates are destroyed by area effects and cannot be targeted directly by spells."
    ]
  },
  "aid (boosted)": {
    summary: "Aid: +5 to hit point maximum and current HP.",
    rules: [
      "Hit point maximum increased by 5 (at 2nd level, +5 per slot level above 2nd).",
      "Current hit points also increased by the same amount."
    ]
  },
  "enlarged": {
    summary: "Enlarge: advantage on STR checks and saves, +1d4 weapon damage.",
    rules: [
      "Size increases by one category.",
      "Advantage on Strength checks and Strength saving throws.",
      "Weapon attacks deal +1d4 damage."
    ]
  },
  "reduced": {
    summary: "Reduce: disadvantage on STR checks and saves, -1d4 weapon damage.",
    rules: [
      "Size decreases by one category.",
      "Disadvantage on Strength checks and Strength saving throws.",
      "Weapon attacks deal -1d4 damage (minimum 1)."
    ]
  },
  "mage armor": {
    summary: "Mage Armor: AC = 13 + DEX modifier while unarmored.",
    rules: [
      "Base AC becomes 13 + Dexterity modifier.",
      "Only applies if the creature is not wearing armor."
    ]
  },
  "guided": {
    summary: "Guidance: add 1d4 to one ability check (declared before rolling).",
    rules: [
      "Add a d4 to one ability check of the creature's choice.",
      "Must be declared before the roll is made."
    ]
  },
  "spiritual weapon": {
    summary: "Spiritual Weapon: bonus action attack each turn, force damage, spell attack roll.",
    rules: [
      "Use bonus action to move the weapon and make a melee spell attack.",
      "Deals force damage on a hit.",
      "Does not require concentration."
    ]
  }
};

export function getConditionDescription(
  conditionName: string
): ConditionDescription | null {
  if (!conditionName || typeof conditionName !== 'string') return null;
  const key = conditionName.toLowerCase().trim();
  return CONDITION_DESCRIPTIONS[key] ?? null;
}
