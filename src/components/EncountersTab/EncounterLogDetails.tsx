import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { EncounterLog, CombatEvent } from '../../lib/combatLog';
import { CombatEventRow } from './CombatEventRow';
import { Button } from '../ui/Button';
import { Accordion } from '../ui/Accordion';
import { Tabs } from '../ui/Tabs';

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
    }).catch(err => {
      console.error('Failed to copy transcript:', err);
      toast.error('Failed to copy transcript to clipboard');
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
          <Button
            intent="secondary"
            size="small"
            onClick={handleCopy}
            className="flex items-center gap-1.5"
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
          </Button>

          <Tabs
            tabs={[
              { id: 'structured', label: 'Structured View' },
              { id: 'raw', label: 'Raw Transcript' },
            ]}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as 'structured' | 'raw')}
          />
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
                  <Accordion
                    isExpanded={isRoundExpanded}
                    onToggle={() => toggleRound(round)}
                    size="compact"
                    rightContent={
                      <span className="text-[11px] text-[#8d8db9] font-medium">
                        {roundEvents.length} {roundEvents.length === 1 ? 'event' : 'events'}
                      </span>
                    }
                  >
                    <span className="font-bold text-xs text-[#2563eb]">Round {round}</span>
                  </Accordion>

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
