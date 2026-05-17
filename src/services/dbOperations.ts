import { getSpreadsheetId, fetchSheetData, batchUpdateSpreadsheet, appendSheetData, fetchSpreadsheetMetadata } from './sheetsService';
import { Character, Encounter, NPC, EncounterCombatant } from '../types';

function castInt(val: any, fallback: number = 0): number {
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
}

function sanitizeString(val: any): string {
  if (!val) return '';
  return String(val).trim();
}

async function getNextId(sheetName: string, idColumnIndex: number = 0): Promise<number> {
  try {
    const data = await fetchSheetData(`${sheetName}!A2:Z`);
    const rows = data.values || [];
    let maxId = 0;
    for (const row of rows) {
      if (row[idColumnIndex]) {
        const idVal = row[idColumnIndex].toString().replace(/\D/g, '');
        const idNum = castInt(idVal);
        if (idNum > maxId) maxId = idNum;
      }
    }
    return maxId + 1;
  } catch (e) {
    return 1;
  }
}

async function findRowIndexById(sheetName: string, idVal: string, idColumnIndex: number = 0): Promise<number | null> {
  const data = await fetchSheetData(`${sheetName}!A2:Z`);
  const rows = data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] && rows[i][idColumnIndex] && String(rows[i][idColumnIndex]).trim() === String(idVal).trim()) {
      return i + 1; 
    }
  }
  return null;
}

async function getSheetIds() {
  const metadata = await fetchSpreadsheetMetadata();
  const res: Record<string, number> = {};
  metadata.sheets.forEach((s: any) => {
    res[s.properties.title] = s.properties.sheetId;
  });
  return res;
}

export async function deleteCharacterFully(playerId: string) {
   const ids = await getSheetIds();
   const charRowIdx = await findRowIndexById('Characters', playerId);
   if (charRowIdx === null) return;

   const requests: any[] = [];
   
   requests.push({
     deleteDimension: {
       range: {
         sheetId: ids['Characters'],
         dimension: "ROWS",
         startIndex: charRowIdx,
         endIndex: charRowIdx + 1
       }
     }
   });

   const ecData = await fetchSheetData('Encounter_Combatants!A2:Z');
   const ecRows = ecData.values || [];
   const ecToDelete: number[] = [];
   for (let i = 0; i < ecRows.length; i++) {
       if (ecRows[i] && String(ecRows[i][2]).trim() === String(playerId).trim()) {
           ecToDelete.push(i + 1); 
       }
   }

   ecToDelete.sort((a, b) => b - a).forEach(idx => {
       requests.push({
           deleteDimension: {
             range: {
               sheetId: ids['Encounter_Combatants'],
               dimension: "ROWS",
               startIndex: idx,
               endIndex: idx + 1
             }
           }
       });
   });

   if (requests.length > 0) {
     await batchUpdateSpreadsheet(requests);
   }
}

export async function deleteEncounterFully(encounterId: string) {
   const ids = await getSheetIds();
   const encRowIdx = await findRowIndexById('Encounters', encounterId);
   if (encRowIdx === null) return;

   const requests: any[] = [];
   
   requests.push({
     deleteDimension: {
       range: {
         sheetId: ids['Encounters'],
         dimension: "ROWS",
         startIndex: encRowIdx,
         endIndex: encRowIdx + 1
       }
     }
   });

   const ecData = await fetchSheetData('Encounter_Combatants!A2:Z');
   const ecRows = ecData.values || [];
   const ecToDelete: number[] = [];
   for (let i = 0; i < ecRows.length; i++) {
       if (ecRows[i] && String(ecRows[i][1]).trim() === String(encounterId).trim()) { // Encounter_ID is column B
           ecToDelete.push(i + 1); 
       }
   }

   ecToDelete.sort((a, b) => b - a).forEach(idx => {
       requests.push({
           deleteDimension: {
             range: {
               sheetId: ids['Encounter_Combatants'],
               dimension: "ROWS",
               startIndex: idx,
               endIndex: idx + 1
             }
           }
       });
   });

   if (requests.length > 0) {
     await batchUpdateSpreadsheet(requests);
   }
}

export async function addCharacterDB(character: Partial<Character>) {
   const nextIdVal = await getNextId('Characters');
   const finalId = `pc-${nextIdVal}`; 
   
   const rowData = [
     finalId,
     sanitizeString(character.playerName),
     sanitizeString(character.characterName),
     castInt(character.ac, 10),
     castInt(character.maxHp, 10),
     castInt(character.tempHp, 0),
     castInt(character.currentHp, 10),
     sanitizeString(character.conditions),
     castInt(character.passivePerception, 10),
     castInt(character.level, 1),
     castInt(character.statusId, 1),
     sanitizeString(character.notes)
   ];

   await appendSheetData('Characters!A:L', [rowData]);
   return { ...character, id: finalId };
}

export async function updateCharacterDB(character: Partial<Character>, fullState: Character) {
   const charRowIdx = await findRowIndexById('Characters', fullState.id);
   if (charRowIdx === null) {
       throw new Error("Character not found");
   }
   
   const rowData = [
      fullState.id,
      sanitizeString(character.playerName ?? fullState.playerName),
      sanitizeString(character.characterName ?? fullState.characterName),
      castInt(character.ac ?? fullState.ac),
      castInt(character.maxHp ?? fullState.maxHp),
      castInt(character.tempHp ?? fullState.tempHp, 0),
      castInt(character.currentHp ?? fullState.currentHp),
      sanitizeString(character.conditions ?? fullState.conditions),
      castInt(character.passivePerception ?? fullState.passivePerception),
      castInt(character.level ?? fullState.level),
      castInt(character.statusId ?? fullState.statusId),
      sanitizeString(character.notes ?? fullState.notes)
   ];

   const a1Row = charRowIdx + 1;
   const { updateSheetData } = await import('./sheetsService');
   await updateSheetData(`Characters!A${a1Row}:L${a1Row}`, [rowData]);
}

export async function addNpcDB(npcName: string, npcHp: number, npcAc: number, npcNotes: string) {
   const nextIdVal = await getNextId('NPCs');
   const finalId = nextIdVal.toString(); 

   const rowData = [
       finalId,
       sanitizeString(npcName),
       castInt(npcAc, 10),
       castInt(npcHp, 1),
       0, // Temp HP
       castInt(npcHp, 1), // Current HP
       '', // Condition
       sanitizeString(npcNotes)
   ];

   await appendSheetData('NPCs!A:H', [rowData]);
   return { id: finalId, name: npcName, maxHp: npcHp, ac: npcAc, notes: npcNotes };
}

export async function updateNpcDB(npcId: string, currentHp: number, tempHp: number, conditions: string) {
    const rowIdx = await findRowIndexById('NPCs', npcId);
    if (rowIdx === null) {
        throw new Error(`NPC ${npcId} not found`);
    }
    const a1Row = rowIdx + 1;
    // Let's assume we just update specific columns for HP etc.
    // In NPCs: Column E=TempHP, F=CurrentHP, G=Conditions
    const { updateSheetData } = await import('./sheetsService');
    await updateSheetData(`NPCs!E${a1Row}:G${a1Row}`, [[tempHp.toString(), currentHp.toString(), conditions]]);
}

export async function addEncounterCombatantDB(encounterId: string, playerId: string | null, npcId: string | null, quantity: number) {
    const nextIdVal = await getNextId('Encounter_Combatants');
    const finalId = nextIdVal.toString();
    
    const rowData = [
        finalId,
        encounterId,
        playerId || '',
        npcId || '',
        castInt(quantity, 1)
    ];

    await appendSheetData('Encounter_Combatants!A:E', [rowData]);
    return { id: finalId };
}

export async function updateEncounterCombatantQuantityDB(ecId: string, newQty: number) {
    const rowIdx = await findRowIndexById('Encounter_Combatants', ecId);
    if (rowIdx === null) {
        throw new Error(`Encounter Combatant ${ecId} not found`);
    }
    const a1Row = rowIdx + 1;
    const { updateSheetData } = await import('./sheetsService');
    await updateSheetData(`Encounter_Combatants!E${a1Row}`, [[newQty.toString()]]);
}

export async function deleteEncounterCombatantDB(ecId: string) {
    const ids = await getSheetIds();
    const rowIdx = await findRowIndexById('Encounter_Combatants', ecId);
    if (rowIdx === null) return;
    
    await batchUpdateSpreadsheet([{
        deleteDimension: {
            range: {
                sheetId: ids['Encounter_Combatants'],
                dimension: "ROWS",
                startIndex: rowIdx,
                endIndex: rowIdx + 1
            }
        }
    }]);
}

export async function addEncounterDB(name: string, location: string, difficultyId: number, numberOfNpcs: number = 0) {
    const nextIdVal = await getNextId('Encounters');
    const finalId = nextIdVal.toString();
    
    const rowData = [
        finalId,
        sanitizeString(name),
        sanitizeString(location),
        difficultyId,
        numberOfNpcs
    ];

    await appendSheetData('Encounters!A:E', [rowData]);
    return { id: finalId, name, location, difficultyId, numberOfNpcs };
}

export async function updateEncounterDB(encounterId: string, name: string, location: string, difficultyId: number) {
    const rowIdx = await findRowIndexById('Encounters', encounterId);
    if (rowIdx === null) {
        throw new Error(`Encounter ${encounterId} not found`);
    }
    const a1Row = rowIdx + 1;
    const { updateSheetData } = await import('./sheetsService');
    await updateSheetData(`Encounters!B${a1Row}:D${a1Row}`, [[
        sanitizeString(name),
        sanitizeString(location),
        difficultyId.toString()
    ]]);
}

export async function syncAndSanitizeDatabase() {
    const ids = await getSheetIds();
    const sheets = ['Characters', 'Status', 'Encounters', 'Difficulty_Level', 'NPCs', 'Encounter_Combatants'];
    
    const requests: any[] = [];
    
    for (const sheet of sheets) {
        if (!ids[sheet]) continue;
        const data = await fetchSheetData(`${sheet}!A2:Z`).catch(() => null);
        if (!data || !data.values) continue;
        
        // Search backwards to delete rows without messing up indexes
        for (let i = data.values.length - 1; i >= 0; i--) {
            const row = data.values[i];
            const hasData = row && row.some((cell: any) => cell && String(cell).trim() !== '');
            if (!hasData) {
                requests.push({
                    deleteDimension: {
                        range: {
                            sheetId: ids[sheet],
                            dimension: "ROWS",
                            startIndex: i + 1, // 0-indexed API + 1 for header row
                            endIndex: i + 2
                        }
                    }
                });
            }
        }
    }
    
    if (requests.length > 0) {
        await batchUpdateSpreadsheet(requests);
    }
    
    return requests.length;
}
