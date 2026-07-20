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
  index: number; // 1 to 10
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
  response: string;
  error?: string;
  attributes: Record<string, unknown>;
  storyChapter: StoryChapter;
  flaggedForSemantic: boolean;
}

export interface IncidentReport {
  incident: string;
  severity: Severity;
  confidence: number; // e.g. 99, 97
  evidence: string[];
  timeline: string[];
  recommendation: string;
  analysisCategory: 'deterministic' | 'semantic';
  samplingInfo: string; // "Semantic Sampling (category-flagged traces: 2 of 10)"
  disclaimer: string;
  futureRemediation?: {
    action: string; // e.g., "Create GitHub Issue", "PagerDuty Trigger"
    target: string;
    details: string;
  };
}

export interface IncidentAnalyzer {
  analyze(trace: ExecutionTrace): Promise<IncidentReport>;
}
