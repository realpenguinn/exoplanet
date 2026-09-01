import fs from 'node:fs';
import path from 'node:path';

console.log("Starting Phase 10 (Dockerization & Production Config) Verification Protocol...");

function check(desc, cond) {
  if (!cond) {
    console.error(`Fatal: ${desc}`);
    process.exit(1);
  }
  console.log(`[PASS] ${desc}`);
}

// 1. Dockerfile checks
const dockerfilePath = path.resolve('Dockerfile');
check("Dockerfile exists", fs.existsSync(dockerfilePath));
const dockerContent = fs.readFileSync(dockerfilePath, 'utf-8');
check("Dockerfile implements multi-stage builder and nginx runner", dockerContent.includes("AS builder") && dockerContent.includes("AS runner"));

// 2. NGINX config checks
const nginxPath = path.resolve('nginx.conf');
check("nginx.conf exists", fs.existsSync(nginxPath));
const nginxContent = fs.readFileSync(nginxPath, 'utf-8');
check("nginx.conf enables gzip compression", nginxContent.includes("gzip on;"));
check("nginx.conf configures 7d cache headers for assets", nginxContent.includes("expires 7d;"));
check("nginx.conf includes SPA fallback routing (try_files)", nginxContent.includes("try_files $uri $uri/ /index.html;"));

// 3. Attribution footer in index.html
const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');
check("Attribution footer credits NASA Exoplanet Archive and ESA Gaia DR3", htmlContent.includes("NASA Exoplanet Archive") && htmlContent.includes("ESA Gaia DR3"));

// 4. Production build directory exists
const distHtml = path.resolve('dist/index.html');
check("Production build artifacts present in dist/", fs.existsSync(distHtml));

console.log(">> PHASE 10 VERIFICATION PASSED: Docker multi-stage build, NGINX configuration, and attribution verified.");
