import { runFakeExecution } from '../src/lib/fake-agent';
import { demoIncidentAnalyzer, DemoIncidentAnalyzer } from '../src/lib/analyzer';
import { ExecutionTrace, IncidentReport } from '../src/lib/types';
import fs from 'fs';
import path from 'path';

async function runVerificationSuite() {
  console.log('====================================================');
  console.log('🧪 [VOID DEMO AUTOMATED VERIFICATION SUITE]');
  console.log('====================================================\n');

  let passed = true;
  const traces: ExecutionTrace[] = [];
  const reports: IncidentReport[] = [];

  // 1. Generate & Analyze all 10 Traces
  console.log('1️⃣  Generating & Analyzing 10 Demo Traces with VOID SDK...');
  for (let i = 1; i <= 10; i++) {
    const trace = await runFakeExecution(i);
    const report = await demoIncidentAnalyzer.analyze(trace);
    traces.push(trace);
    reports.push(report);
  }
  console.log(`   ✅ Successfully generated ${traces.length} traces.\n`);

  // Assertion 1: Exactly 10 traces
  if (traces.length !== 10) {
    console.error(`❌ FAILED: Expected 10 traces, got ${traces.length}`);
    passed = false;
  } else {
    console.log('   ✓ Assertion 1 Passed: Exactly 10 traces generated.');
  }

  // Assertion 2: Severity Distribution (5 Success, 2 Warning, 3 Critical)
  const successCount = traces.filter((t) => t.status === 'success').length;
  const warningCount = traces.filter((t) => t.status === 'warning').length;
  const criticalCount = traces.filter((t) => t.status === 'critical').length;

  console.log(`\n2️⃣  Verifying Severity Distribution:`);
  console.log(`   Success: ${successCount} (expected 5) | Warning: ${warningCount} (expected 2) | Critical: ${criticalCount} (expected 3)`);

  if (successCount === 5 && warningCount === 2 && criticalCount === 3) {
    console.log('   ✓ Assertion 2 Passed: Severity distribution matches spec (5 Success, 2 Warning, 3 Critical).');
  } else {
    console.error('❌ FAILED: Severity distribution mismatch!');
    passed = false;
  }

  // Assertion 3: Semantic Sampling Filter (Exec 4 + Exec 8 only)
  const flaggedIndices = traces.filter((t) => t.flaggedForSemantic).map((t) => t.index);
  console.log(`\n3️⃣  Verifying Semantic Sampling Flags:`);
  console.log(`   Flagged trace indices: [${flaggedIndices.join(', ')}] (expected [4, 8])`);

  if (flaggedIndices.length === 2 && flaggedIndices.includes(4) && flaggedIndices.includes(8)) {
    console.log('   ✓ Assertion 3 Passed: Exactly 2 traces (Exec 4 & Exec 8) flagged for semantic sampling.');
  } else {
    console.error('❌ FAILED: Semantic sampling flag mismatch!');
    passed = false;
  }

  // Assertion 4: SigNoz Link Trace ID Integrity (32 hex characters, non-zero)
  console.log(`\n4️⃣  Verifying SigNoz Link Trace ID Format:`);
  let validTraceIds = true;
  for (const t of traces) {
    if (!t.traceId || t.traceId.length !== 32 || t.traceId === '00000000000000000000000000000000' || !/^[0-9a-fA-F]{32}$/.test(t.traceId)) {
      console.error(`❌ Invalid trace ID format for trace #${t.index}: ${t.traceId}`);
      validTraceIds = false;
    }
  }
  if (validTraceIds) {
    console.log('   ✓ Assertion 4 Passed: All 10 trace IDs are valid, non-zero 32-hex OTLP trace formats.');
  } else {
    passed = false;
  }

  // Assertion 5: Analyzer Report Output Assertions
  console.log(`\n5️⃣  Verifying Analyzer Reports Integrity:`);
  let validReports = true;
  if (reports.length !== 10) {
    console.error(`❌ Expected 10 reports, got ${reports.length}`);
    validReports = false;
  } else {
    for (let i = 0; i < 10; i++) {
      const r = reports[i];
      const t = traces[i];
      if (r.severity !== t.status) {
        console.error(`❌ Report severity mismatch for trace #${t.index}: report=${r.severity}, trace=${t.status}`);
        validReports = false;
      }
      if ((t.index === 4 || t.index === 8) && r.analysisCategory !== 'semantic') {
        console.error(`❌ Expected semantic category for trace #${t.index}, got ${r.analysisCategory}`);
        validReports = false;
      }
    }
  }
  if (validReports) {
    console.log('   ✓ Assertion 5 Passed: All generated reports match expected severities & analysis categories.');
  } else {
    passed = false;
  }

  // Assertion 6: Copy Audit for Residual "10%" Language
  console.log(`\n6️⃣  Auditing UI Codebase for Residual "10%" Copy:`);
  const componentsDir = path.join(process.cwd(), 'src/components');
  const filesToAudit = fs.readdirSync(componentsDir).map((f) => path.join(componentsDir, f));
  filesToAudit.push(path.join(process.cwd(), 'src/lib/analyzer/index.ts'));

  let residualCopyFound = false;
  for (const file of filesToAudit) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('10%')) {
      console.error(`❌ Residual "10%" text found in ${file}`);
      residualCopyFound = true;
    }
  }

  if (!residualCopyFound) {
    console.log(`   ✓ Assertion 6 Passed: Zero residual "10%" copy found in UI components or analyzer.`);
  } else {
    passed = false;
  }

  console.log('\n====================================================');
  if (passed) {
    console.log('🎉 ALL AUTOMATED VERIFICATION ASSERTIONS PASSED!');
    console.log('====================================================\n');
    process.exit(0);
  } else {
    console.error('❌ VERIFICATION SUITE FAILED!');
    console.log('====================================================\n');
    process.exit(1);
  }
}

runVerificationSuite().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
