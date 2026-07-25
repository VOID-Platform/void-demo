export type Severity = 'success' | 'warning' | 'critical';

export type StepKind =
  | 'PLANNING'
  | 'REASONING'
  | 'TOOL_SELECTION'
  | 'TOOL_EXECUTION'
  | 'RESPONSE'
  | 'FAILED'
  | 'COMPLETED';

export interface ExecutionStep {
  id: string;
  kind: StepKind;
  label: string;
  durationMs: number;
  timestamp: string;
  status: 'ok' | 'error' | 'pending';
  details?: Record<string, unknown>;
}

export interface StoryChapter {
  chapterIndex: number;
  title: string;
  subtitle: string;
  narration: string;
  highlightAspect: string;
}

export interface ExecutionTrace {
  id: string;
  traceId: string;
  index: number; // 1 to 12
  title: string;
  prompt: string;
  user: string;
  status: Severity;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  steps: ExecutionStep[];
  toolCalls: string[];
  failedToolCalls?: string[];
  contextWindowExceeded?: boolean;
  response: string;
  error?: string;
  attributes: Record<string, unknown>;
  storyChapter: StoryChapter;
  flaggedForSemantic: boolean;
}

export interface IncidentReport {
  incident: string;
  severity: Severity;
  confidence: number;
  evidence: string[];
  timeline: string[];
  recommendation: string;
  analysisCategory: 'deterministic' | 'semantic';
  analysisSource: 'server_evaluated' | 'local_heuristic';
  samplingInfo: string;
  disclaimer: string;
  engineeringReport?: {
    summary?: string;
    root_cause?: string;
    executive_summary?: string;
    impact?: string;
    suspected_components?: string[];
    relevant_files?: string[];
    suggested_fix?: string;
    suggested_tests?: string[];
    confidence?: number;
    fullReport?: string;
  };
  futureRemediation?: {
    action: string;
    target: string;
    details: string;
  };
}

export interface IncidentAnalyzer {
  analyze(trace: ExecutionTrace): Promise<IncidentReport>;
}
