import { describe, it, expect } from 'vitest';
import { generateTranscript, ActiveCombatLog, CombatEvent } from '../combatLog';

describe('combatLog', () => {
  describe('generateTranscript', () => {
    it('TEST 1.1 — Complete encounter transcript', () => {
      const log: ActiveCombatLog = {
        encounterId: 'enc-1',
        encounterName: 'Goblin Ambush',
        location: 'Forest Path',
        startedAt: '2026-06-30T10:00:00Z',
        currentRound: 2,
        partySnapshot: [
          { id: 'pc-1', name: 'Fighter', type: 'pc', startingHp: 45, maxHp: 45, level: 3 },
          { id: 'pc-2', name: 'Cleric', type: 'pc', startingHp: 38, maxHp: 38, level: 3 },
        ],
        initiativeOrder: [
          { combatantId: 'npc-2', name: 'Goblin Shaman', initiative: 18, type: 'npc' },
          { combatantId: 'pc-1', name: 'Fighter', initiative: 15, type: 'pc' },
          { combatantId: 'pc-2', name: 'Cleric', initiative: 10, type: 'pc' },
          { combatantId: 'npc-1', name: 'Goblin', initiative: 7, type: 'npc' },
        ],
        events: [
          {
            id: 'e1', round: 1, type: 'damage', actorId: 'npc-2', actorName: 'Goblin Shaman',
            targetId: 'pc-1', targetName: 'Fighter', value: 8, damageType: 'piercing',
            hpBefore: 45, hpAfter: 37, isManualAdjustment: false, timestamp: '...'
          },
          {
            id: 'e2', round: 1, type: 'damage', actorId: 'pc-1', actorName: 'Fighter',
            targetId: 'npc-2', targetName: 'Goblin Shaman', value: 12, damageType: 'slashing',
            hpBefore: 22, hpAfter: 10, isManualAdjustment: false, timestamp: '...'
          },
          {
            id: 'e3', round: 1, type: 'healing', actorId: 'pc-2', actorName: 'Cleric',
            targetId: 'pc-1', targetName: 'Fighter', value: 6,
            hpBefore: 37, hpAfter: 43, isManualAdjustment: false, timestamp: '...'
          },
          {
            id: 'e4', round: 2, type: 'damage', actorId: 'npc-2', actorName: 'Goblin Shaman',
            targetId: 'pc-2', targetName: 'Cleric', value: 5, damageType: 'piercing',
            hpBefore: 38, hpAfter: 33, isManualAdjustment: false, timestamp: '...'
          },
          {
            id: 'e5', round: 2, type: 'damage', actorId: 'pc-1', actorName: 'Fighter',
            targetId: 'npc-2', targetName: 'Goblin Shaman', value: 10, damageType: 'slashing',
            hpBefore: 10, hpAfter: 0, isManualAdjustment: false, timestamp: '...'
          },
          {
            id: 'e6', round: 2, type: 'combatant-defeated', actorId: 'pc-1', actorName: 'Fighter',
            targetId: 'npc-2', targetName: 'Goblin Shaman', isManualAdjustment: false, timestamp: '...'
          }
        ]
      };

      const transcript = generateTranscript(log, 'Victory');

      // a) The header contains "ENCOUNTER:" and "Outcome: Victory"
      expect(transcript).toContain('ENCOUNTER: Goblin Ambush');
      expect(transcript).toContain('Outcome: Victory');

      // b) INITIATIVE ORDER lists Goblin Shaman first (18) and Goblin last (7)
      const initSection = transcript.split('INITIATIVE ORDER')[1].split('\n\n')[0];
      expect(initSection).toContain('1. Goblin Shaman — 18');
      expect(initSection).toContain('4. Goblin — 7');

      // c) ROUND 1 contains "Goblin Shaman" and "8" and "piercing"
      expect(transcript).toContain('ROUND 1');
      expect(transcript).toContain('Goblin Shaman\'s turn: Goblin Shaman dealt 8 piercing damage to Fighter');

      // d) ROUND 1 contains "Cleric healed Fighter for 6 HP"
      expect(transcript).toContain('Cleric\'s turn: Cleric healed Fighter for 6 HP');

      // e) ENCOUNTER SUMMARY -> DAMAGE DEALT section contains "Fighter" with slashing damage
      expect(transcript).toContain('DAMAGE DEALT');
      expect(transcript).toContain('Fighter: 22 total');
      expect(transcript).toContain('slashing: 22 (2 hits)');

      // f) ENCOUNTER SUMMARY -> HEALING section contains "Cleric healed Fighter"
      expect(transcript).toContain('HEALING');
      expect(transcript).toContain('Cleric healed Fighter for 6 HP (Round 1)');

      // g) ENCOUNTER SUMMARY -> COMBATANTS DEFEATED contains "Goblin Shaman (Round 2)"
      expect(transcript).toContain('COMBATANTS DEFEATED');
      expect(transcript).toContain('Goblin Shaman (Round 2)');
    });

    it('TEST 1.2 — Damage attribution follows active turn', () => {
      const log: ActiveCombatLog = {
        encounterId: 'enc-1', encounterName: 'Test', location: 'Test', startedAt: '...', currentRound: 1,
        partySnapshot: [], initiativeOrder: [],
        events: [
          {
            id: 'e1', round: 1, type: 'damage', actorId: 'goblin-1', actorName: 'Goblin',
            targetId: 'aria-1', targetName: 'Aria', value: 7, damageType: 'piercing',
            hpBefore: 30, hpAfter: 23, isManualAdjustment: false, timestamp: '...'
          }
        ]
      };

      const transcript = generateTranscript(log, 'Victory');
      expect(transcript).toContain('ROUND 1');
      expect(transcript).toContain('Goblin\'s turn: Goblin dealt 7 piercing damage to Aria');
      expect(transcript).not.toContain('Aria dealt');
    });

    it('TEST 1.3 — Source override produces correct attribution', () => {
      const log: ActiveCombatLog = {
        encounterId: 'enc-1', encounterName: 'Test', location: 'Test', startedAt: '...', currentRound: 1,
        partySnapshot: [], initiativeOrder: [],
        events: [
          {
            id: 'e1', round: 1, type: 'damage', actorId: 'lair-action', actorName: 'Lair Action',
            targetId: 'thorin-1', targetName: 'Thorin', value: 12, damageType: 'fire',
            actionType: 'lair-action', hpBefore: 50, hpAfter: 38, isManualAdjustment: false, timestamp: '...'
          }
        ]
      };

      const transcript = generateTranscript(log, 'Victory');
      expect(transcript).toContain('Lair Action: 12 fire damage to Thorin');
      // In formatEventDescription: if actorName is 'Lair Action' it is handled.
      // And in generateTranscript: it prepends actorName's turn if present.
      expect(transcript).toContain('Lair Action\'s turn: Lair Action: 12 fire damage to Thorin');
      expect(transcript).not.toContain('Thorin dealt');
    });

    it('TEST 1.4 — Condition duration pairing', () => {
      const log: ActiveCombatLog = {
        encounterId: 'enc-1', encounterName: 'Test', location: 'Test', startedAt: '...', currentRound: 2,
        partySnapshot: [], initiativeOrder: [],
        events: [
          {
            id: 'e1', round: 1, type: 'condition-applied', actorId: 'pc-1', actorName: 'Fighter',
            targetId: 'goblin-1', targetName: 'Goblin', condition: 'Prone', isManualAdjustment: false, timestamp: '...'
          },
          {
            id: 'e2', round: 2, type: 'condition-removed', actorId: 'goblin-1', actorName: 'Goblin',
            targetId: 'goblin-1', targetName: 'Goblin', condition: 'Prone', isManualAdjustment: false, timestamp: '...'
          }
        ]
      };

      const transcript = generateTranscript(log, 'Victory');
      expect(transcript).toContain('CONDITIONS');
      expect(transcript).toContain('Prone (applied Round 1, removed Round 2)');
    });

    it('TEST 1.5 — Manual adjustment flagged correctly', () => {
      const log: ActiveCombatLog = {
        encounterId: 'enc-1', encounterName: 'Test', location: 'Test', startedAt: '...', currentRound: 1,
        partySnapshot: [], initiativeOrder: [],
        events: [
          {
            id: 'e1', round: 1, type: 'manual-adjustment', actorId: null, actorName: null,
            targetId: 'aria-1', targetName: 'Aria', hpBefore: 30, hpAfter: 25, isManualAdjustment: true, timestamp: '...'
          }
        ]
      };

      const transcript = generateTranscript(log, 'Victory');
      expect(transcript).toContain('Aria: HP adjusted 30 -> 25 (manual correction)');
    });

    it('TEST 1.6 — Outcome determination reflects party state', () => {
      const log: ActiveCombatLog = {
        encounterId: 'enc-1', encounterName: 'Test', location: 'Test', startedAt: '...', currentRound: 1,
        partySnapshot: [], initiativeOrder: [], events: []
      };

      expect(generateTranscript(log, 'Victory')).toContain('Outcome: Victory');
      expect(generateTranscript(log, 'Defeat')).toContain('Outcome: Defeat');
      expect(generateTranscript(log, 'Incomplete')).toContain('Outcome: Incomplete');
    });

    it('TEST 1.7 — Non-default action type annotation', () => {
      const log: ActiveCombatLog = {
        encounterId: 'enc-1', encounterName: 'Test', location: 'Test', startedAt: '...', currentRound: 1,
        partySnapshot: [], initiativeOrder: [],
        events: [
          {
            id: 'e1', round: 1, type: 'damage', actorId: 'aria-1', actorName: 'Aria',
            targetId: 'goblin-1', targetName: 'Goblin', value: 8, damageType: 'slashing',
            actionType: 'opportunity-attack', hpBefore: 10, hpAfter: 2, isManualAdjustment: false, timestamp: '...'
          }
        ]
      };

      const transcript = generateTranscript(log, 'Victory');
      expect(transcript).toContain('Aria\'s turn: Aria used Opportunity Attack: dealt 8 slashing damage to Goblin');
    });

    it('TEST 1.8 — Resource changed event formatting', () => {
      const log: ActiveCombatLog = {
        encounterId: 'enc-1', encounterName: 'Test', location: 'Test', startedAt: '...', currentRound: 1,
        partySnapshot: [], initiativeOrder: [],
        events: [
          {
            id: 'e1', round: 1, type: 'resource-changed', actorId: null, actorName: null,
            targetId: 'aria-1', targetName: 'Aria', resourceName: 'Ki Points', resourceBefore: 3, resourceAfter: 2, resourceMax: 3, isManualAdjustment: true, timestamp: '...'
          },
          {
            id: 'e2', round: 1, type: 'resource-changed', actorId: null, actorName: null,
            targetId: 'aria-1', targetName: 'Aria', resourceName: 'Ki Points', resourceBefore: 2, resourceAfter: 3, resourceMax: 3, isManualAdjustment: true, timestamp: '...'
          }
        ]
      };

      const transcript = generateTranscript(log, 'Victory');
      expect(transcript).toContain('Aria: Ki Points 3 -> 2');
      expect(transcript).toContain('Aria: Ki Points 2 -> 3 (restored)');
    });

    it('TEST 1.9 — Death save event formatting', () => {
      const log: ActiveCombatLog = {
        encounterId: 'enc-1', encounterName: 'Test', location: 'Test', startedAt: '...', currentRound: 1,
        partySnapshot: [], initiativeOrder: [],
        events: [
          {
            id: 'e1', round: 1, type: 'death-save', actorId: null, actorName: null,
            targetId: 'aria-1', targetName: 'Aria', condition: 'success',
            resourceName: 'Death Save Successes', resourceBefore: 0, resourceAfter: 1, resourceMax: 3, isManualAdjustment: false, timestamp: '...'
          },
          {
            id: 'e2', round: 1, type: 'death-save', actorId: null, actorName: null,
            targetId: 'aria-1', targetName: 'Aria', condition: 'failure',
            resourceName: 'Death Save Failures', resourceBefore: 1, resourceAfter: 2, resourceMax: 3, isManualAdjustment: false, timestamp: '...'
          }
        ]
      };

      const transcript = generateTranscript(log, 'Victory');
      expect(transcript).toContain('Aria rolled a death saving throw: Success (Death Save Successes: 0 -> 1)');
      expect(transcript).toContain('Aria rolled a death saving throw: Failure (Death Save Failures: 1 -> 2)');
    });
  });
});
