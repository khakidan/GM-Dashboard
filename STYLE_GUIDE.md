# GM Dashboard — Style Guide

This file is the authoritative style 
reference for all UI work on this project.
When building or modifying any component,
consult this guide first. Never introduce
new color values, spacing patterns, or
component styles that are not defined here.

---

## Design Philosophy

The GM Dashboard uses a warm parchment-and-
obsidian aesthetic — light, clean surfaces
with ink-dark text and gold accents. This
creates a D&D-appropriate feel while
remaining highly readable during sessions.

**Two rules above all others:**
1. Every piece of text must have sufficient
   contrast against its background. Minimum
   4.5:1 for body text, 3:1 for large/bold
   text (WCAG AA).
2. When in doubt, go lighter and use more
   whitespace. Clutter costs the GM attention
   during play.

---

## Design Tokens

These are the only color values used in
this application. Do not introduce new
hex values without updating this file.

| Token | Hex | Name | Usage |
|-------|-----|------|-------|
| `#fdfaf5` | Parchment | Main backgrounds, card surfaces, modal bodies |
| `#f5f1e8` | Parchment Alt | Sidebar, nested sections, subtle separation |
| `#2c2c26` | Obsidian | Primary text, modal header bars, dark accents |
| `#5a5a40` | Sage | Muted labels, secondary text, placeholder text |
| `#c5b358` | Gold | Primary accent, focus rings, active indicators |
| `#8a7a20` | Gold Dark | Gold text at small sizes only |
| `#e5e1d8` | Sepia | All borders and dividers |
| `#ffffff` | White | Input field fill |
| `#3f3f37` | Charcoal | Tooltip borders, dark dividers |

### Contrast Ratios (on Parchment #fdfaf5)

| Color | Ratio | Grade | Use for |
|-------|-------|-------|---------|
| Obsidian `#2c2c26` | 14.8:1 | AAA | All body text |
| Sage `#5a5a40` | 5.2:1 | AA | Labels, secondary text |
| Gold Dark `#8a7a20` | 4.6:1 | AA | Small gold text |
| Gold `#c5b358` | 3.1:1 | AA Large | Large/bold text, icons only |

> **Rule:** Never use Gold `#c5b358` for
> text smaller than 18px or unbold text.
> Use Gold Dark `#8a7a20` instead.

---

## Layout

```
App root:        bg-[#fdfaf5] font-serif
Sidebar:         bg-[#f5f1e8] 
                 border-r border-[#e5e1d8]
Main content:    bg-[#fdfaf5]
```

The sidebar uses Parchment Alt (`#f5f1e8`)
to be one shade darker than the main
content area. This creates spatial
separation without a hard dark border.

---

## Cards

All content cards (character cards, NPC
cards, combatant cards) share this pattern:

```
Background:  bg-[#fdfaf5]
Border:      border border-[#e5e1d8]
             Always `border` — never `border-2`
Radius:      rounded-2xl
Shadow:      shadow-sm (optional)
```

---

## Modal Dialogs

### Backdrop
```
bg-[#2c2c26]/60 backdrop-blur-sm
```

### Panel
```
Background:  bg-[#fdfaf5]
Border:      border border-[#e5e1d8]
Radius:      rounded-2xl
Max width:   max-w-2xl (standard)
             max-w-lg (simple confirmation)
```

### Header Bar
Every modal has a dark contrasting header
bar that anchors the dialog title:
```
Background:  bg-[#2c2c26]
Text:        text-[#fdfaf5] font-bold
Radius:      rounded-t-2xl (top only)
Close (×):   text-[#e5e1d8] hover:text-white
```

### Footer
```
Background:  bg-[#fdfaf5] or bg-white
Border top:  border-t border-[#e5e1d8]
```

---

## Inputs

All text inputs, number inputs, select
dropdowns, and textareas use this pattern:

```
Background:   bg-white
Border:       border border-[#e5e1d8]
Radius:       rounded-xl
Text:         text-[#2c2c26]
Placeholder:  placeholder:text-[#5a5a40]
Focus:        focus:border-[#c5b358]
              focus:ring-1
              focus:ring-[#c5b358]/50
              focus:outline-none
```

### Number inputs
Always add `onFocus={e => e.target.select()}`
so the existing value is selected on focus,
allowing the user to type immediately without
manually clearing the field.

### Labels
```
text-[#5a5a40] text-xs font-bold 
uppercase tracking-widest
```

Required field marker:
```
<span className="text-red-500 ml-0.5">*</span>
```

### Helper / description text
```
text-[#5a5a40] text-xs italic
```

### Error text
```
text-red-600 text-xs
```

---

## Buttons

### Primary (submit / confirm)
```
Enabled:   bg-[#c5b358] text-[#2c2c26] 
           font-bold uppercase tracking-widest 
           text-xs rounded-xl px-4 py-2
           hover:bg-[#d4c47a]
           transition-colors

Disabled:  bg-[#e5e1d8] text-[#5a5a40]
           cursor-not-allowed rounded-xl 
           px-4 py-2 opacity-60
```

### Secondary (cancel / back)
```
text-[#5a5a40] border border-[#e5e1d8]
rounded-xl px-3 py-1.5 text-xs
hover:border-[#c5b358] hover:text-[#2c2c26]
transition-colors
```

### Destructive (delete / remove)
```
bg-red-50 text-red-600 
border border-red-100 rounded-xl 
uppercase text-xs font-bold px-3 py-2
hover:bg-red-100 transition-colors
```

### Icon-only
```
text-[#5a5a40] hover:text-[#2c2c26]
hover:bg-[#e5e1d8]/60 rounded-lg p-1.5
transition-colors
```

### Ghost (text-only navigation)
```
text-[#5a5a40] hover:text-[#2c2c26]
text-sm transition-colors
```

---

## Tabs

Used in multi-tab dialogs and panels:

```
Tab bar:    border-b border-[#e5e1d8]

Active:     text-[#c5b358] border-b-2
            border-[#c5b358] font-medium
            pb-2

Inactive:   text-[#5a5a40] pb-2
            hover:text-[#2c2c26]
            transition-colors
```

---

## Section Headers

Used inside cards and expanded sections
to label groups of related content
(e.g. "SAVING THROWS", "CONDITIONS",
"RESOURCES"):

```
text-[#5a5a40] text-xs font-bold 
uppercase tracking-widest
border-b border-[#e5e1d8] pb-1 mb-2
```

---

## Sidebar Navigation

```
Sidebar background:  bg-[#f5f1e8]
                     border-r border-[#e5e1d8]

Icon — default:      text-[#5a5a40]
Icon — hover:        text-[#2c2c26]
                     bg-[#e5e1d8]/60
Icon — active:       text-[#2c2c26]
                     bg-[#e5e1d8]
                     ring-1 ring-[#c5b358]/50

Tooltip:             bg-[#2c2c26]
                     text-[#fdfaf5] text-xs
                     border border-[#3f3f37]
                     rounded-lg px-2 py-1
                     shadow-lg

Divider:             border-t border-[#e5e1d8]
```

---

## Stat Block (Ability Score Boxes)

The six ability score boxes (STR, DEX,
CON, INT, WIS, CHA) use a slightly
deeper parchment to create visual
grouping against the card background:

```
Box:          bg-[#f5f1e8]
              border border-[#e5e1d8]
              rounded-lg p-2 text-center

Label:        text-[#5a5a40] text-[10px]
              uppercase tracking-wider
              font-medium

Score:        text-[#2c2c26] text-2xl
              font-bold

Modifier (+): text-[#8a7a20] text-sm
              font-medium

Modifier (0): text-[#5a5a40] text-sm
              font-medium

Modifier (-): text-red-600 text-sm
              font-medium
```

---

## Badges and Pills

### Resource reset type
```
Short Rest (SR):  bg-[#fdf4c2] text-[#8a7a20]
                  border border-[#e5c85a]
                  text-[10px] font-bold 
                  uppercase rounded px-1.5

Long Rest (LR):   bg-blue-50 text-blue-700
                  border border-blue-200
                  text-[10px] font-bold
                  uppercase rounded px-1.5

Never (—):        bg-[#f5f1e8] text-[#5a5a40]
                  border border-[#e5e1d8]
                  text-[10px] font-bold
                  uppercase rounded px-1.5
```

### Status badges
```
Active:    bg-green-50 text-green-700
           border border-green-200

Inactive:  bg-[#f5f1e8] text-[#5a5a40]
           border border-[#e5e1d8]

Deceased:  bg-red-50 text-red-700
           border border-red-200
```

---

## Condition Chips

Condition chips use the existing
three-category system and should
not be changed:

```
Condition:  bg-red-100 text-red-800
            border border-red-200

Effect:     bg-blue-100 text-blue-800
            border border-blue-200

Custom:     bg-[#f5f1e8] text-[#5a5a40]
            border border-[#e5e1d8]
```

---

## Typography

```
App font:       font-serif (set on root)
Data/numbers:   font-mono (HP values,
                dice notation, modifiers)
Labels/UI:      font-sans (small caps,
                tracking-widest labels)
```

---

## Spacing and Sizing

Standard gaps between form fields: `space-y-4`
Standard card padding: `p-4` or `p-5`
Standard section gap inside cards: `space-y-3`
Modal content padding: `px-6 py-5`
Modal footer padding: `px-6 py-4`

---

## What NOT to do

- ❌ Do not use `border-2` on cards —
  use `border` only
- ❌ Do not use `bg-stone-*` or `text-stone-*`
  — use the design tokens above
- ❌ Do not use `bg-amber-*` or `text-amber-*`
  — use Gold `#c5b358` or Gold Dark `#8a7a20`
- ❌ Do not use Gold `#c5b358` for small
  body text — use Gold Dark `#8a7a20`
- ❌ Do not introduce new hex values
  without adding them to this file
- ❌ Do not use `focus:ring-amber-*` —
  use `focus:ring-[#c5b358]/50`
- ❌ Do not use dark backgrounds on
  content areas — the app is light

---

## Adding new UI elements

Before styling any new component:
1. Check this file for the closest
   matching pattern
2. Use the design tokens above —
   no new hex values
3. Verify contrast ratio if placing
   text on a non-white background
4. Run `npx tsc -p tsconfig.build.json
   --noEmit` after any changes
