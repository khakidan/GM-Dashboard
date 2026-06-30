import React from 'react';
import { Spell, Condition } from '../types';
import { X } from 'lucide-react';
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
          <h2 className="text-xl font-bold font-sans">
            {reference.data.name}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:opacity-80 transition-opacity"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3 overflow-y-auto max-h-[70vh] text-[#0f172a] text-sm leading-relaxed">
          {reference.type === 'condition' && (
            <div className="whitespace-pre-wrap">{reference.data.description}</div>
          )}

          {reference.type === 'spell' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className="bg-[#f9f8ff] text-[#8d8db9] px-2 py-1 rounded-md border border-[#e2e8f0]">
                  {reference.data.level === 0 ? 'Cantrip' : `Level ${reference.data.level}`} · {reference.data.school}
                </span>
                <span className="bg-[#f9f8ff] text-[#8d8db9] px-2 py-1 rounded-md border border-[#e2e8f0]">
                  <strong className="text-[#0f172a] mr-1">Time:</strong> {reference.data.castingTime}
                </span>
                <span className="bg-[#f9f8ff] text-[#8d8db9] px-2 py-1 rounded-md border border-[#e2e8f0]">
                  <strong className="text-[#0f172a] mr-1">Range:</strong> {reference.data.range}
                </span>
                <span className="bg-[#f9f8ff] text-[#8d8db9] px-2 py-1 rounded-md border border-[#e2e8f0]">
                  <strong className="text-[#0f172a] mr-1">Components:</strong> {reference.data.components}
                </span>
                <span className="bg-[#f9f8ff] text-[#8d8db9] px-2 py-1 rounded-md border border-[#e2e8f0]">
                  <strong className="text-[#0f172a] mr-1">Duration:</strong> {reference.data.duration}
                </span>
                {reference.data.concentration && (
                  <span className="bg-[#2563eb]/10 text-[#2563eb] px-2 py-1 rounded-md border border-[#2563eb]/20">
                    Concentration
                  </span>
                )}
                {reference.data.ritual && (
                  <span className="bg-[#2563eb]/10 text-[#2563eb] px-2 py-1 rounded-md border border-[#2563eb]/20">
                    Ritual
                  </span>
                )}
                {reference.data.classes && (
                  <span className="bg-[#f9f8ff] text-[#8d8db9] px-2 py-1 rounded-md border border-[#e2e8f0]">
                    <strong className="text-[#0f172a] mr-1">Classes:</strong> {reference.data.classes}
                  </span>
                )}
              </div>

              <div className="whitespace-pre-wrap">{reference.data.description}</div>

              {reference.data.higherLevel && (
                <div>
                  <h3 className="font-bold text-[#0f172a] mb-1">At Higher Levels</h3>
                  <div className="whitespace-pre-wrap">{reference.data.higherLevel}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
