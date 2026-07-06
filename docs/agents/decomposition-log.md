# Decomposition Log & Technical Debt

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks completed refactor/decomposition write-ups (kept as documentation of what was built and why), in-progress or scoped-but-not-started plans, and remaining technical debt.

Per root AGENTS.md rule 12: completed decomposition/refactor **plans** get removed entirely once done, not archived — but the write-up documenting what was actually built stays. If the technical debt list is empty, it should say "None."

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

None currently open. (Five `NewPlayerDialog` resource pool bugs were resolved in an earlier session.)

### 🟡 Features to Add

None.

### 🔵 Architecture / Technical Debt

**Remaining Technical Debt:** None.

(Previously tracked here: unused `isActive`/`isSyncing`/`isSelectable`/`isSelected` declarations on `CombatantCardProps` — confirmed dead via codebase-wide search, removed from the interface and from `CombatantCard.test.tsx`'s `defaultProps`. Verified: TypeScript clean, Batch 5B 26/26, zero behavior change.)

---

## Codebase Modularity Audit — Status: Substantively Complete

All four sequential passes (components, lib, services, hooks) are complete, with claims backed by verified raw command output except for one low-stakes, purely informational item noted below.

**Completed:**
- `components/` pass — FULLY complete (including follow-up IRV/StatBlock review). Findings: `IrvSection` consolidation (see below), modal shell duplication (see Modal/Dialog Shell Consolidation below), `getResourcePoolSuggestions` investigated and confirmed as a false alarm (one real implementation in `lib/resourcePoolScaling.ts`, two legitimate consumer hooks, not duplicated).
- `lib/` audit pass — done. Findings: 21 files, zero layer violations, zero exported name collisions, no duplicated parsing/serialization logic, no duplicated constant/lookup tables. No consolidation or cleanup needed in lib/.
- `services/` audit pass — done. Findings: 10 files, zero upward layer violations, spreadsheet ID resolution correctly centralized in sheetsService.ts, no raw fetch() calls outside sheetsService.ts/googleAuth.ts. One naming collision found and RESOLVED — `queueWrite` renamed to `queueWriteResolved` in `src/services/dbOperations/shared.ts`, call sites updated in npcs.ts and characters.ts. Verified: TypeScript clean, services batch 34/34 passing.
- `hooks/` audit pass — PARTIALLY verified. Confirmed finding RESOLVED: `useLevelUpAutomation.ts` previously imported the `PoolEdit` type from a component file — fixed by moving `PoolEdit` to `src/types.ts` (verified: TypeScript clean, LevelUpDialog.test.tsx 17/17 passing). 36 total hook files confirmed via raw `find`/`wc -l` output. Zero exported name collisions across `src/hooks` and `src/components` hook files (verified via grep). One low-stakes, unverified item: an earlier claim about which hooks lack React APIs internally was stated inconsistently across two responses and remains unverified — re-check independently if it becomes relevant.
- All 18 files using `IrvMultiSelect`/`StatBlock` reviewed. Confirmed duplication: `CharacterIRVSection.tsx`/`NpcIRVSection.tsx` (see `IrvSection Consolidation` below). The `StatBlock` family, `NpcStatBlockSection.tsx`, `IrvMultiSelect.tsx`, `CombatantCardExpanded.tsx`, and `NpcReferencePanel.tsx` are all healthy, legitimate shared-component reuse — no action needed. `NpcCard.tsx` and `CharacterCardExpanded.tsx` share a visually similar "stats grid" layout but were confirmed (via complete side-by-side code comparison) to have real semantic divergence — not a consolidation candidate.
- 12 components with direct `useAppState()`/`useDashboardStore()` access — fully evaluated against real source code. 7 are legitimate top-level coordinators needing broad state access (see "Store-access architecture" in patterns.md) — no action needed. All 5 narrow/leaf components identified have been resolved — see **Narrow Store-Access Components — Store-Access Fix (Completed)** below. This audit/finding is fully complete.

---

## IrvSection Consolidation (Completed)

- **Confirmed duplication**: `src/components/PartyTab/CharacterIRVSection.tsx` and `src/components/NpcLibraryTab/NpcIRVSection.tsx` were structurally and behaviorally identical — same props, same `IrvMultiSelect` usage pattern, same null-safety handling. They differed only in cosmetic presentation values (grid gap, labels, placeholders).
- **Component Built**: `src/components/ui/IrvSection.tsx` was created, accepting `resistances`/`immunities`/`vulnerabilities`/`onUpdate` plus explicit `labels`, `placeholders`, and `gap?: string` (defaulting to `gap-4`) — no baked-in defaults for labels/placeholders since there are only a small number of real call sites. TypeScript verified clean.
- **Adoption Phase 1**: `CombatTab.tsx` and `NpcCombatTab.tsx` migrated. Required one design addition beyond the original spec: `IrvSection.tsx` gained an optional `compact?: boolean` prop, since `CombatTab.tsx` requires it. A real visual regression was caught and fixed during migration — `CombatTab.tsx` originally relied on `IrvMultiSelect`'s ES6 default parameter fallback text ('Search and add...'), but the migrated code initially passed explicit empty strings, which suppress ES6 defaults (they only trigger on `undefined`, not empty string). Fixed by passing the actual default text explicitly. Verified: PartyTab batch 46/46, NpcLibraryTab batch 13/13.
- **Final Adoption**: `CharacterCardExpanded.tsx` and `NpcCard.tsx` migrated, preserving their original hardcoded labels/placeholders/gap values exactly. `CharacterIRVSection.tsx` and `NpcIRVSection.tsx` deleted entirely — confirmed via direct file-not-found check and a zero-result grep for remaining references. Full 12-batch verification: 692/692 passing, TypeScript clean. All 4 adoption sites now use the single shared `IrvSection.tsx`.

---

## Modal/Dialog Shell Consolidation (Completed)

**Confirmed scope**: 12 files used a near-identical backdrop/panel modal shell pattern: `CasterAttributionDialog.tsx`, `NewEncounterDialog.tsx`, `LongRestDialog.tsx`, `ShortRestDialog.tsx`, `NewNpcDialog.tsx`, `NewPlayerDialog.tsx`, `AddCombatantDialog.tsx` (renamed from `CombatSidebar.tsx` — it isn't a sidebar; it's a centered modal for adding an existing NPC, existing party member, or newly-created NPC to the active encounter), `ShortcutCheatSheet.tsx`, `EncounterLogModal.tsx`, `ReferenceDetailDialog.tsx`, and the assignment-modal portion of `Soundboard.tsx`.

**Excluded from consolidation**: `GMDashboardDialogs.tsx` (a controller component rendering other dialogs, not a shell itself), `SyncingOverlay.tsx` (a persistent full-screen blocking overlay, not a dismissible modal), `CommandPalette.tsx` (structurally different dismiss pattern, top-anchored, no animation, `cmdk`-driven content — does not fit the shared shell design), and `Soundboard.tsx`'s right-click context menu (a small floating popup with no backdrop, positioned at arbitrary cursor coordinates — does not fit the centered backdrop/panel model at all).

**Component Built**: `src/components/ui/DialogShell.tsx` — backdrop+panel as two `motion.div` elements, `bg-[#0f172a]/60` backdrop, `shadow-2xl`, optional title/icon/footer slots, `dismissOnBackdropClick` prop defaulting to `true`.

`DialogShell.tsx` gained three additional props during migration, each added only when a real per-dialog conflict required it (not speculatively):
- `subtitle?: string` — a second line under the title (added for `LongRestDialog.tsx`/`ShortRestDialog.tsx`).
- `zIndex?: string` — defaults to `'z-50'`; overridable per dialog since several original files intentionally use higher stacking values (100/110/120/180) to layer above other combat UI. Passed as a full Tailwind class string (e.g. `"z-[110]"`), not a raw number, since Tailwind's JIT scanner needs the literal class string present in source.
- `subheader?: React.ReactNode` — a full-bleed slot rendered between the header and the body, unwrapped and unpadded. Added for `NewPlayerDialog.tsx`'s tab navigation bar and reused for `AddCombatantDialog.tsx`'s three-tab navigation bar.

**All 12 migrations complete**, each verified independently via TypeScript build check plus its relevant test batch before moving to the next: `LongRestDialog.tsx`, `CasterAttributionDialog.tsx`, `ShortRestDialog.tsx`, `NewEncounterDialog.tsx`, `NewNpcDialog.tsx`, `ShortcutCheatSheet.tsx`, `ReferenceDetailDialog.tsx`, `EncounterLogModal.tsx`, `NewPlayerDialog.tsx`, `LevelUpDialog.tsx`, `AddCombatantDialog.tsx`, `Soundboard.tsx`.

Notable patterns established during migration:
- Dialogs whose primary action button is `type="submit"` inside a native `<form>` cannot use the `footer` prop directly, since `footer` renders as a DOM sibling outside `children` — this would break native form submission (including Enter-to-submit). Two approaches were used: (1) keep the entire `<form>`, including its button row, inside `children` as one block (`NewEncounterDialog.tsx`, `NewNpcDialog.tsx`, `AddCombatantDialog.tsx`'s create-NPC tab, `Soundboard.tsx`'s assignment form); or (2) split the visual footer into the real `footer` prop while keeping the submit button correctly associated via the HTML `form="id"` attribute, letting the form live in `children` and the button live in `footer` as DOM siblings (`NewPlayerDialog.tsx` — necessary there because the footer also contains non-submit Previous/Next navigation buttons that needed to stay visually and structurally with the submit button).
- `EncounterLogModal.tsx`, `ReferenceDetailDialog.tsx`, and `Soundboard.tsx`'s assignment modal each originally used a header style that didn't match `DialogShell`'s standard navy/serif look (blue header for the first two; no colored header band at all for `Soundboard.tsx`) — an explicit decision was made to normalize all of them to `DialogShell`'s standard header rather than preserve the distinction.
- Dialogs with `if (!isOpen) return null;` (or equivalent) guards need this checked carefully before removal — safe to remove only when nothing in the component destructures from a value that could be null/undefined when closed. `ReferenceDetailDialog.tsx` needed to keep its guard (destructures `reference.data`, and `reference` can be `null`). `EncounterLogModal.tsx` and `LevelUpDialog.tsx` were confirmed safe to remove theirs. `Soundboard.tsx`'s assignment modal keeps its outer `{assigningSlot !== null && (...)}` gate permanently — its title expression (`` `Configure Slot #${assigningSlot + 1}` ``) is only safe to evaluate under that gate, since `DialogShell`'s props are evaluated eagerly regardless of its own `isOpen` value.
- `AddCombatantDialog.tsx` has no shared footer bar at all — each of its three tabs has its own inline action button within its own tab content; this was kept exactly as-is rather than restructured into a unified footer.

**Known pre-existing gap, not addressed by this consolidation**: `AddCombatantDialog.tsx` uses `bg-[#f5f0d5]` for its inactive-tab and selected-list-item styling — an off-palette color not matched anywhere else in the codebase, left untouched as out of scope for this task.

---

## Shared UI Component Consolidation — Buttons, StatTile & Prominent Input (audit complete, design finalized, build not started)

**Motivation**: same rationale as the completed `DialogShell` consolidation above — several UI patterns are duplicated across many files with slightly-drifting styling. A single future style change should propagate site-wide instead of requiring a per-file hunt.

**Audit findings (raw grep across the codebase, read-only, no files touched)**:

- **Buttons** — 64 files use `<button>` (1–14 occurrences each). Primary buttons cleanly split into two sizes: small (`px-4 py-2`) and large (`px-6 py-3`/`py-3.5`, often `flex-1`), both sharing identical color/type treatment. One inconsistency found: `NewNpcDialog.tsx`'s primary button has no `disabled:` styling at all, unlike every other primary button — the shared component will fix this by construction. Secondary/Cancel buttons had a real split (bordered-transparent for small, solid-gray for large) — **resolved: one unified solid-gray look for both sizes**. The solid-gray variant's hover color (`hover:bg-[#d4cfc1]`, a warm tan) is inconsistent with the rest of the blue-accent palette — almost certainly a leftover from the pre-"Minimalist Sleek" parchment theme — **to be replaced with a cool-gray hover** (proposed: `hover:bg-[#cbd5e1]`, adjustable once seen rendered). Destructive buttons are fragmented across at least 4 different shapes (`rounded-xl`/`rounded-full`/`rounded-lg`, `flex-1`/`w-full`, varying padding) — real consolidation candidate. Icon-only buttons: the audit's grep for this was too narrow (only matched `DialogShell`'s own close button) — proceeding without a further audit round, designing the icon-only variant from known examples already gathered during the `DialogShell` migration work instead.

**Component architecture decision, resolved**: **two components, not one, not four.** `Button.tsx` will house `primary`, `secondary`, and (eventually) `destructive` as values on a single `intent` prop — these three are structurally identical (text content, optional leading icon, same padding/shape/font treatment) and differ only in color, which is exactly what a variant prop is for; this also matches the established pattern from `DialogShell`/`DebouncedInput` (one component, configuring props) rather than introducing a different convention just for buttons. Icon-only buttons get their **own separate `IconButton.tsx` component**, not a fourth `intent` value — icon-only buttons have a materially different prop shape (no text `children`, a mandatory `aria-label` since there's no visible text for screen readers, square-aspect sizing driven by the icon rather than padding around text), not just a different color, so folding it into `Button`'s prop surface would mean a pile of conditionally-relevant props that only apply to one variant.

- **StatTile** — confirmed as a real, distinct component via two user-provided screenshots (character card and NPC card summary rows: `AC`/`MAX HP`/`HP`/`TEMP`/`LEVEL` or `CR`, plus a second row of ability score tiles matching `StatBlockScores.tsx`). Same visual container (`bg-[#f9f8ff]/80 p-3 rounded-xl border border-[#e2e8f0] text-center`, small uppercase label above a bold value) is used in two distinct contexts: **read-only** (character/NPC library card summaries) and **editable** (the `Temp HP`/`Max HP` tiles in `CombatantCardExpanded.tsx`, which contain a real `<input type="number">` as the value). Design requirement: the component's "value" slot must support both a static value and an editable input. **Additional requirement, found via the ability-score screenshot**: the `STR`/`DEX`/`CON`/etc. tiles have a third line — a modifier (`+4`, `+2`, `0`, `-1`) below the main value, in a smaller font, color-coded (red for negative, blue for positive, gray for zero). This is a genuine third slot (label + value + modifier), not just label + value — needs its own explicit design when the component is built, not an afterthought.

- **Prominent input** — a second, un-componentized input style exists alongside the already-shared `DebouncedInput.tsx`/`DebouncedTextarea.tsx` (which implement the "compact" style: `py-2` padding, `focus:ring-[#2563eb]/50`). The "prominent" style (`py-3` padding, full-opacity `focus:ring-[#2563eb]`) is duplicated raw in `NewEncounterDialog.tsx`, `NpcCard.tsx`, and `NpcLibraryTab.tsx`.

**Design decision on the prominent input, reached through discussion, not assumption**: `DebouncedInput.tsx` doesn't just style an input — it also changes *behavior*: local buffered state, with the parent's `onChange` firing only on blur or Enter, not on every keystroke (this is not time-based debounce; it's a simple commit-on-blur/Enter pattern). The audit's "prominent" fields currently fire `onChange` immediately on every keystroke. Naively extending `DebouncedInput.tsx` with just a size prop would silently impose commit-on-blur/Enter behavior onto fields that don't currently have it — a real behavior change disguised as a styling refactor.

Resolved approach: **extend `DebouncedInput.tsx`** (not build a separate component) with two independent additions:
- `size?: 'compact' | 'prominent'` — governs padding/focus-ring-opacity only, defaulting to the current `'compact'` look (zero behavior change for existing consumers).
- `immediate?: boolean` (default `false`) — when `true`, fires `onChange` on every keystroke instead of on blur/Enter. Needed specifically for `NpcLibraryTab.tsx`'s search box, which was one of the three "prominent"-style fields found in the audit — a search box needs filter-as-you-type, and routing it through commit-on-blur/Enter would be a real, user-visible regression (type a search term, see nothing happen until blur/Enter). Confirmed with the user directly: they're fine with commit-on-blur/Enter for genuine data-entry fields (the value doesn't reach the spreadsheet until blur/Enter either way, which was already the existing behavior for every current `DebouncedInput` consumer) — the concern was specifically about search-like fields, not data-entry fields in general.
`DebouncedTextarea.tsx` is not part of this change — no "prominent" textarea usage was found in the audit.

**Other audit findings, lower priority**:
- Section headers (`text-xs font-bold uppercase tracking-widest border-b border-[#e2e8f0] pb-1 mb-2`) — 6 confirmed occurrences across `ShortRestDialog.tsx`, `LevelUpDialog.tsx`, `LevelUpResourcePools.tsx`, `LevelUpChecklist.tsx`, `NpcStatBlockSection.tsx`, `ReferenceDetailDialog.tsx`. Good consolidation candidate, not yet built.
- Empty-state displays (centered italic gray text, sometimes with an icon) — 5 occurrences found. Single className string; likely not worth a full component versus just a documented convention. Not currently planned for componentization.

**Still-open questions (not yet decided — do not assume an answer)**:
- Adoption scope for `Button`: the audit found `<button>` in 64 files. Not yet decided whether to migrate all of them, a prioritized subset, or build-only for now and adopt opportunistically (touch-it-when-already-in-that-file, the same pattern used for parts of the `DialogShell` work).
- Adoption scope for `StatTile`: same question — build-only vs. migrate all confirmed instances now (`CombatantCardExpanded.tsx`, character/NPC library card summary rows, `StatBlockScores.tsx`).
- Adoption scope for the `DebouncedInput.tsx` extension: whether to adopt it in the 3 identified "prominent" locations as part of the same task, or build-only and adopt later.
- Whether Section headers are worth their own component at all (leaning toward yes, not yet confirmed).

**Status**: audit complete, all major design decisions finalized through discussion; adoption-scope questions above remain open. `DebouncedInput.tsx` extension is **complete and verified** — `size?: 'compact' | 'prominent'` and `immediate?: boolean` props added, default behavior confirmed byte-identical to the pre-change component via direct string comparison, `DebouncedTextarea.tsx` untouched, no adoption yet at any of the 3 identified "prominent" call sites (still an open question above). `Button.tsx` now supports `intent: 'primary' | 'secondary'`, `size: 'large' | 'small'` (default `'small'`), and a **universal press animation** (`motion-safe:active:scale-95` + `disabled:active:scale-100`, requiring `transition-colors` → `transition-all` so the transform actually animates instead of snapping) — this was deliberately made a global, permanent part of the component rather than a per-consumer `className` passthrough, since the goal of this whole consolidation is eliminating exactly this kind of "looks different for no reason" drift. Adopted and verified in five real locations: `LongRestDialog.tsx`, `ShortRestDialog.tsx`, `LevelUpDialog.tsx` (small), `NewEncounterDialog.tsx`, `NewNpcDialog.tsx` (large). **Real bug found and fixed during `NewNpcDialog.tsx`'s adoption**: its primary button had a dead `disabled:opacity-50` CSS class that could never trigger (no `disabled` attribute was ever actually set), despite `handleSubmit` having the same name-required guard clause as `NewEncounterDialog.tsx` — meaning a GM submitting with an empty name got zero visual feedback of any kind. Fixed by exposing `isFormValid` and wiring `disabled={!isFormValid}`, matching `NewEncounterDialog.tsx`'s already-correct pattern. Confirmed via Batch 6C that no existing test broke under the new disabled behavior. `destructive` intent and `IconButton.tsx` remain future work — not yet started. `StatTile` not yet started. Planned next: `NewPlayerDialog.tsx` (large-size, uses the `form="id"` attribute technique — needs verification `Button` forwards `form` correctly), then `EncounterLogDetails.tsx`'s near-miss secondary button, then `destructive` intent, then `IconButton.tsx`, then `StatTile`.

---

## useParty.ts Pure-Function Extraction (Completed)

**Starting state**: 625 lines, the largest hook in the codebase. Handles character CRUD (create, update, delete), long/short rest, and level-up confirmation for the Party tab.

**Architectural note**: unlike `useCombatSync.ts`, this was not a "split into multiple hooks" situation — `state`/`updateState` and the local `useState` calls are legitimately shared across all handlers and stay together in one hook. The work here was extracting pure helper functions to eliminate internal duplication, which is lower-risk than a multi-hook split since no state-sharing or closure concerns are involved.

**Confirmed duplication and extractions, done one at a time with independent verification between each**:

1. **`calculateLongRestUpdates(character: Character): Partial<Character>`** — `handleLongRest` computed its core per-character update logic (hit dice recovery via `applyLongRestHitDiceRecovery`, resource pool reset via `resetResourcesOnLongRest`, exhaustion condition handling via `applyLongRestToConditions`) twice within the same function — once for the optimistic UI update, once nearly verbatim for the DB write payload. Extracted to a single pure function, called once per character, reused for both. Module-level, placed above `useParty()`.

2. **`calculateShortRestUpdates(character: Character, hpToAdd: number, newHitDiceUsed: string): Partial<Character>`** — identical duplication pattern in `handleShortRest` (computed `newHp` and the resource-pool reset once for the optimistic update, then recomputed for the DB payload). Same extraction pattern applied.

3. **`withDefaultCombatState(prevCombatState: AppState['combatState'] | undefined, updatedCombatants: Combatant[])`** — the `combatState` fallback-defaults boilerplate (`activeEncounterId`/`activeTurnId`/`round` `?? ` fallbacks) was repeated verbatim in all 4 functions that touch `combatState` (`handleLevelUpConfirm`, `handleLongRest`, `handleShortRest`, `handleUpdate`). Extracted to a single helper, all 4 call sites updated. Type was independently verified against the real `AppState`/`CombatState` definitions rather than assumed (this hook consumes `AppState` via `useAppState()`, not `DashboardStore` directly).

4. **`mirrorCharacterFieldsToCombatants(combatants: Combatant[], characterId: string, updates: Partial<Character>): Combatant[]`** — the highest-risk extraction, because the "mirror character updates into `combatState.combatants`" logic was **not** identical across all 4 call sites:
   - `handleLevelUpConfirm` and `handleUpdate` mirror a broad field set (`ac`, `maxHp`, `tempHpMax`, `conditions`, `currentHp`, `tempHp`, `characterName→name`, `notes`, `passivePerception`, and `handleUpdate` alone also maps `tempAc→tempAcModifier`) from the *raw update delta* passed into the handler.
   - `handleLongRest` and `handleShortRest` mirror a narrower field set (`currentHp`, `tempHp`, `maxHp`, `conditions`) from the *already-computed post-update character object*, not the delta — and `handleLongRest` additionally performs an **unconditional** `conditionTimers: {}` reset regardless of what's in the update.

   Given this divergence, the generic helper (driven entirely by which fields are defined in the `updates` parameter) was applied **only** to `handleLevelUpConfirm` and `handleUpdate`, which fit the pattern cleanly. `handleLongRest` and `handleShortRest` were deliberately left untouched, preserving their specific data source (post-update object, not delta) and the unconditional `conditionTimers` reset — forcing them into the generic helper would have required either changing what data they read from or dropping that reset, both of which would be real gameplay behavior changes.

**Verification**: All four extractions were done one at a time, each independently verified via TypeScript build check and the relevant test batch (Batch 6A for PartyTab, Batch 5B for ActiveEncounterTab, since combatants are shared state touched by both tabs) before moving to the next. Final state: TypeScript baseline confirmed at 43 pre-existing errors (unrelated to this work, spanning `dashboardStore.test.ts`, `useEncounterLifecycle.test.ts`, `dbOperations.test.ts`, `useCombatSync.test.ts`, and others — verified via a genuine before/after revert comparison, not assumed), Batch 6A 46/46, Batch 5B 26/26. No test count or behavior change; `useParty.ts` now sits at 592 lines.

---

## GlobalActionContextPanel.tsx Store-Access Fix (Completed)

- **Completed & Verified**: `GlobalActionContextPanel.tsx` was refactored to accept all of its required store state and action handlers as props (`combatStarted`, `actionContext`, `combatants`, `activeTurnId`, `setActionContext`) instead of importing and calling `useDashboardStore()` internally.
- **Parent Integration**: `ActiveEncounterTab/index.tsx` imports `useDashboardStore` directly from `../../hooks/dashboardStore` to obtain `combatState` and `setActionContext`, threading these down as props.
- **Process & Test Safety**: An initial design imported `useDashboardStore` from `../../hooks/useAppState` (via its re-export), which compiled but caused `index.test.tsx` and `AddNpcCollision.test.tsx` to fail because those suites mock `useAppState` without mocking `useDashboardStore` on that module. Corrected by importing directly from `../../hooks/dashboardStore`.
- **Verification**: TypeScript clean, ActiveEncounterTab test suite batch 26/26.

---

## Narrow Store-Access Components — Store-Access Fix (Completed)

- **Completed & Verified**: All remaining narrow store-access components (`EncounterCard.tsx`, `CombatantCard.tsx`, `CombatantCardExpanded.tsx`, `CombatantCompactResourceRow.tsx`) were fully refactored to remove direct store-access/snapshot calls, converting them into pure, prop-driven components.
- **EncounterCard.tsx**: Now receives `encounterCombatants` and `difficulties` as props; parent (`EncountersTab.tsx`) passes these down. The unused `updateState` destructure was also removed.
- **CombatantCard.tsx**: Now receives `combatStarted` as a prop; parent (`ActiveEncounterTab/index.tsx`) resolves this from `combatState`.
- **CombatantCardExpanded.tsx & CombatantCompactResourceRow.tsx**: Removed direct `useAppState()`/`getSnapshot()` calls, converted to pure prop-driven subtrees.
- **Consolidated Derivation**: The `pcCharacter`/`npcModel` derivation (previously duplicated inside `CombatantCardExpanded.tsx`) was moved to a single point of resolution in `ActiveEncounterTab/index.tsx`'s `.map()` loop, then threaded down: to `CombatantCardExpanded.tsx` directly via `CombatantCard.tsx`, and to `CombatantCompactResourceRow.tsx` via `CombatantCard.tsx` → `CombatantCardHeader.tsx` (which passes through a single resolved `pcCharacter` as its `character` prop — `CombatantCardHeader.tsx` has no other use for it).
- **Verification**: TypeScript clean, Batch 5B 26/26, Batch 6B 20/20. All 5 originally-identified narrow store-access components resolved; this audit/finding is fully complete.

---

## dbOperations.test.ts Split (Completed)

`src/services/__tests__/dbOperations.test.ts` (24 tests) mirrored the old pre-decomposition single-file structure rather than the `src/services/dbOperations/` module layout. Split into 5 module-specific files under `src/services/__tests__/`, matching the actual `dbOperations/` folder structure:

- `shared.test.ts` — 2 tests (`SHEET_RANGES` alignment against `NpcRowSchema`/`CharacterRowSchema`)
- `npcs.test.ts` — 11 tests (`addNpcDB`, `updateNpcFullDB`, `deleteNpcDB`, `resetNpcHpDB`, spellcastingAbility dual-write)
- `characters.test.ts` — 6 tests (`updateCharacterDB`, `addCharacterDB`)
- `encounters.test.ts` — 3 tests (`deleteEncounterFully` cascade delete)
- `encounterLogs.test.ts` — 2 tests (`deleteEncounterLog`)

Total: 2+11+6+3+2 = 24 tests, all migrated verbatim (same assertions, same mock setups, same test data) — no test logic changed, purely organizational. No `encounterCombatants.test.ts` was created: the original file had zero coverage for `encounterCombatants.ts` specifically (it was only exercised indirectly inside the `deleteEncounterFully` cascade test), so creating an empty file was avoided rather than papering over the gap. This is a pre-existing coverage gap, not something this task introduced or fixed.

Original `dbOperations.test.ts` deleted. Verified: TypeScript clean (exit code 0), Batch 2 34/34 passing (unchanged from baseline — Batch 2 auto-picks up any file under `src/services/__tests__/`, no batch command changes needed).