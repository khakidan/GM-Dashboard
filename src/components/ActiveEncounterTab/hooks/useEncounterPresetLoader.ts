import { useAppState, getSnapshot } from '../../../hooks/useAppState';
import { toast } from 'sonner';
import { Combatant, Encounter, EncounterCombatant, NPC } from '../../../types';
import { addNpcDB, addEncounterCombatantDB } from '../../../services/dbOperations';
import { parseRechargeOn, buildSingleNpcCombatant } from '../../../lib/combatantBuilder';

export function useEncounterPresetLoader(
  encounter: Encounter | undefined,
  updateCombatant: (id: string, updates: Partial<Combatant>) => Promise<void>
) {
  const { state, updateState } = useAppState();

  const handleAddPreset = async (type: 'pc' | 'npc', selectedPreset: string, presetQuantity: number) => {
    const preUpdateSnapshot = getSnapshot();
    let targetName = type === 'pc' ? 'character' : 'NPC';

    try {
      const actualQty = type === 'pc' ? 1 : presetQuantity;
      const tempEcIds = Array.from({ length: actualQty }, (_, idx) => `temp-ec-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

      let newCombatants: Combatant[] = [];
      let newEcObjects: EncounterCombatant[] = [];

      if (type === 'pc') {
        const c = state.characters.find(char => char.id === selectedPreset);
        if (c) {
          targetName = c.characterName;
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
          targetName = npcTemplate.name;
          for (let i = 0; i < actualQty; i++) {
            const combatantId = `combat-npc-${npcTemplate.id}-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const combatant = buildSingleNpcCombatant(
              npcTemplate,
              {
                id: combatantId,
                encounterCombatantId: tempEcIds[i],
                name: `${npcTemplate.name}${actualQty > 1 ? ` ${i + 1}` : ''}`,
                npcId: npcTemplate.id,
              }
            );
            newCombatants.push(combatant);
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

      const npcTemplate = type === 'npc' ? state.npcs.find(n => n.id === selectedPreset) : undefined;
      const ecResList = await addEncounterCombatantDB(
        encounter?.id || '',
        type === 'pc' ? selectedPreset : null,
        type === 'npc' ? selectedPreset : null,
        presetQuantity,
        type === 'npc' ? (npcTemplate?.legendaryActions ?? 0) : undefined,
        type === 'npc' ? (npcTemplate?.legendaryResistances ?? 0) : undefined
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
      updateState(prev => ({
        ...prev,
        encounterCombatants: preUpdateSnapshot.encounterCombatants,
        combatState: {
          ...prev.combatState,
          combatants: preUpdateSnapshot.combatState.combatants,
        }
      }));
      toast.error(`Failed to add ${targetName} to the encounter. Please try again.`, {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      console.error('[DB Error]', error);
      throw error;
    }
  };

  const handleAddNpc = async (
    npcData: Omit<NPC, 'id' | 'sheetRowIndex'>
  ) => {
    const preUpdateSnapshot = getSnapshot();
    try {
      const nextIdStr = `temp-npc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const nextEcId = `temp-ec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const combatantId = `combat-npc-${nextIdStr}-0-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newNpcCombatant = buildSingleNpcCombatant(
        npcData as NPC,
        {
          id: combatantId,
          encounterCombatantId: nextEcId.toString(),
          name: npcData.name,
          npcId: nextIdStr,
          currentHp: npcData.maxHp, // handleAddNpc explicitly sets currentHp to maxHp
        }
      );

      updateState(prev => ({
        ...prev,
        npcs: [
          ...prev.npcs,
          {
            ...npcData,
            id: nextIdStr,
            tempHp: 0,
            currentHp: npcData.maxHp,
            conditions: '',
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

      const newNpc = await addNpcDB(npcData);
      const newEcArray = await addEncounterCombatantDB(
        encounter?.id || '',
        null,
        newNpc.id,
        1,
        newNpc.legendaryActions ?? 0,
        newNpc.legendaryResistances ?? 0
      );
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
      updateState(prev => ({
        ...prev,
        npcs: preUpdateSnapshot.npcs,
        encounterCombatants: preUpdateSnapshot.encounterCombatants,
        combatState: {
          ...prev.combatState,
          combatants: preUpdateSnapshot.combatState.combatants,
        }
      }));
      toast.error(`Failed to add ${npcData.name} to the encounter. Please try again.`, {
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
