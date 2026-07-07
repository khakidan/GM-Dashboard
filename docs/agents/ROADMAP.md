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

## Second Round of Shared UI Component Consolidation — remaining candidates (not yet built)

**`Badge` and `ToggleBadge` are both complete** — see `CHANGELOG.md` for the full write-ups. What follows is everything else confirmed during this round's audit that hasn't been designed or built yet.

1. **A pip-tracker pattern, found during the `ToggleBadge` verification pass — a genuinely different component, not the same thing as `ToggleBadge`.** A row of small, identical, undecorated dots (no text, no icon) representing "N of M remaining," click-to-set-index. Two confirmed instances: the Legendary Actions/Resistances dots (`CombatantCompactIndicators.tsx`, built during the Active Encounter combatant row redesign — see `CHANGELOG.md`) and a twin already existing in `ResourcePoolsSection.tsx` for Ki-Points-style resource pools. Explicitly deferred, per decision, until after `ToggleBadge` — that's now done, so this is next in line if you want it.

2. **Accordion/collapsible toggle header** — 7 confirmed instances (`EncounterLogModal.tsx`'s log-entry trigger and round-expansion header, `NpcReferencePanel.tsx`'s Stat Block toggle, `StatBlockSkills.tsx`, `ShortRestDialog.tsx`'s rest-card header, `CharacterCardHeader.tsx`/`NpcCardHeader.tsx`'s card expand, `DiceRoller.tsx`), genuinely inconsistent — some use `ChevronDown`/`ChevronRight` lucide icons, `NpcReferencePanel.tsx` uses literal `▼`/`▶` text characters instead.
3. **`Callout`/`Notice`** (info/warning/error) — confirmed: warning boxes (`ShortRestDialog.tsx`, `Soundboard.tsx`, both using `bg-[#f9f8ff]`/amber-800 text/amber-200 border with an `AlertCircle` icon) and error banners (`EncountersTab.tsx`, `NpcLibraryTab.tsx`, `PartyTab.tsx`, all using `bg-red-50`/red-800 text/red-100 border). `STYLE_GUIDE.md`'s existing "Nested Panels and Callouts" entry doesn't define either of these — a real, confirmed documentation gap, not just a component gap.
4. **Tab navigation** — confirmed 4 genuinely different visual treatments across dialog/panel-level tabs: segmented/pill-style (`EncounterLogDetails.tsx`), underline-on-active (`NewPlayerDialog.tsx`, `NpcFormFields.tsx`), filled-background-on-active (`AddCombatantDialog.tsx`, which also uses the off-palette `#f5f0d5` tan color previously flagged as a parchment-theme leftover in the `Button` project), and a raised-folder-tab style (`AudioPanel.tsx`). `SidebarIcon.tsx`'s vertical primary-navigation styling is a different concept (app-level nav, not in-dialog tabs) and should not be forced into the same component.
5. **Search input** — only 2 confirmed instances (`NpcLibraryTab.tsx`, decorated with a leading `Search` icon; `AddCombatantDialog.tsx`, bare with no icon) — smaller in scope than the others, but a clean, low-risk win.
6. **`ResourcePoolsSection.tsx`'s "Reset: Short/Long Rest" chip — explicitly deferred, not decided.** Confirmed via direct read: no border, `rounded` (not `rounded-full`), a single flat neutral tint that never changes color regardless of reset type — a structurally weak match for `Badge`. It's purely informational (tells the GM/player when a resource pool replenishes; content driven by `getResetLabel(pool.reset)`), not interactive and never color-coded. Whether to normalize it into `Badge`'s shape or leave it alone is an open decision, not yet made — revisit once there's a clearer read on what it's actually meant to communicate.

**Investigated, but likely doesn't need a brand-new component**:
- `EncounterCard.tsx`'s delete button swaps `Trash2` for a spinning `Loader2` mid-delete — rather than a new component, this is probably better solved by adding an optional `loading` prop to the already-existing `Button.tsx`/`IconButton.tsx` (auto-swap to spinner, auto-disable), benefiting every existing destructive button too.

**Status**: `Badge` and `ToggleBadge` are both done (see `CHANGELOG.md`). Next: pick one of the remaining candidates above and run its own small, single-topic verification pass before designing — same discipline that's worked well for both components so far, not a repeat of the original large multi-part audit.