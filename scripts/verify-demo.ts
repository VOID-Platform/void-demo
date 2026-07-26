import { runFakeExecution } from '../src/lib/fake-agent';
import { ExecutionTrace } from '../src/lib/types';
import fs from 'fs';
import path from 'path';

async function runVerificationSuite() {
  console.log('====================================================');
  console.log('🧪 [VOID DEMO AUTOMATED VERIFICATION SUITE]');
  console.log('====================================================\n');

  let passed = true;
  const traces: ExecutionTrace[] = [];

  console.log('1️⃣  Generating 10 Demo Traces...');
  for (let i = 1; i <= 10; i++) {
    const trace = await runFakeExecution(i);
    traces.push(trace);
  }
  console.log(`   ✅ Successfully generated ${traces.length} traces.\n`);

  if (traces.length !== 10) {
    console.error(`❌ FAILED: Expected 10 traces, got ${traces.length}`);
    passed = false;
  } else {
    console.log('   ✓ Assertion 1 Passed: Exactly 10 traces generated.');
  }

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

  const flaggedIndices = traces.filter((t) => t.flaggedForSemantic).map((t) => t.index);
  console.log(`\n3️⃣  Verifying Semantic Sampling Flags:`);
  console.log(`   Flagged trace indices: [${flaggedIndices.join(', ')}] (expected [4, 8])`);

  if (flaggedIndices.length === 2 && flaggedIndices.includes(4) && flaggedIndices.includes(8)) {
    console.log('   ✓ Assertion 3 Passed: Exactly 2 traces (Exec 4 & Exec 8) flagged for semantic sampling.');
  } else {
    console.error('❌ FAILED: Semantic sampling flag mismatch!');
    passed = false;
  }

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

  const componentsDir = path.join(process.cwd(), 'src/components');
  const filesToAudit = fs.readdirSync(componentsDir).map((f) => path.join(componentsDir, f));

  let residualCopyFound = false;
  for (const file of filesToAudit) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('10%')) {
      console.error(`❌ Residual "10%" text found in ${file}`);
      residualCopyFound = true;
    }
  }

  if (!residualCopyFound) {
    console.log(`   ✓ Assertion 5 Passed: Zero residual "10%" copy found in UI components.`);
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
