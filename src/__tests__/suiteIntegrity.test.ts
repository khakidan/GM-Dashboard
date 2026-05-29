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
