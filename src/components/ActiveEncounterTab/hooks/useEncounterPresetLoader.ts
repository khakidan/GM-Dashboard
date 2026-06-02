import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { toast } from 'sonner';
import { Combatant, Encounter, EncounterCombatant } from '../../../types';
import { addNpcDB, addEncounterCombatantDB } from '../../../services/dbOperations';

export function useEncounterPresetLoader(
  encounter: Encounter | undefined,
  updateCombatant: (id: string, updates: Partial<Combatant>) => Promise<void>
) {
  const { state, updateState } = useAppState();

  const handleAddPreset = async (type: 'pc' | 'npc', selectedPreset: string, presetQuantity: number) => {
    try {
      const actualQty = type === 'pc' ? 1 : presetQuantity;
      const tempEcIds = Array.from({ length: actualQty }, (_, idx) => `temp-ec-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

      let newCombatants: Combatant[] = [];
      let newEcObjects: EncounterCombatant[] = [];

      if (type === 'pc') {
        const c = state.characters.find(char => char.id === selectedPreset);
        if (c) {
          newCombatants.push({
            id: `combat-pc-${c.id}`,
            encounterCombatantId: tempEcIds[0],
            characterId: c.id,
            name: c.characterName,
            type: 'pc',
            initiative: 0,
            ac: c.ac,
            maxHp: c.maxHp,
            currentHp: c.currentHp,
            tempHp: c.tempHp,
            conditions: c.conditions,
            notes: c.notes,
            passivePerception: c.passivePerception,
            reactionUsed: false,
          });
          newEcObjects.push({
            id: tempEcIds[0],
            encounterId: encounter?.id || '',
            playerId: selectedPreset,
            npcId: null,
            quantity: 1,
            npcCurrentHp: -1,
            npcTempHp: 0,
          });
        }
      } else {
        const npcTemplate = state.npcs.find(n => n.id === selectedPreset);
        if (npcTemplate) {
          for (let i = 0; i < actualQty; i++) {
            const combatantId = `combat-npc-${npcTemplate.id}-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            newCombatants.push({
              id: combatantId,
              encounterCombatantId: tempEcIds[i],
              name: `${npcTemplate.name}${actualQty > 1 ? ` ${i + 1}` : ''}`,
              type: 'npc',
              initiative: 0,
              ac: npcTemplate.ac,
              maxHp: npcTemplate.maxHp,
              currentHp: npcTemplate.currentHp,
              tempHp: npcTemplate.tempHp,
              conditions: npcTemplate.conditions,
              notes: npcTemplate.notes,
              passivePerception: 10,
              resistances: npcTemplate.resistances,
              immunities: npcTemplate.immunities,
              vulnerabilities: npcTemplate.vulnerabilities,
              reactionUsed: false,
              legendaryActions: 
                npcTemplate.legendaryActions && npcTemplate.legendaryActions > 0
                ? { 
                    max: npcTemplate.legendaryActions, 
                    remaining: npcTemplate.legendaryActions 
                  }
                : undefined,
              legendaryResistances: 
                npcTemplate.legendaryResistances && npcTemplate.legendaryResistances > 0
                ? { 
                    max: npcTemplate.legendaryResistances, 
                    remaining: npcTemplate.legendaryResistances 
                  }
                : undefined,
              rechargeAbilities: 
                npcTemplate.rechargeAbilities?.length
                ? npcTemplate.rechargeAbilities.map(a => ({
                    name: a.name,
                    rechargeOn: a.rechargeOn,
                    isCharged: true,
                  }))
                : undefined,
            });
            newEcObjects.push({
              id: tempEcIds[i],
              encounterId: encounter?.id || '',
              playerId: null,
              npcId: selectedPreset,
              quantity: 1,
              npcCurrentHp: -1,
              npcTempHp: 0,
            });
          }
        }
      }

      updateState(prev => ({
        ...prev,
        encounterCombatants: [
          ...prev.encounterCombatants,
          ...newEcObjects,
        ],
        combatState: {
          ...prev.combatState,
          combatants: [...prev.combatState.combatants, ...newCombatants],
        },
      }));

      const ecResList = await addEncounterCombatantDB(
        encounter?.id || '',
        type === 'pc' ? selectedPreset : null,
        type === 'npc' ? selectedPreset : null,
        presetQuantity
      );

      updateState(prev => {
        const nextCombatants = prev.combatState.combatants.map(c => {
          const tempIdx = tempEcIds.indexOf(c.encounterCombatantId || '');
          if (tempIdx !== -1 && ecResList[tempIdx]) {
            return { ...c, encounterCombatantId: ecResList[tempIdx].id };
          }
          return c;
        });

        const nextEc = prev.encounterCombatants.map(ec => {
          const tempIdx = tempEcIds.indexOf(ec.id);
          if (tempIdx !== -1 && ecResList[tempIdx]) {
            return { 
              ...ec, 
              id: ecResList[tempIdx].id,
              npcCurrentHp: ecResList[tempIdx].npcCurrentHp ?? ec.npcCurrentHp,
              npcTempHp: ecResList[tempIdx].npcTempHp ?? ec.npcTempHp
            };
          }
          return ec;
        });

        return {
          ...prev,
          encounterCombatants: nextEc,
          combatState: {
            ...prev.combatState,
            combatants: nextCombatants,
          }
        };
      });
    } catch (error: any) {
      updateState(() => {
        const snap = getSnapshot();
        return snap;
      });
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      console.error('[DB Error]', error);
      throw error;
    }
  };

  const handleAddNpc = async (
    npcName: string, 
    npcHp: number | '', 
    npcAc: number | '', 
    npcNotes: string,
    resistances: string,
    immunities: string,
    vulnerabilities: string
  ) => {
    try {
      const nextIdStr = `temp-npc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const nextEcId = `temp-ec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const newNpcCombatant: Combatant = {
        id: `combat-npc-${nextIdStr}-0-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        encounterCombatantId: nextEcId.toString(),
        name: npcName,
        type: 'npc',
        ac: npcAc === '' ? 10 : npcAc,
        maxHp: npcHp as number,
        currentHp: npcHp as number,
        passivePerception: 10,
        initiative: 0,
        notes: npcNotes,
        resistances: resistances,
        immunities: immunities,
        vulnerabilities: vulnerabilities,
        reactionUsed: false,
      };

      updateState(prev => ({
        ...prev,
        npcs: [
          ...prev.npcs,
          {
            id: nextIdStr,
            name: npcName,
            ac: npcAc === '' ? 10 : npcAc,
            maxHp: npcHp as number,
            tempHp: 0,
            currentHp: npcHp as number,
            conditions: '',
            notes: npcNotes,
            resistances: resistances,
            immunities: immunities,
            vulnerabilities: vulnerabilities,
          },
        ],
        encounterCombatants: [
          ...prev.encounterCombatants,
          {
            id: nextEcId.toString(),
            encounterId: encounter?.id || '',
            playerId: null,
            npcId: nextIdStr,
            quantity: 1,
            npcCurrentHp: -1,
            npcTempHp: 0,
          },
        ],
        combatState: {
          ...prev.combatState,
          combatants: [...prev.combatState.combatants, newNpcCombatant].sort(
            (a, b) => b.initiative - a.initiative
          ),
        },
      }));

      const newNpc = await addNpcDB(
        npcName, 
        npcHp as number, 
        npcAc === '' ? 10 : npcAc, 
        npcNotes, 
        resistances, 
        immunities, 
        vulnerabilities
      );
      const newEcArray = await addEncounterCombatantDB(encounter?.id || '', null, newNpc.id, 1);
      const newEc = newEcArray[0];

      updateState(prev => ({
        ...prev,
        npcs: prev.npcs.map(n => (n.id === nextIdStr ? { ...n, id: newNpc.id } : n)),
        encounterCombatants: prev.encounterCombatants.map(ec =>
          ec.id === nextEcId ? { ...ec, id: newEc.id, npcId: newNpc.id } : ec
        ),
        combatState: {
          ...prev.combatState,
          combatants: prev.combatState.combatants.map(c =>
            c.id === newNpcCombatant.id ? { ...c, encounterCombatantId: newEc.id } : c
          ),
        },
      }));
    } catch (error: any) {
      updateState(() => {
        const snap = getSnapshot();
        return snap;
      });
      toast.error('Failed to save changes. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      console.error('[DB Error]', error);
      throw error;
    }
  };

  return {
    handleAddPreset,
    handleAddNpc,
  };
}
