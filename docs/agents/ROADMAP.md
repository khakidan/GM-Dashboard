# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

**`lib/` bug-hunt audit findings — verified, queued for sequential fixes, highest severity first.** First pass of the Full Codebase Audit (see 🟡 below for overall plan). AI Studio audited `src/lib/` read-only per a concrete, evidence-required prompt; every finding was independently verified against the real files before being queued here. Fix order:

1. **`sheetSyncParser.ts` — off-by-one row index (highest severity).** `parseEncounters` and `parseEncounterCombatants` both compute `rowIndex` as `i + 1`; `parseCharacters` correctly uses `i + 2` for the identical "fetch range starts at row 2" scenario. Confirmed via direct read — any downstream write using this `rowIndex` targets the wrong sheet row.
2. **`sheetAdapters.ts` — silent data loss (highest severity).** `parseEncounterCombatantRowToEC` destructures only 11 of the `Encounter_Combatants` sheet's 14 columns — `npcLegendaryActionsRemaining`, `npcLegendaryResistancesRemaining`, and `npcRechargeState` are silently dropped on every resync. Confirmed via direct read against `schema.md`'s column list.
3. **`combatantBuilder.ts` — hardcoded NPC passive perception.** `passivePerception: 10` is hardcoded in `buildSingleNpcCombatant`, ignoring the NPC template's actual value. Confirmed via direct read; needs a check that the NPC type/schema actually carries a `passivePerception` field before the fix prompt is written.
4. **`resourcePoolScaling.ts` — Druid Wild Shape missing unlimited-at-20.** The Wild Shape level table caps at 2 even at level 20, unlike the Rage table which correctly uses a `99` sentinel for "unlimited" at level 20 (both Barbarian Rage and Druid Wild Shape become unlimited at 20th level per 5e RAW). Confirmed via direct read.
5. **`resourcePools.ts` — two issues.** `resetResourcesOnLongRest` resets ALL pools including `reset: 'none'` ones, contradicting that field's own documented meaning ("does not auto-reset — manual"). `getResourceForEffect` has no null-guard on `effectName`. Both confirmed via direct read.
6. **`irvOptions.ts` — two issues.** `firewall` is listed under the "Concentration spells" comment group in `EFFECT_OPTIONS` but missing from the actual `CONCENTRATION_EFFECTS` set (a bug introduced by the Badge Audit's own Phase 1a/1b, not pre-existing). Separately, per Dan's decision: add `enlarged` and `reduced` to `CONCENTRATION_EFFECTS` too — Enlarge/Reduce genuinely requires concentration per 5e RAW; the prior "Non-concentration effects" categorization was a simplification being corrected now, not treated as a bug from before.
7. **`spellcasting.ts` — case-sensitive class lookup.** `SPELLCASTING_ABILITY_MAP[className]` is a direct, case-sensitive key lookup, inconsistent with sibling lookups elsewhere (`getClassResourceSuggestions`, `getHitDieForClass`) that normalize case. Confirmed via direct read.
8. **`concentrationCheck.ts` / `combatLogic.ts` — duplicate DC calculation.** `concentrationCheckDc` (concentrationCheck.ts) and `computeConcentrationDC` (combatLogic.ts) compute the identical value, but only the former guards `damage <= 0`. Confirmed via direct read; needs consolidation to a single source of truth.
9. **Minor null-guard gaps** — confirmed via direct read, no guard for null/undefined input: `hitDice.ts`'s `getHitDieForClass`, `conditionDescriptions.ts`'s `getConditionDescription`, `sheetAdapters.ts`'s `statusName`/`difficultyName` `.toString()` calls.

**Rejected/excluded from the above** (documented for traceability, not queued): `combatLogic.ts`'s magical/nonmagical resistance handling and its Rage `(magical)`-tagging mechanism (both actually correct — verified against real rule text and the code's own `isDamageTypeMatch` logic); `diceRoller.ts` allowing advantage/disadvantage on non-d20 dice (a general-purpose free-text dice parser, not a rules violation); `hitDice.ts`'s d6/8/10/12 restriction (matches RAW exactly — no core class uses d4/d20 hit dice); `combatLog.ts`'s duplicated actor-check branches (a stylistic/DRY note, not a demonstrated functional bug). A separate `classResources.ts` "line 164" finding was fabricated outright — the file is 60 lines total and the claimed bug doesn't exist (the real function already has a proper null-safe guard) — excluded entirely, not tracked here.

### 🟡 Features to Add

None currently open. Badge System Audit & Optimization (Phases 1–4) is complete — see `CHANGELOG.md`.

**Full Codebase Audit (bugs → componentization → UI uniformity) — bug-hunting phase in progress, see 🔴 above for the current `lib/` queue.** Dan wants a comprehensive pass for logic errors/bugs, oversized files needing decomposition, and UI/UX uniformity closer to established D&D apps (D&D Beyond, Roll20 conventions). Distinct from the earlier "Codebase Modularity Audit" (`CHANGELOG.md`) — that pass checked structural duplication and layer violations across components/lib/services/hooks; this is about behavioral correctness. Explicitly prioritized in this order per Dan: (1) bug-hunting/logic errors, (2) file size & componentization, (3) UI uniformity/D&D-app UX conventions — phases 2 and 3 not scoped yet, deliberately deferred. Once the `lib/` bug queue above is cleared, next directories to audit (same method: AI Studio audits read-only with a concrete evidence-required prompt, every finding independently verified before fixing) are `hooks/`, `services/`, `components/`, order TBD.

**`PlayerView.tsx` further UI improvements for readability at 10-15 feet** — raised alongside the PC combatant card header redesign. Three specific D&D rules-accuracy bugs on this page were fixed previously (PC "Defeated" mislabeling, HP column hiding real HP, condition capitalization — see `CHANGELOG.md`) prior to the Dead/Stable badge work. Whether any further UI work is wanted on this page beyond the fixes above is still an open question — not yet confirmed either way.

### 🔵 Architecture / Technical Debt

**Remaining Technical Debt:** None.