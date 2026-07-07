# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

None currently open. (Five `NewPlayerDialog` resource pool bugs were resolved in an earlier session.)

### 🟡 Features to Add

None.

### 🔵 Architecture / Technical Debt

**Remaining Technical Debt:** None.

(Previously tracked here: unused `isActive`/`isSyncing`/`isSelectable`/`isSelected` declarations on `CombatantCardProps` — confirmed dead via codebase-wide search, removed from the interface and from `CombatantCard.test.tsx`'s `defaultProps`. Verified: TypeScript clean, Batch 5B 26/26, zero behavior change. See `CHANGELOG.md`.)

---

## Second Round of Shared UI Component Consolidation — Badge & Others (audit complete, design not yet started)

**Motivation**: while working on the Active Encounter combatant row redesign, several more instances of duplicated UI patterns were noticed in passing — the same "one shape, many colors/states" situation that motivated the original `Button`/`IconButton`/`StatTile` consolidation.

**A real fabrication incident occurred during this audit, worth recording.** The first audit response's Part A (badge color inventory) was substantially wrong when checked directly against the real `CombatantCardBadges.tsx` — it claimed colors like `bg-stone-100` (real: `bg-slate-100`), `bg-red-50` (real: `bg-pink-100`), `bg-purple-100` for `ADVAN` (real: `bg-green-100`), and `bg-stone-150`/`border-stone-250` for `CANCELLED` — the latter two aren't real Tailwind values at all (the default scale has no 150 or 250 stop). It also described the `VULN` badge as an unchanged text badge, when it had already been replaced with a dot during the combatant-row redesign earlier in this same project. Caught by direct file comparison, not assumption. A corrected redo was requested and delivered — verified this time via direct spot-checks against real files (`AddCombatantDialog.tsx`, `StatTile.tsx`, `NpcLibraryTab.tsx`) and confirmed accurate. Full incident recorded here since it's still directly relevant to how the remaining work in this section should be approached; it will move to `CHANGELOG.md` along with the rest of this section once the work concludes.

**Process lesson, going forward**: run smaller, single-topic verification passes before designing each individual component, rather than one large multi-part audit — a big multi-part prompt gives more surface area for a model to blend real findings with invented ones, and makes any one part harder to spot-check thoroughly. This mirrors the original `Button`/`StatTile` project's own lesson (the first audit under-scoped `tertiary`/`destructive` before a follow-up corrected course), but goes further: audit one category at a time, not all six at once.

**Verified findings, organized by candidate component**:

1. **`Badge`** (static display) — strongest, most evidenced candidate. Confirmed instances: 8 mechanical condition badges in `CombatantCardBadges.tsx` (`SPD 0`/`SPD ½` = `slate`, `HP ½` = `pink`, `NO ACT` = `orange`, `DISADV` = `yellow`, `ADVAN` = `green`, `CANCELLED` = `gray`, `AUTO CRIT` = `red` — all sharing one exact structural className, differing only by color), resource-reset-type badges (`ResourcePoolManager.tsx`), the encounter outcome badge (`EncounterLogModal.tsx`'s `getOutcomeBadgeClass`), and the character health-status badge (`CharacterCardHeader.tsx`). Also confirmed: the `CON` concentration badge (`CombatantCardHeader.tsx`) uses `rounded` instead of `rounded-full`, an isolated inconsistency against all its siblings.
2. **`ToggleBadge`** (or similar name — badges that are actually buttons underneath) — the Reaction toggle and recharge-ability pills (`CombatantCompactIndicators.tsx`/`CombatantCardHeader.tsx`) have real click behavior and distinct charged/spent visual states, a different prop shape from static `Badge`, mirroring why `Button`/`IconButton` split.
3. **Accordion/collapsible toggle header** — 7 confirmed instances (`EncounterLogModal.tsx`'s log-entry trigger and round-expansion header, `NpcReferencePanel.tsx`'s Stat Block toggle, `StatBlockSkills.tsx`, `ShortRestDialog.tsx`'s rest-card header, `CharacterCardHeader.tsx`/`NpcCardHeader.tsx`'s card expand, `DiceRoller.tsx`), genuinely inconsistent — some use `ChevronDown`/`ChevronRight` lucide icons, `NpcReferencePanel.tsx` uses literal `▼`/`▶` text characters instead.
4. **`Callout`/`Notice`** (info/warning/error) — confirmed: warning boxes (`ShortRestDialog.tsx`, `Soundboard.tsx`, both using `bg-[#f9f8ff]`/amber-800 text/amber-200 border with an `AlertCircle` icon) and error banners (`EncountersTab.tsx`, `NpcLibraryTab.tsx`, `PartyTab.tsx`, all using `bg-red-50`/red-800 text/red-100 border). `STYLE_GUIDE.md`'s existing "Nested Panels and Callouts" entry doesn't define either of these — a real, confirmed documentation gap, not just a component gap.
5. **Tab navigation** — confirmed 4 genuinely different visual treatments across dialog/panel-level tabs: segmented/pill-style (`EncounterLogDetails.tsx`), underline-on-active (`NewPlayerDialog.tsx`, `NpcFormFields.tsx`), filled-background-on-active (`AddCombatantDialog.tsx`, which also uses the off-palette `#f5f0d5` tan color previously flagged as a parchment-theme leftover in the `Button` project), and a raised-folder-tab style (`AudioPanel.tsx`). `SidebarIcon.tsx`'s vertical primary-navigation styling is a different concept (app-level nav, not in-dialog tabs) and should not be forced into the same component.
6. **Search input** — only 2 confirmed instances (`NpcLibraryTab.tsx`, decorated with a leading `Search` icon; `AddCombatantDialog.tsx`, bare with no icon) — smaller in scope than the others, but a clean, low-risk win.

**Investigated, but likely don't need brand-new components**:
- `EncounterCard.tsx`'s difficulty-picker `<select>` is arguably a `<select>` styled *as* a colored `Badge` (color varies by difficulty value) more than a generic `Select` component — needs untangling which pattern actually owns it before building either, rather than assuming a new `Select` component is the answer.
- `EncounterCard.tsx`'s delete button swaps `Trash2` for a spinning `Loader2` mid-delete — rather than a new component, this is probably better solved by adding an optional `loading` prop to the already-existing `Button.tsx`/`IconButton.tsx` (auto-swap to spinner, auto-disable), benefiting every existing destructive button too.

**Status**: audit complete and verified (after the fabrication correction). No components designed or built yet. Next: `Badge` — per explicit decision, this will get its own small, focused, single-topic verification pass (not a repeat of the large multi-part audit) before any design work starts.