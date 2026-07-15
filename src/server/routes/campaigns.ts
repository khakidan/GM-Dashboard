// src/server/routes/campaigns.ts

import { Router } from 'express';
import { sheets_v4 } from 'googleapis';
import rateLimit from 'express-rate-limit';

const router = Router();

function getGoogleAuthHeaders(token: string) {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

const campaignCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many campaign creation attempts. Please try again in 15 minutes.'
  }
});

router.post('/create', campaignCreateLimiter, async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Request body is required.' });
    }
    const { title } = req.body;
    const authHeader = req.headers.authorization;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Spreadsheet title is required.' });
    }
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Bearer access token is required.' });
    }
    const token = authHeader.substring(7);

    // 1. Create Spreadsheet with title
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: getGoogleAuthHeaders(token),
      body: JSON.stringify({
        properties: {
          title
        }
      })
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      let createData;
      try {
        createData = JSON.parse(errorText);
      } catch (e) {
        createData = { error: { message: errorText } };
      }
      console.error('[Server] Failed to create spreadsheet:', errorText);
      return res.status(createRes.status).json({
        error: 'GOOGLE_API_ERROR',
        message: createData?.error?.message || 'Google Sheets API rejected the request.',
        details: createData
      });
    }

    const createData = await createRes.json() as any;

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
          'Hit_Dice_Config', 'Hit_Dice_Used', 'Resource_Pools',
          'Ability_Scores', 'Proficiencies', 'Spellcasting_Ability'
        ],
        rows: []
      },
      {
        title: 'NPCs',
        headers: [
          'NPC_ID', 'NPC_Name', 'AC', 'Max_HP', 'Notes',
          'Resistances', 'Immunities', 'Vulnerabilities',
          'Legendary_Actions', 'Legendary_Resistances',
          'Recharge_Abilities', 'Ability_Scores', 'Proficiencies',
          'Speed', 'Senses', 'Languages', 'Challenge_Rating',
          'Traits', 'Actions', 'Reactions', 'Legendary_Actions_List',
          'Spellcasting_Ability'
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
          'NPC_Temp_AC_Mod', 'NPC_Legendary_Actions_Remaining',
          'NPC_Legendary_Resistances_Remaining', 'NPC_Recharge_State'
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
      },
      {
        title: 'EncounterLogs',
        headers: [
          'id', 'encounterId', 'encounterName',
          'location', 'date', 'durationRounds',
          'outcome', 'partySnapshot', 'events',
          'transcript'
        ],
        rows: []
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
      headers: getGoogleAuthHeaders(token),
      body: JSON.stringify({ requests: batchRequests })
    });

    if (!sheetsUpdateRes.ok) {
      const errorText = await sheetsUpdateRes.text();
      let errorDetail = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson?.error?.message) {
          errorDetail = errorJson.error.message;
        }
      } catch (e) {
        // fallback to raw text
      }
      console.error('[Server] Failed sheet structure batch update:', errorText);
      return res.status(sheetsUpdateRes.status).json({
        error: 'SHEET_STRUCTURE_FAILED',
        message: 'Spreadsheet was created but sheet tabs could not be provisioned: ' + errorDetail,
        spreadsheetId,
        spreadsheetUrl
      });
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
      headers: getGoogleAuthHeaders(token),
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueData
      })
    });

    if (!headersRes.ok) {
      const errorText = await headersRes.text();
      let errorDetail = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson?.error?.message) {
          errorDetail = errorJson.error.message;
        }
      } catch (e) {
        // fallback to raw text
      }
      console.error('[Server] Failed headers batch update:', errorText);
      return res.status(headersRes.status).json({
        error: 'HEADERS_FAILED',
        message: 'Spreadsheet and sheet tabs were created but column headers could not be written: ' + errorDetail,
        spreadsheetId,
        spreadsheetUrl
      });
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
