import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

console.log("Starting Phase 11 (Observability & Operational Readiness) Verification Protocol...");

function check(desc, cond) {
  if (!cond) {
    console.error(`Fatal: ${desc}`);
    process.exit(1);
  }
  console.log(`[PASS] ${desc}`);
}

// 1. Files exist
check("logger.ts exists", fs.existsSync(path.resolve('src/observability/logger.ts')));
check("ErrorBoundary.ts exists", fs.existsSync(path.resolve('src/observability/ErrorBoundary.ts')));
check("perfSampler.ts exists", fs.existsSync(path.resolve('src/observability/perfSampler.ts')));
check("docs/RUNBOOK.md exists", fs.existsSync(path.resolve('docs/RUNBOOK.md')));

// 2. Runbook contents
const runbook = fs.readFileSync(path.resolve('docs/RUNBOOK.md'), 'utf-8');
check("Runbook covers manual TAP ETL recovery", runbook.includes("Manual Ingestion Re-Trigger"));
check("Runbook covers emergency rollback", runbook.includes("Emergency Deployment Rollback"));
check("Runbook covers logger buffer inspection", runbook.includes("logger.dumpBuffer()"));

// 3. Run Phase 11 tests
console.log("Running Phase 11 test suite...");
try {
  execSync('pnpm vitest run tests/unit/observability.test.ts', { stdio: 'inherit' });
  check("Phase 11 observability and telemetry tests passed", true);
} catch (e) {
  check("Phase 11 tests failed", false);
}

console.log(">> PHASE 11 VERIFICATION PASSED: Structured logging, error boundaries, and operational runbook verified.");
