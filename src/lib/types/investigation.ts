export type PipelineStage =
  | 'TRACE_RECEIVED'
  | 'RISK_ENGINE'
  | 'INCIDENT_CREATED'
  | 'EVALUATOR'
  | 'PROMOTION_GATE'
  | 'ISSUE_AGENT'
  | 'COMPLETED';

export type StageStatus = 'pending' | 'running' | 'completed' | 'failed';

export const PIPELINE_STAGES: { stage: PipelineStage; label: string }[] = [
  { stage: 'TRACE_RECEIVED', label: 'Trace Received' },
  { stage: 'RISK_ENGINE', label: 'Risk Engine' },
  { stage: 'INCIDENT_CREATED', label: 'Incident Created' },
  { stage: 'EVALUATOR', label: 'LLM Evaluator' },
  { stage: 'PROMOTION_GATE', label: 'Promotion Gate' },
  { stage: 'ISSUE_AGENT', label: 'Issue Agent' },
  { stage: 'COMPLETED', label: 'Investigation Complete' },
];

export type IssueAgentSubStep =
  | 'BUILDING_TIMELINE'
  | 'SEARCHING_REPOSITORY'
  | 'READING_FILES'
  | 'EXTRACTING_FUNCTIONS'
  | 'VALIDATING_EVIDENCE'
  | 'GENERATING_REPORT'
  | 'CREATING_GITHUB_ISSUE';

export const ISSUE_AGENT_SUBSTEPS: { step: IssueAgentSubStep; label: string }[] = [
  { step: 'BUILDING_TIMELINE', label: 'Building execution timeline' },
  { step: 'SEARCHING_REPOSITORY', label: 'Searching repository' },
  { step: 'READING_FILES', label: 'Reading files' },
  { step: 'EXTRACTING_FUNCTIONS', label: 'Extracting functions' },
  { step: 'VALIDATING_EVIDENCE', label: 'Validating evidence' },
  { step: 'GENERATING_REPORT', label: 'Generating engineering report' },
  { step: 'CREATING_GITHUB_ISSUE', label: 'Creating GitHub issue' },
];

export interface PipelineEvent {
  incidentId: string;
  stage: PipelineStage;
  status: StageStatus;
  detail?: string;
  subStep?: IssueAgentSubStep;
  timestamp: string;
}

export interface PipelineState {
  [stage: string]: {
    status: StageStatus;
    detail?: string;
    subStep?: IssueAgentSubStep;
    timestamp?: string;
  };
}

export interface EngineeringReport {
  summary: string;
  root_cause: string;
  evidence: string[];
  suspected_components: string[];
  relevant_files: string[];
  relevant_functions: string[];
  suggested_investigation: string[];
  suggested_fix: string;
  suggested_tests: string[];
  confidence: number;
  executive_summary: string;
  impact: string;
  timeline: TimelineEvent[];
  repository_findings: RepositoryFindings;
  missing_context: MissingContext | null;
  evidence_analysis: string;
  secondary_effects: string[];
  issue_title: string;
}

export interface TimelineEvent {
  event_type: 'execution_step' | 'tool_call' | 'failure_observable' | 'evidence' | 'root_cause';
  step_index: number | null;
  description: string;
  source: 'evaluator' | 'repository' | 'trace';
  evidence_refs: number[];
}

export interface RepositoryFindings {
  validated_components: RepositoryValidation[];
  files_found: string[];
  functions_found: string[];
  symbols_searched: string[];
  missing_context_reason: string;
}

export interface RepositoryValidation {
  component: string;
  status: 'confirmed' | 'suggested' | 'not_found' | 'not_searched';
  found_paths: string[];
  notes: string;
}

export interface MissingContext {
  reason: string;
  missing_information: string[];
  recommendations: string[];
}

export interface InvestigationResponse {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  incidentId?: string;
  severity?: string;
  labels?: string[];
  confidence?: number;
  traceId?: string | null;
  signozTraceUrl?: string | null;
  issueUrl?: string | null;
  errorCode?: string;
}

export const STAGE_ERROR_MESSAGES: Record<string, string> = {
  EVALUATOR_FAILED: 'The AI evaluator could not complete this investigation.',
  ISSUE_AGENT_FAILED: 'Engineering report generation failed.',
  INCIDENT_NOT_FOUND: 'Incident record was not found.',
};

export function getStageErrorMessage(stage: string, detail?: string): string {
  if (detail && STAGE_ERROR_MESSAGES[detail]) return STAGE_ERROR_MESSAGES[detail];
  return `The ${stage} stage failed.`;
}

export const ANALYSIS_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Queued for investigation…',
  PROCESSING: 'Running analysis…',
  COMPLETED: 'Investigation complete',
  FAILED: 'Investigation failed',
};
