const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const files = [];
walkDir('./src', (p) => files.push(p));

const tsFiles = files.filter(f => (f.endsWith('.ts') || f.endsWith('.tsx')));
const nonTestFiles = tsFiles.filter(f => !f.includes('__tests__'));
const testFiles = tsFiles.filter(f => f.includes('__tests__'));

const noTests = [];
nonTestFiles.forEach(f => {
    const base = path.basename(f);
    const testFile = base.replace('.tsx', '.test.tsx').replace('.ts', '.test.ts');
    
    // Check if test file exists in testFiles
    const hasTest = testFiles.some(t => {
      const tBase = path.basename(t);
      if (tBase === testFile) return true;
      if (base === 'index.tsx' && tBase === 'index.test.tsx') return true;
      return false;
    });
    
    if (!hasTest && !f.includes('types.ts') && !f.includes('constants.ts') && !f.includes('index.ts') && !f.includes('vite') && !f.endsWith('.d.ts')) {
        noTests.push(`[NO TEST] ${f}`);
    }
});
noTests.forEach(n => console.log(n));
