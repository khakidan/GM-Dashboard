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

### Backdrop

`bg-[#0f172a]/60 backdrop-blur-sm`

### Panel

- **Background:** `bg-white`
- **Border:** `border border-[#e2e8f0]`
- **Radius:** `rounded-2xl`
- **Max width:** `max-w-2xl` (standard), `max-w-lg` (simple confirmation)

### Header Bar

- **Background:** `bg-[#2563eb]`
- **Text:** `text-white font-bold`
- **Radius:** `rounded-t-2xl` (top only)
- **Close (×):** `text-[#c0d4ff] hover:text-white`

### Footer

- **Background:** `bg-white`
- **Border top:** `border-t border-[#f9f8ff]`

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

### Primary (submit / confirm)

**Enabled**

`bg-[#2563eb] text-white font-bold uppercase tracking-widest text-xs rounded-xl px-4 py-2 hover:bg-[#567eff] transition-colors`

**Disabled**

`bg-[#c0d4ff] text-white cursor-not-allowed rounded-xl px-4 py-2 opacity-60`

### Secondary (cancel / back)

`text-[#8d8db9] border border-[#e2e8f0] rounded-xl px-3 py-1.5 text-xs hover:border-[#2563eb] hover:text-[#2563eb] transition-colors`

### Destructive (delete / remove)

`bg-red-50 text-red-600 border border-red-100 rounded-xl uppercase text-xs font-bold px-3 py-2 hover:bg-red-100 transition-colors`

### Icon-only

`text-[#8d8db9] hover:text-[#2563eb] hover:bg-[#f9f8ff] rounded-lg p-1.5 transition-colors`

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
## Stat Block (Ability Score Boxes)

### Box

`bg-[#f9f8ff] border border-[#e2e8f0] rounded-lg p-2 text-center`

### Label

`text-[#8d8db9] text-[10px] uppercase tracking-wider font-medium`

### Score

`text-[#0f172a] text-2xl font-bold`

### Modifier (+)

`text-[#2563eb] text-sm font-medium`

### Modifier (0)

`text-[#8d8db9] text-sm font-medium`

### Modifier (-)

`text-red-600 text-sm font-medium`

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

Before styling any new component:
1. Check this file for the closest matching pattern
2. Use only the approved palette above
3. Verify contrast ratio if placing text on a non-white background
4. Run `npx tsc -p tsconfig.build.json --noEmit` after any changes