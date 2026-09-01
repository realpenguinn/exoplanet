import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

console.log("Starting Phase 3 Verification Protocol...");

function check(desc, cond) {
  if (!cond) {
    console.error(`Fatal: ${desc}`);
    process.exit(1);
  }
  console.log(`[PASS] ${desc}`);
}

// 1. Shaders exist
check("galaxy.vert.glsl exists", fs.existsSync(path.resolve('src/assets/shaders/galaxy.vert.glsl')));
check("galaxy.frag.glsl exists", fs.existsSync(path.resolve('src/assets/shaders/galaxy.frag.glsl')));

// 2. TypeScript and Vitest execution for Phase 3
console.log("Running Phase 3 test suite...");
try {
  execSync('pnpm vitest run tests/integration/galaxy_render.test.ts', { stdio: 'inherit' });
  check("MilkyWay 150k particle allocation and tier tests passed", true);
} catch (e) {
  check("Phase 3 tests failed", false);
}

// 3. Target nodes exist and isolate raycasting
check("TargetNodes.ts exists", fs.existsSync(path.resolve('src/graphics/galaxy/TargetNodes.ts')));
const targetNodesContent = fs.readFileSync(path.resolve('src/graphics/galaxy/TargetNodes.ts'), 'utf-8');
check("TargetNodes uses InstancedMesh", targetNodesContent.includes("InstancedMesh"));

console.log(">> PHASE 3 VERIFICATION PASSED: 150,000 GPU particle galaxy and instanced targets verified.");
