// src/services/dbOperations.ts

import { getSpreadsheetId, fetchSheetData, updateSheetData, batchUpdateSpreadsheet, appendSheetData, fetchSpreadsheetMetadata, SheetGrid, BatchRequest, SheetMetadataEntry } from './sheetsService';
import { queueWrite } from './writeQueue';
import { Character, Encounter, NPC, EncounterCombatant } from '../types';

export function castInt(val: unknown, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  const parsed = parseInt(String(val), 10);
  return isNaN(parsed) ? fallback : parsed;
}

export function sanitizeString(val: unknown): string {
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
  metadata.sheets.forEach((s: SheetMetadataEntry) => {
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
): Promise<BatchRequest[] | null> {
  const rowIdx = await findRowIndexById(primarySheet, primaryId);
  if (rowIdx === null) return null;

  const requests: BatchRequest[] = [
    {
      deleteDimension: {
        range: {
          sheetId: ids[primarySheet],
          dimension: 'ROWS' as const,
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
    .map((row: unknown[], i: number) => ({ row, i }))
    .filter(
      ({ row }: { row: unknown[] }) =>
        row && String(row[ecColumnIndex]).trim() === String(primaryId).trim()
    )
    .map(({ i }: { i: number }) => i + 1)
    .sort((a: number, b: number) => b - a);

  toDelete.forEach((idx: number) => {
    requests.push({
      deleteDimension: {
        range: {
          sheetId: ids['Encounter_Combatants'],
          dimension: 'ROWS' as const,
          startIndex: idx,
          endIndex: idx + 1,
        },
      },
    });
  });

  return requests;
}

export async function deleteCharacterFully(playerId: string) {
  try {
    const ids = await getSheetIds();
    // Player_ID is column index 2 in Encounter_Combatants
    const requests = await buildCascadeDeleteRequests('Characters', playerId, 2, ids);
    if (requests && requests.length > 0) {
      await batchUpdateSpreadsheet(requests);
    }
  } catch (err) {
    console.error('[DB] deleteCharacterFully failed:', err);
    throw err;
  }
}

export async function deleteEncounterFully(encounterId: string) {
  try {
    const ids = await getSheetIds();
    // Encounter_ID is column index 1 in Encounter_Combatants
    const requests = await buildCascadeDeleteRequests('Encounters', encounterId, 1, ids);
    if (requests && requests.length > 0) {
      await batchUpdateSpreadsheet(requests);
    }
  } catch (err) {
    console.error('[DB] deleteEncounterFully failed:', err);
    throw err;
  }
}

export async function addCharacterDB(character: Partial<Character>) {
  try {
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
      sanitizeString(character.resistances || ''),
      sanitizeString(character.immunities || ''),
      sanitizeString(character.vulnerabilities || ''),
      castInt(character.tempHpMax, 0),
      castInt(character.tempAc, 0),
    ];

    await appendSheetData('Characters!A:Q', [rowData]);
    return { ...character, id: finalId, tempHpMax: character.tempHpMax ?? 0, tempAc: character.tempAc ?? 0 };
  } catch (err) {
    console.error('[DB] addCharacterDB failed:', err);
    throw err;
  }
}

export async function updateCharacterDB(
  character: Partial<Character>,
  fullState: Character
) {
  try {
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
      sanitizeString(character.resistances ?? fullState.resistances ?? ''),
      sanitizeString(character.immunities ?? fullState.immunities ?? ''),
      sanitizeString(character.vulnerabilities ?? fullState.vulnerabilities ?? ''),
      castInt(character.tempHpMax ?? fullState.tempHpMax, 0),
      castInt(character.tempAc ?? fullState.tempAc, 0),
    ];

    const a1Row = charRowIdx + 1;
    // ✅ queueWrite replaces updateSheetData to prevent API quotas inside combat loops
    queueWrite(`Characters!A${a1Row}:Q${a1Row}`, [rowData]);
  } catch (err) {
    console.error('[DB] updateCharacterDB failed:', err);
    throw err;
  }
}

export async function addNpcDB(
  npcName: string,
  npcHp: number,
  npcAc: number,
  npcNotes: string,
  resistances: string = '',
  immunities: string = '',
  vulnerabilities: string = ''
) {
  try {
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
      sanitizeString(resistances),
      sanitizeString(immunities),
      sanitizeString(vulnerabilities),
    ];

    await appendSheetData('NPCs!A:K', [rowData]);
    return {
      id: finalId,
      name: npcName,
      maxHp: npcHp,
      ac: npcAc,
      notes: npcNotes,
      tempHp: 0,
      currentHp: npcHp,
      conditions: '',
      resistances,
      immunities,
      vulnerabilities,
    };
  } catch (err) {
    console.error('[DB] addNpcDB failed:', err);
    throw err;
  }
}

export async function updateNpcFullDB(npc: NPC) {
  try {
    const rowIdx = await findRowIndexById('NPCs', npc.id);
    if (rowIdx === null) {
      throw new Error(`NPC ${npc.id} not found`);
    }
    const a1Row = rowIdx + 1;
    const rowData = [
      npc.id,
      sanitizeString(npc.name),
      castInt(npc.ac, 10),
      castInt(npc.maxHp, 1),
      castInt(npc.tempHp, 0),
      castInt(npc.currentHp, 1),
      sanitizeString(npc.conditions),
      sanitizeString(npc.notes),
      sanitizeString(npc.resistances || ''),
      sanitizeString(npc.immunities || ''),
      sanitizeString(npc.vulnerabilities || ''),
    ];

    // Using queueWrite to be consistent with updateCharacterDB
    queueWrite(`NPCs!A${a1Row}:K${a1Row}`, [rowData]);
  } catch (err) {
    console.error('[DB] updateNpcFullDB failed:', err);
    throw err;
  }
}

export async function deleteNpcDB(npcId: string) {
  try {
    const ids = await getSheetIds();
    const rowIdx = await findRowIndexById('NPCs', npcId);
    if (rowIdx === null) {
      throw new Error(`NPC ${npcId} not found`);
    }

    // NPCs also appear in Encounter_Combatants. ID is column index 3 (NPC_ID)
    // Encounter combatants: 0=ID, 1=Encounter_ID, 2=Player_ID, 3=NPC_ID
    const requests = await buildCascadeDeleteRequests('NPCs', npcId, 3, ids);
    if (requests && requests.length > 0) {
      await batchUpdateSpreadsheet(requests);
    }
  } catch (err) {
    console.error('[DB] deleteNpcDB failed:', err);
    throw err;
  }
}

export async function updateNpcDB(
  npcId: string,
  currentHp: number,
  tempHp: number,
  conditions: string
) {
  try {
    const rowIdx = await findRowIndexById('NPCs', npcId);
    if (rowIdx === null) {
      throw new Error(`NPC ${npcId} not found`);
    }
    const a1Row = rowIdx + 1;
    // NPCs sheet: Column E = TempHP, F = CurrentHP, G = Conditions
    // ✅ queueWrite replaces updateSheetData to prevent API quotas inside combat loops
    queueWrite(`NPCs!E${a1Row}:G${a1Row}`, [
      [tempHp.toString(), currentHp.toString(), conditions],
    ]);
  } catch (err) {
    console.error('[DB] updateNpcDB failed:', err);
    throw err;
  }
}

export async function resetNpcHpDB(
  npcId: string,
  maxHp: number
): Promise<void> {
  try {
    const rowIdx = await findRowIndexById('NPCs', npcId);
    if (rowIdx === null) {
      throw new Error(`NPC ${npcId} not found`);
    }
    const a1Row = rowIdx + 1;
    await updateSheetData(`NPCs!F${a1Row}`, [[maxHp.toString()]]);
  } catch (err) {
    console.error('[DB] resetNpcHpDB failed:', err);
    throw err;
  }
}

export async function addEncounterCombatantDB(
  encounterId: string,
  playerId: string | null,
  npcId: string | null,
  quantity: number
): Promise<EncounterCombatant[]> {
  try {
    const startIdVal = await getNextId('Encounter_Combatants');
    const created: EncounterCombatant[] = [];
    
    // For PCs or other cases, if q <= 0, we still want to make at least 1 record
    const count = quantity <= 0 ? 1 : quantity;

    for (let i = 0; i < count; i++) {
      const finalId = (startIdVal + i).toString();
      const rowData = [
        finalId,
        encounterId,
        playerId || '',
        npcId || '',
        1,  // Quantity is always 1 when expanded per instance
        0,  // initiative
        '', // conditionTimers
        -1, // npcCurrentHp
        0,  // npcTempHp
      ];

      await appendSheetData('Encounter_Combatants!A:I', [rowData]);
      created.push({
        id: finalId,
        encounterId,
        playerId,
        npcId,
        quantity: 1,
        initiative: 0,
        conditionTimers: {},
        npcCurrentHp: -1,
        npcTempHp: 0,
      });
    }
    return created;
  } catch (err) {
    console.error('[DB] addEncounterCombatantDB failed:', err);
    throw err;
  }
}

export async function updateEncounterCombatantQuantityDB(
  ecId: string,
  newQty: number
) {
  try {
    const rowIdx = await findRowIndexById('Encounter_Combatants', ecId);
    if (rowIdx === null) {
      throw new Error(`Encounter Combatant ${ecId} not found`);
    }
    const a1Row = rowIdx + 1;
    // ✅ updateSheetData is now a static import — no dynamic import needed
    await updateSheetData(`Encounter_Combatants!E${a1Row}`, [[newQty.toString()]]);
  } catch (err) {
    console.error('[DB] updateEncounterCombatantQuantityDB failed:', err);
    throw err;
  }
}

export async function updateInitiativeDB(
  ecId: string,
  initiative: number
): Promise<void> {
  try {
    const rowIdx = await findRowIndexById('Encounter_Combatants', ecId);
    if (rowIdx === null) {
      throw new Error(`Encounter Combatant ${ecId} not found`);
    }
    const a1Row = rowIdx + 1;
    await updateSheetData(`Encounter_Combatants!F${a1Row}`, [[initiative.toString()]]);
  } catch (err) {
    console.error('[DB] updateInitiativeDB failed:', err);
    throw err;
  }
}

export async function updateConditionTimersDB(
  ecId: string,
  timers: Record<string, number>
): Promise<void> {
  try {
    const rowIdx = await findRowIndexById('Encounter_Combatants', ecId);
    if (rowIdx === null) {
      throw new Error(`Encounter Combatant ${ecId} not found`);
    }
    const a1Row = rowIdx + 1;
    const jsonStr = JSON.stringify(timers);
    await updateSheetData(`Encounter_Combatants!G${a1Row}`, [[jsonStr]]);
  } catch (err) {
    console.error('[DB] updateConditionTimersDB failed:', err);
    throw err;
  }
}

export async function updateNpcInstanceHpDB(
  ecId: string,
  currentHp: number,
  tempHp: number
): Promise<void> {
  try {
    const rowIdx = await findRowIndexById('Encounter_Combatants', ecId);
    if (rowIdx === null) {
      throw new Error(`Encounter Combatant ${ecId} not found`);
    }
    const a1Row = rowIdx + 1;
    await updateSheetData(`Encounter_Combatants!H${a1Row}:I${a1Row}`, [
      [currentHp.toString(), tempHp.toString()],
    ]);
  } catch (err) {
    console.error('[DB] updateNpcInstanceHpDB failed:', err);
    throw err;
  }
}

export async function updateNpcInstanceConditionsDB(
  ecId: string,
  conditions: string
): Promise<void> {
  try {
    const rowIdx = await findRowIndexById('Encounter_Combatants', ecId);
    if (rowIdx === null) {
      throw new Error(`Encounter Combatant ${ecId} not found`);
    }
    const a1Row = rowIdx + 1;
    await updateSheetData(`Encounter_Combatants!J${a1Row}`, [
      [conditions],
    ]);
  } catch (err) {
    console.error('[DB] updateNpcInstanceConditionsDB failed:', err);
    throw err;
  }
}

export async function updateNpcInstanceAcModDB(
  ecId: string,
  acMod: number
): Promise<void> {
  try {
    const rowIdx = await findRowIndexById('Encounter_Combatants', ecId);
    if (rowIdx === null) {
      throw new Error(`Encounter Combatant ${ecId} not found`);
    }

    const a1Row = rowIdx + 1;
    await updateSheetData(`Encounter_Combatants!K${a1Row}`, [
      [acMod.toString()],
    ]);
  } catch (err) {
    console.error('[DB] updateNpcInstanceAcModDB failed:', err);
    throw err;
  }
}

export async function deleteEncounterCombatantDB(ecId: string) {
  try {
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
  } catch (err) {
    console.error('[DB] deleteEncounterCombatantDB failed:', err);
    throw err;
  }
}

export async function addEncounterDB(
  name: string,
  location: string,
  difficultyId: number,
  numberOfNpcs: number = 0
) {
  try {
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
  } catch (err) {
    console.error('[DB] addEncounterDB failed:', err);
    throw err;
  }
}

export async function updateEncounterDB(
  encounterId: string,
  name: string,
  location: string,
  difficultyId: number
) {
  try {
    const rowIdx = await findRowIndexById('Encounters', encounterId);
    if (rowIdx === null) {
      throw new Error(`Encounter ${encounterId} not found`);
    }
    const a1Row = rowIdx + 1;
    // ✅ updateSheetData is now a static import — no dynamic import needed
    await updateSheetData(`Encounters!B${a1Row}:D${a1Row}`, [
      [sanitizeString(name), sanitizeString(location), difficultyId.toString()],
    ]);
  } catch (err) {
    console.error('[DB] updateEncounterDB failed:', err);
    throw err;
  }
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

  const requests: BatchRequest[] = [];

  for (const sheet of sheets) {
    if (!ids[sheet]) continue;
    const data = await fetchSheetData(`${sheet}!A2:Z`).catch(() => null);
    if (!data || !data.values) continue;

    // Iterate backwards so deletion indices don't shift as we go
    for (let i = data.values.length - 1; i >= 0; i--) {
      const row = data.values[i];
      const hasData =
        row && row.some((cell: unknown) => cell && String(cell).trim() !== '');
      if (!hasData) {
        requests.push({
          deleteDimension: {
            range: {
              sheetId: ids[sheet],
              dimension: 'ROWS' as const,
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