'use client';

import React, { useState } from 'react';
import { ExecutionTrace } from '@/lib/types';
import { Code, Database, Terminal, FileCode, Check } from 'lucide-react';

interface TraceDetailsProps {
  trace: ExecutionTrace | null;
}

export const TraceDetails: React.FC<TraceDetailsProps> = ({ trace }) => {
  const [activeTab, setActiveTab] = useState<'attributes' | 'raw'>('attributes');

  if (!trace) {
    return (
      <div className="lightswind-card p-5 border border-[#1F1F24] rounded-2xl bg-[#09090D]/60 text-center py-8 text-xs text-zinc-500 font-mono">
        No trace active
      </div>
    );
  }

  return (
    <div className="lightswind-card p-5 border border-[#1F1F24] rounded-2xl bg-[#09090D]/90">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-[#DF00FF]" />
          <h4 className="text-xs font-semibold text-white font-mono">OpenTelemetry Attributes & Spans</h4>
        </div>

        <div className="flex items-center space-x-1.5 p-1 rounded-lg bg-[#030307] border border-[#1F1F24]">
          <button
            onClick={() => setActiveTab('attributes')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all ${
              activeTab === 'attributes'
                ? 'bg-[#DF00FF]/20 text-[#DF00FF] border border-[#DF00FF]/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            SemConv Attributes
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all ${
              activeTab === 'raw'
                ? 'bg-[#DF00FF]/20 text-[#DF00FF] border border-[#DF00FF]/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Raw JSON
          </button>
        </div>
      </div>

      {/* Attributes View */}
      {activeTab === 'attributes' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {Object.entries(trace.attributes).map(([key, val]) => (
              <div key={key} className="p-2 rounded-lg bg-[#030307] border border-[#1F1F24] flex items-center justify-between">
                <span className="text-zinc-400 font-semibold truncate pr-2">{key}:</span>
                <span className="text-[#C084FC] truncate">{String(val)}</span>
              </div>
            ))}
          </div>

          {/* Executed Tools */}
          <div className="pt-2 border-t border-[#1F1F24]">
            <div className="text-[11px] font-mono text-zinc-400 mb-1.5 flex items-center space-x-1">
              <Database className="w-3 h-3 text-[#DF00FF]" />
              <span>Recorded Tool Calls ({trace.toolCalls.length})</span>
            </div>
            {trace.toolCalls.length === 0 ? (
              <p className="text-xs font-mono text-amber-400 italic bg-amber-500/10 p-2 rounded border border-amber-500/20">
                ⚠ Zero tools executed during this trace execution.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {trace.toolCalls.map((t: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-xs font-mono px-2.5 py-1 rounded bg-[#0D0D12] text-white border border-[#DF00FF]/30 flex items-center space-x-1"
                  >
                    <span className="text-[#DF00FF] font-bold">tool:</span>
                    <span>{t}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Raw JSON View */}
      {activeTab === 'raw' && (
        <pre className="p-3 rounded-xl bg-[#030307] border border-[#1F1F24] text-[11px] font-mono text-zinc-300 max-h-52 overflow-y-auto">
          {JSON.stringify(trace, null, 2)}
        </pre>
      )}
    </div>
  );
};
