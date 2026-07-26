'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Github } from 'lucide-react';

interface GitHubIssueCardProps {
  issueUrl: string | null;
}

export function GitHubIssueCard({ issueUrl }: GitHubIssueCardProps) {
  if (!issueUrl) return null;

  return (
    <motion.a
      href={issueUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="flex items-center justify-between px-5 py-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
          <Github className="w-5 h-5 text-zinc-300" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
            Open GitHub Issue
          </p>
          <p className="text-xs text-zinc-500 font-mono truncate max-w-[300px]">
            {issueUrl}
          </p>
        </div>
      </div>
      <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
    </motion.a>
  );
}
