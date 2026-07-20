'use client';

import React, { useState } from 'react';
import { IncidentReport, ExecutionTrace } from '@/lib/types';
import { ShieldAlert, AlertTriangle, CheckCircle2, GitPullRequest, ExternalLink, Cpu, Info, ArrowRight, Copy, Check } from 'lucide-react';

interface IncidentReportViewProps {
  report: IncidentReport | null;
  trace: ExecutionTrace | null;
}

export const IncidentReportView: React.FC<IncidentReportViewProps> = ({ report, trace }) => {
  const [copied, setCopied] = useState(false);

  if (!report || !trace) {
    return (
      <div className="lightswind-card p-6 border border-[#1F1F24] rounded-2xl bg-[#09090D] text-center py-10">
        <ShieldAlert className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
        <p className="text-sm font-sans font-medium text-zinc-300">Select an execution trace to view Incident Report</p>
      </div>
    );
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
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-sans font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Success</span>
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-sans font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Warning</span>
          </span>
        );
      case 'critical':
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-sans font-medium">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Critical Incident</span>
          </span>
        );
    }
  };

  return (
    <div className="lightswind-card p-6 border border-[#1F1F24] rounded-2xl bg-[#09090D] relative overflow-hidden">
      {/* Report Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1F1F24] pb-4 mb-5">
        <div>
          <div className="flex items-center space-x-3 mb-1.5">
            {getSeverityBadge()}
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#13131A] text-zinc-300 border border-[#1F1F24]">
              Confidence: {report.confidence}%
            </span>
          </div>
          <h2 className="text-lg font-sans font-bold text-white tracking-tight">{report.incident}</h2>
          <p className="text-xs font-sans text-zinc-400 mt-0.5">{report.samplingInfo}</p>
        </div>

        {/* SigNoz Action Bar */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyTraceId}
            title="Copy OpenTelemetry Trace ID"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#030307] text-zinc-300 border border-[#1F1F24] hover:border-zinc-700 text-xs font-mono transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copied ? 'Copied!' : 'Copy Trace ID'}</span>
          </button>

          <a
            href={signozUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-[#DF00FF] hover:bg-[#c400e0] text-white text-xs font-sans font-medium transition-all shadow-md shadow-[#DF00FF]/20"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Open Trace in SigNoz</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
        </div>
      </div>

      {/* Grid: Evidence & Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Evidence Card */}
        <div className="p-4 rounded-xl bg-[#030307] border border-[#1F1F24]">
          <h4 className="text-xs font-sans font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            <span>Trace Telemetry Evidence</span>
          </h4>
          <ul className="space-y-1.5 text-xs font-sans text-zinc-300">
            {report.evidence.map((ev: string, idx: number) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-[#DF00FF] font-bold">•</span>
                <span>{ev}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Timeline Analysis Card */}
        <div className="p-4 rounded-xl bg-[#030307] border border-[#1F1F24]">
          <h4 className="text-xs font-sans font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span>Timeline Analysis</span>
          </h4>
          <ul className="space-y-1.5 text-xs font-sans text-zinc-300 max-h-36 overflow-y-auto pr-1">
            {report.timeline.map((item: string, idx: number) => (
              <li key={idx} className="text-xs">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actionable Recommendation Box */}
      <div className="p-4 rounded-xl bg-[#13131A] border border-[#1F1F24] mb-4">
        <h4 className="text-xs font-sans font-bold text-white uppercase tracking-wide mb-1 flex items-center space-x-1.5">
          <ArrowRight className="w-3.5 h-3.5 text-[#DF00FF]" />
          <span>Actionable Recommendation</span>
        </h4>
        <p className="text-xs font-sans text-zinc-200">{report.recommendation}</p>
      </div>

      {/* Future Remediation Preview */}
      {report.futureRemediation && (
        <div className="p-4 rounded-xl bg-[#030307] border border-zinc-800 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#13131A] text-[#DF00FF] border border-[#1F1F24]">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-sans text-zinc-400 uppercase font-semibold">
                Future VOID Server Autonomous Action
              </div>
              <div className="text-xs font-sans font-bold text-white">{report.futureRemediation.action}</div>
              <div className="text-xs font-sans text-zinc-400">{report.futureRemediation.details}</div>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-1 rounded bg-[#13131A] text-zinc-300 border border-[#1F1F24] flex-shrink-0">
            {report.futureRemediation.target}
          </span>
        </div>
      )}

      {/* Disclaimer Footer */}
      <div className="pt-3 border-t border-[#1F1F24] text-[11px] font-sans text-zinc-500 italic">
        {report.disclaimer}
      </div>
    </div>
  );
};
