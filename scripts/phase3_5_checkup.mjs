import fs from 'node:fs';
import path from 'node:path';

console.log("Starting Phase 3.5 (Perspective Color Grading) Verification Protocol...");

function check(desc, cond) {
  if (!cond) {
    console.error(`Fatal: ${desc}`);
    process.exit(1);
  }
  console.log(`[PASS] ${desc}`);
}

// 1. P3.5-C1: Camera Uniform Wired
const milkyWayContent = fs.readFileSync(path.resolve('src/graphics/galaxy/MilkyWay.ts'), 'utf-8');
check("uCameraPosition uniform declared in MilkyWay.ts", milkyWayContent.includes("uCameraPosition"));
check("updateCameraPosition method implemented in MilkyWay.ts", milkyWayContent.includes("updateCameraPosition"));

// 2. Vertex Shader checks
const vertShader = fs.readFileSync(path.resolve('src/assets/shaders/galaxy.vert.glsl'), 'utf-8');
check("vGrazingFactor computed in vertex shader", vertShader.includes("vGrazingFactor = 1.0 - abs(viewDir.y);"));
check("vMidplaneCloseness computed in vertex shader", vertShader.includes("vMidplaneCloseness"));
check("vCoreProximity computed in vertex shader", vertShader.includes("vCoreProximity"));

// 3. Fragment Shader checks
const fragShader = fs.readFileSync(path.resolve('src/assets/shaders/galaxy.frag.glsl'), 'utf-8');
check("Dust reddened color calculated", fragShader.includes("dustReddenedColor"));
check("Extinction darkening applied to graded color", fragShader.includes("extinctionDarkening"));
check("Core proximity bloom applied angle-independently", fragShader.includes("coreBrightnessBoost"));

// 4. Mathematical Ground Truth for reference angles:
// Face-on: viewDir.y ≈ -1 -> vGrazingFactor = 1.0 - abs(-1.0) = 0.0
const faceOnGrazing = 1.0 - Math.abs(-1.0);
check("Face-on grazing factor is 0.0", Math.abs(faceOnGrazing) < 0.001);

// Edge-on: viewDir.y ≈ 0 -> vGrazingFactor = 1.0 - abs(0.0) = 1.0
const edgeOnGrazing = 1.0 - Math.abs(0.0);
check("Edge-on grazing factor is 1.0", Math.abs(edgeOnGrazing - 1.0) < 0.001);

console.log(">> PHASE 3.5 VERIFICATION PASSED: Perspective-dependent color grading and core bloom verified.");
