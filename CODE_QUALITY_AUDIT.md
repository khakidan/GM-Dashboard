# Code Quality Report

## 1. Duplicated Logic
* **Spreadsheet Row Mapping:** The logic to iterate over spreadsheet rows and map them into usable domain objects is repeated across multiple `forEach` and `reduce` loops directly inside `src/components/GMDashboard.tsx`. This mapping logic should be extracted into data-transfer object (DTO) adapters.
* **Form State Management:** The `NewPlayerDialog`, `NewNpcDialog`, and `NewEncounterDialog` components all duplicate boilerplate React state (`useState`), `onChange` handlers, and form-reset logic instead of utilizing a shared context or a generic form composition hook.

## 2. Oversized Components or Hooks
* **`src/components/GMDashboard.tsx` (~927 lines):** [High Priority] This component is massively overloaded. It governs routing, authentication flows, global state initialization, aggressive spreadsheet parsing, and application layout.
* **`src/services/sheetsService.ts` (~665 lines):** [High Priority] Mixes raw OAuth token management, Google API specific network calls, and application-level retry/notifier architecture.
* **`src/components/ActiveEncounterTab/CombatantCard.tsx` (~487 lines):** [Medium Priority] Contains excessive inline UI definition, complex health calculation math, and form bindings for a single list item.
* **`src/services/dbOperations.ts` (~471 lines):** [Medium Priority] Functions as a monolithic "god file" housing every database operation for Characters, NPCs, Encounters, and Combatants.

## 3. Inconsistent Patterns
* **Error Bubbling vs. Handling:** [High Priority] Some asynchronous operations in the hooks wrap API calls in `try/catch` and use `setGlobalError`, while other API calls rely on native browser `alert()` statements.
* **Debounce Implementations:** [Low Priority] Some inputs are fully controlled with a custom `DebouncedInput`, while others implement raw inline updates that push data instantly to the backend context.

## 4. Missing Error Handling
* **`src/services/dbOperations.ts`:** [High Priority] Exported orchestrators like `deleteEncounterFully`, `deleteCharacterFully`, `addCharacterDB`, and `addNpcDB` do not contain internal `try/catch` blocks. If the underlying `batchUpdateSpreadsheet` fails (e.g. timeout or auth drop), the promise rejects raw, relying entirely on the calling UI to capture it. 

## 5. Type Safety Gaps
* **Rampant Use of `any`:** [High Priority] 
    * `GMDashboard.tsx` (lines 110-225): Uses `.reduce((acc: any, row: any[], i: number) => ...)` extensively to parse Google Sheets data. This completely disables TypeScript's safety features for the application's most critical data ingress point.
    * `sheetsService.ts`: Bypasses strict Google API initialization with `google?: any` and `tokenClient: any`.
* **Weak Exception Typing:** [Medium Priority] Throughout the application, catch blocks use `catch (err: any)`. This is a bad practice in TypeScript; it should be typed as `unknown` and type-guarded (e.g., `if (err instanceof Error)`).

## 6. Dead Code
* It appears that functions like `castInt` in `dbOperations.ts` may be underutilized or could simply default to native `parseInt` or `Number()`. A static analysis sweep with ESLint's unused-exports rule would likely flag several helper variables in the hooks that were established for features that shifted during development.
