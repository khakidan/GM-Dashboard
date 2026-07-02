import React, { useEffect, useState } from 'react';
import { X, Scroll, ChevronDown, ChevronRight, Calendar, Flag, Trash2, Copy, Check } from 'lucide-react';
import { useEncounterLogs } from './hooks/useEncounterLogs';
import { EncounterLog, CombatEvent, ACTION_TYPE_LABELS } from '../../lib/combatLog';

interface EncounterLogModalProps {
  encounterId: string;
  encounterName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EncounterLogModal({ encounterId, encounterName, isOpen, onClose }: EncounterLogModalProps) {
  const { fetchLogsForEncounter, deleteLog, isLoading, error } = useEncounterLogs();
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

  const handleDelete = async (e: React.MouseEvent, logId: string) => {
    e.stopPropagation();
    const confirmed = window.confirm('Delete this encounter log? This cannot be undone.');
    if (!confirmed) return;

    const success = await deleteLog(logId);
    if (success) {
      setLogs(prev => prev.filter(log => log.id !== logId));
      if (expandedLogId === logId) {
        setExpandedLogId(null);
      }
    }
  };

  const getOutcomeBadgeClass = (outcome: string) => {
    switch (outcome) {
      case 'Victory':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'Defeat':
        return 'bg-red-50 text-red-600 border border-red-100';
      case 'Abandoned':
      case 'Incomplete':
        return 'bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0]';
      default:
        return 'bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0]';
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
              <p className="text-[#8d8db9] font-medium">Fetching past logs...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 border border-red-100 rounded-lg p-4 text-center">
              <p className="font-semibold">Error Loading Logs</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-[#8d8db9] font-medium">
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
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleExpand(log.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleExpand(log.id);
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 bg-[#f9f8ff]/50 hover:bg-[#f9f8ff] transition-colors text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-inset"
                    >
                      <div className="flex items-center gap-4">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-[#8d8db9]" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-[#8d8db9]" />
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#8d8db9]" />
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
                            <p className="text-xs text-[#8d8db9] pl-6">
                              Location: {log.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#8d8db9]">
                          {log.durationRounds} {log.durationRounds === 1 ? 'Round' : 'Rounds'}
                        </span>
                        <span
                          className={`text-xs font-bold uppercase tracking-wider rounded-full px-2.5 py-1 border ${getOutcomeBadgeClass(
                            log.outcome
                          )}`}
                        >
                          {log.outcome}
                        </span>
                        <button
                          onClick={(e) => handleDelete(e, log.id)}
                          className="text-[#8d8db9] hover:text-red-600 hover:bg-red-50 rounded-lg p-1.5 transition-colors cursor-pointer"
                          title="Delete Log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

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
        <div className="px-6 py-4 bg-[#f9f8ff] border-t border-[#e2e8f0] flex justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="bg-white hover:bg-[#e2e8f0] text-[#0f172a] border border-[#e2e8f0] font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer text-sm"
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
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(log.transcript || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
        <div className="bg-[#f9f8ff]/70 p-3 rounded-lg border border-[#e2e8f0]">
          <p className="text-[10px] uppercase font-bold text-[#8d8db9] tracking-widest">Party Size</p>
          <p className="text-sm font-semibold text-[#0f172a]">{log.partySnapshot?.length || 0} Members</p>
        </div>
        <div className="bg-[#f9f8ff]/70 p-3 rounded-lg border border-[#e2e8f0]">
          <p className="text-[10px] uppercase font-bold text-[#8d8db9] tracking-widest">Events Tracked</p>
          <p className="text-sm font-semibold text-[#0f172a]">{log.events?.length || 0} Actions</p>
        </div>
        <div className="bg-[#f9f8ff] p-3 rounded-lg border border-[#e2e8f0] col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase font-bold text-[#2563eb] tracking-widest">Outcome</p>
          <p className="text-sm font-bold text-[#0f172a]">{log.outcome}</p>
        </div>
      </div>

      {/* View Toggle Tabs */}
      <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
        <p className="text-[11px] uppercase font-bold text-[#8d8db9] tracking-widest">Combat Log</p>
        <div className="flex items-center gap-2">
          {/* Copy Transcript Button */}
          <button
            onClick={handleCopy}
            className="text-[#8d8db9] border border-[#e2e8f0] rounded-xl px-3 py-1.5 text-xs hover:border-[#2563eb] hover:text-[#2563eb] transition-colors font-medium flex items-center gap-1.5 cursor-pointer bg-white"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Transcript</span>
              </>
            )}
          </button>

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-[#e2e8f0]">
            <button
              onClick={() => setActiveTab('structured')}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                activeTab === 'structured'
                  ? 'bg-white text-[#2563eb] shadow-sm'
                  : 'text-[#8d8db9] hover:text-[#0f172a]'
              }`}
            >
              Structured View
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                activeTab === 'raw'
                  ? 'bg-white text-[#2563eb] shadow-sm'
                  : 'text-[#8d8db9] hover:text-[#0f172a]'
              }`}
            >
              Raw Transcript
            </button>
          </div>
        </div>
      </div>

      {/* Main log display area */}
      {activeTab === 'structured' ? (
        <div className="space-y-3 overflow-y-auto max-h-[45vh] pr-1">
          {roundNumbers.length === 0 ? (
            <p className="text-center py-6 text-[#8d8db9] text-xs font-medium">No displayable events logged in this session.</p>
          ) : (
            roundNumbers.map(round => {
              const isRoundExpanded = !!expandedRounds[round];
              const roundEvents = eventsByRound[round] || [];
              return (
                <div key={round} className="border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
                  {/* Round Header */}
                  <button
                    onClick={() => toggleRound(round)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-[#f9f8ff]/70 hover:bg-[#f9f8ff] transition-colors text-left cursor-pointer"
                  >
                    <span className="font-bold text-xs text-[#2563eb]">Round {round}</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-[#8d8db9] font-medium">
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
          <div className="bg-[#f9f8ff] p-4 rounded-xl border border-[#e2e8f0] overflow-y-auto max-h-[40vh] font-mono text-xs text-[#0f172a] whitespace-pre-wrap select-text leading-relaxed">
            {log.transcript || 'No transcript logged.'}
          </div>
        </div>
      )}
    </div>
  );
}

export function CombatEventRow({ event }: { event: CombatEvent }) {
  let actor = event.actorName || 'Unknown';
  if (actor === 'environment') actor = 'Environment';
  if (actor === 'lair-action') actor = 'Lair Action';
  if (actor === 'unknown') actor = 'Unknown';

  const target = event.targetName || 'Unknown';
  const hpBefore = event.hpBefore ?? 0;
  const hpAfter = event.hpAfter ?? 0;
  const val = event.value ?? 0;
  const condition = event.condition || 'condition';

  let text = '';
  let rowStyle = 'flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg ';
  let icon: React.ReactNode = null;

  switch (event.type) {
    case 'damage': {
      const typeStr = event.damageType ? `${event.damageType} ` : '';
      
      if (event.actionType && event.actionType !== 'attack') {
        const label = ACTION_TYPE_LABELS[event.actionType] || event.actionType;
        
        if (event.actionType === 'lair-action' || event.actionType === 'environmental' || actor === 'Environment' || actor === 'Lair Action' || actor === 'Unknown') {
          const displayLabel = (actor === 'Environment' || actor === 'Lair Action' || actor === 'Unknown') ? actor : label;
          text = `${displayLabel}: ${val} ${typeStr}damage to ${target} (${hpBefore} -> ${hpAfter} HP)`;
        } else {
          text = `${actor} used ${label}: dealt ${val} ${typeStr}damage to ${target} (${hpBefore} -> ${hpAfter} HP)`;
        }
      } else {
        if (actor === 'Environment' || actor === 'Lair Action' || actor === 'Unknown') {
          text = `${actor}: ${val} ${typeStr}damage to ${target} (${hpBefore} -> ${hpAfter} HP)`;
        } else {
          text = `${actor} dealt ${val} ${typeStr}damage to ${target} (${hpBefore} -> ${hpAfter} HP)`;
        }
      }
      
      rowStyle += 'bg-red-50 text-red-600 border border-red-100';
      icon = <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />;
      break;
    }
    case 'healing':
      if (actor === 'Environment' || actor === 'Lair Action' || actor === 'Unknown') {
        text = `${actor}: healed ${target} for ${val} HP (${hpBefore} -> ${hpAfter} HP)`;
      } else {
        text = `${actor} healed ${target} for ${val} HP (${hpBefore} -> ${hpAfter} HP)`;
      }
      rowStyle += 'bg-green-50 text-green-700 border border-green-100';
      icon = <span className="w-1.5 h-1.5 rounded-full bg-green-700 shrink-0" />;
      break;
    case 'condition-applied':
      text = `${actor} applied ${condition} to ${target}`;
      rowStyle += 'text-[#2563eb] bg-[#f9f8ff] border border-[#c0d4ff]';
      icon = <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] shrink-0" />;
      break;
    case 'condition-removed':
      text = `${condition} removed from ${target}`;
      rowStyle += 'text-[#2563eb]/90 bg-[#f9f8ff]/80 border border-[#c0d4ff]/50';
      icon = <span className="w-1.5 h-1.5 rounded-full bg-[#567eff] shrink-0" />;
      break;
    case 'combatant-defeated':
      text = `${target} was defeated`;
      rowStyle += 'bg-[#f9f8ff] text-[#0f172a] border border-[#e2e8f0] font-bold';
      icon = <span className="w-1.5 h-1.5 rounded-full bg-[#0f172a] shrink-0" />;
      break;
    case 'manual-adjustment':
      text = `${target}: HP adjusted ${hpBefore} -> ${hpAfter} (manual correction)`;
      rowStyle += 'bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0]';
      icon = <Flag className="w-3.5 h-3.5 text-[#8d8db9] shrink-0" />;
      break;
    case 'resource-changed': {
      const rName = event.resourceName || 'Resource';
      const rBefore = event.resourceBefore ?? 0;
      const rAfter = event.resourceAfter ?? 0;
      if (rAfter > rBefore) {
        text = `${target}: ${rName} ${rBefore} -> ${rAfter} (restored)`;
      } else {
        text = `${target}: ${rName} ${rBefore} -> ${rAfter}`;
      }
      rowStyle += 'bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0]';
      icon = <Flag className="w-3.5 h-3.5 text-[#8d8db9] shrink-0" />;
      break;
    }
    default:
      return null;
  }

  return (
    <div className={rowStyle}>
      {icon}
      <span className="font-medium">{text}</span>
    </div>
  );
}
