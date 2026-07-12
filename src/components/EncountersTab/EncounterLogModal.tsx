import React, { useEffect, useState } from 'react';
import { X, Scroll, Calendar, Trash2 } from 'lucide-react';
import { useEncounterLogs } from './hooks/useEncounterLogs';
import { EncounterLog } from '../../lib/combatLog';
import { EncounterLogDetails } from './EncounterLogDetails';
import { DialogShell } from '../ui/DialogShell';
import { IconButton } from '../ui/IconButton';
import { Badge } from '../ui/Badge';
import { Accordion } from '../ui/Accordion';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';


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
  const [pendingDeleteLogId, setPendingDeleteLogId] = useState<string | null>(null);

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
  }, [isOpen, encounterId, fetchLogsForEncounter]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  const handleDelete = (e: React.MouseEvent, logId: string) => {
    e.stopPropagation();
    setPendingDeleteLogId(logId);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteLogId) return;
    const logId = pendingDeleteLogId;
    const success = await deleteLog(logId);
    if (success) {
      setLogs(prev => prev.filter(log => log.id !== logId));
      if (expandedLogId === logId) {
        setExpandedLogId(null);
      }
    }
    setPendingDeleteLogId(null);
  };

  return (
    <DialogShell
      isOpen={isOpen}
      onClose={onClose}
      title={`Encounter Logs: ${encounterName}`}
      icon={<Scroll className="w-5 h-5 text-[#2563eb]" />}
      maxWidth="max-w-2xl"
      zIndex="z-[100]"
      footer={
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-white hover:bg-[#e2e8f0] text-[#0f172a] border border-[#e2e8f0] font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer text-sm"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="overflow-y-auto text-[#0f172a] text-sm leading-relaxed space-y-4">
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
                  <div className="w-full flex items-center bg-[#f9f8ff]/50 hover:bg-[#f9f8ff] transition-colors pr-4">
                    <Accordion
                      isExpanded={isExpanded}
                      onToggle={() => toggleExpand(log.id)}
                      size="default"
                      className="flex-1 bg-transparent hover:bg-transparent"
                      rightContent={
                        <>
                          <span className="text-xs text-[#8d8db9]">
                            {log.durationRounds} {log.durationRounds === 1 ? 'Round' : 'Rounds'}
                          </span>
                          <Badge
                            color={log.outcome === 'Victory' ? 'green' : log.outcome === 'Defeat' ? 'red' : 'gray'}
                            size="default"
                          >
                            {log.outcome}
                          </Badge>
                        </>
                      }
                    >
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
                    </Accordion>
                    <div className="shrink-0 z-10">
                      <IconButton
                        icon={<Trash2 className="w-4 h-4" />}
                        intent="destructive"
                        onClick={(e) => handleDelete(e, log.id)}
                        aria-label="Delete Log"
                        title="Delete Log"
                      />
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
      <ConfirmationDialog
        isOpen={pendingDeleteLogId !== null}
        title="Delete Encounter Log?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setPendingDeleteLogId(null)}
      />
    </DialogShell>
  );
}

