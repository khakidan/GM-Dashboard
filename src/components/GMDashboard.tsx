// src/components/GMDashboard.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { Swords, Eye, Users, Map, RefreshCw, PanelLeftClose, PanelLeft, Menu, AlertCircle, Info, LogIn, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { PartyTab } from './PartyTab';
import { NpcLibraryTab } from './NpcLibraryTab';
import { EncountersTab } from './EncountersTab';
import { ActiveEncounterTab } from './ActiveEncounterTab';
import {
  initGoogleAuth,
  fetchSheetData,
  initializeDatabaseSchema,
  getSpreadsheetId,
  setSpreadsheetId,
  hasToken,
  signInWithRedirect,
  setManualRefreshToken, // ✅ replaces setManualToken
  clearTokens,
} from '../services/sheetsService';
import { Character, Encounter, Combatant, NPC, EncounterCombatant } from '../types';
import { Settings, X, Save } from 'lucide-react';
import {
  CharacterRowSchema,
  NpcRowSchema,
  EncounterRowSchema,
  EncounterCombatantRowSchema,
  StatusRowSchema,
  DifficultyRowSchema,
} from '../lib/sheetSchemas';

type Tab = 'party' | 'encounters' | 'npc-library' | 'combat';

export function GMDashboard() {
  const { state, updateState } = useAppState();
  const [activeTab, setActiveTab] = useState<Tab>('party');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const stored = localStorage.getItem('gm_sidebar_open');
    return stored !== null ? stored === 'true' : false;
  });

  const setSidebarOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    setIsSidebarOpen(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem('gm_sidebar_open', String(next));
      return next;
    });
  };
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempSpreadsheetId, setTempSpreadsheetId] = useState(getSpreadsheetId());
  const [manualToken, setManualTokenState] = useState('');
  const [showAdvancedAuth, setShowAdvancedAuth] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  const addLog = (msg: string) => {
    console.log(msg);
    setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    let mounted = true;
    initGoogleAuth()
      .then(() => {
        if (mounted) {
          setIsGoogleConnected(hasToken());
          if (hasToken()) {
            addLog('Checking connection to Google Sheets...');
            handleSyncWithSheets(false).catch(() => {
              addLog("Background sync skipped. Click 'Pull from Sheets' when ready.");
            });
          } else {
            addLog("Welcome! Click 'Connect & Sync' to link your Google account.");
          }
        }
      })
      .catch(() => {
        addLog('Authentication module could not be initialized.');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSyncWithSheets = async (isManual = true) => {
    const sid = getSpreadsheetId();
    if (isManual) {
      setSyncLogs([]);
      setIsSyncing(true);
    }

    addLog(`Sync process started for: ${sid}`);
    setSyncError(null);

    try {
      addLog('Step 1: Validating authentication...');
      await initializeDatabaseSchema();
      addLog('Authentication valid. Schema verified.');

      // 1. Fetch Statuses
      addLog('Step 2: Fetching status definitions...');
      const statusRes = await fetchSheetData('Status!A2:B');
      const statuses = (statusRes.values || []).reduce((acc: any, row: any[], i: number) => {
        const parsed = StatusRowSchema.safeParse(row);
        if (!parsed.success) {
          console.warn(`[GMDashboard] Validation failed for Status row ${i + 2}:`, parsed.error);
          return acc;
        }
        acc[parsed.data[0]] = parsed.data[1];
        return acc;
      }, {});
      addLog(`Status types loaded: ${Object.keys(statuses).length}`);

      // 2. Fetch Difficulties
      addLog('Step 3: Fetching difficulty levels...');
      const diffRes = await fetchSheetData('Difficulty_Level!A2:B');
      const difficulties = (diffRes.values || []).reduce((acc: any, row: any[], i: number) => {
        const parsed = DifficultyRowSchema.safeParse(row);
        if (!parsed.success) {
          console.warn(`[GMDashboard] Validation failed for Difficulty_Level row ${i + 2}:`, parsed.error);
          return acc;
        }
        acc[parsed.data[0]] = parsed.data[1];
        return acc;
      }, {});
      addLog(`Difficulty settings loaded: ${Object.keys(difficulties).length}`);

      // 3. Fetch NPCs
      addLog('Step 4: Loading NPC library...');
      const npcRes = await fetchSheetData('NPCs!A2:K');
      const parsedNPCs: NPC[] = [];
      (npcRes.values || []).forEach((row: any[], i: number) => {
        const parsed = NpcRowSchema.safeParse(row);
        if (!parsed.success) {
          console.warn(`[GMDashboard] Validation failed for NPCs row ${i + 2}:`, parsed.error);
          return;
        }
        const [id, name, ac, maxHp, tempHp, currentHp, conditions, notes, resistances, immunities, vulnerabilities] = parsed.data;
        parsedNPCs.push({
          id,
          name,
          ac,
          maxHp,
          tempHp,
          currentHp,
          conditions,
          notes,
          resistances: resistances || '',
          immunities: immunities || '',
          vulnerabilities: vulnerabilities || '',
        });
      });
      addLog(`NPC entries loaded: ${parsedNPCs.length}`);

      // 4. Fetch Characters
      addLog('Step 5: Fetching character roster...');
      const charactersResponse = await fetchSheetData('Characters!A2:O');
      const characterRows = charactersResponse.values || [];
      addLog(`Character rows found: ${characterRows.length}`);

      // 5. Fetch Encounters
      addLog('Step 6: Loading encounter log...');
      const encountersResponse = await fetchSheetData('Encounters!A2:E');
      const encounterRows = encountersResponse.values || [];
      addLog(`Encounters found: ${encounterRows.length}`);

      const parsedEncounters: Encounter[] = [];
      encounterRows.forEach((row: any[], i: number) => {
        const parsed = EncounterRowSchema.safeParse(row);
        if (!parsed.success) {
          console.warn(`[GMDashboard] Validation failed for Encounters row ${i + 2}:`, parsed.error);
          return;
        }
        const [id, name, location, difficultyId, npcDefinitions] = parsed.data;
        parsedEncounters.push({
          id,
          name,
          location,
          difficultyId,
          difficultyName: difficulties[difficultyId.toString()] || 'Unknown',
          npcDefinitions,
          status: 'planned',
          sheetRowIndex: i + 1,
        });
      });

      // 6. Fetch Encounter Combatants
      addLog('Step 7: Synching active combatants...');
      let parsedEncounterCombatants: EncounterCombatant[] = [];
      try {
        const ecResponse = await fetchSheetData('Encounter_Combatants!A2:G');
        const ecRows = ecResponse.values || [];
        ecRows.forEach((row: any[], i: number) => {
          const parsed = EncounterCombatantRowSchema.safeParse(row);
          if (!parsed.success) {
            console.warn(`[GMDashboard] Validation failed for Encounter_Combatants row ${i + 2}:`, parsed.error);
            return;
          }
          const [id, encounterId, playerId, npcId, quantity, initiative, conditionTimers] = parsed.data;
          parsedEncounterCombatants.push({
            id,
            encounterId,
            playerId,
            npcId,
            quantity,
            initiative: initiative || 0,
            conditionTimers: conditionTimers || '',
            sheetRowIndex: i + 1,
          });
        });
        addLog(`Combatant links loaded: ${parsedEncounterCombatants.length}`);
      } catch (err) {
        addLog('Relational combatant data skipped.');
      }

      updateState(prev => {
        const parsedCharacters: Character[] = [];
        characterRows.forEach((row: any[], i: number) => {
          const parsed = CharacterRowSchema.safeParse(row);
          if (!parsed.success) {
            console.warn(`[GMDashboard] Validation failed for Characters row ${i + 2}:`, parsed.error);
            return;
          }
          const [id, playerName, characterName, ac, maxHp, tempHp, currentHp, conditions, passivePerception, level, statusId, notes, resistances, immunities, vulnerabilities] = parsed.data;
          parsedCharacters.push({
            id,
            playerName,
            characterName,
            ac,
            maxHp,
            tempHp,
            currentHp,
            conditions,
            passivePerception,
            level,
            statusId,
            statusName: statuses[statusId.toString()] || 'Unknown',
            notes,
            isActive: statusId === 1,
            sheetRowIndex: i + 2,
            resistances: resistances || '',
            immunities: immunities || '',
            vulnerabilities: vulnerabilities || '',
          });
        });

        return {
          ...prev,
          characters: parsedCharacters.length > 0 ? parsedCharacters : prev.characters,
          encounters: parsedEncounters.length > 0 ? parsedEncounters : prev.encounters,
          npcs: parsedNPCs.length > 0 ? parsedNPCs : prev.npcs,
          encounterCombatants: parsedEncounterCombatants.length > 0 ? parsedEncounterCombatants : prev.encounterCombatants,
          statuses,
          difficulties,
        };
      });

      setLastSyncTime(new Date());
      setIsGoogleConnected(true);
      addLog('Sync successful. Campaign data is now local.');

    } catch (error: any) {
      console.error('[GMDashboard] Sync failed:', error);

      if (error.message === 'UNAUTHENTICATED') {
        addLog('ERROR: Login Session Expired.');
        setIsGoogleConnected(false);
        setSyncError('Your login session has expired. Please sign in with Google again.');
      } else {
        addLog(`ERROR: ${error.message}`);
        setSyncError(error.message || 'Connection failed. Please check your internet and spreadsheet ID.');
      }

      if (isManual) setIsSyncing(true);
    } finally {
      if (!isManual) setIsSyncing(false);
      if (isManual && !syncError) {
        setTimeout(() => setIsSyncing(false), 800);
      }
    }
  };

  const startEncounter = async (id: string) => {
    const encounter = state.encounters.find(e => e.id === id);
    if (!encounter) return;

    let combatants: Combatant[] = [];
    const linkedCombatants = state.encounterCombatants.filter(ec => ec.encounterId === id);

    if (linkedCombatants.length > 0) {
      linkedCombatants.forEach(ec => {
        let parsedTimers: Record<string, number> = {};
        if (ec.conditionTimers) {
          try {
            parsedTimers = JSON.parse(ec.conditionTimers);
          } catch (e) {
            console.warn('Failed to parse conditionTimers JSON:', ec.conditionTimers, e);
          }
        }

        if (ec.playerId) {
          const c = state.characters.find(char => char.id === ec.playerId);
          if (c) {
            combatants.push({
              id: `combat-pc-${c.id}`,
              encounterCombatantId: ec.id,
              characterId: c.id,
              name: c.characterName,
              type: 'pc',
              initiative: ec.initiative || 0,
              ac: c.ac,
              maxHp: c.maxHp,
              currentHp: c.currentHp,
              tempHp: c.tempHp,
              conditions: c.conditions,
              notes: c.notes,
              passivePerception: c.passivePerception,
              sheetColHp: 'G',
              sheetColTempHp: 'F',
              sheetColCondition: 'H',
              hpSheetName: 'Characters',
              hpSheetRowIndex: c.sheetRowIndex,
              resistances: c.resistances || '',
              immunities: c.immunities || '',
              vulnerabilities: c.vulnerabilities || '',
              conditionTimers: parsedTimers,
            });
          }
        } else if (ec.npcId) {
          const npcTemplate = state.npcs.find(n => n.id === ec.npcId);
          if (npcTemplate) {
            for (let i = 0; i < ec.quantity; i++) {
              combatants.push({
                id: `combat-npc-${npcTemplate.id}-${i}-${Date.now()}`,
                encounterCombatantId: ec.id,
                name: `${npcTemplate.name}${ec.quantity > 1 ? ` ${i + 1}` : ''}`,
                type: 'npc',
                initiative: ec.initiative || 0,
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
                conditionTimers: parsedTimers,
              });
            }
          }
        }
      });
    } else {
      // Fallback: add all active characters
      const activePcs = state.characters.filter(c => c.isActive);
      activePcs.forEach(c => {
        combatants.push({
          id: `combat-pc-${c.id}`,
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
          sheetColHp: 'G',
          sheetColTempHp: 'F',
          sheetColCondition: 'H',
          hpSheetName: 'Characters',
          hpSheetRowIndex: c.sheetRowIndex,
          resistances: c.resistances || '',
          immunities: c.immunities || '',
          vulnerabilities: c.vulnerabilities || '',
          conditionTimers: {},
        });
      });
    }

    updateState(prev => ({
      ...prev,
      combatState: {
        activeEncounterId: encounter.id,
        combatants,
        activeTurnId: null,
        round: 1,
      },
    }));

    setActiveTab('combat');
  };

  const clearEncounter = () => {
    updateState(prev => ({
      ...prev,
      combatState: {
        ...prev.combatState,
        activeEncounterId: null,
      },
    }));
    setActiveTab('encounters');
  };

  return (
    <div className="w-full h-[100dvh] bg-[#fdfaf5] flex overflow-hidden font-serif select-none relative">

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-[#2c2c26]/60 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={cn(
        'bg-[#2c2c26] text-[#e5e1d8] flex flex-col border-r border-[#1a1a14] transition-all duration-300 z-40 fixed h-full lg:relative shrink-0',
        isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
      )}>
        <button
          id="sidebar-toggle-btn"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-6 bg-[#3f3f37] border border-[#1a1a14] p-1.5 rounded-full text-white hover:bg-[#5a5a40] transition-colors z-20"
        >
          {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-white/50 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-4 h-24 flex items-center justify-center">
          {isSidebarOpen ? (
            <div className="w-full px-4">
              <h1 className="text-xl font-bold tracking-tight text-[#c5b358]">GAME MASTER</h1>
              <div className="mt-0.5 text-[9px] uppercase tracking-widest opacity-50 font-sans">Campaign Hub</div>
            </div>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-3 hover:bg-[#3f3f37] rounded-xl text-[#c5b358] transition-all active:scale-95"
              title="Open Sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => {
              setActiveTab('party');
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            className={cn(
              'w-full text-left p-3 flex items-center transition-colors rounded-lg',
              activeTab === 'party' ? 'bg-[#3f3f37] text-white' : 'hover:bg-[#3f3f37]/50 opacity-70',
              isSidebarOpen ? 'gap-3' : 'justify-center'
            )}
            title="Party Roster"
          >
            {activeTab === 'party' && isSidebarOpen && <div className="w-2 h-2 rounded-full bg-[#c5b358] shrink-0"></div>}
            <Users className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-bold font-sans line-clamp-1">Party Roster</span>}
          </button>

          <button
            onClick={() => {
              setActiveTab('encounters');
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            className={cn(
              'w-full text-left p-3 flex items-center transition-colors rounded-lg',
              activeTab === 'encounters' ? 'bg-[#3f3f37] text-white' : 'hover:bg-[#3f3f37]/50 opacity-70',
              isSidebarOpen ? 'gap-3' : 'justify-center'
            )}
            title="Encounters"
          >
            {activeTab === 'encounters' && isSidebarOpen && <div className="w-2 h-2 rounded-full bg-[#c5b358] shrink-0"></div>}
            <Map className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-bold font-sans line-clamp-1">Encounters</span>}
          </button>

          <button
            id="nav-npc-library"
            onClick={() => {
              setActiveTab('npc-library');
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            className={cn(
              'w-full text-left p-3 flex items-center transition-colors rounded-lg',
              activeTab === 'npc-library' ? 'bg-[#3f3f37] text-white' : 'hover:bg-[#3f3f37]/50 opacity-70',
              isSidebarOpen ? 'gap-3' : 'justify-center'
            )}
            title="NPC Library"
          >
            {activeTab === 'npc-library' && isSidebarOpen && <div className="w-2 h-2 rounded-full bg-[#c5b358] shrink-0"></div>}
            <BookOpen className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-bold font-sans line-clamp-1">NPC Library</span>}
          </button>

          <button
            onClick={() => {
              if (state.combatState.activeEncounterId) {
                setActiveTab('combat');
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }
            }}
            disabled={!state.combatState.activeEncounterId}
            className={cn(
              'w-full text-left p-3 flex items-center transition-colors rounded-lg',
              activeTab === 'combat' ? 'bg-[#3f3f37] text-white' : (state.combatState.activeEncounterId ? 'hover:bg-[#3f3f37]/50 opacity-70' : 'opacity-30 cursor-not-allowed'),
              isSidebarOpen ? 'gap-3' : 'justify-center'
            )}
            title="Active Combat"
          >
            {activeTab === 'combat' && isSidebarOpen && <div className="w-2 h-2 rounded-full bg-[#c5b358] shrink-0"></div>}
            <Swords className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-bold font-sans line-clamp-1">Active Combat</span>}
          </button>

          <button
            id="app-settings-btn"
            onClick={() => {
              setIsSettingsOpen(true);
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            className={cn(
              'w-full text-left p-3 flex items-center transition-colors rounded-lg hover:bg-[#3f3f37]/50 opacity-70',
              isSidebarOpen ? 'gap-3' : 'justify-center'
            )}
            title="App Settings"
          >
            <Settings className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-bold font-sans line-clamp-1">Settings</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-[#3f3f37]">
          {isSidebarOpen ? (
            <div className="flex flex-col gap-3 p-3 bg-[#1a1a14] rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#5a5a40] flex items-center justify-center text-xs font-bold font-sans text-white shrink-0">G</div>
                <div className="overflow-hidden">
                  <div className="text-sm font-bold font-sans truncate">Google Sheets</div>
                  <div className={cn(
                    'text-[9px] uppercase tracking-widest font-bold truncate',
                    lastSyncTime ? 'text-green-500' : 'text-yellow-500'
                  )}>
                    {lastSyncTime
                      ? `Synced ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Not Synced'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSyncWithSheets(true)}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 w-full bg-[#3f3f37] hover:bg-[#5a5a40] text-[#e5e1d8] rounded-md py-2 text-[10px] font-sans font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-3 h-3 shrink-0', isSyncing && 'animate-spin')} />
                {isSyncing ? 'Syncing...' : hasToken() ? 'Pull from Sheets' : 'Connect & Sync'}
              </button>
              {syncError && <div className="text-[10px] text-red-400 font-sans mt-1 leading-tight">{syncError}</div>}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-2">
              <div
                title={lastSyncTime ? `Synced ${lastSyncTime.toLocaleTimeString()}` : 'Not Synced'}
                className="w-8 h-8 rounded-full bg-[#5a5a40] flex items-center justify-center text-xs font-bold font-sans text-white shrink-0 relative"
              >
                G
                <div className={cn('absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#2c2c26]', lastSyncTime ? 'bg-green-500' : 'bg-yellow-500')}></div>
              </div>
              <button
                onClick={() => handleSyncWithSheets()}
                disabled={isSyncing}
                title="Pull from Sheets"
                className="p-2 bg-[#3f3f37] hover:bg-[#5a5a40] rounded-full text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 lg:h-20 shrink-0 border-b border-[#e5e1d8] px-4 lg:px-8 flex items-center justify-between bg-white/80 lg:bg-white/50 backdrop-blur-md sticky top-0 z-10 transition-all">
          <div className="flex-1 max-w-lg mr-4 group flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-[#5a5a40] hover:bg-black/5 rounded">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg lg:text-xl font-bold text-[#2c2c26] px-2 py-1">
              GM Encounter Dashboard
            </h2>
          </div>
        </header>

        {/* Dashboard Content */}
        <section className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'combat' && state.combatState.activeEncounterId ? (
              <ActiveEncounterTab onBack={clearEncounter} />
            ) : activeTab === 'party' ? (
              <PartyTab />
            ) : activeTab === 'npc-library' ? (
              <NpcLibraryTab />
            ) : (
              <EncountersTab onSelectEncounter={startEncounter} onSyncRequested={handleSyncWithSheets} />
            )}
          </div>
        </section>
      </main>

      {/* Syncing Overlay */}
      {isSyncing && (
        <div className="fixed inset-0 bg-[#2c2c26]/80 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="bg-[#fdfaf5] w-full max-w-xl rounded-2xl shadow-2xl p-8 flex flex-col gap-6 border border-[#e5e1d8] text-left">
            <div className="flex flex-col items-center text-center gap-4">
              <RefreshCw className="w-12 h-12 text-[#c5b358] animate-spin" />
              <div>
                <h3 className="text-xl font-bold text-[#2c2c26] font-serif uppercase tracking-wider">Synchronizing Data</h3>
                <p className="text-sm text-[#5a5a40] font-sans mt-1">Fetching campaign information from Google Sheets...</p>
              </div>
            </div>

            <div className="bg-[#2c2c26] rounded-xl p-4 font-mono text-[11px] text-[#e5e1d8]/80 h-48 overflow-y-auto flex flex-col gap-1 border border-black/20">
              {syncLogs.length === 0 && <span className="opacity-40 animate-pulse">Initializing connection...</span>}
              {syncLogs.map((log, i) => (
                <div key={i} className="border-l-2 border-[#c5b358]/30 pl-2 leading-relaxed">
                  {log}
                </div>
              ))}
              {syncError && (
                <div className="mt-4 p-5 bg-red-900/40 border border-red-500/50 rounded-xl shadow-inner">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-red-200 shrink-0" />
                    <div>
                      <p className="text-red-100 font-sans font-bold text-sm">Action Required</p>
                      <p className="text-red-200/80 font-sans text-xs mt-1 leading-relaxed">
                        {syncError.includes('UNAUTHENTICATED')
                          ? 'Your session has expired. To maintain background sync, we need you to sign in again using the persistent flow.'
                          : "We couldn't connect to Google. This often happens if the spreadsheet ID is wrong or your session is stale."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setSyncError(null);
                        addLog('Initiating Persistent Auth via Redirect...');
                        signInWithRedirect();
                      }}
                      className="bg-[#c5b358] hover:bg-[#b09f4d] text-white px-4 py-3 rounded-xl font-bold font-sans uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Reconnect with Google
                    </button>

                    <button
                      onClick={() => setIsSyncing(false)}
                      className="text-white/40 hover:text-white/60 text-[9px] uppercase tracking-tighter font-bold py-2"
                    >
                      Dismiss and continue offline
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-[#5a5a40] font-bold opacity-60">
                {isGoogleConnected ? 'Connected to Google Account' : 'Accessing Google Services...'}
              </div>
              <button
                onClick={() => setIsSyncing(false)}
                className="text-[10px] uppercase tracking-widest text-red-500 font-bold hover:underline"
              >
                Cancel Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#fdfaf5] w-full max-w-lg rounded-2xl shadow-2xl border border-[#e5e1d8] overflow-hidden flex flex-col">
            <div className="bg-[#2c2c26] p-6 text-[#e5e1d8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-[#c5b358]" />
                <h2 className="text-xl font-bold font-serif uppercase tracking-wider">App Settings</h2>
              </div>
              <button
                onClick={() => {
                  setTempSpreadsheetId(getSpreadsheetId());
                  setIsSettingsOpen(false);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-[#f5f5f0] border-2 border-[#e5e1d8] rounded-2xl p-5 mb-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#2c2c26] mb-1">Google Connection</h3>
                    <p className="text-[10px] text-[#5a5a40]">
                      {isGoogleConnected
                        ? 'Currently connected to Google Services.'
                        : 'Sign in to sync your campaign data with Google Sheets.'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {!isGoogleConnected ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={async () => {
                            try {
                              console.log('[Auth] Initiating Redirect Flow...');
                              signInWithRedirect();
                            } catch (err: any) {
                              console.error('[Auth] Redirect Error:', err);
                              alert(`Failed to start login: ${err.message}`);
                            }
                          }}
                          className="bg-[#c5b358] hover:bg-[#b09f4d] text-white px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          Sign In with Google
                        </button>
                        <p className="text-[9px] text-[#5a5a40]/60 text-center px-4 leading-tight">
                          Authorization required for Sheets sync. Redirect flow is most reliable.
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          clearTokens();
                          setIsGoogleConnected(false);
                          addLog('Signed out of Google Account.');
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                </div>

                {!isGoogleConnected && (
                  <div className="mt-4 pt-4 border-t border-[#e5e1d8]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] text-[#5a5a40] font-medium">Advanced Setup:</p>
                      <button
                        onClick={() => setShowAdvancedAuth(!showAdvancedAuth)}
                        className="text-[9px] font-bold text-[#c5b358] hover:underline uppercase"
                      >
                        {showAdvancedAuth ? 'Hide Manual' : 'Configure Manual Token'}
                      </button>
                    </div>

                    {showAdvancedAuth && (
                      <div className="space-y-3 bg-white/30 p-3 rounded-xl border border-dashed border-[#c5b358]/50">
                        <div className="space-y-1">
                          <p className="text-[8px] text-[#5a5a40] uppercase font-bold opacity-70">Manual Configuration</p>
                          <p className="text-[9px] text-[#5a5a40] leading-tight mb-2">
                            If the redirect flow fails, paste a refresh token below.
                          </p>
                        </div>

                        <div className="space-y-1 pt-2">
                          <div className="flex gap-2">
                            <input
                              type="password"
                              value={manualToken}
                              onChange={e => setManualTokenState(e.target.value)}
                              placeholder="paste_token_here..."
                              className="flex-1 bg-white border border-[#e5e1d8] rounded px-2 py-1.5 text-xs font-mono"
                            />
                            <button
                              onClick={() => {
                                if (manualToken) {
                                  try {
                                    setManualRefreshToken(manualToken); // ✅ replaces setManualToken
                                    setIsGoogleConnected(true);
                                    alert('Manual token applied!');
                                    setManualTokenState('');
                                    setShowAdvancedAuth(false);
                                  } catch (err: any) {
                                    alert('Error: ' + err.message);
                                  }
                                }
                              }}
                              className="bg-[#c5b358] text-white px-3 py-1 rounded text-[10px] font-bold uppercase transition-all active:scale-95 shadow-sm"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isGoogleConnected && (
                <div className="bg-[#f5f5f0] border-2 border-[#e5e1d8] rounded-2xl p-5 mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#2c2c26] mb-1">Database Maintenance</h3>
                      <p className="text-[10px] text-[#5a5a40]">
                        Runs a background job to scrub empty rows and clean up orphaned relational database IDs.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={async () => {
                          const conf = confirm('Run Sync & Sanitize? This will remove empty rows from your sheets.');
                          if (!conf) return;
                          try {
                            const { syncAndSanitizeDatabase } = await import('../services/dbOperations');
                            addLog('Starting Sync & Sanitize...');
                            const deletedCount = await syncAndSanitizeDatabase();
                            addLog(`Sanitize complete. Removed ${deletedCount} empty rows.`);
                            alert(`Sanitize complete. Removed ${deletedCount} empty rows.`);
                            handleSyncWithSheets(true);
                          } catch (err: any) {
                            alert('Sanitize failed: ' + err.message);
                          }
                        }}
                        className="bg-[#5a5a40] hover:bg-[#3f3f37] text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
                      >
                        Sync & Sanitize
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5a5a40] mb-2 px-1">
                  Google Spreadsheet ID
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={tempSpreadsheetId}
                    onChange={e => setTempSpreadsheetId(e.target.value)}
                    placeholder="Enter Spreadsheet ID"
                    className="w-full bg-[#f5f5f0] border-2 border-[#e5e1d8] rounded-xl px-4 py-3 font-sans text-sm outline-none focus:border-[#c5b358] transition-all"
                  />
                  <div className="mt-2 text-[9px] text-[#5a5a40]/60 italic px-1">
                    This ID determines which Google Sheet the app syncs with.
                    Changes require a manual "Pull from Sheets" to take effect.
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    setSpreadsheetId(tempSpreadsheetId);
                    setIsSettingsOpen(false);
                    handleSyncWithSheets().catch(console.error);
                  }}
                  className="flex-1 bg-[#5a5a40] hover:bg-[#3f3f37] text-white py-3 rounded-xl font-bold font-sans uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  Save & Sync Now
                </button>
                <button
                  id="settings-cancel-btn"
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 bg-[#e5e1d8] hover:bg-[#d4cfc1] text-[#2c2c26] py-3 rounded-xl font-bold font-sans uppercase tracking-widest text-xs transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}