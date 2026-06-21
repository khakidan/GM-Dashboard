import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import campaignsRouter from '../routes/campaigns';

describe('Campaigns Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/campaigns', campaignsRouter);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/campaigns/create', () => {
    it('creates exactly 6 sheets with headers and predefined rows correctly', async () => {
      const mockSpreadsheetResponse = {
        spreadsheetId: 'spread-123',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/spread-123/edit',
        sheets: [
          {
            properties: {
              sheetId: 0,
              title: 'Sheet1'
            }
          }
        ]
      };

      // Mock first fetch: Create spreadsheet
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSpreadsheetResponse,
      } as Response);

      // Mock second fetch: BatchUpdate sheets creation/deletion
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'Success',
      } as Response);

      // Mock third fetch: Value write batchUpdate
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      const response = await request(app)
        .post('/api/campaigns/create')
        .set('Authorization', 'Bearer mock-token')
        .send({ title: 'Tomb of Horrors' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        spreadsheetId: 'spread-123',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/spread-123/edit',
        name: 'Tomb of Horrors'
      });

      // Verify the sheet structuring request
      const sheetsCall = vi.mocked(fetch).mock.calls[1];
      expect(sheetsCall[0]).toBe('https://sheets.googleapis.com/v4/spreadsheets/spread-123:batchUpdate');
      const sheetsBody = JSON.parse(sheetsCall[1]!.body as string);
      
      // Should have 7 requests (6 addSheets + 1 delete default sheet)
      expect(sheetsBody.requests).toHaveLength(7);
      expect(sheetsBody.requests[0].addSheet.properties.title).toBe('Characters');
      expect(sheetsBody.requests[1].addSheet.properties.title).toBe('NPCs');
      expect(sheetsBody.requests[2].addSheet.properties.title).toBe('Encounters');
      expect(sheetsBody.requests[3].addSheet.properties.title).toBe('Encounter_Combatants');
      expect(sheetsBody.requests[4].addSheet.properties.title).toBe('Status');
      expect(sheetsBody.requests[5].addSheet.properties.title).toBe('Difficulty_Level');
      expect(sheetsBody.requests[6].deleteSheet.sheetId).toBe(0);

      // Verify values write request
      const valuesCall = vi.mocked(fetch).mock.calls[2];
      expect(valuesCall[0]).toBe('https://sheets.googleapis.com/v4/spreadsheets/spread-123/values:batchUpdate');
      const valuesBody = JSON.parse(valuesCall[1]!.body as string);
      expect(valuesBody.data).toHaveLength(6);

      // Characters sheet header assertion
      const charsData = valuesBody.data.find((d: any) => d.range.startsWith('Characters!'));
      expect(charsData).toBeDefined();
      expect(charsData.values[0]).toEqual([
        'Player_ID', 'Player_Name', 'Character_Name',
        'AC', 'Max_HP', 'Temp_HP', 'Current_HP',
        'Current_Condition', 'Passive_Perception',
        'Current_Level', 'Status', 'Notes',
        'Resistances', 'Immunities', 'Vulnerabilities',
        'Temp_HP_Max', 'Temp_AC', 'Death_Saves_Fails',
        'Death_Saves_Successes', 'Class',
        'Hit_Dice_Config', 'Hit_Dice_Used', 'Resource_Pools'
      ]);

      // NPCs sheet header assertion (Legendary_Actions at column L, Legendary_Resistances at column M, Recharge_Abilities at column N)
      const npcsData = valuesBody.data.find((d: any) => d.range.startsWith('NPCs!'));
      expect(npcsData).toBeDefined();
      expect(npcsData.values[0][11]).toBe('Legendary_Actions');
      expect(npcsData.values[0][12]).toBe('Legendary_Resistances');
      expect(npcsData.values[0][13]).toBe('Recharge_Abilities');

      // Encounters sheet header assertion
      const encountersData = valuesBody.data.find((d: any) => d.range.startsWith('Encounters!'));
      expect(encountersData).toBeDefined();
      expect(encountersData.values[0][4]).toBe('NPC_Definitions');
      expect(encountersData.values[0][4]).not.toBe('Number_of_NPCs');

      // Status sheet data rows validation
      const statusData = valuesBody.data.find((d: any) => d.range.startsWith('Status!'));
      expect(statusData).toBeDefined();
      expect(statusData.values).toEqual([
        ['Status_ID', 'Status_Name'],
        ['1', 'Active'],
        ['2', 'Inactive'],
        ['3', 'Deceased']
      ]);

      // Difficulty Level sheet data rows validation
      const diffData = valuesBody.data.find((d: any) => d.range.startsWith('Difficulty_Level!'));
      expect(diffData).toBeDefined();
      expect(diffData.values).toEqual([
        ['Difficulty_ID', 'Difficulty_Name'],
        ['1', 'Easy'],
        ['2', 'Medium'],
        ['3', 'Hard'],
        ['4', 'Deadly']
      ]);
    });
  });
});
