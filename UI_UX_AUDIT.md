# UI/UX Consistency Report

## 1. Page Inventory

* **Party Roster:** Manages player characters, their health, conditions, and core stats.
* **NPC Library:** A repository for creating, editing, and managing reusable NPC stats and abilities.
* **Encounters:** Manages planned combat scenarios, including locations and combatant composition.
* **Active Encounter:** The primary gameplay view for managing health, condition timers, and turn order during combat.
* **Player View:** A simplified, read-only broadcast view intended for a secondary screen to display public combat state and initiative.
* **Settings Modal:** A dialog to configure OAuth connectivity and monitor Google Sheets synchronization.
* **New Player Dialog / Level Up Dialog:** Modals for adding characters and adjusting their stats.
* **New NPC Dialog / New Encounter Dialog:** Modals for creating enemies and linking them to encounters.
* **Add Combatant (CombatSidebar):** A slide-out sidebar used during active combat to add new entities to the tracker on the fly.

## 2. Interaction Patterns

* **How fields save:**
  * Most text inputs (e.g., character notes, names) utilize a `DebouncedInput` or `DebouncedTextarea` to auto-save after a delay.
  * **Deviation:** The `ConditionChips` and `IrvMultiSelect` components save immediately `onChange`, bypassing the debounce pattern.
* **How items are created:**
  * Items are consistently created via dedicated overlay modals/dialogs (New Player, New NPC, New Encounter).
* **How items are deleted:**
  * Most items are deleted via an inline button that triggers a native browser `confirm()` dialog.
* **How errors and success states are communicated:**
  * Success and minor warnings generally use lightweight `toast` notifications (via `sonner`).
  * Complex page-level errors use an inline warning banner via a `setGlobalError` mechanism.
  * **Deviation (Flagrant Inconsistency):** Many asynchronous hooks (e.g., `useParty`, `useEncounters`) trigger a native browser `alert('Your session has expired...')` for authentication issues, which is aggressive and interrupts the user experience.
* **How empty states are shown:**
  * Empty states are consistently shown using stylized, centered typography (e.g., "No NPCs loaded in library", "No encounters found") paired with prompt instructions.

## 3. Visual Inconsistencies

* **Typography Scale:** The Active Encounter `CombatSidebar` uses extremely small typography (`text-[8px]`) for input labels, whereas the main modals use a warmer, slightly larger label size (`text-[10px]`).
* **Design Density:** The `CombatantCard` in the Active Encounter tab is incredibly dense visually, packing numerous inputs, health controls, and chips into a single card framework, which contrasts strongly with the breathability of the `EncounterCard` and `NpcCard`. 

## 4. Missing Feedback

* **Silent Deletions:** Deleting an encounter or a player character from the roster does not display a positive confirmation toast (it only displays an error if the deletion fails).
* **Condition Application:** Applying damage or conditions to multiple targets triggers a success toast, but applying it silently via the `CombatantCard` individual chips has no top-level visual confirmation outside of the chip changing state.
