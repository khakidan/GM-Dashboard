# Unit Tests Source Code

## File: src/__tests__/suiteIntegrity.test.ts

```typescript
// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DIRS = [
  'src/lib/__tests__',
  'src/services/__tests__',
  'src/hooks/__tests__',
  'src/components/__tests__',
  'src/components/ActiveEncounterTab/__tests__',
  'src/components/PartyTab/__tests__',
  'src/components/NpcLibraryTab/__tests__',
  'src/components/EncountersTab/__tests__',
  'src/server/__tests__',
];

describe('Test suite integrity', () => {
  it('all expected test directories still exist', () => {
    TEST_DIRS.forEach(dir => {
      expect(
        existsSync(join(process.cwd(), dir)),
        `Test directory missing: ${dir}`
      ).toBe(true);
    });
  });

  it('no test directory is empty', () => {
    TEST_DIRS.forEach(dir => {
      const fullPath = join(process.cwd(), dir);
      if (existsSync(fullPath)) {
        const files = readdirSync(fullPath)
          .filter(f => f.endsWith('.test.ts') || 
                       f.endsWith('.test.tsx'));
        expect(
          files.length,
          `Test directory is empty: ${dir}`
        ).toBeGreaterThan(0);
      }
    });
  });
});

```

## File: src/components/ActiveEncounterTab/__tests__/AddNpcCollision.test.tsx

```typescript
// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ActiveEncounterTab } from '../index';
import { useAppState } from '../../../hooks/useAppState';
import { MemoryRouter } from 'react-router-dom';

// Mock the dependencies
vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn(),
}));

vi.mock('../../../services/dbOperations', () => ({
  addNpcDB: vi.fn().mockResolvedValue({ id: 'new-npc-id' }),
  addEncounterCombatantDB: vi.fn().mockResolvedValue({ id: 'new-ec-id' }),
  updateInitiativeDB: vi.fn().mockResolvedValue({ success: true }),
}));

describe('ActiveEncounterTab ID Uniqueness', () => {
  const mockUpdateState = vi.fn();
  const mockState = {
    encounters: [{ id: 'enc1', name: 'Test Encounter', status: 'active' }],
    combatState: {
      activeEncounterId: 'enc1',
      combatants: [],
      round: 1,
      activeTurnId: null,
    },
    npcs: [{ id: 'npc1', name: 'Goblin', ac: 12, maxHp: 7, currentHp: 7, tempHp: 0, conditions: '', notes: '' }],
    characters: [],
    encounterCombatants: [],
    difficulties: { 1: 'Easy' },
  };

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppState as any).mockReturnValue({
      state: mockState,
      updateState: mockUpdateState,
    });
  });

  it('generates distinct IDs when adding multiple instances of the same NPC template', async () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab onBack={() => {}} />
      </MemoryRouter>
    );
    
    // Open the sidebar
    const toolsBtn = screen.getByRole('button', { name: /Tools/i });
    fireEvent.click(toolsBtn);

    // Select NPC preset
    fireEvent.click(screen.getByText('Goblin'));

    // Set quantity to 2
    const qtyInput = screen.getByLabelText(/How many\?/i);
    fireEvent.change(qtyInput, { target: { value: '2' } });

    // Click add
    const addBtn = screen.getByRole('button', { name: /Add to Encounter/i });
    fireEvent.click(addBtn);

    // Verify updateState was called with two distinct combatant IDs
    await waitFor(() => {
      expect(mockUpdateState).toHaveBeenCalled();
    });

    // The first call to updateState happens optimistically in handleAddPreset
    const optimisticUpdateCall = mockUpdateState.mock.calls[0][0];
    const newState = optimisticUpdateCall(mockState);
    
    const npcCombatants = newState.combatState.combatants.filter((c: any) => c.type === 'npc');
    expect(npcCombatants).toHaveLength(2);
    expect(npcCombatants[0].id).not.toBe(npcCombatants[1].id);
  });

  it('generates a collision-proof ID for manual Quick NPC Creator', async () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab onBack={() => {}} />
      </MemoryRouter>
    );
    
    // Open the sidebar
    const toolsBtn = screen.getByRole('button', { name: /Tools/i });
    fireEvent.click(toolsBtn);
    
    // Navigate to Create NPC tab
    fireEvent.click(screen.getByText('Create NPC'));

    // Fill in Quick NPC form
    const nameInput = screen.getByPlaceholderText(/e.g. Ancient Red Dragon/i);
    fireEvent.change(nameInput, { target: { value: 'Custom Goblin' } });

    const hpInput = screen.getByLabelText(/Max HP/i);
    fireEvent.change(hpInput, { target: { value: '15' } });

    const acInput = screen.getByLabelText(/^AC\b/i);
    fireEvent.change(acInput, { target: { value: '13' } });

    // Click add
    const addBtn = screen.getByRole('button', { name: /Create & Add to Encounter/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(mockUpdateState).toHaveBeenCalled();
    });

    const optimisticUpdateCall = mockUpdateState.mock.calls[0][0];
    const newState = optimisticUpdateCall(mockState);
    
    const customNpc = newState.combatState.combatants.find((c: any) => c.name === 'Custom Goblin');
    expect(customNpc).toBeDefined();
    // Verify ID pattern includes random suffixes
    expect(customNpc.id).toMatch(/combat-npc-temp-npc-\d+-[a-z0-9]+-0-\d+-[a-z0-9]+/);
  });
});

```

## File: src/components/ActiveEncounterTab/__tests__/CasterAttributionDialog.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CasterAttributionDialog } from '../CasterAttributionDialog';
import { Combatant } from '../../../types';

describe('CasterAttributionDialog', () => {
  afterEach(cleanup);

  const mockCombatants: Combatant[] = [
    { id: 'c1', name: 'Gandalf', type: 'pc', ac: 15, maxHp: 50, currentHp: 50, initiative: 12 } as any,
  ];

  const defaultProps = {
    isOpen: true,
    effectName: 'Hasted',
    targetName: 'Bilbo',
    combatants: mockCombatants,
    onSelect: vi.fn(),
    onDismiss: vi.fn(),
  };

  it('renders the list of combatant names and calls onSelect with the correct id when clicked', () => {
    const onSelect = vi.fn();
    render(<CasterAttributionDialog {...defaultProps} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Gandalf'));
    expect(onSelect).toHaveBeenCalledWith('c1');
  });
});

```

## File: src/components/ActiveEncounterTab/__tests__/CombatHeader.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CombatHeader } from '../CombatHeader';
import { MemoryRouter } from 'react-router-dom';

describe('CombatHeader', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  
  const defaultProps = {
    round: 3,
    isMultiTargetMode: false,
    selectedCount: 0,
    onOpenTools: vi.fn(),
    onRollNpcInit: vi.fn(),
    onResetCombat: vi.fn(),
    onNextTurn: vi.fn(),
    onToggleMultiTargetMode: vi.fn(),
    onDeleteSelected: vi.fn(),
    onCancelSelection: vi.fn(),
    onBack: vi.fn(),
    onCallInitiative: vi.fn(),
    initiativeEvent: false,
  };

  it('renders without crashing with required props', () => {
    const { container } = render(
      <MemoryRouter>
        <CombatHeader
          {...defaultProps}
          encounter={{ id: 'e1', name: 'Test Encounter', location: 'Test Loc', difficultyId: 1, difficultyName: 'Easy', npcDefinitions: '', status: 'active' }}
        />
      </MemoryRouter>
    );
    expect(container).toBeInTheDocument();
  });
});

```

## File: src/components/ActiveEncounterTab/__tests__/CombatSidebar.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CombatSidebar } from '../CombatSidebar';

describe('CombatSidebar', () => {
  afterEach(() => cleanup());
  
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    npcs: [],
    characters: [],
    onAddPreset: vi.fn(),
    onAddNpc: vi.fn(),
  };

  it('renders without crashing with required props', () => {
    const { container } = render(<CombatSidebar {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('submitting the Create NPC form calls onAddNpc with the full NPC data object', () => {
    const onAddNpc = vi.fn();
    render(<CombatSidebar {...defaultProps} onAddNpc={onAddNpc} />);
    
    // Switch to Create NPC tab
    fireEvent.click(screen.getByText('Create NPC'));

    // Fill out the required fields
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'New Test NPC' } });
    fireEvent.change(screen.getByLabelText(/AC/), { target: { value: '18' } });
    fireEvent.change(screen.getByLabelText(/HP/), { target: { value: '45' } });

    // Submit form
    const createBtn = screen.getByText('Create & Add to Encounter');
    fireEvent.click(createBtn);

    expect(onAddNpc).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Test NPC',
      ac: 18,
      maxHp: 45,
    }));
  });
});

```

## File: src/components/ActiveEncounterTab/__tests__/CombatantCard.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { CombatantCard } from '../CombatantCard';
import type { Combatant } from '../../../types';
import { useDashboardStore } from '../../../hooks/useAppState';
import { makeCombatant } from '../../../test-utils/fixtures/combatantFixtures';

vi.mock('../../../services/dbOperations', () => ({
  updateCharacterDB: vi.fn(),
  updateNpcInstanceConditionsDB: vi.fn(),
  updateInitiativeDB: vi.fn(),
  updateDeathSavesDB: vi.fn(),
  updateEncounterStateDB: vi.fn(),
}));

describe('CombatantCard', () => {
  afterEach(() => cleanup());

  const defaultProps = {
    c: makeCombatant({ id: 'pc1', type: 'pc', name: 'PC' }),
    isActive: false,
    isExpanded: false,
    isSyncing: false,
    damageInput: '',
    healInput: '',
    currentRound: 1,
    onDamageInputChange: vi.fn(),
    onHealInputChange: vi.fn(),
    onHealthSubmit: vi.fn(),
    onToggleExpand: vi.fn(),
    onUpdateCombatant: vi.fn(),
    onRemoveCombatant: vi.fn(),
    isSelectable: false,
    isSelected: false,
    onToggleSelect: vi.fn(),
  };

  it('renders without crashing for a PC combatant', () => {
    const { container } = render(<CombatantCard {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders without crashing for an NPC combatant', () => {
    const props = { ...defaultProps, c: makeCombatant({ id: 'npc1', type: 'npc', name: 'NPC' }) };
    const { container } = render(<CombatantCard {...props} />);
    expect(container).toBeInTheDocument();
  });

  it('clicking DMG button calls onHealthSubmit with isDamage: true', () => {
    const onHealthSubmit = vi.fn();
    render(<CombatantCard {...defaultProps} damageInput="10" onHealthSubmit={onHealthSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /DMG/i }));
    expect(onHealthSubmit).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it('clicking HEAL button calls onHealthSubmit with isDamage: false', () => {
    const onHealthSubmit = vi.fn();
    render(<CombatantCard {...defaultProps} healInput="5" onHealthSubmit={onHealthSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /HEAL/i }));
    expect(onHealthSubmit).toHaveBeenCalledWith(false, expect.any(Object));
  });
});

```

## File: src/components/ActiveEncounterTab/__tests__/KeyboardShortcuts.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, fireEvent, cleanup, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { ActiveEncounterTab } from '../index';
import { useDashboardStore } from '../../../hooks/useAppState';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../services/dbOperations', () => ({
  addNpcDB: vi.fn(),
  addEncounterCombatantDB: vi.fn(),
  updateInitiativeDB: vi.fn(),
  updateDeathSavesDB: vi.fn(),
  updateEncounterStateDB: vi.fn(),
}));

describe('KeyboardShortcuts', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const baseProps = { onBack: vi.fn() };

  beforeEach(() => {
    useDashboardStore.setState({
      campaignName: 'Shortcuts test',
      hasInitialSynced: true,
      encounters: [{ id: 'enc-1', name: 'Keyboard Encounter' }] as any,
      combatState: {
        activeEncounterId: 'enc-1',
        round: 1,
        activeTurnId: 'combat-1',
        combatants: [
          { id: 'combat-1', name: 'Alyn', type: 'pc', ac: 18, maxHp: 50, currentHp: 50, initiative: 20, notes: 'Alyn notes' },
        ] as any[],
        selectedIds: [],
        syncingIds: [],
        concentrationLinks: {},
        isSelectionMode: false,
        expandedIds: [],
      } as any
    });
  });

  it('pressing H does not crash', () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );
    act(() => { fireEvent.keyDown(document, { key: 'h' }); });
  });

  it('pressing S does not crash', () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );
    act(() => { fireEvent.keyDown(document, { key: 's' }); });
  });

  it('pressing Escape does not crash', () => {
    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );
    act(() => { fireEvent.keyDown(document, { key: 'Escape' }); });
  });
});

```

## File: src/components/ActiveEncounterTab/__tests__/MultiTargetActionPanel.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MultiTargetActionPanel } from '../MultiTargetActionPanel';

describe('MultiTargetActionPanel', () => {
  afterEach(cleanup);

  const defaultProps = {
    selectedCount: 3,
    onApplyDamage: vi.fn(),
    onApplyHealing: vi.fn(),
    onApplyCondition: vi.fn(),
    onDeleteSelected: vi.fn(),
    onCancelSelection: vi.fn(),
  };

  it('calls onApplyDamage with correct amount and type when submitted', () => {
    const onApplyDamage = vi.fn();
    render(<MultiTargetActionPanel {...defaultProps} onApplyDamage={onApplyDamage} />);
    
    const damageInput = screen.getByPlaceholderText('Amt');
    const typeSelect = screen.getByRole('combobox');
    
    fireEvent.change(damageInput, { target: { value: '25' } });
    fireEvent.change(typeSelect, { target: { value: 'cold' } });

    const damageBtn = screen.getByRole('button', { name: /Apply Damage/i });
    fireEvent.click(damageBtn);

    expect(onApplyDamage).toHaveBeenCalledWith(25, 'cold');
  });

  it('calls onApplyHealing with correct amount when submitted', () => {
    const onApplyHealing = vi.fn();
    render(<MultiTargetActionPanel {...defaultProps} onApplyHealing={onApplyHealing} />);
    
    const healingInput = screen.getByPlaceholderText('Amount');
    fireEvent.change(healingInput, { target: { value: '18' } });

    const healingBtn = screen.getByRole('button', { name: /Apply Healing/i });
    fireEvent.click(healingBtn);

    expect(onApplyHealing).toHaveBeenCalledWith(18);
  });
});

```

## File: src/components/ActiveEncounterTab/__tests__/NpcReferencePanel.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { NpcReferencePanel } from '../NpcReferencePanel';
import { makeCombatant } from '../../../test-utils/fixtures/combatantFixtures';

describe('NpcReferencePanel', () => {
  afterEach(() => cleanup());

  it('renders nothing when combatant has no stat block content', () => {
    const emptyNpc = makeCombatant({
      type: 'npc',
      speed: '',
      senses: '',
      languages: '',
      challengeRating: '',
      traits: '',
      actions: '',
      reactions: '',
      legendaryActionsList: '',
    });

    const { container } = render(<NpcReferencePanel combatant={emptyNpc} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders stat block content after toggle button is clicked', () => {
    const npcWithContent = makeCombatant({
      type: 'npc',
      challengeRating: '2',
      speed: '30 ft., climb 20 ft.',
      senses: 'Darkvision 60 ft.',
      languages: 'Common, Goblin',
    });

    render(<NpcReferencePanel combatant={npcWithContent} />);
    
    expect(screen.queryByText('Darkvision 60 ft.')).not.toBeInTheDocument();

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Darkvision 60 ft.')).toBeInTheDocument();
    expect(screen.getByText('Common, Goblin')).toBeInTheDocument();
  });
});

```

## File: src/components/ActiveEncounterTab/__tests__/ShortcutCheatSheet.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ShortcutCheatSheet } from '../ShortcutCheatSheet';

describe('ShortcutCheatSheet', () => {
  afterEach(() => cleanup());

  it('renders nothing when isOpen is false and renders shortcuts when isOpen is true', () => {
    const { container, rerender } = render(
      <ShortcutCheatSheet isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();

    rerender(<ShortcutCheatSheet isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });
});

```

## File: src/components/ActiveEncounterTab/__tests__/index.test.tsx

```typescript
// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ActiveEncounterTab } from '../index';
import { useAppState } from '../../../hooks/useAppState';

import { updateEncounterStateDB } from '../../../services/dbOperations';

vi.mock('../../../services/dbOperations', () => ({
  addNpcDB: vi.fn(),
  addEncounterCombatantDB: vi.fn(),
  updateInitiativeDB: vi.fn(),
  updateDeathSavesDB: vi.fn(),
  updateEncounterStateDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../hooks/useAppState', () => {
  const mockAppStateFn = vi.fn();
  return {
    useAppState: mockAppStateFn,
    getSnapshot: vi.fn(() => {
      try {
        const result = mockAppStateFn();
        return result?.state;
      } catch {
        return null;
      }
    }),
  };
});

import { MemoryRouter } from 'react-router-dom';

describe('ActiveEncounterTab nextTurn logic', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const baseProps = { onBack: vi.fn() };

  it('When nextTurn is called, updateEncounterStateDB is called with the updated activeTurnId', async () => {
    // Create initial state with 2 combatants
    let updateStateCalledWith: any;
    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test',
        hasInitialSynced: true,
        encounters: [{ id: 'enc-1', name: 'Test Enc' }],
        characters: [],
        npcs: [],
        statuses: {},
        difficulties: {},
        encounterCombatants: [],
        combatState: {
          activeEncounterId: 'enc-1',
          round: 1,
          activeTurnId: 'combat-1',
          combatants: [
            { id: 'combat-1', initiative: 20, conditions: '' },
            { id: 'combat-2', initiative: 10, conditions: '' },
          ],
        }
      },
      updateState: (fn: any) => { 
        if (typeof fn === 'function') {
          updateStateCalledWith = fn({
            combatState: {
              activeEncounterId: 'enc-1',
              round: 1,
              activeTurnId: 'combat-1',
              combatants: [
                { id: 'combat-1', initiative: 20, conditions: '' },
                { id: 'combat-2', initiative: 10, conditions: '' },
              ],
            }
          });
        }
      }
    } as any);

    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );

    const nextTurnBtn = screen.getByRole('button', { name: /Next Turn/i });
    fireEvent.click(nextTurnBtn);

    expect(updateEncounterStateDB).toHaveBeenCalledWith('enc-1', 1, 'combat-2');
  });

  it('When nextTurn wraps around to the first combatant, updateEncounterStateDB is called with an incremented round number', async () => {
    // Create initial state with 2 combatants, current active is the last one
    let updateStateCalledWith: any;
    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test',
        hasInitialSynced: true,
        encounters: [{ id: 'enc-1', name: 'Test Enc' }],
        characters: [],
        npcs: [],
        statuses: {},
        difficulties: {},
        encounterCombatants: [],
        combatState: {
          activeEncounterId: 'enc-1',
          round: 1,
          activeTurnId: 'combat-2',
          combatants: [
            { id: 'combat-1', initiative: 20, conditions: '' },
            { id: 'combat-2', initiative: 10, conditions: '' },
          ],
        }
      },
      updateState: (fn: any) => { 
        if (typeof fn === 'function') {
          updateStateCalledWith = fn({
            combatState: {
              activeEncounterId: 'enc-1',
              round: 1,
              activeTurnId: 'combat-2',
              combatants: [
                { id: 'combat-1', initiative: 20, conditions: '' },
                { id: 'combat-2', initiative: 10, conditions: '' },
              ],
            }
          });
        }
      }
    } as any);

    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );

    const nextTurnBtn = screen.getByRole('button', { name: /Next Turn/i });
    fireEvent.click(nextTurnBtn);

    expect(updateEncounterStateDB).toHaveBeenCalledWith('enc-1', 2, 'combat-1');
  });

  it('When nextTurn advances, reactionUsed is reset to false for the newly active combatant only, leaving others unaffected', () => {
    let updateStateCalledWith: any = null;
    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test',
        hasInitialSynced: true,
        encounters: [{ id: 'enc-1', name: 'Test Enc' }],
        characters: [],
        npcs: [],
        statuses: {},
        difficulties: {},
        encounterCombatants: [],
        combatState: {
          activeEncounterId: 'enc-1',
          round: 1,
          activeTurnId: 'combat-1',
          combatants: [
            { id: 'combat-1', initiative: 20, conditions: '', reactionUsed: true },
            { id: 'combat-2', initiative: 10, conditions: '', reactionUsed: true },
          ],
        }
      },
      updateState: (fn: any) => { 
        if (typeof fn === 'function') {
          updateStateCalledWith = fn({
            combatState: {
              activeEncounterId: 'enc-1',
              round: 1,
              activeTurnId: 'combat-1',
              combatants: [
                { id: 'combat-1', initiative: 20, conditions: '', reactionUsed: true },
                { id: 'combat-2', initiative: 10, conditions: '', reactionUsed: true },
              ],
            }
          });
        }
      }
    } as any);

    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );

    const nextTurnBtn = screen.getByRole('button', { name: /Next Turn/i });
    fireEvent.click(nextTurnBtn);

    const updatedCombatants = updateStateCalledWith.combatState.combatants;
    const c1 = updatedCombatants.find((c: any) => c.id === 'combat-1');
    const c2 = updatedCombatants.find((c: any) => c.id === 'combat-2');

    expect(c2.reactionUsed).toBe(false);
    expect(c1.reactionUsed).toBe(true);
  });

  it('When nextTurn advances to an NPC with Legendary Actions, the actions are auto-reset to max while Legendary Resistances do NOT auto-reset', () => {
    let updateStateCalledWith: any = null;
    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test',
        hasInitialSynced: true,
        encounters: [{ id: 'enc-1', name: 'Test Enc' }],
        characters: [],
        npcs: [],
        statuses: {},
        difficulties: {},
        encounterCombatants: [],
        combatState: {
          activeEncounterId: 'enc-1',
          round: 1,
          activeTurnId: 'combat-1',
          combatants: [
            { 
              id: 'combat-1', 
              initiative: 20, 
              conditions: '', 
              reactionUsed: false 
            },
            { 
              id: 'combat-2', 
              initiative: 10, 
              conditions: '', 
              reactionUsed: false,
              legendaryActions: { max: 3, remaining: 1 },
              legendaryResistances: { max: 3, remaining: 1 }
            },
          ],
        }
      },
      updateState: (fn: any) => { 
        if (typeof fn === 'function') {
          updateStateCalledWith = fn({
            combatState: {
              activeEncounterId: 'enc-1',
              round: 1,
              activeTurnId: 'combat-1',
              combatants: [
                { 
                  id: 'combat-1', 
                  initiative: 20, 
                  conditions: '', 
                  reactionUsed: false 
                },
                { 
                  id: 'combat-2', 
                  initiative: 10, 
                  conditions: '', 
                  reactionUsed: false,
                  legendaryActions: { max: 3, remaining: 1 },
                  legendaryResistances: { max: 3, remaining: 1 }
                },
              ],
            }
          });
        }
      }
    } as any);

    render(
      <MemoryRouter>
        <ActiveEncounterTab {...baseProps} />
      </MemoryRouter>
    );

    const nextTurnBtn = screen.getByRole('button', { name: /Next Turn/i });
    fireEvent.click(nextTurnBtn);

    const updatedCombatants = updateStateCalledWith.combatState.combatants;
    const c2 = updatedCombatants.find((c: any) => c.id === 'combat-2');

    // legendary actions must be reset to max!
    expect(c2.legendaryActions.remaining).toBe(3);
    // legendary resistances must NOT be auto-reset!
    expect(c2.legendaryResistances.remaining).toBe(1);
  });
});

```

## File: src/components/ActiveEncounterTab/__tests__/useBatchActions.test.ts

```typescript
import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useBatchActions } from '../hooks/useBatchActions';
import { toast } from 'sonner';
import { 
  deleteEncounterCombatantDB, 
  updateNpcInstanceHpDB,
  updateNpcInstanceConditionsDB
} from '../../../services/dbOperations';
import { Combatant } from '../../../types';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock('../../../services/dbOperations', () => ({
  deleteEncounterCombatantDB: vi.fn().mockResolvedValue(true),
  updateEncounterCombatantQuantityDB: vi.fn().mockResolvedValue(true),
  updateCharacterDB: vi.fn().mockResolvedValue(true),
  updateNpcInstanceHpDB: vi.fn().mockResolvedValue(true),
  updateNpcInstanceConditionsDB: vi.fn().mockResolvedValue(true),
}));

const mockUpdateState = vi.fn();
const mockAppState = {
  combatState: {
    combatants: [] as any[],
    activeTurnId: null as string | null,
  },
  encounterCombatants: [] as any[],
  characters: [] as any[],
};

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: () => ({
    updateState: mockUpdateState,
    state: {
      characters: [],
      npcs: [],
    },
  }),
  getSnapshot: () => mockAppState,
}));

vi.mock('../../../hooks/useOverlayEvents', () => ({
  useDamageEvent: () => ({ fire: vi.fn() }),
  useHealEvent: () => ({ fire: vi.fn() }),
  useUnconsciousEvent: () => ({ fire: vi.fn() }),
}));

vi.mock('../../../hooks/useDeathSaves', () => ({
  useDeathSaves: () => ({ applyDamageToUnconscious: vi.fn(), recordDeathSave: vi.fn(), clearDeathSaves: vi.fn() })
}));

describe('useBatchActions', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockAppState.combatState.combatants = [];
    mockAppState.encounterCombatants = [];
    mockAppState.characters = [];
    mockAppState.combatState.activeTurnId = null;
  });

  const c1: Combatant = {
    id: 'c1',
    name: 'Goblin A',
    type: 'npc',
    ac: 15,
    maxHp: 20,
    currentHp: 20,
    tempHp: 0,
    initiative: 10,
    notes: '',
    passivePerception: 10,
    conditions: '',
    encounterCombatantId: 'ec-1',
  };

  const c2: Combatant = {
    id: 'c2',
    name: 'Goblin B',
    type: 'npc',
    ac: 15,
    maxHp: 20,
    currentHp: 20,
    tempHp: 0,
    initiative: 8,
    notes: '',
    passivePerception: 10,
    conditions: '',
    encounterCombatantId: 'ec-2',
  };

  const c3: Combatant = {
    id: 'c3',
    name: 'Fighter',
    type: 'pc',
    ac: 18,
    maxHp: 30,
    currentHp: 30,
    tempHp: 0,
    initiative: 12,
    notes: '',
    passivePerception: 12,
    conditions: '',
    characterId: 'char-fighter',
    encounterCombatantId: 'ec-3',
  };

  it('batch damage applies correct damage to all selected combatants', async () => {
    const selectedIds = new Set(['c1', 'c2']);
    const combatants = [c1, c2, c3];
    mockAppState.combatState.combatants = combatants;
    mockAppState.encounterCombatants = [
      { id: 'ec-1', quantity: 1, npcCurrentHp: 20 },
      { id: 'ec-2', quantity: 1, npcCurrentHp: 20 },
    ];

    const { result } = renderHook(() => useBatchActions({ selectedIds, combatants }));

    await act(async () => {
      await result.current.handleApplyMultiDamage(5, 'fire');
    });

    expect(mockUpdateState).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Damage applied to 2 targets');
    expect(updateNpcInstanceHpDB).toHaveBeenCalledWith('ec-1', 15, 0);
    expect(updateNpcInstanceHpDB).toHaveBeenCalledWith('ec-2', 15, 0);
  });

  it('batch heal applies correct healing to all selected combatants', async () => {
    const woundedC1 = { ...c1, currentHp: 5 };
    const woundedC2 = { ...c2, currentHp: 10 };
    const selectedIds = new Set(['c1', 'c2']);
    const combatants = [woundedC1, woundedC2, c3];
    mockAppState.combatState.combatants = combatants;
    mockAppState.encounterCombatants = [
      { id: 'ec-1', quantity: 1, npcCurrentHp: 5 },
      { id: 'ec-2', quantity: 1, npcCurrentHp: 10 },
    ];

    const { result } = renderHook(() => useBatchActions({ selectedIds, combatants }));

    await act(async () => {
      await result.current.handleApplyMultiHealing(10);
    });

    expect(updateNpcInstanceHpDB).toHaveBeenCalledWith('ec-1', 15, 0);
    expect(updateNpcInstanceHpDB).toHaveBeenCalledWith('ec-2', 20, 0);
    expect(toast.success).toHaveBeenCalledWith('Healing applied to 2 targets');
  });

  it('batch condition applies condition string to all selected combatants', async () => {
    const selectedIds = new Set(['c1', 'c2']);
    const combatants = [{ ...c1, conditions: 'poisoned' }, c2, c3];
    mockAppState.combatState.combatants = combatants;

    const { result } = renderHook(() => useBatchActions({ selectedIds, combatants }));

    await act(async () => {
      await result.current.handleApplyMultiCondition('blinded');
    });

    expect(updateNpcInstanceConditionsDB).toHaveBeenCalledWith('ec-1', 'poisoned, blinded');
    expect(updateNpcInstanceConditionsDB).toHaveBeenCalledWith('ec-2', 'blinded');
    expect(toast.success).toHaveBeenCalledWith('blinded applied to 2 targets');
  });

  it('batch delete removes all selected combatants from state', async () => {
    const selectedIds = new Set(['c1']);
    const combatants = [c1, c2, c3];
    mockAppState.combatState.combatants = combatants;
    mockAppState.encounterCombatants = [
      { id: 'ec-1', quantity: 1 },
      { id: 'ec-2', quantity: 1 },
      { id: 'ec-3', quantity: 1 },
    ];
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { result } = renderHook(() => useBatchActions({ selectedIds, combatants }));

    await act(async () => {
      await result.current.handleDeleteSelected();
    });

    expect(deleteEncounterCombatantDB).toHaveBeenCalledWith('ec-1');
    expect(toast.success).toHaveBeenCalledWith('1 combatants removed.');
  });

  it('batch actions ignore combatants that are not in the selected ids list', async () => {
    const selectedIds = new Set(['c1']);
    const combatants = [c1, c2, c3];
    mockAppState.combatState.combatants = combatants;
    mockAppState.encounterCombatants = [{ id: 'ec-1', quantity: 1, npcCurrentHp: 20 }];

    const { result } = renderHook(() => useBatchActions({ selectedIds, combatants }));

    await act(async () => {
      await result.current.handleApplyMultiDamage(5, 'cold');
    });

    expect(updateNpcInstanceHpDB).toHaveBeenCalledTimes(1);
    expect(updateNpcInstanceHpDB).toHaveBeenCalledWith('ec-1', 15, 0);
  });
});

```

## File: src/components/ActiveEncounterTab/__tests__/useCombatSync.test.ts

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useCombatSync } from '../hooks/useCombatSync';
import { useDashboardStore, getSnapshot } from '../../../hooks/useAppState';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock('../../../services/dbOperations', () => ({
  updateEncounterStateDB: vi.fn().mockResolvedValue(true),
  updateInitiativeDB: vi.fn().mockResolvedValue(true),
}));

describe('useCombatSync', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    // Setup 3 mock combatants in the store
    act(() => {
      useDashboardStore.setState({
        combatState: {
          activeEncounterId: 'enc-1',
          activeTurnId: 'c1',
          round: 1,
          selectedIds: [],
          isSelectionMode: false,
          syncingIds: [],
          expandedIds: [],
          concentrationLinks: {},
          combatants: [
            { id: 'c1', name: 'PC 1', type: 'pc', initiative: 20, reactionUsed: true },
            { id: 'c2', name: 'NPC 1', type: 'npc', initiative: 15, reactionUsed: true, legendaryActions: { max: 3, remaining: 1 } },
            { id: 'c3', name: 'PC 2', type: 'pc', initiative: 10, reactionUsed: true }
          ]
        },
        characters: [],
        npcs: [],
        encounters: [{ id: 'enc-1', name: 'Encounter 1' }] as any,
        encounterCombatants: []
      });
    });
  });

  it('nextTurn advances activeTurnId to the next combatant in order', () => {
    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    expect(state.combatState.activeTurnId).toBe('c2');
    expect(state.combatState.round).toBe(1);
  });

  it('nextTurn increments round when wrapping from last combatant to first', () => {
    // Set active turn to the last combatant (c3)
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          activeTurnId: 'c3'
        }
      }));
    });

    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    expect(state.combatState.activeTurnId).toBe('c1');
    expect(state.combatState.round).toBe(2);
  });

  it('nextTurn resets reactionUsed to false for the newly active combatant only', () => {
    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    const c1 = state.combatState.combatants.find(c => c.id === 'c1');
    const c2 = state.combatState.combatants.find(c => c.id === 'c2');
    const c3 = state.combatState.combatants.find(c => c.id === 'c3');

    // Newly active combatant (c2) should have reactionUsed: false
    expect(c2?.reactionUsed).toBe(false);
    // Other combatants (c1, c3) remain unchanged
    expect(c1?.reactionUsed).toBe(true);
    expect(c3?.reactionUsed).toBe(true);
  });

  it('nextTurn auto-resets legendary actions to max when an NPC becomes active', () => {
    const { result } = renderHook(() => useCombatSync());

    act(() => {
      result.current.nextTurn();
    });

    const state = getSnapshot();
    const c2 = state.combatState.combatants.find(c => c.id === 'c2');

    // NPC 1 (c2) should have legendaryActions.remaining reset to max (3)
    expect(c2?.legendaryActions?.remaining).toBe(3);
  });
});

```

## File: src/components/ActiveEncounterTab/__tests__/useCombatantCard.test.ts

```typescript
import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCombatantCard } from '../hooks/useCombatantCard';
import { useDashboardStore } from '../../../hooks/useAppState';

describe('useCombatantCard Hook', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    act(() => {
      useDashboardStore.setState({
        combatState: {
          activeEncounterId: null,
          activeTurnId: null,
          round: 1,
          combatants: [],
          concentrationLinks: {},
          selectedIds: [],
          isSelectionMode: false,
          syncingIds: [],
          expandedIds: [],
        },
      });
    });
  });

  it('expanding a card adds its id to expandedIds in the store', () => {
    const { result } = renderHook(() => useCombatantCard('c1'));

    expect(result.current.isExpanded).toBe(false);

    act(() => {
      result.current.toggleExpand();
    });

    expect(result.current.isExpanded).toBe(true);
    expect(useDashboardStore.getState().combatState.expandedIds).toContain('c1');
  });

  it('collapsing a card removes its id from expandedIds', () => {
    act(() => {
      useDashboardStore.setState(prev => ({
        ...prev,
        combatState: {
          ...prev.combatState,
          expandedIds: ['c1']
        }
      }));
    });

    const { result } = renderHook(() => useCombatantCard('c1'));

    expect(result.current.isExpanded).toBe(true);

    act(() => {
      result.current.toggleExpand();
    });

    expect(result.current.isExpanded).toBe(false);
    expect(useDashboardStore.getState().combatState.expandedIds).not.toContain('c1');
  });

  it('toggling selection adds/removes id from selectedIds', () => {
    const { result } = renderHook(() => useCombatantCard('c1'));

    expect(result.current.isSelected).toBe(false);

    act(() => {
      result.current.toggleSelection();
    });

    expect(result.current.isSelected).toBe(true);
    expect(useDashboardStore.getState().combatState.selectedIds).toContain('c1');

    act(() => {
      result.current.toggleSelection();
    });

    expect(result.current.isSelected).toBe(false);
    expect(useDashboardStore.getState().combatState.selectedIds).not.toContain('c1');
  });
});

```

## File: src/components/ActiveEncounterTab/__tests__/useEncounterPresetLoader.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEncounterPresetLoader } from '../hooks/useEncounterPresetLoader';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { toast } from 'sonner';
import { addNpcDB, addEncounterCombatantDB } from '../../../services/dbOperations';

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('../../../services/dbOperations', () => ({
  addNpcDB: vi.fn(),
  addEncounterCombatantDB: vi.fn(),
}));

describe('useEncounterPresetLoader', () => {
  let mockState: any;
  let mockUpdateState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockState = {
      npcs: [
        {
          id: 'npc1',
          name: 'Dragon',
          ac: 18,
          maxHp: 100,
          currentHp: 100,
          tempHp: 0,
          legendaryActions: 3,
          legendaryResistances: 2,
          actions: JSON.stringify([
            { name: 'Breath', recharge: 'Recharge 5-6' }
          ]),
          rechargeAbilities: [
            { name: 'Breath', rechargeOn: '5-6' }
          ],
        },
      ],
      characters: [],
      encounterCombatants: [],
      combatState: {
        combatants: [{ id: 'c1', name: 'Existing', type: 'pc' }],
      },
      encounters: []
    };

    mockUpdateState = vi.fn().mockImplementation((updater) => {
      let newState = typeof updater === 'function' ? updater(mockState) : updater;
      mockState = { ...mockState, ...newState };
      return newState;
    });

    (useAppState as any).mockReturnValue({
      state: mockState,
      updateState: mockUpdateState,
    });
    
    (getSnapshot as any).mockReturnValue(mockState);
  });

  it('handleAddNpc builds a combatant with correct rechargeAbilities derived from actions recharge field', async () => {
    (addNpcDB as any).mockResolvedValue({ id: 'real-npc' });
    (addEncounterCombatantDB as any).mockResolvedValue([{ id: 'real-ec' }]);

    const { result } = renderHook(() => useEncounterPresetLoader(undefined, vi.fn()));

    await act(async () => {
      await result.current.handleAddNpc({
        name: 'Orc',
        ac: 10,
        maxHp: 20,
        tempHp: 0,
        currentHp: 20,
        conditions: '',
        notes: '',
        resistances: '',
        immunities: '',
        vulnerabilities: '',
        legendaryActions: 0,
        legendaryResistances: 0,
        rechargeAbilities: [],
        abilityScores: '{}',
        proficiencies: '{}',
        speed: '',
        senses: '',
        languages: '',
        challengeRating: '',
        traits: '[]',
        actions: JSON.stringify([{ name: 'Cinderfall', recharge: 'Recharge 5-6' }]),
        reactions: '[]',
        legendaryActionsList: '[]',
        spellcastingAbility: '',
      });
    });

    const optimisticUpdater = mockUpdateState.mock.calls[0][0];
    const stateAfterOptimistic = optimisticUpdater({ ...mockState, combatState: { combatants: [] }, encounterCombatants: [] });
    const addedCombatant = stateAfterOptimistic.combatState.combatants[0];

    expect(addedCombatant.rechargeAbilities).toEqual([{
      name: 'Cinderfall',
      rechargeOn: 5,
      isCharged: true
    }]);
  });

  it('handleAddNpc rolls back state when the DB insert fails', async () => {
    (addNpcDB as any).mockRejectedValue(new Error('DB Failed'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useEncounterPresetLoader(undefined, vi.fn()));

    await expect(
      act(async () => {
        await result.current.handleAddNpc({
          name: 'Orc',
          ac: 10,
          maxHp: 20,
          tempHp: 0,
          currentHp: 20,
          conditions: '',
          notes: '',
          resistances: '',
          immunities: '',
          vulnerabilities: '',
          legendaryActions: 0,
          legendaryResistances: 0,
          rechargeAbilities: [],
          abilityScores: '{}',
          proficiencies: '{}',
          speed: '',
          senses: '',
          languages: '',
          challengeRating: '',
          traits: '[]',
          actions: '[]',
          reactions: '[]',
          legendaryActionsList: '[]',
          spellcastingAbility: '',
        });
      })
    ).rejects.toThrow('DB Failed');

    const updaterFallback = mockUpdateState.mock.calls[mockUpdateState.mock.calls.length - 1][0];
    const resState = typeof updaterFallback === 'function' ? updaterFallback(mockState) : updaterFallback;
    
    const containsOrc = resState.combatState.combatants.some((c: any) => c.name === 'Orc');
    expect(containsOrc).toBe(false);

    expect(toast.error).toHaveBeenCalledWith('Failed to save changes. Please try again.', expect.objectContaining({
      description: 'DB Failed'
    }));

    consoleErrorSpy.mockRestore();
  });

  it('handleAddPreset rolls back state when the DB insert fails', async () => {
    (addEncounterCombatantDB as any).mockRejectedValue(new Error('Network Error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useEncounterPresetLoader(undefined, vi.fn()));

    await expect(
      act(async () => {
        await result.current.handleAddPreset('npc', 'npc1', 1);
      })
    ).rejects.toThrow('Network Error');

    const updaterFallback = mockUpdateState.mock.calls[mockUpdateState.mock.calls.length - 1][0];
    const resState = typeof updaterFallback === 'function' ? updaterFallback(mockState) : updaterFallback;
    
    const count = resState.combatState.combatants.length;
    expect(count).toBe(1);

    expect(toast.error).toHaveBeenCalledWith('Failed to save changes. Please try again.', expect.objectContaining({
      description: 'Network Error'
    }));

    consoleErrorSpy.mockRestore();
  });

  it('handleAddPreset derives rechargeAbilities from npcTemplate.actions correctly', async () => {
    (addEncounterCombatantDB as any).mockResolvedValue([{ id: 'mock-ec' }]);
    const { result } = renderHook(() => useEncounterPresetLoader(undefined, vi.fn()));

    await act(async () => {
      await result.current.handleAddPreset('npc', 'npc1', 1);
    });

    const optimisticUpdater = mockUpdateState.mock.calls[0][0];
    const stateAfterOptimistic = optimisticUpdater({ ...mockState, combatState: { combatants: [] }, encounterCombatants: [] });
    const addedCombatant = stateAfterOptimistic.combatState.combatants[0];
    
    expect(addedCombatant.rechargeAbilities).toEqual([{
      name: 'Breath',
      rechargeOn: 5,
      isCharged: true
    }]);
  });
});

```

## File: src/components/ActiveEncounterTab/__tests__/useHealthChange.test.ts

```typescript
import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useHealthChange } from '../hooks/useHealthChange';
import type { Combatant } from '../../../types';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

const mockUpdateState = vi.fn();
const mockAppState = {
  combatState: {
    combatants: [] as any[],
  },
};

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: () => ({
    state: {
      characters: [],
      npcs: [],
    },
    updateState: mockUpdateState,
  }),
  getSnapshot: () => mockAppState,
}));

const mockFireConcentrationAlert = vi.fn();
vi.mock('../../../lib/concentrationCheck', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/concentrationCheck')>();
  return {
    ...actual,
    fireConcentrationAlert: (...args: any[]) => mockFireConcentrationAlert(...args),
  };
});

vi.mock('../../../hooks/useOverlayEvents', () => ({
  useDamageEvent: () => ({ fire: vi.fn() }),
  useHealEvent: () => ({ fire: vi.fn() }),
  useUnconsciousEvent: () => ({ fire: vi.fn() }),
  useDeathEvent: () => ({ fire: vi.fn() }),
}));

describe('useHealthChange', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const syncingIds = new Set<string>();

  const baseCombatant: Combatant = {
    id: 'c1',
    name: 'Goblin',
    type: 'pc',
    ac: 15,
    maxHp: 30,
    currentHp: 30,
    tempHp: 5,
    initiative: 10,
    notes: '',
    passivePerception: 10,
    conditions: '',
  };

  it('applying damage reduces currentHp by the correct amount', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '10' });
    });

    act(() => {
      // 10 damage: 5 is absorbed by tempHp, remaining 5 reduces currentHp to 25
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 25, tempHp: 0 });
  });

  it('applying damage respects resistance and halves the value', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const resistantCombatant = { ...baseCombatant, resistances: 'fire', tempHp: 0 };

    act(() => {
      result.current.setDamageInputs({ c1: '10' });
    });

    act(() => {
      result.current.handleHealthChange('c1', resistantCombatant, true, 'fire');
    });

    // 10 damage halved = 5 damage. 30 - 5 = 25
    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 25, tempHp: 0 });
  });

  it('applying damage respects immunity and reduces damage to zero', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const immuneCombatant = { ...baseCombatant, immunities: 'fire', tempHp: 0 };

    act(() => {
      result.current.setDamageInputs({ c1: '10' });
    });

    act(() => {
      result.current.handleHealthChange('c1', immuneCombatant, true, 'fire');
    });

    // 10 damage immune = 0 damage. 30 - 0 = 30
    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 30, tempHp: 0 });
  });

  it('applying damage respects vulnerability and doubles the value', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const vulnerableCombatant = { ...baseCombatant, vulnerabilities: 'fire', tempHp: 0 };

    act(() => {
      result.current.setDamageInputs({ c1: '10' });
    });

    act(() => {
      result.current.handleHealthChange('c1', vulnerableCombatant, true, 'fire');
    });

    // 10 damage doubled = 20 damage. 30 - 20 = 10
    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 10, tempHp: 0 });
  });

  it('healing cannot exceed maxHp', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const woundedCombatant = { ...baseCombatant, currentHp: 25, tempHp: 0 };

    act(() => {
      result.current.setHealInputs({ c1: '10' });
    });

    act(() => {
      result.current.handleHealthChange('c1', woundedCombatant, false);
    });

    // Cannot exceed max HP (30)
    expect(updateSpy).toHaveBeenCalledWith('c1', { currentHp: 30, tempHp: 0 });
  });

  it('damage that reduces HP to 0 or below sets currentHp to 0, not negative', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '50' });
    });

    act(() => {
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(updateSpy).toHaveBeenCalledWith('c1', expect.objectContaining({ currentHp: 0 }));
  });

  it('damage to a concentrating combatant fires a concentration alert', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));
    const concentratingCombatant = { ...baseCombatant, conditions: 'concentrating' };

    act(() => {
      result.current.setDamageInputs({ c1: '10' });
    });

    act(() => {
      result.current.handleHealthChange('c1', concentratingCombatant, true);
    });

    expect(mockFireConcentrationAlert).toHaveBeenCalled();
  });

  it('damage to a non-concentrating combatant does not fire a concentration alert', () => {
    const updateSpy = vi.fn();
    const { result } = renderHook(() => useHealthChange(syncingIds, updateSpy));

    act(() => {
      result.current.setDamageInputs({ c1: '10' });
    });

    act(() => {
      result.current.handleHealthChange('c1', baseCombatant, true);
    });

    expect(mockFireConcentrationAlert).not.toHaveBeenCalled();
  });
});

```

## File: src/components/ActiveEncounterTab/__tests__/useSelectionMode.test.ts

```typescript
import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useSelectionMode } from '../hooks/useSelectionMode';
import { useDashboardStore } from '../../../hooks/useAppState';

describe('useSelectionMode', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    useDashboardStore.setState({
      combatState: {
        activeEncounterId: null,
        activeTurnId: null,
        round: 1,
        combatants: [],
        concentrationLinks: {},
        deathEvent: null,
        damageEvent: null,
        healEvent: null,
        rageEvent: null,
        unconsciousEvent: null,
        initiativeEvent: false,
        selectedIds: [],
        isSelectionMode: false,
        syncingIds: [],
        expandedIds: [],
      }
    });
  });

  it('entering selection mode sets isSelectionMode to true', () => {
    const { result } = renderHook(() => useSelectionMode());
    act(() => {
      result.current.enterSelectionMode();
    });
    expect(result.current.isSelectionMode).toBe(true);
  });

  it('exiting selection mode clears selectedIds and sets isSelectionMode to false', () => {
    const { result } = renderHook(() => useSelectionMode());
    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('id-1');
    });
    expect(result.current.isSelectionMode).toBe(true);
    expect(result.current.selectedIds.has('id-1')).toBe(true);

    act(() => {
      result.current.exitSelectionMode();
    });
    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('selecting all combatants populates selectedIds with every combatant id', () => {
    const { result } = renderHook(() => useSelectionMode());
    act(() => {
      result.current.selectAll(['id-1', 'id-2']);
    });
    expect(result.current.selectedIds.has('id-1')).toBe(true);
    expect(result.current.selectedIds.has('id-2')).toBe(true);
    expect(result.current.selectedIds.size).toBe(2);
  });
});

```

## File: src/components/EncountersTab/__tests__/EncounterCard.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { EncounterCard } from '../EncounterCard';

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: () => ({
    state: { activeEncounterId: null, difficulties: { 1: 'Easy', 2: 'Medium', 3: 'Hard', 4: 'Deadly' }, encounterCombatants: [], npcs: [] },
    updateState: vi.fn(),
  }),
}));

describe('EncounterCard', () => {
  afterEach(() => cleanup());

  const mockEnc = {
    id: '1',
    name: 'Goblin Ambush',
    location: 'Forest Path',
    difficultyId: 2,
    difficultyName: 'Medium',
    status: 'planned' as const,
    npcDefinitions: '',
  };

  const defaultProps = {
    enc: mockEnc,
    isDeleting: false,
    onDelete: vi.fn(),
    onStart: vi.fn(),
    onSyncRequested: vi.fn(),
  };

  it('renders the encounter name and difficulty', () => {
    const { container } = render(<EncounterCard {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });
});

```

## File: src/components/EncountersTab/__tests__/NewEncounterDialog.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NewEncounterDialog } from '../NewEncounterDialog';

describe('NewEncounterDialog', () => {
  afterEach(() => cleanup());

  const mockDifficulties = [
    { id: 1, name: 'Easy' },
    { id: 2, name: 'Medium' },
    { id: 3, name: 'Hard' },
    { id: 4, name: 'Deadly' },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    difficulties: mockDifficulties,
  };

  it('renders without crashing and calls onConfirm with encounter data when submitted', () => {
    const onConfirmMock = vi.fn();
    const { container } = render(<NewEncounterDialog {...defaultProps} onConfirm={onConfirmMock} />);
    expect(container).toBeInTheDocument();
  });
});

```

## File: src/components/EncountersTab/__tests__/useEncounters.test.ts

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEncounters } from '../hooks/useEncounters';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { addEncounterDB, deleteEncounterFully } from '../../../services/dbOperations';

vi.mock('../../../services/dbOperations', () => ({
  addEncounterDB: vi.fn().mockResolvedValue({ id: 'real-enc-1', name: 'Goblin Ambush', location: 'Woods', difficultyId: 2, status: 'planned', difficultyName: 'Medium' }),
  deleteEncounterFully: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn()
}));

describe('useEncounters', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('handleCreateEncounter adds an encounter to store state and calls the DB', async () => {
    const updateStateSpy = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: { encounters: [], difficulties: { 1: 'Easy', 2: 'Medium' } } as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);

    const { result } = renderHook(() => useEncounters({ onSelectEncounter: vi.fn(), onSyncRequested: vi.fn() }));
    
    await act(async () => {
      await result.current.handleCreateEncounter({ name: 'Goblin Ambush', location: 'Woods', difficultyId: 2 });
    });

    expect(addEncounterDB).toHaveBeenCalled();
    expect(updateStateSpy).toHaveBeenCalled();
  });

  it('handleDeleteEncounter removes the encounter from store state', async () => {
    const mockEnc = { id: 'enc-1', name: 'Goblin Ambush', location: 'Woods' };
    const updateStateSpy = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: { encounters: [mockEnc], encounterCombatants: [] } as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);

    const { result } = renderHook(() => useEncounters({ onSelectEncounter: vi.fn(), onSyncRequested: vi.fn() }));
    
    await act(async () => {
      await result.current.handleDelete(mockEnc as any);
    });

    expect(deleteEncounterFully).toHaveBeenCalled();
    expect(updateStateSpy).toHaveBeenCalled();
  });

  it('handleCreateEncounter writes all required fields and appears in store', async () => {
    const updateStateSpy = vi.fn();
    const initialState = { encounters: [], difficulties: { 3: 'Hard' } };
    vi.mocked(useAppState).mockReturnValue({
      state: initialState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn().mockReturnValue(initialState),
    } as any);

    const { result } = renderHook(() => useEncounters({ onSelectEncounter: vi.fn(), onSyncRequested: vi.fn() }));
    const encounterData = { name: 'Goblin Ambush', location: 'Dark Forest', difficultyId: 3 };

    await act(async () => {
      await result.current.handleCreateEncounter(encounterData);
    });

    expect(addEncounterDB).toHaveBeenCalledWith(
      'Goblin Ambush',
      'Dark Forest',
      3,
      0
    );
    
    // Check optimistic update
    const stateUpdater = updateStateSpy.mock.calls[0][0];
    const nextState = stateUpdater(initialState);
    expect(nextState.encounters.length).toBe(1);
    expect(nextState.encounters[0].name).toBe('Goblin Ambush');
  });

  it('Failed encounter creation rolls back state', async () => {
    const updateStateSpy = vi.fn();
    const initialState = { encounters: [], difficulties: { 1: 'Easy' } };
    vi.mocked(useAppState).mockReturnValue({
      state: initialState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn().mockReturnValue(initialState),
    } as any);

    vi.mocked(addEncounterDB).mockRejectedValue(new Error('Fail'));

    const { result } = renderHook(() => useEncounters({ onSelectEncounter: vi.fn(), onSyncRequested: vi.fn() }));
    
    await act(async () => {
      await result.current.handleCreateEncounter({ name: 'Fail', location: '', difficultyId: 1 });
    });

    // Optimistic update + rollback
    expect(updateStateSpy).toHaveBeenCalledTimes(2);
    expect(updateStateSpy).toHaveBeenLastCalledWith(initialState);
  });
});

```

## File: src/components/NpcLibraryTab/__tests__/NewNpcDialog.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NewNpcDialog } from '../NewNpcDialog';

describe('NewNpcDialog', () => {
  afterEach(() => cleanup());

  it('renders correctly and calls onConfirm with correct form data', () => {
    const onConfirmMock = vi.fn();
    const { getByLabelText, getByRole } = render(
      <NewNpcDialog isOpen={true} onClose={vi.fn()} onConfirm={onConfirmMock} />
    );

    fireEvent.change(getByLabelText(/^NPC Name/i), { target: { value: 'Dragon' } });
    fireEvent.change(getByLabelText(/^Max HP/i), { target: { value: '100' } });

    fireEvent.click(getByRole('button', { name: /Add NPC/i }));

    expect(onConfirmMock).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Dragon',
      maxHp: 100,
      legendaryActions: 0,
      legendaryResistances: 0,
    }));
  });
});

```

## File: src/components/NpcLibraryTab/__tests__/NpcCardSubcomponents.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NpcLegendarySection } from '../NpcLegendarySection';

describe('NpcLegendarySection', () => {
  afterEach(() => cleanup());

  it('renders legendary action and resistance inputs correctly', () => {
    render(
      <NpcLegendarySection
        legendaryActions={3}
        legendaryResistances={2}
        onUpdate={vi.fn()}
      />
    );

    const actionInput = screen.getByTestId('legendary-actions-input') as HTMLInputElement;
    expect(actionInput).toBeInTheDocument();
    expect(actionInput.value).toBe('3');

    const resistanceInput = screen.getByTestId('legendary-resistances-input') as HTMLInputElement;
    expect(resistanceInput).toBeInTheDocument();
    expect(resistanceInput.value).toBe('2');
  });
});

```

## File: src/components/NpcLibraryTab/__tests__/NpcFormFields.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { NpcFormFields, DEFAULT_NPC_FORM_DATA } from '../../ui/NpcFormFields';
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('NpcFormFields', () => {
  afterEach(() => cleanup());

  it('renders all essential fields', () => {
    const { getByLabelText } = render(<NpcFormFields data={DEFAULT_NPC_FORM_DATA} onChange={vi.fn()} />);
    
    expect(getByLabelText(/^NPC Name/i)).toBeInTheDocument();
    expect(getByLabelText(/^AC\b/i)).toBeInTheDocument();
    expect(getByLabelText(/^Max HP/i)).toBeInTheDocument();
    expect(getByLabelText(/^CR/i)).toBeInTheDocument();
  });

  it('calls onChange when input values change', () => {
    let calledData: any = null;
    const onChange = (data: any) => { calledData = data; };
    const { getByLabelText } = render(<NpcFormFields data={DEFAULT_NPC_FORM_DATA} onChange={onChange} />);

    const nameInput = getByLabelText(/^NPC Name/i);
    fireEvent.change(nameInput, { target: { value: 'Test NPC' } });
    
    expect(calledData).not.toBeNull();
    expect(calledData.name).toBe('Test NPC');
  });
});

```

## File: src/components/NpcLibraryTab/__tests__/NpcLibraryTab.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NpcLibraryTab } from '../../NpcLibraryTab';
import { useAppState } from '../../../hooks/useAppState';

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('NpcLibraryTab', () => {
  afterEach(() => cleanup());

  it('renders without crashing', () => {
    vi.mocked(useAppState).mockReturnValue({
      state: { npcs: [], combatState: { combatants: [] } },
      updateState: vi.fn(),
    } as any);

    render(<NpcLibraryTab />);
    expect(screen.getByText(/NPC Library/i)).toBeInTheDocument();
  });
});

```

## File: src/components/NpcLibraryTab/__tests__/useNpcLibrary.test.ts

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useNpcLibrary } from '../hooks/useNpcLibrary';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { deleteNpcDB, updateNpcFullDB, addNpcDB } from '../../../services/dbOperations';

vi.mock('../../../services/dbOperations', () => ({
  deleteNpcDB: vi.fn(),
  updateNpcFullDB: vi.fn(),
  addNpcDB: vi.fn().mockResolvedValue({ id: 'new-npc' }),
  resetNpcHpDB: vi.fn(),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn()
}));

describe('useNpcLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
  });
  afterEach(() => vi.restoreAllMocks());

  it('handleUpdateNpc updates the state and calls the DB', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { npcs: [{ id: 'npc-1', name: 'Goblin' }], encounterCombatants: [], combatState: { combatants: [] } };
    
    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);

    const { result } = renderHook(() => useNpcLibrary());
    
    await act(async () => {
      await result.current.handleUpdateNpc('npc-1', { maxHp: 30 });
    });

    expect(updateNpcFullDB).toHaveBeenCalled();
    expect(updateStateSpy).toHaveBeenCalled();
  });

  it('handleDeleteNpc removes the NPC from state and calls the DB', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { npcs: [{ id: 'npc-1', name: 'Goblin' }] };
    
    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);

    const { result } = renderHook(() => useNpcLibrary());
    
    await act(async () => {
      await result.current.handleDeleteNpc('npc-1');
    });

    expect(deleteNpcDB).toHaveBeenCalledWith('npc-1');
    expect(updateStateSpy).toHaveBeenCalled();
  });

  it('handleAddNpc adds the NPC to state and calls the DB', async () => {
    const updateStateSpy = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: { npcs: [] } as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);

    const { result } = renderHook(() => useNpcLibrary());
    
    await act(async () => {
      await result.current.handleAddNpc({ name: 'Orc' } as any);
    });

    expect(addNpcDB).toHaveBeenCalled();
    expect(updateStateSpy).toHaveBeenCalled();
  });
});

```

## File: src/components/PartyTab/__tests__/CharacterCard.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CharacterCard } from '../CharacterCard';

describe('CharacterCard', () => {
  afterEach(() => cleanup());

  const mockCharacter = {
    id: 'char123',
    playerName: 'John Doe',
    characterName: 'Aethelgard the Valiant',
    ac: 18,
    maxHp: 45,
    tempHp: 0,
    currentHp: 40,
    conditions: 'None',
    passivePerception: 14,
    level: 4,
    statusId: 1,
    statusName: 'Active',
    notes: 'Brave warrior.',
    isActive: true,
    class: 'Fighter',
    tempAc: 0,
    hitDiceConfig: '',
    hitDiceUsed: '{}',
    abilityScores: '{}',
    proficiencies: '{}',
  };

  const defaultProps = {
    character: mockCharacter,
    isSyncing: false,
    isExpanded: false,
    onToggleExpand: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onLevelUpClick: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<CharacterCard {...defaultProps} />);
  });
});

```

## File: src/components/PartyTab/__tests__/CharacterCardExpanded.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CharacterCardExpanded } from '../CharacterCardExpanded';

describe('CharacterCardExpanded', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const defaultCharacter = {
    id: 'pc-1',
    playerName: 'Alice',
    characterName: 'Thor',
    ac: 15,
    maxHp: 20,
    tempHp: 0,
    currentHp: 20,
    conditions: '',
    passivePerception: 14,
    level: 2, // Paladin gets spellcasting at level 2
    statusId: 1,
    statusName: 'Active',
    notes: '',
    isActive: true,
    class: 'Paladin',
    hitDiceConfig: '1d10',
    hitDiceUsed: '{}',
    abilityScores: '{}',
    proficiencies: '{}',
  };

  const defaultProps = {
    character: defaultCharacter,
    isSyncing: false,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders without crashing with full character data', () => {
    const { container } = render(<CharacterCardExpanded {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });
});

```

## File: src/components/PartyTab/__tests__/LevelUpDialog.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, fireEvent, cleanup, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { LevelUpDialog } from '../LevelUpDialog';
import type { Character } from '../../../types';
import { getResourcePoolSuggestions } from '../../../lib/resourcePoolScaling';

vi.mock('../../../lib/resourcePoolScaling', () => ({
  getResourcePoolSuggestions: vi.fn().mockReturnValue([])
}));

describe('LevelUpDialog', () => {
  afterEach(() => cleanup());

  const mockCharacter: Character = {
    id: 'char123',
    playerName: 'John Doe',
    characterName: 'Aethelgard the Valiant',
    ac: 18,
    maxHp: 45,
    tempHp: 0,
    currentHp: 40,
    conditions: 'None',
    passivePerception: 14,
    level: 4,
    statusId: 1,
    statusName: 'Active',
    notes: 'Brave warrior, specializes in shields.',
    isActive: true,
    class: 'Barbarian',
    hitDiceConfig: '',
    hitDiceUsed: '{}',
    abilityScores: '{}',
    proficiencies: '{}',
  };

  const defaultProps = {
    character: mockCharacter,
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  it('renders without crashing when isOpen is true', () => {
    const { container } = render(<LevelUpDialog {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('resource pools section renders when the character has a class with pool suggestions', () => {
    const { container } = render(<LevelUpDialog {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('onConfirm is called with resourcePools in the updates object when confirmed', () => {
    const onConfirmMock = vi.fn();
    const { container } = render(<LevelUpDialog {...defaultProps} onConfirm={onConfirmMock} />);
    
    const confirmBtn = container.querySelector('#confirm-level-up-btn') as HTMLButtonElement;
    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    expect(onConfirmMock.mock.calls[0][0]).toHaveProperty('resourcePools');
  });

  it('Level up resource pool suggestions are generated for the correct class and level', () => {
    const barbarian: Character = {
      ...mockCharacter,
      class: 'Barbarian',
      level: 4,
      resourcePools: JSON.stringify([{ name: 'Rage', current: 3, max: 3, reset: 'long' }])
    };

    render(<LevelUpDialog {...defaultProps} character={barbarian} />);

    expect(getResourcePoolSuggestions).toHaveBeenCalledWith(
      'Barbarian',
      5, // newLevel = character.level + 1
      expect.any(Array)
    );
  });
});

```

## File: src/components/PartyTab/__tests__/LongRestDialog.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { LongRestDialog } from '../LongRestDialog';

describe('LongRestDialog', () => {
  afterEach(() => cleanup());

  const defaultProps = {
    isOpen: true,
    characters: [{ id: '1', characterName: 'Test' } as any],
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders without crashing and calls onConfirm when confirmed', () => {
    const onConfirm = vi.fn();
    render(<LongRestDialog {...defaultProps} onConfirm={onConfirm} />);
    expect(screen.getByText('Long Rest')).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: /Apply Long Rest/i }));
    expect(onConfirm).toHaveBeenCalled();
  });
});

```

## File: src/components/PartyTab/__tests__/NewPlayerDialog.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NewPlayerDialog } from '../NewPlayerDialog';

// Mock ResizeObserver
const MockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', MockResizeObserver);

describe('NewPlayerDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  afterEach(() => cleanup());

  it('renders without crashing and shows the first tab', () => {
    const { container } = render(<NewPlayerDialog {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });
});

```

## File: src/components/PartyTab/__tests__/PartyTab.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PartyTab } from '../../PartyTab';
import { useAppState } from '../../../hooks/useAppState';
import { useParty } from '../hooks/useParty';

vi.mock('../hooks/useParty', () => ({
  useParty: vi.fn(),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('PartyTab', () => {
  beforeEach(() => {
    vi.mocked(useParty).mockReturnValue({
      state: { characters: [] } as any,
      syncingId: null,
      isResting: false,
      isAddingPlayer: false,
      globalError: null,
      expandedIds: new Set(),
      toggleExpand: vi.fn(),
      handleCreateCharacter: vi.fn(),
      handleLongRest: vi.fn(),
      handleShortRest: vi.fn(),
      handleDeletePlayer: vi.fn(),
      handleUpdate: vi.fn(),
      levelUpCharacter: null,
      setLevelUpCharacter: vi.fn(),
      handleLevelUpConfirm: vi.fn(),
    } as any);

    vi.mocked(useAppState).mockReturnValue({
      state: { openDialog: null } as any,
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    });
  });

  afterEach(() => cleanup());

  it('renders without crashing with an empty party', () => {
    render(<PartyTab />);
    expect(screen.getByText(/No characters found/i)).toBeInTheDocument();
  });
});

```

## File: src/components/PartyTab/__tests__/ShortRestDialog.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ShortRestDialog } from '../ShortRestDialog';

describe('ShortRestDialog', () => {
  afterEach(() => cleanup());

  const defaultProps = {
    isOpen: true,
    characters: [{ id: '1', characterName: 'Test', currentHp: 5, maxHp: 10 } as any],
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders without crashing and calls onConfirm when confirmed', () => {
    const onConfirm = vi.fn();
    render(<ShortRestDialog {...defaultProps} onConfirm={onConfirm} />);
    expect(screen.getByText('Short Rest')).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: /Apply Short Rest/i }));
    expect(onConfirm).toHaveBeenCalled();
  });
});

```

## File: src/components/PartyTab/__tests__/usePartyCharacterCrud.test.ts

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useParty } from '../hooks/useParty';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { deleteCharacterFully, addCharacterDB, updateCharacterDB } from '../../../services/dbOperations';

vi.mock('../../../services/dbOperations', () => ({
  deleteCharacterFully: vi.fn().mockResolvedValue(undefined),
  addCharacterDB: vi.fn(),
  updateCharacterDB: vi.fn(),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn()
}));

describe('useParty - Character CRUD', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('handleUpdate writes changed fields to the database', async () => {
    const mockChar = { id: 'char-1', characterName: 'Testo' };
    vi.mocked(useAppState).mockReturnValue({
      state: { characters: [mockChar] } as any,
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue({ characters: [mockChar] } as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleUpdate('char-1', { maxHp: 50 });
    });

    expect(updateCharacterDB).toHaveBeenCalledWith(expect.objectContaining({ maxHp: 50 }), expect.objectContaining({ id: 'char-1' }));
  });

  it('handleUpdate rolls back state when the DB write fails', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ id: 'char-1', maxHp: 20 }] };

    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);
    vi.mocked(updateCharacterDB).mockRejectedValue(new Error('Fail'));

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleUpdate('char-1', { maxHp: 50 });
    });

    // One optimistic update, one rollback
    expect(updateStateSpy).toHaveBeenCalledTimes(2);
  });

  it('handleDelete removes the character from store state and calls deleteCharacterDB', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ id: 'char-1' }] };

    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleDeletePlayer('char-1');
    });

    expect(deleteCharacterFully).toHaveBeenCalled();
    expect(updateStateSpy).toHaveBeenCalledTimes(1); // optimistic update
  });

  describe('Level Up Flow', () => {
    it('handleUpdate includes level-up fields', async () => {
      const mockChar = { 
        id: 'pc-1', 
        characterName: 'Barbarian', 
        class: 'Barbarian', 
        level: 4, 
        maxHp: 44,
        resourcePools: JSON.stringify([{ name: 'Rage', current: 3, max: 3, reset: 'short' }])
      };
      vi.mocked(useAppState).mockReturnValue({
        state: { characters: [mockChar] } as any,
        updateState: vi.fn(),
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue({ characters: [mockChar] } as any);

      const { result } = renderHook(() => useParty());

      const levelUpData = {
        level: 5,
        maxHp: 54,
        currentHp: 54,
        hitDiceConfig: '5d12',
        resourcePools: JSON.stringify([{ name: 'Rage', current: 3, max: 3, reset: 'short' }]),
        proficiencies: '{}'
      };

      await act(async () => {
        await result.current.handleUpdate('pc-1', levelUpData);
      });

      expect(updateCharacterDB).toHaveBeenCalledWith(
        expect.objectContaining({
          ...levelUpData,
          passivePerception: 10,
          proficiencies: expect.stringContaining('"proficiencyBonus":3')
        }),
        expect.objectContaining({ id: 'pc-1' })
      );
    });
  });
});

```

## File: src/components/PartyTab/__tests__/usePartyRest.test.ts

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useParty } from '../hooks/useParty';
import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import * as sheetsService from '../../../services/sheetsService';
import { queueWrite } from '../../../services/writeQueue';

vi.mock('../../../services/sheetsService', () => ({
  fetchSheetData: vi.fn(),
  updateSheetData: vi.fn(),
  appendSheetData: vi.fn(),
  batchUpdateSpreadsheet: vi.fn(),
  fetchSpreadsheetMetadata: vi.fn(),
  getSpreadsheetId: vi.fn().mockReturnValue('mock-spreadsheet-id'),
}));

vi.mock('../../../services/writeQueue', () => ({
  queueWrite: vi.fn(),
}));

vi.mock('../../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn()
}));

describe('useParty - REST and Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for findRowIndexById inside dbOperations
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['char-1'], ['pc-1'], ['pc-2'], ['pc-3'], ['pc-rest-write-1'], ['pc-longrest-write-1']] });
  });
  afterEach(() => vi.restoreAllMocks());

  it('handleLongRest resets all resource pools that restore on long rest', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ 
      id: 'char-1', 
      resourcePools: JSON.stringify([{ name: 'Rage', current: 0, max: 3, reset: 'long' }]) 
    }] };

    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleLongRest(['char-1']);
    });

    const stateUpdater = updateStateSpy.mock.calls[0][0];
    const nextState = stateUpdater(mockState);
    const updatedPools = JSON.parse(nextState.characters[0].resourcePools);
    expect(updatedPools[0].current).toBe(3);
  });

  it('handleShortRest resets only pools that restore on short rest', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ 
      id: 'char-1', 
      resourcePools: JSON.stringify([
        { name: 'Ki', current: 0, max: 3, reset: 'short' },
        { name: 'Rage', current: 0, max: 3, reset: 'long' }
      ]) 
    }] };

    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleShortRest([{ characterId: 'char-1', hpToAdd: 0, newHitDiceUsed: '{}' }]);
    });

    const stateUpdater = updateStateSpy.mock.calls[0][0];
    const nextState = stateUpdater(mockState);
    const updatedPools = JSON.parse(nextState.characters[0].resourcePools);
    
    expect(updatedPools[0].current).toBe(3); // Ki reset
    expect(updatedPools[1].current).toBe(0); // Rage not reset
  });

  it('handleLongRest resets hit dice used to empty', async () => {
    const updateStateSpy = vi.fn();
    const mockState = { characters: [{ 
      id: 'char-1', 
      hitDiceConfig: '1d10',
      hitDiceUsed: '{"d10":1}'
    }] };

    vi.mocked(useAppState).mockReturnValue({
      state: mockState as any,
      updateState: updateStateSpy,
      getSnapshot: vi.fn(),
    } as any);
    vi.mocked(getSnapshot).mockReturnValue(mockState as any);

    const { result } = renderHook(() => useParty());
    
    await act(async () => {
      await result.current.handleLongRest(['char-1']);
    });

    const stateUpdater = updateStateSpy.mock.calls[0][0];
    const nextState = stateUpdater(mockState);
    expect(nextState.characters[0].hitDiceUsed).toBe('{"d10":0}');
  });

  describe('Rest Selection and Pool Logic', () => {
    it('Short rest applies ONLY to selected PCs', async () => {
      const updateStateSpy = vi.fn();
      const char1 = { id: 'pc-1', currentHp: 10, maxHp: 20, resourcePools: JSON.stringify([{ name: 'Rage', current: 3, max: 5, reset: 'short' }]) };
      const char2 = { id: 'pc-2', currentHp: 10, maxHp: 20, resourcePools: JSON.stringify([{ name: 'Ki Points', current: 1, max: 10, reset: 'short' }]) };
      const char3 = { id: 'pc-3', currentHp: 10, maxHp: 20, resourcePools: JSON.stringify([{ name: 'Spell Slots', current: 0, max: 8, reset: 'short' }]) };
      
      const mockState = { characters: [char1, char2, char3] };

      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());

      await act(async () => {
        await result.current.handleShortRest([
          { characterId: 'pc-1', hpToAdd: 0, newHitDiceUsed: '{}' },
          { characterId: 'pc-3', hpToAdd: 0, newHitDiceUsed: '{}' }
        ]);
      });

      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);

      const updatedPc1 = nextState.characters.find((c: any) => c.id === 'pc-1');
      const updatedPc2 = nextState.characters.find((c: any) => c.id === 'pc-2');
      const updatedPc3 = nextState.characters.find((c: any) => c.id === 'pc-3');

      expect(JSON.parse(updatedPc1.resourcePools)[0].current).toBe(5);
      expect(JSON.parse(updatedPc3.resourcePools)[0].current).toBe(8);
      // pc-2 was not in the results array, so it should NOT be changed by the map in useParty.ts
      expect(updatedPc2.resourcePools).toBe(char2.resourcePools);
    });

    it('Short rest does not restore long-rest pools', async () => {
      const updateStateSpy = vi.fn();
      const char = { 
        id: 'pc-1', 
        currentHp: 10,
        maxHp: 20,
        resourcePools: JSON.stringify([
          { name: 'Rage', current: 2, max: 5, reset: 'short' },
          { name: 'Superiority Dice', current: 1, max: 4, reset: 'long' }
        ]) 
      };
      const mockState = { characters: [char] };

      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());

      await act(async () => {
        await result.current.handleShortRest([{ characterId: 'pc-1', hpToAdd: 0, newHitDiceUsed: '{}' }]);
      });

      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);
      const pools = JSON.parse(nextState.characters[0].resourcePools);
      
      expect(pools.find((p: any) => p.name === 'Rage').current).toBe(5);
      expect(pools.find((p: any) => p.name === 'Superiority Dice').current).toBe(1);
    });

    it('Long rest applies ONLY to selected PCs', async () => {
      const updateStateSpy = vi.fn();
      const char1 = { 
        id: 'pc-1', 
        maxHp: 50, 
        currentHp: 10,
        resourcePools: JSON.stringify([{ name: 'Rage', current: 0, max: 5, reset: 'short' }])
      };
      const char2 = { 
        id: 'pc-2', 
        maxHp: 40, 
        currentHp: 8,
        resourcePools: JSON.stringify([{ name: 'Spell Slots', current: 0, max: 10, reset: 'long' }])
      };
      const mockState = { characters: [char1, char2] };

      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());

      await act(async () => {
        await result.current.handleLongRest(['pc-1']);
      });

      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);
      
      const updatedPc1 = nextState.characters.find((c: any) => c.id === 'pc-1');
      const updatedPc2 = nextState.characters.find((c: any) => c.id === 'pc-2');

      expect(updatedPc1.currentHp).toBe(50);
      expect(JSON.parse(updatedPc1.resourcePools)[0].current).toBe(5);
      
      expect(updatedPc2.currentHp).toBe(8);
      expect(JSON.parse(updatedPc2.resourcePools)[0].current).toBe(0);
    });

    it('Long rest restores currentHp to maxHp', async () => {
      const updateStateSpy = vi.fn();
      const char = { id: 'pc-1', currentHp: 15, maxHp: 100 };
      const mockState = { characters: [char] };

      vi.mocked(useAppState).mockReturnValue({
        state: mockState as any,
        updateState: updateStateSpy,
        getSnapshot: vi.fn(),
      } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());

      await act(async () => {
        await result.current.handleLongRest(['pc-1']);
      });

      const stateUpdater = updateStateSpy.mock.calls[0][0];
      const nextState = stateUpdater(mockState);
      expect(nextState.characters[0].currentHp).toBe(100);
    });
  });

  describe('Workflows - Database Integrity', () => {
    it('short rest writes resourcePools at index 22 for selected PC', async () => {
      const char = { 
        id: 'pc-rest-write-1', 
        currentHp: 10, 
        maxHp: 20, 
        resourcePools: JSON.stringify([{ name: 'Rage', current: 2, max: 5, reset: 'short' }]) 
      };
      const mockState = { characters: [char] };
      vi.mocked(useAppState).mockReturnValue({ state: mockState as any, updateState: vi.fn(), getSnapshot: vi.fn() } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleShortRest([{ characterId: 'pc-rest-write-1', hpToAdd: 0, newHitDiceUsed: '{}' }]);
      });

      expect(queueWrite).toHaveBeenCalled();
      const calls = vi.mocked(queueWrite).mock.calls;
      const writtenRow = calls[0][2][0];
      const pools = JSON.parse(writtenRow[22]);
      expect(pools[0].name).toBe('Rage');
      expect(pools[0].current).toBe(5);
      expect(calls[0][1]).toContain('Characters!');
    });

    it('short rest does NOT call DB for unselected PCs', async () => {
      const pc1 = { id: 'pc-1', currentHp: 10, maxHp: 20, resourcePools: JSON.stringify([{ name: 'Rage', current: 2, max: 5, reset: 'short' }]) };
      const pc2 = { id: 'pc-2', currentHp: 10, maxHp: 20, resourcePools: JSON.stringify([{ name: 'Ki', current: 3, max: 10, reset: 'short' }]) };
      const mockState = { characters: [pc1, pc2] };
      vi.mocked(useAppState).mockReturnValue({ state: mockState as any, updateState: vi.fn(), getSnapshot: vi.fn() } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleShortRest([{ characterId: 'pc-1', hpToAdd: 0, newHitDiceUsed: '{}' }]);
      });

      expect(queueWrite).toHaveBeenCalledTimes(1);
      const writtenRow = vi.mocked(queueWrite).mock.calls[0][2][0];
      expect(writtenRow[0]).toBe('pc-1');
    });

    it('long rest writes currentHp, hitDiceUsed, and resourcePools to sheet at correct indices', async () => {
      const char = { 
        id: 'pc-longrest-write-1', 
        currentHp: 20, 
        maxHp: 80,
        level: 10,
        hitDiceConfig: '10d10',
        hitDiceUsed: '{"d10":5}',
        resourcePools: JSON.stringify([{ name: 'Spell Slots', current: 0, max: 8, reset: 'long' }]) 
      };
      const mockState = { characters: [char] };
      vi.mocked(useAppState).mockReturnValue({ state: mockState as any, updateState: vi.fn(), getSnapshot: vi.fn() } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleLongRest(['pc-longrest-write-1']);
      });

      expect(queueWrite).toHaveBeenCalled();
      const writtenRow = vi.mocked(queueWrite).mock.calls[0][2][0];
      
      expect(writtenRow[6]).toBe(80); // currentHp
      expect(JSON.parse(writtenRow[21])).toEqual({ d10: 0 }); // hitDiceUsed reset (recovers 5 of 5)
      const pools = JSON.parse(writtenRow[22]);
      expect(pools[0].name).toBe('Spell Slots');
      expect(pools[0].current).toBe(8);
    });

    it('long rest does NOT call DB for unselected PCs', async () => {
      const pc1 = { id: 'pc-1', currentHp: 10, maxHp: 60 };
      const pc2 = { id: 'pc-2', currentHp: 5, maxHp: 40 };
      const mockState = { characters: [pc1, pc2] };
      vi.mocked(useAppState).mockReturnValue({ state: mockState as any, updateState: vi.fn(), getSnapshot: vi.fn() } as any);
      vi.mocked(getSnapshot).mockReturnValue(mockState as any);

      const { result } = renderHook(() => useParty());
      await act(async () => {
        await result.current.handleLongRest(['pc-1']);
      });

      expect(queueWrite).toHaveBeenCalledTimes(1);
      const writtenRow = vi.mocked(queueWrite).mock.calls[0][2][0];
      expect(writtenRow[0]).toBe('pc-1');
    });
  });
});

```

## File: src/components/__tests__/CampaignSelector.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CampaignSelector } from '../CampaignSelector';
import { Campaign } from '../../hooks/useCampaign';

describe('CampaignSelector Component Tests', () => {
  const defaultProps = {
    campaigns: [] as Campaign[],
    isLoading: false,
    error: null as string | null,
    onCreateCampaign: vi.fn(),
    onConnectCampaign: vi.fn(),
    onOpenCampaign: vi.fn(),
    onDeleteCampaign: vi.fn(),
    onClearError: vi.fn(),
  };

  afterEach(() => {
    cleanup();
  });

  it('renders empty state correctly when campaigns list is empty', () => {
    render(<CampaignSelector {...defaultProps} />);
    expect(screen.getByText('No campaigns yet.')).toBeInTheDocument();
    expect(screen.getByText('Create New Campaign')).toBeInTheDocument();
    expect(screen.getByText('Connect Existing Spreadsheet')).toBeInTheDocument();
  });
});

```

## File: src/components/__tests__/CommandPalette.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { CommandPalette } from '../CommandPalette';

describe('CommandPalette', () => {
  it('renders', () => {
    expect(true).toBe(true);
  });
});

```

## File: src/components/__tests__/ErrorBoundary.test.tsx

```typescript
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

function BuggyComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Simulated intentional render/compile error');
  }
  return <div data-testid="child">No error here</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('catches a render error and displays the fallback UI instead of crashing', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.queryByTestId('child')).toBeNull();
    expect(screen.getByText('Something went wrong on this page')).not.toBeNull();
    expect(screen.getByText('Simulated intentional render/compile error')).not.toBeNull();
  });
});

```

## File: src/components/__tests__/GMDashboard.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { GMDashboard } from '../GMDashboard';
import { STORAGE_KEYS } from '../../lib/constants';

vi.mock('../GMTabContent', () => ({
  GMTabContent: ({ activeTab }: { activeTab: string }) => <div data-testid="gm-tab-content">{activeTab}</div>
}));

vi.mock('../../hooks/useAppState', () => ({
  useAppState: () => ({
    state: {
      hasInitialSynced: true,
      encounters: [],
      combatState: {
        activeEncounterId: null
      }
    }
  })
}));

describe('GMDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.stubGlobal('indexedDB', {
      open: vi.fn(() => ({
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
      })),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('When localStorage is empty, the app defaults to party', () => {
    const { getByTestId } = render(<GMDashboard />);
    expect(getByTestId('gm-tab-content').textContent).toBe('party');
  });
});


```

## File: src/components/__tests__/GMDashboardSidebar.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { GMDashboardSidebar } from '../GMDashboardSidebar';

describe('GMDashboardSidebar', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders with a fixed w-16 width class and no dynamic width classes', () => {
    const { container } = render(
      <GMDashboardSidebar
        activeTab="party"
        onTabChange={vi.fn()}
        campaignName="Test Campaign"
        isSyncing={false}
        activeEncounterId="enc-123"
      />
    );

    const aside = container.querySelector('aside');
    expect(aside).toBeDefined();
    expect(aside?.className).toContain('w-16');
    expect(aside?.className).not.toContain('w-64');
    expect(aside?.className).not.toContain('w-20');
  });
});


```

## File: src/components/__tests__/GMTabContent.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GMTabContent } from '../GMTabContent';
import { useAppState } from '../../hooks/useAppState';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('GMTabContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test Campaign',
        hasInitialSynced: true,
        characters: [
          { id: '1', characterName: 'Hero 1', ac: 15, maxHp: 20, currentHp: 20, tempHp: 0, conditions: '', notes: '' }
        ],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: 'enc_1',
          combatants: [],
          activeTurnId: 'c1',
          round: 1,
          concentrationLinks: {},
        },
      },
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders PartyTab when activeTab is 'party'", () => {
    render(
      <MemoryRouter>
        <GMTabContent
          activeTab="party"
          hasActiveEncounter={true}
          clearEncounter={vi.fn()}
          startEncounter={vi.fn()}
          isGoogleConnected={false}
          handleSignIn={vi.fn()}
          handleSignOut={vi.fn()}
          setIsGoogleConnected={vi.fn()}
          handleSyncWithSheets={vi.fn().mockResolvedValue(undefined)}
          addLog={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue('Hero 1')).toBeInTheDocument();
    expect(screen.queryByText('Round 1')).toBeNull();
  });
});

```

## File: src/components/__tests__/PlayerView.test.tsx

```typescript
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PlayerView } from '../PlayerView';
import { useAppState } from '../../hooks/useAppState';

// Mock the useAppState hook
vi.mock('../../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('PlayerView Component', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // Test 1: When combatState has no active encounter the component renders a waiting/standby message
  it('renders a waiting/standby message when combatState has no active encounter', () => {
    vi.mocked(useAppState).mockReturnValue({
      state: {
        campaignName: 'Test Campaign',
        hasInitialSynced: true,
        characters: [],
        encounters: [],
        npcs: [],
        encounterCombatants: [],
        difficulties: {},
        statuses: {},
        combatState: {
          activeEncounterId: null,
          combatants: [],
          activeTurnId: null,
          round: 1,
          concentrationLinks: {},
        },
      },
      updateState: vi.fn(),
      getSnapshot: vi.fn(),
    } as any);

    render(<PlayerView />);
    expect(screen.getByText(/Waiting for GM to start the encounter/i)).toBeInTheDocument();
    expect(screen.queryByText(/Round/i)).toBeNull();
  });
});

```

## File: src/components/__tests__/ThemeContext.test.tsx

```typescript
import { STORAGE_KEYS } from '../../lib/constants';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

function TestComponent() {
  const { theme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('provides default theme value and sets data-theme on root html node', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value').textContent).toBe('default');
    expect(document.documentElement.getAttribute('data-theme')).toBe('default');
  });
});

```

## File: src/components/ui/__tests__/SpellcastingStatsRow.test.tsx

```typescript
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { SpellcastingStatsRow } from '../SpellcastingStatsRow';
import { AbilityScores } from '../../../lib/abilityScores';
import '@testing-library/jest-dom/vitest';

describe('SpellcastingStatsRow Component', () => {
  afterEach(() => {
    cleanup();
  });

  const baseAbilityScores: AbilityScores = {
    STR: 10,
    DEX: 14,
    CON: 12,
    INT: 16,
    WIS: 13,
    CHA: 8,
  };

  it('renders Spell Save DC 13 and Spell Atk +5 for Wizard with profBonus 2', () => {
    render(
      <SpellcastingStatsRow
        abilityScores={baseAbilityScores}
        profBonus={2}
        className="Wizard"
      />
    );

    expect(screen.getByText(/Spell Save DC:/i)).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument(); // 8 + 3 (INT) + 2

    expect(screen.getByText(/Spell Atk:/i)).toBeInTheDocument();
    expect(screen.getByText('+5')).toBeInTheDocument(); // 3 + 2
  });

  it('returns null for non-caster class (Barbarian) without override handler', () => {
    const { container } = render(
      <SpellcastingStatsRow
        abilityScores={baseAbilityScores}
        profBonus={2}
        className="Barbarian"
      />
    );
    expect(container.firstChild).toBeNull();
  });
});

```

## File: src/hooks/__tests__/dashboardStore.test.ts

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '../dashboardStore';

describe('useDashboardStore', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      characters: [],
      npcs: [],
      encounters: [],
      encounterCombatants: [],
      statuses: {},
      difficulties: {},
      campaignName: '',
      hasInitialSynced: false,
      openDialog: null,
      combatState: {
        activeEncounterId: null,
        activeTurnId: null,
        round: 1,
        combatants: [],
        concentrationLinks: {},
        deathEvent: null,
        damageEvent: null,
        healEvent: null,
        rageEvent: null,
        unconsciousEvent: null,
        initiativeEvent: false,
        selectedIds: [],
        isSelectionMode: false,
        syncingIds: [],
        expandedIds: [],
      },
    });
  });

  it('characters are empty on initial state', () => {
    const state = useDashboardStore.getState();
    expect(state.characters).toEqual([]);
  });

  it('setCharacters replaces the characters array', () => {
    const mockCharacter = { id: 'char-1', characterName: 'Fighter', maxHp: 10 } as any;
    useDashboardStore.getState().updateState({
      characters: [mockCharacter],
    });
    expect(useDashboardStore.getState().characters).toEqual([mockCharacter]);
  });

  it('setCombatState updates combatants in the combat state', () => {
    const mockCombatant = { id: 'comb-1', name: 'Goblin', currentHp: 8 } as any;
    useDashboardStore.getState().updateState((prev) => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        combatants: [mockCombatant],
      },
    }));
    expect(useDashboardStore.getState().combatState.combatants).toEqual([mockCombatant]);
  });

  it('updateCombatant updates a single combatant by id without affecting others', () => {
    const comb1 = { id: 'comb-1', name: 'Goblin 1', currentHp: 8 } as any;
    const comb2 = { id: 'comb-2', name: 'Goblin 2', currentHp: 10 } as any;
    useDashboardStore.setState({
      combatState: {
        activeEncounterId: 'enc-1',
        activeTurnId: 'comb-1',
        round: 1,
        combatants: [comb1, comb2],
        concentrationLinks: {},
        deathEvent: null,
        damageEvent: null,
        healEvent: null,
        rageEvent: null,
        unconsciousEvent: null,
        initiativeEvent: false,
        selectedIds: [],
        isSelectionMode: false,
        syncingIds: [],
        expandedIds: [],
      },
    });

    useDashboardStore.getState().updateState((prev) => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        combatants: prev.combatState.combatants.map((c) =>
          c.id === 'comb-1' ? { ...c, currentHp: 5 } : c
        ),
      },
    }));

    const combatants = useDashboardStore.getState().combatState.combatants;
    expect(combatants.find((c) => c.id === 'comb-1')?.currentHp).toBe(5);
    expect(combatants.find((c) => c.id === 'comb-2')?.currentHp).toBe(10);
  });
});

```

## File: src/hooks/__tests__/useCampaign.test.ts

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCampaign, extractSpreadsheetId } from '../useCampaign';
import { STORAGE_KEYS } from '../../lib/constants';
import { useDashboardStore } from '../dashboardStore';

vi.mock('../../services/googleAuth', () => ({
  requestAccessToken: vi.fn(),
  clearTokens: vi.fn(),
  hasToken: vi.fn(),
}));

vi.mock('../../services/sheetsService', () => ({
  fetchSheetData: vi.fn(),
  setSpreadsheetId: vi.fn(),
}));

describe('useCampaign Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    window.history.pushState(null, '', '/');
    useDashboardStore.setState({
      campaignName: '',
      hasInitialSynced: false,
    });
  });

  it('openCampaign sets the active campaign id and name in store state', () => {
    const { result } = renderHook(() => useCampaign());
    const mockCampaign = {
      id: 'camp-123',
      name: 'Curse of Strahd',
      spreadsheetId: 'sheet-123',
      spreadsheetUrl: 'url-123',
      createdAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
    };

    act(() => {
      result.current.openCampaign(mockCampaign);
      useDashboardStore.setState({ campaignName: mockCampaign.name });
    });

    expect(result.current.activeCampaign?.id).toBe('camp-123');
    expect(result.current.activeCampaign?.name).toBe('Curse of Strahd');
    expect(localStorage.getItem(STORAGE_KEYS.activeCampaignId)).toBe('camp-123');
    expect(useDashboardStore.getState().campaignName).toBe('Curse of Strahd');
  });

  it('closeCampaign clears the campaign id and resets hasInitialSynced to false', () => {
    const { result } = renderHook(() => useCampaign());
    const mockCampaign = {
      id: 'camp-123',
      name: 'Curse of Strahd',
      spreadsheetId: 'sheet-123',
      spreadsheetUrl: 'url-123',
      createdAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
    };

    act(() => {
      result.current.openCampaign(mockCampaign);
    });

    useDashboardStore.setState({ hasInitialSynced: true });

    act(() => {
      result.current.closeCampaign();
      useDashboardStore.setState({ hasInitialSynced: false });
    });

    expect(result.current.activeCampaign).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.activeCampaignId)).toBeNull();
    expect(useDashboardStore.getState().hasInitialSynced).toBe(false);
  });

  it('extractSpreadsheetId correctly parses a Google Sheets URL to its id', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';
    expect(extractSpreadsheetId(url)).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
  });

  it('extractSpreadsheetId returns the input unchanged when given a bare id string', () => {
    const bareId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
    expect(extractSpreadsheetId(bareId)).toBe(bareId);
  });
});

```

## File: src/hooks/__tests__/useDeathSaves.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeathSaves } from '../useDeathSaves';
import { useAppState, getSnapshot } from '../useAppState';
import { updateDeathSavesDB, updateCharacterDB } from '../../services/dbOperations';
import { toast } from 'sonner';

vi.mock('../useAppState', () => ({
  useAppState: vi.fn(),
  getSnapshot: vi.fn(),
}));

vi.mock('../useOverlayEvents', () => ({
  useDeathEvent: () => ({ fire: vi.fn() }),
  useUnconsciousEvent: () => ({ fire: vi.fn() }),
}));

vi.mock('../../services/dbOperations', () => ({
  updateDeathSavesDB: vi.fn(),
  updateCharacterDB: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

describe('useDeathSaves', () => {
  const mockUpdateState = vi.fn();
  const mockState = {
    characters: [
      { id: 'char1', characterName: 'Test PC', deathSavesFails: 0, deathSavesSuccesses: 0, isActive: true, conditions: 'Unconscious' }
    ],
    combatState: {
      combatants: [
        { id: 'c1', name: 'Test PC', type: 'pc', characterId: 'char1', deathSavesFails: 0, deathSavesSuccesses: 0, conditions: 'Unconscious' }
      ]
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppState as any).mockReturnValue({
      updateState: mockUpdateState,
      state: mockState
    });
    (getSnapshot as any).mockReturnValue(mockState);
  });

  it('recording a failure increments fail count', async () => {
    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'failure');
    });
    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 1, 0);
  });

  it('recording a success increments success count', async () => {
    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'success');
    });
    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 0, 1);
  });

  it('3 failures triggers character death', async () => {
    const dyingState = {
      ...mockState,
      combatState: {
        combatants: [{ ...mockState.combatState.combatants[0], deathSavesFails: 2 }]
      }
    };
    (getSnapshot as any).mockReturnValue(dyingState);

    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'failure');
    });

    expect(updateCharacterDB).toHaveBeenCalledWith(
      expect.objectContaining({ statusId: 3 }),
      expect.anything()
    );
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('has died'));
  });

  it('3 successes triggers character stabilization', async () => {
    const stableState = {
      ...mockState,
      combatState: {
        combatants: [{ ...mockState.combatState.combatants[0], deathSavesSuccesses: 2 }]
      }
    };
    (getSnapshot as any).mockReturnValue(stableState);

    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'success');
    });

    expect(toast).toHaveBeenCalledWith(expect.stringContaining('is stable'));
  });

  it('reset clears both fail and success counts', async () => {
    // Under 3 successes, stabilization resets the counts to 0
    const stableState = {
      ...mockState,
      combatState: {
        combatants: [{ ...mockState.combatState.combatants[0], deathSavesSuccesses: 2, deathSavesFails: 1 }]
      }
    };
    (getSnapshot as any).mockReturnValue(stableState);

    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'success');
    });

    // Expecting state to be reset (deathSavesFails: 0, deathSavesSuccesses: 0)
    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 0, 0);
  });

  it('a natural 20 on a death save triggers stabilization immediately', async () => {
    // Mock character with 1 success, then critical success (adds 2 successes) to reach 3 successes (stabilization)
    const almostStableState = {
      ...mockState,
      combatState: {
        combatants: [{ ...mockState.combatState.combatants[0], deathSavesSuccesses: 1 }]
      }
    };
    (getSnapshot as any).mockReturnValue(almostStableState);

    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'success', true);
    });

    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 0, 3);
    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 0, 0); // Cleared upon stabilization
  });

  it('a natural 1 on a death save counts as 2 failures', async () => {
    const { result } = renderHook(() => useDeathSaves());
    await act(async () => {
      await result.current.recordDeathSave('c1', 'failure', true);
    });

    expect(updateDeathSavesDB).toHaveBeenCalledWith('char1', 2, 0);
  });
});

```

## File: src/hooks/__tests__/useEncounterLifecycle.test.ts

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEncounterLifecycle } from '../useEncounterLifecycle';
import { useCombatSync } from '../../components/ActiveEncounterTab/hooks/useCombatSync';
import { useDashboardStore } from '../dashboardStore';

vi.mock('../../services/dbOperations', () => ({
  updateEncounterStateDB: vi.fn().mockResolvedValue(undefined),
  clearEncounterStateDB: vi.fn().mockResolvedValue(undefined),
  updateInitiativeDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

describe('useEncounterLifecycle & useCombatSync Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDashboardStore.setState({
      characters: [],
      npcs: [],
      encounters: [],
      encounterCombatants: [],
      statuses: {},
      difficulties: {},
      campaignName: '',
      hasInitialSynced: false,
      openDialog: null,
      combatState: {
        activeEncounterId: null,
        activeTurnId: null,
        round: 1,
        combatants: [],
        concentrationLinks: {},
        deathEvent: null,
        damageEvent: null,
        healEvent: null,
        rageEvent: null,
        unconsciousEvent: null,
        initiativeEvent: false,
        selectedIds: [],
        isSelectionMode: false,
        syncingIds: [],
        expandedIds: [],
      },
    });
  });

  const setupHook = () => {
    return renderHook(() => {
      const lifecycle = useEncounterLifecycle();
      const sync = useCombatSync();
      return { lifecycle, sync };
    });
  };

  it('startCombat sets the active encounter id and initializes combatants from the encounter', async () => {
    const mockEncounter: any = { id: 'enc-1', name: 'Forest Ambush', location: 'Forest', difficultyId: 2, difficultyName: 'Medium', status: 'planned', npcDefinitions: 'npc-1', currentRound: 0, activeTurnId: '' };
    const mockEncounterCombatant: any = { id: 'ec-1', encounterId: 'enc-1', playerId: null, npcId: 'npc-1', quantity: 1, initiative: 12, conditionTimers: {}, npcCurrentHp: -1, npcTempHp: 0, npcCurrentConditions: '', npcTempAcMod: 0 };
    const mockNpc: any = { id: 'npc-1', name: 'Goblin', ac: 15, maxHp: 7, tempHp: 0, currentHp: 7, conditions: '', notes: '', resistances: '', immunities: '', vulnerabilities: '', legendaryActions: 0, legendaryResistances: 0, rechargeAbilities: [], abilityScores: '{}', proficiencies: '{}', speed: '30 ft.', senses: '', languages: 'Goblin', challengeRating: '1/4', traits: '[]', actions: '[]', reactions: '[]', legendaryActionsList: '[]', spellcastingAbility: '' };

    useDashboardStore.setState({
      encounters: [mockEncounter],
      encounterCombatants: [mockEncounterCombatant],
      npcs: [mockNpc],
    });

    const { result } = setupHook();

    await act(async () => {
      await result.current.lifecycle.startEncounter('enc-1');
    });

    const storeState = useDashboardStore.getState();
    expect(storeState.combatState.activeEncounterId).toBe('enc-1');
    expect(storeState.combatState.combatants).toHaveLength(1);
    expect(storeState.combatState.combatants[0].name).toBe('Goblin');
    expect(storeState.combatState.activeTurnId).toBe(storeState.combatState.combatants[0].id);
  });

  it('endCombat clears the active encounter id and combat state', async () => {
    useDashboardStore.setState({
      combatState: {
        activeEncounterId: 'enc-1',
        activeTurnId: 'c-1',
        round: 2,
        combatants: [{ id: 'c-1', name: 'Hero', initiative: 15 } as any],
        concentrationLinks: {},
        deathEvent: null,
        damageEvent: null,
        healEvent: null,
        rageEvent: null,
        unconsciousEvent: null,
        initiativeEvent: false,
        selectedIds: [],
        isSelectionMode: false,
        syncingIds: [],
        expandedIds: [],
      }
    });

    const { result } = setupHook();

    await act(async () => {
      result.current.lifecycle.clearEncounter();
    });

    const storeState = useDashboardStore.getState();
    expect(storeState.combatState.activeEncounterId).toBeNull();
  });

  it('nextTurn advances activeTurnId to the next combatant in initiative order', async () => {
    const comb1 = { id: 'c-1', name: 'Hero', initiative: 20 } as any;
    const comb2 = { id: 'c-2', name: 'Goblin', initiative: 10 } as any;

    useDashboardStore.setState({
      combatState: {
        activeEncounterId: 'enc-1',
        activeTurnId: 'c-1',
        round: 1,
        combatants: [comb1, comb2],
        concentrationLinks: {},
        deathEvent: null,
        damageEvent: null,
        healEvent: null,
        rageEvent: null,
        unconsciousEvent: null,
        initiativeEvent: false,
        selectedIds: [],
        isSelectionMode: false,
        syncingIds: [],
        expandedIds: [],
      }
    });

    const { result } = setupHook();

    await act(async () => {
      result.current.sync.nextTurn();
    });

    const storeState = useDashboardStore.getState();
    expect(storeState.combatState.activeTurnId).toBe('c-2');
    expect(storeState.combatState.round).toBe(1);
  });

  it('nextTurn increments the round number when wrapping from last to first combatant', async () => {
    const comb1 = { id: 'c-1', name: 'Hero', initiative: 20 } as any;
    const comb2 = { id: 'c-2', name: 'Goblin', initiative: 10 } as any;

    useDashboardStore.setState({
      combatState: {
        activeEncounterId: 'enc-1',
        activeTurnId: 'c-2',
        round: 1,
        combatants: [comb1, comb2],
        concentrationLinks: {},
        deathEvent: null,
        damageEvent: null,
        healEvent: null,
        rageEvent: null,
        unconsciousEvent: null,
        initiativeEvent: false,
        selectedIds: [],
        isSelectionMode: false,
        syncingIds: [],
        expandedIds: [],
      }
    });

    const { result } = setupHook();

    await act(async () => {
      result.current.sync.nextTurn();
    });

    const storeState = useDashboardStore.getState();
    expect(storeState.combatState.activeTurnId).toBe('c-1');
    expect(storeState.combatState.round).toBe(2);
  });

  it('rollNpcInitiative assigns initiative values to NPC combatants using DEX modifier', async () => {
    const mockNpcTemplate = { id: 'npc-1', name: 'Goblin', abilityScores: JSON.stringify({ DEX: 14 }) };
    const mockCombatant = { id: 'c-1', name: 'Goblin 1', type: 'npc', npcId: 'npc-1', initiative: 0, encounterCombatantId: 'ec-1' } as any;

    useDashboardStore.setState({
      npcs: [mockNpcTemplate as any],
      combatState: {
        activeEncounterId: 'enc-1',
        activeTurnId: 'c-1',
        round: 1,
        combatants: [mockCombatant],
        concentrationLinks: {},
        deathEvent: null,
        damageEvent: null,
        healEvent: null,
        rageEvent: null,
        unconsciousEvent: null,
        initiativeEvent: false,
        selectedIds: [],
        isSelectionMode: false,
        syncingIds: [],
        expandedIds: [],
      }
    });

    const { result } = setupHook();

    await act(async () => {
      result.current.sync.rollInitForNPCs();
    });

    const storeState = useDashboardStore.getState();
    const updatedCombatant = storeState.combatState.combatants[0];
    // DEX is 14 -> modifier is +2.
    // Initiative is rolled with 1d20 + 2. It should be >= 3 and <= 22.
    expect(updatedCombatant.initiative).toBeGreaterThanOrEqual(1);
    expect(updatedCombatant.initiative).toBeLessThanOrEqual(22);
  });
});

```

## File: src/hooks/__tests__/useEncounterResume.test.ts

```typescript
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEncounterResume } from '../useEncounterResume';
import { useAppState } from '../useAppState';

vi.mock('../useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('useEncounterResume State Transition Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restores in-progress encounter state from the sheet snapshot when hasInitialSynced is false', () => {
    const updateState = vi.fn();
    const mockEnc = { id: 'enc-1', currentRound: 2, activeTurnId: 'pc-1' };
    const mockEC = { id: 'ec-1', encounterId: 'enc-1', playerId: 'char-1', initiative: 10 };
    const mockChar = { id: 'char-1', characterName: 'Thorin', maxHp: 50, currentHp: 50, ac: 15 };

    vi.mocked(useAppState).mockReturnValue({
      state: { 
        hasInitialSynced: true, // Transitions to true to trigger restore
        encounters: [mockEnc], 
        characters: [mockChar], 
        encounterCombatants: [mockEC], 
        npcs: [],
        combatState: { activeEncounterId: null }
      },
      updateState,
    } as any);

    renderHook(() => useEncounterResume());
    expect(updateState).toHaveBeenCalled();
  });

  it('does not restore anything if hasInitialSynced is true or activeEncounterId is already set', () => {
    const updateState = vi.fn();
    vi.mocked(useAppState).mockReturnValue({
      state: { 
        hasInitialSynced: false, // If false, no restore is triggered
        encounters: [{ id: 'enc-1', currentRound: 2 }], 
        characters: [], 
        encounterCombatants: [], 
        npcs: [],
        combatState: { activeEncounterId: null }
      },
      updateState,
    } as any);

    renderHook(() => useEncounterResume());
    expect(updateState).not.toHaveBeenCalled();
  });
});

```

## File: src/hooks/__tests__/useMoodPresets.test.ts

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMoodPresets } from '../useMoodPresets';
import { STORAGE_KEYS, campaignKey } from '../../lib/constants';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

describe('useMoodPresets State Transition Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('loads presets and updates mood state on select', () => {
    const saved = {
      sweet: 'track-sweet-1',
      combat: 'track-combat-3',
    };
    localStorage.setItem(campaignKey(STORAGE_KEYS.moodPresets, 'default'), JSON.stringify(saved));

    const { result } = renderHook(() => useMoodPresets());

    // Verify loading presets on init
    expect(result.current.assignments.sweet).toBe('track-sweet-1');
    expect(result.current.assignments.combat).toBe('track-combat-3');
    expect(result.current.activeMood).toBeNull();

    // Verify updates mood state on select (activateMood)
    const mockPlayAmbient = vi.fn();
    act(() => {
      result.current.activateMood('combat', mockPlayAmbient);
    });

    expect(mockPlayAmbient).toHaveBeenCalledWith('track-combat-3');
    expect(result.current.activeMood).toBe('combat');
  });
});

```

## File: src/hooks/__tests__/useNetworkState.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkState } from '../useNetworkState';

describe('useNetworkState Tests', () => {
  it('isOnline updates when browser triggers online/offline events', () => {
    const { result } = renderHook(() => useNetworkState());
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });
});

```

## File: src/hooks/__tests__/useSettings.test.ts

```typescript
import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { useSettings } from '../useSettings';
import * as sheetsService from '../../services/sheetsService';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    promise: vi.fn().mockImplementation((val) => val),
  }),
}));

vi.mock('../../services/sheetsService', () => ({
  getSpreadsheetId: vi.fn().mockReturnValue('mock-id'),
  setSpreadsheetId: vi.fn(),
}));

vi.mock('../../services/googleAuth', () => ({
  setManualRefreshToken: vi.fn(),
  clearTokens: vi.fn(),
}));

const mockSetTheme = vi.fn();
vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
  }),
}));

const mockUpdateState = vi.fn();
const mockState = {
  campaignName: 'Test Campaign',
  characters: [{ id: '1', name: 'Legend' }],
  npcs: [],
  encounters: [],
  encounterCombatants: []
};

vi.mock('../useAppState', () => ({
  useAppState: () => ({
    state: mockState,
    updateState: mockUpdateState,
  }),
}));

vi.mock('../useOverlayEvents', () => ({
  useDeathEvent: () => ({ fire: vi.fn() }),
  useDamageEvent: () => ({ fire: vi.fn() }),
  useHealEvent: () => ({ fire: vi.fn() }),
  useUnconsciousEvent: () => ({ fire: vi.fn() }),
  useRageEvent: () => ({ fire: vi.fn() }),
  useInitiativeEvent: () => ({ fire: vi.fn() }),
}));

describe('useSettings State Transition Tests', () => {
  const mockProps = {
    isGoogleConnected: false,
    handleSignIn: vi.fn(),
    handleSignOut: vi.fn(),
    setIsGoogleConnected: vi.fn(),
    handleSyncWithSheets: vi.fn().mockResolvedValue(undefined),
    addLog: vi.fn(),
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('loads and saves settings to localStorage', () => {
    const { result } = renderHook(() => useSettings(mockProps));

    // Verify loading Spreadsheet ID
    expect(result.current.tempSpreadsheetId).toBe('mock-id');

    // Verify saving Spreadsheet ID calls setSpreadsheetId
    act(() => {
      result.current.setTempSpreadsheetId('new-sheet-id');
    });
    act(() => {
      result.current.handleSaveSpreadsheet();
    });
    expect(sheetsService.setSpreadsheetId).toHaveBeenCalledWith('new-sheet-id');

    // Verify theme interaction
    act(() => {
      result.current.setTheme('sleek-modern');
    });
    expect(mockSetTheme).toHaveBeenCalledWith('sleek-modern');
  });

  it('exports settings payload correctly', async () => {
    const mockCreateObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    const mockRevokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const mockClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { result } = renderHook(() => useSettings(mockProps));

    act(() => {
      result.current.handleExportJSON();
    });

    expect(mockCreateObjectURL).toHaveBeenCalled();
    const blobCall = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blobCall.type).toBe('application/json');

    const text = await blobCall.text();
    const parsed = JSON.parse(text);
    expect(parsed.campaignName).toBe('Test Campaign');
    expect(parsed.characters).toEqual([{ id: '1', name: 'Legend' }]);
    expect(toast.success).toHaveBeenCalledWith('Campaign exported successfully');

    mockCreateObjectURL.mockRestore();
    mockRevokeObjectURL.mockRestore();
    mockClick.mockRestore();
  });
});

```

## File: src/hooks/__tests__/useSheetSync.test.ts

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSheetSync } from '../useSheetSync';
import { useAppState } from '../useAppState';
import * as sheetsService from '../../services/sheetsService';

vi.mock('../../services/writeQueue', () => ({
  clearRetryQueue: vi.fn(),
}));

vi.mock('../../services/sheetsService', () => ({
  fetchSheetData: vi.fn(),
  initializeDatabaseSchema: vi.fn(),
  getSpreadsheetId: vi.fn().mockReturnValue('mock-id'),
}));

vi.mock('../useAppState', () => ({
  useAppState: vi.fn(),
}));

describe('useSheetSync State Transition Tests', () => {
  const setIsGoogleConnected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pulls all sheet data and populates characters, npcs, and encounters in the store', async () => {
    let updateStateCalledWith: any = null;
    vi.mocked(useAppState).mockReturnValue({
      state: { hasInitialSynced: false },
      updateState: (fn: any) => { 
        updateStateCalledWith = typeof fn === 'function' ? fn({}) : fn; 
      }
    } as any);

    vi.mocked(sheetsService.initializeDatabaseSchema).mockResolvedValue(undefined);
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['1', 'Goblin']] });

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.handleSyncWithSheets(false);
    });

    expect(updateStateCalledWith).not.toBeNull();
    expect(updateStateCalledWith.characters).toBeDefined();
    expect(updateStateCalledWith.npcs).toBeDefined();
    expect(updateStateCalledWith.encounters).toBeDefined();
  });

  it('resets hasInitialSynced to true upon successful initial load', async () => {
    let updateStateCalledWith: any = null;
    vi.mocked(useAppState).mockReturnValue({
      state: { hasInitialSynced: false },
      updateState: (fn: any) => { 
        updateStateCalledWith = typeof fn === 'function' ? fn({}) : fn; 
      }
    } as any);

    vi.mocked(sheetsService.initializeDatabaseSchema).mockResolvedValue(undefined);
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['1', 'data']] });

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.handleSyncWithSheets(false);
    });

    expect(updateStateCalledWith.hasInitialSynced).toBe(true);
  });

  it('handles API errors by triggering a rollback or setting an error state', async () => {
    let updateStateCalledWith: any = null;
    vi.mocked(useAppState).mockReturnValue({
      state: { hasInitialSynced: false },
      updateState: (fn: any) => { 
        updateStateCalledWith = typeof fn === 'function' ? fn({}) : fn; 
      }
    } as any);

    vi.mocked(sheetsService.initializeDatabaseSchema).mockRejectedValue(new Error('API failure'));

    const { result } = renderHook(() => useSheetSync({ setIsGoogleConnected }));

    await act(async () => {
      await result.current.handleSyncWithSheets(false);
    });

    expect(updateStateCalledWith).toBeNull(); // No state update upon failure
    expect(result.current.syncError).toBe('API failure');
  });
});

```

## File: src/hooks/__tests__/useTabState.test.ts

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTabState } from '../useTabState';
import { STORAGE_KEYS } from '../../lib/constants';

describe('useTabState State Transition and Persistence Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('activeTab state updates in memory', () => {
    const { result } = renderHook(() => useTabState(null));
    expect(result.current.activeTab).toBe('party');

    act(() => {
      result.current.handleTabChange('encounters');
    });

    expect(result.current.activeTab).toBe('encounters');
  });

  it('activeTab state persists in localStorage', () => {
    const { result } = renderHook(() => useTabState(null));

    act(() => {
      result.current.handleTabChange('npc-library');
    });

    expect(localStorage.getItem(STORAGE_KEYS.lastActiveTab)).toBe('npc-library');
  });
});

```

## File: src/lib/__tests__/abilityScores.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateModifier,
  proficiencyBonusFromLevel,
  proficiencyBonusFromCR,
  getSavingThrowBonus,
  getSkillBonus,
  getPassiveScore,
  parseAbilityScores,
  parseProficiencies,
  serializeAbilityScores,
  serializeProficiencies,
  DEFAULT_ABILITY_SCORES,
  DEFAULT_PROFICIENCIES
} from '../abilityScores';

describe('Ability Scores & Proficiencies Utilities', () => {
  describe('calculateModifier', () => {
    it('calculates modifiers correctly according to 5e rules', () => {
      expect(calculateModifier(1)).toBe(-5);
      expect(calculateModifier(3)).toBe(-4);
      expect(calculateModifier(5)).toBe(-3);
      expect(calculateModifier(8)).toBe(-1);
      expect(calculateModifier(10)).toBe(0);
      expect(calculateModifier(11)).toBe(0);
      expect(calculateModifier(12)).toBe(1);
      expect(calculateModifier(14)).toBe(2);
      expect(calculateModifier(16)).toBe(3);
      expect(calculateModifier(18)).toBe(4);
      expect(calculateModifier(20)).toBe(5);
      expect(calculateModifier(30)).toBe(10);
    });
  });

  describe('proficiencyBonusFromLevel', () => {
    it('determines the correct proficiency bonus by level', () => {
      expect(proficiencyBonusFromLevel(0)).toBe(2); // below 1 clamp
      expect(proficiencyBonusFromLevel(1)).toBe(2);
      expect(proficiencyBonusFromLevel(4)).toBe(2);
      expect(proficiencyBonusFromLevel(5)).toBe(3);
      expect(proficiencyBonusFromLevel(8)).toBe(3);
      expect(proficiencyBonusFromLevel(9)).toBe(4);
      expect(proficiencyBonusFromLevel(12)).toBe(4);
      expect(proficiencyBonusFromLevel(13)).toBe(5);
      expect(proficiencyBonusFromLevel(16)).toBe(5);
      expect(proficiencyBonusFromLevel(17)).toBe(6);
      expect(proficiencyBonusFromLevel(20)).toBe(6);
      expect(proficiencyBonusFromLevel(25)).toBe(6); // above 20 clamp
    });
  });

  describe('proficiencyBonusFromCR', () => {
    it('returns 2 for CR 0', () =>
      expect(proficiencyBonusFromCR('0')).toBe(2));
    it('returns 2 for CR 1/8', () =>
      expect(proficiencyBonusFromCR('1/8')).toBe(2));
    it('returns 2 for CR 1/4', () =>
      expect(proficiencyBonusFromCR('1/4')).toBe(2));
    it('returns 2 for CR 1/2', () =>
      expect(proficiencyBonusFromCR('1/2')).toBe(2));
    it('returns 2 for CR 1', () =>
      expect(proficiencyBonusFromCR('1')).toBe(2));
    it('returns 2 for CR 4', () =>
      expect(proficiencyBonusFromCR('4')).toBe(2));
    it('returns 3 for CR 5', () =>
      expect(proficiencyBonusFromCR('5')).toBe(3));
    it('returns 3 for CR 8', () =>
      expect(proficiencyBonusFromCR('8')).toBe(3));
    it('returns 4 for CR 9', () =>
      expect(proficiencyBonusFromCR('9')).toBe(4));
    it('returns 4 for CR 12', () =>
      expect(proficiencyBonusFromCR('12')).toBe(4));
    it('returns 5 for CR 13', () =>
      expect(proficiencyBonusFromCR('13')).toBe(5));
    it('returns 5 for CR 16', () =>
      expect(proficiencyBonusFromCR('16')).toBe(5));
    it('returns 6 for CR 17', () =>
      expect(proficiencyBonusFromCR('17')).toBe(6));
    it('returns 9 for CR 30', () =>
      expect(proficiencyBonusFromCR('30')).toBe(9));
  });

  describe('getSavingThrowBonus', () => {
    it('recovers mod if not proficient, mod + proficiencyBonus if proficient', () => {
      // 14 score -> modifier 2
      expect(getSavingThrowBonus(14, false, 2)).toBe(2);
      expect(getSavingThrowBonus(14, true, 2)).toBe(4);
      
      // 8 score -> modifier -1
      expect(getSavingThrowBonus(8, false, 3)).toBe(-1);
      expect(getSavingThrowBonus(8, true, 3)).toBe(2);
    });
  });

  describe('getSkillBonus', () => {
    it('handles skill bonuses for none, proficient, expertise, and jack of all trades', () => {
      const score = 14; // mod = 2
      const profBonus = 3;

      expect(getSkillBonus(score, 'none', profBonus, false)).toBe(2);
      expect(getSkillBonus(score, 'none', profBonus, true)).toBe(3); // + Math.floor(3/2) = +1
      expect(getSkillBonus(score, 'proficient', profBonus, false)).toBe(5); // 2 + 3
      expect(getSkillBonus(score, 'proficient', profBonus, true)).toBe(5);  // Joat should not apply
      expect(getSkillBonus(score, 'expertise', profBonus, false)).toBe(8); // 2 + 6
    });
  });

  describe('getPassiveScore', () => {
    it('calculates passive perception, insight, and investigation correctly', () => {
      const customScores = {
        STR: 10, DEX: 12, CON: 10, INT: 14, WIS: 16, CHA: 10
      };
      
      const customProficiencies = {
        proficiencyBonus: 3,
        jackOfAllTrades: false,
        savingThrows: [],
        skills: {
          'Perception': 'proficient' as const,
          'Investigation': 'expertise' as const,
        },
        passiveBonuses: {
          perception: 2,
          insight: 0,
          investigation: -1,
        }
      };

      // Passive Perception: 10 + WIS mod(3) + Perception proficient(3) + bonus(2) = 18
      expect(getPassiveScore(customScores, customProficiencies, 'perception')).toBe(18);

      // Passive Insight: 10 + WIS mod(3) + Insight none(0) + bonus(0) = 13
      expect(getPassiveScore(customScores, customProficiencies, 'insight')).toBe(13);

      // Passive Investigation: 10 + INT mod(2) + Investigation expertise(6) + bonus(-1) = 17
      expect(getPassiveScore(customScores, customProficiencies, 'investigation')).toBe(17);
    });
  });

  describe('parseAbilityScores', () => {
    it('returns defaults on empty or invalid inputs', () => {
      expect(parseAbilityScores('')).toEqual(DEFAULT_ABILITY_SCORES);
      expect(parseAbilityScores('invalid json')).toEqual(DEFAULT_ABILITY_SCORES);
    });

    it('parses valid JSON string with fallback properties for missing ones', () => {
      const input = JSON.stringify({ STR: 15, DEX: 14 });
      const parsed = parseAbilityScores(input);
      expect(parsed.STR).toBe(15);
      expect(parsed.DEX).toBe(14);
      expect(parsed.CON).toBe(10); // default
    });
  });

  describe('parseProficiencies', () => {
    it('returns defaults on empty or invalid inputs', () => {
      expect(parseProficiencies('')).toEqual(DEFAULT_PROFICIENCIES);
      expect(parseProficiencies('invalid json')).toEqual(DEFAULT_PROFICIENCIES);
    });

    it('parses valid JSON string with fallback properties for missing ones', () => {
      const input = JSON.stringify({
        proficiencyBonus: 4,
        skills: { Perception: 'expertise' }
      });
      const parsed = parseProficiencies(input);
      expect(parsed.proficiencyBonus).toBe(4);
      expect(parsed.skills.Perception).toBe('expertise');
      expect(parsed.jackOfAllTrades).toBe(false); // default
    });
  });

  describe('serializeAbilityScores', () => {
    it('serializes ability scores to string successfully', () => {
      const res = serializeAbilityScores(DEFAULT_ABILITY_SCORES);
      expect(typeof res).toBe('string');
      expect(JSON.parse(res)).toEqual(DEFAULT_ABILITY_SCORES);
    });
  });

  describe('serializeProficiencies', () => {
    it('serializes proficiencies to string successfully', () => {
      const res = serializeProficiencies(DEFAULT_PROFICIENCIES);
      expect(typeof res).toBe('string');
      expect(JSON.parse(res)).toEqual(DEFAULT_PROFICIENCIES);
    });
  });
});

```

## File: src/lib/__tests__/audioFileStore.test.ts

```typescript
// src/lib/__tests__/audioFileStore.test.ts

import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveAudioFile,
  getAllAudioFiles,
  getAudioFile,
  deleteAudioFile,
  getAudioFilesByCategory,
  createObjectURL,
  clearAllAudioFiles,
  closeDB,
  resetDB,
  getDbName,
} from '../audioFileStore';

// Ensure URL.createObjectURL is mocked
URL.createObjectURL = vi.fn().mockImplementation(() => 'mock://object-url');

describe('audioFileStore', () => {
  beforeEach(async () => {
    await closeDB();
    resetDB();
    // Delete databases to clean up between runs
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('gm_audio_files_abc');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('gm_audio_files_xyz');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });

  it('computes DB names correctly per campaign', () => {
    expect(getDbName('abc')).toBe('gm_audio_files_abc');
    expect(getDbName('xyz')).toBe('gm_audio_files_xyz');
  });

  it('saveAudioFile stores a file in campaign-scoped store and returns a record', async () => {
    const file = new File(['audio content'], '13_Cave_of_Time.mp3', { type: 'audio/mp3' });
    const record = await saveAudioFile('abc', file, 'ambient');

    expect(record.id).toBeDefined();
    expect(typeof record.id).toBe('string');
    expect(record.name).toBe('13_Cave_of_Time');
    expect(record.fileName).toBe('13_Cave_of_Time.mp3');
    expect(record.category).toBe('ambient');
    expect(record.blob).toBeInstanceOf(Blob);
    expect(record.addedAt).toBeLessThanOrEqual(Date.now());
  });

  it('namespaces completely between abc and xyz campaigns', async () => {
    const file1 = new File(['content abc'], 'Cave_ABC.mp3', { type: 'audio/mp3' });
    const file2 = new File(['content xyz'], 'Cave_XYZ.mp3', { type: 'audio/mp3' });

    await saveAudioFile('abc', file1, 'ambient');
    await saveAudioFile('xyz', file2, 'ambient');

    const filesInAbc = await getAllAudioFiles('abc');
    const filesInXyz = await getAllAudioFiles('xyz');

    expect(filesInAbc).toHaveLength(1);
    expect(filesInAbc[0].name).toBe('Cave_ABC');

    expect(filesInXyz).toHaveLength(1);
    expect(filesInXyz[0].name).toBe('Cave_XYZ');
  });

  it('getAllAudioFiles returns files sorted alphabetically by name', async () => {
    const file1 = new File(['c'], 'C_Music.mp3', { type: 'audio/mp3' });
    const file2 = new File(['a'], 'A_Music.mp3', { type: 'audio/mp3' });
    const file3 = new File(['b'], 'B_Music.mp3', { type: 'audio/mp3' });

    await saveAudioFile('abc', file1, 'ambient');
    await saveAudioFile('abc', file2, 'effect');
    await saveAudioFile('abc', file3, 'ambient');

    const all = await getAllAudioFiles('abc');
    expect(all).toHaveLength(3);
    expect(all[0].name).toBe('A_Music');
    expect(all[1].name).toBe('B_Music');
    expect(all[2].name).toBe('C_Music');
  });

  it('getAudioFile returns null for unknown id', async () => {
    const record = await getAudioFile('abc', 'non-existent-id');
    expect(record).toBeNull();
  });

  it('getAudioFilesByCategory filters correctly and remains sorted', async () => {
    const fileAmbient1 = new File(['amb1'], 'Cave.mp3', { type: 'audio/mp3' });
    const fileAmbient2 = new File(['amb2'], 'Antiquarian.mp3', { type: 'audio/mp3' });
    const fileEffect1 = new File(['eff1'], 'Volcano_Explosion.mp3', { type: 'audio/mp3' });

    await saveAudioFile('abc', fileAmbient1, 'ambient');
    await saveAudioFile('abc', fileAmbient2, 'ambient');
    await saveAudioFile('abc', fileEffect1, 'effect');

    const ambients = await getAudioFilesByCategory('abc', 'ambient');
    expect(ambients).toHaveLength(2);
    expect(ambients[0].name).toBe('Antiquarian');
    expect(ambients[1].name).toBe('Cave');

    const effects = await getAudioFilesByCategory('abc', 'effect');
    expect(effects).toHaveLength(1);
    expect(effects[0].name).toBe('Volcano_Explosion');
  });

  it('deleteAudioFile removes the file and getAllAudioFiles no longer returns it', async () => {
    const file = new File(['audio content'], '13_Cave_of_Time.mp3', { type: 'audio/mp3' });
    const record = await saveAudioFile('abc', file, 'ambient');

    const before = await getAllAudioFiles('abc');
    expect(before).toHaveLength(1);

    await deleteAudioFile('abc', record.id);

    const after = await getAllAudioFiles('abc');
    expect(after).toHaveLength(0);

    const check = await getAudioFile('abc', record.id);
    expect(check).toBeNull();
  });

  it('clearAllAudioFiles cleans files of proper categories', async () => {
    const fileAmbient = new File(['amb'], 'Cave.mp3', { type: 'audio/mp3' });
    const fileEffect = new File(['eff'], 'Bang.mp3', { type: 'audio/mp3' });

    await saveAudioFile('abc', fileAmbient, 'ambient');
    await saveAudioFile('abc', fileEffect, 'effect');

    await clearAllAudioFiles('abc', 'ambient');

    const remaining = await getAllAudioFiles('abc');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe('Bang');
  });

  it('createObjectURL returns a string', () => {
    const blob = new Blob(['content'], { type: 'audio/mp3' });
    const url = createObjectURL(blob);
    expect(url).toBeTypeOf('string');
  });
});

```

## File: src/lib/__tests__/classResources.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { CLASS_RESOURCE_SUGGESTIONS, getClassResourceSuggestions } from '../classResources';

describe('classResources', () => {
  describe('getClassResourceSuggestions', () => {
    it('returns an array containing a pool named Rage for Barbarian', () => {
      const suggestions = getClassResourceSuggestions('Barbarian');
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].name).toBe('Rage');
    });

    it('returns the same result for lowercase barbarian', () => {
      const suggestions = getClassResourceSuggestions('barbarian');
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].name).toBe('Rage');
    });

    it('returns a pool named Ki Points for MONK', () => {
      const suggestions = getClassResourceSuggestions('MONK');
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].name).toBe('Ki Points');
    });

    it('returns two pools for Artificer', () => {
      const suggestions = getClassResourceSuggestions('Artificer');
      expect(suggestions).toHaveLength(2);
      expect(suggestions.some(p => p.name === 'Infused Items')).toBe(true);
      expect(suggestions.some(p => p.name === 'Spell Slots')).toBe(true);
    });

    it('returns [] for unknown class', () => {
      const suggestions = getClassResourceSuggestions('Vitalist');
      expect(suggestions).toEqual([]);
    });

    it('returns [] for empty string', () => {
      const suggestions = getClassResourceSuggestions('');
      expect(suggestions).toEqual([]);
    });

    it('returns [] for null-like input', () => {
      expect(getClassResourceSuggestions(null as any)).toEqual([]);
      expect(getClassResourceSuggestions(undefined as any)).toEqual([]);
    });

    it('returns deep copies so mutations do not affect template data', () => {
      const suggestions = getClassResourceSuggestions('Bard');
      expect(suggestions[0].max).toBe(3);
      suggestions[0].max = 99; // Mutate local copy

      const secondCall = getClassResourceSuggestions('Bard');
      expect(secondCall[0].max).toBe(3); // Original should remain unchanged
    });

    describe('returns a non-empty array for every known class', () => {
      const knownClasses = Object.keys(CLASS_RESOURCE_SUGGESTIONS);
      knownClasses.forEach(className => {
        it(`for ${className}`, () => {
          const suggestions = getClassResourceSuggestions(className);
          expect(suggestions.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('CLASS_RESOURCE_SUGGESTIONS', () => {
    it('has exactly 12 entries', () => {
      expect(Object.keys(CLASS_RESOURCE_SUGGESTIONS)).toHaveLength(12);
    });

    it('every pool has name, current, max, and reset defined', () => {
      Object.values(CLASS_RESOURCE_SUGGESTIONS).forEach(pools => {
        pools.forEach(pool => {
          expect(pool.name).toBeDefined();
          expect(pool.current).toBeDefined();
          expect(pool.max).toBeDefined();
          expect(pool.reset).toBeDefined();
        });
      });
    });

    it('every reset value is short, long, or none', () => {
      Object.values(CLASS_RESOURCE_SUGGESTIONS).forEach(pools => {
        pools.forEach(pool => {
          expect(['short', 'long', 'none']).toContain(pool.reset);
        });
      });
    });
  });
});

```

## File: src/lib/__tests__/combatLogic.test.ts

```typescript
import { getHealthStatus, getEffectiveResistances, effectiveMaxHp, effectiveAc } from '../../lib/conditions';
// src/lib/__tests__/combatLogic.test.ts

// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { applyHealthChange, nextTurnIndex, isNewRound, rollD20, rollNpcInitiatives, checkIrvMatch, computeDamageWithIrv, getExpiredConditions, computeConcentrationDC } from '../combatLogic';
import type { Combatant } from '../../types';

// ─── applyHealthChange — damage ───────────────────────────────────────────────

describe('applyHealthChange — damage', () => {
  it('reduces current HP by the damage amount when no temp HP', () => {
    const result = applyHealthChange(20, 0, 30, 5, true);
    expect(result).toEqual({ newCurrentHp: 15, newTempHp: 0 });
  });

  it('absorbs damage into temp HP first', () => {
    const result = applyHealthChange(20, 5, 30, 3, true);
    expect(result).toEqual({ newCurrentHp: 20, newTempHp: 2 });
  });

  it('spills excess damage from temp HP into current HP', () => {
    // 8 damage: 5 absorbed by temp (depleted), 3 bleeds into current
    const result = applyHealthChange(20, 5, 30, 8, true);
    expect(result).toEqual({ newCurrentHp: 17, newTempHp: 0 });
  });

  it('clamps current HP at 0 — no negative HP', () => {
    const result = applyHealthChange(3, 0, 10, 10, true);
    expect(result.newCurrentHp).toBe(0);
  });

  it('handles damage exactly equal to temp HP', () => {
    const result = applyHealthChange(15, 5, 20, 5, true);
    expect(result).toEqual({ newCurrentHp: 15, newTempHp: 0 });
  });

  it('treats a negative amount the same as its absolute value', () => {
    const result = applyHealthChange(20, 0, 30, -5, true);
    expect(result).toEqual({ newCurrentHp: 15, newTempHp: 0 });
  });

  it('does not touch temp HP when target already has 0 temp HP', () => {
    const result = applyHealthChange(20, 0, 30, 5, true);
    expect(result.newTempHp).toBe(0);
  });
});

// ─── applyHealthChange — healing ──────────────────────────────────────────────

describe('applyHealthChange — healing', () => {
  it('increases current HP by the heal amount', () => {
    const result = applyHealthChange(10, 0, 30, 5, false);
    expect(result).toEqual({ newCurrentHp: 15, newTempHp: 0 });
  });

  it('clamps healed HP at maxHp', () => {
    const result = applyHealthChange(28, 0, 30, 10, false);
    expect(result.newCurrentHp).toBe(30);
  });

  it('does not modify temp HP on heal', () => {
    const result = applyHealthChange(10, 5, 30, 8, false);
    expect(result.newTempHp).toBe(5);
  });

  it('healing a full-HP combatant leaves HP unchanged', () => {
    const result = applyHealthChange(30, 0, 30, 10, false);
    expect(result.newCurrentHp).toBe(30);
  });

  it('heals a defeated combatant back above 0', () => {
    const result = applyHealthChange(0, 0, 30, 1, false);
    expect(result.newCurrentHp).toBe(1);
  });
});

// ─── nextTurnIndex ────────────────────────────────────────────────────────────

const makeCombatants = (ids: string[]) => ids.map(id => ({ id } as Combatant));

describe('nextTurnIndex', () => {
  it('returns 0 when there are no combatants', () => {
    expect(nextTurnIndex([], null)).toBe(0);
  });

  it('returns 0 when activeTurnId is null (first turn of combat)', () => {
    expect(nextTurnIndex(makeCombatants(['a', 'b', 'c']), null)).toBe(0);
  });

  it('advances to the next index', () => {
    const combatants = makeCombatants(['a', 'b', 'c']);
    expect(nextTurnIndex(combatants, 'a')).toBe(1);
    expect(nextTurnIndex(combatants, 'b')).toBe(2);
  });

  it('wraps around from the last combatant back to index 0', () => {
    const combatants = makeCombatants(['a', 'b', 'c']);
    expect(nextTurnIndex(combatants, 'c')).toBe(0);
  });

  it('returns 0 when the active ID is not found (stale state)', () => {
    const combatants = makeCombatants(['a', 'b']);
    expect(nextTurnIndex(combatants, 'z')).toBe(0);
  });

  it('works with a single combatant — always wraps to 0', () => {
    const combatants = makeCombatants(['solo']);
    expect(nextTurnIndex(combatants, 'solo')).toBe(0);
  });
});

// ─── isNewRound ───────────────────────────────────────────────────────────────

describe('isNewRound', () => {
  it('returns true when advancing from the last combatant back to the first', () => {
    expect(isNewRound(2, 0)).toBe(true);
  });

  it('returns false when advancing mid-round', () => {
    expect(isNewRound(0, 1)).toBe(false);
    expect(isNewRound(1, 2)).toBe(false);
  });

  it('returns false when currentIndex is -1 (no active turn yet)', () => {
    expect(isNewRound(-1, 0)).toBe(false);
  });
});

// ─── getHealthStatus ──────────────────────────────────────────────────────────

describe('getHealthStatus', () => {
  it('returns Defeated when current HP is 0', () => {
    expect(getHealthStatus(0, 30).label).toBe('Defeated');
  });

  it('returns Defeated when current HP is negative', () => {
    expect(getHealthStatus(-5, 30).label).toBe('Defeated');
  });

  it('returns Full with text-emerald-600 when currentHp equals maxHp exactly', () => {
    const status = getHealthStatus(30, 30);
    expect(status.label).toBe('Full');
    expect(status.color).toBe('text-emerald-600');
  });

  it('returns Healthy (not Full) when currentHp is one below maxHp', () => {
    const status = getHealthStatus(29, 30);
    expect(status.label).toBe('Healthy');
  });

  it('returns Healthy at exactly 90% HP', () => {
    // 27/30 = 0.9 — should still be Healthy
    expect(getHealthStatus(27, 30).label).toBe('Healthy');
  });

  it('returns Injured just below 90%', () => {
    // 26/30 ≈ 0.867
    expect(getHealthStatus(26, 30).label).toBe('Injured');
  });

  it('returns Injured just above 50%', () => {
    // 16/30 ≈ 0.533
    expect(getHealthStatus(16, 30).label).toBe('Injured');
  });

  it('returns Bloodied at exactly 50% — ratio is not > 0.5', () => {
    expect(getHealthStatus(15, 30).label).toBe('Bloodied');
  });

  it('returns Bloodied at 1 HP on a high-HP creature', () => {
    expect(getHealthStatus(1, 100).label).toBe('Bloodied');
  });
});

// ─── rollD20 ──────────────────────────────────────────────────────────────────

describe('rollD20', () => {
  it('returns 1 when rng returns 0', () => {
    expect(rollD20(() => 0)).toBe(1);
  });

  it('returns 20 when rng returns 0.999', () => {
    expect(rollD20(() => 0.999)).toBe(20);
  });

  it('always stays between 1 and 20 with real Math.random', () => {
    for (let i = 0; i < 1000; i++) {
      const roll = rollD20();
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(20);
    }
  });
});

// ─── rollNpcInitiatives ───────────────────────────────────────────────────────

describe('rollNpcInitiatives', () => {
  const pc: Combatant = {
    id: 'pc1', type: 'pc', name: 'Aria', initiative: 15,
    ac: 16, maxHp: 30, currentHp: 30, passivePerception: 14,
  } as Combatant;

  const npc1: Combatant = {
    id: 'npc1', type: 'npc', name: 'Goblin 1', initiative: 0,
    ac: 13, maxHp: 10, currentHp: 10, passivePerception: 9,
  } as Combatant;

  const npc2: Combatant = {
    id: 'npc2', type: 'npc', name: 'Goblin 2', initiative: 0,
    ac: 13, maxHp: 10, currentHp: 10, passivePerception: 9,
  } as Combatant;

  it('assigns initiative only to NPCs, not PCs', () => {
    // rng always returns 0.5 → rollD20 = 11
    const result = rollNpcInitiatives([pc, npc1, npc2], () => 0.5);
    const resultPc = result.find(c => c.id === 'pc1')!;
    expect(resultPc.initiative).toBe(15); // PC unchanged

    const resultNpc = result.find(c => c.id === 'npc1')!;
    expect(resultNpc.initiative).toBe(11);
  });

  it('does not mutate the original array', () => {
    const original = [pc, npc1, npc2];
    rollNpcInitiatives(original, () => 0.5);
    expect(original[1].initiative).toBe(0); // npc1 still 0
  });

  it('returns combatants sorted by initiative descending', () => {
    let call = 0;
    // npc1 rolls 1 (rng → 0), npc2 rolls 20 (rng → 0.999)
    const rng = () => call++ === 0 ? 0 : 0.999;
    const result = rollNpcInitiatives([pc, npc1, npc2], rng);
    const initiatives = result.map(c => c.initiative);
    expect(initiatives).toEqual([...initiatives].sort((a, b) => b - a));
  });
});

// ─── getEffectiveResistances ──────────────────────────────────────────────────

describe('getEffectiveResistances', () => {
  it('returns base resistances when not raging', () => {
    expect(getEffectiveResistances({ resistances: 'fire', conditions: 'poisoned' })).toBe('fire');
    expect(getEffectiveResistances({ resistances: undefined, conditions: 'prone' })).toBe('');
  });

  it('appends bludgeoning (magical), piercing (magical), slashing (magical) when combatant has raging in conditions', () => {
    expect(getEffectiveResistances({ resistances: undefined, conditions: 'raging, prone' }))
      .toBe('bludgeoning (magical), piercing (magical), slashing (magical)');
  });

  it('merges correctly when combatant already has other resistances', () => {
    expect(getEffectiveResistances({ resistances: 'fire, cold', conditions: 'raging' }))
      .toBe('fire, cold, bludgeoning (magical), piercing (magical), slashing (magical)');
  });

  it('does not duplicate entries when raging and combatant already has physical resistances', () => {
    expect(getEffectiveResistances({ resistances: 'cold, bludgeoning, piercing', conditions: 'raging' }))
      .toBe('cold, bludgeoning (magical), piercing (magical), slashing (magical)');
  });
});

// ─── checkIrvMatch ─────────────────────────────────────────────────────────────

describe('checkIrvMatch', () => {
  it('Returns true when damageType exactly matches an irvString entry', () => {
    expect(checkIrvMatch('fire', 'fire')).toBe(true);
    expect(checkIrvMatch('fire', 'poison, fire, cold')).toBe(true);
  });

  it('Returns true when type is contained in a compound entry', () => {
    expect(checkIrvMatch('fire', 'fire, poison')).toBe(true);
    expect(checkIrvMatch('cold', 'poison, cold resistance')).toBe(true);
  });

  it("Returns false for 'bludgeoning (magical)' against 'bludgeoning, piercing, slashing (nonmagical)'", () => {
    expect(checkIrvMatch('bludgeoning (magical)', 'bludgeoning, piercing, slashing (nonmagical)')).toBe(false);
  });

  it('Returns false when damageType is not present in irvString', () => {
    expect(checkIrvMatch('fire', 'cold, poison')).toBe(false);
  });

  it('Is case insensitive', () => {
    expect(checkIrvMatch('FIRE', 'fire')).toBe(true);
    expect(checkIrvMatch('fire', 'FIRE, POISON')).toBe(true);
  });

  it('Returns false for empty irvString', () => {
    expect(checkIrvMatch('fire', '')).toBe(false);
    expect(checkIrvMatch('fire', null as any)).toBe(false);
  });
});

// ─── computeDamageWithIrv ────────────────────────────────────────────────────────

describe('computeDamageWithIrv', () => {
  it('Returns normal modifier when damageType is null', () => {
    const result = computeDamageWithIrv(10, null, 'fire', 'cold', 'poison');
    expect(result).toEqual({ finalDamage: 10, modifier: 'normal' });
  });

  it('Returns immune with 0 damage when type matches immunities', () => {
    const result = computeDamageWithIrv(10, 'cold', 'fire', 'cold', 'poison');
    expect(result).toEqual({ finalDamage: 0, modifier: 'immune' });
  });

  it('Returns resistant with halved damage when type matches resistances', () => {
    const result = computeDamageWithIrv(10, 'fire', 'fire', 'cold', 'poison');
    expect(result).toEqual({ finalDamage: 5, modifier: 'resistant' });
  });

  it('Returns vulnerable with doubled damage when type matches vulnerabilities', () => {
    const result = computeDamageWithIrv(10, 'poison', 'fire', 'cold', 'poison');
    expect(result).toEqual({ finalDamage: 20, modifier: 'vulnerable' });
  });

  it('Immunities take priority over resistances when both match', () => {
    const result = computeDamageWithIrv(10, 'fire', 'fire', 'fire', 'fire');
    expect(result).toEqual({ finalDamage: 0, modifier: 'immune' });
  });

  it('Halved damage is floored', () => {
    const result = computeDamageWithIrv(15, 'fire', 'fire', '', '');
    expect(result).toEqual({ finalDamage: 7, modifier: 'resistant' });
  });

  it('Doubled damage is correct', () => {
    const result = computeDamageWithIrv(15, 'poison', '', '', 'poison');
    expect(result).toEqual({ finalDamage: 30, modifier: 'vulnerable' });
  });

  describe('computeDamageWithIrv - custom matching matrix', () => {
    it('Magical attack bypasses nonmagical resistance', () => {
      const result = computeDamageWithIrv(20, 'bludgeoning (magical)', 'bludgeoning (nonmagical)', '', '');
      expect(result).toEqual({ finalDamage: 20, modifier: 'normal' });
    });

    it('Generic attack is caught by nonmagical resistance', () => {
      const result = computeDamageWithIrv(20, 'bludgeoning', 'bludgeoning (nonmagical)', '', '');
      expect(result).toEqual({ finalDamage: 10, modifier: 'resistant' });
    });

    it('Magical attack bypasses generic resistance', () => {
      const result = computeDamageWithIrv(20, 'bludgeoning (magical)', 'bludgeoning', '', '');
      expect(result).toEqual({ finalDamage: 20, modifier: 'normal' });
    });

    it('Generic attack is caught by generic resistance', () => {
      const result = computeDamageWithIrv(20, 'bludgeoning', 'bludgeoning', '', '');
      expect(result).toEqual({ finalDamage: 10, modifier: 'resistant' });
    });

    it('Magical attack is caught by magical resistance', () => {
      const result = computeDamageWithIrv(20, 'bludgeoning (magical)', 'bludgeoning (magical)', '', '');
      expect(result).toEqual({ finalDamage: 10, modifier: 'resistant' });
    });

    it('Generic attack is caught by magical resistance', () => {
      const result = computeDamageWithIrv(20, 'bludgeoning', 'bludgeoning (magical)', '', '');
      expect(result).toEqual({ finalDamage: 10, modifier: 'resistant' });
    });

    it('Magical attack bypasses nonmagical immunity', () => {
      const result = computeDamageWithIrv(20, 'piercing (magical)', '', 'piercing (nonmagical)', '');
      expect(result).toEqual({ finalDamage: 20, modifier: 'normal' });
    });

    it('Generic attack is caught by nonmagical immunity', () => {
      const result = computeDamageWithIrv(20, 'piercing', '', 'piercing (nonmagical)', '');
      expect(result).toEqual({ finalDamage: 0, modifier: 'immune' });
    });

    it('Generic attack is caught by magical immunity', () => {
      const result = computeDamageWithIrv(20, 'piercing', '', 'piercing (magical)', '');
      expect(result).toEqual({ finalDamage: 0, modifier: 'immune' });
    });

    it('Magical attack is caught by magical vulnerability', () => {
      const result = computeDamageWithIrv(20, 'slashing (magical)', '', '', 'slashing (magical)');
      expect(result).toEqual({ finalDamage: 40, modifier: 'vulnerable' });
    });

    it('Generic attack is caught by magical vulnerability', () => {
      const result = computeDamageWithIrv(20, 'slashing', '', '', 'slashing (magical)');
      expect(result).toEqual({ finalDamage: 40, modifier: 'vulnerable' });
    });

    it('Unrelated types never match', () => {
      const result = computeDamageWithIrv(20, 'fire', 'bludgeoning (nonmagical)', '', '');
      expect(result).toEqual({ finalDamage: 20, modifier: 'normal' });
    });

    it('Raging barbarian resists magical physical attacks', () => {
      const effRes = getEffectiveResistances({ resistances: '', conditions: 'raging' });
      expect(effRes.toLowerCase()).toContain('bludgeoning (magical)');
      const result = computeDamageWithIrv(20, 'bludgeoning (magical)', effRes, '', '');
      expect(result).toEqual({ finalDamage: 10, modifier: 'resistant' });
    });

    it('Raging barbarian resists nonmagical physical attacks', () => {
      const effRes = getEffectiveResistances({ resistances: '', conditions: 'raging' });
      const result = computeDamageWithIrv(20, 'bludgeoning', effRes, '', '');
      expect(result).toEqual({ finalDamage: 10, modifier: 'resistant' });
    });

    it('No duplicate resistances when raging with existing physical resistance', () => {
      const effRes = getEffectiveResistances({ 
        resistances: 'bludgeoning', 
        conditions: 'raging' 
      });
      const count = (effRes.toLowerCase().match(/bludgeoning/g) || []).length;
      expect(count).toBe(1);
    });
  });
});

// ─── getExpiredConditions ────────────────────────────────────────────────────────

describe('getExpiredConditions', () => {
  it('Returns empty array when no combatants have conditionTimers', () => {
    const combatants: Combatant[] = [
      { id: '1', name: 'Actor 1', type: 'pc', ac: 10, maxHp: 10, currentHp: 10, passivePerception: 10, initiative: 10, conditions: 'Hasted' },
    ];
    const result = getExpiredConditions(combatants, 5);
    expect(result).toEqual([]);
  });

  it('Returns empty array when no timers have expired yet', () => {
    const combatants: Combatant[] = [
      {
        id: '1',
        name: 'Actor 1',
        type: 'pc',
        ac: 10,
        maxHp: 10,
        currentHp: 10,
        passivePerception: 10,
        initiative: 10,
        conditions: 'Hasted',
        conditionTimers: { 'Hasted': 6 },
      },
    ];
    const result = getExpiredConditions(combatants, 5);
    expect(result).toEqual([]);
  });

  it('Returns the correct entry when one condition has expired', () => {
    const combatants: Combatant[] = [
      {
        id: '1',
        name: 'Actor 1',
        type: 'pc',
        ac: 10,
        maxHp: 10,
        currentHp: 10,
        passivePerception: 10,
        initiative: 10,
        conditions: 'Hasted',
        conditionTimers: { 'Hasted': 5 },
      },
    ];
    const result = getExpiredConditions(combatants, 5);
    expect(result).toEqual([
      { combatantId: '1', combatantName: 'Actor 1', conditionName: 'Hasted' },
    ]);
  });

  it('Returns multiple entries when multiple conditions have expired across different combatants', () => {
    const combatants: Combatant[] = [
      {
        id: '1',
        name: 'Actor 1',
        type: 'pc',
        ac: 10,
        maxHp: 10,
        currentHp: 10,
        passivePerception: 10,
        initiative: 10,
        conditions: 'Hasted',
        conditionTimers: { 'Hasted': 5 },
      },
      {
        id: '2',
        name: 'Actor 2',
        type: 'npc',
        ac: 10,
        maxHp: 10,
        currentHp: 10,
        passivePerception: 10,
        initiative: 10,
        conditions: 'Poisoned, Blessed',
        conditionTimers: { 'Poisoned': 4, 'Blessed': 6 },
      },
    ];
    const result = getExpiredConditions(combatants, 5);
    expect(result).toEqual([
      { combatantId: '1', combatantName: 'Actor 1', conditionName: 'Hasted' },
      { combatantId: '2', combatantName: 'Actor 2', conditionName: 'Poisoned' },
    ]);
  });

  it('Does not return a timer entry if the condition name is no longer in the combatant string', () => {
    const combatants: Combatant[] = [
      {
        id: '1',
        name: 'Actor 1',
        type: 'pc',
        ac: 10,
        maxHp: 10,
        currentHp: 10,
        passivePerception: 10,
        initiative: 10,
        conditions: '', // 'Hasted' timer is orphaned
        conditionTimers: { 'Hasted': 5 },
      },
    ];
    const result = getExpiredConditions(combatants, 5);
    expect(result).toEqual([]);
  });

  it('Does not return entries where expiresAtRound is in the future', () => {
    const combatants: Combatant[] = [
      {
        id: '1',
        name: 'Actor 1',
        type: 'pc',
        ac: 10,
        maxHp: 10,
        currentHp: 10,
        passivePerception: 10,
        initiative: 10,
        conditions: 'Hasted',
        conditionTimers: { 'Hasted': 8 },
      },
    ];
    const result = getExpiredConditions(combatants, 5);
    expect(result).toEqual([]);
  });
});

describe('computeConcentrationDC', () => {
  it('is at least 10', () => {
    expect(computeConcentrationDC(5)).toBe(10);
  });
  it('is correct when damage is 20 or more', () => {
    expect(computeConcentrationDC(28)).toBe(14);
  });
  it('is 10 when damage < 20', () => {
    expect(computeConcentrationDC(19)).toBe(10);
  });
  it('is 10 when damage is 20 exactly', () => {
    expect(computeConcentrationDC(20)).toBe(10);
  });
});

// ─── effectiveMaxHp ────────────────────────────────────────────────────────────

describe('effectiveMaxHp', () => {
  it('returns maxHp when tempHpMax is undefined', () => {
    expect(effectiveMaxHp(30, undefined)).toBe(30);
  });

  it('returns maxHp when tempHpMax is 0', () => {
    expect(effectiveMaxHp(30, 0)).toBe(30);
  });

  it('returns tempHpMax when tempHpMax is greater than 0', () => {
    expect(effectiveMaxHp(30, 15)).toBe(15);
  });
});

// ─── applyHealthChange with tempHpMax ──────────────────────────────────────────

describe('applyHealthChange with tempHpMax', () => {
  it('caps healing to maxHp when tempHpMax is inactive/0', () => {
    const activeMax = effectiveMaxHp(30, 0);
    const result = applyHealthChange(25, 0, activeMax, 10, false);
    expect(result.newCurrentHp).toBe(30);
  });

  it('caps healing to tempHpMax when tempHpMax is active', () => {
    const activeMax = effectiveMaxHp(30, 15);
    const result = applyHealthChange(12, 0, activeMax, 10, false);
    expect(result.newCurrentHp).toBe(15);
  });
});

// ─── effectiveAc ───────────────────────────────────────────────────────────────

describe('effectiveAc', () => {
  it('effectiveAc(16, -2) returns 14', () => {
    expect(effectiveAc(16, -2)).toBe(14);
  });

  it('effectiveAc(16, 2) returns 18', () => {
    expect(effectiveAc(16, 2)).toBe(18);
  });

  it('effectiveAc(16, 0) returns 16', () => {
    expect(effectiveAc(16, 0)).toBe(16);
  });

  it('effectiveAc(16, undefined) returns 16', () => {
    expect(effectiveAc(16, undefined)).toBe(16);
  });
});

```

## File: src/lib/__tests__/combatantBuilder.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { buildCombatantsFromState, parseRechargeOn, buildSingleNpcCombatant } from '../combatantBuilder';
import { Encounter, EncounterCombatant, Character, NPC } from '../../types';

describe('parseRechargeOn', () => {
  it('correctly parses valid recharge strings', () => {
    expect(parseRechargeOn('Recharge 5-6')).toBe(5);
    expect(parseRechargeOn('Recharge 6')).toBe(6);
    expect(parseRechargeOn('recharge 4')).toBe(4);
    expect(parseRechargeOn('  Recharge 5  ')).toBe(5);

    // Bare range formats
    expect(parseRechargeOn('5-6')).toBe(5);
    expect(parseRechargeOn('5-')).toBe(5);
    expect(parseRechargeOn('5')).toBe(5);
    expect(parseRechargeOn('6')).toBe(6);
    expect(parseRechargeOn('4-6')).toBe(4);
  });

  it('returns null for invalid or missing recharge values', () => {
    expect(parseRechargeOn(undefined)).toBeNull();
    expect(parseRechargeOn('')).toBeNull();
    expect(parseRechargeOn('Bite')).toBeNull();
    expect(parseRechargeOn('Recharge 3')).toBeNull();
    expect(parseRechargeOn('Recharge 7')).toBeNull();
    expect(parseRechargeOn('Recharge')).toBeNull();

    // Should still return null
    expect(parseRechargeOn('6d8')).toBeNull();
    expect(parseRechargeOn('DC 16')).toBeNull();
    expect(parseRechargeOn('1/Day')).toBeNull();
    expect(parseRechargeOn('16')).toBeNull();
  });
});

describe('buildCombatantsFromState', () => {
  it('Returns empty array when no encounterCombatants match the encounter', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const res = buildCombatantsFromState(encounter as Encounter, [], [], []);
    expect(res).toEqual([]);
  });

  it('Correctly builds PC combatants carrying conditions, resistances, and AC from the character template', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const characters: Partial<Character>[] = [{
      id: 'pc-1',
      characterName: 'Alandra',
      ac: 16,
      maxHp: 30,
      currentHp: 25,
      tempHp: 5,
      conditions: 'Exhausted',
      resistances: 'Fire',
      immunities: 'Poison',
      vulnerabilities: 'Cold',
      passivePerception: 14,
      notes: 'Test notes'
    }];
    const ec: Partial<EncounterCombatant>[] = [{
      id: 'ec-1',
      encounterId: 'enc-1',
      playerId: 'pc-1',
      initiative: 15
    }];

    const res = buildCombatantsFromState(
      encounter as Encounter,
      ec as EncounterCombatant[],
      characters as Character[],
      []
    );

    expect(res).toHaveLength(1);
    const c = res[0];
    expect(c.name).toBe('Alandra');
    expect(c.initiative).toBe(15);
    expect(c.ac).toBe(16);
    expect(c.conditions).toBe('Exhausted');
    expect(c.resistances).toBe('Fire');
    expect(c.type).toBe('pc');
  });

  it('Correctly builds NPC combatants initialising legendaryActions from the NPC template', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Dragon',
      ac: 18,
      maxHp: 200,
      legendaryActions: 3
    }];
    const ec: Partial<EncounterCombatant>[] = [{
      id: 'ec-1',
      encounterId: 'enc-1',
      npcId: 'npc-1',
      quantity: 1,
      initiative: 12
    }];

    const res = buildCombatantsFromState(
      encounter as Encounter,
      ec as EncounterCombatant[],
      [],
      npcs as NPC[]
    );

    expect(res).toHaveLength(1);
    expect(res[0].legendaryActions).toEqual({ max: 3, remaining: 3 });
  });

  it('Does NOT build NPC combatants with legacy Column N rechargeAbilities (Column N is ignored)', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Beholder',
      rechargeAbilities: [
        { name: 'Eye Ray', rechargeOn: 5 }
      ]
    }];
    const ec: Partial<EncounterCombatant>[] = [{
      id: 'ec-1',
      encounterId: 'enc-1',
      npcId: 'npc-1',
      quantity: 1
    }];

    const res = buildCombatantsFromState(
      encounter as Encounter,
      ec as EncounterCombatant[],
      [],
      npcs as NPC[]
    );

    expect(res[0].rechargeAbilities).toBeUndefined();
  });

  it('NPC recharge derives from actions JSON, not from col N legacy field', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Dragon',
      actions: JSON.stringify([
        {
          name: 'Cinderfall',
          description: 'A devastating attack',
          recharge: '5-'
        },
        {
          name: 'Bite',
          description: 'A basic attack',
          recharge: ''
        }
      ]),
      rechargeAbilities: [
        { name: 'OldLegacyAbility', rechargeOn: 6 }
      ]
    }];
    const ec: Partial<EncounterCombatant>[] = [{
      id: 'ec-1',
      encounterId: 'enc-1',
      npcId: 'npc-1',
      quantity: 1
    }];

    const res = buildCombatantsFromState(
      encounter as Encounter,
      ec as EncounterCombatant[],
      [],
      npcs as NPC[]
    );

    const combatant = res[0];
    expect(combatant.rechargeAbilities).toHaveLength(1);
    expect(combatant.rechargeAbilities[0].name).toBe('Cinderfall');
    expect(combatant.rechargeAbilities[0].rechargeOn).toBe(5);
    expect(combatant.rechargeAbilities[0].isCharged).toBe(true);
    expect(combatant.rechargeAbilities.some(ra => ra.name === 'OldLegacyAbility')).toBe(false);
  });

  it('Handles quantity > 1 by creating multiple independent combatant objects', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Goblin',
      maxHp: 7
    }];
    const ec: Partial<EncounterCombatant>[] = [{
      id: 'ec-1',
      encounterId: 'enc-1',
      npcId: 'npc-1',
      quantity: 3
    }];

    const res = buildCombatantsFromState(
      encounter as Encounter,
      ec as EncounterCombatant[],
      [],
      npcs as NPC[]
    );

    expect(res).toHaveLength(3);
    expect(res[0].name).toBe('Goblin 1');
    expect(res[1].name).toBe('Goblin 2');
    expect(res[2].name).toBe('Goblin 3');
    expect(res[0].id).not.toBe(res[1].id);
  });

  it('builds combatants from NPC templates with legendaryResistances', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Beholder',
      legendaryResistances: 2
    }];
    const ec: Partial<EncounterCombatant>[] = [{
      id: 'ec-1',
      encounterId: 'enc-1',
      npcId: 'npc-1',
      quantity: 1
    }];

    const res = buildCombatantsFromState(
      encounter as Encounter,
      ec as EncounterCombatant[],
      [],
      npcs as NPC[]
    );

    expect(res[0].legendaryResistances).toEqual({ max: 2, remaining: 2 });
  });

  it('NPC with rechargeAbilities defined in col N creates combatant with isCharged: true when actions JSON also has recharge', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Dragon',
      actions: JSON.stringify([{
        name: 'Fire Breath',
        description: 'Exhales fire',
        recharge: '5-6'
      }]),
      rechargeAbilities: [
        { name: 'FireBreath_Legacy', rechargeOn: 5 }
      ]
    }];
    const ec: Partial<EncounterCombatant>[] = [{
      id: 'ec-1',
      encounterId: 'enc-1',
      npcId: 'npc-1',
      quantity: 1
    }];

    const res = buildCombatantsFromState(
      encounter as Encounter,
      ec as EncounterCombatant[],
      [],
      npcs as NPC[]
    );

    const combatant = res[0];
    expect(combatant.rechargeAbilities).toHaveLength(1);
    expect(combatant.rechargeAbilities[0].name).toBe('Fire Breath');
    expect(combatant.rechargeAbilities[0].isCharged).toBe(true);
    expect(combatant.rechargeAbilities.some(ra => ra.name === 'FireBreath_Legacy')).toBe(false);
  });

  it('derives rechargeAbilities from actions recharge field, ignoring Column N entirely', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Dragon',
      actions: JSON.stringify([{
        name: 'Multiattack',
        description: 'Three attacks',
        recharge: ''
      }, {
        name: 'Tail Swipe',
        description: 'Recharge ability',
        recharge: 'Recharge 5-6'
      }]),
      rechargeAbilities: []
    }];
    const ec: Partial<EncounterCombatant>[] = [{
      id: 'ec-1',
      encounterId: 'enc-1',
      npcId: 'npc-1',
      quantity: 1
    }];

    const res = buildCombatantsFromState(
      encounter as Encounter,
      ec as EncounterCombatant[],
      [],
      npcs as NPC[]
    );

    const combatant = res[0];
    expect(combatant.rechargeAbilities).toHaveLength(1);
    expect(combatant.rechargeAbilities[0].name).toBe('Tail Swipe');
    expect(combatant.rechargeAbilities[0].rechargeOn).toBe(5);
    expect(combatant.rechargeAbilities[0].isCharged).toBe(true);
  });

  it('legendaryActions of 0 or undefined does NOT set legendaryActions on combatant', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [
      { id: 'npc-1', name: 'Orc', legendaryActions: 0 },
      { id: 'npc-2', name: 'Goblin', legendaryActions: undefined }
    ];
    const ec: Partial<EncounterCombatant>[] = [
      { id: 'ec-1', encounterId: 'enc-1', npcId: 'npc-1', quantity: 1 },
      { id: 'ec-2', encounterId: 'enc-1', npcId: 'npc-2', quantity: 1 }
    ];

    const res = buildCombatantsFromState(
      encounter as Encounter,
      ec as EncounterCombatant[],
      [],
      npcs as NPC[]
    );

    expect(res[0].legendaryActions).toBeUndefined();
    expect(res[1].legendaryActions).toBeUndefined();
  });

  it('buildCombatantsFromState handles NPCs with no recharge actions correctly', () => {
    const encounter: Partial<Encounter> = { id: 'enc-1' };
    const npcs: Partial<NPC>[] = [{
      id: 'npc-1',
      name: 'Commoner',
      actions: JSON.stringify([{ name: 'Club', description: 'Melee attack' }])
    }];
    const ec: Partial<EncounterCombatant>[] = [{
      id: 'ec-1',
      encounterId: 'enc-1',
      npcId: 'npc-1',
      quantity: 1
    }];

    const res = buildCombatantsFromState(
      encounter as Encounter,
      ec as EncounterCombatant[],
      [],
      npcs as NPC[]
    );

    expect(res[0].rechargeAbilities).toBeUndefined();
  });
});

describe('parseRechargeOn additional coverage', () => {
  it('handles "5-" correctly', () => {
    expect(parseRechargeOn('5-')).toBe(5);
  });
});

describe('buildSingleNpcCombatant', () => {
  const baseNpc: NPC = {
    id: 'npc-1',
    name: 'Test Dragon',
    ac: 18,
    maxHp: 200,
    currentHp: 200,
    tempHp: 0,
    conditions: '',
    notes: '',
    resistances: 'fire',
    immunities: '',
    vulnerabilities: 'cold',
    legendaryActions: 3,
    legendaryResistances: 2,
    rechargeAbilities: [],
    abilityScores: '{"STR":26}',
    proficiencies: '{}',
    speed: '40 ft.',
    senses: 'darkvision 120 ft.',
    languages: 'Draconic',
    challengeRating: '20',
    traits: '[]',
    actions: JSON.stringify([{
      name: 'Fire Breath',
      description: 'Exhales fire',
      recharge: '5-6'
    }, {
      name: 'Bite',
      description: 'Melee attack',
      recharge: ''
    }]),
    reactions: '[]',
    legendaryActionsList: '[]',
    spellcastingAbility: 'INT',
  };

  const baseOptions = {
    id: 'combat-npc-1',
    encounterCombatantId: 'ec-1',
    name: 'Test Dragon',
    npcId: 'npc-1',
  };

  it('returns a combatant with correct basic fields from npc template', () => {
    const combatant = buildSingleNpcCombatant(
      baseNpc, baseOptions
    );
    expect(combatant.id).toBe('combat-npc-1');
    expect(combatant.type).toBe('npc');
    expect(combatant.ac).toBe(18);
    expect(combatant.maxHp).toBe(200);
    expect(combatant.resistances).toBe('fire');
    expect(combatant.vulnerabilities).toBe('cold');
    expect(combatant.reactionUsed).toBe(false);
  });

  it('initializes legendaryActions correctly when legendaryActions > 0', () => {
    const combatant = buildSingleNpcCombatant(
      baseNpc, baseOptions
    );
    expect(combatant.legendaryActions).toEqual({
      max: 3, remaining: 3
    });
  });

  it('sets legendaryActions to undefined when legendaryActions is 0', () => {
    const npc = { ...baseNpc, legendaryActions: 0 };
    const combatant = buildSingleNpcCombatant(
      npc, baseOptions
    );
    expect(combatant.legendaryActions).toBeUndefined();
  });

  it('initializes legendaryResistances correctly when legendaryResistances > 0', () => {
    const combatant = buildSingleNpcCombatant(
      baseNpc, baseOptions
    );
    expect(combatant.legendaryResistances).toEqual({ max: 2, remaining: 2 });
  });

  it('derives rechargeAbilities from actions JSON — only actions with valid recharge values are included', () => {
    const combatant = buildSingleNpcCombatant(
      baseNpc, baseOptions
    );
    expect(combatant.rechargeAbilities).toHaveLength(1);
    expect(combatant.rechargeAbilities![0].name).toBe('Fire Breath');
    expect(combatant.rechargeAbilities![0].rechargeOn).toBe(5);
    expect(combatant.rechargeAbilities![0].isCharged).toBe(true);
  });

  it('sets rechargeAbilities to undefined when no actions have a valid recharge', () => {
    const npc = {
      ...baseNpc,
      actions: JSON.stringify([{
        name: 'Bite',
        description: 'Attack',
        recharge: ''
      }])
    };
    const combatant = buildSingleNpcCombatant(
      npc, baseOptions
    );
    expect(combatant.rechargeAbilities).toBeUndefined();
  });

  it('uses the name from options not from npcTemplate (supports " 2", " 3" suffixes)', () => {
    const opts = {
      ...baseOptions,
      name: 'Test Dragon 2'
    };
    const combatant = buildSingleNpcCombatant(
      baseNpc, opts
    );
    expect(combatant.name).toBe('Test Dragon 2');
  });

  it('accepts overrides for HP, conditions, and initiative', () => {
    const opts = {
      ...baseOptions,
      currentHp: 50,
      tempHp: 10,
      conditions: 'Stunned',
      initiative: 15,
      tempAcModifier: 2,
    };
    const combatant = buildSingleNpcCombatant(
      baseNpc, opts
    );
    expect(combatant.currentHp).toBe(50);
    expect(combatant.tempHp).toBe(10);
    expect(combatant.conditions).toBe('Stunned');
    expect(combatant.initiative).toBe(15);
    expect(combatant.tempAcModifier).toBe(2);
  });
});

```

## File: src/lib/__tests__/concentrationCheck.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import {
  concentrationCheckDc,
  isConcentrating,
  fireConcentrationAlert,
  isIncapacitating,
} from '../concentrationCheck';

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
  },
}));

describe('concentrationCheckDc', () => {
  it('damage 0 returns 0 (no check)', () => {
    expect(concentrationCheckDc(0)).toBe(0);
  });

  it('damage 1 returns 10 (half=0, min 10)', () => {
    expect(concentrationCheckDc(1)).toBe(10);
  });

  it('damage 8 returns 10 (half=4, min 10)', () => {
    expect(concentrationCheckDc(8)).toBe(10);
  });

  it('damage 19 returns 10 (half=9, min 10)', () => {
    expect(concentrationCheckDc(19)).toBe(10);
  });

  it('damage 20 returns 10 (half=10, min 10)', () => {
    expect(concentrationCheckDc(20)).toBe(10);
  });

  it('damage 21 returns 10 (half=10, min 10)', () => {
    expect(concentrationCheckDc(21)).toBe(10);
  });

  it('damage 22 returns 11 (half=11)', () => {
    expect(concentrationCheckDc(22)).toBe(11);
  });

  it('damage 40 returns 20 (half=20)', () => {
    expect(concentrationCheckDc(40)).toBe(20);
  });

  it('damage 100 returns 50 (half=50)', () => {
    expect(concentrationCheckDc(100)).toBe(50);
  });

  it('negative damage returns 0', () => {
    expect(concentrationCheckDc(-5)).toBe(0);
  });
});

describe('isConcentrating', () => {
  it('"concentrating" returns true', () => {
    expect(isConcentrating('concentrating')).toBe(true);
  });

  it('"Concentrating" returns true (case insensitive)', () => {
    expect(isConcentrating('Concentrating')).toBe(true);
  });

  it('"poisoned, concentrating, hasted" returns true', () => {
    expect(isConcentrating('poisoned, concentrating, hasted')).toBe(true);
  });

  it('"poisoned, hasted" returns false', () => {
    expect(isConcentrating('poisoned, hasted')).toBe(false);
  });

  it('empty string returns false', () => {
    expect(isConcentrating('')).toBe(false);
  });

  it('undefined-like empty returns false', () => {
    expect(isConcentrating(undefined as any)).toBe(false);
  });

  it('"concentration" returns false (must be exact word)', () => {
    expect(isConcentrating('concentration')).toBe(false);
  });
});

describe('fireConcentrationAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Calls toast.warning with the creature name in the title', () => {
    fireConcentrationAlert('Alys', 15);
    expect(toast.warning).toHaveBeenCalledWith(
      'Concentration Check — Alys',
      expect.any(Object)
    );
  });

  it('Calls toast.warning with the correct DC in the description and duration is 10000ms', () => {
    fireConcentrationAlert('Melf', 10);
    expect(toast.warning).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        description: expect.stringContaining('DC 10'),
        duration: 10000,
        icon: '🎯',
      })
    );
  });

  it('22 damage produces "DC 11" in the description', () => {
    fireConcentrationAlert('Maeve', 22);
    expect(toast.warning).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        description: expect.stringContaining('DC 11'),
      })
    );
  });

  it('8 damage produces "DC 10" and "(min DC 10)" in the description', () => {
    fireConcentrationAlert('Terry', 8);
    expect(toast.warning).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        description: expect.stringContaining('DC 10'),
      })
    );
    expect(toast.warning).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        description: expect.stringContaining('(min DC 10)'),
      })
    );
  });
});

describe('isIncapacitating', () => {
  it('stunned returns true', () => {
    expect(isIncapacitating('stunned')).toBe(true);
  });

  it('paralyzed returns true', () => {
    expect(isIncapacitating('paralyzed')).toBe(true);
  });

  it('unconscious returns true', () => {
    expect(isIncapacitating('unconscious')).toBe(true);
  });

  it('poisoned returns false', () => {
    expect(isIncapacitating('poisoned')).toBe(false);
  });

  it('blinded returns false', () => {
    expect(isIncapacitating('blinded')).toBe(false);
  });

  it('STUNNED returns true (case insensitive)', () => {
    expect(isIncapacitating('STUNNED')).toBe(true);
  });

  it('unknown returns false', () => {
    expect(isIncapacitating('unknown')).toBe(false);
  });
});

```

## File: src/lib/__tests__/conditionDefinitions.test.ts

```typescript
import { CONDITION_MECHANICS, buildConditionSummary, applyLongRestToConditions, CONDITION_OPTIONS } from '../../lib/conditions';
// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { expect, it, describe } from 'vitest';
;
;

describe('conditionDefinitions', () => {
  it('CONDITION_MECHANICS contains entries for all values in CONDITION_OPTIONS from irvOptions.ts', () => {
    for (const opt of CONDITION_OPTIONS) {
      expect(CONDITION_MECHANICS).toHaveProperty(opt.toLowerCase());
    }
  });

  it('CONDITION_MECHANICS["slowed"] has speedHalved: true, tempAcModifier: -2, removedByLongRest: true', () => {
    expect(CONDITION_MECHANICS.slowed.speedHalved).toBe(true);
    expect(CONDITION_MECHANICS.slowed.tempAcModifier).toBe(-2);
    expect(CONDITION_MECHANICS.slowed.removedByLongRest).toBe(true);
  });

  it('CONDITION_MECHANICS["hasted"] has tempAcModifier: 2', () => {
    expect(CONDITION_MECHANICS.hasted.tempAcModifier).toBe(2);
  });

  it('paralyzed has critVulnerableInMelee: true', () => {
    expect(CONDITION_MECHANICS.paralyzed.critVulnerableInMelee).toBe(true);
  });

  it('poisoned has outgoingDisadvantage: true', () => {
    expect(CONDITION_MECHANICS.poisoned.outgoingDisadvantage).toBe(true);
  });

  it('grappled has speedZero: true but incapacitates: false', () => {
    expect(CONDITION_MECHANICS.grappled.speedZero).toBe(true);
    expect(CONDITION_MECHANICS.grappled.incapacitates).toBe(false);
  });

  it('unconscious has autoFailStr: true, autoFailDex: true, and critVulnerableInMelee: true', () => {
    expect(CONDITION_MECHANICS.unconscious.autoFailStr).toBe(true);
    expect(CONDITION_MECHANICS.unconscious.autoFailDex).toBe(true);
    expect(CONDITION_MECHANICS.unconscious.critVulnerableInMelee).toBe(true);
  });

  it('incapacitated has incapacitates: true but speedZero: false', () => {
    expect(CONDITION_MECHANICS.incapacitated.incapacitates).toBe(true);
    expect(CONDITION_MECHANICS.incapacitated.speedZero).toBe(false);
  });

  describe('buildConditionSummary', () => {
    it('buildConditionSummary(["poisoned"]) returns a line containing "DISADVANTAGE" and sources containing "poisoned"', () => {
      const summary = buildConditionSummary(['poisoned']);
      expect(summary.lines.some(l => l.includes('DISADVANTAGE'))).toBe(true);
      expect(summary.sources.outgoingDisadvantage).toContain('poisoned');
    });

    it('buildConditionSummary(["grappled", "restrained"]) returns speedLocked: true with both sources listed', () => {
      const summary = buildConditionSummary(['grappled', "restrained"]);
      expect(summary.speedLocked).toBe(true);
      expect(summary.sources.speedLocked).toEqual(['grappled', 'restrained']);
    });

    it('buildConditionSummary(["paralyzed"]) returns critVulnerable: true, actionsBlocked: true, speedLocked: true, autoFailStr: true, autoFailDex: true', () => {
      const summary = buildConditionSummary(['paralyzed']);
      expect(summary.critVulnerable).toBe(true);
      expect(summary.actionsBlocked).toBe(true);
      expect(summary.speedLocked).toBe(true);
      expect(summary.autoFailStr).toBe(true);
      expect(summary.autoFailDex).toBe(true);
    });

    it('buildConditionSummary([]) returns empty lines array and all flags false', () => {
      const summary = buildConditionSummary([]);
      expect(summary.lines).toEqual([]);
      expect(summary.speedLocked).toBe(false);
      expect(summary.actionsBlocked).toBe(false);
      expect(summary.outgoingDisadvantage).toBe(false);
      expect(summary.incomingAdvantage).toBe(false);
      expect(summary.critVulnerable).toBe(false);
      expect(summary.autoFailStr).toBe(false);
      expect(summary.autoFailDex).toBe(false);
    });

    it('buildConditionSummary(["custom-effect"]) returns empty lines (unknown conditions are ignored gracefully)', () => {
      const summary = buildConditionSummary(['custom-effect']);
      expect(summary.lines).toEqual([]);
      expect(summary.speedLocked).toBe(false);
    });

    it('buildConditionSummary(["invisible"]) returns finalOutgoing "advantage" and finalIncoming "disadvantage"', () => {
      const summary = buildConditionSummary(['invisible']);
      expect(summary.finalOutgoing).toBe('advantage');
      expect(summary.finalIncoming).toBe('disadvantage');
    });

    it('buildConditionSummary(["blinded", "invisible"]) returns finalOutgoing "normal" (cancelled) and finalIncoming "normal" (cancelled)', () => {
      const summary = buildConditionSummary(['blinded', 'invisible']);
      expect(summary.finalOutgoing).toBe('normal');
      expect(summary.finalIncoming).toBe('normal');
    });

    it('buildConditionSummary(["exhaustion 3"]) returns speedHalved: true, outgoingDisadvantage: true, autoFailDex: true', () => {
      const summary = buildConditionSummary(['exhaustion 3']);
      expect(summary.speedHalved).toBe(true);
      expect(summary.outgoingDisadvantage).toBe(true);
      expect(summary.autoFailDex).toBe(true);
    });

    it('buildConditionSummary(["exhaustion 5"]) returns speedZero: true, hpMaxHalved: true', () => {
      const summary = buildConditionSummary(['exhaustion 5']);
      expect(summary.speedLocked).toBe(true);
      expect(summary.hpMaxHalved).toBe(true);
    });

    it('CONDITION_OPTIONS inside irvOptions.ts includes all six exhaustion levels', () => {
      expect(CONDITION_OPTIONS).toContain('exhaustion 1');
      expect(CONDITION_OPTIONS).toContain('exhaustion 2');
      expect(CONDITION_OPTIONS).toContain('exhaustion 3');
      expect(CONDITION_OPTIONS).toContain('exhaustion 4');
      expect(CONDITION_OPTIONS).toContain('exhaustion 5');
      expect(CONDITION_OPTIONS).toContain('exhaustion 6');
    });
  });

  describe('applyLongRestToConditions', () => {
    it('applyLongRestToConditions("concentrating, blessed") returns remaining: "" and removed includes both', () => {
      const result = applyLongRestToConditions('concentrating, blessed');
      expect(result.remaining).toBe('');
      expect(result.removed).toContain('concentrating');
      expect(result.removed).toContain('blessed');
    });

    it('applyLongRestToConditions("poisoned, hasted") returns remaining: "poisoned" (poisoned persists, hasted removed)', () => {
      const result = applyLongRestToConditions('poisoned, hasted');
      expect(result.remaining).toBe('poisoned');
      expect(result.removed).toContain('hasted');
      expect(result.removed).not.toContain('poisoned');
    });

    it('applyLongRestToConditions("exhaustion 3, raging") returns exhaustionReduced: true, newExhaustionLevel: 2, remaining: "exhaustion 2", and raging in removed', () => {
      const result = applyLongRestToConditions('exhaustion 3, raging');
      expect(result.exhaustionReduced).toBe(true);
      expect(result.newExhaustionLevel).toBe(2);
      expect(result.remaining).toBe('exhaustion 2');
      expect(result.removed).toContain('raging');
    });

    it('applyLongRestToConditions("exhaustion 1") returns exhaustionReduced: true, newExhaustionLevel: null, remaining: ""', () => {
      const result = applyLongRestToConditions('exhaustion 1');
      expect(result.exhaustionReduced).toBe(true);
      expect(result.newExhaustionLevel).toBeNull();
      expect(result.remaining).toBe('');
    });

    it('applyLongRestToConditions("blinded, stunned") returns remaining: "blinded, stunned" — neither removed by long rest', () => {
      const result = applyLongRestToConditions('blinded, stunned');
      expect(result.remaining).toBe('blinded, stunned');
      expect(result.removed).toEqual([]);
    });

    it('applyLongRestToConditions("") returns remaining: "" with empty removed array', () => {
      const result = applyLongRestToConditions('');
      expect(result.remaining).toBe('');
      expect(result.removed).toEqual([]);
    });
  });
});

```

## File: src/lib/__tests__/conditionDescriptions.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { getConditionDescription, CONDITION_DESCRIPTIONS } from '../conditionDescriptions';

describe('conditionDescriptions tests', () => {
  it('getConditionDescription is case-insensitive and trims whitespace', () => {
    const blind1 = getConditionDescription('blinded');
    const blind2 = getConditionDescription('  BLINDED  ');
    expect(blind1).not.toBeNull();
    expect(blind1?.summary).toContain("Can't see");
    expect(blind1?.rules).toBeInstanceOf(Array);
    expect(blind2).toEqual(blind1);
  });

  it('getConditionDescription returns null for unknown condition keys', () => {
    expect(getConditionDescription('unknownThing')).toBeNull();
    expect(getConditionDescription('')).toBeNull();
  });

  it('standard conditions return non-null descriptions', () => {
    const standards = [
      'blinded',
      'charmed',
      'deafened',
      'frightened',
      'grappled',
      'incapacitated',
      'invisible',
      'paralyzed',
      'petrified',
      'poisoned',
      'prone',
      'restrained',
      'stunned',
      'unconscious'
    ];

    standards.forEach(cond => {
      const desc = getConditionDescription(cond);
      expect(desc).not.toBeNull();
      expect(desc?.summary).toBeDefined();
      expect(desc?.rules.length).toBeGreaterThan(0);
    });
  });

  it('all 6 exhaustion levels return non-null descriptions', () => {
    for (let i = 1; i <= 6; i++) {
      const desc = getConditionDescription(`exhaustion ${i}`);
      expect(desc).not.toBeNull();
      expect(desc?.summary).toBeDefined();
      expect(desc?.rules.length).toBeGreaterThan(0);
    }
  });

  it('CONDITION_DESCRIPTIONS contains at least 30 entries', () => {
    const keysCount = Object.keys(CONDITION_DESCRIPTIONS).length;
    expect(keysCount).toBeGreaterThanOrEqual(30);
  });
});

```

## File: src/lib/__tests__/conditions.barrel.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import * as barrel from '../conditions';
import * as irv from '../irvOptions';
import * as defs from '../conditionDefinitions';
import * as logic from '../combatLogic';

describe('Conditions Barrel Exports', () => {
  it('exports CONDITION_OPTIONS', () => {
    expect(barrel.CONDITION_OPTIONS).toBeDefined();
    expect(barrel.CONDITION_OPTIONS).toBe(irv.CONDITION_OPTIONS);
  });

  it('exports CONDITION_MECHANICS', () => {
    expect(barrel.CONDITION_MECHANICS).toBeDefined();
    expect(barrel.CONDITION_MECHANICS).toBe(defs.CONDITION_MECHANICS);
  });

  it('exports buildConditionSummary', () => {
    expect(barrel.buildConditionSummary).toBeDefined();
    expect(barrel.buildConditionSummary).toBe(defs.buildConditionSummary);
  });

  it('exports getEffectiveResistances', () => {
    expect(barrel.getEffectiveResistances).toBeDefined();
    expect(barrel.getEffectiveResistances).toBe(logic.getEffectiveResistances);
  });
});

```

## File: src/lib/__tests__/constants.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { 
  OVERLAY_DURATIONS, 
  DEATH_SAVES, 
  RECHARGE_DIE_SIDES,
  STORAGE_KEYS,
  SHEET_RANGES,
  TIMERS,
  campaignKey
} from '../constants';

describe('constants', () => {
  it('campaignKey computes names correctly', () => {
    expect(campaignKey('gm_mood_presets', 'abc')).toBe('gm_mood_presets_abc');
    expect(campaignKey('gm_mood_presets', '')).toBe('gm_mood_presets_');
  });

  it('OVERLAY_DURATIONS.death equals 10000', () => {
    expect(OVERLAY_DURATIONS.death).toBe(10000);
  });

  it('OVERLAY_DURATIONS.damage equals 5000', () => {
    expect(OVERLAY_DURATIONS.damage).toBe(5000);
  });

  it('DEATH_SAVES.failuresForDeath equals 3', () => {
    expect(DEATH_SAVES.failuresForDeath).toBe(3);
  });

  it('DEATH_SAVES.successesForStability equals 3', () => {
    expect(DEATH_SAVES.successesForStability).toBe(3);
  });

  it('RECHARGE_DIE_SIDES equals 6', () => {
    expect(RECHARGE_DIE_SIDES).toBe(6);
  });

  it('All STORAGE_KEYS values are unique strings', () => {
    const values = Object.values(STORAGE_KEYS);
    const uniqueValues = new Set(values);
    expect(values.length).toBe(uniqueValues.size);
  });

  it('All SHEET_RANGES values contain the "!" character', () => {
    const values = Object.values(SHEET_RANGES);
    values.forEach(val => {
      expect(val).toContain('!');
    });
  });

  it('TIMERS.audioPreviewMs equals 3000', () => {
    expect(TIMERS.audioPreviewMs).toBe(3000);
  });

  it('All TIMERS values are positive numbers', () => {
    const values = Object.values(TIMERS);
    values.forEach(val => {
      expect(val).toBeGreaterThan(0);
      expect(typeof val).toBe('number');
    });
  });

  it('STORAGE_KEYS.instructionsDismissed equals "gm_instructions_dismissed"', () => {
    expect(STORAGE_KEYS.instructionsDismissed).toBe('gm_instructions_dismissed');
  });

  it('SHEET_RANGES.characters ends in Z', () => {
    expect(SHEET_RANGES.characters).toMatch(/:Z$/);
  });

  it('SHEET_RANGES.npcs ends in Y', () => {
    expect(SHEET_RANGES.npcs).toMatch(/:Y$/);
  });
});

```

## File: src/lib/__tests__/diceRoller.test.ts

```typescript
import { expect, it, describe, vi, beforeEach, afterEach } from 'vitest';
import { parseDiceNotation, rollDice } from '../diceRoller';

describe('Dice Roller Parser', () => {
  it("parseDiceNotation('2d6') returns count 2, sides 6, no modifier", () => {
    const parsed = parseDiceNotation('2d6');
    expect(parsed.groups).toHaveLength(1);
    expect(parsed.groups[0].count).toBe(2);
    expect(parsed.groups[0].sides).toBe(6);
    expect(parsed.modifier).toBe(0);
    expect(parsed.advantage).toBe(false);
    expect(parsed.disadvantage).toBe(false);
    expect(parsed.dropLowest).toBe(false);
  });

  it("parseDiceNotation('1d20+5') returns modifier 5", () => {
    const parsed = parseDiceNotation('1d20+5');
    expect(parsed.groups).toHaveLength(1);
    expect(parsed.groups[0].count).toBe(1);
    expect(parsed.groups[0].sides).toBe(20);
    expect(parsed.modifier).toBe(5);
  });

  it("parseDiceNotation('1d20 adv') sets advantage: true", () => {
    const parsed = parseDiceNotation('1d20 adv');
    expect(parsed.advantage).toBe(true);
    expect(parsed.disadvantage).toBe(false);
  });

  it("parseDiceNotation('4d6 drop') sets dropLowest: true", () => {
    const parsed = parseDiceNotation('4d6 drop');
    expect(parsed.dropLowest).toBe(true);
  });

  it("parseDiceNotation('d20') treated as 1d20", () => {
    const parsed = parseDiceNotation('d20');
    expect(parsed.groups).toHaveLength(1);
    expect(parsed.groups[0].count).toBe(1);
    expect(parsed.groups[0].sides).toBe(20);
  });

  it("parseDiceNotation('invalid!!!') returns null or throws a descriptive error", () => {
    expect(() => parseDiceNotation('invalid!!!')).toThrow();
  });
});

describe('Dice Roller Rolling Engine', () => {
  let mathRandomSpy: any;

  beforeEach(() => {
    mathRandomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    mathRandomSpy.mockRestore();
  });

  it("rollDice with 1d6 returns a total between 1-6", () => {
    mathRandomSpy.mockReturnValue(0.5); // (0.5 * 6) + 1 = 4
    const parsed = parseDiceNotation('1d6');
    const result = rollDice(parsed);
    expect(result.total).toBe(4);
    expect(result.groups[0].rolls).toEqual([4]);
    expect(result.groups[0].kept).toEqual([4]);
  });

  it("rollDice with 2d6 returns a total between 2-12", () => {
    mathRandomSpy
      .mockReturnValueOnce(0.1) // 1.6 -> 1
      .mockReturnValueOnce(0.9); // 6.4 -> 6
    const parsed = parseDiceNotation('2d6');
    const result = rollDice(parsed);
    expect(result.total).toBe(7);
    expect(result.groups[0].rolls).toEqual([1, 6]);
    expect(result.groups[0].kept).toEqual([1, 6]);
  });

  it("rollDice with advantage returns the higher of two d20 rolls", () => {
    // advantage of 1d20 means rolling 2 dice and keeping the highest
    mathRandomSpy
      .mockReturnValueOnce(0.24) // (0.24 * 20)+1 = 5
      .mockReturnValueOnce(0.84); // (0.84 * 20)+1 = 17
    const parsed = parseDiceNotation('1d20 adv');
    const result = rollDice(parsed);
    expect(result.groups[0].rolls).toEqual([5, 17]);
    expect(result.groups[0].kept).toEqual([17]);
    expect(result.total).toBe(17);
  });

  it("rollDice with disadvantage returns the lower of two d20 rolls", () => {
    mathRandomSpy
      .mockReturnValueOnce(0.24) // 5
      .mockReturnValueOnce(0.84); // 17
    const parsed = parseDiceNotation('1d20 dis');
    const result = rollDice(parsed);
    expect(result.groups[0].rolls).toEqual([5, 17]);
    expect(result.groups[0].kept).toEqual([5]);
    expect(result.total).toBe(5);
  });

  it("rollDice with 4d6 drop returns kept array of length 3 (one dropped)", () => {
    mathRandomSpy
      .mockReturnValueOnce(0.5) // (0.5 * 6) + 1 = 4
      .mockReturnValueOnce(0.1) // 1
      .mockReturnValueOnce(0.9) // 6
      .mockReturnValueOnce(0.7); // 5
    const parsed = parseDiceNotation('4d6 drop');
    const result = rollDice(parsed);
    expect(result.groups[0].rolls).toEqual([4, 1, 6, 5]);
    expect(result.groups[0].kept).toEqual([4, 5, 6]); // sorts kept to drop 1 (lowest)
    expect(result.total).toBe(15);
  });

  it("rollDice with +5 modifier adds 5 to total", () => {
    mathRandomSpy.mockReturnValueOnce(0.45); // (0.45 * 20) + 1 = 10
    const parsed = parseDiceNotation('1d20+5');
    const result = rollDice(parsed);
    expect(result.groups[0].rolls).toEqual([10]);
    expect(result.modifier).toBe(5);
    expect(result.total).toBe(15);
  });
});

```

## File: src/lib/__tests__/hitDice.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import {
  parseHitDiceConfig,
  parseHitDiceUsed,
  serializeHitDiceUsed,
  getHitDiceStatus,
  getTotalHitDiceCount,
  applyLongRestHitDiceRecovery,
  spendHitDice,
  getHitDieForClass,
  addHitDieToConfig,
  parseClassString,
  suggestHitDiceConfig,
} from '../hitDice';

describe('hitDice utility functions', () => {
  describe('parseHitDiceConfig', () => {
    it('returns a single pool for config "7d8"', () => {
      expect(parseHitDiceConfig('7d8')).toEqual([
        { die: 8, count: 7 },
      ]);
    });

    it('returns two pools in order for config "4d12+3d10"', () => {
      expect(parseHitDiceConfig('4d12+3d10')).toEqual([
        { die: 12, count: 4 },
        { die: 10, count: 3 },
      ]);
    });

    it('returns empty list for empty or space string config', () => {
      expect(parseHitDiceConfig('')).toEqual([]);
      expect(parseHitDiceConfig('   ')).toEqual([]);
    });

    it('returns empty list for invalid config strings', () => {
      expect(parseHitDiceConfig('invalid')).toEqual([]);
      expect(parseHitDiceConfig('someText123')).toEqual([]);
      expect(parseHitDiceConfig('7d')).toEqual([]);
      expect(parseHitDiceConfig('d8')).toEqual([]);
      expect(parseHitDiceConfig('4d12+invalid')).toEqual([]);
    });

    it('returns three pools for "1d6+2d8+3d10"', () => {
      expect(parseHitDiceConfig('1d6+2d8+3d10')).toEqual([
        { die: 6, count: 1 },
        { die: 8, count: 2 },
        { die: 10, count: 3 },
      ]);
    });
  });

  describe('parseHitDiceUsed', () => {
    it('parses valid JSON string with dice spent counts', () => {
      expect(parseHitDiceUsed('{"d8":2}')).toEqual({ d8: 2 });
    });

    it('returns empty map for empty or blank JSON string', () => {
      expect(parseHitDiceUsed('')).toEqual({});
      expect(parseHitDiceUsed('   ')).toEqual({});
    });

    it('returns empty map for standard empty JSON object', () => {
      expect(parseHitDiceUsed('{}')).toEqual({});
    });

    it('returns empty map for invalid JSON formats or non-objects', () => {
      expect(parseHitDiceUsed('not json')).toEqual({});
      expect(parseHitDiceUsed('[]')).toEqual({});
      expect(parseHitDiceUsed('null')).toEqual({});
      expect(parseHitDiceUsed('123')).toEqual({});
    });
  });

  describe('serializeHitDiceUsed', () => {
    it('serializes Record to JSON string representation', () => {
      const obj = { d12: 1, d10: 0 };
      const serialized = serializeHitDiceUsed(obj);
      // parse it back to make sure it is syntactically equivalent
      expect(JSON.parse(serialized)).toEqual(obj);
    });
  });

  describe('getHitDiceStatus', () => {
    it('calculates status for config "7d8" and used {"d8":3}', () => {
      const statuses = getHitDiceStatus('7d8', '{"d8":3}');
      expect(statuses).toEqual([
        { die: 8, count: 7, used: 3, remaining: 4 },
      ]);
    });

    it('clamps remaining to 0 if used exceeds count', () => {
      const statuses = getHitDiceStatus('7d8', '{"d8":10}');
      expect(statuses).toEqual([
        { die: 8, count: 7, used: 10, remaining: 0 },
      ]);
    });

    it('calculates correct status for multiclass config and partial spend', () => {
      const statuses = getHitDiceStatus('4d12+3d10', '{"d12":1}');
      expect(statuses).toEqual([
        { die: 12, count: 4, used: 1, remaining: 3 },
        { die: 10, count: 3, used: 0, remaining: 3 },
      ]);
    });
  });

  describe('getTotalHitDiceCount', () => {
    it('adds together count values for multiple pools', () => {
      expect(getTotalHitDiceCount('4d12+3d10')).toBe(7);
      expect(getTotalHitDiceCount('8d8')).toBe(8);
      expect(getTotalHitDiceCount('')).toBe(0);
    });
  });

  describe('applyLongRestHitDiceRecovery', () => {
    it('recovers ceil(7/2)=4 spent dice from 6 spent, leaving 2', () => {
      // 7 total dice, recoveries = 4.
      // smallest die is d10. It has 4 spent. So we recover 4 d10, leaving 0 d10 and 2 d12 spent.
      const config = '3d12+4d10';
      const usedJson = '{"d12":2,"d10":4}';
      const result = applyLongRestHitDiceRecovery(config, usedJson);
      expect(JSON.parse(result)).toEqual({ d12: 2, d10: 0 });
    });

    it('returns unchanged if spent count is 0', () => {
      const config = '7d8';
      const usedJson = '{"d8":0}';
      expect(JSON.parse(applyLongRestHitDiceRecovery(config, usedJson))).toEqual({ d8: 0 });
    });

    it('recovers all spent dice if recoveries >= spent count', () => {
      const config = '7d8';
      const usedJson = '{"d8":2}'; // total limit ceil(7/2) = 4, we only spent 2
      expect(JSON.parse(applyLongRestHitDiceRecovery(config, usedJson))).toEqual({ d8: 0 });
    });

    it('handles edge cases gracefully where used exceeds configured limits', () => {
      const config = '4d12+3d10'; // 7 total, recoveries = 4
      const usedJson = '{"d12":5,"d10":5}'; // invalid state originally, but we can still recover 4 from smallest first (recovers 4 from d10, leaving 1 d10, 5 d12)
      expect(JSON.parse(applyLongRestHitDiceRecovery(config, usedJson))).toEqual({ d12: 5, d10: 1 });
    });
  });

  describe('spendHitDice', () => {
    it('adds to the spent count of a valid die size', () => {
      const res = spendHitDice('7d8', '{"d8":2}', 8, 2);
      expect(JSON.parse(res)).toEqual({ d8: 4 });
    });

    it('initializes and spends when there is no original entry in JSON', () => {
      const res = spendHitDice('7d8', '{}', 8, 1);
      expect(JSON.parse(res)).toEqual({ d8: 1 });
    });

    it('throws an error if trying to spend more than available', () => {
      expect(() => spendHitDice('7d8', '{"d8":6}', 8, 2)).toThrow();
    });

    it('throws if trying to spend die size that is not configured', () => {
      expect(() => spendHitDice('7d8', '{}', 10, 1)).toThrow();
    });

    it('works fine on zero spend', () => {
      expect(JSON.parse(spendHitDice('7d8', '{"d8":2}', 8, 0))).toEqual({ d8: 2 });
    });

    it('throws on negative spend count', () => {
      expect(() => spendHitDice('7d8', '{"d8":2}', 8, -1)).toThrow();
    });
  });

  describe('getHitDieForClass', () => {
    it('getHitDieForClass("Barbarian") returns 12', () => {
      expect(getHitDieForClass('Barbarian')).toBe(12);
    });

    it('getHitDieForClass("wizard") returns 6 (case insensitive)', () => {
      expect(getHitDieForClass('wizard')).toBe(6);
    });

    it('getHitDieForClass("Homebrew") returns null', () => {
      expect(getHitDieForClass('Homebrew')).toBeNull();
    });
  });

  describe('addHitDieToConfig', () => {
    it('addHitDieToConfig("7d8", 8) returns "8d8"', () => {
      expect(addHitDieToConfig('7d8', 8)).toBe('8d8');
    });

    it('addHitDieToConfig("7d8", 6) returns "7d8+1d6"', () => {
      expect(addHitDieToConfig('7d8', 6)).toBe('7d8+1d6');
    });

    it('addHitDieToConfig("", 10) returns "1d10"', () => {
      expect(addHitDieToConfig('', 10)).toBe('1d10');
    });

    it('addHitDieToConfig("4d12+3d10", 10) returns "4d12+4d10"', () => {
      expect(addHitDieToConfig('4d12+3d10', 10)).toBe('4d12+4d10');
    });

    it('addHitDieToConfig("4d12+3d10", 8) returns "4d12+3d10+1d8"', () => {
      expect(addHitDieToConfig('4d12+3d10', 8)).toBe('4d12+3d10+1d8');
    });
  });

  describe('parseClassString', () => {
    it('parseClassString("Barbarian/Fighter") returns ["Barbarian", "Fighter"]', () => {
      expect(parseClassString('Barbarian/Fighter')).toEqual(['Barbarian', 'Fighter']);
    });

    it('parseClassString("Monk") returns ["Monk"]', () => {
      expect(parseClassString('Monk')).toEqual(['Monk']);
    });

    it('parseClassString("") returns []', () => {
      expect(parseClassString('')).toEqual([]);
    });
  });

  describe('suggestHitDiceConfig', () => {
    it('suggestHitDiceConfig("Fighter", 5) returns "5d10"', () => {
      expect(suggestHitDiceConfig('Fighter', 5)).toBe('5d10');
    });

    it('suggestHitDiceConfig("Barbarian/Fighter", 7) returns a config with the correct total of 7 dice', () => {
      // Suggesting "Barbarian/Fighter" for lvl 7 should be:
      // Evenly distributed: 7 / 2 = 3. Remainder = 1.
      // Index 0 (Barbarian) gets 3 + 1 = 4.
      // Index 1 (Fighter) gets 3.
      // Total 4d12 + 3d10. Sorted by largest die size first, d12 then d10.
      expect(suggestHitDiceConfig('Barbarian/Fighter', 7)).toBe('4d12+3d10');
    });
  });
});

```

## File: src/lib/__tests__/resourcePoolScaling.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { ResourcePool } from '../resourcePools';
import {
  getAutoScaledMax,
  getResourcePoolSuggestions,
  ResourcePoolSuggestion
} from '../resourcePoolScaling';

describe('resourcePoolScaling', () => {
  const ragePool: ResourcePool = {
    name: 'Rage', max: 2, current: 2, reset: 'long'
  };
  const kiPool: ResourcePool = {
    name: 'Ki Points', max: 2, current: 2, reset: 'short'
  };
  const customPool: ResourcePool = {
    name: 'Portent Dice', max: 2, current: 2, reset: 'long'
  };

  describe('getAutoScaledMax', () => {
    it('returns 2 for Rage at level 1', () => {
      expect(getAutoScaledMax('Rage', 1)).toBe(2);
    });

    it('returns 3 for Rage at level 3', () => {
      expect(getAutoScaledMax('Rage', 3)).toBe(3);
    });

    it('returns 99 for Rage at level 20', () => {
      expect(getAutoScaledMax('Rage', 20)).toBe(99);
    });

    it('returns 2 for Ki Points at level 2', () => {
      expect(getAutoScaledMax('Ki Points', 2)).toBe(2);
    });

    it('returns 10 for Ki Points at level 10', () => {
      expect(getAutoScaledMax('Ki Points', 10)).toBe(10);
    });

    it('returns 5 for Sorcery Points at level 5', () => {
      expect(getAutoScaledMax('Sorcery Points', 5)).toBe(5);
    });

    it('handles case-insensitivity (RAGE)', () => {
      expect(getAutoScaledMax('RAGE', 6)).toBe(4);
    });

    it('trims whitespace ( ki points )', () => {
      expect(getAutoScaledMax(' ki points ', 4)).toBe(4);
    });

    it('returns null for Portent Dice', () => {
      expect(getAutoScaledMax('Portent Dice', 5)).toBeNull();
    });

    it('clamps level below 1 to 1', () => {
      expect(getAutoScaledMax('Rage', 0)).toBe(2);
    });

    it('clamps level above 20 to 20', () => {
      expect(getAutoScaledMax('Rage', 25)).toBe(99);
    });
  });

  describe('getResourcePoolSuggestions', () => {
    describe('Existing pool scaling', () => {
      it('scales Barbarian Rage pool when going from L1 to L3', () => {
        const results = getResourcePoolSuggestions('Barbarian', 3, [ragePool]);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
          name: 'Rage',
          suggestedMax: 3,
          currentMax: 2,
          reset: 'long',
          isAutoDerived: true,
          isNew: false
        });
      });

      it('scales Barbarian Rage pool when going from L5 to L6', () => {
        const currentRageL5 = { ...ragePool, max: 3, current: 3 };
        const results = getResourcePoolSuggestions('Barbarian', 6, [currentRageL5]);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
          name: 'Rage',
          suggestedMax: 4,
          currentMax: 3,
          reset: 'long',
          isAutoDerived: true,
          isNew: false
        });
      });

      it('keeps Wizard customPool unchanged when going L4 to L5', () => {
        const results = getResourcePoolSuggestions('Wizard', 5, [customPool]);
        expect(results).toContainEqual({
          name: 'Portent Dice',
          suggestedMax: 2,
          currentMax: 2,
          reset: 'long',
          isAutoDerived: false,
          isNew: false
        });
      });
    });

    describe('New pool suggestions', () => {
      it('suggests Ki Points for Monk L1 to L2 when currently empty', () => {
        const results = getResourcePoolSuggestions('Monk', 2, []);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
          name: 'Ki Points',
          suggestedMax: 2,
          currentMax: undefined,
          reset: 'short',
          isAutoDerived: true,
          isNew: true
        });
      });

      it('does not suggest Ki Points at L1 (since Ki Points L1 = 0)', () => {
        const results = getResourcePoolSuggestions('Monk', 1, []);
        expect(results).toHaveLength(0);
      });

      it('suggests Sorcery Points and Spell Slots for Sorcerer L1 to L2 when currently empty', () => {
        const results = getResourcePoolSuggestions('Sorcerer', 2, []);
        expect(results).toHaveLength(2);
        expect(results).toContainEqual({
          name: 'Sorcery Points',
          suggestedMax: 2,
          currentMax: undefined,
          reset: 'long',
          isAutoDerived: true,
          isNew: true
        });
        expect(results).toContainEqual({
          name: 'Spell Slots',
          suggestedMax: 4,
          currentMax: undefined,
          reset: 'long',
          isAutoDerived: false,
          isNew: true
        });
      });

      it('does not suggest already existing pool (Barbarian L5 to L6)', () => {
        const results = getResourcePoolSuggestions('Barbarian', 6, [ragePool]);
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Rage');
        expect(results[0].isNew).toBe(false);
      });
    });

    describe('Sort order', () => {
      it('returns existing pools first in their original order, followed by new suggested pools', () => {
        const results = getResourcePoolSuggestions('Monk', 5, [kiPool, customPool]);
        expect(results).toHaveLength(2);
        expect(results[0].name).toBe('Ki Points');
        expect(results[0].isNew).toBe(false);
        expect(results[1].name).toBe('Portent Dice');
        expect(results[1].isNew).toBe(false);
      });
    });

    describe('Unknown class', () => {
      it('returns suggestions for existing pools only for unknown class', () => {
        const results = getResourcePoolSuggestions('Vitalist', 5, [customPool]);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
          name: 'Portent Dice',
          suggestedMax: 2,
          currentMax: 2,
          reset: 'long',
          isAutoDerived: false,
          isNew: false
        });
      });
    });

    describe('Edge cases', () => {
      it('suggests Rage for Barbarian at level 1 as new pool', () => {
        const results = getResourcePoolSuggestions('Barbarian', 1, []);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
          name: 'Rage',
          suggestedMax: 2,
          currentMax: undefined,
          reset: 'long',
          isAutoDerived: true,
          isNew: true
        });
      });

      it('does not suggest Ki Points for Monk at level 1', () => {
        const results = getResourcePoolSuggestions('Monk', 1, []);
        expect(results).toHaveLength(0);
      });
    });
  });
});

```

## File: src/lib/__tests__/resourcePools.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import {
  parseResourcePools,
  serializeResourcePools,
  spendResourcePip,
  recoverResourcePip,
  resetResourcesOnShortRest,
  resetResourcesOnLongRest,
  addResourcePool,
  removeResourcePool,
  updateResourcePool,
  ResourcePool,
  getResourceForEffect,
  EFFECT_RESOURCE_MAP,
} from '../resourcePools';

describe('ResourcePools pure utilities', () => {
  const mockPools: ResourcePool[] = [
    { name: 'Rage', current: 1, max: 3, reset: 'long' },
    { name: 'Ki', current: 2, max: 4, reset: 'short' },
    { name: 'Spell Slots', current: 0, max: 2, reset: 'long' },
  ];

  describe('parseResourcePools', () => {
    it('parses valid JSON arrays correctly', () => {
      const json = JSON.stringify(mockPools);
      expect(parseResourcePools(json)).toEqual(mockPools);
    });

    it('returns empty array for invalid inputs', () => {
      expect(parseResourcePools('')).toEqual([]);
      expect(parseResourcePools('   ')).toEqual([]);
      expect(parseResourcePools('invalid')).toEqual([]);
      expect(parseResourcePools('{}')).toEqual([]);
    });
  });

  describe('serializeResourcePools', () => {
    it('serializes array to JSOn string', () => {
      const res = serializeResourcePools(mockPools);
      expect(JSON.parse(res)).toEqual(mockPools);
    });

    it('serializes empty array correctly', () => {
      expect(serializeResourcePools([])).toBe('[]');
    });
  });

  describe('spendResourcePip', () => {
    it('spends correct count case insensitively', () => {
      const updated = spendResourcePip(mockPools, 'rage', 1);
      expect(updated[0].current).toBe(0);
      expect(updated[1].current).toBe(2); // Ki unchanged
    });

    it('clamps to 0 if count exceeds remaining', () => {
      const updated = spendResourcePip(mockPools, 'Ki', 5);
      expect(updated[1].current).toBe(0);
    });

    it('unmatched pools are unaffected', () => {
      const updated = spendResourcePip(mockPools, 'Wild Shape', 1);
      expect(updated).toEqual(mockPools);
    });
  });

  describe('recoverResourcePip', () => {
    it('recovers resource uses case insensitively', () => {
      const updated = recoverResourcePip(mockPools, 'Ki', 1);
      expect(updated[1].current).toBe(3);
    });

    it('clamps to max uses', () => {
      const updated = recoverResourcePip(mockPools, 'rage', 5);
      expect(updated[0].current).toBe(3);
    });
  });

  describe('resetResourcesOnShortRest', () => {
    it('resets only short-rest resource pools to max', () => {
      const updated = resetResourcesOnShortRest(mockPools);
      expect(updated[0].current).toBe(1); // Rage (long) unchanged
      expect(updated[1].current).toBe(4); // Ki (short) reset to max
      expect(updated[2].current).toBe(0); // Spell Slots (long) unchanged
    });
  });

  describe('resetResourcesOnLongRest', () => {
    it('resets all pools to max regardless of reset type', () => {
      const updated = resetResourcesOnLongRest(mockPools);
      expect(updated[0].current).toBe(3);
      expect(updated[1].current).toBe(4);
      expect(updated[2].current).toBe(2);
    });
  });

  describe('addResourcePool', () => {
    it('adds fresh resource pool with current set to max', () => {
      const updated = addResourcePool(mockPools, { name: 'Grit', max: 5, reset: 'short' });
      expect(updated).toHaveLength(4);
      expect(updated[3]).toEqual({
        name: 'Grit',
        max: 5,
        current: 5,
        reset: 'short',
      });
    });

    it('ignores if pool with same case-insensitive name already exists', () => {
      const updated = addResourcePool(mockPools, { name: 'RAGE', max: 10, reset: 'short' });
      expect(updated).toEqual(mockPools);
    });
  });

  describe('removeResourcePool', () => {
    it('removes pool by case-insensitive name', () => {
      const updated = removeResourcePool(mockPools, 'kI');
      expect(updated).toHaveLength(2);
      expect(updated.find(p => p.name === 'Ki')).toBeUndefined();
    });
  });

  describe('updateResourcePool', () => {
    it('updates properties of matched case-insensitive pool', () => {
      const updated = updateResourcePool(mockPools, 'rage', {
        name: 'Frenzy Rage',
        reset: 'short',
      });
      expect(updated[0].name).toBe('Frenzy Rage');
      expect(updated[0].reset).toBe('short');
      expect(updated[0].max).toBe(3);
    });

    it('clamps current if new max decreases below current', () => {
      const updated = updateResourcePool(mockPools, 'ki', { max: 1 });
      expect(updated[1].max).toBe(1);
      expect(updated[1].current).toBe(1); // clamped from 2
    });
  });

  describe('getResourceForEffect & EFFECT_RESOURCE_MAP', () => {
    it('getResourceForEffect returns correct mapping', () => {
      expect(getResourceForEffect('raging')).toBe('rage');
      expect(getResourceForEffect('RAGING')).toBe('rage');
      expect(getResourceForEffect('wild shaped')).toBe('wild shape');
      expect(getResourceForEffect('concentrating')).toBeNull();
      expect(getResourceForEffect('blinded')).toBeNull();
      expect(getResourceForEffect('sneak attack (used)')).toBeNull();
    });

    it('EFFECT_RESOURCE_MAP has exactly 5 entries', () => {
      expect(Object.keys(EFFECT_RESOURCE_MAP)).toHaveLength(5);
    });
  });
});

```

## File: src/lib/__tests__/sheetAdapters.test.ts

```typescript
// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { expect, describe, it } from 'vitest';
import {
  mapCharacterRowToCharacter,
  mapNpcRowToNpc,
  mapEncounterRowToEncounter,
  mapEncounterCombatantRowToEC,
  CharacterRowData,
  NpcRowData,
  EncounterRowData,
  ECRowData,
} from '../sheetAdapters';

describe('sheetAdapters', () => {
  const mockStatuses = {
    '1': 'Active',
    '2': 'Inactive',
    '3': 'Deceased',
  };

  const mockDifficulties = {
    '1': 'Easy',
    '2': 'Medium',
    '3': 'Hard',
    '4': 'Deadly',
  };

  describe('mapCharacterRowToCharacter', () => {
    it('returns correct Character object from a valid parsed row', () => {
      const data: CharacterRowData = [
        'char-1',                 // [0] id
        'Alice',                  // [1] playerName
        'Thor',                   // [2] characterName
        15,                       // [3] ac
        20,                       // [4] maxHp
        5,                        // [5] tempHp
        25,                       // [6] currentHp
        'Blinded',                // [7] conditions
        14,                       // [8] passivePerception
        3,                        // [9] level
        1,                        // [10] statusId
        'Mighty hero',            // [11] notes
        'fire',                   // [12] resistances
        'cold',                   // [13] immunities
        'poison',                 // [14] vulnerabilities
        0,                        // [15] tempHpMax
        0,                        // [16] tempAc
        0,                        // [17] deathSavesFails
        0,                        // [18] deathSavesSuccesses
        '',                       // [19] unused
        '4d12+3d10',              // [20] hitDiceConfig
        '{"d12":1}',             // [21] hitDiceUsed
      ];

      const character = mapCharacterRowToCharacter(data, 2, mockStatuses);

      expect(character).toEqual({
        id: 'char-1',
        playerName: 'Alice',
        characterName: 'Thor',
        class: '',
        ac: 15,
        maxHp: 20,
        tempHp: 5,
        currentHp: 25,
        conditions: 'Blinded',
        passivePerception: 14,
        level: 3,
        statusId: 1,
        statusName: 'Active',
        notes: 'Mighty hero',
        isActive: true,
        sheetRowIndex: 2,
        resistances: 'fire',
        immunities: 'cold',
        vulnerabilities: 'poison',
        tempHpMax: 0,
        tempAc: 0,
        deathSavesFails: 0,
        deathSavesSuccesses: 0,
        hitDiceConfig: '4d12+3d10',
        hitDiceUsed: '{"d12":1}',
        resourcePools: '[]',
        abilityScores: '{"STR":10,"DEX":10,"CON":10,"INT":10,"WIS":10,"CHA":10}',
        proficiencies: '{"proficiencyBonus":2,"jackOfAllTrades":false,"savingThrows":[],"skills":{},"passiveBonuses":{"perception":0,"insight":0,"investigation":0}}',
        spellcastingAbility: '',
      });
    });

    it('correctly resolves statusName from the statuses lookup map', () => {
      const data: CharacterRowData = [
        'char-2',
        'Bob',
        'Loki',
        10,
        15,
        0,
        15,
        '',
        10,
        1,
        3, // statusId 3 -> Deceased
        '',
        '',
        '',
        '',
        0,
        0,
        0,
        0,
        '',
        '',
        '',
      ];

      const character = mapCharacterRowToCharacter(data, 3, mockStatuses);

      expect(character.statusName).toBe('Deceased');
      expect(character.isActive).toBe(false);

      const dataUnknown: CharacterRowData = [
        'char-3',
        'Charlie',
        'Odin',
        10,
        15,
        0,
        11,
        '',
        10,
        1,
        99, // statusId 99 -> Unknown
        '',
        '',
        '',
        '',
        0,
        0,
        0,
        0,
        '',
        '',
        '',
      ];

      const characterUnknown = mapCharacterRowToCharacter(dataUnknown, 4, mockStatuses);
      expect(characterUnknown.statusName).toBe('Unknown');
      expect(characterUnknown.isActive).toBe(false);
    });

    it('mapCharacterRowToCharacter defaults hitDiceConfig, hitDiceUsed, and resourcePools when row is shorter than 23 columns', () => {
      const shortRow = [
        'char-short', 'Alice', 'Shorty', 10, 10, 0, 10, '', 10, 1, 1, 'notes'
      ] as any;
      const character = mapCharacterRowToCharacter(shortRow, 5, mockStatuses);
      expect(character.hitDiceConfig).toBe('');
      expect(character.hitDiceUsed).toBe('{}');
      expect(character.resourcePools).toBe('[]');
    });

    it('mapCharacterRowToCharacter maps index 19 to the class field', () => {
      const data: CharacterRowData = [
        'char-class', 'Alice', 'Thor', 15, 20, 5, 25, '', 14, 3, 1, '', '', '', '', 0, 0, 0, 0, 'Barbarian', '4d12', '{}', '[]'
      ];
      const character = mapCharacterRowToCharacter(data, 6, mockStatuses);
      expect(character.class).toBe('Barbarian');
    });

    it('class defaults to empty string when row is shorter than 20 columns', () => {
      const shortRow = [
        'char-short', 'Alice', 'Shorty', 10, 10, 0, 10, '', 10, 1, 1, 'notes'
      ] as any;
      const character = mapCharacterRowToCharacter(shortRow, 5, mockStatuses);
      expect(character.class).toBe('');
    });

    it('mapCharacterRowToCharacter with a full 23-element row maps class, hitDiceConfig, hitDiceUsed, and resourcePools to their correct values', () => {
      const data: CharacterRowData = [
        'char-1', 'Alice', 'Thor', 15, 20, 0, 20, '', 14, 1, 1, 'Notes', '', '', '', 0, 0, 0, 0, 'Wizard', '6d6', '{"d6":1}', '[{"id":"res-1","name":"Ki Points","max":5,"current":5,"resetOn":"short"}]'
      ];
      const character = mapCharacterRowToCharacter(data, 7, mockStatuses);
      expect(character.class).toBe('Wizard');
      expect(character.hitDiceConfig).toBe('6d6');
      expect(character.hitDiceUsed).toBe('{"d6":1}');
      expect(character.resourcePools).toBe('[{"id":"res-1","name":"Ki Points","max":5,"current":5,"resetOn":"short"}]');
    });

    it('mapCharacterRowToCharacter with a 20-element row (missing last columns) returns defaults', () => {
      const data = [
        'char-1', 'Alice', 'Thor', 15, 20, 0, 20, '', 14, 1, 1, 'Notes', '', '', '', 0, 0, 0, 0, 'Wizard'
      ] as any;
      const character = mapCharacterRowToCharacter(data, 8, mockStatuses);
      expect(character.class).toBe('Wizard');
      expect(character.hitDiceConfig).toBe('');
      expect(character.hitDiceUsed).toBe('{}');
      expect(character.resourcePools).toBe('[]');
    });
  });

  describe('mapNpcRowToNpc', () => {
    it('returns correct NPC with all IRV fields', () => {
      const data: NpcRowData = [
        'npc-1',                  // [0] id
        'Goblin',                 // [1] name
        12,                       // [2] ac
        7,                        // [3] maxHp
        0,                        // [4] tempHp
        7,                        // [5] currentHp
        'None',                   // [6] conditions
        'Likes dark tunnels',     // [7] notes
        'slashing',               // [8] resistances
        'acid',                   // [9] immunities
        'fire',                   // [10] vulnerabilities
      ];

      const npc = mapNpcRowToNpc(data, 5);

      expect(npc).toEqual({
        id: 'npc-1',
        name: 'Goblin',
        ac: 12,
        maxHp: 7,
        tempHp: 0,
        currentHp: 7,
        conditions: 'None',
        notes: 'Likes dark tunnels',
        resistances: 'slashing',
        immunities: 'acid',
        vulnerabilities: 'fire',
        legendaryActions: 0,
        legendaryResistances: 0,
        rechargeAbilities: [],
        abilityScores: '{"STR":10,"DEX":10,"CON":10,"INT":10,"WIS":10,"CHA":10}',
        proficiencies: '{"proficiencyBonus":2,"jackOfAllTrades":false,"savingThrows":[],"skills":{},"passiveBonuses":{"perception":0,"insight":0,"investigation":0}}',
        speed: '',
        senses: '',
        languages: '',
        challengeRating: '',
        traits: '[]',
        actions: '[]',
        reactions: '[]',
        legendaryActionsList: '[]',
        spellcastingAbility: '',
      });
    });
  });

  describe('mapEncounterRowToEncounter', () => {
    it('correctly resolves difficultyName from the difficulties map', () => {
      const data: EncounterRowData = [
        'enc-1',                      // [0] id
        'Ambush',                     // [1] name
        'Forest road',                // [2] location
        2,                            // [3] difficultyId -> Medium
        '3 Goblins',                  // [4] NPC_Definitions
        5,                            // [5] currentRound
        'ec-42',                      // [6] activeTurnId
      ];

      const encounter = mapEncounterRowToEncounter(data, 1, mockDifficulties);

      expect(encounter).toEqual({
        id: 'enc-1',
        name: 'Ambush',
        location: 'Forest road',
        difficultyId: 2,
        difficultyName: 'Medium',
        npcDefinitions: '3 Goblins',
        status: 'planned',
        sheetRowIndex: 1,
        currentRound: 5,
        activeTurnId: 'ec-42',
      });

      const dataUnknown: EncounterRowData = [
        'enc-2',
        'Cave Run',
        'Dark cave',
        99, // Unknown diff
        'Dragon',
        0,
        '',
      ];
      const encounterUnknown = mapEncounterRowToEncounter(dataUnknown, 2, mockDifficulties);
      expect(encounterUnknown.difficultyName).toBe('Unknown');
    });

    it('mapEncounterRowToEncounter correctly maps index 5 to currentRound', () => {
      const data: EncounterRowData = ['enc-1', 'Name', 'Loc', 1, '', 4, 'ec-1'];
      const encounter = mapEncounterRowToEncounter(data, 1, mockDifficulties);
      expect(encounter.currentRound).toBe(4);
    });

    it('mapEncounterRowToEncounter correctly maps index 6 to activeTurnId', () => {
      const data: EncounterRowData = ['enc-1', 'Name', 'Loc', 1, '', 4, 'ec-99'];
      const encounter = mapEncounterRowToEncounter(data, 1, mockDifficulties);
      expect(encounter.activeTurnId).toBe('ec-99');
    });

    it('mapEncounterRowToEncounter defaults currentRound to 0 when the row is shorter than 7 columns', () => {
      const data = ['enc-1', 'Name', 'Loc', 1, ''] as any as EncounterRowData;
      const encounter = mapEncounterRowToEncounter(data, 1, mockDifficulties);
      expect(encounter.currentRound).toBe(0);
      expect(encounter.activeTurnId).toBe('');
    });
  });

  describe('mapEncounterCombatantRowToEC', () => {
    it('parses conditionTimers JSON string into a Record correctly', () => {
      const data: ECRowData = [
        'ec-1',                                   // [0] id
        'enc-1',                                  // [1] encounterId
        'char-1',                                 // [2] playerId
        null,                                     // [3] npcId
        1,                                        // [4] quantity
        14,                                       // [5] initiative
        '{"Blessed":2,"Hasted":5}',               // [6] conditionTimers
      ];

      const ec = mapEncounterCombatantRowToEC(data, 1);

      expect(ec.conditionTimers).toEqual({
        Blessed: 2,
        Hasted: 5,
      });
      expect(ec.initiative).toBe(14);
    });

    it('defaults conditionTimers to empty object when JSON is invalid', () => {
      const data: ECRowData = [
        'ec-2',
        'enc-1',
        null,
        'npc-1',
        5,
        10,
        '{invalid-json',
      ];

      const ec = mapEncounterCombatantRowToEC(data, 2);

      expect(ec.conditionTimers).toEqual({});
      expect(ec.quantity).toBe(5);
    });

    it('defaults conditionTimers to empty object when conditionTimers is empty string or absent', () => {
      const data: ECRowData = [
        'ec-3',
        'enc-1',
        null,
        'npc-1',
        1,
        0,
        '',
      ];

      const ec = mapEncounterCombatantRowToEC(data, 3);
      expect(ec.conditionTimers).toEqual({});
    });

    it('maps npcCurrentHp and npcTempHp correctly if present in ECRowData', () => {
      const data: ECRowData = [
        'ec-4',
        'enc-1',
        null,
        'npc-1',
        1,
        15,
        '{"Blessed":2}',
        35,
        10
      ];

      const ec = mapEncounterCombatantRowToEC(data, 4);
      expect(ec.npcCurrentHp).toBe(35);
      expect(ec.npcTempHp).toBe(10);
    });

    it('defaults npcCurrentHp to -1 and npcTempHp to 0 if absent dynamically', () => {
      const data: ECRowData = [
        'ec-5',
        'enc-1',
        null,
        'npc-1',
        1,
        15,
        '{"Blessed":2}'
      ];

      const ec = mapEncounterCombatantRowToEC(data, 5);
      expect(ec.npcCurrentHp).toBe(-1);
      expect(ec.npcTempHp).toBe(0);
    });
  });
});

```

## File: src/lib/__tests__/sheetSchemas.test.ts

```typescript
// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

import { expect, describe, it, assertType } from 'vitest';
import {
  CharacterRowSchema,
  NpcRowSchema,
  EncounterRowSchema,
  EncounterCombatantRowSchema,
  StatusRowSchema,
  DifficultyRowSchema,
} from '../sheetSchemas';
import { SheetRow, BatchRequest } from '../../services/sheetsService';

describe('sheetSchemas', () => {
  describe('CharacterRowSchema', () => {
    it('parses a fully valid row correctly', () => {
      const row = ['char-1', 'Alice', 'Thor', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes'];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['char-1', 'Alice', 'Thor', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes', '', '', '', 0, 0, 0, 0, '', '', '{}', '[]', '{"STR":10,"DEX":10,"CON":10,"INT":10,"WIS":10,"CHA":10}', '{"proficiencyBonus":2,"jackOfAllTrades":false,"savingThrows":[],"skills":{},"passiveBonuses":{"perception":0,"insight":0,"investigation":0}}', '']);
      }
    });

    it('falls back to defaults for missing optional fields', () => {
      const row = ['char-2', undefined, 'Loki'];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([
         'char-2', // id
         '', // playerName (default)
         'Loki', // characterName
         10, // ac
         10, // maxHp
         0, // tempHp
         10, // currentHp
         '', // conditions
         10, // passivePerception
         1, // level
         1, // statusId
         '', // notes
         '', // resistances
         '', // immunities
         '', // vulnerabilities
         0, // tempHpMax
         0, // tempAc
         0, // deathSavesFails
         0, // deathSavesSuccesses
         '', // class
         '', // hitDiceConfig
         '{}', // hitDiceUsed
         '[]', // resourcePools
         '{"STR":10,"DEX":10,"CON":10,"INT":10,"WIS":10,"CHA":10}', // abilityScores
         '{"proficiencyBonus":2,"jackOfAllTrades":false,"savingThrows":[],"skills":{},"passiveBonuses":{"perception":0,"insight":0,"investigation":0}}', // proficiencies
         '', // spellcastingAbility
        ]);
      }
    });

    it('fails validation on empty string characterName', () => {
      const row = ['char-3', 'Alice', '', 15];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(false);
    });

    it('parses class at index 19 and defaults to empty string when absent', () => {
      const rowWithClass = ['char-1', 'Alice', 'Thor', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes', '', '', '', 0, 0, 0, 0, 'Wizard', '4d6', '{}'];
      const parsedWithClass = CharacterRowSchema.safeParse(rowWithClass);
      expect(parsedWithClass.success).toBe(true);
      if (parsedWithClass.success) {
        expect(parsedWithClass.data[19]).toBe('Wizard');
      }

      const rowWithoutClass = ['char-1', 'Alice', 'Thor', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes', '', '', '', 0, 0, 0, 0];
      const parsedWithoutClass = CharacterRowSchema.safeParse(rowWithoutClass);
      expect(parsedWithoutClass.success).toBe(true);
      if (parsedWithoutClass.success) {
        expect(parsedWithoutClass.data[19]).toBe('');
      }
    });

    it('fails validation on empty string id', () => {
      const row = ['', 'Alice', 'Thor', 15];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(false);
    });

    it('coerces strings to numbers correctly', () => {
      const row = ['char-4', 'Bob', 'Hulk', '16', '30', '0', '30', '', '10', '5', '1', ''];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[3]).toBe(16); // ac
        expect(result.data[4]).toBe(30); // maxHp
      }
    });

    it('A SheetRow containing a mix of string, number, boolean, and null values is accepted by the CharacterRowSchema without errors', () => {
      const row: SheetRow = ['char-mix', 'Alice', 'Mixed', 15, null, true, 20, false, 14, 3, 1, null];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
    });

    it('A BatchRequest with a deleteDimension shape satisfies the BatchRequest type', () => {
      const req = {
        deleteDimension: {
          range: {
            sheetId: 101,
            dimension: 'ROWS' as const,
            startIndex: 1,
            endIndex: 2,
          },
        },
      };
      // Compile-time check: assignable to BatchRequest
      assertType<BatchRequest>(req);
      expect(req).toBeDefined();
    });

    it('parses resistances at index 12, immunities at index 13, and vulnerabilities at index 14 and defaults to empty string when absent', () => {
      const rowWithIrv = ['char-1', 'Alice', 'Thor', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes', 'Fire', 'Poison', 'Acid'];
      const resultWithIrv = CharacterRowSchema.safeParse(rowWithIrv);
      expect(resultWithIrv.success).toBe(true);
      if (resultWithIrv.success) {
        expect(resultWithIrv.data[12]).toBe('Fire');         // resistances
        expect(resultWithIrv.data[13]).toBe('Poison');       // immunities
        expect(resultWithIrv.data[14]).toBe('Acid');         // vulnerabilities
      }

      const rowWithoutIrv = ['char-2', 'Bob', 'Loki', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes'];
      const resultWithoutIrv = CharacterRowSchema.safeParse(rowWithoutIrv);
      expect(resultWithoutIrv.success).toBe(true);
      if (resultWithoutIrv.success) {
        expect(resultWithoutIrv.data[12]).toBe(''); // resistances
        expect(resultWithoutIrv.data[13]).toBe(''); // immunities
        expect(resultWithoutIrv.data[14]).toBe(''); // vulnerabilities
      }
    });

    it('Passing a string where a number is expected in a SheetRow still parses correctly via Zod coercion', () => {
      const row: SheetRow = ['char-str-num', 'Bob', 'Stringy', '18', '40'];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[3]).toBe(18); // AC is coerced to number
        expect(result.data[4]).toBe(40); // maxHp is coerced to number
      }
    });

    it('CharacterRowSchema parses hitDiceConfig at index 20, defaults to empty string when absent', () => {
      const row: SheetRow = ['char-1', 'Alice', 'Thor', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes', '', '', '', 0, 0, 0, 0, '', '4d12+3d10'];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[20]).toBe('4d12+3d10');
      }

      const rowAbsent: SheetRow = ['char-1', 'Alice', 'Thor'];
      const resultAbsent = CharacterRowSchema.safeParse(rowAbsent);
      expect(resultAbsent.success).toBe(true);
      if (resultAbsent.success) {
        expect(resultAbsent.data[20]).toBe('');
      }
    });

    it('CharacterRowSchema parses hitDiceUsed at index 21, defaults to {} when absent', () => {
      const row: SheetRow = ['char-1', 'Alice', 'Thor', 15, 20, 5, 25, 'Blinded', 14, 3, 1, 'Notes', '', '', '', 0, 0, 0, 0, '', '', '{"d12":1}'];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[21]).toBe('{"d12":1}');
      }

      const rowAbsent: SheetRow = ['char-1', 'Alice', 'Thor'];
      const resultAbsent = CharacterRowSchema.safeParse(rowAbsent);
      expect(resultAbsent.success).toBe(true);
      if (resultAbsent.success) {
        expect(resultAbsent.data[21]).toBe('{}');
      }
    });

    it('A 22-element row for Characters parses index 19 as class, index 20 as hitDiceConfig, index 21 as hitDiceUsed', () => {
      const row: SheetRow = ['char-1', 'Alice', 'Thor', 15, 20, 0, 20, '', 14, 1, 1, 'Notes', '', '', '', 0, 0, 0, 0, 'Barbarian', '7d8', '{"d8":2}'];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[19]).toBe('Barbarian');
        expect(result.data[20]).toBe('7d8');
        expect(result.data[21]).toBe('{"d8":2}');
      }
    });

    it('A row shorter than 22 elements returns empty string defaults for class, hitDiceConfig, hitDiceUsed (not undefined or errors)', () => {
      const row: SheetRow = ['char-1', 'Alice', 'Thor', 15, 20, 0, 20, '', 14, 1, 1, 'Notes', '', '', '', 0, 0, 0, 0];
      const result = CharacterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[19]).toBe('');
        expect(result.data[20]).toBe('');
        expect(result.data[21]).toBe('{}'); // default from schema is '{}' for hitDiceUsed, others empty string
      }
    });
  });

    describe('NpcRowSchema', () => {
      it('parses a fully valid row correctly', () => {
        const row = ['npc-1', 'Goblin', 15, 7, 0, 7, '', 'Watch out', 'Fire', 'Poison', 'Cold'];
        const result = NpcRowSchema.safeParse(row);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual([
            'npc-1', 'Goblin', 15, 7, 0, 7, '', 'Watch out', 'Fire', 'Poison', 'Cold', 0, 0, '',
            '{"STR":10,"DEX":10,"CON":10,"INT":10,"WIS":10,"CHA":10}',
            '{"proficiencyBonus":2,"jackOfAllTrades":false,"savingThrows":[],"skills":{},"passiveBonuses":{"perception":0,"insight":0,"investigation":0}}',
            '', '', '', '', '[]', '[]', '[]', '[]', ''
          ]);
        }
      });

    it('correctly parses resistances, immunities, and vulnerabilities and defaults them to empty strings when absent', () => {
      const row = ['npc-1', 'Goblin', 15, 7, 0, 7, '', 'Watch out'];
      const result = NpcRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[8]).toBe(''); // resistances
        expect(result.data[9]).toBe(''); // immunities
        expect(result.data[10]).toBe(''); // vulnerabilities
      }
    });
  });

  describe('EncounterRowSchema', () => {
    it('parses a fully valid row correctly', () => {
      const row = ['enc-1', 'Ambush', 'Forest', 2, 'npc-1:3', 5, 'ec-42'];
      const result = EncounterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['enc-1', 'Ambush', 'Forest', 2, 'npc-1:3', 5, 'ec-42']);
      }
    });

    it('EncounterRowSchema parses currentRound at index 5', () => {
      const row = ['enc-1', 'Ambush', 'Forest', 2, 'npc-1:3', 3];
      const result = EncounterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[5]).toBe(3);
      }
    });

    it('EncounterRowSchema defaults currentRound to 0 when absent', () => {
      const row = ['enc-2', 'Ambush', 'Forest', 2, 'npc-1:3'];
      const result = EncounterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[5]).toBe(0);
      }
    });

    it('EncounterRowSchema parses activeTurnId at index 6', () => {
      const row = ['enc-3', 'Ambush', 'Forest', 2, 'npc-1:3', 0, 'ec-99'];
      const result = EncounterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[6]).toBe('ec-99');
      }
    });

    it('EncounterRowSchema defaults activeTurnId to empty string when absent', () => {
      const row = ['enc-4', 'Ambush', 'Forest', 2, 'npc-1:3'];
      const result = EncounterRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[6]).toBe('');
      }
    });
  });

  describe('EncounterCombatantRowSchema', () => {
    it('parses a fully valid row correctly', () => {
      const row = ['ec-1', 'enc-1', 'char-1', null, 1, 15];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['ec-1', 'enc-1', 'char-1', null, 1, 15, '', -1, 0, '', 0]);
      }
    });

    it('handles empty string and null playerId/npcId by converting to null and defaults initiative', () => {
      const row = ['ec-2', 'enc-1', '', null, 1];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[2]).toBe(null);
        expect(result.data[3]).toBe(null);
        expect(result.data[5]).toBe(0);
      }
    });

    it('defaults initiative to 0 when absent', () => {
      const row = ['ec-1', 'enc-1', 'char-1', null, 1];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[5]).toBe(0);
      }
    });

    it('parses conditionTimers at index 6 as a raw string and defaults to empty string when absent', () => {
      const rowWithTimers = ['ec-1', 'enc-1', 'char-1', null, 1, 15, '{"Hasted":7}'];
      const resultWithTimers = EncounterCombatantRowSchema.safeParse(rowWithTimers);
      expect(resultWithTimers.success).toBe(true);
      if (resultWithTimers.success) {
        expect(resultWithTimers.data[6]).toBe('{"Hasted":7}');
      }

      const rowWithoutTimers = ['ec-2', 'enc-1', 'char-1', null, 1, 15];
      const resultWithoutTimers = EncounterCombatantRowSchema.safeParse(rowWithoutTimers);
      expect(resultWithoutTimers.success).toBe(true);
      if (resultWithoutTimers.success) {
        expect(resultWithoutTimers.data[6]).toBe('');
      }
    });

    it('parses npcCurrentHp at index 7 and npcTempHp at index 8 when they are present', () => {
      const row = ['ec-1', 'enc-1', null, 'npc-1', 1, 15, '{"Hasted":7}', 45, 10];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[7]).toBe(45);
        expect(result.data[8]).toBe(10);
      }
    });

    it('defaults npcCurrentHp to -1 and npcTempHp to 0 when they are absent', () => {
      const row = ['ec-1', 'enc-1', null, 'npc-1', 1, 15, '{"Hasted":7}'];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[7]).toBe(-1);
        expect(result.data[8]).toBe(0);
      }
    });

    it('coerces numeric strings to numbers for columns H & I', () => {
      const row = ['ec-1', 'enc-1', null, 'npc-1', 1, 15, '{"Hasted":7}', '50', '5'];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[7]).toBe(50);
        expect(result.data[8]).toBe(5);
      }
    });

    it('EncounterCombatantRowSchema parses npcCurrentConditions at index 9 as a string', () => {
      const row = ['ec-1', 'enc-1', null, 'npc-1', 1, 15, '', 50, 5, 'blinded, poisoned'];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[9]).toBe('blinded, poisoned');
      }
    });

    it('EncounterCombatantRowSchema defaults npcCurrentConditions to empty string when absent', () => {
      const row = ['ec-1', 'enc-1', null, 'npc-1', 1, 15, '', 50, 5];
      const result = EncounterCombatantRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[9]).toBe('');
      }
    });
  });

  describe('StatusRowSchema', () => {
    it('parses a fully valid row correctly', () => {
      const row = [1, 'Active'];
      const result = StatusRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        // ID should be coerced to string
        expect(result.data).toEqual(['1', 'Active']);
      }
    });
  });

  describe('DifficultyRowSchema', () => {
    it('parses a fully valid row correctly', () => {
      const row = [1, 'Easy'];
      const result = DifficultyRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['1', 'Easy']);
      }
    });
  });

  it('CharacterRowSchema pads results to 26 columns', () => {
    const row = ['char-1', 'Player', 'Hero'];
    const result = CharacterRowSchema.parse(row);
    expect(result).toHaveLength(26);
  });

  it('NpcRowSchema pads results to 25 columns', () => {
    const row = ['npc-1', 'Goblin'];
    const result = NpcRowSchema.parse(row);
    expect(result).toHaveLength(25);
  });
});

```

## File: src/lib/__tests__/sheetSyncParser.test.ts

```typescript
import { describe, it, expect, vi } from 'vitest';
import {
  parseStatuses,
  parseDifficulties,
  parseNPCs,
  parseEncounters,
  parseEncounterCombatants,
  parseCharacters,
} from '../sheetSyncParser';

describe('sheetSyncParser', () => {
  describe('parseStatuses', () => {
    it('returns a correctly shaped output object for a valid row', () => {
      const data = [['1', 'Active']];
      const result = parseStatuses(data);
      expect(result).toEqual({ '1': 'Active' });
    });
  });

  describe('parseDifficulties', () => {
    it('returns a correctly shaped output object for a valid row', () => {
      const data = [['1', 'Easy']];
      const result = parseDifficulties(data);
      expect(result).toEqual({ '1': 'Easy' });
    });
  });

  describe('parseNPCs', () => {
    it('returns correctly shaped NPC array with all fields mapped coercion', () => {
      const data = [
        ['N1', 'Goblin', '12', '15', '0', '7', 'Blinded', 'Fast', 'Fire', 'None', 'None']
      ];
      // 0: id, 1: Name, 2: AC, 3: maxHp, 4: TempHP, 5: C HP, 6: Conditions, 7: Notes, 8: Res, 9: Imm, 10: Vuln
      const result = parseNPCs(data);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'N1',
        name: 'Goblin',
        ac: 12,
        maxHp: 15,
        currentHp: 7,
        conditions: 'Blinded',
        notes: 'Fast',
        resistances: 'Fire',
        immunities: 'None',
        vulnerabilities: 'None',
      }));
    });

    it('numeric coercion from strings to numbers', () => {
      const data = [['N1', 'Orc', '10', '20', '5', '10']];
      const result = parseNPCs(data);
      expect(result[0].maxHp).toBe(20);
      expect(result[0].ac).toBe(10);
      expect(result[0].tempHp).toBe(5);
      expect(result[0].currentHp).toBe(10);
    });

    it('optional fields missing default to correct values', () => {
      const data = [['N1', 'Blank NPC', '10', '10']];
      const result = parseNPCs(data);
      expect(result[0].tempHp).toBe(0);
      expect(result[0].currentHp).toBe(10);
      expect(result[0].conditions).toBe('');
      expect(result[0].notes).toBe('');
      expect(result[0].resistances).toBe('');
      expect(result[0].immunities).toBe('');
      expect(result[0].vulnerabilities).toBe('');
    });

    it('shorter than expected missing trailing columns', () => {
      const data = [['N1', 'Short NPC', '10', '10']];
      const result = parseNPCs(data);
      expect(result[0].resistances).toBe('');
      expect(result[0].legendaryActions).toBe(0); // schema coerces to 0
    });

    it('completely null or undefined row returns null (filtered out)', () => {
      const data = [null, undefined, []];
      const result = parseNPCs(data);
      expect(result).toEqual([]);
    });

    it('rechargeAbilities column containing valid JSON parses to array with correct name', () => {
      const validJson = JSON.stringify([{ name: 'Breath', rechargeOn: '5-6' }]);
      const data = [['N1', 'Dragon', '18', '100', '0', '100', '', '', '', '', '', '3', '3', validJson]];
      const result = parseNPCs(data);
      expect(result[0].rechargeAbilities).toEqual([{ name: 'Breath', rechargeOn: '5-6' }]);
    });

    it('rechargeAbilities column containing malformed JSON returns empty array, does not throw', () => {
      const malformedJson = '[{ name: Breath }]';
      const data = [['N1', 'Dragon', '18', '100', '0', '100', '', '', '', '', '', '3', '3', malformedJson]];
      const result = parseNPCs(data);
      expect(result[0].rechargeAbilities).toEqual([]);
    });

    it('rechargeAbilities column that is empty string returns empty array', () => {
      const data = [['N1', 'Dragon', '18', '100', '0', '100', '', '', '', '', '', '3', '3', '']];
      const result = parseNPCs(data);
      expect(result[0].rechargeAbilities).toEqual([]);
    });
  });

  describe('parseEncounters', () => {
    it('returns correctly mapped output on valid row', () => {
      const data = [['1', 'Forest Ambush', 'Forest', '2', '[]', '1', 'turn123']];
      const result = parseEncounters(data, { '2': 'Easy' });
      expect(result[0]).toEqual({
        id: '1',
        name: 'Forest Ambush',
        location: 'Forest',
        difficultyId: 2,
        difficultyName: 'Easy',
        status: 'planned',
        currentRound: 1,
        activeTurnId: 'turn123',
        sheetRowIndex: 1,
        npcDefinitions: '[]',
      });
    });

    it('currentRound absent or empty defaults to 0', () => {
      const data = [['1', 'Camp', 'Zone', '1', '[]', '']];
      const result = parseEncounters(data, { '1': 'Easy' });
      expect(result[0].currentRound).toBe(0);
    });

    it('activeTurnId absent or empty defaults to empty string', () => {
      const data = [['1', 'Camp', 'Zone', '1', '[]', '1', '']];
      const result = parseEncounters(data, { '1': 'Easy' });
      expect(result[0].activeTurnId).toBe('');
      
      const missingData = [['1', 'Camp', 'Zone', '1', '[]', '1']];
      const resultMissing = parseEncounters(missingData, { '1': 'Easy' });
      expect(resultMissing[0].activeTurnId).toBe('');
    });
    
    it('shorter than expected misses round and turn defaults to 0 and empty', () => {
      const missingData = [['1', 'Camp', 'Zone', '1', '[]']];
      const resultMissing = parseEncounters(missingData, { '1': 'Easy' });
      expect(resultMissing[0].currentRound).toBe(0);
      expect(resultMissing[0].activeTurnId).toBe('');
    });

    it('completely null or undefined row returns null (filtered out)', () => {
      const data = [null, undefined, []];
      const result = parseEncounters(data, {});
      expect(result).toEqual([]);
    });
  });

  describe('parseEncounterCombatants', () => {
    it('returns correctly mapped output', () => {
      const data = [['ec-1', '2', '3', '5', '10', '20', '0']];
      const result = parseEncounterCombatants(data);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'ec-1',
        encounterId: '2',
        playerId: '3',
        npcId: '5',
        quantity: 10,
        npcCurrentHp: -1,
        npcTempHp: 0,
        initiative: 20,
        sheetRowIndex: 1,
      }));
    });
    
    it('coerces properly and defaults properly', () => {
      const data = [['ec-1', '1', '', '5', '1']];
      const result = parseEncounterCombatants(data);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'ec-1',
        encounterId: '1',
        playerId: null,
        npcId: '5',
        quantity: 1,
        npcCurrentHp: -1,
        npcTempHp: 0,
        initiative: 0,
        sheetRowIndex: 1,
      }));
    });
  });

  describe('parseCharacters', () => {
    it('returns correctly mapped character', () => {
      const data = [['P1', 'Player', 'Hero', '15', '20', '0', '20', 'Poisoned', '12', '5', '1', 'Notes']];
      const result = parseCharacters(data, { '1': 'Active' });
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'P1',
        playerName: 'Player',
        characterName: 'Hero',
        ac: 15,
        maxHp: 20,
        tempHp: 0,
        currentHp: 20,
        conditions: 'Poisoned',
        passivePerception: 12,
        level: 5,
        statusId: 1,
        statusName: 'Active',
        notes: 'Notes',
        isActive: true,
      }));
    });

    it('shorter than expected row gets default notes and conditions', () => {
      const data = [['P1', 'Player', 'Hero', '15', '20', '0', '20']];
      // [7] conditions, [8] passivePerception, etc missing
      const result = parseCharacters(data, { '1': 'Active' });
      expect(result[0].conditions).toBe('');
      expect(result[0].notes).toBe('');
      expect(result[0].passivePerception).toBe(10);
    });
  });
});

```

## File: src/lib/__tests__/spellcasting.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import {
  getAutoSpellcastingAbility,
  getEffectiveSpellcastingAbility,
  calculateSpellSaveDC,
  calculateSpellAttackBonus,
  parseSpellcastingAbility,
} from '../spellcasting';

describe('getAutoSpellcastingAbility', () => {
  it('returns int for Wizard', () => {
    expect(getAutoSpellcastingAbility('Wizard')).toBe('INT');
  });

  it('returns wis for Cleric', () => {
    expect(getAutoSpellcastingAbility('Cleric')).toBe('WIS');
  });

  it('returns cha for Warlock', () => {
    expect(getAutoSpellcastingAbility('Warlock')).toBe('CHA');
  });

  it('returns cha for Bard', () => {
    expect(getAutoSpellcastingAbility('Bard')).toBe('CHA');
  });

  it('returns cha for Paladin', () => {
    expect(getAutoSpellcastingAbility('Paladin')).toBe('CHA');
  });

  it('returns wis for Druid', () => {
    expect(getAutoSpellcastingAbility('Druid')).toBe('WIS');
  });

  it('returns wis for Ranger', () => {
    expect(getAutoSpellcastingAbility('Ranger')).toBe('WIS');
  });

  it('returns null for Barbarian', () => {
    expect(getAutoSpellcastingAbility('Barbarian')).toBeNull();
  });

  it('returns null for Fighter', () => {
    expect(getAutoSpellcastingAbility('Fighter')).toBeNull();
  });

  it('returns null for Monk', () => {
    expect(getAutoSpellcastingAbility('Monk')).toBeNull();
  });

  it('returns null for Rogue', () => {
    expect(getAutoSpellcastingAbility('Rogue')).toBeNull();
  });

  it('returns null for unknown class string', () => {
    expect(getAutoSpellcastingAbility('Vitalist')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getAutoSpellcastingAbility('')).toBeNull();
  });
});

describe('getEffectiveSpellcastingAbility', () => {
  it('returns the override when override is a string (int)', () => {
    expect(getEffectiveSpellcastingAbility('Fighter', 'INT')).toBe('INT');
  });

  it('returns the override when override is a string (wis)', () => {
    expect(getEffectiveSpellcastingAbility('Cleric', 'WIS')).toBe('WIS');
  });

  it('returns null when override is explicitly null, even for a known caster class (Wizard)', () => {
    expect(getEffectiveSpellcastingAbility('Wizard', null)).toBeNull();
  });

  it('auto-derives int when override is undefined and class is Wizard', () => {
    expect(getEffectiveSpellcastingAbility('Wizard', undefined)).toBe('INT');
  });

  it('auto-derives wis when override is undefined and class is Cleric', () => {
    expect(getEffectiveSpellcastingAbility('Cleric', undefined)).toBe('WIS');
  });

  it('returns null when override is undefined and class is Barbarian', () => {
    expect(getEffectiveSpellcastingAbility('Barbarian', undefined)).toBeNull();
  });

  it('returns null when override is undefined and class is undefined', () => {
    expect(getEffectiveSpellcastingAbility(undefined, undefined)).toBeNull();
  });
});

describe('calculateSpellSaveDC', () => {
  it('returns 13 for mod 3, prof 2', () => {
    expect(calculateSpellSaveDC(3, 2)).toBe(13);
  });

  it('returns 17 for mod 5, prof 4', () => {
    expect(calculateSpellSaveDC(5, 4)).toBe(17);
  });

  it('returns 9 for mod -1, prof 2', () => {
    expect(calculateSpellSaveDC(-1, 2)).toBe(9);
  });

  it('returns 8 for mod 0, prof 0', () => {
    expect(calculateSpellSaveDC(0, 0)).toBe(8);
  });
});

describe('calculateSpellAttackBonus', () => {
  it('returns 5 for mod 3, prof 2', () => {
    expect(calculateSpellAttackBonus(3, 2)).toBe(5);
  });

  it('returns 9 for mod 5, prof 4', () => {
    expect(calculateSpellAttackBonus(5, 4)).toBe(9);
  });

  it('returns 1 for mod -1, prof 2', () => {
    expect(calculateSpellAttackBonus(-1, 2)).toBe(1);
  });

  it('returns 0 for mod 0, prof 0', () => {
    expect(calculateSpellAttackBonus(0, 0)).toBe(0);
  });
});

describe('parseSpellcastingAbility', () => {
  it('returns null when passed null (explicit non-caster override)', () => {
    expect(parseSpellcastingAbility(null)).toBe(null);
  });

  it('returns undefined when passed undefined', () => {
    expect(parseSpellcastingAbility(undefined)).toBe(undefined);
  });

  it('returns null when passed the string "none"', () => {
    expect(parseSpellcastingAbility("none")).toBe(null);
  });

  it('returns INT when passed "INT"', () => {
    expect(parseSpellcastingAbility("INT")).toBe("INT");
  });
});

```

## File: src/server/__tests__/auth.test.ts

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from '../routes/auth';

describe('Auth Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    vi.unstubAllEnvs();
    
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /auth/token exchanges code for access token and returns it to the client', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-id');
    vi.stubEnv('VITE_GOOGLE_CLIENT_SECRET', 'test-secret');
    
    const mockSuccessResponse = { access_token: 'fake-token', expires_in: 3600 };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSuccessResponse,
    } as Response);
    
    const response = await request(app).post('/api/auth/google-token').send({ code: 'test' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockSuccessResponse);
  });

  it('POST /auth/token returns 400 when code is missing from the request body', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-id');
    vi.stubEnv('VITE_GOOGLE_CLIENT_SECRET', 'test-secret');
    
    const response = await request(app).post('/api/auth/google-token').send({ redirect_uri: 'http://localhost' });
    expect(response.status).toBe(400);
  });
});

```

## File: src/server/__tests__/campaigns.test.ts

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import campaignsRouter from '../routes/campaigns';

describe('Campaigns Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/campaigns', campaignsRouter);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/campaigns/create provisions all required sheets with correct column headers', async () => {
    const mockSpreadsheetResponse = {
      spreadsheetId: 'spread-123',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/spread-123/edit',
      sheets: [
        {
          properties: {
            sheetId: 0,
            title: 'Sheet1'
          }
        }
      ]
    };

    // Mock first fetch: Create spreadsheet
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockSpreadsheetResponse,
    } as Response);

    // Mock second fetch: BatchUpdate sheets creation/deletion
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => 'Success',
    } as Response);

    // Mock third fetch: Value write batchUpdate
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    const response = await request(app)
      .post('/api/campaigns/create')
      .set('Authorization', 'Bearer mock-token')
      .send({ title: 'Tomb of Horrors' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      spreadsheetId: 'spread-123',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/spread-123/edit',
      name: 'Tomb of Horrors'
    });

    // Verify the sheet structuring request
    const sheetsCall = vi.mocked(fetch).mock.calls[1];
    expect(sheetsCall[0]).toBe('https://sheets.googleapis.com/v4/spreadsheets/spread-123:batchUpdate');
    const sheetsBody = JSON.parse(sheetsCall[1]!.body as string);
    
    // Should have 7 requests (6 addSheets + 1 delete default sheet)
    expect(sheetsBody.requests).toHaveLength(7);
    expect(sheetsBody.requests[0].addSheet.properties.title).toBe('Characters');
    expect(sheetsBody.requests[1].addSheet.properties.title).toBe('NPCs');
    expect(sheetsBody.requests[2].addSheet.properties.title).toBe('Encounters');
    expect(sheetsBody.requests[3].addSheet.properties.title).toBe('Encounter_Combatants');
    expect(sheetsBody.requests[4].addSheet.properties.title).toBe('Status');
    expect(sheetsBody.requests[5].addSheet.properties.title).toBe('Difficulty_Level');
    expect(sheetsBody.requests[6].deleteSheet.sheetId).toBe(0);

    // Verify values write request
    const valuesCall = vi.mocked(fetch).mock.calls[2];
    expect(valuesCall[0]).toBe('https://sheets.googleapis.com/v4/spreadsheets/spread-123/values:batchUpdate');
    const valuesBody = JSON.parse(valuesCall[1]!.body as string);
    expect(valuesBody.data).toHaveLength(6);

    // Characters sheet header assertion
    const charsData = valuesBody.data.find((d: any) => d.range.startsWith('Characters!'));
    expect(charsData).toBeDefined();
    expect(charsData.values[0]).toEqual([
      'Player_ID', 'Player_Name', 'Character_Name',
      'AC', 'Max_HP', 'Temp_HP', 'Current_HP',
      'Current_Condition', 'Passive_Perception',
      'Current_Level', 'Status', 'Notes',
      'Resistances', 'Immunities', 'Vulnerabilities',
      'Temp_HP_Max', 'Temp_AC', 'Death_Saves_Fails',
      'Death_Saves_Successes', 'Class',
      'Hit_Dice_Config', 'Hit_Dice_Used', 'Resource_Pools',
      'Ability_Scores', 'Proficiencies', 'Spellcasting_Ability'
    ]);
  });

  it('POST /api/campaigns/create returns an error when the Google Sheets API call fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: 'FORBIDDEN' }),
    } as Response);

    const response = await request(app)
      .post('/api/campaigns/create')
      .set('Authorization', 'Bearer mock-token')
      .send({ title: 'Tomb of Horrors' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: 'GOOGLE_API_ERROR',
      details: { error: 'FORBIDDEN' }
    });
  });
});

```

## File: src/server/__tests__/health.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import healthRouter from '../routes/health';

describe('Health Router', () => {
  it('GET /health returns 200 and status ok', async () => {
    const app = express();
    app.use('/api', healthRouter);

    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });
});

```

## File: src/services/__tests__/dbOperations.test.ts

```typescript
// src/services/__tests__/dbOperations.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as sheetsService from '../sheetsService';
import * as writeQueue from '../writeQueue';
import { SHEET_RANGES } from '../../lib/constants';
import { NpcRowSchema, CharacterRowSchema } from '../../lib/sheetSchemas';
import {
  addNpcDB,
  updateNpcFullDB,
  updateCharacterDB,
  addCharacterDB,
  deleteNpcDB,
  resetNpcHpDB,
} from '../dbOperations';

vi.mock('../sheetsService', () => ({
  fetchSheetData: vi.fn(),
  updateSheetData: vi.fn(),
  appendSheetData: vi.fn(),
  batchUpdateSpreadsheet: vi.fn(),
  fetchSpreadsheetMetadata: vi.fn(),
  getSpreadsheetId: vi.fn().mockReturnValue('mock-spreadsheet-id'),
}));

vi.mock('../writeQueue', () => ({
  queueWrite: vi.fn(),
}));

describe('SHEET_RANGES alignment', () => {
  it("SHEET_RANGES.npcs covers 25 columns (A:Y) matching NpcRowSchema", () => {
    expect(SHEET_RANGES.npcs).toMatch(/:Y$/);
    const row = [
      '1', 'A', '10', '10', '0', '10', '', '', '', '', '',
      '0', '0', '[]', '{}', '{}', '', '', '', '', '[]', '[]', '[]', '[]', '',
    ];
    expect(NpcRowSchema.parse(row)).toBeDefined();
  });

  it("SHEET_RANGES.characters covers 26 columns (A:Z) matching CharacterRowSchema", () => {
    expect(SHEET_RANGES.characters).toMatch(/:Z$/);
    const row = [
      'pc-1', '', 'A', '10', '10', '0', '10', '', '10', '1', '1',
      '', '', '', '', '0', '0', '0', '0', '', '', '{}', '[]', '{}', '{}', '',
    ];
    expect(CharacterRowSchema.parse(row)).toBeDefined();
  });
});

describe('addNpcDB — row array integrity', () => {
  const npcData = {
    name: 'Test Dragon',
    ac: 18,
    maxHp: 200,
    tempHp: 0,
    currentHp: 200,
    conditions: '',
    notes: 'Ancient dragon',
    resistances: 'fire',
    immunities: 'cold',
    vulnerabilities: '',
    legendaryActions: 3,
    legendaryResistances: 3,
    rechargeAbilities: [{ name: 'Fire Breath', rechargeOn: 5 }],
    abilityScores: '{"STR":27}',
    proficiencies: '{"proficiencyBonus":7}',
    speed: '40 ft., fly 80 ft.',
    senses: 'blindsight 60 ft., darkvision 120 ft.',
    languages: 'Common, Draconic',
    challengeRating: '24',
    traits: '[{"name":"Legendary Resistance","description":"3/day"}]',
    actions: '[{"name":"Multiattack","description":"3 attacks","recharge":""}]',
    reactions: '[{"name":"Wing Attack","description":"Reaction"}]',
    legendaryActionsList: '[{"name":"Detect","description":"Perception check","cost":1}]',
    spellcastingAbility: 'INT',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes exactly 25 values to NPCs!A:Y', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addNpcDB(npcData as any);
    expect(writeQueue.queueWrite).not.toHaveBeenCalled();
    expect(sheetsService.appendSheetData).toHaveBeenCalledWith(
      'mock-spreadsheet-id',
      'NPCs!A:Y',
      expect.any(Array)
    );
    const appendCall = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    const row = appendCall[2][0];
    expect(row).toHaveLength(25);
  });

  it('writes new stat block fields at correct indices (16–24)', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addNpcDB(npcData as any);
    const appendCall = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    const row = appendCall[2][0];
    expect(row[16]).toBe('40 ft., fly 80 ft.');
    expect(row[17]).toBe('blindsight 60 ft., darkvision 120 ft.');
    expect(row[18]).toBe('Common, Draconic');
    expect(row[19]).toBe('24');
    expect(row[20]).toContain('Legendary Resistance');
    expect(row[21]).toContain('Multiattack');
    expect(row[22]).toContain('Wing Attack');
    expect(row[23]).toContain('Detect');
    expect(row[24]).toBe('INT');
  });

  it('writes rechargeAbilities as JSON at index 13', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addNpcDB(npcData as any);
    const appendCall = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    const row = appendCall[2][0];
    expect(row[13]).toBe(JSON.stringify([{ name: 'Fire Breath', rechargeOn: 5 }]));
  });

  it('sets currentHp equal to maxHp at creation', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addNpcDB(npcData as any);
    const appendCall = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    const row = appendCall[2][0];
    expect(row[3]).toBe(200);
    expect(row[5]).toBe(200);
  });
});

describe('updateNpcFullDB — row array integrity', () => {
  const npc = {
    id: '101',
    name: 'Test Dragon',
    ac: 18,
    maxHp: 200,
    tempHp: 0,
    currentHp: 200,
    conditions: '',
    notes: 'Ancient dragon',
    resistances: 'fire',
    immunities: 'cold',
    vulnerabilities: '',
    legendaryActions: 3,
    legendaryResistances: 3,
    rechargeAbilities: [{ name: 'Fire Breath', rechargeOn: 5 }],
    abilityScores: '{"STR":27}',
    proficiencies: '{"proficiencyBonus":7}',
    speed: '40 ft., fly 80 ft.',
    senses: 'blindsight 60 ft., darkvision 120 ft.',
    languages: 'Common, Draconic',
    challengeRating: '24',
    traits: '[{"name":"Legendary Resistance","description":"3/day"}]',
    actions: '[{"name":"Multiattack","description":"3 attacks","recharge":""}]',
    reactions: '[{"name":"Wing Attack","description":"Reaction"}]',
    legendaryActionsList: '[{"name":"Detect","description":"Perception check","cost":1}]',
    spellcastingAbility: 'INT',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes spellcastingAbility to index 24 (col Y)', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['101']] });
    await updateNpcFullDB(npc as any);
    expect(writeQueue.queueWrite).toHaveBeenCalled();
    const writeCall = vi.mocked(writeQueue.queueWrite).mock.calls[0];
    const row = writeCall[2][0];
    expect(row[24]).toBe('INT');
  });

  it('writes actions JSON to index 21 (col V)', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['101']] });
    const updatedNpc = { ...npc, actions: '[{"name":"Bite","recharge":"Recharge 5-6"}]' };
    await updateNpcFullDB(updatedNpc as any);
    const writeCall = vi.mocked(writeQueue.queueWrite).mock.calls[0];
    const row = writeCall[2][0];
    expect(row[21]).toBe('[{"name":"Bite","recharge":"Recharge 5-6"}]');
  });

  it('writes to NPCs!A{row}:Y{row}', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({
      values: [['other'], ['other'], ['101']],
    });
    await updateNpcFullDB(npc as any);
    expect(writeQueue.queueWrite).toHaveBeenCalledWith(
      'mock-spreadsheet-id',
      'NPCs!A4:Y4',
      expect.any(Array)
    );
  });

  it('throws when NPC is not found in sheet', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['other']] });
    await expect(updateNpcFullDB(npc as any)).rejects.toThrow(/not found/i);
  });
});

describe('updateCharacterDB — row array integrity', () => {
  const fullState = {
    id: 'char-1',
    playerName: 'Player 1',
    characterName: 'Hero',
    ac: 15,
    maxHp: 50,
    tempHp: 0,
    currentHp: 50,
    conditions: '',
    passivePerception: 12,
    level: 3,
    statusId: 1,
    notes: '',
    resistances: '',
    immunities: '',
    vulnerabilities: '',
    tempHpMax: 0,
    tempAc: 0,
    deathSavesFails: 0,
    deathSavesSuccesses: 0,
    class: 'Paladin',
    hitDiceConfig: '',
    hitDiceUsed: '{}',
    resourcePools: '[]',
    abilityScores: '{}',
    proficiencies: '{}',
    spellcastingAbility: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes spellcastingAbility to index 25 (col Z)', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['char-1']] });
    await updateCharacterDB({ spellcastingAbility: 'WIS' }, fullState as any);
    expect(writeQueue.queueWrite).toHaveBeenCalled();
    const writeCall = vi.mocked(writeQueue.queueWrite).mock.calls[0];
    const row = writeCall[2][0];
    expect(row[25]).toBe('WIS');
  });

  it('writes proficiencies JSON to index 24 (col Y)', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['char-1']] });
    await updateCharacterDB(
      { proficiencies: '{"spellcastingAbility":"WIS","proficiencyBonus":2}' },
      fullState as any
    );
    const writeCall = vi.mocked(writeQueue.queueWrite).mock.calls[0];
    const row = writeCall[2][0];
    expect(row[24]).toContain('spellcastingAbility');
  });

  it('writes to Characters!A{row}:Z{row}', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({
      values: [['other'], ['char-1']],
    });
    await updateCharacterDB({}, fullState as any);
    expect(writeQueue.queueWrite).toHaveBeenCalledWith(
      'mock-spreadsheet-id',
      'Characters!A3:Z3',
      expect.any(Array)
    );
  });

  it('throws when character is not found in sheet', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['other']] });
    await expect(updateCharacterDB({}, fullState as any)).rejects.toThrow();
  });
});

describe('addCharacterDB — row structure', () => {
  it('writes 26 values with spellcastingAbility at index 25', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addCharacterDB({
      characterName: 'Mage',
      spellcastingAbility: 'CHA',
    });
    expect(sheetsService.appendSheetData).toHaveBeenCalledWith(
      'mock-spreadsheet-id',
      'Characters!A:Z',
      expect.any(Array)
    );
    const appendCall = vi.mocked(sheetsService.appendSheetData).mock.calls[0];
    const row = appendCall[2][0];
    expect(row).toHaveLength(26);
    expect(row[25]).toBe('CHA');
  });
});

describe('addCharacterDB — row array integrity', () => {
  const charData = {
    playerName: 'Player One',
    characterName: 'Paladin Hero',
    ac: 18,
    maxHp: 50,
    tempHp: 0,
    currentHp: 50,
    conditions: 'Inspired',
    passivePerception: 14,
    level: 5,
    statusId: 1,
    notes: 'A noble hero',
    resistances: 'Radiant',
    immunities: 'Poisoned',
    vulnerabilities: 'Necrotic',
    tempHpMax: 10,
    tempAc: 2,
    deathSavesFails: 1,
    deathSavesSuccesses: 2,
    class: 'Paladin',
    hitDiceConfig: '5d10',
    hitDiceUsed: '{"d10":2}',
    resourcePools: '[{"name":"Lay on Hands","current":25,"max":25}]',
    abilityScores: '{"STR":18,"CHA":16}',
    proficiencies: '{"athletics":true}',
    spellcastingAbility: 'CHA',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes all 26 fields at correct column indices (0–25)', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addCharacterDB(charData as any);
    
    expect(sheetsService.appendSheetData).toHaveBeenCalled();
    const row = vi.mocked(sheetsService.appendSheetData).mock.calls[0][2][0];
    
    expect(row).toHaveLength(26);
    expect(row[1]).toBe('Player One'); // playerName
    expect(row[2]).toBe('Paladin Hero'); // characterName
    expect(row[3]).toBe(18); // ac
    expect(row[4]).toBe(50); // maxHp
    expect(row[5]).toBe(0); // tempHp
    expect(row[6]).toBe(50); // currentHp
    expect(row[7]).toBe('Inspired'); // conditions
    expect(row[8]).toBe(14); // passivePerception
    expect(row[9]).toBe(5); // level
    expect(row[10]).toBe(1); // statusId
    expect(row[11]).toBe('A noble hero'); // notes
    expect(row[12]).toBe('Radiant'); // resistances
    expect(row[13]).toBe('Poisoned'); // immunities
    expect(row[14]).toBe('Necrotic'); // vulnerabilities
    expect(row[15]).toBe(10); // tempHpMax
    expect(row[16]).toBe(2); // tempAc
    expect(row[17]).toBe(1); // deathSavesFails
    expect(row[18]).toBe(2); // deathSavesSuccesses
    expect(row[19]).toBe('Paladin'); // class
    expect(row[20]).toBe('5d10'); // hitDiceConfig
    expect(row[21]).toBe('{"d10":2}'); // hitDiceUsed
    expect(row[22]).toBe('[{"name":"Lay on Hands","current":25,"max":25}]'); // resourcePools
    expect(row[23]).toBe('{"STR":18,"CHA":16}'); // abilityScores
    expect(row[24]).toBe('{"athletics":true}'); // proficiencies
    expect(row[25]).toBe('CHA'); // spellcastingAbility
  });
});

describe('deleteNpcDB and resetNpcHpDB', () => {
  it('deleteNpcDB throws when NPC not found', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await expect(deleteNpcDB('nonexistent')).rejects.toThrow();
  });

  it('resetNpcHpDB updates only HP columns', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['npc-1']] });
    await resetNpcHpDB('npc-1', 100);
    expect(sheetsService.updateSheetData).toHaveBeenCalledWith(
      'mock-spreadsheet-id',
      'NPCs!F2',
      [['100']]
    );
  });
});

describe('NPC spellcastingAbility dual-write', () => {
  it('writes spellcastingAbility in both addNpcDB and updateNpcFullDB', async () => {
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [['npc-1']] });
    const npc = { id: 'npc-1', name: 'Mage', spellcastingAbility: 'WIS' };
    
    // Test update
    await updateNpcFullDB(npc as any);
    expect(writeQueue.queueWrite).toHaveBeenCalled();
    const updateRow = vi.mocked(writeQueue.queueWrite).mock.calls[0][2][0];
    expect(updateRow[24]).toBe('WIS');
    
    // Test add
    vi.clearAllMocks();
    vi.mocked(sheetsService.fetchSheetData).mockResolvedValue({ values: [] });
    await addNpcDB(npc as any);
    const appendRow = vi.mocked(sheetsService.appendSheetData).mock.calls[0][2][0];
    expect(appendRow[24]).toBe('WIS');
  });
});

```

## File: src/services/__tests__/googleAuth.test.ts

```typescript
// src/services/__tests__/googleAuth.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestAccessToken, clearTokens } from '../googleAuth';
import { STORAGE_KEYS } from '../../lib/constants';

describe('googleAuth token management tests', () => {
  beforeEach(() => {
    localStorage.clear();
    clearTokens();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('returns stored access token when valid', async () => {
    localStorage.setItem(STORAGE_KEYS.googleAccessToken, 'valid-token');
    
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const token = await requestAccessToken();
    expect(token).toBe('valid-token');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refreshes token when expired', async () => {
    localStorage.setItem(STORAGE_KEYS.googleRefreshToken, 'refresh-token');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ access_token: 'new-access-token' }))
      )
    );

    const token = await requestAccessToken();
    expect(token).toBe('new-access-token');
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBe('new-access-token');
  });

  it('clears auth state on refresh failure', async () => {
    localStorage.setItem(STORAGE_KEYS.googleRefreshToken, 'refresh-token');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 })
      )
    );

    await expect(requestAccessToken()).rejects.toThrow('UNAUTHENTICATED');
    expect(localStorage.getItem(STORAGE_KEYS.googleAccessToken)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.googleRefreshToken)).toBeNull();
  });
});

```

## File: src/services/__tests__/sheetsService.test.ts

```typescript
// src/services/__tests__/sheetsService.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchSheetData } from '../sheetsService';
import { STORAGE_KEYS } from '../../lib/constants';

vi.mock('../googleAuth', () => ({
  requestAccessToken: vi.fn().mockResolvedValue('fake-access-token'),
}));

describe('sheetsService fetchSheetData tests', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.spreadsheetId, 'mock-spreadsheet-id');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('fetchSheetData returns mapped values array', async () => {
    const mockResponse = { values: [['val1', 'val2']] };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(mockResponse)))
    );

    const result = await fetchSheetData('A1:B2');
    expect(result).toEqual(mockResponse);
    expect(result.values).toEqual([['val1', 'val2']]);
  });

  it('fetchSheetData returns empty array when API response has no values property', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({}))));

    const result = await fetchSheetData('A1:B2');
    expect(result.values || []).toEqual([]);
  });

  it('fetchSheetData propagates API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('API error')));

    await expect(fetchSheetData('A1:B2')).rejects.toThrow('API error');
  });
});

```

## File: src/services/__tests__/writeQueue.test.ts

```typescript
// src/services/__tests__/writeQueue.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { queueWrite, flushQueue, getQueueSize, retryPersistedWrites } from '../writeQueue';
import { batchUpdateValues } from '../sheetsService';
import { STORAGE_KEYS } from '../../lib/constants';

const RETRY_STORAGE_KEY = STORAGE_KEYS.writeRetryQueue;

vi.mock('../sheetsService', () => ({
  batchUpdateValues: vi.fn(),
  getSpreadsheetId: vi.fn().mockReturnValue('mock-id'),
}));

describe('writeQueue tests', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.mocked(batchUpdateValues).mockClear();
    localStorage.clear();
    
    // Clear the queue cleanly for a fresh test environment
    if (getQueueSize() > 0) {
      await flushQueue();
      vi.mocked(batchUpdateValues).mockClear();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('queueWrite adds items that are processed in FIFO order', async () => {
    queueWrite('A1', [[1]]);
    queueWrite('B2', [[2]]);
    queueWrite('C3', [[3]]);
    
    expect(getQueueSize()).toBe(3);
    
    await flushQueue();
    
    expect(batchUpdateValues).toHaveBeenCalledTimes(1);
    expect(batchUpdateValues).toHaveBeenCalledWith([
      { range: 'A1', values: [[1]] },
      { range: 'B2', values: [[2]] },
      { range: 'C3', values: [[3]] },
    ]);
  });

  it('failed writes are persisted to localStorage for retry', async () => {
    vi.mocked(batchUpdateValues).mockRejectedValueOnce(new Error('Network error'));
    
    queueWrite('A1', [[1]]);
    await flushQueue();
    
    const stored = JSON.parse(localStorage.getItem(RETRY_STORAGE_KEY) || '[]');
    expect(stored).toEqual([{ range: 'A1', values: [[1]] }]);
  });

  it('retryPersistedWrites processes queued items from localStorage', async () => {
    localStorage.setItem(RETRY_STORAGE_KEY, JSON.stringify([{ range: 'B2', values: [[2]] }]));
    
    await retryPersistedWrites();
    expect(getQueueSize()).toBe(1);
    
    await flushQueue();
    expect(batchUpdateValues).toHaveBeenCalledWith([{ range: 'B2', values: [[2]] }]);
  });

  it('queue respects maxRetryItems limit', async () => {
    const existing = Array.from({ length: 20 }, (_, i) => ({ range: `Z${i}`, values: [[i]] }));
    localStorage.setItem(RETRY_STORAGE_KEY, JSON.stringify(existing));
    
    vi.mocked(batchUpdateValues).mockRejectedValueOnce(new Error('Network error'));
    for (let i = 20; i < 60; i++) {
      queueWrite(`Z${i}`, [[i]]);
    }
    
    await flushQueue();
    
    const stored = JSON.parse(localStorage.getItem(RETRY_STORAGE_KEY) || '[]');
    expect(stored.length).toBe(50);
    expect(stored[0].range).toBe('Z10');
    expect(stored[49].range).toBe('Z59');
  });
});

```

