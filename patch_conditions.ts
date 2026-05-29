import fs from 'fs';
let content = fs.readFileSync('src/lib/conditionDefinitions.ts', 'utf8');

content = content.replace(/export interface ConditionMechanics \{([\s\S]+?)\}/, (match, p1) => {
    return 'export interface ConditionMechanics {' + p1 + '  tempAcModifier: number;\n}';
});

content = content.replace(/removedByLongRest: (true|false)(?!,)/g, "removedByLongRest: $1,\n    tempAcModifier: 0");

// set tempAcModifier: 2 on hasted
content = content.replace(/hasted: \{([\s\S]+?)tempAcModifier: 0/g, 'hasted: {$1tempAcModifier: 2');

// Add slowed
content = content.replace(/hasted: \{([\s\S]+?)\},/, `hasted: {$1},
  slowed: {
    speedZero: false, speedHalved: true, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    removedByLongRest: true,
    tempAcModifier: -2
  },`);

fs.writeFileSync('src/lib/conditionDefinitions.ts', content);
