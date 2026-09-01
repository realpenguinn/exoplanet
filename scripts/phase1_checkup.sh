#!/usr/bin/env bash
set -e
echo "Starting Phase 1 Verification Protocol..."

echo "[1/4] Validating directory scaffold..."
for d in src/assets/data src/assets/shaders src/core/astronomy src/core/data src/core/physics src/graphics/camera src/graphics/galaxy src/graphics/system src/ui/components src/ui/controllers src/observability src/types src/utils tests/unit tests/integration tests/a11y docs/adr scripts; do
  test -d "$d" || { echo "Fatal: missing directory $d"; exit 1; }
done

echo "[2/4] Testing Type Compilation..."
pnpm tsc --noEmit

echo "[3/4] Testing Linter Compliance..."
pnpm eslint . --ext ts,tsx --max-warnings 0

echo "[4/4] Validating Build Bundler..."
pnpm vite build --mode development

echo ">> PHASE 1 VERIFICATION PASSED: Scaffolding meets enterprise criteria."
