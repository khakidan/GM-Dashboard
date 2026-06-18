import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (path: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const files: string[] = [];
walkDir('./src', (p) => files.push(p));

const tsFiles = files.filter(f => (f.endsWith('.ts') || f.endsWith('.tsx')));
const nonTestFiles = tsFiles.filter(f => !f.includes('__tests__'));
const testFiles = tsFiles.filter(f => f.includes('__tests__'));

const noTests: string[] = [];
const orphaned: string[] = [];
const misplaced: string[] = [];

nonTestFiles.forEach(f => {
    const base = path.basename(f);
    let testFile = base;
    if (base.endsWith('.tsx')) {
        testFile = base.replace('.tsx', '.test.tsx');
    } else if (base.endsWith('.ts')) {
        testFile = base.replace('.ts', '.test.ts');
    }
    
    // Check if test file exists in testFiles
    const hasTest = testFiles.some(t => {
      const tBase = path.basename(t);
      if (tBase === testFile) return true;
      if (base === 'index.tsx' && tBase === 'index.test.tsx') return true;
      return false;
    });
    
    if (!hasTest && !f.includes('types.ts') && !f.includes('constants.ts') && !f.includes('index.ts') && !f.includes('vite') && !f.endsWith('.d.ts') && !f.includes('main.tsx') && !f.includes('App.tsx') && !f.includes('ThemeContext')) {
        noTests.push(`[NO TEST] ${f}`);
    }
});

// Check orphaned test files (tests that don't have a source file)
testFiles.forEach(t => {
    const base = path.basename(t);
    if (base.includes('.test.')) {
        let sourceBase = base;
        if (base.endsWith('.test.tsx')) sourceBase = base.replace('.test.tsx', '.tsx');
        else if (base.endsWith('.test.ts')) sourceBase = base.replace('.test.ts', '.ts');
        
        const hasSource = nonTestFiles.some(f => path.basename(f) === sourceBase || (sourceBase === 'index.tsx' && f.endsWith('index.tsx')));
        // allow testing of index
        if (!hasSource && !t.includes('suiteIntegrity') && !t.includes('dashboardStore') && !t.includes('useEncounterLifecycle') && !t.includes('useCombatantCard') && !t.includes('NpcCardSubcomponents') && !t.includes('KeyboardShortcuts') && !t.includes('AddNpcCollision') && !t.includes('SettingsModal') && !t.includes('conditions.barrel') && !t.includes('health')) {
             orphaned.push(`[ORPHANED] ${t}`);
        }
    }
});

// Check misplaced test files
// Test files should be in __tests__ subdirectory within the same parent folder as the source file.
testFiles.forEach(t => {
    if (!t.includes('__tests__')) {
        misplaced.push(`[MISPLACED] ${t}`);
    }
});

noTests.forEach(n => console.log(n));
orphaned.forEach(o => console.log(o));
misplaced.forEach(m => console.log(m));
