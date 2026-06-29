---

# GM Dashboard — Style Guide

This file is the authoritative style
reference for all UI work on this project.
When building or modifying any component,
consult this guide first. Never introduce
new color values, spacing patterns, or
component styles that are not defined here.

---

## Design Philosophy

The GM Dashboard uses the Minimalist
Sleek visual style — clean white surfaces,
indigo-blue structure, and precise
typographic hierarchy. This creates a
modern, distraction-free interface
optimized for readability during sessions.

The app is permanently locked to this
style. There is no theme switcher and
no alternative visual styles.

**Two rules above all others:**
1. Every piece of text must have
   sufficient contrast against its
   background. Minimum 4.5:1 for body
   text, 3:1 for large/bold text
   (WCAG AA).
2. When in doubt, go lighter and use
   more whitespace. Clutter costs the
   GM attention during play.

---

## Approved Color Palette

These are the ONLY color values permitted
in this application. Do not introduce
any hex value not listed here without
updating this file first.

### Primary Colors

| Token | Hex | Usage |
|-------|-----|-------|
| White | `#ffffff` | Main backgrounds, card surfaces, input fills — dominant color |
| Blue Primary | `#2563eb` | Sidebar background, primary buttons, active indicators |
| Blue 2 | `#567eff` | Hover states, sidebar borders, lighter blue accents |
| Blue 3 | `#7b99ff` | Subtle blue tints, secondary indicators |
| Blue 4 | `#9eb6ff` | Borders on blue backgrounds |
| Blue 5 | `#c0d4ff` | Sidebar icon default color, disabled states, very light blue |

### Discreet Palette (use sparingly)

| Token | Hex | Usage |
|-------|-----|-------|
| Purple | `#8d8db9` | Secondary labels, muted text, placeholder text |
| Off-white | `#f9f8ff` | Subtle card backgrounds, nested sections |
| Yellow | `#eee8a9` | Warnings only — use very sparingly |

### Semantic Colors (keep as-is)

| Token | Usage |
|-------|-------|
| `text-red-600` | Error text, destructive actions |
| `bg-red-50 / border-red-100` | Destructive button backgrounds |
| `bg-green-50 / text-green-700` | Positive status indicators |
| `bg-amber-*` | Do not use — not in palette |

### Contrast Ratios (on White #ffffff)

| Color | Ratio | Grade | Use for |
|-------|-------|-------|---------|
| Blue Primary `#2563eb` | 5.9:1 | AA | Buttons, icons, active text |
| Purple `#8d8db9` | 3.4:1 | AA Large | Labels at 18px+ bold only |
| Blue 5 `#c0d4ff` | 1.4:1 | Fail | Icons on blue bg only — never text on white |

> **Rule:** Never use `#c0d4ff` or
> `#8d8db9` for body text on white
> backgrounds — contrast is insufficient.
> Use them only for icons, placeholders,
> or large bold labels.

---

## Layout
App root:     bg-white font-sans

Sidebar:      bg-[#2563eb]

border-r border-[#567eff]

Main content: bg-white

The sidebar uses the primary blue
(`#2563eb`) to create strong visual
anchoring and separation from the white
content area. This follows the pattern
of modern productivity tools (Slack,
Linear, Notion).

---

## Cards

All content cards (character cards, NPC
cards, combatant cards) share this pattern:
Background:  bg-white

Border:      border border-[#f9f8ff]

or border-[#e2e8f0]

Radius:      rounded-2xl

Shadow:      shadow-sm (optional)

---

## Modal Dialogs

### Backdrop
bg-[#0f172a]/60 backdrop-blur-sm

### Panel
Background:  bg-white

Border:      border border-[#e2e8f0]

Radius:      rounded-2xl

Max width:   max-w-2xl (standard)

max-w-lg (simple confirmation)

### Header Bar
Background:  bg-[#2563eb]

Text:        text-white font-bold

Radius:      rounded-t-2xl (top only)

Close (×):   text-[#c0d4ff]

hover:text-white

### Footer
Background:  bg-white

Border top:  border-t border-[#f9f8ff]

---

## Inputs
Background:   bg-white

Border:       border border-[#e2e8f0]

Radius:       rounded-xl

Text:         text-[#0f172a]

Placeholder:  placeholder:text-[#8d8db9]

Focus:        focus:border-[#2563eb]

focus:ring-1

focus:ring-[#2563eb]/30

focus:outline-none

### Number inputs
Always add `onFocus={e => e.target.select()}`
so the existing value is selected on
focus, allowing the user to type
immediately without manually clearing
the field.

### Labels
text-[#8d8db9] text-xs font-bold

uppercase tracking-widest

### Error text
text-red-600 text-xs

---

## Buttons

### Primary (submit / confirm)
Enabled:   bg-[#2563eb] text-white

font-bold uppercase

tracking-widest text-xs

rounded-xl px-4 py-2

hover:bg-[#567eff]

transition-colors
Disabled:  bg-[#c0d4ff] text-white

cursor-not-allowed

rounded-xl px-4 py-2

opacity-60

### Secondary (cancel / back)
text-[#8d8db9] border border-[#e2e8f0]

rounded-xl px-3 py-1.5 text-xs

hover:border-[#2563eb]

hover:text-[#2563eb]

transition-colors

### Destructive (delete / remove)
bg-red-50 text-red-600

border border-red-100 rounded-xl

uppercase text-xs font-bold px-3 py-2

hover:bg-red-100 transition-colors

### Icon-only
text-[#8d8db9] hover:text-[#2563eb]

hover:bg-[#f9f8ff] rounded-lg p-1.5

transition-colors

---

## Tabs
Tab bar:    border-b border-[#e2e8f0]
Active:     text-[#2563eb] border-b-2

border-[#2563eb] font-medium

pb-2
Inactive:   text-[#8d8db9] pb-2

hover:text-[#2563eb]

transition-colors

---

## Section Headers
text-[#8d8db9] text-xs font-bold

uppercase tracking-widest

border-b border-[#f9f8ff] pb-1 mb-2

---

## Sidebar Navigation
Sidebar background:  bg-[#2563eb]

border-r

border-[#567eff]
Icon — default:      text-[#c0d4ff]
Icon — hover:        text-white

bg-white/15
Icon — active:       text-white

bg-white/20

ring-1 ring-white/40
Tooltip:             bg-[#0f172a]

text-white text-xs

rounded-lg px-2 py-1

shadow-lg
Divider:             border-t

border-[#567eff]

---

## Stat Block (Ability Score Boxes)
Box:          bg-[#f9f8ff]

border border-[#e2e8f0]

rounded-lg p-2 text-center
Label:        text-[#8d8db9] text-[10px]

uppercase tracking-wider

font-medium
Score:        text-[#0f172a] text-2xl

font-bold
Modifier (+): text-[#2563eb] text-sm

font-medium
Modifier (0): text-[#8d8db9] text-sm

font-medium
Modifier (-): text-red-600 text-sm

font-medium

---

## Badges and Pills

### Resource reset type
Short Rest:  bg-[#f9f8ff] text-[#567eff]

border border-[#c0d4ff]

text-[10px] font-bold

uppercase rounded px-1.5
Long Rest:   bg-[#f9f8ff] text-[#2563eb]

border border-[#9eb6ff]

text-[10px] font-bold

uppercase rounded px-1.5

### Status badges
Active:    bg-[#f9f8ff] text-[#2563eb]

border border-[#c0d4ff]
Inactive:  bg-[#f9f8ff] text-[#8d8db9]

border border-[#e2e8f0]

---

## Typography
App font:       font-sans (system-ui)

Data/numbers:   font-mono (HP values,

dice notation, modifiers)

Labels/UI:      font-sans uppercase

tracking-widest

---

## Spacing and Sizing

Standard gaps between form fields:
  `space-y-4`
Standard card padding:
  `p-4` or `p-5`
Standard section gap inside cards:
  `space-y-3`
Modal content padding:
  `px-6 py-5`
Modal footer padding:
  `px-6 py-4`

---

## What NOT to do

- ❌ Do not introduce hex values not
  in the approved palette above
- ❌ Do not add theme switching or
  alternative visual styles — the app
  is permanently Minimalist Sleek
- ❌ Do not use warm parchment colors
  (`#fdfaf5`, `#f5f1e8`, `#c5b358`,
  `#2c2c26`, `#5a5a40`, `#8a7a20`) —
  those belonged to the old default
  theme and are no longer in use
- ❌ Do not use `border-2` on cards —
  use `border` only
- ❌ Do not use `bg-amber-*` or
  `text-amber-*` — not in palette
- ❌ Do not use `#c0d4ff` or `#8d8db9`
  for body text on white — insufficient
  contrast

---

## Adding New UI Elements

Before styling any new component:
1. Check this file for the closest
   matching pattern
2. Use only the approved palette above
3. Verify contrast ratio if placing
   text on a non-white background
4. Run `npx tsc -p tsconfig.build.json
   --noEmit` after any changes
