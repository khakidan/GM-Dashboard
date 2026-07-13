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

  it('POST /api/campaigns/create provisions all required sheets with correct column headers', async () => {
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
    
    // Should have 8 requests (7 addSheets + 1 delete default sheet)
    expect(sheetsBody.requests).toHaveLength(8);
    expect(sheetsBody.requests[0].addSheet.properties.title).toBe('Characters');
    expect(sheetsBody.requests[1].addSheet.properties.title).toBe('NPCs');
    expect(sheetsBody.requests[2].addSheet.properties.title).toBe('Encounters');
    expect(sheetsBody.requests[3].addSheet.properties.title).toBe('Encounter_Combatants');
    expect(sheetsBody.requests[4].addSheet.properties.title).toBe('Status');
    expect(sheetsBody.requests[5].addSheet.properties.title).toBe('Difficulty_Level');
    expect(sheetsBody.requests[6].addSheet.properties.title).toBe('EncounterLogs');
    expect(sheetsBody.requests[7].deleteSheet.sheetId).toBe(0);

    // Verify values write request
    const valuesCall = vi.mocked(fetch).mock.calls[2];
    expect(valuesCall[0]).toBe('https://sheets.googleapis.com/v4/spreadsheets/spread-123/values:batchUpdate');
    const valuesBody = JSON.parse(valuesCall[1]!.body as string);
    expect(valuesBody.data).toHaveLength(7);

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
      'Hit_Dice_Config', 'Hit_Dice_Used', 'Resource_Pools',
      'Ability_Scores', 'Proficiencies', 'Spellcasting_Ability'
    ]);

    // EncounterLogs sheet header assertion
    const logsData = valuesBody.data.find((d: any) => d.range.startsWith('EncounterLogs!'));
    expect(logsData).toBeDefined();
    expect(logsData.values[0]).toEqual([
      'id', 'encounterId', 'encounterName',
      'location', 'date', 'durationRounds',
      'outcome', 'partySnapshot', 'events',
      'transcript'
    ]);
  });

  it('POST /api/campaigns/create returns an error when the Google Sheets API call fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ error: { message: 'The caller does not have permission' } }),
      json: async () => ({ error: { message: 'The caller does not have permission' } }),
    } as Response);

    const response = await request(app)
      .post('/api/campaigns/create')
      .set('Authorization', 'Bearer mock-token')
      .send({ title: 'Tomb of Horrors' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: 'GOOGLE_API_ERROR',
      message: 'The caller does not have permission',
      details: { error: { message: 'The caller does not have permission' } }
    });
  });

  it('POST /api/campaigns/create returns SHEET_STRUCTURE_FAILED if adding sheets fails', async () => {
    const mockSpreadsheetResponse = {
      spreadsheetId: 'spread-123',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/spread-123/edit',
      sheets: [{ properties: { sheetId: 0, title: 'Sheet1' } }]
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockSpreadsheetResponse,
    } as Response);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: { message: 'Invalid requests' } }),
    } as Response);

    const response = await request(app)
      .post('/api/campaigns/create')
      .set('Authorization', 'Bearer mock-token')
      .send({ title: 'Tomb of Horrors' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'SHEET_STRUCTURE_FAILED',
      message: 'Spreadsheet was created but sheet tabs could not be provisioned: Invalid requests',
      spreadsheetId: 'spread-123',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/spread-123/edit'
    });
  });

  it('POST /api/campaigns/create returns HEADERS_FAILED if writing headers fails', async () => {
    const mockSpreadsheetResponse = {
      spreadsheetId: 'spread-123',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/spread-123/edit',
      sheets: [{ properties: { sheetId: 0, title: 'Sheet1' } }]
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockSpreadsheetResponse,
    } as Response);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => 'Success',
    } as Response);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: { message: 'Invalid range' } }),
    } as Response);

    const response = await request(app)
      .post('/api/campaigns/create')
      .set('Authorization', 'Bearer mock-token')
      .send({ title: 'Tomb of Horrors' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'HEADERS_FAILED',
      message: 'Spreadsheet and sheet tabs were created but column headers could not be written: Invalid range',
      spreadsheetId: 'spread-123',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/spread-123/edit'
    });
  });
});
