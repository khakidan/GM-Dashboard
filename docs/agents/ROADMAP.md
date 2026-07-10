# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

**Dead/Stable PC status labeling and display — in progress across 4 files, sequenced.** Dan found via screenshots that "Unconscious"/"Defeated" badges were showing for PCs that should read "Stable" (3+ death save successes) or "Dead" (3+ death save fails), plus related clutter (stale conditions text, death-save pips, and full combat UI still showing for dead PCs). Work is split into 4 sequential prompts:

1. **`PlayerView.tsx` — diff applied, NOT yet test-verified.** Added a dedicated "Dead" badge (gray, Skull) instead of falling through to `getHealthStatus()`; made the death-save pip tracker visibility explicit (`!isPcDefeated && !c.isStable`) instead of string-matching on `conditions`; suppressed the italic conditions line for Dead/Stable PCs. Diff manually verified against the real file and confirmed correct. No test batch output has been provided for this change yet — needs a real run before it can be considered done.
2. **`CombatantCardHeader.tsx` — diff applied, test claim rejected, re-run requested.** Added "Dead" label (was "Defeated") for PCs at 3+ fails, Skull icon + grayed name to match the existing Stable treatment, and suppressed reaction toggle/resource row/compact indicators/condition badges for dead PCs. Diff manually verified against the real file and confirmed correct. AI Studio's first test batch report reused the exact baseline numbers from `testing-batches.md` for all 12 batches with no raw output — rejected as unverified, and AI Studio has been asked to re-run and paste raw terminal output. **Blocking: waiting on that raw output before this can move to CHANGELOG.md.**
3. **`useDeathSaves.ts` — not yet started.** Stop resetting `deathSavesFails`/`deathSavesSuccesses` to 0 when a PC stabilizes. Per Dan: only reset on heal, or when a stable PC takes new damage and must resume death saves (this second case — `applyDamageToUnconscious` re-zeroing when a stable PC takes damage — already works correctly and needs no change). This is a prerequisite for step 4.
4. **`CharacterCard.tsx` + `CharacterCardHeader.tsx` — not yet started, depends on step 3.** `CharacterCard.tsx`'s `healthStatus` computation currently has no "Stable" branch at all (only Dead/Unconscious) — it can't detect Stable today because `deathSavesSuccesses` gets zeroed on stabilize. Once step 3 lands, add a Stable branch reading `deathSavesSuccesses >= 3`. `CharacterCardHeader.tsx` renders two redundant "Unconscious" indicators on the Party Roster: a raw, unfiltered echo of the `conditions` string (verbatim pink pill — not needed, pure duplication) and the actual `healthStatus`-driven badge (needs the Stable case added; already correctly hides for Dead). Also note: `characterName` here is an editable `DebouncedInput`, not a plain span, so adding a Dead/Stable icon next to the name is more structural than the equivalent change in `CombatantCardHeader.tsx`.

### 🟡 Features to Add

**Badge Optimization (Active Encounter tab)** — from Dan's badge audit: consolidate the current ad-hoc mechanical indicator badges (CON, SPD 0, SPD ½, HP ½, NO ACT, DISADV, ADVAN, CANCELLED, VULNERABLE, AUTO CRIT) around "how does this creature's turn/attacks differ from normal," rather than exposing underlying conditions directly. Dan has a proposed target badge set (adds NO REACT, HARD TO HIT, DEX DIS, SAVE DIS; see conversation for full mapping, sourced from open5e.com/conditions). Not scoped into a build prompt yet — deliberately deferred, not started.

**`PlayerView.tsx` further UI improvements for readability at 10-15 feet** — raised alongside the PC combatant card header redesign. Three specific D&D rules-accuracy bugs on this page were fixed previously (PC "Defeated" mislabeling, HP column hiding real HP, condition capitalization — see `CHANGELOG.md`) prior to the current Dead/Stable badge work above. Whether any further UI work is wanted on this page beyond the fixes above is still an open question — not yet confirmed either way.

### 🔵 Architecture / Technical Debt

**Remaining Technical Debt:** None.