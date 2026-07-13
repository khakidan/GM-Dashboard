// src/services/dbOperations/npcs.ts

import { NPC } from '../../types';
import {
  queueWriteResolved,
  updateSheetData,
  appendSheetData,
  batchUpdateSpreadsheet,
  resolveSpreadsheetId,
  castInt,
  sanitizeString,
  getSpellcastingAbilityToSave,
  injectSpellcastingAbility,
  getNextId,
  findRowIndexById,
  getSheetIds,
  buildCascadeDeleteRequests,
} from './shared';

export async function addNpcDB(
  npcData: Omit<NPC, 'id' | 'sheetRowIndex'>
): Promise<NPC>;
export async function addNpcDB(
  spreadsheetId: string | undefined,
  npcData: Omit<NPC, 'id' | 'sheetRowIndex'>
): Promise<NPC>;
export async function addNpcDB(
  arg1: any,
  arg2?: any
): Promise<NPC> {
  let spreadsheetId: string | undefined;
  let npcData: Omit<NPC, 'id' | 'sheetRowIndex'>;

  if (arg2 === undefined) {
    spreadsheetId = undefined;
    npcData = arg1;
  } else {
    spreadsheetId = arg1;
    npcData = arg2;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const nextIdVal = await getNextId(resolvedId, 'NPCs');
    const finalId = nextIdVal.toString();

    const finalSpellcastingAbility = getSpellcastingAbilityToSave(npcData, npcData);
    const finalProficiencies = injectSpellcastingAbility(
      sanitizeString(npcData.proficiencies ?? '{}'),
      finalSpellcastingAbility
    );

    const rowData = [
      finalId,
      sanitizeString(npcData.name),
      castInt(npcData.ac, 10),
      castInt(npcData.maxHp, 1),
      sanitizeString(npcData.notes),
      sanitizeString(npcData.resistances ?? ''),
      sanitizeString(npcData.immunities ?? ''),
      sanitizeString(npcData.vulnerabilities ?? ''),
      castInt(npcData.legendaryActions ?? 0, 0),
      castInt(npcData.legendaryResistances ?? 0, 0),
      JSON.stringify(npcData.rechargeAbilities ?? []),
      sanitizeString(npcData.abilityScores ?? '{}'),
      finalProficiencies,
      sanitizeString(npcData.speed ?? ''),
      sanitizeString(npcData.senses ?? ''),
      sanitizeString(npcData.languages ?? ''),
      sanitizeString(npcData.challengeRating ?? ''),
      sanitizeString(npcData.traits ?? '[]'),
      sanitizeString(npcData.actions ?? '[]'),
      sanitizeString(npcData.reactions ?? '[]'),
      sanitizeString(npcData.legendaryActionsList ?? '[]'),
      finalSpellcastingAbility,
    ];

    await appendSheetData(resolvedId, 'NPCs!A:V', [rowData]);
    return {
      id: finalId,
      name: npcData.name,
      ac: npcData.ac,
      maxHp: npcData.maxHp,
      notes: npcData.notes,
      resistances: npcData.resistances ?? '',
      immunities: npcData.immunities ?? '',
      vulnerabilities: npcData.vulnerabilities ?? '',
      legendaryActions: npcData.legendaryActions ?? 0,
      legendaryResistances: npcData.legendaryResistances ?? 0,
      rechargeAbilities: npcData.rechargeAbilities ?? [],
      abilityScores: npcData.abilityScores ?? '{}',
      proficiencies: finalProficiencies,
      speed: npcData.speed ?? '',
      senses: npcData.senses ?? '',
      languages: npcData.languages ?? '',
      challengeRating: npcData.challengeRating ?? '',
      traits: npcData.traits ?? '[]',
      actions: npcData.actions ?? '[]',
      reactions: npcData.reactions ?? '[]',
      legendaryActionsList: npcData.legendaryActionsList ?? '[]',
      spellcastingAbility: npcData.spellcastingAbility ?? finalSpellcastingAbility,
    };
  } catch (err) {
    console.error('[DB] addNpcDB failed:', err);
    throw err;
  }
}

export async function updateNpcFullDB(npc: NPC): Promise<void>;
export async function updateNpcFullDB(spreadsheetId: string | undefined, npc: NPC): Promise<void>;
export async function updateNpcFullDB(
  arg1: any,
  arg2?: any
) {
  let spreadsheetId: string | undefined;
  let npc: NPC;
  if (arg2 === undefined) {
    spreadsheetId = undefined;
    npc = arg1;
  } else {
    spreadsheetId = arg1;
    npc = arg2;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const rowIdx = await findRowIndexById(resolvedId, 'NPCs', npc.id);
    if (rowIdx === null) {
      throw new Error(`NPC ${npc.id} not found`);
    }
    const a1Row = rowIdx + 1;
    const rowData = [
      npc.id,
      sanitizeString(npc.name),
      castInt(npc.ac, 10),
      castInt(npc.maxHp, 1),
      sanitizeString(npc.notes),
      sanitizeString(npc.resistances || ''),
      sanitizeString(npc.immunities || ''),
      sanitizeString(npc.vulnerabilities || ''),
      castInt(npc.legendaryActions ?? 0, 0),
      castInt(npc.legendaryResistances ?? 0, 0),
      JSON.stringify(npc.rechargeAbilities ?? []),
      sanitizeString(npc.abilityScores || '{}'),
      injectSpellcastingAbility(
        sanitizeString(npc.proficiencies || '{}'),
        getSpellcastingAbilityToSave(npc, npc)
      ),
      npc.speed ?? '',
      npc.senses ?? '',
      npc.languages ?? '',
      npc.challengeRating ?? '',
      npc.traits ?? '[]',
      npc.actions ?? '[]',
      npc.reactions ?? '[]',
      npc.legendaryActionsList ?? '[]',
      getSpellcastingAbilityToSave(npc, npc),
    ];

    queueWriteResolved(resolvedId, `NPCs!A${a1Row}:V${a1Row}`, [rowData]);
  } catch (err) {
    console.error('[DB] updateNpcFullDB failed:', err);
    throw err;
  }
}

export async function deleteNpcDB(npcId: string): Promise<void>;
export async function deleteNpcDB(spreadsheetId: string | undefined, npcId: string): Promise<void>;
export async function deleteNpcDB(
  arg1: any,
  arg2?: any
) {
  let spreadsheetId: string | undefined;
  let npcId: string;
  if (arg2 === undefined) {
    spreadsheetId = undefined;
    npcId = arg1;
  } else {
    spreadsheetId = arg1;
    npcId = arg2;
  }

  try {
    const resolvedId = resolveSpreadsheetId(spreadsheetId);
    const ids = await getSheetIds(resolvedId);
    const rowIdx = await findRowIndexById(resolvedId, 'NPCs', npcId);
    if (rowIdx === null) {
      throw new Error(`NPC ${npcId} not found`);
    }

    const requests = await buildCascadeDeleteRequests(resolvedId, 'NPCs', npcId, 3, ids);
    if (requests && requests.length > 0) {
      await batchUpdateSpreadsheet(resolvedId, requests);
    }
  } catch (err) {
    console.error('[DB] deleteNpcDB failed:', err);
    throw err;
  }
}
