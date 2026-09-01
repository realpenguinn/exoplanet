import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

console.log("Starting Phase 12 (Accessibility, I18N & Final Handoff) Verification Protocol...");

function check(desc, cond) {
  if (!cond) {
    console.error(`Fatal: ${desc}`);
    process.exit(1);
  }
  console.log(`[PASS] ${desc}`);
}

// 1. Files exist
check("A11Y_MANUAL_PASS.md exists", fs.existsSync(path.resolve('docs/A11Y_MANUAL_PASS.md')));
check("strings.en.ts exists", fs.existsSync(path.resolve('src/ui/strings.en.ts')));
check("README.md exists", fs.existsSync(path.resolve('README.md')));
check("ADR index exists", fs.existsSync(path.resolve('docs/adr/README.md')));

// 2. A11y checklist contents
const a11yPass = fs.readFileSync(path.resolve('docs/A11Y_MANUAL_PASS.md'), 'utf-8');
check("Manual a11y pass covers combobox and aria-live announcements", a11yPass.includes("aria-live") && a11yPass.includes("combobox"));

// 3. Run a11y test suite
console.log("Running a11y automated audit test...");
try {
  execSync('pnpm vitest run tests/unit/a11y_audit.test.ts', { stdio: 'inherit' });
  check("Phase 12 accessibility tests passed (0 critical/serious violations)", true);
} catch (e) {
  check("Phase 12 a11y test failed", false);
}

console.log(">> PHASE 12 VERIFICATION PASSED: Accessibility compliance, strings centralization, and handoff documentation verified.");
