#!/usr/bin/env bash
set -e
echo "Starting Phase 0 Verification Protocol..."

test -f docs/PRD.md || { echo "Fatal: PRD.md missing"; exit 1; }
grep -q "Non-Functional" docs/PRD.md || { echo "Fatal: NFR budgets missing from PRD"; exit 1; }
grep -q "Support Matrix" docs/PRD.md || { echo "Fatal: Support matrix missing from PRD"; exit 1; }
test -f docs/DATA_POLICY.md || { echo "Fatal: DATA_POLICY.md missing"; exit 1; }
test -f docs/adr/0001-record-architecture-decisions.md || { echo "Fatal: ADR bootstrap missing"; exit 1; }
RISK_COUNT=$(grep -c "^### Risk" docs/RISK_REGISTER.md || true)
[ "$RISK_COUNT" -ge 4 ] || { echo "Fatal: fewer than 4 risks registered"; exit 1; }

echo ">> PHASE 0 VERIFICATION PASSED: Requirements and governance are frozen."
