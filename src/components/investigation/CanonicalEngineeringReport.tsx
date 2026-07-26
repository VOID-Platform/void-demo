'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, ArrowRight, Wrench, FileText, Layers } from 'lucide-react';
import { ReportSection } from './ReportSection';
import { TimelineSection } from './TimelineSection';
import { RepositoryFindingsSection } from './RepositoryFindingsSection';
import { MissingContextSection } from './MissingContextSection';
import { GitHubIssueCard } from './GitHubIssueCard';
import type { EngineeringReport } from '@/lib/types/investigation';

interface CanonicalEngineeringReportProps {
  report: EngineeringReport;
  severity?: string;
  issueUrl?: string | null;
}

const SEVERITY_STYLES: Record<string, { color: string; bg: string; border: string; dot: string; label: string; Icon: typeof ShieldAlert }> = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-950/20', border: 'border-red-500/20', dot: 'bg-red-400', label: 'Critical Incident', Icon: ShieldAlert },
  SUSPICIOUS: { color: 'text-amber-300', bg: 'bg-amber-950/15', border: 'border-amber-500/20', dot: 'bg-amber-400', label: 'Suspicious', Icon: AlertTriangle },
  HEALTHY: { color: 'text-emerald-400', bg: 'bg-emerald-950/15', border: 'border-emerald-500/20', dot: 'bg-emerald-400', label: 'Normal Operations', Icon: ShieldAlert },
};

function NoDataGenerated({ field }: { field: string }) {
  return (
    <p className="text-sm text-zinc-600 italic font-mono">No data generated</p>
  );
}

function ValueOrEmpty({ value }: { value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') {
    return <NoDataGenerated field="" />;
  }
  return <p className="text-sm text-zinc-300">{value}</p>;
}

export function CanonicalEngineeringReport({ report, severity, issueUrl }: CanonicalEngineeringReportProps) {
  const sevKey = severity === 'CRITICAL' ? 'CRITICAL' : severity === 'SUSPICIOUS' ? 'SUSPICIOUS' : 'HEALTHY';
  const sev = SEVERITY_STYLES[sevKey] || SEVERITY_STYLES.HEALTHY;
  const confidencePct = Math.round((report.confidence ?? 0) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-8"
    >
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${sev.bg} ${sev.border} ${sev.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sev.dot} animate-pulse`} />
            {sev.label}
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Confidence</span>
            <span className="text-xs font-mono font-bold text-violet-400">
              {confidencePct}%
            </span>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          {report.executive_summary || report.summary || <NoDataGenerated field="summary" />}
        </h2>
      </div>

      {/* Impact & Metadata */}
      {report.impact && (
        <ReportSection title="Impact">
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400">
              {report.impact}
            </span>
          </div>
        </ReportSection>
      )}

      {/* Root Cause */}
      <ReportSection title="Root Cause">
        {report.root_cause ? (
          <p className="text-sm text-zinc-300 leading-relaxed">{report.root_cause}</p>
        ) : (
          <NoDataGenerated field="root_cause" />
        )}
      </ReportSection>

      {/* Evidence */}
      <ReportSection title="Trace Evidence">
        {report.evidence && report.evidence.length > 0 ? (
          <ul className="space-y-1.5">
            {report.evidence.map((ev, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-zinc-400">
                <span className="text-violet-400 mt-1 flex-shrink-0">•</span>
                <span>{ev}</span>
              </li>
            ))}
          </ul>
        ) : (
          <NoDataGenerated field="evidence" />
        )}
      </ReportSection>

      {/* Evidence Analysis */}
      {report.evidence_analysis && (
        <ReportSection title="Evidence Analysis">
          <p className="text-sm text-zinc-300 leading-relaxed">{report.evidence_analysis}</p>
        </ReportSection>
      )}

      {/* Timeline */}
      <TimelineSection events={report.timeline} />

      {/* Suspected Components */}
      {report.suspected_components && report.suspected_components.length > 0 && (
        <ReportSection title="Suspected Components">
          <div className="flex flex-wrap gap-1.5">
            {report.suspected_components.map((comp, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
                {comp}
              </span>
            ))}
          </div>
        </ReportSection>
      )}

      {/* Relevant Files */}
      {report.relevant_files && report.relevant_files.length > 0 && (
        <ReportSection title="Relevant Files">
          <div className="space-y-1">
            {report.relevant_files.map((f, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm font-mono text-zinc-400">
                <FileText className="w-3.5 h-3.5 text-zinc-600" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </ReportSection>
      )}

      {/* Relevant Functions */}
      {report.relevant_functions && report.relevant_functions.length > 0 && (
        <ReportSection title="Relevant Functions">
          <div className="flex flex-wrap gap-1.5">
            {report.relevant_functions.map((fn, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
                {fn}()
              </span>
            ))}
          </div>
        </ReportSection>
      )}

      {/* Repository Findings */}
      <RepositoryFindingsSection findings={report.repository_findings} />

      {/* Secondary Effects */}
      {report.secondary_effects && report.secondary_effects.length > 0 && (
        <ReportSection title="Secondary Effects">
          <ul className="space-y-1">
            {report.secondary_effects.map((eff, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-zinc-400">
                <span className="text-amber-400 mt-1 flex-shrink-0">•</span>
                <span>{eff}</span>
              </li>
            ))}
          </ul>
        </ReportSection>
      )}

      {/* Suggested Fix */}
      {report.suggested_fix && (
        <ReportSection title="Suggested Fix">
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-start gap-2">
              <Wrench className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-emerald-300 leading-relaxed">{report.suggested_fix}</p>
            </div>
          </div>
        </ReportSection>
      )}

      {/* Suggested Investigation */}
      {report.suggested_investigation && report.suggested_investigation.length > 0 && (
        <ReportSection title="Suggested Investigation">
          <ul className="space-y-1">
            {report.suggested_investigation.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-zinc-400">
                <ArrowRight className="w-3.5 h-3.5 text-violet-400 mt-1 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </ReportSection>
      )}

      {/* Suggested Tests */}
      {report.suggested_tests && report.suggested_tests.length > 0 && (
        <ReportSection title="Regression Tests">
          <ul className="space-y-1">
            {report.suggested_tests.map((test, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-zinc-400">
                <span className="text-zinc-600 mt-1 flex-shrink-0">•</span>
                <span>{test}</span>
              </li>
            ))}
          </ul>
        </ReportSection>
      )}

      {/* Missing Context */}
      <MissingContextSection missing={report.missing_context} />

      {/* GitHub Issue */}
      <GitHubIssueCard issueUrl={issueUrl ?? null} />

      {/* Footer */}
      <div className="pt-4 border-t border-zinc-800 flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-[10px] font-mono text-zinc-600">
          VOID Engineering Report · Generated by Issue Agent
        </span>
      </div>
    </motion.div>
  );
}
