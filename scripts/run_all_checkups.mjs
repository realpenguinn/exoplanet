import { execSync } from 'node:child_process';

const checkups = [
  'scripts/phase0_checkup.mjs',
  'scripts/phase1_checkup.mjs',
  'scripts/phase2_checkup.mjs',
  'scripts/phase3_checkup.mjs',
  'scripts/phase3_5_checkup.mjs',
  'scripts/phase4_checkup.mjs',
  'scripts/phase5_checkup.mjs',
  'scripts/phase6_checkup.mjs',
  'scripts/phase7_checkup.mjs',
  'scripts/phase8_checkup.mjs',
  'scripts/phase9_checkup.mjs',
  'scripts/phase10_checkup.mjs',
  'scripts/phase11_checkup.mjs',
  'scripts/phase12_checkup.mjs'
];

console.log("================================================================================");
console.log("     COSMOSCAN MASTER VERIFICATION SUITE: PHASES 0 THROUGH 12 EXECUTION       ");
console.log("================================================================================\n");

let passedCount = 0;

for (const script of checkups) {
  console.log(`\n>>> Executing ${script}...`);
  try {
    execSync(`node ${script}`, { stdio: 'inherit' });
    passedCount++;
  } catch (err) {
    console.error(`\nFAILED at ${script}`);
    process.exit(1);
  }
}

console.log("\n================================================================================");
console.log(`🎉 ALL ${passedCount}/${checkups.length} CHECKUPS COMPLETED SUCCESSFULLY WITH ZERO ERRORS!`);
console.log("================================================================================\n");
