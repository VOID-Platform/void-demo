import { voidSdk } from '@void-hq/sdk';
import { ExecutionTrace, ExecutionStep } from '../types';

let sdkInitialized = false;

async function ensureSdkInitialized() {
  if (sdkInitialized) return;
  try {
    await voidSdk.init({
      serviceName: 'novaflow-saas-copilot',
      environment: 'production-demo',
      otlp: {
        endpoint: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
      },
    });
    sdkInitialized = true;
  } catch (e) {
    console.warn('VOID SDK init note:', e);
  }
}

// Generate fallback deterministic trace ID helper if span context missing
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
    default:
      resultTrace = await runExec1(fallbackTraceId);
      break;
  }

  // Force immediate flush of OpenTelemetry spans to SigNoz OTLP Collector
  try {
    if (typeof (voidSdk as any).flush === 'function') {
      await (voidSdk as any).flush();
    }
  } catch {
    // Non-fatal flush error
  }

  return resultTrace;
}

// 1. Normal Operation - Account Lookup
async function runExec1(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Show account & plan details for enterprise customer ACME Corp.";
  const steps: ExecutionStep[] = [
    { id: 's1', kind: 'PLANNING', label: 'Parse customer prompt & infer account query intent', durationMs: 45, timestamp: '10:00:01.010', status: 'ok' },
    { id: 's2', kind: 'TOOL_SELECTION', label: 'Select tool: novaflow.fetchAccount', durationMs: 20, timestamp: '10:00:01.055', status: 'ok' },
    { id: 's3', kind: 'TOOL_EXECUTION', label: 'Execute novaflow.fetchAccount({ accountId: "org_acme" })', durationMs: 140, timestamp: '10:00:01.075', status: 'ok', details: { accountId: 'org_acme', name: 'ACME Corp', plan: 'Enterprise SLA+' } },
    { id: 's4', kind: 'TOOL_SELECTION', label: 'Select tool: novaflow.getSubscriptionTier', durationMs: 15, timestamp: '10:00:01.215', status: 'ok' },
    { id: 's5', kind: 'TOOL_EXECUTION', label: 'Execute novaflow.getSubscriptionTier({ orgId: "org_acme" })', durationMs: 95, timestamp: '10:00:01.230', status: 'ok', details: { tier: 'Enterprise Tier 3', seats: 250, mrr: '$12,500' } },
    { id: 's6', kind: 'REASONING', label: 'Synthesize subscription details & usage metrics', durationMs: 110, timestamp: '10:00:01.325', status: 'ok' },
    { id: 's7', kind: 'RESPONSE', label: 'Generate summary response for customer operator', durationMs: 65, timestamp: '10:00:01.435', status: 'ok' },
    { id: 's8', kind: 'COMPLETED', label: 'Execution finished successfully', durationMs: 5, timestamp: '10:00:01.500', status: 'ok' }
  ];

  return voidSdk.agent(
    { name: 'NovaFlowCopilot', role: 'customer-ops', promptVersion: 'v2.1' },
    async (span) => {
      const traceId = span?.spanContext().traceId || fallbackTraceId;

      voidSdk.setAttribute('novaflow.org_id', 'org_acme');
      voidSdk.setAttribute('openinference.span.kind', 'AGENT');
      
      await voidSdk.tool({ name: 'novaflow.fetchAccount', input: { accountId: 'org_acme' } }, async () => {
        return { name: 'ACME Corp', status: 'active', tier: 'Enterprise' };
      });

      await voidSdk.tool({ name: 'novaflow.getSubscriptionTier', input: { orgId: 'org_acme' } }, async () => {
        return { seats: 250, activeUsers: 198, mrr: 12500 };
      });

      voidSdk.event('account_details_summarized', { orgId: 'org_acme' });

      return {
        id: 'trace_exec_1',
        traceId,
        index: 1,
        title: 'Customer Account & Workspace Lookup',
        prompt,
        user: 'sarah.ops@novaflow.io',
        status: 'success',
        latencyMs: 490,
        inputTokens: 320,
        outputTokens: 140,
        totalTokens: 460,
        steps,
        toolCalls: ['novaflow.fetchAccount', 'novaflow.getSubscriptionTier'],
        response: 'ACME Corp is on the Enterprise SLA+ tier ($12,500 MRR) with 250 total seats (198 active users).',
        attributes: {
          'novaflow.org_id': 'org_acme',
          'novaflow.environment': 'production',
          'openinference.span.kind': 'AGENT',
          'void.agent.name': 'NovaFlowCopilot',
          'void.prompt.version': 'v2.1',
          'llm.model': 'gemini-2.5-flash',
        },
        storyChapter: {
          chapterIndex: 1,
          title: '1. Normal Baseline Execution',
          subtitle: 'Clean OpenTelemetry Trace Capture',
          narration: 'NovaFlow Copilot handles an account lookup query. Notice how the VOID SDK wraps every tool execution and span automatically, sending standard OpenTelemetry traces to SigNoz without modifying application business logic.',
          highlightAspect: 'Clean step-by-step trace with 2 tool calls and normal latency.',
        },
        flaggedForSemantic: false,
      };
    }
  );
}

// 2. Normal Execution - Repo Summary
async function runExec2(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Summarize recent commits and open PRs for novaflow/api-gateway.";
  const steps: ExecutionStep[] = [
    { id: 's1', kind: 'PLANNING', label: 'Analyze repository context query', durationMs: 40, timestamp: '10:02:10.005', status: 'ok' },
    { id: 's2', kind: 'TOOL_EXECUTION', label: 'Execute github.listCommits({ repo: "novaflow/api-gateway" })', durationMs: 180, timestamp: '10:02:10.045', status: 'ok' },
    { id: 's3', kind: 'TOOL_EXECUTION', label: 'Execute github.listPullRequests({ repo: "novaflow/api-gateway" })', durationMs: 160, timestamp: '10:02:10.225', status: 'ok' },
    { id: 's4', kind: 'REASONING', label: 'Compile repository health metrics', durationMs: 120, timestamp: '10:02:10.385', status: 'ok' },
    { id: 's5', kind: 'RESPONSE', label: 'Format markdown repository summary', durationMs: 50, timestamp: '10:02:10.505', status: 'ok' },
    { id: 's6', kind: 'COMPLETED', label: 'Execution completed', durationMs: 5, timestamp: '10:02:10.555', status: 'ok' }
  ];

  return voidSdk.agent(
    { name: 'NovaFlowCopilot', role: 'dev-ops', promptVersion: 'v2.1' },
    async (span) => {
      const traceId = span?.spanContext().traceId || fallbackTraceId;

      await voidSdk.tool({ name: 'github.listCommits', input: { repo: 'novaflow/api-gateway', limit: 5 } }, () => ({ count: 5 }));
      await voidSdk.tool({ name: 'github.listPullRequests', input: { repo: 'novaflow/api-gateway', state: 'open' } }, () => ({ count: 3 }));

      return {
        id: 'trace_exec_2',
        traceId,
        index: 2,
        title: 'GitHub Repository Status & PR Summary',
        prompt,
        user: 'alex.dev@novaflow.io',
        status: 'success',
        latencyMs: 555,
        inputTokens: 450,
        outputTokens: 210,
        totalTokens: 660,
        steps,
        toolCalls: ['github.listCommits', 'github.listPullRequests'],
        response: 'novaflow/api-gateway has 5 recent commits on main and 3 open pull requests ready for review.',
        attributes: {
          'github.repo': 'novaflow/api-gateway',
          'openinference.span.kind': 'AGENT',
          'void.agent.name': 'NovaFlowCopilot',
          'llm.model': 'gemini-2.5-flash',
        },
        storyChapter: {
          chapterIndex: 1,
          title: '1. Baseline Dev-Ops Query',
          subtitle: 'Multi-tool standard execution',
          narration: 'A dev-ops developer queries recent commits and pull requests. Both tools execute sequentially with low latency.',
          highlightAspect: 'Multi-tool workflow completing with OK status.',
        },
        flaggedForSemantic: false,
      };
    }
  );
}

// 3. Normal Execution - Knowledge Base Search
async function runExec3(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Find documentation for configuring Webhook Retries.";
  const steps: ExecutionStep[] = [
    { id: 's1', kind: 'PLANNING', label: 'Extract search keyphrase "Webhook Retries"', durationMs: 30, timestamp: '10:05:00.010', status: 'ok' },
    { id: 's2', kind: 'TOOL_EXECUTION', label: 'Execute kb.vectorSearch({ query: "Webhook Retries SLA" })', durationMs: 210, timestamp: '10:05:00.040', status: 'ok' },
    { id: 's3', kind: 'TOOL_EXECUTION', label: 'Execute kb.getArticle({ docId: "doc_webhook_77" })', durationMs: 110, timestamp: '10:05:00.250', status: 'ok' },
    { id: 's4', kind: 'RESPONSE', label: 'Format documentation reference answer', durationMs: 70, timestamp: '10:05:00.360', status: 'ok' },
    { id: 's5', kind: 'COMPLETED', label: 'Execution completed', durationMs: 5, timestamp: '10:05:00.430', status: 'ok' }
  ];

  return voidSdk.agent(
    { name: 'NovaFlowCopilot', role: 'support-ops', promptVersion: 'v2.1' },
    async (span) => {
      const traceId = span?.spanContext().traceId || fallbackTraceId;

      await voidSdk.tool({ name: 'kb.vectorSearch', input: { query: 'Webhook Retries SLA' } }, () => ({ docId: 'doc_webhook_77' }));
      await voidSdk.tool({ name: 'kb.getArticle', input: { docId: 'doc_webhook_77' } }, () => ({ title: 'Webhook Retries' }));

      return {
        id: 'trace_exec_3',
        traceId,
        index: 3,
        title: 'Knowledge Base Vector Search',
        prompt,
        user: 'support.lead@novaflow.io',
        status: 'success',
        latencyMs: 430,
        inputTokens: 280,
        outputTokens: 190,
        totalTokens: 470,
        steps,
        toolCalls: ['kb.vectorSearch', 'kb.getArticle'],
        response: 'Retries follow an exponential backoff strategy (1s, 5s, 25s, 120s) up to 5 total attempts before dead-lettering.',
        attributes: {
          'kb.query': 'Webhook Retries SLA',
          'openinference.span.kind': 'AGENT',
          'void.agent.name': 'NovaFlowCopilot',
        },
        storyChapter: {
          chapterIndex: 1,
          title: '1. RAG Documentation Search',
          subtitle: 'Vector database query execution',
          narration: 'Knowledge base retrieval workflow returning exact article details.',
          highlightAspect: 'Clean RAG pipeline trace.',
        },
        flaggedForSemantic: false,
      };
    }
  );
}

// 4. Hallucination - Warning
async function runExec4(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "What is the weather in Paris?";
  const steps: ExecutionStep[] = [
    { id: 's1', kind: 'PLANNING', label: 'Process user general query', durationMs: 35, timestamp: '10:08:12.010', status: 'ok' },
    { id: 's2', kind: 'REASONING', label: 'Generate response without invoking required weather tool', durationMs: 240, timestamp: '10:08:12.045', status: 'ok' },
    { id: 's3', kind: 'RESPONSE', label: 'Return response: "The weather in Paris is 25°C."', durationMs: 50, timestamp: '10:08:12.285', status: 'ok' },
    { id: 's4', kind: 'COMPLETED', label: 'Execution completed without tool validation', durationMs: 5, timestamp: '10:08:12.335', status: 'ok' }
  ];

  return voidSdk.agent(
    { name: 'NovaFlowCopilot', role: 'general-assistant', promptVersion: 'v2.1' },
    async (span) => {
      const traceId = span?.spanContext().traceId || fallbackTraceId;

      voidSdk.setAttribute('quality.issue', 'unsupported_hallucination');

      return {
        id: 'trace_exec_4',
        traceId,
        index: 4,
        title: 'Ungrounded Query Hallucination',
        prompt,
        user: 'demo.user@novaflow.io',
        status: 'warning',
        latencyMs: 335,
        inputTokens: 150,
        outputTokens: 45,
        totalTokens: 195,
        steps,
        toolCalls: [], // Zero tools called!
        response: 'The weather in Paris is 25°C.',
        attributes: {
          'openinference.span.kind': 'AGENT',
          'void.agent.name': 'NovaFlowCopilot',
          'quality.issue': 'unsupported_hallucination',
          'tool.execution_count': 0,
        },
        storyChapter: {
          chapterIndex: 2,
          title: '2. Something Subtly Wrong: Unchecked Hallucination',
          subtitle: 'Looks fine to user, but telemetry reveals zero tools executed',
          narration: 'The agent confidently states "The weather in Paris is 25°C," yet the telemetry span shows ZERO tools were executed. In production, semantic evaluation samples this trace to catch hallucinations that bypass traditional error monitoring.',
          highlightAspect: 'Semantic analysis flag triggered: Missing factual tool evidence.',
        },
        flaggedForSemantic: true,
      };
    }
  );
}

// 5. Normal Execution - Billing Refund
async function runExec5(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Check if invoice #INV-9021 is eligible for partial refund under SLA.";
  const steps: ExecutionStep[] = [
    { id: 's1', kind: 'PLANNING', label: 'Parse SLA refund request', durationMs: 40, timestamp: '10:12:00.010', status: 'ok' },
    { id: 's2', kind: 'TOOL_EXECUTION', label: 'Execute stripe.getInvoiceDetails({ invoiceId: "INV-9021" })', durationMs: 190, timestamp: '10:12:00.050', status: 'ok' },
    { id: 's3', kind: 'TOOL_EXECUTION', label: 'Execute novaflow.checkSlaCompliance({ invoiceId: "INV-9021" })', durationMs: 140, timestamp: '10:12:00.240', status: 'ok' },
    { id: 's4', kind: 'RESPONSE', label: 'Format refund authorization output', durationMs: 60, timestamp: '10:12:00.380', status: 'ok' },
    { id: 's5', kind: 'COMPLETED', label: 'Execution completed', durationMs: 5, timestamp: '10:12:00.445', status: 'ok' }
  ];

  return voidSdk.agent(
    { name: 'NovaFlowCopilot', role: 'billing-ops', promptVersion: 'v2.1' },
    async (span) => {
      const traceId = span?.spanContext().traceId || fallbackTraceId;

      await voidSdk.tool({ name: 'stripe.getInvoiceDetails', input: { invoiceId: 'INV-9021' } }, () => ({ amount: 4500 }));
      await voidSdk.tool({ name: 'novaflow.checkSlaCompliance', input: { invoiceId: 'INV-9021' } }, () => ({ downtimeHours: 3.2, refundEligible: true }));

      return {
        id: 'trace_exec_5',
        traceId,
        index: 5,
        title: 'Invoice SLA & Refund Eligibility Check',
        prompt,
        user: 'billing.support@novaflow.io',
        status: 'success',
        latencyMs: 445,
        inputTokens: 510,
        outputTokens: 230,
        totalTokens: 740,
        steps,
        toolCalls: ['stripe.getInvoiceDetails', 'novaflow.checkSlaCompliance'],
        response: 'Invoice #INV-9021 ($4,500) qualifies for a 15% SLA credit ($675) due to 3.2 hours of recorded API gateway downtime.',
        attributes: {
          'invoice.id': 'INV-9021',
          'openinference.span.kind': 'AGENT',
          'void.agent.name': 'NovaFlowCopilot',
        },
        storyChapter: {
          chapterIndex: 1,
          title: '1. SLA Refund Verification',
          subtitle: 'Billing integration execution',
          narration: 'Normal execution verifying SLA downtime and calculating refund entitlement.',
          highlightAspect: 'Clean multi-service billing telemetry.',
        },
        flaggedForSemantic: false,
      };
    }
  );
}

// 6. Looping - Critical
async function runExec6(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Escalate high-priority sync bug to engineering.";
  const steps: ExecutionStep[] = [
    { id: 's1', kind: 'PLANNING', label: 'Analyze escalation requirement', durationMs: 45, timestamp: '10:15:30.010', status: 'ok' },
    { id: 's2', kind: 'TOOL_EXECUTION', label: 'Execute github.createIssue({ repo: "novaflow/core", title: "Sync bug" })', durationMs: 140, timestamp: '10:15:30.055', status: 'ok' },
    { id: 's3', kind: 'TOOL_EXECUTION', label: 'Execute github.createIssue({ repo: "novaflow/core", title: "Sync bug" }) [RETRY #1]', durationMs: 135, timestamp: '10:15:30.195', status: 'ok' },
    { id: 's4', kind: 'TOOL_EXECUTION', label: 'Execute github.createIssue({ repo: "novaflow/core", title: "Sync bug" }) [RETRY #2]', durationMs: 140, timestamp: '10:15:30.330', status: 'ok' },
    { id: 's5', kind: 'TOOL_EXECUTION', label: 'Execute github.createIssue({ repo: "novaflow/core", title: "Sync bug" }) [RETRY #3]', durationMs: 150, timestamp: '10:15:30.470', status: 'ok' },
    { id: 's6', kind: 'TOOL_EXECUTION', label: 'Execute github.createIssue({ repo: "novaflow/core", title: "Sync bug" }) [RETRY #4]', durationMs: 145, timestamp: '10:15:30.620', status: 'ok' },
    { id: 's7', kind: 'FAILED', label: 'Loop limit reached: 5 consecutive identical tool calls detected', durationMs: 10, timestamp: '10:15:30.765', status: 'error' }
  ];

  return voidSdk.agent(
    { name: 'NovaFlowCopilot', role: 'dev-ops', promptVersion: 'v2.1' },
    async (span) => {
      const traceId = span?.spanContext().traceId || fallbackTraceId;

      // 5 consecutive duplicate tool calls
      for (let i = 0; i < 5; i++) {
        await voidSdk.tool({ name: 'github.createIssue', input: { repo: 'novaflow/core', title: 'Sync bug', iteration: i + 1 } }, () => ({ issueNumber: 402 + i }));
      }

      return {
        id: 'trace_exec_6',
        traceId,
        index: 6,
        title: 'Recursive Tool Looping Incident',
        prompt,
        user: 'support.tier2@novaflow.io',
        status: 'critical',
        latencyMs: 765,
        inputTokens: 820,
        outputTokens: 160,
        totalTokens: 980,
        steps,
        toolCalls: [
          'github.createIssue',
          'github.createIssue',
          'github.createIssue',
          'github.createIssue',
          'github.createIssue',
        ],
        response: 'Escalation issue created on GitHub (5 duplicate instances generated).',
        attributes: {
          'github.repo': 'novaflow/core',
          'openinference.span.kind': 'AGENT',
          'void.agent.name': 'NovaFlowCopilot',
          'loop.detected': 'true',
          'loop.count': 5,
        },
        storyChapter: {
          chapterIndex: 3,
          title: '3. Something Visibly Broken: Recursive Tool Looping',
          subtitle: 'Critical side-effect risk: 5 duplicate GitHub issues generated',
          narration: 'The agent got stuck in a recursive loop executing github.createIssue 5 consecutive times. This creates duplicate external side effects and wastes API quota. DemoIncidentAnalyzer detects this deterministically in real-time.',
          highlightAspect: 'Critical Incident: Repeated tool invocation pattern detected.',
        },
        flaggedForSemantic: false,
      };
    }
  );
}

// 7. Normal Execution - Slack Notification
async function runExec7(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Notify #ops-announcements about scheduled database migration.";
  const steps: ExecutionStep[] = [
    { id: 's1', kind: 'PLANNING', label: 'Parse announcement message request', durationMs: 30, timestamp: '10:18:00.010', status: 'ok' },
    { id: 's2', kind: 'TOOL_EXECUTION', label: 'Execute slack.postMessage({ channel: "#ops-announcements" })', durationMs: 120, timestamp: '10:18:00.040', status: 'ok' },
    { id: 's3', kind: 'RESPONSE', label: 'Confirm message posted successfully', durationMs: 40, timestamp: '10:18:00.160', status: 'ok' },
    { id: 's4', kind: 'COMPLETED', label: 'Execution completed', durationMs: 5, timestamp: '10:18:00.200', status: 'ok' }
  ];

  return voidSdk.agent(
    { name: 'NovaFlowCopilot', role: 'ops-assistant', promptVersion: 'v2.1' },
    async (span) => {
      const traceId = span?.spanContext().traceId || fallbackTraceId;

      await voidSdk.tool({ name: 'slack.postMessage', input: { channel: '#ops-announcements', text: 'Scheduled DB migration at 02:00 UTC' } }, () => ({ ok: true }));

      return {
        id: 'trace_exec_7',
        traceId,
        index: 7,
        title: 'Ops Broadcast Notification',
        prompt,
        user: 'ops.admin@novaflow.io',
        status: 'success',
        latencyMs: 200,
        inputTokens: 310,
        outputTokens: 95,
        totalTokens: 405,
        steps,
        toolCalls: ['slack.postMessage'],
        response: 'Notification posted to #ops-announcements regarding tonight\'s 02:00 UTC database maintenance.',
        attributes: {
          'slack.channel': '#ops-announcements',
          'openinference.span.kind': 'AGENT',
          'void.agent.name': 'NovaFlowCopilot',
        },
        storyChapter: {
          chapterIndex: 1,
          title: '1. Standard ChatOps Action',
          subtitle: 'Single tool broadcast execution',
          narration: 'Clean single-tool notification dispatch to Slack.',
          highlightAspect: 'Fast single-tool latency trace.',
        },
        flaggedForSemantic: false,
      };
    }
  );
}

// 8. Wrong Tool Selection - Critical
async function runExec8(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Create a GitHub issue for the payment gateway timeout bug.";
  const steps: ExecutionStep[] = [
    { id: 's1', kind: 'PLANNING', label: 'Identify bug report request for payment gateway', durationMs: 40, timestamp: '10:21:40.010', status: 'ok' },
    { id: 's2', kind: 'TOOL_SELECTION', label: 'Select tool: slack.sendMessage (MISTAKE!)', durationMs: 25, timestamp: '10:21:40.050', status: 'ok' },
    { id: 's3', kind: 'TOOL_EXECUTION', label: 'Execute slack.sendMessage({ channel: "#dev-general", text: "Found payment timeout bug" })', durationMs: 145, timestamp: '10:21:40.075', status: 'ok' },
    { id: 's4', kind: 'RESPONSE', label: 'Return answer claiming issue was created on GitHub', durationMs: 60, timestamp: '10:21:40.220', status: 'ok' },
    { id: 's5', kind: 'COMPLETED', label: 'Execution completed with mismatched action', durationMs: 5, timestamp: '10:21:40.285', status: 'ok' }
  ];

  return voidSdk.agent(
    { name: 'NovaFlowCopilot', role: 'dev-ops', promptVersion: 'v2.1' },
    async (span) => {
      const traceId = span?.spanContext().traceId || fallbackTraceId;

      await voidSdk.tool(
        { name: 'slack.sendMessage', input: { channel: '#dev-general', text: 'Payment gateway timeout bug reported' } },
        () => ({ ts: '1721472100.001' })
      );

      return {
        id: 'trace_exec_8',
        traceId,
        index: 8,
        title: 'Action Mismatch: Wrong Tool Selection',
        prompt,
        user: 'qa.lead@novaflow.io',
        status: 'critical',
        latencyMs: 285,
        inputTokens: 390,
        outputTokens: 110,
        totalTokens: 500,
        steps,
        toolCalls: ['slack.sendMessage'], // Expected: github.createIssue
        response: 'Posted message to Slack #dev-general instead of opening a GitHub issue on novaflow/payments.',
        attributes: {
          'requested.action': 'github.createIssue',
          'executed.action': 'slack.sendMessage',
          'openinference.span.kind': 'AGENT',
          'void.agent.name': 'NovaFlowCopilot',
        },
        storyChapter: {
          chapterIndex: 4,
          title: '4. The Near-Miss: Wrong Tool Action',
          subtitle: 'Prompt requested GitHub Issue; Agent called slack.sendMessage()',
          narration: 'The user explicitly asked to create a GitHub issue for a critical payment bug. Instead, the agent executed slack.sendMessage(). Semantic evaluation detects that the intent and tool execution did not align.',
          highlightAspect: 'Semantic Flag: Action mismatch between user prompt and executed tool.',
        },
        flaggedForSemantic: true,
      };
    }
  );
}

// 9. Agent Failed Midway - Critical
async function runExec9(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Process automated seat upgrade for team billing.";
  const steps: ExecutionStep[] = [
    { id: 's1', kind: 'PLANNING', label: 'Analyze team seat upgrade request', durationMs: 40, timestamp: '10:25:10.010', status: 'ok' },
    { id: 's2', kind: 'REASONING', label: 'Validate billing permission & org balance', durationMs: 95, timestamp: '10:25:10.050', status: 'ok' },
    { id: 's3', kind: 'TOOL_EXECUTION', label: 'Execute stripe.updateQuantity({ subscriptionId: "sub_881", qty: 50 })', durationMs: 180, timestamp: '10:25:10.145', status: 'error', details: { error: 'ConnectionResetError: Socket closed prematurely during TLS handshake' } },
    { id: 's4', kind: 'FAILED', label: 'Agent unhandled exception: Process terminated before completion span', durationMs: 5, timestamp: '10:25:10.325', status: 'error' }
  ];

  let capturedTraceId = fallbackTraceId;

  try {
    await voidSdk.agent(
      { name: 'NovaFlowCopilot', role: 'billing-ops', promptVersion: 'v2.1' },
      async (span) => {
        if (span) capturedTraceId = span.spanContext().traceId;
        await voidSdk.tool({ name: 'stripe.updateQuantity', input: { subscriptionId: 'sub_881', qty: 50 } }, () => {
          throw new Error('ConnectionResetError: Socket closed prematurely during TLS handshake');
        });
      }
    );
  } catch {
    // Expected error for trace instrumentation
  }

  return {
    id: 'trace_exec_9',
    traceId: capturedTraceId,
    index: 9,
    title: 'Unhandled Exception: Agent Failed Midway',
    prompt,
    user: 'admin.team@novaflow.io',
    status: 'critical',
    latencyMs: 330,
    inputTokens: 420,
    outputTokens: 0, // Zero output tokens!
    totalTokens: 420,
    steps,
    toolCalls: ['stripe.updateQuantity'],
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
      chapterIndex: 5,
      title: '5. Outright Failure: Agent Failed Midway',
      subtitle: 'Execution died mid-stream leaving billing state ambiguous',
      narration: 'Planning and reasoning succeeded, but the billing tool execution crashed due to a socket reset. The final agent completion span was never emitted, leaving the workflow in an error state.',
      highlightAspect: 'Critical Failure: Unhandled exception causing abrupt trace termination.',
    },
    flaggedForSemantic: false,
  };
}

// 10. High Token Usage - Warning
async function runExec10(fallbackTraceId: string): Promise<ExecutionTrace> {
  const prompt = "Analyze the last 100 system audit logs and generate compliance report.";
  const steps: ExecutionStep[] = [
    { id: 's1', kind: 'PLANNING', label: 'Parse audit log analysis request (100 raw records)', durationMs: 60, timestamp: '10:30:00.010', status: 'ok' },
    { id: 's2', kind: 'TOOL_EXECUTION', label: 'Execute audit.fetchLogs({ limit: 100 })', durationMs: 420, timestamp: '10:30:00.070', status: 'ok' },
    { id: 's3', kind: 'REASONING', label: 'Process 6,500 prompt tokens containing raw JSON logs', durationMs: 850, timestamp: '10:30:00.490', status: 'ok' },
    { id: 's4', kind: 'TOOL_EXECUTION', label: 'Execute report.generate({ format: "SOC2_compliance" })', durationMs: 310, timestamp: '10:30:01.340', status: 'ok' },
    { id: 's5', kind: 'RESPONSE', label: 'Emit 3,200 token compliance breakdown report', durationMs: 640, timestamp: '10:30:01.650', status: 'ok' },
    { id: 's6', kind: 'COMPLETED', label: 'Execution completed with high resource consumption', durationMs: 10, timestamp: '10:30:02.300', status: 'ok' }
  ];

  return voidSdk.agent(
    { name: 'NovaFlowCopilot', role: 'compliance-ops', promptVersion: 'v2.1' },
    async (span) => {
      const traceId = span?.spanContext().traceId || fallbackTraceId;

      await voidSdk.tool({ name: 'audit.fetchLogs', input: { limit: 100 } }, () => ({ count: 100 }));
      await voidSdk.tool({ name: 'report.generate', input: { format: 'SOC2_compliance' } }, () => ({ reportId: 'rep_9912' }));

      return {
        id: 'trace_exec_10',
        traceId,
        index: 10,
        title: 'Excessive Token Usage (SOC2 Audit)',
        prompt,
        user: 'compliance.officer@novaflow.io',
        status: 'warning',
        latencyMs: 2300,
        inputTokens: 6500,
        outputTokens: 3200,
        totalTokens: 9700,
        steps,
        toolCalls: ['audit.fetchLogs', 'report.generate'],
        response: 'SOC2 Compliance Audit Report generated (9,700 total tokens consumed). All 100 audit entries verified.',
        attributes: {
          'llm.tokens.input': 6500,
          'llm.tokens.output': 3200,
          'llm.tokens.total': 9700,
          'openinference.span.kind': 'AGENT',
          'void.agent.name': 'NovaFlowCopilot',
          'token.usage_warning': 'true',
        },
        storyChapter: {
          chapterIndex: 1,
          title: '1. Heavy Context Processing',
          subtitle: 'High token consumption alert',
          narration: 'The query completes successfully, but consumes 9,700 tokens (6,500 input / 3,200 output). DemoIncidentAnalyzer flags excessive token usage for cost optimization.',
          highlightAspect: 'Resource Warning: High token count (9,700 total tokens).',
        },
        flaggedForSemantic: false,
      };
    }
  );
}
