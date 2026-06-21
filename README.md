# GM Dashboard

A web-based Game Master toolkit for Dungeons
& Dragons 5e. Built to reduce cognitive load
during sessions — automating combat math,
surfacing rules references on demand, and
managing audio atmosphere — so the GM can
focus on storytelling.

---

## Features

### Combat
- **Initiative tracking** with turn
  advancement and round counter
- **HP and Temp HP management** across the
  full party and all NPCs simultaneously
- **Automatic IRV math** — resistances halve
  damage, immunities zero it, vulnerabilities
  double it, applied automatically on input
- **Batch actions** — apply damage, healing,
  or conditions to multiple combatants at once
- **Legendary actions and resistances** with
  pip trackers that auto-reset each turn/day
- **Recharge abilities** with d6 roll UI
- **Death saving throws** tracked per
  character with auto-stabilization logic
- **Concentration check auto-prompt** — when
  a concentrating caster takes damage, the
  Constitution save DC appears automatically
  (DC = higher of 10 or half damage)

### Party Management
- **Character cards** with HP, AC, conditions,
  passive perception, class, and level
- **Class resource tracker** — custom pip
  counters for Rage uses, Ki points, Spell
  Slots, Wild Shape, or any named resource.
  Visible on both party and combat cards.
  Auto-decrements when matching effects are
  applied (e.g. applying "raging" spends a
  Rage pip)
- **Hit dice tracking** with spend and
  recovery during short rests
- **Short rest** and **long rest** workflows
  with hit dice spending dialogs and
  automatic resource pool reset
- **Level up** with multiclass-aware hit dice
  configuration
- **Death overlay** and **unconscious overlay**
  for dramatic moments

### NPC Library
- Persistent NPC template library with full
  stat blocks (AC, HP, IRV, notes, legendary
  actions, recharge abilities)
- **Three-tab combat sidebar** for adding
  combatants: NPC Library (searchable),
  Party Members (with disabled states for
  already-in-encounter characters), and
  Create NPC (saves to library and adds to
  encounter simultaneously)

### Rules Reference
- **Condition and effect popovers** — hover
  any condition or effect chip to see the
  official D&D 5e rules text. Covers all 15
  standard conditions, all 6 exhaustion
  levels, and 20+ spell effects and class
  features. Never leave the app to look up
  what Stunned does.

### Encounters
- Saved encounter templates with location,
  difficulty, and NPC configuration
- One-click combat launch from any saved
  encounter

### Audio
- **Ambient music player** with two-deck
  crossfade (5 second transition)
- **Mood presets** — five atmospheric modes
  (Sweet, Adventuring, Tense, Scary, Combat)
  with Alt+1–5 shortcuts for instant
  switching
- **Soundboard** — 3×4 configurable grid of
  one-shot sound effects, campaign-scoped
- **Audio library** — upload and manage
  ambient loops and sound effects, assign
  tracks to mood presets
- Audio files stored locally in IndexedDB
  per campaign (no server uploads needed)

### GM Tools
- **Command palette** (Cmd+K) for quick
  actions — roll dice, apply conditions,
  switch moods, trigger short rest
- **Keyboard shortcuts** with in-app cheat
  sheet (? key)
- **Player view** — a second browser tab or
  monitor showing the current combat state
  live for players
- **Dice roller** for standard notation
  (1d20+5, 2d6, etc.)

### Multi-Campaign Support
- Create and switch between multiple
  campaigns, each with its own Google Sheet
- All storage (audio files, soundboard
  layouts, mood presets) is scoped per
  campaign

---

## Prerequisites

- Node.js 18+
- A Google Cloud project with:
  - **Google Sheets API** enabled
  - **Google Drive API** enabled
  - An **OAuth 2.0 Client ID** (Web
    application type)
  - Authorized JavaScript origins including
    `http://localhost:3000`
  - Authorized redirect URIs including
    `http://localhost:3000/auth-relay`

---

## Setup

### 1. Clone and install

```bash
git clone <repository-url>
cd <project-directory>
npm install
```

### 2. Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Fill in your values:

```env
VITE_GOOGLE_CLIENT_ID="your-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-oauth-client-secret"
```

`VITE_GOOGLE_CLIENT_ID` is exposed to the
browser (used for the OAuth popup).
`GOOGLE_CLIENT_SECRET` stays on the server
and is never sent to the client.

### 3. Start the development server

```bash
npm run dev
```

This starts both the Express backend
(handles OAuth token exchange) and the Vite
dev server concurrently.

Open `http://localhost:3000`.

### 4. Create your first campaign

On first load, the Campaign Selector screen
appears. Click **Create New Campaign** and
follow the prompts. The app will:

1. Create a new Google Sheet in your Drive
   with all the required tables and headers
2. Store the spreadsheet ID in your browser
3. Redirect you to the GM Dashboard

---

## Development

### Run tests

Tests are split into 12 batches to prevent
timeouts. Always run batches individually:

```bash
npx vitest run src/lib/__tests__
npx vitest run src/services/__tests__
# etc. — see AGENTS.md for full batch list
```

Current baseline: **982 tests.**

### Type check

```bash
npx tsc -p tsconfig.build.json --noEmit
```

### Project structure
src/

lib/          Pure utility functions,

schemas, constants

services/     Google Sheets API, auth,

write queue

hooks/        Zustand store, React hooks

components/   UI components by feature area

server/       Express backend (OAuth proxy,

campaign provisioning)

See `AGENTS.md` for the complete architecture
reference, schema documentation, and
development rules.

---

## Technology Stack

- **React 18** with TypeScript
- **Vite** with `@tailwindcss/vite`
- **Tailwind CSS v4**
- **Zustand** for state management
- **Express** backend for OAuth and campaign
  provisioning
- **Google Sheets API** as the database
- **Google Identity Services** for
  authentication
- **Sonner** for toast notifications
- **Vitest** + React Testing Library for
  testing
