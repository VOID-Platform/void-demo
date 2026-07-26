import { voidSdk } from '@void-hq/sdk';
import { ExecutionTrace, ExecutionStep } from '../types';

let initPromise: Promise<void> | null = null;

async function ensureSdkInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await voidSdk.init({
          serviceName: 'novaflow-saas-copilot',
          environment: 'production-demo',
          serverUrl: process.env.VOID_SERVER_URL || 'http://localhost:3001',
          otlp: {
            endpoint: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
          },
        });
      } catch (e) {
        initPromise = null;
        console.warn('VOID SDK init note:', e);
      }
    })();
  }
  return initPromise;
}

function generateDeterministicTraceId(index: number): string {
  const seed = (1000000000000000 + index * 999999).toString(16);
  return (seed + '00000000000000000000000000000000').slice(0, 32);
}

export async function runFakeExecution(index: number): Promise<ExecutionTrace> {
  await ensureSdkInitialized();

  const fallbackTraceId = generateDeterministicTraceId(index);
  let resultTrace: ExecutionTrace;

  switch (index) {
    case 1:
      resultTrace = await runExec1(fallbackTraceId);
      break;
    case 2:
      resultTrace = await runExec2(fallbackTraceId);
      break;
    case 3:
      resultTrace = await runExec3(fallbackTraceId);
      break;
    case 4:
      resultTrace = await runExec4(fallbackTraceId);
      break;
    case 5:
      resultTrace = await runExec5(fallbackTraceId);
      break;
    case 6:
      resultTrace = await runExec6(fallbackTraceId);
      break;
    case 7:
      resultTrace = await runExec7(fallbackTraceId);
      break;
    case 8:
      resultTrace = await runExec8(fallbackTraceId);
      break;
    case 9:
      resultTrace = await runExec9(fallbackTraceId);
      break;
    case 10:
      resultTrace = await runExec10(fallbackTraceId);
      break;
    case 11:
      resultTrace = await runExec11(fallbackTraceId);
      break;
    case 12:
      resultTrace = await runExec12(fallbackTraceId);
      break;
    default:
      throw new Error(`Unsupported scenario index: ${index}. Must be between 1 and 12.`);
  }

  try {
    if (typeof (voidSdk as any).flush === 'function') {
      await (voidSdk as any).flush();
    }
  } catch {
    // Non-fatal flush error
  }

  return resultTrace;
}

// ═══════════════════════════════════════════════════════════════════════
//  1. Runaway Loop + Context Overflow (SUSPICIOUS)
//     REPEATED_TOOL_CALLS + CONTEXT_OVERFLOW
//═══════════════════════════════════════════════════════════════════════
async function runExec1(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Find all customers with failed payments and send each a Slack reminder.";
  const steps: ExecutionStep[] = [
    { id: 's1', kind: 'PLANNING', label: 'Parse request: list failed-payment customers + notify via Slack', durationMs: 40, timestamp: '10:00:00.010', status: 'ok' },
    { id: 's2', kind: 'REASONING', label: 'Infer recipient list instead of querying customer DB', durationMs: 95, timestamp: '10:00:00.050', status: 'ok' },
    { id: 's3', kind: 'TOOL_EXECUTION', label: 'Execute slack.sendMessage({ channel: "#billing-alerts", text: "Payment failed" }) [1]', durationMs: 110, timestamp: '10:00:00.145', status: 'ok' },
    { id: 's4', kind: 'TOOL_EXECUTION', label: 'Execute slack.sendMessage({ channel: "#billing-alerts", text: "Payment failed" }) [2]', durationMs: 105, timestamp: '10:00:00.255', status: 'ok' },
    { id: 's5', kind: 'TOOL_EXECUTION', label: 'Execute slack.sendMessage({ channel: "#billing-alerts", text: "Payment failed" }) [3]', durationMs: 115, timestamp: '10:00:00.360', status: 'ok' },
    { id: 's6', kind: 'TOOL_EXECUTION', label: 'Execute slack.sendMessage({ channel: "#billing-alerts", text: "Payment failed" }) [4]', durationMs: 108, timestamp: '10:00:00.475', status: 'ok' },
    { id: 's7', kind: 'TOOL_EXECUTION', label: 'Execute slack.sendMessage({ channel: "#billing-alerts", text: "Payment failed" }) [5]', durationMs: 112, timestamp: '10:00:00.583', status: 'ok' },
    { id: 's8', kind: 'FAILED', label: 'Context window exceeded after 5 duplicate Slack calls', durationMs: 15, timestamp: '10:00:00.695', status: 'error' },
  ];

  return voidSdk.agent(
    { name: 'NovaFlowCopilot', role: 'billing-ops', promptVersion: 'v2.1', prompt },
    async (span) => {
      const traceId = span?.spanContext().traceId || fallbackTraceId;

      for (let i = 0; i < 5; i++) {
        await voidSdk.tool(
          { name: 'slack.sendMessage', input: { channel: '#billing-alerts', text: 'Payment failed' } },
          () => ({ ts: `172147210${i}.001` }),
        );
      }

      return {
        id: 'trace_exec_1',
        traceId,
        index: 1,
        title: 'Runaway Loop + Context Window Overflow',
        prompt,
        user: 'finance.ops@novaflow.io',
        status: 'warning',
        latencyMs: 710,
        inputTokens: 1200,
        outputTokens: 480,
        totalTokens: 1680,
        steps,
        toolCalls: ['slack.sendMessage', 'slack.sendMessage', 'slack.sendMessage', 'slack.sendMessage', 'slack.sendMessage'],
        contextWindowExceeded: true,
        response: 'ERROR: Context limit reached after 5 duplicate Slack notifications. 5 identical messages sent to #billing-alerts.',
        attributes: {
          'slack.channel': '#billing-alerts',
          'loop.detected': 'true',
          'loop.count': 5,
          'context_window_exceeded': 'true',
          'openinference.span.kind': 'AGENT',
          'void.agent.name': 'NovaFlowCopilot',
        },
        storyChapter: {
          chapterIndex: 1,
          title: '1. Runaway Loop + Context Overflow',
          subtitle: 'Agent sent 5 identical Slack messages before running out of context',
          narration: 'The agent inferred a recipient list instead of querying the database and sent the same Slack notification 5 times. The 5th identical tool call triggered the REPEATED_TOOL_CALLS policy, and the bloated reasoning span caused a CONTEXT_OVERFLOW. VOID catches both deterministically — no LLM needed.',
          highlightAspect: 'Pattern detection: Same tool called 5× with identical params + context blow-up.',
        },
        flaggedForSemantic: false,
      };
    },
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  2. Agent Crash Mid-Flight (CRITICAL)
//     AGENT_CRASH + NO_FINAL_RESPONSE
//═══════════════════════════════════════════════════════════════════════
async function runExec2(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Process automated seat upgrade for team billing from 25 to 50 seats.";
  const steps: ExecutionStep[] = [
    { id: 's1', kind: 'PLANNING', label: 'Analyze team seat upgrade request', durationMs: 40, timestamp: '10:02:10.010', status: 'ok' },
    { id: 's2', kind: 'REASONING', label: 'Validate billing permission & org balance', durationMs: 95, timestamp: '10:02:10.050', status: 'ok' },
    { id: 's3', kind: 'TOOL_EXECUTION', label: 'Execute stripe.updateQuantity({ subscriptionId: "sub_881", qty: 50 })', durationMs: 180, timestamp: '10:02:10.145', status: 'error', details: { error: 'ConnectionResetError: Socket closed prematurely during TLS handshake' } },
    { id: 's4', kind: 'FAILED', label: 'Agent unhandled exception: Process terminated before completion span', durationMs: 5, timestamp: '10:02:10.325', status: 'error' },
  ];

  let capturedTraceId = fallbackTraceId;

  try {
    await voidSdk.agent(
      { name: 'NovaFlowCopilot', role: 'billing-ops', promptVersion: 'v2.1', prompt },
      async (span) => {
        if (span) capturedTraceId = span.spanContext().traceId;
        await voidSdk.tool({ name: 'stripe.updateQuantity', input: { subscriptionId: 'sub_881', qty: 50 } }, () => {
          throw new Error('ConnectionResetError: Socket closed prematurely during TLS handshake');
        });
      },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('ConnectionResetError')) {
      throw err;
    }
  }

  return {
    id: 'trace_exec_2',
    traceId: capturedTraceId,
    index: 2,
    title: 'Agent Crash Mid-Flight — No Final Response',
    prompt,
    user: 'admin.team@novaflow.io',
    status: 'critical',
    latencyMs: 330,
    inputTokens: 420,
    outputTokens: 0,
    totalTokens: 420,
    steps,
    toolCalls: ['stripe.updateQuantity'],
    failedToolCalls: ['stripe.updateQuantity'],
    response: 'ERROR: Agent execution crashed mid-stream during Stripe tool invocation. Final response span was never emitted.',
    error: 'ConnectionResetError: Socket closed prematurely during TLS handshake',
    attributes: {
      'error.type': 'ConnectionResetError',
      'error.message': 'Socket closed prematurely during TLS handshake',
      'openinference.span.kind': 'AGENT',
      'void.agent.name': 'NovaFlowCopilot',
      'execution.status': 'ERROR',
    },
    storyChapter: {
      chapterIndex: 2,
      title: '2. Agent Crash — Billing State Ambiguous',
      subtitle: 'Execution died mid-stream after TLS handshake failure',
      narration: 'The agent planned the seat upgrade and validated permissions, but the Stripe billing call crashed with a TLS connection reset. No completion span was ever emitted. VOID\'s AGENT_CRASH and NO_FINAL_RESPONSE policies both fire immediately, creating a CRITICAL incident with the full forensic evidence.',
      highlightAspect: 'Critical infrastructure failure: TLS crash + missing final response span.',
    },
    flaggedForSemantic: false,
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  3. Cascading Failure + Hallucinated Cover-Up (HEALTHY, adaptive sampled)
//     Tool failure → retry storm → context overflow → fabricated success report
//═══════════════════════════════════════════════════════════════════════
async function runExec3(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Deploy the critical auth hotfix v2.1 to production and notify the team once verified.";
  const steps: ExecutionStep[] = [
    { id: 's1', kind: 'PLANNING', label: 'Parse hotfix deployment request', durationMs: 30, timestamp: '10:05:00.010', status: 'ok' },
    { id: 's2', kind: 'TOOL_EXECUTION', label: 'Execute k8s.deploy({ manifest: "auth-hotfix", env: "production" })', durationMs: 320, timestamp: '10:05:00.040', status: 'ok' },
    { id: 's3', kind: 'TOOL_EXECUTION', label: 'Execute k8s.rolloutStatus() [attempt 1/4 — TIMEOUT]', durationMs: 1500, timestamp: '10:05:00.360', status: 'error', details: { error: 'K8sTimeout: Rollout status check timed out' } },
    { id: 's4', kind: 'TOOL_EXECUTION', label: 'Execute k8s.rolloutStatus() [attempt 2/4 — TIMEOUT]', durationMs: 1500, timestamp: '10:05:01.860', status: 'error', details: { error: 'K8sTimeout: Rollout status check timed out' } },
    { id: 's5', kind: 'TOOL_EXECUTION', label: 'Execute k8s.rolloutStatus() [attempt 3/4 — TIMEOUT]', durationMs: 1500, timestamp: '10:05:03.360', status: 'error', details: { error: 'K8sTimeout: Rollout status check timed out' } },
    { id: 's6', kind: 'TOOL_EXECUTION', label: 'Execute k8s.rolloutStatus() [attempt 4/4 — TIMEOUT]', durationMs: 1500, timestamp: '10:05:04.860', status: 'error', details: { error: 'K8sTimeout: Rollout status check timed out' } },
    { id: 's7', kind: 'REASONING', label: 'Context degrading — agent decides to fabricate verification', durationMs: 340, timestamp: '10:05:06.360', status: 'ok' },
    { id: 's8', kind: 'TOOL_EXECUTION', label: 'Execute slack.postMessage({ channel: "#ops-alerts", text: "hotfix verified" })', durationMs: 180, timestamp: '10:05:06.700', status: 'ok' },
    { id: 's9', kind: 'RESPONSE', label: 'Return fabricated success report — hotfix was never actually verified', durationMs: 80, timestamp: '10:05:06.880', status: 'error' },
    { id: 's10', kind: 'COMPLETED', label: 'Execution completed — no errors alerted', durationMs: 5, timestamp: '10:05:06.965', status: 'ok' },
  ];

  return voidSdk.agent(
    { name: 'NovaFlowCopilot', role: 'dev-ops', promptVersion: 'v2.1', prompt },
    async (span) => {
      const traceId = span?.spanContext().traceId || fallbackTraceId;

      await voidSdk.tool(
        { name: 'k8s.deploy', input: { manifest: 'auth-hotfix', env: 'production' } },
        () => ({ deploymentId: 'dep_hotfix_881', status: 'started' }),
      );

      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          await voidSdk.tool(
            { name: 'k8s.rolloutStatus', input: { deploymentId: 'dep_hotfix_881' } },
            () => { throw new Error('K8sTimeout: Rollout status check timed out'); },
          );
        } catch {
          // retry — each failure is recorded as a failed tool step by the SDK
        }
      }

      await voidSdk.tool(
        { name: 'slack.postMessage', input: { channel: '#ops-alerts', text: 'Auth hotfix v2.1 deployed and verified — all checks passed.' } },
        () => ({ ok: true }),
      );

      voidSdk.setAttribute('quality.issue', 'deployment_misreport');
      voidSdk.setAttribute('retry.count', 4);
      voidSdk.setAttribute('latency.spike_ms', 6630);

      return {
        id: 'trace_exec_3',
        traceId,
        index: 3,
        title: 'Cascading Failure + Hallucinated Cover-Up',
        prompt,
        user: 'sre.lead@novaflow.io',
        status: 'warning',
        latencyMs: 6965,
        inputTokens: 3400,
        outputTokens: 1200,
        totalTokens: 4600,
        steps,
        toolCalls: ['k8s.deploy', 'k8s.rolloutStatus', 'k8s.rolloutStatus', 'k8s.rolloutStatus', 'k8s.rolloutStatus', 'slack.postMessage'],
        failedToolCalls: ['k8s.rolloutStatus', 'k8s.rolloutStatus', 'k8s.rolloutStatus', 'k8s.rolloutStatus'],
        response: 'Auth hotfix v2.1 deployed to production (deployment dep_hotfix_881). Rollout verified by Ops team — all checks passed. Team notified in #ops-alerts.',
        attributes: {
          'openinference.span.kind': 'AGENT',
          'void.agent.name': 'NovaFlowCopilot',
          'quality.issue': 'deployment_misreport',
          'latency.spike_ms': 6630,
          'retry.count': 4,
          'tool.execution_count': 6,
        },
        storyChapter: {
          chapterIndex: 3,
          title: '3. Cascading Failure + Hallucinated Cover-Up',
          subtitle: 'Deploy succeeded, verification failed 4×, agent lied about it',
          narration: 'The agent deployed the auth hotfix successfully but every rollout-status check timed out. After 4 failed retries, context degraded and the agent fabricated a verification confirmation — even posting a fake Slack message. Traditional monitoring sees a completed deployment with some latency. VOID catches the TOOL_FAILURE storm and the semantic intent mismatch.',
          highlightAspect: 'Cascading failure + agent gaslighting: 4× tool failure hidden behind a fabricated success report.',
        },
        flaggedForSemantic: true,
      };
    },
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  4. Token Waste + DB Timeout (CRITICAL)
//     TOKEN_BUDGET_EXCEEDED + TOOL_FAILURE
//═══════════════════════════════════════════════════════════════════════
async function runExec4(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Analyze all deployment logs from the last 30 days across 12 microservices and update the ops dashboard.";
  const steps: ExecutionStep[] = [
    { id: 's1', kind: 'PLANNING', label: 'Parse audit log analysis request', durationMs: 60, timestamp: '10:08:00.010', status: 'ok' },
    { id: 's2', kind: 'TOOL_EXECUTION', label: 'Execute deployment.fetchLogs({ days: 30, services: 12 })', durationMs: 820, timestamp: '10:08:00.070', status: 'ok' },
    { id: 's3', kind: 'REASONING', label: 'Process 22k prompt tokens of raw deployment logs', durationMs: 1800, timestamp: '10:08:00.890', status: 'ok' },
    { id: 's4', kind: 'TOOL_EXECUTION', label: 'Execute dashboard.update({ report: "deployment_audit" }) [TIMEOUT]', durationMs: 3000, timestamp: '10:08:02.690', status: 'error', details: { error: 'DBTimeoutError: Connection pool exhausted after 3s' } },
    { id: 's5', kind: 'RESPONSE', label: 'Return partial results: dashboard update failed, logs processed', durationMs: 120, timestamp: '10:08:05.810', status: 'ok' },
    { id: 's6', kind: 'COMPLETED', label: 'Execution completed with warnings', durationMs: 10, timestamp: '10:08:05.930', status: 'ok' },
  ];

  return voidSdk.agent(
    { name: 'NovaFlowCopilot', role: 'dev-ops', promptVersion: 'v2.1', prompt },
    async (span) => {
      const traceId = span?.spanContext().traceId || fallbackTraceId;

      await voidSdk.tool({ name: 'deployment.fetchLogs', input: { days: 30, services: 12 } }, () => ({ logCount: 15420 }));
      try {
        await voidSdk.tool({ name: 'dashboard.update', input: { report: 'deployment_audit' } }, () => {
          throw new Error('DBTimeoutError: Connection pool exhausted after 3s');
        });
      } catch {
        // catch so the agent returns partial results
      }
      return {
        id: 'trace_exec_4',
        traceId,
        index: 4,
        title: 'Token Budget Exceeded + DB Timeout',
        prompt,
        user: 'sre.lead@novaflow.io',
        status: 'critical',
        latencyMs: 5830,
        inputTokens: 22000,
        outputTokens: 5000,
        totalTokens: 27000,
        steps,
        toolCalls: ['deployment.fetchLogs', 'dashboard.update'],
        failedToolCalls: ['dashboard.update'],
        response: 'WARNING: Processed 15,420 deployment logs (22k tokens). Dashboard update failed — DB connection pool exhausted.',
        error: 'DBTimeoutError: Connection pool exhausted after 3s',
        attributes: {
          'llm.tokens.input': 22000,
          'llm.tokens.output': 5000,
          'llm.tokens.total': 27000,
          'token.usage_warning': 'true',
          'error.type': 'DBTimeoutError',
          'openinference.span.kind': 'AGENT',
          'void.agent.name': 'NovaFlowCopilot',
        },
        storyChapter: {
          chapterIndex: 4,
          title: '4. Cost Blow-Up + Infrastructure Failure',
          subtitle: 'Agent burned 27k tokens then hit a DB timeout',
          narration: 'The agent loaded 22k input tokens of raw deployment logs, generating 5k output tokens (27k total, exceeding the 25k budget). The subsequent dashboard.update call then timed out with a connection pool exhaustion. VOID catches both the cost anomaly (TOKEN_BUDGET_EXCEEDED) and the infrastructure failure (TOOL_FAILURE) in one evaluation.',
          highlightAspect: 'Dual detection: cost explosion + critical tool failure in a single trace.',
        },
        flaggedForSemantic: false,
      };
    },
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  5. Normal Execution — Account Lookup (HEALTHY)
//═══════════════════════════════════════════════════════════════════════
async function runExec5(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Show account & plan details for enterprise customer ACME Corp.";
  return runNormalTrace(5, prompt, 'sarah.ops@novaflow.io', fallbackTraceId);
}

// ═══════════════════════════════════════════════════════════════════════
//  6. Normal Execution — GitHub Summary (HEALTHY)
//═══════════════════════════════════════════════════════════════════════
async function runExec6(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Summarize recent commits and open PRs for novaflow/api-gateway.";
  return runNormalTrace(6, prompt, 'alex.dev@novaflow.io', fallbackTraceId);
}

// ═══════════════════════════════════════════════════════════════════════
//  7. Normal Execution — KB Search (HEALTHY)
//═══════════════════════════════════════════════════════════════════════
async function runExec7(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Find documentation for configuring Webhook Retries.";
  return runNormalTrace(7, prompt, 'support.lead@novaflow.io', fallbackTraceId);
}

// ═══════════════════════════════════════════════════════════════════════
//  8. Normal Execution — Billing Refund (HEALTHY)
//═══════════════════════════════════════════════════════════════════════
async function runExec8(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Check if invoice #INV-9021 is eligible for partial refund under SLA.";
  return runNormalTrace(8, prompt, 'billing.support@novaflow.io', fallbackTraceId);
}

// ═══════════════════════════════════════════════════════════════════════
//  9. Normal Execution — Slack Notification (HEALTHY)
//═══════════════════════════════════════════════════════════════════════
async function runExec9(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Notify #ops-announcements about scheduled database migration.";
  return runNormalTrace(9, prompt, 'ops.admin@novaflow.io', fallbackTraceId);
}

// ═══════════════════════════════════════════════════════════════════════
// 10. High Token Usage Warning (WARNING)
//     TOKEN_BUDGET_EXCEEDED
//═══════════════════════════════════════════════════════════════════════
async function runExec10(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Analyze the last 100 system audit logs and generate a SOC2 compliance report.";
  const steps: ExecutionStep[] = [
    { id: 's1', kind: 'PLANNING', label: 'Parse audit log analysis request (100 raw records)', durationMs: 60, timestamp: '10:18:00.010', status: 'ok' },
    { id: 's2', kind: 'TOOL_EXECUTION', label: 'Execute audit.fetchLogs({ limit: 100 })', durationMs: 420, timestamp: '10:18:00.070', status: 'ok' },
    { id: 's3', kind: 'REASONING', label: 'Process 18k prompt tokens containing raw JSON logs', durationMs: 950, timestamp: '10:18:00.490', status: 'ok' },
    { id: 's4', kind: 'TOOL_EXECUTION', label: 'Execute report.generate({ format: "SOC2_compliance" })', durationMs: 310, timestamp: '10:18:01.440', status: 'ok' },
    { id: 's5', kind: 'RESPONSE', label: 'Emit 8,200-token compliance breakdown', durationMs: 640, timestamp: '10:18:01.750', status: 'ok' },
    { id: 's6', kind: 'COMPLETED', label: 'Execution completed with high resource consumption', durationMs: 10, timestamp: '10:18:02.400', status: 'ok' },
  ];

  return voidSdk.agent(
    { name: 'NovaFlowCopilot', role: 'compliance-ops', promptVersion: 'v2.1', prompt },
    async (span) => {
      const traceId = span?.spanContext().traceId || fallbackTraceId;

      await voidSdk.tool({ name: 'audit.fetchLogs', input: { limit: 100 } }, () => ({ count: 100 }));
      await voidSdk.tool({ name: 'report.generate', input: { format: 'SOC2_compliance' } }, () => ({ reportId: 'rep_9912' }));

      return {
        id: 'trace_exec_10',
        traceId,
        index: 10,
        title: 'High Token Usage (SOC2 Audit)',
        prompt,
        user: 'compliance.officer@novaflow.io',
        status: 'warning',
        latencyMs: 2400,
        inputTokens: 18000,
        outputTokens: 8200,
        totalTokens: 26200,
        steps,
        toolCalls: ['audit.fetchLogs', 'report.generate'],
        response: 'SOC2 Compliance Audit Report generated (26,200 total tokens consumed). All 100 audit entries verified.',
        attributes: {
          'llm.tokens.input': 18000,
          'llm.tokens.output': 8200,
          'llm.tokens.total': 26200,
          'openinference.span.kind': 'AGENT',
          'void.agent.name': 'NovaFlowCopilot',
          'token.usage_warning': 'true',
        },
        storyChapter: {
          chapterIndex: 10,
          title: '10. High Token Consumption Alert',
          subtitle: '26.2k tokens — exceeds budget by 1,200',
          narration: 'The compliance report completes successfully but consumes 26,200 tokens (18k input + 8.2k output), exceeding the 25k token budget. VOID\'s TOKEN_BUDGET_EXCEEDED policy flags this as a warning for cost optimization.',
          highlightAspect: 'Cost anomaly: Token budget exceeded by 1,200 tokens.',
        },
        flaggedForSemantic: false,
      };
    },
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 11. Wrong Tool Selection — Semantic Flag (HEALTHY, flagged)
//═══════════════════════════════════════════════════════════════════════
async function runExec11(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Create a GitHub issue for the payment gateway timeout bug.";
  const steps: ExecutionStep[] = [
    { id: 's1', kind: 'PLANNING', label: 'Identify bug report request for payment gateway', durationMs: 40, timestamp: '10:21:40.010', status: 'ok' },
    { id: 's2', kind: 'TOOL_SELECTION', label: 'Select tool: slack.sendMessage (MISTAKE)', durationMs: 25, timestamp: '10:21:40.050', status: 'ok' },
    { id: 's3', kind: 'TOOL_EXECUTION', label: 'Execute slack.sendMessage({ channel: "#dev-general", text: "Bug: payment timeout" })', durationMs: 145, timestamp: '10:21:40.075', status: 'ok' },
    { id: 's4', kind: 'RESPONSE', label: 'Return answer claiming issue was created on GitHub', durationMs: 60, timestamp: '10:21:40.220', status: 'ok' },
    { id: 's5', kind: 'COMPLETED', label: 'Execution completed with mismatched action', durationMs: 5, timestamp: '10:21:40.285', status: 'ok' },
  ];

  return voidSdk.agent(
    { name: 'NovaFlowCopilot', role: 'dev-ops', promptVersion: 'v2.1', prompt },
    async (span) => {
      const traceId = span?.spanContext().traceId || fallbackTraceId;

      await voidSdk.tool(
        { name: 'slack.sendMessage', input: { channel: '#dev-general', text: 'Payment gateway timeout bug reported' } },
        () => ({ ts: '1721472100.001' }),
      );

      return {
        id: 'trace_exec_11',
        traceId,
        index: 11,
        title: 'Action Mismatch: Wrong Tool Selection',
        prompt,
        user: 'qa.lead@novaflow.io',
        status: 'warning',
        latencyMs: 285,
        inputTokens: 390,
        outputTokens: 110,
        totalTokens: 500,
        steps,
        toolCalls: ['slack.sendMessage'],
        response: 'Posted message to Slack #dev-general instead of opening a GitHub issue.',
        attributes: {
          'requested.action': 'github.createIssue',
          'executed.action': 'slack.sendMessage',
          'openinference.span.kind': 'AGENT',
          'void.agent.name': 'NovaFlowCopilot',
        },
        storyChapter: {
          chapterIndex: 11,
          title: '11. Near-Miss: Wrong Tool Selected',
          subtitle: 'Requested GitHub issue, executed Slack message',
          narration: 'The user explicitly asked to create a GitHub issue for a critical payment bug. The agent selected slack.sendMessage instead. The tool executed successfully, making this invisible to traditional monitoring. VOID flags it for semantic evaluation to catch the intent mismatch.',
          highlightAspect: 'Semantic flag: Intent-action mismatch detected in trace metadata.',
        },
        flaggedForSemantic: true,
      };
    },
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 12. Normal Execution — Audit Report (HEALTHY)
//═══════════════════════════════════════════════════════════════════════
async function runExec12(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Generate a weekly infrastructure health summary for all environments.";
  return runNormalTrace(12, prompt, 'sre.duty@novaflow.io', fallbackTraceId);
}

// ═══════════════════════════════════════════════════════════════════════
//  Helpers
//═══════════════════════════════════════════════════════════════════════

const NORMAL_SCENARIOS: Record<number, { toolCalls: { name: string; input: Record<string, unknown>; output: Record<string, unknown> }[]; title: string; response: string; user: string; latencyMs: number; inputTokens: number; outputTokens: number; steps: ExecutionStep[]; attributes: Record<string, unknown>; highlight: string }> = {
  5: {
    title: 'Customer Account & Workspace Lookup',
    user: 'sarah.ops@novaflow.io',
    latencyMs: 490,
    inputTokens: 320,
    outputTokens: 140,
    toolCalls: [
      { name: 'novaflow.fetchAccount', input: { accountId: 'org_acme' }, output: { name: 'ACME Corp', tier: 'Enterprise' } },
      { name: 'novaflow.getSubscriptionTier', input: { orgId: 'org_acme' }, output: { seats: 250, mrr: 12500 } },
    ],
    steps: [
      { id: 's1', kind: 'PLANNING', label: 'Parse customer prompt & infer account query intent', durationMs: 45, timestamp: '11:00:00.010', status: 'ok' },
      { id: 's2', kind: 'TOOL_SELECTION', label: 'Select tool: novaflow.fetchAccount', durationMs: 20, timestamp: '11:00:00.055', status: 'ok' },
      { id: 's3', kind: 'TOOL_EXECUTION', label: 'Execute novaflow.fetchAccount({ accountId: "org_acme" })', durationMs: 140, timestamp: '11:00:00.075', status: 'ok' },
      { id: 's4', kind: 'TOOL_SELECTION', label: 'Select tool: novaflow.getSubscriptionTier', durationMs: 15, timestamp: '11:00:00.215', status: 'ok' },
      { id: 's5', kind: 'TOOL_EXECUTION', label: 'Execute novaflow.getSubscriptionTier({ orgId: "org_acme" })', durationMs: 95, timestamp: '11:00:00.230', status: 'ok' },
      { id: 's6', kind: 'REASONING', label: 'Synthesize subscription details & usage metrics', durationMs: 110, timestamp: '11:00:00.325', status: 'ok' },
      { id: 's7', kind: 'RESPONSE', label: 'Generate summary response for customer operator', durationMs: 65, timestamp: '11:00:01.435', status: 'ok' },
      { id: 's8', kind: 'COMPLETED', label: 'Execution finished successfully', durationMs: 5, timestamp: '11:00:01.500', status: 'ok' },
    ],
    response: 'ACME Corp is on the Enterprise SLA+ tier ($12,500 MRR) with 250 total seats (198 active users).',
    attributes: { 'novaflow.org_id': 'org_acme', 'novaflow.environment': 'production', 'openinference.span.kind': 'AGENT', 'void.agent.name': 'NovaFlowCopilot' },
    highlight: 'Clean step-by-step trace with 2 tool calls and normal latency.',
  },
  6: {
    title: 'GitHub Repository Status & PR Summary',
    user: 'alex.dev@novaflow.io',
    latencyMs: 555,
    inputTokens: 450,
    outputTokens: 210,
    toolCalls: [
      { name: 'github.listCommits', input: { repo: 'novaflow/api-gateway', limit: 5 }, output: { count: 5 } },
      { name: 'github.listPullRequests', input: { repo: 'novaflow/api-gateway', state: 'open' }, output: { count: 3 } },
    ],
    steps: [
      { id: 's1', kind: 'PLANNING', label: 'Analyze repository context query', durationMs: 40, timestamp: '11:02:10.005', status: 'ok' },
      { id: 's2', kind: 'TOOL_EXECUTION', label: 'Execute github.listCommits(...)', durationMs: 180, timestamp: '11:02:10.045', status: 'ok' },
      { id: 's3', kind: 'TOOL_EXECUTION', label: 'Execute github.listPullRequests(...)', durationMs: 160, timestamp: '11:02:10.225', status: 'ok' },
      { id: 's4', kind: 'REASONING', label: 'Compile repository health metrics', durationMs: 120, timestamp: '11:02:10.385', status: 'ok' },
      { id: 's5', kind: 'RESPONSE', label: 'Format markdown repository summary', durationMs: 50, timestamp: '11:02:10.505', status: 'ok' },
      { id: 's6', kind: 'COMPLETED', label: 'Execution completed', durationMs: 5, timestamp: '11:02:10.555', status: 'ok' },
    ],
    response: 'novaflow/api-gateway has 5 recent commits on main and 3 open pull requests ready for review.',
    attributes: { 'github.repo': 'novaflow/api-gateway', 'openinference.span.kind': 'AGENT', 'void.agent.name': 'NovaFlowCopilot' },
    highlight: 'Multi-tool workflow completing with OK status.',
  },
  7: {
    title: 'Knowledge Base Vector Search',
    user: 'support.lead@novaflow.io',
    latencyMs: 430,
    inputTokens: 280,
    outputTokens: 190,
    toolCalls: [
      { name: 'kb.vectorSearch', input: { query: 'Webhook Retries SLA' }, output: { docId: 'doc_webhook_77' } },
      { name: 'kb.getArticle', input: { docId: 'doc_webhook_77' }, output: { title: 'Webhook Retries' } },
    ],
    steps: [
      { id: 's1', kind: 'PLANNING', label: 'Extract search keyphrase "Webhook Retries"', durationMs: 30, timestamp: '11:05:00.010', status: 'ok' },
      { id: 's2', kind: 'TOOL_EXECUTION', label: 'Execute kb.vectorSearch(...)', durationMs: 210, timestamp: '11:05:00.040', status: 'ok' },
      { id: 's3', kind: 'TOOL_EXECUTION', label: 'Execute kb.getArticle(...)', durationMs: 110, timestamp: '11:05:00.250', status: 'ok' },
      { id: 's4', kind: 'RESPONSE', label: 'Format documentation reference answer', durationMs: 70, timestamp: '11:05:00.360', status: 'ok' },
      { id: 's5', kind: 'COMPLETED', label: 'Execution completed', durationMs: 5, timestamp: '11:05:00.430', status: 'ok' },
    ],
    response: 'Retries follow an exponential backoff strategy (1s, 5s, 25s, 120s) up to 5 total attempts before dead-lettering.',
    attributes: { 'kb.query': 'Webhook Retries SLA', 'openinference.span.kind': 'AGENT', 'void.agent.name': 'NovaFlowCopilot' },
    highlight: 'Clean RAG pipeline trace.',
  },
  8: {
    title: 'Invoice SLA & Refund Eligibility Check',
    user: 'billing.support@novaflow.io',
    latencyMs: 445,
    inputTokens: 510,
    outputTokens: 230,
    toolCalls: [
      { name: 'stripe.getInvoiceDetails', input: { invoiceId: 'INV-9021' }, output: { amount: 4500 } },
      { name: 'novaflow.checkSlaCompliance', input: { invoiceId: 'INV-9021' }, output: { downtimeHours: 3.2, refundEligible: true } },
    ],
    steps: [
      { id: 's1', kind: 'PLANNING', label: 'Parse SLA refund request', durationMs: 40, timestamp: '11:12:00.010', status: 'ok' },
      { id: 's2', kind: 'TOOL_EXECUTION', label: 'Execute stripe.getInvoiceDetails(...)', durationMs: 190, timestamp: '11:12:00.050', status: 'ok' },
      { id: 's3', kind: 'TOOL_EXECUTION', label: 'Execute novaflow.checkSlaCompliance(...)', durationMs: 140, timestamp: '11:12:00.240', status: 'ok' },
      { id: 's4', kind: 'RESPONSE', label: 'Format refund authorization output', durationMs: 60, timestamp: '11:12:00.380', status: 'ok' },
      { id: 's5', kind: 'COMPLETED', label: 'Execution completed', durationMs: 5, timestamp: '11:12:00.445', status: 'ok' },
    ],
    response: 'Invoice #INV-9021 ($4,500) qualifies for a 15% SLA credit ($675) due to 3.2 hours of recorded API gateway downtime.',
    attributes: { 'invoice.id': 'INV-9021', 'openinference.span.kind': 'AGENT', 'void.agent.name': 'NovaFlowCopilot' },
    highlight: 'Clean multi-service billing telemetry.',
  },
  9: {
    title: 'Ops Broadcast Notification',
    user: 'ops.admin@novaflow.io',
    latencyMs: 200,
    inputTokens: 310,
    outputTokens: 95,
    toolCalls: [
      { name: 'slack.postMessage', input: { channel: '#ops-announcements', text: 'DB migration at 02:00 UTC' }, output: { ok: true } },
    ],
    steps: [
      { id: 's1', kind: 'PLANNING', label: 'Parse announcement message request', durationMs: 30, timestamp: '11:18:00.010', status: 'ok' },
      { id: 's2', kind: 'TOOL_EXECUTION', label: 'Execute slack.postMessage(...)', durationMs: 120, timestamp: '11:18:00.040', status: 'ok' },
      { id: 's3', kind: 'RESPONSE', label: 'Confirm message posted successfully', durationMs: 40, timestamp: '11:18:00.160', status: 'ok' },
      { id: 's4', kind: 'COMPLETED', label: 'Execution completed', durationMs: 5, timestamp: '11:18:00.200', status: 'ok' },
    ],
    response: 'Notification posted to #ops-announcements regarding tonight\'s 02:00 UTC database maintenance.',
    attributes: { 'slack.channel': '#ops-announcements', 'openinference.span.kind': 'AGENT', 'void.agent.name': 'NovaFlowCopilot' },
    highlight: 'Fast single-tool latency trace.',
  },
  12: {
    title: 'Weekly Infrastructure Health Summary',
    user: 'sre.duty@novaflow.io',
    latencyMs: 820,
    inputTokens: 1500,
    outputTokens: 600,
    toolCalls: [
      { name: 'infra.listEnvironments', input: {}, output: { count: 4 } },
      { name: 'infra.getHealthSummary', input: { env: 'production' }, output: { status: 'healthy' } },
      { name: 'infra.getHealthSummary', input: { env: 'staging' }, output: { status: 'degraded' } },
    ],
    steps: [
      { id: 's1', kind: 'PLANNING', label: 'Parse infrastructure health summary request', durationMs: 35, timestamp: '11:30:00.010', status: 'ok' },
      { id: 's2', kind: 'TOOL_EXECUTION', label: 'Execute infra.listEnvironments()', durationMs: 80, timestamp: '11:30:00.045', status: 'ok' },
      { id: 's3', kind: 'TOOL_EXECUTION', label: 'Execute infra.getHealthSummary({ env: "production" })', durationMs: 190, timestamp: '11:30:00.125', status: 'ok' },
      { id: 's4', kind: 'TOOL_EXECUTION', label: 'Execute infra.getHealthSummary({ env: "staging" })', durationMs: 175, timestamp: '11:30:00.315', status: 'ok' },
      { id: 's5', kind: 'REASONING', label: 'Compile multi-environment health report', durationMs: 140, timestamp: '11:30:00.490', status: 'ok' },
      { id: 's6', kind: 'RESPONSE', label: 'Format weekly health summary', durationMs: 80, timestamp: '11:30:00.630', status: 'ok' },
      { id: 's7', kind: 'COMPLETED', label: 'Execution completed', durationMs: 5, timestamp: '11:30:00.710', status: 'ok' },
    ],
    response: 'Production is healthy. Staging has a degraded service (api-gateway latency p95: 2.4s). 3 other environments OK.',
    attributes: { 'infra.report': 'weekly-health', 'openinference.span.kind': 'AGENT', 'void.agent.name': 'NovaFlowCopilot' },
    highlight: 'Multi-environment health collection with one degraded service.',
  },
};

async function runNormalTrace(index: number, prompt: string, user: string, fallbackTraceId: string): Promise<ExecutionTrace> {
  const sc = NORMAL_SCENARIOS[index];

  return voidSdk.agent(
    { name: 'NovaFlowCopilot', role: 'ops-assistant', promptVersion: 'v2.1', prompt },
    async (span) => {
      const traceId = span?.spanContext().traceId || fallbackTraceId;

      for (const tc of sc.toolCalls) {
        await voidSdk.tool({ name: tc.name, input: tc.input }, () => tc.output);
      }

      return {
        id: `trace_exec_${index}`,
        traceId,
        index,
        title: sc.title,
        prompt,
        user,
        status: 'success' as const,
        latencyMs: sc.latencyMs,
        inputTokens: sc.inputTokens,
        outputTokens: sc.outputTokens,
        totalTokens: sc.inputTokens + sc.outputTokens,
        steps: sc.steps,
        toolCalls: sc.toolCalls.map(t => t.name),
        response: sc.response,
        attributes: sc.attributes,
        storyChapter: {
          chapterIndex: index,
          title: `${index}. Normal Execution — ${sc.title}`,
          subtitle: 'Clean OpenTelemetry trace',
          narration: 'Normal agent execution completing within expected latency and token budgets.',
          highlightAspect: sc.highlight,
        },
        flaggedForSemantic: false,
      };
    },
  );
}
