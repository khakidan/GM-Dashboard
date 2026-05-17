const fs = require('fs');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const replacement = `
        const _e = typeof err !== "undefined" ? err : typeof e !== "undefined" ? e : null;
        if (_e && (_e.message === "UNAUTHENTICATED" || _e.error === "UNAUTHENTICATED")) {
          alert("Your session has expired. Please sign in again.");
          window.location.reload();
        } else {
          alert("Failed to sync updates—retrying...");
        }`;
        
  content = content.replace(/alert\("Failed to sync updates—retrying..."\);/g, replacement.trim());
  
  fs.writeFileSync(filePath, content, 'utf8');
}

processFile('./src/components/ActiveEncounterTab.tsx');
processFile('./src/components/EncountersTab.tsx');
