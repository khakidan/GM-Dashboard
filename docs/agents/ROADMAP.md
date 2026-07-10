# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

None currently open. Dead/Stable PC status labeling and display (Party Roster, Active Encounter, Player View, plus the underlying death-save persistence fix) is resolved — see `CHANGELOG.md`.

### 🟡 Features to Add

**Badge Optimization (Active Encounter tab)** — from Dan's badge audit: consolidate the current ad-hoc mechanical indicator badges (CON, SPD 0, SPD ½, HP ½, NO ACT, DISADV, ADVAN, CANCELLED, VULNERABLE, AUTO CRIT) around "how does this creature's turn/attacks differ from normal," rather than exposing underlying conditions directly. Dan has a proposed target badge set (adds NO REACT, HARD TO HIT, DEX DIS, SAVE DIS; see conversation for full mapping, sourced from open5e.com/conditions). Not scoped into a build prompt yet — deliberately deferred, not started.

**`PlayerView.tsx` further UI improvements for readability at 10-15 feet** — raised alongside the PC combatant card header redesign. Three specific D&D rules-accuracy bugs on this page were fixed previously (PC "Defeated" mislabeling, HP column hiding real HP, condition capitalization — see `CHANGELOG.md`) prior to the current Dead/Stable badge work above. Whether any further UI work is wanted on this page beyond the fixes above is still an open question — not yet confirmed either way.

### 🔵 Architecture / Technical Debt

**Remaining Technical Debt:** None.