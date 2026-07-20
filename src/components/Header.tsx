'use client';

import React from 'react';
import { Activity, Play, Presentation, ExternalLink, Cpu, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onRunAll: () => void;
  onOpenWalkthrough: () => void;
  onReplayIntro?: () => void;
  isExecuting: boolean;
  activeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onRunAll,
  onOpenWalkthrough,
  onReplayIntro,
  isExecuting,
  activeCount,
}) => {
  return (
    <header className="border-b border-[#1F1F24] bg-[#030307]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Product Context */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#09090D] border border-[#DF00FF]/40 p-0.5 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-[#DF00FF]" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-sans font-bold text-base text-white tracking-tight">VOID SDK</span>
              <span className="text-[11px] font-sans px-2 py-0.5 rounded bg-[#13131A] text-zinc-300 border border-[#1F1F24]">
                v0.1.0
              </span>
              <span className="text-[11px] font-sans px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>SigNoz OTLP Collector</span>
              </span>
            </div>
            <p className="text-xs font-sans text-zinc-400 mt-0.5">
              NovaFlow SaaS Copilot | OpenTelemetry AI Observability
            </p>
          </div>
        </div>

        {/* Actions & Controls */}
        <div className="flex items-center space-x-2.5">
          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              title="Replay animated intro sequence"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#09090D] text-xs font-sans text-zinc-400 border border-[#1F1F24] hover:text-white hover:border-[#DF00FF]/30 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span>Intro</span>
            </button>
          )}

          <button
            onClick={onOpenWalkthrough}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#09090D] text-xs font-sans text-zinc-300 border border-[#1F1F24] hover:text-white hover:border-[#C084FC]/40 transition-all"
          >
            <Presentation className="w-3.5 h-3.5 text-[#C084FC]" />
            <span>90s Pitch</span>
          </button>

          <a
            href="http://localhost:8080"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#09090D] text-xs font-sans text-zinc-400 border border-[#1F1F24] hover:text-white hover:border-zinc-700 transition-all"
          >
            <Activity className="w-3.5 h-3.5 text-zinc-400" />
            <span>SigNoz UI</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          <button
            onClick={onRunAll}
            disabled={isExecuting}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-sans font-medium text-white transition-all ${
              isExecuting
                ? 'bg-zinc-800 cursor-not-allowed text-zinc-500'
                : 'bg-[#DF00FF] hover:bg-[#c400e0] shadow-md shadow-[#DF00FF]/20'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
            <span>{isExecuting ? `Running (${activeCount}/10)...` : 'Run All Traces'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
