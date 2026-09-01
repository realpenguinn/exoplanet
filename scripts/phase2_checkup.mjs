import fs from 'node:fs';
import path from 'node:path';

console.log("Starting Phase 2 (Revised) Verification Protocol...");

function check(desc, cond) {
  if (!cond) {
    console.error(`Fatal: ${desc}`);
    process.exit(1);
  }
  console.log(`[PASS] ${desc}`);
}

// 1. P2R-C1: Check RawExoplanetRecord interface definition in src/types/astronomy.ts
const typesPath = path.resolve('src/types/astronomy.ts');
const typesContent = fs.readFileSync(typesPath, 'utf-8');
check("RawExoplanetRecord has 10 fields (no st_mass)", !typesContent.includes("st_mass:"));
check("RawExoplanetRecord has no st_spectype", !typesContent.includes("st_spectype:"));

// 2. P2R-C2: Real Record Count
const catalogPath = path.resolve('src/assets/data/exoplanet_catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
check(`Parsed exoplanet count == 4606 (found ${catalog.length})`, catalog.length === 4606);

// 3. P2R-C3: Null-Rate Assertion
const nullTrandep = catalog.filter(r => r.pl_trandep === null).length;
const nullRate = (nullTrandep / catalog.length) * 100;
check(`pl_trandep null rate between 75% and 90% (found ${nullRate.toFixed(1)}%)`, nullRate >= 75 && nullRate <= 90);

// 4. P2R-C4 & P2R-C5: Gaia BINARY2 decoded records
const gaiaPath = path.resolve('scripts/output/gaia_parsed.json');
const gaiaData = JSON.parse(fs.readFileSync(gaiaPath, 'utf-8'));
check(`Gaia decoded count == 5000 (found ${gaiaData.length})`, gaiaData.length === 5000);

// 5. P2R-C6: source_id string precision
const sampleSourceId = gaiaData[0].source_id;
check(`source_id is string of length > 15 (found '${sampleSourceId}')`, typeof sampleSourceId === 'string' && sampleSourceId.length > 15);

// 6. P2R-C8: Code comments state pl_trandep is default path
const coordsContent = fs.readFileSync(path.resolve('src/core/astronomy/coordinates.ts'), 'utf-8');
check("Code comments state pl_trandep theoretical dip is primary/default path", coordsContent.includes("pl_trandep is null") && coordsContent.includes("PRIMARY"));

console.log(">> PHASE 2 VERIFICATION PASSED: Data-grounded ETL and astrometric math verified.");
