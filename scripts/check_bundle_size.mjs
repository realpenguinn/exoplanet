import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

console.log("Auditing Production Bundle Size against Phase 0 NFR Budget (< 350KB gzipped)...");

const distAssetsDir = path.resolve('dist/assets');
if (!fs.existsSync(distAssetsDir)) {
  console.error("Fatal: dist/assets not found. Run 'pnpm vite build' first.");
  process.exit(1);
}

const files = fs.readdirSync(distAssetsDir);
let totalJsGzip = 0;
let threeGzip = 0;
let appGzip = 0;

for (const file of files) {
  if (file.endsWith('.js')) {
    const fullPath = path.join(distAssetsDir, file);
    const content = fs.readFileSync(fullPath);
    const gzipped = zlib.gzipSync(content);
    const sizeKb = gzipped.length / 1024;

    console.log(`- ${file}: raw ${(content.length / 1024).toFixed(2)} KB | gzip ${sizeKb.toFixed(2)} KB`);

    if (file.startsWith('three-')) {
      threeGzip = sizeKb;
    } else {
      appGzip += sizeKb;
    }
    totalJsGzip += sizeKb;
  }
}

console.log(`Total Gzipped JS: ${totalJsGzip.toFixed(2)} KB`);
const BUDGET_KB = 350;

if (totalJsGzip > BUDGET_KB) {
  console.error(`FAIL: Bundle size ${totalJsGzip.toFixed(2)} KB exceeds ${BUDGET_KB} KB budget!`);
  process.exit(1);
}

console.log(`[PASS] Production JS bundle (${totalJsGzip.toFixed(2)} KB) is strictly below the ${BUDGET_KB} KB budget!`);
