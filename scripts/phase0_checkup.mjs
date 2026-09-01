import fs from 'node:fs';
import path from 'node:path';

console.log("Starting Phase 0 Verification Protocol...");

function check(desc, cond) {
  if (!cond) {
    console.error(`Fatal: ${desc}`);
    process.exit(1);
  }
  console.log(`[PASS] ${desc}`);
}

const prdPath = path.resolve('docs/PRD.md');
check("PRD.md exists", fs.existsSync(prdPath));
const prdContent = fs.readFileSync(prdPath, 'utf-8');
check("NFR budgets present in PRD", prdContent.includes("Non-Functional"));
check("Support Matrix present in PRD", prdContent.includes("Support Matrix"));

const dataPolicyPath = path.resolve('docs/DATA_POLICY.md');
check("DATA_POLICY.md exists", fs.existsSync(dataPolicyPath));

const adrPath = path.resolve('docs/adr/0001-record-architecture-decisions.md');
check("ADR bootstrap exists", fs.existsSync(adrPath));

const riskPath = path.resolve('docs/RISK_REGISTER.md');
check("RISK_REGISTER.md exists", fs.existsSync(riskPath));
const riskContent = fs.readFileSync(riskPath, 'utf-8');
const riskMatches = riskContent.match(/^### Risk/gm);
const riskCount = riskMatches ? riskMatches.length : 0;
check(`At least 4 risks registered (found ${riskCount})`, riskCount >= 4);

console.log(">> PHASE 0 VERIFICATION PASSED: Requirements and governance are frozen.");
