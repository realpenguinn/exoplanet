import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

console.log("Starting Phase 6 Verification Protocol...");

function check(desc, cond) {
  if (!cond) {
    console.error(`Fatal: ${desc}`);
    process.exit(1);
  }
  console.log(`[PASS] ${desc}`);
}

// 1. File exists
check("VerdictEngine.ts exists", fs.existsSync(path.resolve('src/core/physics/VerdictEngine.ts')));

// 2. Language audit on VerdictEngine.ts
const code = fs.readFileSync(path.resolve('src/core/physics/VerdictEngine.ts'), 'utf-8');
check("Certainty language audit: No 'CONFIRMED' in headlines", !code.includes("headline: 'CONFIRMED"));
check("Formula disclosure present in verdicts", code.includes("calculationDisclosure"));

// 3. Run Phase 6 tests
console.log("Running Phase 6 test suite...");
try {
  execSync('pnpm vitest run tests/unit/verdict.test.ts', { stdio: 'inherit' });
  check("Phase 6 astrobiological verdict tests passed", true);
} catch (e) {
  check("Phase 6 tests failed", false);
}

console.log(">> PHASE 6 VERIFICATION PASSED: Automated scientific verdict engine verified.");
