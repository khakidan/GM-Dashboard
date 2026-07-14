import React from 'react';
import { Spell, Condition } from '../types';
import { Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DialogShell } from './ui/DialogShell';
import { SectionHeader } from './ui/SectionHeader';

interface ReferenceDetailDialogProps {
  reference:
    | { type: 'spell'; data: Spell }
    | { type: 'condition'; data: Condition }
    | null;
  onClose: () => void;
}

const markdownComponents = {
  p: ({ children }: any) => <p className="mb-3 last:mb-0 text-[#0f172a] text-sm leading-relaxed font-normal">{children}</p>,
  strong: ({ children }: any) => <strong className="font-bold text-[#0f172a]">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-3 space-y-1 text-[#0f172a] text-sm font-normal">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-[#0f172a] text-sm font-normal">{children}</ol>,
  li: ({ children }: any) => <li className="mb-0.5 last:mb-0 leading-relaxed font-normal">{children}</li>,
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3 border border-[#e2e8f0] rounded-lg">
      <table className="min-w-full divide-y divide-[#e2e8f0] text-xs font-sans text-[#0f172a]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-[#f9f8ff]">{children}</thead>,
  tbody: ({ children }: any) => <tbody className="divide-y divide-[#e2e8f0]">{children}</tbody>,
  tr: ({ children }: any) => <tr className="hover:bg-[#f9f8ff]/50 transition-colors">{children}</tr>,
  th: ({ children }: any) => <th className="px-3 py-2 text-left font-bold text-[10px] uppercase tracking-wider text-[#0f172a] border-r border-[#e2e8f0] last:border-r-0">{children}</th>,
  td: ({ children }: any) => <td className="px-3 py-1.5 border-r border-[#e2e8f0] last:border-r-0 leading-normal">{children}</td>,
};

export function ReferenceDetailDialog({ reference, onClose }: ReferenceDetailDialogProps) {
  if (!reference) return null;

  const icon = reference.type === 'spell' ? (
    <Sparkles className="w-5 h-5 text-[#2563eb]" />
  ) : (
    <AlertCircle className="w-5 h-5 text-[#2563eb]" />
  );

  return (
    <DialogShell
      isOpen={!!reference}
      onClose={onClose}
      title={reference.data.name}
      icon={icon}
      maxWidth="max-w-lg"
      zIndex="z-[100]"
    >
      <div className="space-y-4 overflow-y-auto max-h-[70vh] text-[#0f172a] text-sm leading-relaxed">
        {reference.type === 'condition' && (
          <div className="text-[#0f172a]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {reference.data.description}
            </ReactMarkdown>
          </div>
        )}

        {reference.type === 'spell' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 animate-fade-in">
              <span className="bg-[#f9f8ff] text-[#2563eb] border border-[#9eb6ff] text-[10px] font-bold uppercase rounded-md px-2.5 py-1">
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

            <div className="text-[#0f172a]">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {reference.data.description}
              </ReactMarkdown>
            </div>

            {reference.data.higherLevel && (
              <div className="bg-[#f9f8ff] border border-[#e2e8f0] rounded-lg p-4">
                <SectionHeader size="compact">
                  At Higher Levels
                </SectionHeader>
                <div className="text-[#0f172a]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {reference.data.higherLevel}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DialogShell>
  );
}
