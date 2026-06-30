import React from 'react';
import { Spell, Condition } from '../types';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface ReferenceDetailDialogProps {
  reference:
    | { type: 'spell'; data: Spell }
    | { type: 'condition'; data: Condition }
    | null;
  onClose: () => void;
}

export function ReferenceDetailDialog({ reference, onClose }: ReferenceDetailDialogProps) {
  if (!reference) return null;

  return (
    <div
      className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-[#e2e8f0] shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[#2563eb] text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            {reference.type === 'spell' ? (
              <Sparkles className="w-5 h-5 text-white" />
            ) : (
              <AlertCircle className="w-5 h-5 text-white" />
            )}
            <h2 className="text-xl font-bold font-sans text-white">
              {reference.data.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#c0d4ff] hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh] text-[#0f172a] text-sm leading-relaxed">
          {reference.type === 'condition' && (
            <div className="whitespace-pre-wrap text-[#0f172a]">{reference.data.description}</div>
          )}

          {reference.type === 'spell' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#f9f8ff] text-[#2563eb] border border-[#9eb6ff] text-[10px] font-bold uppercase rounded-md px-2 py-1">
                  {reference.data.level === 0 ? 'Cantrip' : `Level ${reference.data.level}`} · {reference.data.school}
                </span>
                <span className="bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0] text-[10px] font-bold uppercase rounded-md px-2 py-1">
                  <strong className="text-[#0f172a] font-extrabold mr-1">Time:</strong> {reference.data.castingTime}
                </span>
                <span className="bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0] text-[10px] font-bold uppercase rounded-md px-2 py-1">
                  <strong className="text-[#0f172a] font-extrabold mr-1">Range:</strong> {reference.data.range}
                </span>
                <span className="bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0] text-[10px] font-bold uppercase rounded-md px-2 py-1">
                  <strong className="text-[#0f172a] font-extrabold mr-1">Components:</strong> {reference.data.components}
                </span>
                <span className="bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0] text-[10px] font-bold uppercase rounded-md px-2 py-1">
                  <strong className="text-[#0f172a] font-extrabold mr-1">Duration:</strong> {reference.data.duration}
                </span>
                {reference.data.concentration && (
                  <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold uppercase rounded-md px-2 py-1">
                    Concentration
                  </span>
                )}
                {reference.data.ritual && (
                  <span className="bg-[#f9f8ff] text-[#567eff] border border-[#c0d4ff] text-[10px] font-bold uppercase rounded-md px-2 py-1">
                    Ritual
                  </span>
                )}
                {reference.data.classes && (
                  <span className="bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0] text-[10px] font-bold uppercase rounded-md px-2 py-1">
                    <strong className="text-[#0f172a] font-extrabold mr-1">Classes:</strong> {reference.data.classes}
                  </span>
                )}
              </div>

              <div className="whitespace-pre-wrap text-[#0f172a]">{reference.data.description}</div>

              {reference.data.higherLevel && (
                <div className="bg-[#f9f8ff] border border-[#e2e8f0] rounded-lg p-4">
                  <h3 className="text-[#8d8db9] text-[10px] font-bold uppercase tracking-widest border-b border-[#e2e8f0] pb-1 mb-2">
                    At Higher Levels
                  </h3>
                  <div className="whitespace-pre-wrap text-[#0f172a]">{reference.data.higherLevel}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
