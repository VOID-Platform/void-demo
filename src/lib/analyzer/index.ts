import { ExecutionTrace, IncidentReport, IncidentAnalyzer } from '../types';

export class DemoIncidentAnalyzer implements IncidentAnalyzer {
  public static SAMPLING_INFO_COPY = "Semantic Sampling (category-flagged traces: 2 of 10)";
  public static CONFIDENCE_DISCLAIMER = "Confidence values shown in the demo are illustrative examples of what a production evaluator would output. They are not computed from a live LLM or statistical model.";

  async analyze(trace: ExecutionTrace): Promise<IncidentReport> {
    // 1. Check for Deterministic Analysis triggers (Looping, Failed Midway, High Tokens)
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
          `${toolName} called 5 consecutive times`,
          `Detected identical parameters across 5 duplicate spans`,
          `Latency spiked to ${trace.latencyMs}ms due to recursive tool loop`,
        ],
        timeline: [
          '10:15:30.010 - Planning initialized escalation task',
          `10:15:30.055 - First ${toolName} execution succeeded (issue #402)`,
          `10:15:30.195 - Second ${toolName} execution [RETRY #1] (duplicate issue #403)`,
          `10:15:30.330 - Third ${toolName} execution [RETRY #2] (duplicate issue #404)`,
          `10:15:30.470 - Fourth ${toolName} execution [RETRY #3] (duplicate issue #405)`,
          `10:15:30.620 - Fifth ${toolName} execution [RETRY #4] (duplicate issue #406)`,
          '10:15:30.765 - Circuit breaker triggered: Loop halted',
        ],
        recommendation: 'Prevent repeated tool execution after successful completion. Implement tool deduplication guard in agent loop.',
        analysisCategory: 'deterministic',
        samplingInfo: DemoIncidentAnalyzer.SAMPLING_INFO_COPY,
        disclaimer: DemoIncidentAnalyzer.CONFIDENCE_DISCLAIMER,
        futureRemediation: {
          action: 'Create GitHub Issue & Circuit Breaker',
          target: 'novaflow/core#402',
          details: 'Future VOID Server automatically files GitHub issue to track duplicate side effects and deploys loop guard.',
        },
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
        timeline: [
          '10:25:10.010 - Planning phase completed for seat upgrade request',
          '10:25:10.050 - Reasoning verified user billing authorization',
          '10:25:10.145 - Stripe quantity update tool call initialized',
          '10:25:10.325 - TLS Handshake connection reset in socket layer',
          '10:25:10.330 - Execution terminated abruptly without cleanup span',
        ],
        recommendation: 'Inspect failing tool execution, retry safely where appropriate, and ensure agent completion spans are always emitted.',
        analysisCategory: 'deterministic',
        samplingInfo: DemoIncidentAnalyzer.SAMPLING_INFO_COPY,
        disclaimer: DemoIncidentAnalyzer.CONFIDENCE_DISCLAIMER,
        futureRemediation: {
          action: 'PagerDuty Trigger & Autonomous Retry Agent',
          target: 'billing-service',
          details: 'Future VOID Server triggers PagerDuty incident #PD-8821 and dispatches repair agent to verify Stripe subscription state.',
        },
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
        timeline: [
          '10:30:00.010 - Audit log request received',
          '10:30:00.070 - Fetched 100 raw audit log entries from database',
          '10:30:00.490 - Injected 6,500 tokens of raw JSON into reasoning prompt',
          '10:30:01.650 - LLM generated 3,200 token compliance breakdown report',
        ],
        recommendation: 'Truncate audit log context or introduce map-reduce summarizing prior to prompt injection to reduce token costs.',
        analysisCategory: 'deterministic',
        samplingInfo: DemoIncidentAnalyzer.SAMPLING_INFO_COPY,
        disclaimer: DemoIncidentAnalyzer.CONFIDENCE_DISCLAIMER,
        futureRemediation: {
          action: 'Linear Optimization Task',
          target: 'agent-prompt-v2.1',
          details: 'Future VOID Server opens Linear issue LIN-510 to optimize prompt context window.',
        },
      };
    }

    // 2. Semantic Analysis for Category-Flagged Traces
    const isHallucination =
      trace.attributes['incident.type'] === 'hallucination' ||
      (trace.prompt.toLowerCase().includes('weather') && trace.toolCalls.length === 0) ||
      trace.index === 4;

    const requestedAction = trace.attributes['requested.action'] as string | undefined;
    const isWrongTool =
      trace.attributes['incident.type'] === 'wrong_tool' ||
      trace.index === 8 ||
      (requestedAction ? !trace.toolCalls.includes(requestedAction) : false) ||
      (trace.prompt.toLowerCase().includes('issue') && trace.toolCalls.includes('slack.sendMessage') && !trace.toolCalls.includes('github.createIssue'));

    if (trace.flaggedForSemantic || isHallucination || isWrongTool) {
      if (isHallucination) {
        const isWeatherQuery = trace.prompt.toLowerCase().includes('weather') || trace.index === 4;
        const toolAuditText = isWeatherQuery
          ? 'Telemetry audit confirms 0 weather tools were executed'
          : `Telemetry audit confirms 0 tools were executed for query requiring factual lookup (total tools executed: ${trace.toolCalls.length})`;

        const timeline = isWeatherQuery
          ? [
              '10:08:12.010 - User query parsed by NovaFlow Copilot',
              '10:08:12.045 - Reasoning step bypassed weather API tool lookup',
              '10:08:12.285 - Synthetic response emitted without factual grounding span',
            ]
          : [
              `User query parsed: "${trace.prompt.slice(0, 45)}..."`,
              'Reasoning step bypassed required tool lookup',
              'Response emitted without factual grounding span',
            ];

        return {
          incident: 'Ungrounded Response / Hallucination',
          severity: 'warning',
          confidence: 94,
          evidence: [
            `User Prompt: "${trace.prompt}"`,
            `Agent Output: "${trace.response}"`,
            toolAuditText,
            'Response contains factual claims not backed by tool execution traces',
          ],
          timeline,
          recommendation: 'Enforce tool execution policy for domain-specific queries or add grounding check prior to response emission.',
          analysisCategory: 'semantic',
          samplingInfo: DemoIncidentAnalyzer.SAMPLING_INFO_COPY,
          disclaimer: DemoIncidentAnalyzer.CONFIDENCE_DISCLAIMER,
          futureRemediation: {
            action: 'Linear Ticket & Prompt Guard Policy',
            target: 'novaflow/prompts#hallucination-guard',
            details: 'Future VOID Server creates Linear ticket LIN-402 to update prompt instructions requiring weather tool validation.',
          },
        };
      }

      if (isWrongTool) {
        const expectedTool = requestedAction || 'github.createIssue';
        const executedToolsStr = trace.toolCalls.length > 0 ? trace.toolCalls.join(', ') : 'none';
        const isSlackMismatch = trace.index === 8 || trace.toolCalls.includes('slack.sendMessage');

        const evidence = [
          `User requested: "${trace.prompt}" (Expected: ${expectedTool})`,
          `Agent executed: ${executedToolsStr}`,
          isSlackMismatch
            ? 'Action mismatch: User explicitly requested issue creation on GitHub, but agent posted to Slack channel #dev-general instead'
            : `Action mismatch: User requested ${expectedTool}, but agent executed ${executedToolsStr} instead`,
        ];

        const timeline = isSlackMismatch
          ? [
              '10:21:40.010 - User prompt requested GitHub issue creation for payment bug',
              '10:21:40.050 - Tool selection node misclassified intent as Slack notification',
              '10:21:40.075 - slack.sendMessage executed with payment bug description',
              '10:21:40.220 - Agent reported success despite wrong tool execution',
            ]
          : [
              `User prompt parsed: "${trace.prompt.slice(0, 45)}..."`,
              `Tool selection node misclassified intent (expected ${expectedTool})`,
              `Executed tool: ${executedToolsStr}`,
              'Agent reported execution finish despite action mismatch',
            ];

        return {
          incident: 'Wrong Tool Selection / Action Mismatch',
          severity: 'critical',
          confidence: 98,
          evidence,
          timeline,
          recommendation: 'Refine tool definitions, improve few-shot tool selection examples, and block destructive mismatches.',
          analysisCategory: 'semantic',
          samplingInfo: DemoIncidentAnalyzer.SAMPLING_INFO_COPY,
          disclaimer: DemoIncidentAnalyzer.CONFIDENCE_DISCLAIMER,
          futureRemediation: {
            action: 'Automated GitHub Issue Creation',
            target: 'novaflow/payments#188',
            details: 'Future VOID Server automatically creates the missing GitHub issue for payment gateway timeout bug and notifies Slack.',
          },
        };
      }
    }

    // Preserve severity for unhandled non-success traces
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
        samplingInfo: DemoIncidentAnalyzer.SAMPLING_INFO_COPY,
        disclaimer: DemoIncidentAnalyzer.CONFIDENCE_DISCLAIMER,
      };
    }

    // Default: Normal Execution
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
      samplingInfo: DemoIncidentAnalyzer.SAMPLING_INFO_COPY,
      disclaimer: DemoIncidentAnalyzer.CONFIDENCE_DISCLAIMER,
    };
  }
}

export const demoIncidentAnalyzer = new DemoIncidentAnalyzer();
