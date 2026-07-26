'use client';

import { motion } from 'framer-motion';
import { File, FunctionSquare, Search, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { ReportSection } from './ReportSection';
import type { RepositoryFindings, RepositoryValidation } from '@/lib/types/investigation';

function ValidationBadge({ status }: { status: RepositoryValidation['status'] }) {
  if (status === 'confirmed') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  if (status === 'not_found') return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  if (status === 'suggested') return <HelpCircle className="w-3.5 h-3.5 text-amber-400" />;
  return <HelpCircle className="w-3.5 h-3.5 text-zinc-600" />;
}

interface RepositoryFindingsSectionProps {
  findings: RepositoryFindings | null;
}

export function RepositoryFindingsSection({ findings }: RepositoryFindingsSectionProps) {
  if (!findings) return null;

  const hasAny =
    findings.validated_components?.length > 0 ||
    findings.files_found?.length > 0 ||
    findings.functions_found?.length > 0;

  if (!hasAny) return null;

  return (
    <ReportSection title="Repository Findings">
      <div className="space-y-4">
        {findings.validated_components && findings.validated_components.length > 0 && (
          <div className="space-y-1.5">
            {findings.validated_components.map((vc, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start gap-2 px-3 py-2 rounded-lg bg-zinc-900"
              >
                <ValidationBadge status={vc.status} />
                <div className="min-w-0">
                  <span className="text-sm text-zinc-300">{vc.component}</span>
                  <span className="text-[10px] font-mono text-zinc-600 ml-2">({vc.status})</span>
                  {vc.notes && (
                    <p className="text-xs text-zinc-500 mt-0.5">{vc.notes}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {findings.files_found && findings.files_found.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                <File className="w-3 h-3" />
                <span>Files Found</span>
              </div>
              {findings.files_found.map((f, idx) => (
                <p key={idx} className="text-xs font-mono text-zinc-400 truncate">
                  {f}
                </p>
              ))}
            </div>
          )}

          {findings.functions_found && findings.functions_found.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                <FunctionSquare className="w-3 h-3" />
                <span>Functions Found</span>
              </div>
              {findings.functions_found.map((fn, idx) => (
                <p key={idx} className="text-xs font-mono text-zinc-400">
                  {fn}()
                </p>
              ))}
            </div>
          )}
        </div>

        {findings.symbols_searched && findings.symbols_searched.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono mb-1">
              <Search className="w-3 h-3" />
              <span>Searched</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {findings.symbols_searched.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-500"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </ReportSection>
  );
}
