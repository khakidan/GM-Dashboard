import React, { useEffect, useState } from 'react';
import { X, Scroll, ChevronDown, ChevronRight, Calendar, Flag } from 'lucide-react';
import { useEncounterLogs } from './hooks/useEncounterLogs';
import { EncounterLog, CombatEvent, ACTION_TYPE_LABELS } from '../../lib/combatLog';

interface EncounterLogModalProps {
  encounterId: string;
  encounterName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EncounterLogModal({ encounterId, encounterName, isOpen, onClose }: EncounterLogModalProps) {
  const { fetchLogsForEncounter, isLoading, error } = useEncounterLogs();
  const [logs, setLogs] = useState<EncounterLog[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLogsForEncounter(encounterId).then(fetchedLogs => {
        setLogs(fetchedLogs);
        if (fetchedLogs.length > 0) {
          setExpandedLogId(fetchedLogs[0].id); // Auto-expand the most recent one
        } else {
          setExpandedLogId(null);
        }
      });
    }
  }, [isOpen, encounterId]);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  const getOutcomeBadgeClass = (outcome: string) => {
    switch (outcome) {
      case 'Victory':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Defeat':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Abandoned':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border border-[#e2e8f0] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#2563eb] text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Scroll className="w-5 h-5 text-white" />
            <h2 className="text-xl font-bold font-sans text-white">
              Encounter Logs: {encounterName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#c0d4ff] hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto flex-1 text-[#0f172a] text-sm leading-relaxed space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
              <p className="text-slate-500 font-medium">Fetching past logs...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-lg p-4 text-center">
              <p className="font-semibold">Error Loading Logs</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-medium">
              No completed encounters logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    className="border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Log Accordion Trigger */}
                    <button
                      onClick={() => toggleExpand(log.id)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="font-bold text-[#0f172a]">
                              {new Date(log.date).toLocaleString([], {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {log.location && (
                            <p className="text-xs text-slate-500 pl-6">
                              Location: {log.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {log.durationRounds} {log.durationRounds === 1 ? 'Round' : 'Rounds'}
                        </span>
                        <span
                          className={`text-xs font-bold uppercase tracking-wider rounded-full px-2.5 py-1 border ${getOutcomeBadgeClass(
                            log.outcome
                          )}`}
                        >
                          {log.outcome}
                        </span>
                      </div>
                    </button>

                    {/* Log Details */}
                    {isExpanded && (
                      <EncounterLogDetails log={log} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-[#e2e8f0] flex justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface EncounterLogDetailsProps {
  log: EncounterLog;
}

export function EncounterLogDetails({ log }: EncounterLogDetailsProps) {
  const [activeTab, setActiveTab] = useState<'structured' | 'raw'>('structured');

  // Filter out round-start/combat-start/combat-end events
  const displayableEvents = (log.events || []).filter(
    evt => evt.type !== 'round-start' && evt.type !== 'combat-start' && evt.type !== 'combat-end'
  );

  // Group events by round
  const eventsByRound: Record<number, CombatEvent[]> = {};
  displayableEvents.forEach(evt => {
    const r = evt.round;
    if (!eventsByRound[r]) {
      eventsByRound[r] = [];
    }
    eventsByRound[r].push(evt);
  });

  const roundNumbers = Object.keys(eventsByRound)
    .map(Number)
    .sort((a, b) => a - b);

  // By default, the first round is expanded, and others are collapsed.
  const [expandedRounds, setExpandedRounds] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    if (roundNumbers.length > 0) {
      initial[roundNumbers[0]] = true;
    }
    return initial;
  });

  const toggleRound = (round: number) => {
    setExpandedRounds(prev => ({
      ...prev,
      [round]: !prev[round],
    }));
  };

  return (
    <div className="p-4 border-t border-[#e2e8f0] bg-white space-y-4 animate-fade-in text-[#0f172a]">
      {/* Summary Block */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
          <p className="text-[10px] uppercase font-bold text-[#8d8db9] tracking-widest">Party Size</p>
          <p className="text-sm font-semibold text-slate-700">{log.partySnapshot?.length || 0} Members</p>
        </div>
        <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
          <p className="text-[10px] uppercase font-bold text-[#8d8db9] tracking-widest">Events Tracked</p>
          <p className="text-sm font-semibold text-slate-700">{log.events?.length || 0} Actions</p>
        </div>
        <div className="bg-[#f9f8ff] p-3 rounded-lg border border-[#e2e8f0] col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase font-bold text-[#2563eb] tracking-widest">Outcome</p>
          <p className="text-sm font-bold text-[#0f172a]">{log.outcome}</p>
        </div>
      </div>

      {/* View Toggle Tabs */}
      <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
        <p className="text-[11px] uppercase font-bold text-[#8d8db9] tracking-widest">Combat Log</p>
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-[#e2e8f0]">
          <button
            onClick={() => setActiveTab('structured')}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
              activeTab === 'structured'
                ? 'bg-white text-[#2563eb] shadow-sm'
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            Structured View
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
              activeTab === 'raw'
                ? 'bg-white text-[#2563eb] shadow-sm'
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            Raw Transcript
          </button>
        </div>
      </div>

      {/* Main log display area */}
      {activeTab === 'structured' ? (
        <div className="space-y-3 overflow-y-auto max-h-[45vh] pr-1">
          {roundNumbers.length === 0 ? (
            <p className="text-center py-6 text-slate-400 text-xs font-medium">No displayable events logged in this session.</p>
          ) : (
            roundNumbers.map(round => {
              const isRoundExpanded = !!expandedRounds[round];
              const roundEvents = eventsByRound[round] || [];
              return (
                <div key={round} className="border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
                  {/* Round Header */}
                  <button
                    onClick={() => toggleRound(round)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50/70 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <span className="font-bold text-xs text-[#2563eb]">Round {round}</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      {roundEvents.length} {roundEvents.length === 1 ? 'event' : 'events'}
                      {isRoundExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                  </button>

                  {/* Round Events List */}
                  {isRoundExpanded && (
                    <div className="p-3 bg-white border-t border-[#e2e8f0] space-y-2 animate-fade-in">
                      {roundEvents.map(evt => (
                        <CombatEventRow key={evt.id} event={evt} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 overflow-y-auto max-h-[40vh] font-mono text-xs text-slate-700 whitespace-pre-wrap select-text leading-relaxed">
            {log.transcript || 'No transcript logged.'}
          </div>
        </div>
      )}
    </div>
  );
}

export function CombatEventRow({ event }: { event: CombatEvent }) {
  const actorName = event.actorName || 'Unknown Source';
  const targetName = event.targetName || 'Unknown';
  const damageTypeStr = event.damageType ? ` ${event.damageType}` : '';
  const value = event.value ?? 0;
  const hpBefore = event.hpBefore ?? 0;
  const hpAfter = event.hpAfter ?? 0;
  const condition = event.condition || 'condition';

  let text = '';
  let rowStyle = 'flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg ';
  let icon: React.ReactNode = null;

  switch (event.type) {
    case 'damage':
      text = `${actorName} dealt ${value}${damageTypeStr} damage to ${targetName}`;
      rowStyle += 'text-rose-700 bg-rose-50/50 border border-rose-100/70';
      icon = <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />;
      break;
    case 'healing':
      text = `${actorName} healed ${targetName} for ${value} HP`;
      rowStyle += 'text-emerald-700 bg-emerald-50/50 border border-emerald-100/70';
      icon = <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />;
      break;
    case 'condition-applied':
      text = `${actorName} applied ${condition} to ${targetName}`;
      rowStyle += 'text-[#2563eb] bg-[#f9f8ff] border border-[#c0d4ff]/70';
      icon = <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] shrink-0" />;
      break;
    case 'condition-removed':
      text = `${condition} removed from ${targetName}`;
      rowStyle += 'text-[#2563eb]/90 bg-[#f9f8ff]/80 border border-[#c0d4ff]/50';
      icon = <span className="w-1.5 h-1.5 rounded-full bg-[#567eff] shrink-0" />;
      break;
    case 'combatant-defeated':
      text = `${targetName} was defeated`;
      rowStyle += 'text-slate-900 bg-slate-100 border border-slate-200 font-bold';
      icon = <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />;
      break;
    case 'manual-adjustment':
      text = `${targetName}: HP adjusted ${hpBefore} → ${hpAfter} (manual correction)`;
      rowStyle += 'text-slate-700 bg-slate-50 border border-slate-200';
      icon = <Flag className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
      break;
    default:
      return null;
  }

  if (event.actionType && event.actionType !== 'attack') {
    const label = ACTION_TYPE_LABELS[event.actionType] || event.actionType;
    text = `${label}: ${text}`;
  }

  return (
    <div className={rowStyle}>
      {icon}
      <span className="font-medium">{text}</span>
    </div>
  );
}
