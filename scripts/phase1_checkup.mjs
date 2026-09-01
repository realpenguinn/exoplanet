import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

console.log("Starting Phase 1 Verification Protocol...");

function check(desc, cond) {
  if (!cond) {
    console.error(`Fatal: ${desc}`);
    process.exit(1);
  }
  console.log(`[PASS] ${desc}`);
}

// 1. Directory scaffold check
const requiredDirs = [
  'src/assets/data',
  'src/assets/shaders',
  'src/core/astronomy',
  'src/core/data',
  'src/core/physics',
  'src/graphics/camera',
  'src/graphics/galaxy',
  'src/graphics/system',
  'src/ui/components',
  'src/ui/controllers',
  'src/observability',
  'src/types',
  'src/utils',
  'tests/unit',
  'tests/integration',
  'tests/a11y',
  'docs/adr',
  'scripts'
];

for (const d of requiredDirs) {
  check(`Directory ${d} exists`, fs.existsSync(path.resolve(d)));
}

// 2. TypeScript compilation
console.log("Running TypeScript compilation check...");
try {
  execSync('pnpm tsc --noEmit', { stdio: 'inherit' });
  check("TypeScript compilation successful", true);
} catch (e) {
  check("TypeScript compilation failed", false);
}

// 3. Linter check
console.log("Running ESLint verification...");
try {
  execSync('pnpm eslint . --ext ts,tsx --max-warnings 0', { stdio: 'inherit' });
  check("ESLint verification clean (0 warnings/errors)", true);
} catch (e) {
  check("ESLint verification failed", false);
}

console.log(">> PHASE 1 VERIFICATION PASSED: Scaffolding and tooling meet enterprise criteria.");
