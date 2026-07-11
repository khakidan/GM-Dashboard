import { describe, it, expect, vi } from 'vitest';
import {
  parseStatuses,
  parseDifficulties,
  parseNPCs,
  parseEncounters,
  parseEncounterCombatants,
  parseCharacters,
} from '../sheetSyncParser';

describe('sheetSyncParser', () => {
  describe('parseStatuses', () => {
    it('returns a correctly shaped output object for a valid row', () => {
      const data = [['1', 'Active']];
      const result = parseStatuses(data);
      expect(result).toEqual({ '1': 'Active' });
    });
  });

  describe('parseDifficulties', () => {
    it('returns a correctly shaped output object for a valid row', () => {
      const data = [['1', 'Easy']];
      const result = parseDifficulties(data);
      expect(result).toEqual({ '1': 'Easy' });
    });
  });

  describe('parseNPCs', () => {
    it('returns correctly shaped NPC array with all fields mapped coercion', () => {
      const data = [
        ['N1', 'Goblin', '12', '15', 'Fast', 'Fire', 'None', 'None']
      ];
      // 0: id, 1: Name, 2: AC, 3: maxHp, 4: Notes, 5: Res, 6: Imm, 7: Vuln
      const result = parseNPCs(data);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'N1',
        name: 'Goblin',
        ac: 12,
        maxHp: 15,
        notes: 'Fast',
        resistances: 'Fire',
        immunities: 'None',
        vulnerabilities: 'None',
      }));
    });

    it('numeric coercion from strings to numbers', () => {
      const data = [['N1', 'Orc', '10', '20']];
      const result = parseNPCs(data);
      expect(result[0].maxHp).toBe(20);
      expect(result[0].ac).toBe(10);
    });

    it('optional fields missing default to correct values', () => {
      const data = [['N1', 'Blank NPC', '10', '10']];
      const result = parseNPCs(data);
      expect(result[0].notes).toBe('');
      expect(result[0].resistances).toBe('');
      expect(result[0].immunities).toBe('');
      expect(result[0].vulnerabilities).toBe('');
    });

    it('shorter than expected missing trailing columns', () => {
      const data = [['N1', 'Short NPC', '10', '10']];
      const result = parseNPCs(data);
      expect(result[0].resistances).toBe('');
      expect(result[0].legendaryActions).toBe(0); // schema coerces to 0
    });

    it('completely null or undefined row returns null (filtered out)', () => {
      const data = [null, undefined, []];
      const result = parseNPCs(data);
      expect(result).toEqual([]);
    });

    it('rechargeAbilities column containing valid JSON parses to array with correct name', () => {
      const validJson = JSON.stringify([{ name: 'Breath', rechargeOn: '5-6' }]);
      const data = [['N1', 'Dragon', '18', '100', '', '', '', '', '0', '0', validJson]];
      const result = parseNPCs(data);
      expect(result[0].rechargeAbilities).toEqual([{ name: 'Breath', rechargeOn: '5-6' }]);
    });

    it('rechargeAbilities column containing malformed JSON returns empty array, does not throw', () => {
      const malformedJson = '[{ name: Breath }]';
      const data = [['N1', 'Dragon', '18', '100', '', '', '', '', '0', '0', malformedJson]];
      const result = parseNPCs(data);
      expect(result[0].rechargeAbilities).toEqual([]);
    });

    it('rechargeAbilities column that is empty string returns empty array', () => {
      const data = [['N1', 'Dragon', '18', '100', '', '', '', '', '0', '0', '']];
      const result = parseNPCs(data);
      expect(result[0].rechargeAbilities).toEqual([]);
    });
  });

  describe('parseEncounters', () => {
    it('returns correctly mapped output on valid row', () => {
      const data = [['1', 'Forest Ambush', 'Forest', '2', '[]', '1', 'turn123']];
      const result = parseEncounters(data, { '2': 'Easy' });
      expect(result[0]).toEqual({
        id: '1',
        name: 'Forest Ambush',
        location: 'Forest',
        difficultyId: 2,
        difficultyName: 'Easy',
        status: 'planned',
        currentRound: 1,
        activeTurnId: 'turn123',
        sheetRowIndex: 2,
        npcDefinitions: '[]',
      });
    });

    it('currentRound absent or empty defaults to 0', () => {
      const data = [['1', 'Camp', 'Zone', '1', '[]', '']];
      const result = parseEncounters(data, { '1': 'Easy' });
      expect(result[0].currentRound).toBe(0);
    });

    it('activeTurnId absent or empty defaults to empty string', () => {
      const data = [['1', 'Camp', 'Zone', '1', '[]', '1', '']];
      const result = parseEncounters(data, { '1': 'Easy' });
      expect(result[0].activeTurnId).toBe('');
      
      const missingData = [['1', 'Camp', 'Zone', '1', '[]', '1']];
      const resultMissing = parseEncounters(missingData, { '1': 'Easy' });
      expect(resultMissing[0].activeTurnId).toBe('');
    });
    
    it('shorter than expected misses round and turn defaults to 0 and empty', () => {
      const missingData = [['1', 'Camp', 'Zone', '1', '[]']];
      const resultMissing = parseEncounters(missingData, { '1': 'Easy' });
      expect(resultMissing[0].currentRound).toBe(0);
      expect(resultMissing[0].activeTurnId).toBe('');
    });

    it('completely null or undefined row returns null (filtered out)', () => {
      const data = [null, undefined, []];
      const result = parseEncounters(data, {});
      expect(result).toEqual([]);
    });
  });

  describe('parseEncounterCombatants', () => {
    it('returns correctly mapped output', () => {
      const data = [['ec-1', '2', '3', '5', '10', '20', '0']];
      const result = parseEncounterCombatants(data);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'ec-1',
        encounterId: '2',
        playerId: '3',
        npcId: '5',
        quantity: 10,
        npcCurrentHp: -1,
        npcTempHp: 0,
        initiative: 20,
        sheetRowIndex: 2,
      }));
    });
    
    it('coerces properly and defaults properly', () => {
      const data = [['ec-1', '1', '', '5', '1']];
      const result = parseEncounterCombatants(data);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'ec-1',
        encounterId: '1',
        playerId: null,
        npcId: '5',
        quantity: 1,
        npcCurrentHp: -1,
        npcTempHp: 0,
        initiative: 0,
        sheetRowIndex: 2,
      }));
    });
  });

  describe('parseCharacters', () => {
    it('returns correctly mapped character', () => {
      const data = [['P1', 'Player', 'Hero', '15', '20', '0', '20', 'Poisoned', '12', '5', '1', 'Notes']];
      const result = parseCharacters(data, { '1': 'Active' });
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'P1',
        playerName: 'Player',
        characterName: 'Hero',
        ac: 15,
        maxHp: 20,
        tempHp: 0,
        currentHp: 20,
        conditions: 'Poisoned',
        passivePerception: 12,
        level: 5,
        statusId: 1,
        statusName: 'Active',
        notes: 'Notes',
        isActive: true,
      }));
    });

    it('shorter than expected row gets default notes and conditions', () => {
      const data = [['P1', 'Player', 'Hero', '15', '20', '0', '20']];
      // [7] conditions, [8] passivePerception, etc missing
      const result = parseCharacters(data, { '1': 'Active' });
      expect(result[0].conditions).toBe('');
      expect(result[0].notes).toBe('');
      expect(result[0].passivePerception).toBe(10);
    });
  });
});
