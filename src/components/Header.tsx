'use client';

import React from 'react';
import { Play, Loader2, Presentation, Zap } from 'lucide-react';
import { VoidLogo } from '@/components/VoidLogo';

interface HeaderProps {
  onRunAll: () => void;
  onJumpToDemo?: () => void;
  onOpenWalkthrough?: () => void;
  isExecuting: boolean;
  activeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onRunAll,
  onJumpToDemo,
  onOpenWalkthrough,
  isExecuting,
  activeCount,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-white/[0.06] bg-[#050508]/80 backdrop-blur-2xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <VoidLogo size={24} glow={true} />
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white font-sans">VOID</span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-400 uppercase px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
              OTEL AI Intelligence
            </span>
          </div>
        </div>

        {/* Actions Header */}
        <div className="flex items-center gap-2.5">
          {/* Direct Jump to Live Demo Button (The Demo is the Hero) */}
          {onJumpToDemo && (
            <button
              onClick={onJumpToDemo}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] transition-all btn-tactile"
            >
              <Zap className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>Live Demo</span>
            </button>
          )}

          {onOpenWalkthrough && (
            <button
              onClick={onOpenWalkthrough}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/[0.16] bg-white/[0.02] transition-all btn-tactile"
            >
              <Presentation className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>Pitch Guide</span>
            </button>
          )}

          {/* Run All 10 Traces Button */}
          <button
            onClick={onRunAll}
            disabled={isExecuting}
            className={`
              flex items-center gap-2 pl-4 pr-2 py-1.5 rounded-full text-xs font-semibold
              transition-all duration-300 btn-tactile
              ${isExecuting
                ? 'bg-white/5 text-zinc-500 cursor-not-allowed border border-white/[0.06]'
                : 'bg-[#8b5cf6] text-white hover:bg-[#7c3aed] shadow-lg shadow-[#8b5cf6]/25'
              }
            `}
          >
            <span>
              {isExecuting
                ? activeCount > 0
                  ? `Analyzing ${activeCount}…`
                  : 'Analyzing…'
                : 'Run All Traces'}
            </span>
            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              {isExecuting ? (
                <Loader2 className="w-3 h-3 animate-spin text-white" />
              ) : (
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
