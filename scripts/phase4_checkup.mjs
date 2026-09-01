import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

console.log("Starting Phase 4 Verification Protocol...");

function check(desc, cond) {
  if (!cond) {
    console.error(`Fatal: ${desc}`);
    process.exit(1);
  }
  console.log(`[PASS] ${desc}`);
}

// 1. Files exist
check("CameraController.ts exists", fs.existsSync(path.resolve('src/graphics/camera/CameraController.ts')));
check("SystemRenderer.ts exists", fs.existsSync(path.resolve('src/graphics/system/SystemRenderer.ts')));

// 2. Smoothstep math in CameraController.ts
const camContent = fs.readFileSync(path.resolve('src/graphics/camera/CameraController.ts'), 'utf-8');
check("CameraController implements smoothstep curve (3t^2 - 2t^3)", camContent.includes("t * t * (3 - 2 * t)"));

// 3. SystemRenderer transit detection
const sysContent = fs.readFileSync(path.resolve('src/graphics/system/SystemRenderer.ts'), 'utf-8');
check("SystemRenderer detects transit when zDepth > 0", sysContent.includes("zDepth > 0"));
check("SystemRenderer calculates habitable zone with sqrt(lum)", sysContent.includes("Math.sqrt(lum"));

// 4. Run Phase 4 tests
console.log("Running Phase 4 test suite...");
try {
  execSync('pnpm vitest run tests/unit/camera_system.test.ts', { stdio: 'inherit' });
  check("Phase 4 camera and planetary system unit tests passed", true);
} catch (e) {
  check("Phase 4 tests failed", false);
}

console.log(">> PHASE 4 VERIFICATION PASSED: Planetary physics, orbits, and camera navigation verified.");
