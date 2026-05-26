// src/services/dbOperations.ts

import { getSpreadsheetId, fetchSheetData, updateSheetData, batchUpdateSpreadsheet, appendSheetData, fetchSpreadsheetMetadata } from './sheetsService';
import { Character, Encounter, NPC, EncounterCombatant } from '../types';

export function castInt(val: any, fallback: number = 0): number {
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
}

export function sanitizeString(val: any): string {
  if (!val) return '';
  return String(val).trim();
}

export async function getNextId(sheetName: string, idColumnIndex: number = 0): Promise<number> {
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

async function findRowIndexById(
  sheetName: string,
  idVal: string,
  idColumnIndex: number = 0
): Promise<number | null> {
  const data = await fetchSheetData(`${sheetName}!A2:Z`);
  const rows = data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (
      rows[i] &&
      rows[i][idColumnIndex] &&
      String(rows[i][idColumnIndex]).trim() === String(idVal).trim()
    ) {
      return i + 1;
    }
  }
  return null;
}

async function getSheetIds(): Promise<Record<string, number>> {
  const metadata = await fetchSpreadsheetMetadata();
  const res: Record<string, number> = {};
  metadata.sheets.forEach((s: any) => {
    res[s.properties.title] = s.properties.sheetId;
  });
  return res;
}

// ✅ Shared helper — consolidates the duplicated logic from deleteCharacterFully
// and deleteEncounterFully. Both functions delete one row from a primary sheet
// and then cascade-delete matching rows from Encounter_Combatants.
//
// primarySheet     — e.g. 'Characters' or 'Encounters'
// primaryId        — the ID value to find and delete
// ecColumnIndex    — which column in Encounter_Combatants holds the foreign key
//                    (1 = Encounter_ID, 2 = Player_ID)
// ids              — sheet name → numeric sheetId map (from getSheetIds)
async function buildCascadeDeleteRequests(
  primarySheet: string,
  primaryId: string,
  ecColumnIndex: number,
  ids: Record<string, number>
): Promise<any[] | null> {
  const rowIdx = await findRowIndexById(primarySheet, primaryId);
  if (rowIdx === null) return null;

  const requests: any[] = [
    {
      deleteDimension: {
        range: {
          sheetId: ids[primarySheet],
          dimension: 'ROWS',
          startIndex: rowIdx,
          endIndex: rowIdx + 1,
        },
      },
    },
  ];

  const ecData = await fetchSheetData('Encounter_Combatants!A2:Z');
  const ecRows = ecData.values || [];

  // Collect matching row indices in reverse order so deletions don't shift
  // the indices of rows we haven't deleted yet.
  const toDelete = ecRows
    .map((row: any[], i: number) => ({ row, i }))
    .filter(
      ({ row }: { row: any[] }) =>
        row && String(row[ecColumnIndex]).trim() === String(primaryId).trim()
    )
    .map(({ i }: { i: number }) => i + 1)
    .sort((a: number, b: number) => b - a);

  toDelete.forEach((idx: number) => {
    requests.push({
      deleteDimension: {
        range: {
          sheetId: ids['Encounter_Combatants'],
          dimension: 'ROWS',
          startIndex: idx,
          endIndex: idx + 1,
        },
      },
    });
  });

  return requests;
}

export async function deleteCharacterFully(playerId: string) {
  const ids = await getSheetIds();
  // Player_ID is column index 2 in Encounter_Combatants
  const requests = await buildCascadeDeleteRequests('Characters', playerId, 2, ids);
  if (requests && requests.length > 0) {
    await batchUpdateSpreadsheet(requests);
  }
}

export async function deleteEncounterFully(encounterId: string) {
  const ids = await getSheetIds();
  // Encounter_ID is column index 1 in Encounter_Combatants
  const requests = await buildCascadeDeleteRequests('Encounters', encounterId, 1, ids);
  if (requests && requests.length > 0) {
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
    sanitizeString(character.notes),
  ];

  await appendSheetData('Characters!A:L', [rowData]);
  return { ...character, id: finalId };
}

export async function updateCharacterDB(
  character: Partial<Character>,
  fullState: Character
) {
  const charRowIdx = await findRowIndexById('Characters', fullState.id);
  if (charRowIdx === null) {
    throw new Error('Character not found');
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
    sanitizeString(character.notes ?? fullState.notes),
  ];

  const a1Row = charRowIdx + 1;
  // ✅ updateSheetData is now a static import — no dynamic import needed
  await updateSheetData(`Characters!A${a1Row}:L${a1Row}`, [rowData]);
}

export async function addNpcDB(
  npcName: string,
  npcHp: number,
  npcAc: number,
  npcNotes: string
) {
  const nextIdVal = await getNextId('NPCs');
  const finalId = nextIdVal.toString();

  const rowData = [
    finalId,
    sanitizeString(npcName),
    castInt(npcAc, 10),
    castInt(npcHp, 1),
    0,                  // Temp HP
    castInt(npcHp, 1),  // Current HP (starts at max)
    '',                 // Condition
    sanitizeString(npcNotes),
  ];

  await appendSheetData('NPCs!A:H', [rowData]);
  return { id: finalId, name: npcName, maxHp: npcHp, ac: npcAc, notes: npcNotes };
}

export async function updateNpcDB(
  npcId: string,
  currentHp: number,
  tempHp: number,
  conditions: string
) {
  const rowIdx = await findRowIndexById('NPCs', npcId);
  if (rowIdx === null) {
    throw new Error(`NPC ${npcId} not found`);
  }
  const a1Row = rowIdx + 1;
  // NPCs sheet: Column E = TempHP, F = CurrentHP, G = Conditions
  // ✅ updateSheetData is now a static import — no dynamic import needed
  await updateSheetData(`NPCs!E${a1Row}:G${a1Row}`, [
    [tempHp.toString(), currentHp.toString(), conditions],
  ]);
}

export async function addEncounterCombatantDB(
  encounterId: string,
  playerId: string | null,
  npcId: string | null,
  quantity: number
) {
  const nextIdVal = await getNextId('Encounter_Combatants');
  const finalId = nextIdVal.toString();

  const rowData = [
    finalId,
    encounterId,
    playerId || '',
    npcId || '',
    castInt(quantity, 1),
  ];

  await appendSheetData('Encounter_Combatants!A:E', [rowData]);
  return { id: finalId };
}

export async function updateEncounterCombatantQuantityDB(
  ecId: string,
  newQty: number
) {
  const rowIdx = await findRowIndexById('Encounter_Combatants', ecId);
  if (rowIdx === null) {
    throw new Error(`Encounter Combatant ${ecId} not found`);
  }
  const a1Row = rowIdx + 1;
  // ✅ updateSheetData is now a static import — no dynamic import needed
  await updateSheetData(`Encounter_Combatants!E${a1Row}`, [[newQty.toString()]]);
}

export async function deleteEncounterCombatantDB(ecId: string) {
  const ids = await getSheetIds();
  const rowIdx = await findRowIndexById('Encounter_Combatants', ecId);
  if (rowIdx === null) return;

  await batchUpdateSpreadsheet([
    {
      deleteDimension: {
        range: {
          sheetId: ids['Encounter_Combatants'],
          dimension: 'ROWS',
          startIndex: rowIdx,
          endIndex: rowIdx + 1,
        },
      },
    },
  ]);
}

export async function addEncounterDB(
  name: string,
  location: string,
  difficultyId: number,
  numberOfNpcs: number = 0
) {
  const nextIdVal = await getNextId('Encounters');
  const finalId = nextIdVal.toString();

  const rowData = [
    finalId,
    sanitizeString(name),
    sanitizeString(location),
    difficultyId,
    numberOfNpcs,
  ];

  await appendSheetData('Encounters!A:E', [rowData]);
  return { id: finalId, name, location, difficultyId, numberOfNpcs };
}

export async function updateEncounterDB(
  encounterId: string,
  name: string,
  location: string,
  difficultyId: number
) {
  const rowIdx = await findRowIndexById('Encounters', encounterId);
  if (rowIdx === null) {
    throw new Error(`Encounter ${encounterId} not found`);
  }
  const a1Row = rowIdx + 1;
  // ✅ updateSheetData is now a static import — no dynamic import needed
  await updateSheetData(`Encounters!B${a1Row}:D${a1Row}`, [
    [sanitizeString(name), sanitizeString(location), difficultyId.toString()],
  ]);
}

export async function syncAndSanitizeDatabase() {
  const ids = await getSheetIds();
  const sheets = [
    'Characters',
    'Status',
    'Encounters',
    'Difficulty_Level',
    'NPCs',
    'Encounter_Combatants',
  ];

  const requests: any[] = [];

  for (const sheet of sheets) {
    if (!ids[sheet]) continue;
    const data = await fetchSheetData(`${sheet}!A2:Z`).catch(() => null);
    if (!data || !data.values) continue;

    // Iterate backwards so deletion indices don't shift as we go
    for (let i = data.values.length - 1; i >= 0; i--) {
      const row = data.values[i];
      const hasData =
        row && row.some((cell: any) => cell && String(cell).trim() !== '');
      if (!hasData) {
        requests.push({
          deleteDimension: {
            range: {
              sheetId: ids[sheet],
              dimension: 'ROWS',
              startIndex: i + 1, // +1 to account for header row
              endIndex: i + 2,
            },
          },
        });
      }
    }
  }

  if (requests.length > 0) {
    await batchUpdateSpreadsheet(requests);
  }

  return requests.length;
}