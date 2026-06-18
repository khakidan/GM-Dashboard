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
const testFiles = tsFiles.filter(f => f.includes('__tests__'));

const sizeMap = nonTestFiles.map(f => {
    return {
        file: f,
        lines: fs.readFileSync(f, 'utf8').split('\n').length
    }
});

sizeMap.sort((a,b) => b.lines - a.lines);

console.log("SECTION 1: SIZES");
sizeMap.forEach(s => {
    if (s.lines >= 200) {
        console.log(`${s.file} | ${s.lines} | ${s.lines >= 500 ? '[CRITICAL]' : '[LARGE]'}`);
    }
});
const okCount = sizeMap.filter(s => s.lines < 200).length;
console.log(`[OK] files under 200 lines: ${okCount}`);

// SECTION 3: IMPORT HYGIENE
console.log("\\nSECTION 3: BARREL IMPORTS");
nonTestFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    if (/from.*(irvOptions|conditionDefinitions)/.test(content)) {
        console.log(`Violation in ${f}`);
    }
});

// SECTION 4: TS QUALITY
console.log("\\nSECTION 4: ANY ANNOTATIONS");
tsFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const matchesAny = content.match(/(: any\\b|as any\\b)/g);
    if (matchesAny) {
        console.log(`${f} has ${matchesAny.length} any uses`);
    }
    const matchesNonNull = content.match(/\\w!\\./g);
    if (matchesNonNull) {
        console.log(`${f} has ${matchesNonNull.length} non-null assertions`);
    }
    const matchesAssertion = content.match(/ as [A-Z]/g);
    if (matchesAssertion) {
        console.log(`${f} has ${matchesAssertion.length} type assertions (as SomeType)`);
    }
});

// SECTION 5: DEAD CODE
console.log("\\nSECTION 5: DEAD CODE");
tsFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const logMatch = content.match(/console\\.log/g);
    if (logMatch) {
       console.log(`${f} has ${logMatch.length} console.log`);
    }
    const todoMatch = content.match(/TODO|FIXME/g);
    if (todoMatch) {
        console.log(`${f} has ${todoMatch.length} TODOS/FIXMES`);
    }
});

// SECTION 6: ARCH CHECK
console.log("\\nSECTION 6: ARCH CHECK");
const libFiles = nonTestFiles.filter(f => f.startsWith('src/lib/'));
libFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('from \'../hooks') || content.includes('from \'../components')) {
        console.log(`Arch rule broken in ${f}`);
    }
});

// SECTION 7: TESTS
console.log("\\nSECTION 7: TESTS");
nonTestFiles.forEach(f => {
    const base = path.basename(f);
    const hasTest = testFiles.some(t => path.basename(t) === base.replace('.tsx', '.test.tsx').replace('.ts', '.test.ts') || path.basename(t) === base.replace('.tsx', '.test.tsx').replace('.ts', '.test.ts').replace('index.', ''));
    if (!hasTest && !f.includes('types.ts') && !f.includes('constants.ts') && !f.includes('index.ts')) {
        // we won't log everything, just a sample
        // console.log(`[NO TEST] ${f}`);
    }
});
