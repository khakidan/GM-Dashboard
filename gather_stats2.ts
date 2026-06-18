import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (path: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const files: string[] = [];
walkDir('./src', (p) => files.push(p));

const tsFiles = files.filter(f => (f.endsWith('.ts') || f.endsWith('.tsx')));
const nonTestFiles = tsFiles.filter(f => !f.includes('__tests__'));

console.log("=== SECTION 3: IMPORT HYGIENE ===");
const unused = [];
const duplicate = [];
const barrelViolations = [];

tsFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    
    // Quick regex trick to find imports block and duplicates
    const importRegex = /^import\s+.*?\s+from\s+['"](.*?)['"];?/gm;
    let match;
    const importedModules = [];
    while ((match = importRegex.exec(content)) !== null) {
        if (importedModules.includes(match[1])) {
            if (!f.includes('types.ts')) duplicate.push(`Duplicate module ${match[1]} in ${f}`);
        }
        importedModules.push(match[1]);
        
        // Barrel violation
        if ((match[1].includes('irvOptions') || match[1].includes('conditionDefinitions')) && !f.includes('src/lib/conditions/index.ts')) {
             if (f !== 'src/lib/conditions/index.ts') barrelViolations.push(`${f} imports directly from ${match[1]}`);
        }
    }
    
    // Find named imports and check if used (very naive, doesn't handle all destructuring aliasing but catches basic)
    const namedImportRegex = /^import\s+\{([^}]+)\}\s+from\s+['"](.*?)['"];?/gm;
    let namedMatch;
    while ((namedMatch = namedImportRegex.exec(content)) !== null) {
        const parts = namedMatch[1].split(',').map(s => s.trim().split(' as ')[0]);
        for (const p of parts) {
            if (!p) continue;
            // Check if string `p` occurs outside the import area
            // Remove imports from content
            const codeBody = content.replace(/^import[\s\S]*?from[\s\S]*?;/gm, '');
            const usageRegex = new RegExp(`\\b${p}\\b`, 'g');
            if (!usageRegex.test(codeBody)) {
                unused.push(`Unused import ${p} in ${f}`);
            }
        }
    }
});
// console.log("Unused Imports:");
// unused.forEach(u => console.log(u)); // Too noisy if imprecise. We will report it if it's very obvious or just summarize.
console.log("\nDuplicate Imports:");
duplicate.forEach(d => console.log(d));
console.log("\nBarrel Violations:");
barrelViolations.forEach(b => console.log(b));

console.log("\n=== SECTION 4: TYPESCRIPT QUALITY ===");
const anyViolations = [];
const nonNullRisky = [];
const bypassCasts = [];
tsFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (line.match(/:\s*any\b/) || line.match(/as\s+any\b/)) {
            let status = line.includes('error') || line.includes('e: any') || line.includes('err: any') ? "JUSTIFIED (Error catching)" : "REPLACEABLE";
            if (line.includes('eslint') || line.includes('ignore')) status = "JUSTIFIED (Ignored)";
            if (f.includes('.test.')) status = "JUSTIFIED (Mock/Test boundary)";
             anyViolations.push(`${f}:${i+1} ${status} -> ${line.trim()}`);
        }
        if (line.match(/\b\w+!\./) && !f.includes('.test.')) {
            nonNullRisky.push(`${f}:${i+1} -> ${line.trim()}`);
        }
        
        // Match "as Something" but not "as unknown", "as const", "as string|number", "as HTMLElement" 
        if (line.match(/ as [A-Z]\w+/) && !f.includes('.test.') && !line.includes('as unknown') && !line.includes('as HTML') && !line.includes('as File')) {
            bypassCasts.push(`${f}:${i+1} -> ${line.trim()}`);
        }
    });
});
console.log("Explicit 'any':");
anyViolations.forEach(a => console.log(a));
console.log("\nNon-null assertions (!):");
nonNullRisky.forEach(n => console.log(n));
console.log("\nType bypasses (as SomeType):");
bypassCasts.forEach(b => console.log(b));

console.log("\n=== SECTION 5: DEAD CODE ===");
const logs = [];
const todos = [];
const emptyFiles = [];
tsFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    let inCatch = false;
    lines.forEach((line, i) => {
        if (line.includes('catch (')) inCatch = true;
        if (line.includes('console.log') && !inCatch && !f.includes('.test.')) {
            logs.push(`${f}:${i+1} -> ${line.trim()}`);
        }
        if (line.match(/\}\s*$/)) inCatch = false; // crude
        
        if (line.includes('TODO') || line.includes('FIXME')) {
            todos.push(`${f}:${i+1} -> ${line.trim()}`);
            if (todos.length > 50) return; // avoid flood
        }
    });
    
    // empty or near empty artifacts
    const realLines = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;
    if (realLines < 5 && !f.includes('types.ts') && !f.includes('index.ts') && !f.includes('barrel') && !f.endsWith('.css') && !f.includes('vite-env.d.ts')) {
        emptyFiles.push(f);
    }
});
console.log("console.log outside catch:");
logs.forEach(l => console.log(l));
console.log("\nTODO/FIXME:");
todos.forEach(t => console.log(t));
console.log("\nEmpty/Artifact files:");
emptyFiles.forEach(e => console.log(e));

console.log("\n=== SECTION 6: ARCHITECTURE ===");
const archViolations = [];
nonTestFiles.filter(f => f.includes('src/lib/')).forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    if ((content.includes('../hooks') || content.includes('../components') || content.includes('src/components'))&& !f.includes('use')) {
        archViolations.push(`lib/ importing upper layer: ${f}`);
    }
});
console.log("Dependency Direction Violations:");
archViolations.forEach(a => console.log(a));

// Overlay events check
console.log("\nDirect updateState overlay violations:");
let overlayViolations = 0;
tsFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    if (content.match(/updateState\(\{\\s*event:/)) {
       console.log(`Violation in ${f}`);
       overlayViolations++;
    }
});
if (overlayViolations === 0) console.log("None.");

// Check useParty sheet whitelist
try {
  const usePartyContent = fs.readFileSync('./src/components/PartyTab/hooks/useParty.ts', 'utf8') || '';
  const matchWhitelist = usePartyContent.match(/const permittedKeys\s*=\s*\[(.*?)\];/s);
  if (matchWhitelist) {
      console.log("\nuseParty.ts handles fields:", matchWhitelist[1].replace(/[\'\"\n\s]+/g, ' '));
  }
} catch(e) {}

const regexConstants = /(setTimeout|setInterval)\([^,]+,\s*\d{3,}\)/g;
let timingViolations = 0;
console.log("\nRaw timing literals:");
tsFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    if (!f.includes('.test.') && !f.includes('useAudioEngine.ts') && !f.includes('vite') && !f.includes('constants.ts')) {
        let match;
        while ((match = regexConstants.exec(content)) !== null) {
            console.log(`Violation in ${f}: ${match[0]}`);
            timingViolations++;
        }
    }
});
if(timingViolations === 0) console.log("None.");

console.log("\nRaw localStorage strings:");
const regexStorage = /localStorage\.(getItem|setItem)\(['"]\w+['"]/g;
let storageViolations = 0;
tsFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    if (!f.includes('.test.') && !f.includes('useAudioEngine.ts') && !f.includes('constants.ts') && !f.includes('AuthRelay')) {
         let match;
         while ((match = regexStorage.exec(content)) !== null) {
             console.log(`Violation in ${f}: ${match[0]}`);
             storageViolations++;
         }
    }
});
if(storageViolations === 0) console.log("None.");

console.log("\n=== SECTION 7: TEST CONFIG ===");
const noTests = [];
nonTestFiles.forEach(f => {
    const base = path.basename(f);
    const testFile = base.replace('.tsx', '.test.tsx').replace('.ts', '.test.ts');
    
    const hasTest = testFiles.some(t => path.basename(t) === testFile || path.basename(t) === 'index.test.tsx' && base === 'index.tsx');
    if (!hasTest && !f.includes('types.ts') && !f.includes('constants.ts') && !f.includes('index.ts')) {
        noTests.push(`[NO TEST] ${f}`);
    }
});
noTests.forEach(n => console.log(n));

