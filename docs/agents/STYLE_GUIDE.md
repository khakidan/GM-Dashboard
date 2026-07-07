## Layout

App root: `bg-white font-sans`

Sidebar: `bg-[#2563eb] border-r border-[#567eff]`

Main content: `bg-white`

The sidebar uses the primary blue (`#2563eb`) to create strong visual anchoring and separation from the white content area. This follows the pattern of modern productivity tools (Slack, Linear, Notion).

---
## Cards

All content cards (character cards, NPC cards, combatant cards) share this pattern:

- **Background:** `bg-white`
- **Border:** `border border-[#f9f8ff]` or `border-[#e2e8f0]`
- **Radius:** `rounded-2xl`
- **Shadow:** `shadow-sm` (optional)

---
## Modal Dialogs

All modal dialogs should use the shared `DialogShell.tsx` component (`src/components/ui/DialogShell.tsx`) rather than hand-rolling backdrop/panel markup — it's the single source of truth for this pattern, adopted across all 12 dialogs in the app. What follows documents `DialogShell`'s actual current styling; treat the component itself as authoritative if this ever drifts.

### Backdrop

`bg-[#0f172a]/60 backdrop-blur-sm`. Dismissible on click by default; pass `dismissOnBackdropClick={false}` for dialogs where accidental dismissal risks data loss (e.g. `NewPlayerDialog.tsx`).

### Panel

- **Background:** `bg-white`
- **Border:** `border border-[#e2e8f0]`
- **Radius:** `rounded-2xl`
- **Shadow:** `shadow-2xl`
- **Max width:** passed per-dialog via the required `maxWidth` prop (`max-w-lg` for simple confirmations, up to `max-w-2xl` for larger forms)
- **z-index:** defaults to `z-50`; override via the `zIndex` prop (a full Tailwind class string, e.g. `"z-[110]"`) for dialogs that need to stack above other combat UI

### Header Bar

- **Background:** `bg-[#0f172a]` (dark navy) — **this is the standard for every dialog**, not `bg-[#2563eb]` (blue). Two dialogs (`EncounterLogModal.tsx`, `ReferenceDetailDialog.tsx`) originally used a blue header as a distinct "informational modal" style; this was deliberately normalized away during consolidation. Do not reintroduce a blue header for a new dialog.
- **Title:** `text-white font-serif tracking-widest text-sm uppercase`, via the `title` prop
- **Subtitle (optional):** `text-xs text-[#e2e8f0]/60`, via the `subtitle` prop — a second line under the title (e.g. character name + level)
- **Icon (optional):** passed via the `icon` prop, rendered to the left of the title
- **Subheader (optional):** passed via the `subheader` prop — a full-bleed slot rendered directly below the header, unwrapped and unpadded, for content like a tab navigation bar (`NewPlayerDialog.tsx`, `AddCombatantDialog.tsx`)
- **Close button:** use `IconButton` with `onDark` (see Buttons section below) — not a hand-rolled `<button>`. `DialogShell` already renders this internally when `title`/`icon` is present.

### Body

`flex-1 p-6` — the `children` prop renders here. Content needing its own scroll should cap itself at something like `max-h-[70vh] overflow-y-auto` rather than relying on the panel itself to scroll.

### Footer (optional)

- **Background:** `bg-[#ffffff]`
- **Border top:** `border-t border-[#e2e8f0]` (not `border-[#f9f8ff]`)
- **Padding:** `px-6 py-4`
- Passed via the `footer` prop. **Important:** if the dialog's primary action is a native form submit (`type="submit"` inside a `<form>`), do not put the submit button in `footer` — it renders as a DOM sibling of `children`, which breaks native form submission (including Enter-to-submit). Either keep the whole `<form>` (fields + buttons) inside `children`, or use the button's `form="id"` HTML attribute to associate it with a form living in `children` while the button itself stays in `footer` (see `NewPlayerDialog.tsx` for a working example of the latter).

---
## Command Palette

The search overlay (activated via `Cmd+K` or `Ctrl+K`) uses a highly interactive and structured list.

### Backdrop

`fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[12vh] px-4 font-sans select-none`

### Panel Card

- **Background:** `bg-white`
- **Text:** `text-[#0f172a]`
- **Border:** `border border-[#e2e8f0]`
- **Radius:** `rounded-2xl`
- **Width:** `w-full max-w-xl`
- **Shadow:** `shadow-2xl`

### Search Input

- **Container:** `flex items-center gap-3 px-4 py-3 border-b border-[#e2e8f0]`
- **Icon:** `Dices` (styled as `w-5 h-5 text-[#2563eb]`)
- **Input:** `w-full bg-transparent outline-none border-none placeholder-[#8d8db9] text-sm font-sans text-[#0f172a]`

### Group Headers

- Styled with:

```text
[&_[cmdk-group-heading]]:px-2.5
[&_[cmdk-group-heading]]:pb-2
[&_[cmdk-group-heading]]:text-[10px]
[&_[cmdk-group-heading]]:font-bold
[&_[cmdk-group-heading]]:font-sans
[&_[cmdk-group-heading]]:uppercase
[&_[cmdk-group-heading]]:tracking-widest
[&_[cmdk-group-heading]]:text-[#2563eb]/75
```

### Item Rows

- **Class:**

```text
w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-xs
font-semibold font-sans transition-all cursor-pointer
text-[#0f172a]/80 hover:bg-[#f9f8ff] hover:text-[#0f172a]
border-l-2 border-transparent hover:border-[#2563eb]
data-[selected='true']:bg-[#f9f8ff]
data-[selected='true']:text-[#0f172a]
data-[selected='true']:border-[#2563eb]
data-[selected=true]:bg-[#f9f8ff]
data-[selected=true]:text-[#0f172a]
data-[selected=true]:border-[#2563eb]
```

- **Disabled Empty Message:** `px-4 py-3 text-xs text-[#8d8db9] font-medium font-sans`

### Keyboard Shortcuts (kbd)

- **Class:** `px-1.5 py-0.5 text-[10px] font-sans font-bold bg-[#f9f8ff] border border-[#e2e8f0] rounded-md text-[#8d8db9]`

---
## Global Action Context Panel

Overlay/toolbar element in the Active Encounter Tab for setting damage context.

- **Panel container:** `flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-2 w-full`
- **Source picker:** Standard Input pattern (`bg-white border border-[#e2e8f0] rounded px-2 h-7 text-xs focus:border-[#2563eb]`)
- **Type pills (active):** `bg-[#2563eb] text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase`
- **Type pills (inactive):** `bg-[#f1f5f9] text-[#8d8db9] hover:bg-[#e2e8f0] hover:text-[#0f172a] px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase`

> Note: `bg-[#f8fafc]` and `bg-[#f1f5f9]` are structural background neutrals.

---
## Inputs

- **Background:** `bg-white`
- **Border:** `border border-[#e2e8f0]`
- **Radius:** `rounded-xl`
- **Text:** `text-[#0f172a]`
- **Placeholder:** `placeholder:text-[#8d8db9]`
- **Focus:** `focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/30 focus:outline-none`

### Number inputs

Always add:

```tsx
onFocus={e => e.target.select()}
```

so the existing value is selected on focus, allowing the user to type immediately without manually clearing the field.

### Labels

`text-[#8d8db9] text-xs font-bold uppercase tracking-widest`

### Error text

`text-red-600 text-xs`

---
## Buttons

Use the shared `Button.tsx` component (`src/components/ui/Button.tsx`) for all text/icon+text buttons, and `IconButton.tsx` (`src/components/ui/IconButton.tsx`) for all icon-only buttons — do not hand-roll `<button>` markup for either case. These are two separate components, not one: icon-only buttons have a materially different prop shape (no text `children`, a mandatory `aria-label`, square-aspect sizing), not just a different color.

### `Button.tsx`

**Props:** `intent?: 'primary' | 'secondary' | 'tertiary' | 'destructive'` (default `'primary'`), `size?: 'large' | 'small'` (default `'small'`), plus standard button attributes. Leading icons are composed via `children` (e.g. `<Button intent="primary"><Heart className="w-4 h-4" />Apply</Button>`), not a dedicated icon prop.

**Shared base (all intents):** `font-bold uppercase tracking-widest text-xs rounded-xl transition-all disabled:cursor-not-allowed` plus a universal press animation — `motion-safe:active:scale-95 disabled:active:scale-100` (this requires `transition-all`, not `transition-colors`, or the scale change won't animate).

**Size:**
- `small`: `px-4 py-2`
- `large`: `px-6 py-3 flex-1 justify-center` (note: `flex-1` only does anything inside a flex parent — if the button sits alone in a non-flex wrapper, also pass `className="w-full"` to preserve full-width appearance)

**Intent — primary** (submit / confirm):
`bg-[#2563eb] text-white hover:bg-[#567eff] disabled:bg-[#e2e8f0] disabled:text-[#8d8db9] disabled:opacity-60 shadow-sm`

**Intent — secondary** (cancel / back):
`bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#0f172a] disabled:opacity-60`
This is a solid gray fill, not a bordered/transparent style — an earlier bordered-transparent variant and a separate tan-hover (`#d4cfc1`, a parchment-theme leftover) variant were both normalized into this single style.

**Intent — tertiary** (plain text-link style, e.g. wizard Previous/Next):
`text-sm text-stone-500 hover:text-stone-700 px-2 py-1 transition-colors` — deliberately opts out of the shared bold/uppercase/tracking-widest typography and the `size` prop's padding (neither `large` nor `small` padding fits this style; it has its own fixed `px-2 py-1`).

**Intent — destructive** (delete / remove):
`bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 disabled:opacity-60` — uses the same shared typography/sizing as `primary`/`secondary` (no opt-out, unlike `tertiary`).

### `IconButton.tsx`

**Props:** `icon: React.ReactNode` (required), `intent?: 'neutral' | 'destructive'` (default `'neutral'`), `onDark?: boolean` (default `false`), `aria-label` (**required**, not optional — there's no visible text for screen readers to fall back on).

**Shared base:** `p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed`. Always `rounded-full`, never `rounded-lg`. Every combination uses a hover-*fill* (background-color change), not a color-only ghost hover — ghost-style hover is what `Button`'s `tertiary` intent is for; icon buttons should always show a background on hover.

- **neutral, light background** (default — used on white/light card backgrounds): `text-stone-400 hover:text-stone-700 hover:bg-stone-100`
- **neutral, `onDark`** (used inside `DialogShell`'s navy header, e.g. the close button): `text-white/50 hover:text-white hover:bg-white/10`
- **destructive, light background**: `text-stone-400 hover:text-red-600 hover:bg-red-50`
- **destructive, `onDark`**: `text-red-300 hover:text-red-100 hover:bg-red-500/20` — no real instance of this combination exists in the app yet; treat this specific one as an unvalidated placeholder if you're the first to use it.

---
## Tabs

- **Tab bar:** `border-b border-[#e2e8f0]`
- **Active:** `text-[#2563eb] border-b-2 border-[#2563eb] font-medium pb-2`
- **Inactive:** `text-[#8d8db9] pb-2 hover:text-[#2563eb] transition-colors`

### Structured/Raw Toggle

Used in `EncounterLogModal` to switch between views.

- **Container:** `flex bg-slate-100 p-0.5 rounded-lg border border-[#e2e8f0]`
- **Active pill:** `bg-white text-[#2563eb] shadow-sm px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all`
- **Inactive pill:** `text-[#8d8db9] px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all hover:text-[#0f172a]`

> **Note:** `bg-slate-100` is used purely as a neutral structural container background.

---
## Section Headers

`text-[#8d8db9] text-xs font-bold uppercase tracking-widest border-b border-[#f9f8ff] pb-1 mb-2`

---
## Sidebar Navigation

- **Sidebar background:** `bg-[#2563eb] border-r border-[#567eff]`
- **Icon — default:** `text-[#c0d4ff]`
- **Icon — hover:** `text-white bg-white/15`
- **Icon — active:** `text-white bg-white/20 ring-1 ring-white/40`
- **Tooltip:** `bg-[#0f172a] text-white text-xs rounded-lg px-2 py-1 shadow-lg`
- **Divider:** `border-t border-[#567eff]`

---
## Stat Block (Ability Scores, AC/HP/CR, etc.)

Use the shared `StatTile.tsx` component (`src/components/ui/StatTile.tsx`) for this pattern — a pure shell that doesn't own input behavior. It renders the box/label/optional-modifier chrome; the value itself (static text, or an editable `CardNumberInput`/`DebouncedInput`/`AbilityScoreInput`) is passed in as `children`.

**Props:** `label: string`, `children: React.ReactNode` (the value), `modifier?: number` (optional third row, only rendered when provided), `size?: 'default' | 'compact'` (default `'default'`), `className?: string`.

### Box

`bg-white border border-[#e2e8f0] rounded-xl text-center`, plus size-driven padding: `p-3` for `size="default"` (AC, Max HP, HP, CR), `p-2` for `size="compact"` (ability scores, where 6 need to fit one row).

### Label

`text-[10px] font-bold uppercase tracking-widest text-[#8d8db9] mb-1`

### Score

Whatever's passed as `children` — typically `text-lg font-bold text-[#0f172a]` for a static value, or the same styling applied to an editable input's own `className`.

### Modifier (only rendered when the `modifier` prop is provided)

Base: `text-xs font-medium mt-1`, plus color:
- **Positive:** `text-[#2563eb]`
- **Zero:** `text-[#8d8db9]`
- **Negative:** `text-red-600`

Formatting (the `+N` / `N` / `−N` string) is handled by `formatBonus`, exported from `StatBlockScores.tsx` — reuse it rather than reimplementing the sign/formatting logic.

---
## Badges and Pills

### Resource reset type

**Short Rest**

`bg-[#f9f8ff] text-[#567eff] border border-[#c0d4ff] text-[10px] font-bold uppercase rounded px-1.5`

**Long Rest**

`bg-[#f9f8ff] text-[#2563eb] border border-[#9eb6ff] text-[10px] font-bold uppercase rounded px-1.5`

### Status badges

**Active**

`bg-[#f9f8ff] text-[#2563eb] border border-[#c0d4ff]`

**Inactive**

`bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0]`

### Reference Metadata Badges (from `ReferenceDetailDialog`)

- **Spell Level badge:** `bg-[#f9f8ff] text-[#2563eb] border border-[#9eb6ff] text-[10px] font-bold uppercase rounded-md px-2.5 py-1`
- **General Info tags:** `bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0] text-[10px] font-bold uppercase rounded-md px-2 py-1`
- **Concentration:** `bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold uppercase rounded-md px-2 py-1`
- **Ritual:** `bg-[#f9f8ff] text-[#567eff] border border-[#c0d4ff] text-[10px] font-bold uppercase rounded-md px-2 py-1`

### Combat Event Rows

Visual cues for different combat events in the log.

- **Damage events:** `bg-red-50 text-red-600 border border-red-100` (Red/Rose)
- **Healing events:** `bg-green-50 text-green-700 border border-green-100` (Green/Emerald)
- **Condition events:** `bg-[#f9f8ff] text-[#2563eb] border border-[#c0d4ff]` (Blue)
- **Combatant defeated:** `bg-[#f9f8ff] text-[#0f172a] border border-[#e2e8f0] font-bold` (Slate)
- **Manual adjustment:** `bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0]` (Purple)
- **Event row base:** `flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg`

### Nested Panels and Callouts

For sub-sections or detailed context inside modals (e.g. **"At Higher Levels"**):

- **Container:** `bg-[#f9f8ff] border border-[#e2e8f0] rounded-lg p-4`
- **Sub-header:** `text-[#8d8db9] text-[10px] font-bold uppercase tracking-widest border-b border-[#e2e8f0] pb-1 mb-2`
- **Body Text:** `text-stone-700` or `text-[#0f172a]` (clean high contrast)

---
## Typography

- **App font:** `font-sans` (`system-ui`)
- **Data/numbers:** `font-mono` (HP values, dice notation, modifiers)
- **Labels/UI:** `font-sans uppercase tracking-widest`

---
## Spacing and Sizing

- **Standard gaps between form fields:** `space-y-4`
- **Standard card padding:** `p-4` or `p-5`
- **Standard section gap inside cards:** `space-y-3`
- **Modal content padding:** `px-6 py-5`
- **Modal footer padding:** `px-6 py-4`

---
## What NOT to do

- ❌ Do not introduce hex values not in the approved palette above
- ❌ Do not add theme switching or alternative visual styles — the app is permanently Minimalist Sleek
- ❌ Do not use warm parchment colors (`#fdfaf5`, `#f5f1e8`, `#c5b358`, `#2c2c26`, `#5a5a40`, `#8a7a20`) — those belonged to the old default theme and are no longer in use
- ❌ Do not use `border-2` on cards — use `border` only
- ❌ Do not use `bg-amber-*` or `text-amber-*` — not in palette
- ❌ Do not use `#c0d4ff` or `#8d8db9` for body text on white — insufficient contrast

---
## Adding New UI Elements

**Guiding principle: prefer building or extending a shared component over one-off styling, whenever a pattern is genuinely reused.** A shared component enforces style-guide compliance automatically — every consumer gets a fix "for free" when the component changes, rather than relying on every future author remembering to copy the current convention correctly by hand. This is why `Button.tsx`/`IconButton.tsx`/`DialogShell.tsx`/`StatTile.tsx` exist: not just to save typing, but so the app can't silently drift into inconsistent buttons/dialogs/tiles the way it did before they were built (see `CHANGELOG.md` for the specific drift each one was built to fix — mismatched disabled-state colors, a stray tan hover color left over from an old theme, inconsistent header colors, etc.). When you notice a new pattern recurring 3+ times, that's a signal to consider componentizing it, not just to keep copying it.

Before styling any new component:
1. **Check whether a shared component already exists first** — `DialogShell.tsx` (modals), `Button.tsx`/`IconButton.tsx` (buttons), `StatTile.tsx` (label/value/modifier boxes), `DebouncedInput.tsx`/`DebouncedTextarea.tsx`/`CardNumberInput.tsx` (inputs). Use the existing component rather than hand-rolling matching markup, even if it looks like a one-off.
2. If no shared component fits, check this file for the closest matching pattern
3. Use only the approved palette above
4. Verify contrast ratio if placing text on a non-white background
5. Run `npx tsc -p tsconfig.build.json --noEmit` after any changes