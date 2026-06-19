// src/server/routes/campaigns.ts

import { Router } from 'express';
import { sheets_v4 } from 'googleapis';

const router = Router();

router.post('/create', async (req, res) => {
  try {
    const { title } = req.body;
    const authHeader = req.headers.authorization;
    if (!title) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Spreadsheet title is required.' });
    }
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Bearer access token is required.' });
    }
    const token = authHeader.substring(7);

    // 1. Create Spreadsheet with title
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        properties: {
          title
        }
      })
    });

    const createData = await createRes.json() as any;
    if (!createRes.ok) {
      console.error('[Server] Failed to create spreadsheet:', createData);
      return res.status(createRes.status).json({ error: 'GOOGLE_API_ERROR', details: createData });
    }

    const { spreadsheetId, spreadsheetUrl } = createData;

    const requiredSheets = [
      {
        title: 'Characters',
        headers: [
          'Player_ID', 'Player_Name', 'Character_Name',
          'AC', 'Max_HP', 'Temp_HP', 'Current_HP',
          'Current_Condition', 'Passive_Perception',
          'Current_Level', 'Status', 'Notes',
          'Resistances', 'Immunities', 'Vulnerabilities',
          'Temp_HP_Max', 'Temp_AC', 'Death_Saves_Fails',
          'Death_Saves_Successes', 'Class',
          'Hit_Dice_Config', 'Hit_Dice_Used'
        ],
        rows: []
      },
      {
        title: 'NPCs',
        headers: [
          'NPC_ID', 'NPC_Name', 'AC', 'Max_HP', 'Temp_HP',
          'Current_HP', 'Current_Condition', 'Notes',
          'Resistances', 'Immunities', 'Vulnerabilities',
          'Legendary_Actions', 'Legendary_Resistances',
          'Recharge_Abilities'
        ],
        rows: []
      },
      {
        title: 'Encounters',
        headers: [
          'Encounter_ID', 'Encounter_Name', 'Location',
          'Difficulty', 'NPC_Definitions',
          'Current_Round', 'Active_Turn_ID'
        ],
        rows: []
      },
      {
        title: 'Encounter_Combatants',
        headers: [
          'Encounter_Combatants_ID', 'Encounter_ID',
          'Player_ID', 'NPC_ID', 'Quantity', 'Initiative',
          'Condition_Timers', 'NPC_Current_HP',
          'NPC_Temp_HP', 'NPC_Temp_Conditions',
          'NPC_Temp_AC_Mod'
        ],
        rows: []
      },
      {
        title: 'Status',
        headers: ['Status_ID', 'Status_Name'],
        rows: [
          ['1', 'Active'],
          ['2', 'Inactive'],
          ['3', 'Deceased']
        ]
      },
      {
        title: 'Difficulty_Level',
        headers: ['Difficulty_ID', 'Difficulty_Name'],
        rows: [
          ['1', 'Easy'],
          ['2', 'Medium'],
          ['3', 'Hard'],
          ['4', 'Deadly']
        ]
      }
    ];

    const defaultSheetId = createData.sheets?.[0]?.properties?.sheetId ?? 0;

    const batchRequests: sheets_v4.Schema$Request[] = [];
    for (const sheet of requiredSheets) {
      batchRequests.push({
        addSheet: {
          properties: {
            title: sheet.title
          }
        }
      });
    }
    batchRequests.push({
      deleteSheet: {
        sheetId: defaultSheetId
      }
    });

    const sheetsUpdateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ requests: batchRequests })
    });

    if (!sheetsUpdateRes.ok) {
       console.error('[Server] Failed sheet structure batch update:', await sheetsUpdateRes.text());
    }

    const valueData = requiredSheets.map(sheet => {
      const rowsToWrite = [sheet.headers, ...sheet.rows];
      return {
        range: `${sheet.title}!A1:Z${rowsToWrite.length}`,
        values: rowsToWrite
      };
    });

    const headersRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueData
      })
    });

    if (!headersRes.ok) {
       console.error('[Server] Failed headers batch update:', await headersRes.text());
    }

    res.json({
      spreadsheetId,
      spreadsheetUrl,
      name: title
    });

  } catch (error: any) {
    console.error('[Server] Exception creating campaign spreadsheet:', error);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
  }
});

export default router;
