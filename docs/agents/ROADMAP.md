# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

None currently open. (The `useNpcLibrary.ts` double-confirmation bug is fixed — confirmed directly, zero `confirm()` calls remain in that file, Batch 6C matches baseline. See `CHANGELOG.md`.)

### 🟡 Features to Add

**PC combatant card header redesign — user-driven, fully iterated design (4 rounds of mockup review), staged build in progress.** Origin: user screenshots showed the collapsed header sprawling across 4 rows for PCs (2 built-in rows, plus `CombatantCompactResourceRow`'s own separate bordered row, plus a 4th line for spell stats) — cluttered, hard to scan at a glance. Also resolves a standing complaint about a horizontal line in the Active Encounter header (`CombatantCompactResourceRow`'s own `border-t` divider) — no separate fix needed, it disappears once that row's content merges into Row 2 below.

**The confirmed design** (see mockups already shown in conversation — do not re-derive, this is settled):
- **Row 1 (vitals)** — unchanged: Init, name, AC, HP, damage input + damage type dropdown + DMG button, divider, heal input + HEAL button, chevron. Two additions: "DC {spellSaveDC} · Atk +{spellAttackBonus}" as small muted text between the name block and AC (spellcasters only), and the death-save tracker restructured into a small bordered/tinted box with two stacked lines, "F: [pips]" then "S: [pips]" (shortened from "Fails:"/"Success:").
- **Row 2 (status)** — Reaction toggle immediately followed inline by resource-pool trackers as clickable pips (`PipTracker` at `size="compact"`, interactive not read-only — replacing the old `-`/`+` button pair entirely), right side keeps the existing mechanical/health badges.
- **`CombatantCardBadges.tsx`**: the "active conditions" (red dot) and "active effects" (blue dot) indicators are removed entirely — confirmed redundant now that real condition/effect badges already exist elsewhere for every state these were summarizing. The "attacks against this creature have advantage" purple dot becomes a real `<Badge color="purple">VULNERABLE</Badge>` — words over decorative dots-with-tooltips throughout, per explicit user direction.
- **Font sizes bumped** across Row 2's badges, the Reaction toggle, resource-tracker labels, death-save labels, and the spell-stats text — roughly up to `text-sm` (13px) from whatever smaller size each currently uses. Applied as targeted `className` overrides at each specific call site — `Badge`'s and `PipTracker`'s own `default`/`compact` size definitions themselves stay unchanged, since they're used elsewhere throughout the app.
- Explicit non-goal: don't worry about small-screen responsiveness — user confirmed this is a single-user, full-laptop-width app.

**Key findings from investigation (Stage 1, done)**:
- `SpellcastingStatsRow` is **not** rendered inside `CombatantCardHeader.tsx` at all — it's rendered as a sibling in `CombatantCard.tsx` (the parent), directly below `<CombatantCardHeader />`, only when `!isExpanded`. Moving the DC/Atk text into Row 1 means either computing it directly inside `CombatantCardHeader.tsx` from the `pcCharacter` prop it already receives, or threading new data through — this is real cross-file wiring, not a simple move, which is why the first attempt at a single all-in-one prompt caused AI Studio to stall for 300+ seconds without making any edit.
- `DeathSaveTrackerDisplay.tsx`'s exact current implementation confirmed and quoted in full — labels are currently "Fails:"/"Success:" (not "FAILS:"/"SUCCESS:" as shown in the UI screenshots, which apply their own uppercase styling), pips are `●`/`○`/`♥` Unicode characters at `text-sm`, wrapped in a `bg-rose-50/70 border-rose-100` box already — the restructuring needed is relabeling to "F:"/"S:" and stacking (currently side-by-side implied by flex-col wrapping two flex rows — confirm actual current visual arrangement directly before assuming it needs to change further).

**Staged build plan** (this project's established discipline — small, isolated, sequential steps; each stage's output already exists before the next stage depends on it):
1. Investigation (`SpellcastingStatsRow`'s real render location, `DeathSaveTrackerDisplay.tsx`'s real implementation) — **done**.
2. `CombatantCardBadges.tsx` alone — dot removals/replacement, font-size bump. **Done, verified directly**: both dots removed, the underlying dead logic (`hasActiveConditions`/`hasActiveEffects`/`CONDITION_OPTIONS`/`EFFECT_OPTIONS`) cleaned up too, not just their rendering; `VULNERABLE` badge added; all 9 mechanical badges consistently bumped to `size="default" className="text-sm"`. Batch 5B (11 files/26 tests) matches baseline.
3. `DeathSaveTrackerDisplay.tsx` alone — stacked box, shortened labels, bigger text. **Done, verified directly**: labels shortened to "F:"/"S:", width reduced from `w-12` to `w-4` to match the shorter labels, both bumped to `text-sm` from `text-[10px]`; pip logic/colors/characters and the outer box styling preserved exactly unchanged. Batch 5B (11 files/26 tests) matches baseline.
4. `CombatantCompactResourceRow.tsx` alone — convert to inline clickable pips (still rendered as its own separate row for now, isolating the interaction-model change from the layout merge). **Done, verified directly**: old `-`/`+` buttons replaced with interactive `PipTracker` (`size="compact"`, correctly wired to `spendResourcePip`/`recoverResourcePip` based on the direction of `onChange`'s new value), `isSyncing` handled via `readOnly={isSyncing}` since `PipTracker` has no native `disabled` prop, label truncation shortened to 6 characters and bumped to `text-sm`. Batch 5A (7 files/45 tests) and Batch 5B (11 files/26 tests) both match baseline.
5. `CombatantCardHeader.tsx` integration — the actual 2-row restructuring, wiring in spell-stat computation (now that Stage 1 confirmed where the data actually needs to come from), merging Stage 4's resource-pip output into Row 2, and removing `CombatantCard.tsx`'s now-redundant separate `SpellcastingStatsRow` render. By this stage every piece already exists independently — this stage should be close to pure wiring, not simultaneous design-and-code. Not yet started.

**Separately deferred, not yet started**: `PlayerView.tsx` further UI improvements for readability at 10-15 feet — raised in the same original request as this header redesign, but not yet scoped or discussed beyond the initial ask. Track as its own follow-up once this header work is complete.

### 🔵 Architecture / Technical Debt

**Remaining Technical Debt:** None.