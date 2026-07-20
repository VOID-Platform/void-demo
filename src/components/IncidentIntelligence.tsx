'use client';

import React, { useState } from 'react';
import { IncidentReport, ExecutionTrace } from '@/lib/types';
import { ShieldAlert, AlertTriangle, CheckCircle2, GitPullRequest, ExternalLink, ArrowRight, Copy, Check, Sparkles } from 'lucide-react';
import { VoidLogo } from '@/components/VoidLogo';

interface IncidentIntelligenceProps {
  report: IncidentReport | null;
  trace: ExecutionTrace | null;
}

export const IncidentIntelligence: React.FC<IncidentIntelligenceProps> = ({ report, trace }) => {
  const [copied, setCopied] = useState(false);

  if (!report || !trace) {
    return null;
  }

  const signozUrl = `http://localhost:8080/trace/${trace.traceId}`;

  const handleCopyTraceId = () => {
    if (trace.traceId) {
      navigator.clipboard.writeText(trace.traceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getSeverityBadge = () => {
    switch (report.severity) {
      case 'success':
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-sans font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Normal Operations</span>
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-sans font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Warning</span>
          </span>
        );
      case 'critical':
        return (
          <span className="flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-sans font-bold">
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
            <span>Critical Incident</span>
          </span>
        );
    }
  };

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-[#0E0E12] border border-white/10 space-y-6 shadow-2xl max-w-4xl mx-auto">
      {/* Incident Summary Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            {getSeverityBadge()}
            <span className="text-xs font-mono px-3 py-0.5 rounded-full bg-[#070709] text-zinc-300 border border-white/10">
              Confidence: {report.confidence}%
            </span>
          </div>
          <h3 className="text-2xl font-sans font-extrabold text-white tracking-tight leading-tight">
            {report.incident}
          </h3>
          <p className="text-xs font-mono text-zinc-400 mt-1">{report.samplingInfo}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleCopyTraceId}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#070709] text-zinc-300 border border-white/10 hover:border-zinc-700 text-xs font-mono transition-all btn-tactile"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copied ? 'COPIED!' : 'COPY_TRACE_ID'}</span>
          </button>

          <a
            href={signozUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#DF00FF] via-[#A855F7] to-[#7E22CE] text-white text-xs font-mono font-bold transition-all shadow-lg shadow-[#A855F7]/25 btn-tactile"
          >
            <VoidLogo size={14} glow={false} />
            <span>SIGNOZ_TRACE</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
        </div>
      </div>

      {/* Forensic Evidence Bullets */}
      <div className="p-4 rounded-xl bg-[#070709] border border-white/10 space-y-2">
        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">INCIDENT_EVIDENCE_SUMMARY</h4>
        <ul className="space-y-1.5 text-xs md:text-sm font-sans text-zinc-300">
          {report.evidence.map((ev: string, idx: number) => (
            <li key={idx} className="flex items-start space-x-2">
              <span className="text-[#A855F7] font-bold mt-0.5">•</span>
              <span className="leading-relaxed">{ev}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Primary Actionable Fix */}
      <div className="p-4 rounded-xl bg-[#14141A] border border-[#A855F7]/40 space-y-1.5 shadow-lg shadow-[#A855F7]/10">
        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wide flex items-center space-x-2">
          <ArrowRight className="w-4 h-4 text-[#A855F7]" />
          <span>PRIMARY_ACTIONABLE_RECOMMENDATION</span>
        </h4>
        <p className="text-xs sm:text-sm font-sans text-white font-medium leading-relaxed">{report.recommendation}</p>
      </div>

      {/* Autonomous Repair Teaser */}
      {report.futureRemediation && (
        <div className="p-4 rounded-xl bg-[#070709] border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#14141A] text-emerald-400 border border-emerald-500/30">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>GLIMPSE_INTO_TOMORROW / VOID_SERVER_AUTONOMOUS_REPAIR</span>
              </div>
              <div className="text-xs font-sans font-bold text-white mt-0.5">{report.futureRemediation.action}</div>
              <div className="text-xs font-sans text-zinc-400">{report.futureRemediation.details}</div>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#14141A] text-emerald-300 border border-emerald-500/30 flex-shrink-0">
            {report.futureRemediation.target}
          </span>
        </div>
      )}
    </div>
  );
};
