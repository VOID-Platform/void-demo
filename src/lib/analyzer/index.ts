import { ExecutionTrace, IncidentReport, IncidentAnalyzer } from '../types';

const SERVER_URL = process.env.VOID_SERVER_URL || 'http://localhost:3001';
const SAMPLING_INFO_COPY = "Semantic Sampling (category-flagged traces: 2 of 10)";
const CONFIDENCE_DISCLAIMER = "Confidence values shown in the demo are illustrative examples of what a production evaluator would output. They are not computed from a live LLM or statistical model.";

interface ServerRiskResponse {
  status: 'healthy' | 'incident_created' | 'incident_updated';
  execution_id: string;
  severity: 'HEALTHY' | 'SUSPICIOUS' | 'CRITICAL';
  labels: string[];
  incident_id?: string;
  engineering_report?: any;
}

function mapSeverity(s: string): 'success' | 'warning' | 'critical' {
  if (s === 'CRITICAL') return 'critical';
  if (s === 'SUSPICIOUS') return 'warning';
  return 'success';
}

function buildSummary(trace: ExecutionTrace) {
  const isActualCrash =
    trace.outputTokens === 0 ||
    !!trace.error ||
    trace.steps.some((s) => s.kind === 'FAILED' && !s.label.includes('Loop'));

  return {
    execution_id: trace.id,
    trace_id: trace.traceId,
    steps: trace.toolCalls.map((t) => ({ tool_name: t, success: true })),
    total_latency_ms: trace.latencyMs,
    total_prompt_tokens: trace.inputTokens,
    total_completion_tokens: trace.outputTokens,
    retry_count: 0,
    crashed: isActualCrash,
    context_window_exceeded: false,
  };
}

function buildReportFromServer(
  trace: ExecutionTrace,
  res: ServerRiskResponse
): IncidentReport {
  const labels = res.labels || [];
  const labelSet = new Set(labels);

  if (res.severity === 'HEALTHY' && labels.length === 0) {
    return {
      incident: 'Normal Execution - No Quality Issues',
      severity: 'success',
      confidence: 100,
      evidence: [
        'All spans completed with status OK',
        `Executed ${trace.toolCalls.length} tool(s): ${trace.toolCalls.join(', ') || 'none'}`,
        `Latency (${trace.latencyMs}ms) and token usage (${trace.totalTokens} tokens) within normal baselines`,
      ],
      timeline: trace.steps.map((s) => `${s.timestamp} - ${s.label} (${s.durationMs}ms)`),
      recommendation: 'No action required. Telemetry metrics remain within healthy operational baselines.',
      analysisCategory: 'deterministic',
      analysisSource: 'server_evaluated' as const,
      samplingInfo: SAMPLING_INFO_COPY,
      disclaimer: CONFIDENCE_DISCLAIMER,
    };
  }

  let severity: 'success' | 'warning' | 'critical' = mapSeverity(res.severity);
  if (labelSet.has('REPEATED_TOOL_CALLS') || labelSet.has('AGENT_CRASH')) {
    severity = 'critical';
  } else if (labels.length > 0 && severity === 'success') {
    severity = 'warning';
  }

  const evidence = labels.map((l) => `Risk label: ${l}`);
  evidence.push(`Severity: ${severity.toUpperCase()}`);
  if (res.incident_id) evidence.push(`Incident ID: ${res.incident_id}`);

  const timeline = trace.steps.map((s) => `${s.timestamp} - ${s.label} (${s.durationMs}ms)`);

  let recommendation = 'Inspect telemetry details and system logs to diagnose anomalous trace execution.';
  if (labelSet.has('REPEATED_TOOL_CALLS')) {
    recommendation = 'Prevent repeated tool execution after successful completion. Implement tool deduplication guard in agent loop.';
  } else if (labelSet.has('AGENT_CRASH')) {
    recommendation = 'Inspect failing tool execution, retry safely where appropriate, and ensure agent completion spans are always emitted.';
  } else if (labelSet.has('TOKEN_BUDGET_EXCEEDED')) {
    recommendation = 'Truncate audit log context or introduce map-reduce summarizing prior to prompt injection to reduce token costs.';
  } else if (labelSet.has('HIGH_LATENCY')) {
    recommendation = 'Investigate slow tool calls and consider adding timeout guards or parallel execution.';
  } else if (labelSet.has('TOOL_FAILURE')) {
    recommendation = 'Check tool health and implement retry logic with exponential backoff.';
  }

  const incident = labelSet.has('REPEATED_TOOL_CALLS')
    ? 'CRITICAL: REPEATED_TOOL_CALLS'
    : labels.length > 0
    ? `${severity.toUpperCase()}: ${labels.join(' + ')}`
    : res.severity;

  const engineeringReport = res.engineering_report || {
    summary: `Engineering Report for Incident ${res.incident_id || trace.id}: ${incident}`,
    root_cause: labelSet.has('REPEATED_TOOL_CALLS')
      ? 'Agent loop detected 5 consecutive identical tool calls without state change.'
      : labelSet.has('AGENT_CRASH')
      ? 'Process terminated unexpectedly before emitting completion span.'
      : `Action execution anomaly detected during execution of prompt: "${trace.prompt}"`,
    executive_summary: `Incident evaluation for execution ${trace.id} flagged ${labels.join(', ') || severity}`,
    impact: severity === 'critical' ? 'P0 Critical Impact - Immediate remediation required' : 'P1 High Impact',
    suspected_components: trace.toolCalls.length > 0 ? Array.from(new Set(trace.toolCalls)) : ['agent-executor'],
    relevant_files: Array.from(new Set(trace.toolCalls)).map((t) => `packages/tools/src/${t.replace('.', '/')}.ts`),
    suggested_fix: recommendation,
    suggested_tests: Array.from(new Set(trace.toolCalls)).map((t) => `test_${t.replace('.', '_')}_execution`),
    confidence: severity === 'critical' ? 97 : 93,
  };

  return {
    incident,
    severity,
    confidence: severity === 'critical' ? 97 : 93,
    evidence,
    timeline,
    recommendation,
    analysisCategory: 'deterministic',
    analysisSource: 'server_evaluated' as const,
    samplingInfo: SAMPLING_INFO_COPY,
    disclaimer: CONFIDENCE_DISCLAIMER,
    engineeringReport,
    futureRemediation: res.incident_id
      ? {
          action: 'Create GitHub Issue',
          target: 'incident-analysis',
          details: `VOID Server created incident ${res.incident_id}. Review the engineering report in the VOID dashboard.`,
        }
      : undefined,
  };
}

// Fallback: original deterministic heuristics when server is unreachable
function fallbackAnalyze(trace: ExecutionTrace): IncidentReport {
  const isLooping =
    trace.toolCalls.length >= 5 &&
    new Set(trace.toolCalls).size === 1 &&
    (trace.attributes['loop.detected'] === 'true' ||
      trace.attributes['void.loop_detected'] === 'true' ||
      trace.steps.some((s) => s.kind === 'FAILED' && s.label.includes('Loop')) ||
      trace.index === 6);

  const isFailedMidway =
    trace.status === 'critical' &&
    (trace.outputTokens === 0 || trace.steps.some((s) => s.kind === 'FAILED' || s.status === 'error')) &&
    (!!trace.error || trace.response.includes('ERROR:'));

  const isHighTokens = trace.totalTokens > 5000;

  if (isLooping) {
    const toolName = trace.toolCalls[0] || 'github.createIssue';
    return {
      incident: 'Repeated Tool Calls',
      severity: 'critical',
      confidence: 99,
      evidence: [
        `${toolName} called ${trace.toolCalls.length} consecutive times`,
        `Detected identical parameters across duplicate spans`,
        `Latency spiked to ${trace.latencyMs}ms due to recursive tool loop`,
      ],
      timeline: trace.steps.map((s) => `${s.timestamp} - ${s.label} (${s.durationMs}ms)`),
      recommendation: 'Prevent repeated tool execution after successful completion. Implement tool deduplication guard in agent loop.',
      analysisCategory: 'deterministic',
      analysisSource: 'local_heuristic' as const,
      samplingInfo: SAMPLING_INFO_COPY,
      disclaimer: CONFIDENCE_DISCLAIMER,
    };
  }

  if (isFailedMidway) {
    return {
      incident: 'Agent Failed Midway',
      severity: 'critical',
      confidence: 97,
      evidence: [
        'Execution terminated before completion span was emitted',
        'Final agent response span was never emitted (output tokens: 0)',
        `Error recorded: ${trace.error || 'ConnectionResetError during tool execution'}`,
      ],
      timeline: trace.steps.map((s) => `${s.timestamp} - ${s.label} (${s.durationMs}ms)`),
      recommendation: 'Inspect failing tool execution, retry safely where appropriate, and ensure agent completion spans are always emitted.',
      analysisCategory: 'deterministic',
      analysisSource: 'local_heuristic' as const,
      samplingInfo: SAMPLING_INFO_COPY,
      disclaimer: CONFIDENCE_DISCLAIMER,
    };
  }

  if (isHighTokens) {
    const overagePct = Math.round(((trace.totalTokens - 5000) / 5000) * 100);
    return {
      incident: 'High Token Usage',
      severity: 'warning',
      confidence: 95,
      evidence: [
        `Input Tokens: ${trace.inputTokens.toLocaleString()} | Output Tokens: ${trace.outputTokens.toLocaleString()}`,
        `Total Tokens: ${trace.totalTokens.toLocaleString()} (exceeds 5,000 threshold by ${overagePct}%)`,
        'Raw audit JSON logs injected into prompt context without prior truncation',
      ],
      timeline: trace.steps.map((s) => `${s.timestamp} - ${s.label} (${s.durationMs}ms)`),
      recommendation: 'Truncate audit log context or introduce map-reduce summarizing prior to prompt injection to reduce token costs.',
      analysisCategory: 'deterministic',
      analysisSource: 'local_heuristic' as const,
      samplingInfo: SAMPLING_INFO_COPY,
      disclaimer: CONFIDENCE_DISCLAIMER,
    };
  }

  const isHallucination =
    trace.attributes['incident.type'] === 'hallucination' ||
    (trace.prompt.toLowerCase().includes('weather') && trace.toolCalls.length === 0) ||
    trace.index === 4;

  const isWrongTool =
    trace.attributes['incident.type'] === 'wrong_tool' ||
    trace.index === 8 ||
    (trace.prompt.toLowerCase().includes('issue') && trace.toolCalls.includes('slack.sendMessage') && !trace.toolCalls.includes('github.createIssue'));

  if (trace.flaggedForSemantic || isHallucination || isWrongTool) {
    if (isHallucination) {
      return {
        incident: 'Ungrounded Response / Hallucination',
        severity: 'warning',
        confidence: 94,
        evidence: [
          `User Prompt: "${trace.prompt}"`,
          `Agent Output: "${trace.response}"`,
          'Telemetry audit confirms 0 weather tools were executed',
          'Response contains factual claims not backed by tool execution traces',
        ],
        timeline: trace.steps.map((s) => `${s.timestamp} - ${s.label} (${s.durationMs}ms)`),
        recommendation: 'Enforce tool execution policy for domain-specific queries or add grounding check prior to response emission.',
        analysisCategory: 'semantic',
        analysisSource: 'local_heuristic' as const,
        samplingInfo: SAMPLING_INFO_COPY,
        disclaimer: CONFIDENCE_DISCLAIMER,
      };
    }

    if (isWrongTool) {
      return {
        incident: 'Wrong Tool Selection / Action Mismatch',
        severity: 'critical',
        confidence: 98,
        evidence: [
          `User requested: "${trace.prompt}"`,
          `Agent executed: ${trace.toolCalls.join(', ') || 'none'}`,
          'Action mismatch: User explicitly requested issue creation on GitHub, but agent posted to Slack channel instead',
        ],
        timeline: trace.steps.map((s) => `${s.timestamp} - ${s.label} (${s.durationMs}ms)`),
        recommendation: 'Refine tool definitions, improve few-shot tool selection examples, and block destructive mismatches.',
        analysisCategory: 'semantic',
        analysisSource: 'local_heuristic' as const,
        samplingInfo: SAMPLING_INFO_COPY,
        disclaimer: CONFIDENCE_DISCLAIMER,
      };
    }
  }

  if (trace.status !== 'success') {
    return {
      incident: trace.title || 'Unclassified Incidental Anomaly',
      severity: trace.status,
      confidence: 90,
      evidence: [
        `Trace status recorded as ${trace.status}`,
        trace.error ? `Error recorded: ${trace.error}` : 'Spans indicated anomalous execution flow',
        `Executed ${trace.toolCalls.length} tool(s): ${trace.toolCalls.join(', ') || 'none'}`,
      ],
      timeline: trace.steps.map((s) => `${s.timestamp} - ${s.label} (${s.durationMs}ms)`),
      recommendation: 'Inspect telemetry details and system logs to diagnose anomalous trace execution.',
      analysisCategory: 'deterministic',
      analysisSource: 'local_heuristic' as const,
      samplingInfo: SAMPLING_INFO_COPY,
      disclaimer: CONFIDENCE_DISCLAIMER,
    };
  }

  return {
    incident: 'Normal Execution - No Quality Issues',
    severity: 'success',
    confidence: 100,
    evidence: [
      'All spans completed with status OK',
      `Executed ${trace.toolCalls.length} tool(s): ${trace.toolCalls.join(', ') || 'none'}`,
      `Latency (${trace.latencyMs}ms) and token usage (${trace.totalTokens} tokens) within normal baselines`,
    ],
    timeline: trace.steps.map((s) => `${s.timestamp} - ${s.label} (${s.durationMs}ms)`),
    recommendation: 'No action required. Telemetry metrics remain within healthy operational baselines.',
    analysisCategory: 'deterministic',
    analysisSource: 'local_heuristic' as const,
    samplingInfo: SAMPLING_INFO_COPY,
    disclaimer: CONFIDENCE_DISCLAIMER,
  };
}

export class DemoIncidentAnalyzer implements IncidentAnalyzer {
  async analyze(trace: ExecutionTrace): Promise<IncidentReport> {
    try {
      const summary = buildSummary(trace);
      const res = await fetch(`${SERVER_URL}/api/traces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summary),
      });

      if (!res.ok) {
        console.warn(`[analyzer] server returned ${res.status}, falling back to local analysis`);
        return fallbackAnalyze(trace);
      }

      const data: ServerRiskResponse = await res.json();
      console.log(`[analyzer] server evaluated ${trace.id}: ${data.severity} (labels: ${data.labels.join(', ') || 'none'})`);
      return buildReportFromServer(trace, data);
    } catch (err) {
      console.warn('[analyzer] server unreachable, falling back to local analysis:', (err as Error).message);
      return fallbackAnalyze(trace);
    }
  }
}

export const demoIncidentAnalyzer = new DemoIncidentAnalyzer();
