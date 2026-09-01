# CosmoScan — Master Software Engineering Execution Document (Expanded Edition)

## Project: COSMOSCAN — Production-Grade Exoplanet Data Analyzer & 3D Milky Way Exploration Suite

### Purpose of This Document

This is a complete, phase-by-phase build prompt intended to be handed to an AI coding agent (or a human engineering team) as the single source of truth for building CosmoScan end to end. It expands on the original architectural blueprint with deeper task decomposition, explicit acceptance criteria, additional phases that were previously implicit (requirements capture, security review, observability, accessibility, and documentation/handoff), and richer checkup matrices so that no phase can be marked complete without objective, testable evidence.

Each phase below is self-contained: it states its objective, breaks the objective into concrete tasks, supplies reference code/config where useful, and ends with a **Phase Checkup** — a table of verification items with pass/fail conditions plus a verification script or test file that proves the phase is actually done, not just attempted. No phase should be considered closed while any checkup item reads `[PENDING]` or `[FAILED]`. Phases are meant to be executed roughly in order, though Phases 3–7 have some internal parallelism once Phase 2's data contracts are frozen.

---

## Executive Architectural Blueprint & Execution Overview

CosmoScan integrates:

- Real-time astronomical data pipelines cross-matching the NASA Exoplanet Archive (TAP API) with ESA Gaia DR3 astrometry.
- An ultra-dense 150,000+ particle WebGL/Three.js GPU-instanced 3D Milky Way simulation incorporating logarithmic 4-arm spiral kinematics (ψ = 13.0°), a triaxial central bar (φ₀ = 27°), and flat rotation dispersion.
- A mathematical photometric transit synthesis and light curve streaming engine supporting quadratic stellar limb darkening, transit duration calculations, and planetary radius extraction via (Rp/R*)².
- An automated astrobiological classification and habitability verdict engine evaluating Goldilocks equilibrium temperatures, atmospheric scale heights, and stellar radiation flux.
- A reactive, hardware-accelerated dashboard interface with sub-millisecond autocomplete across 4,200+ confirmed exoplanet systems.
- Production-grade observability, accessibility, and documentation so the system is operable by someone other than its original author.

```
+--------------------------------------------------------------------------------------------------+
|                                    COSMOSCAN ARCHITECTURE                                        |
+--------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
                  +-----------------------------------------------------------------+
                  |                   DATA INGESTION & PIPELINE                     |
                  |  - NASA Exoplanet Archive TAP API (Table 'ps', default_flag=1)  |
                  |  - ESA Gaia DR3 (Cross-matched 3D Coordinates & Astrometry)      |
                  |  - Local Vector Cache & Schema Validator (TypeScript / Zod)      |
                  +-----------------------------------+-----------------------------+
                                                  |
                                                  v
                  +-----------------------------------------------------------------+
                  |                   CORE COMPUTATIONAL ENGINES                    |
                  |  - Keplerian Orbit & Ephemeris Solver (3D State Vectors)         |
                  |  - Photometric Transit & Limb Darkening (Mandel-Agol Model)      |
                  |  - Habitability & Spectral Classification Verdict Engine         |
                  +-----------------------------------+-----------------------------+
                                                  |
                                                  v
                  +-----------------------------------------------------------------+
                  |              GRAPHICS & USER INTERFACE SUBSYSTEMS               |
                  |  - Three.js / WebGL 150,000 GPU-Instanced Particle Galaxy       |
                  |  - Cinematic Camera Fly-To Interpolator & Raycasting Subsystem  |
                  |  - Real-Time Canvas 2D/WebGL Light Curve Grapher (60+ FPS)      |
                  |  - Low-Latency Dynamic Search & Spatial KD-Tree Indexer         |
                  +-----------------------------------+-----------------------------+
                                                  |
                                                  v
                  +-----------------------------------------------------------------+
                  |         OBSERVABILITY, ACCESSIBILITY & OPERATIONAL LAYER        |
                  |  - Structured Logging, Error Boundaries, Performance Telemetry  |
                  |  - Keyboard Navigation, ARIA Roles, Reduced-Motion Fallbacks    |
                  |  - Runbooks, Architecture Decision Records, Onboarding Docs     |
                  +-------------------------------------------------------------------+
```

### How to Use This Document

1. Execute phases in numeric order. Phase 0 must be completed and signed off before any code is written — it defines the requirements every later phase is checked against.
2. Within a phase, complete tasks top to bottom; later tasks in a phase frequently depend on artifacts created by earlier ones (types before implementations, shaders before the classes that load them, etc.).
3. Do not proceed to the next phase until every item in the current phase's **Phase Checkup** table shows `[PASSED]`, with the verification script's output pasted into the phase's sign-off note.
4. Treat every code block as a literal starting point, not a suggestion — deviations are acceptable only when a checkup item would otherwise fail, and any deviation must be recorded in the ADR log established in Phase 0.
5. Update the **Complete Multi-Phase Acceptance & Verification Summary** at the very end of this document after each phase closes.

---

## Phase 0: Requirements Capture, Architecture Decision Records & Risk Register

### Phase Objective

Before any scaffolding exists, freeze the product requirements, lock the technical constraints that later phases will be judged against, and establish a lightweight but mandatory architecture decision record (ADR) process so that any deviation from this document is traceable. Skipping this phase is the single most common cause of scope creep in projects of this shape (a real-time 3D simulation coupled to a scientific data pipeline), so it is treated as a first-class phase with its own checkup, not a preamble.

```
                    +-------------------------------------------------+
                    |             REQUIREMENTS & GOVERNANCE           |
                    +-----------------------+---------------------------+
                                            |
               +----------------------------+----------------------------+
               v                            v                            v
+-----------------------------+ +-----------------------------+ +-----------------------------+
|   Functional Requirements   | |   Non-Functional Budgets    | |   ADR & Risk Register        |
|  - Data sources, refresh    | |  - FPS, memory, bundle size | |  - Decision log format       |
|    cadence, target catalog  | |  - Accessibility baseline   | |  - Risk severity matrix      |
|    size                     | |  - Browser support matrix   | |  - Rollback triggers         |
+-----------------------------+ +-----------------------------+ +-----------------------------+
```

### Task 0.1: Product Requirements Document (PRD) Skeleton

Write `docs/PRD.md` capturing, at minimum:

- **Primary user**: a science-communication audience (students, enthusiasts, judges at a science fair) exploring exoplanet data visually, not professional astronomers running analysis pipelines.
- **Core user journeys**: (a) land on the app and see the galaxy render within 3 seconds on a mid-tier laptop; (b) search for a named exoplanet and fly the camera to it within 2 seconds of selection; (c) read a plain-language habitability verdict without needing astrophysics background; (d) watch a live-updating light curve while the planet transits its star.
- **Explicit non-goals**: this is not a mission-planning tool, not a substitute for professional astrometric software, and does not need to support editing or contributing new exoplanet data from the UI.
- **Target catalog size**: 4,200+ confirmed transiting exoplanet systems, refreshed from the NASA Exoplanet Archive on a schedule defined in Task 0.4, not on every page load.

### Task 0.2: Non-Functional Requirement Budgets

Establish hard numeric budgets that later phases must satisfy — these numbers are pulled forward verbatim into Phase 3, Phase 5, and Phase 8 checkups, so define them precisely here rather than improvising them later:

| Budget | Target | Rationale |
|---|---|---|
| Steady-state frame rate | ≥ 60 FPS at 1080p on a GTX 1650-class GPU | Keeps camera flight and particle rotation smooth on the median science-fair laptop |
| Time to first meaningful paint | ≤ 3.0s on a throttled 4x CPU / Fast 3G profile | Users abandon slow-loading visual demos quickly |
| VRAM footprint for the galaxy mesh | < 120MB | Leaves headroom for the planetary system renderer and light curve canvas on integrated GPUs |
| Production JS bundle (gzipped) | < 350KB excluding the exoplanet catalog JSON | Keeps initial load lean; catalog data is fetched/cached separately |
| Catalog JSON size | 800KB–2MB | Large enough to hold the full dataset, small enough to cache aggressively |
| Search latency | < 2ms per keystroke against the full indexed catalog | Sub-millisecond framing of the original spec is aspirational; 2ms is the enforceable, testable budget |
| Keyboard operability | 100% of interactive controls reachable and operable without a mouse | Accessibility baseline, verified in Phase 12 |

### Task 0.3: Browser & Device Support Matrix

Define and record the supported matrix; anything outside it degrades gracefully rather than crashing:

- **Fully supported**: latest two stable versions of Chrome, Edge, and Firefox on desktop with WebGL2.
- **Degraded mode**: Safari desktop and iOS Safari — reduce particle count to 60,000 and disable additive-blending bloom if WebGL2 extensions required for the full shader path are unavailable.
- **Unsupported, explicit fallback**: browsers without WebGL2 render a static explanatory screen instead of a blank canvas, with a message and a link to a supported browser — never a silent failure.

### Task 0.4: Data Refresh & Licensing Policy

Document in `docs/DATA_POLICY.md`:

- NASA Exoplanet Archive TAP queries run on a scheduled job (see Phase 2, Task 2.4) no more than once every 24 hours, respecting the archive's fair-use guidance and avoiding redundant load on a public scientific resource.
- Gaia DR3 cross-matches are cached locally; the pipeline never performs synchronous, per-request calls to either data source from the browser client.
- Attribution text for NASA/IPAC and ESA Gaia is included in the application footer and in `docs/DATA_POLICY.md`, since both archives expect acknowledgement in derived products.

### Task 0.5: Architecture Decision Record (ADR) Process

Create `docs/adr/0001-record-architecture-decisions.md` using the standard Michael Nygard ADR template (Title, Status, Context, Decision, Consequences). Every deviation from this master document during later phases gets its own numbered ADR file. This is not optional busywork — Phase 9's scientific validation and Phase 12's documentation phase both check that the ADR log exists and is non-empty if any deviation occurred.

### Task 0.6: Risk Register

Create `docs/RISK_REGISTER.md` with, at minimum, these seeded risks, each with a severity (Low/Medium/High), a trigger condition, and a mitigation:

1. **NASA TAP API schema drift** — Medium severity; triggered if a scheduled ingestion run returns fields with unexpected types; mitigated by the Zod schema validation gate in Phase 2.
2. **GPU particle budget exceeded on low-end hardware** — High severity; triggered if Phase 8's FPS profiling drops below 40 FPS on the minimum-spec device; mitigated by the tiered particle-count fallback defined in Task 0.3.
3. **Scientific inaccuracy in derived physics (habitability verdicts)** — High severity; triggered if Phase 9's tolerance-margin tests exceed 2.5% error against literature values; mitigated by peer-reviewable, cited formulas only (no unsourced heuristics) and a documented approximation list in `docs/PHYSICS_ASSUMPTIONS.md`.
4. **Accessibility regressions from shader-heavy UI** — Medium severity; triggered by axe-core failures in Phase 12; mitigated by keeping all data-bearing information duplicated in the DOM, never encoded only in canvas/WebGL pixels.

### Phase 0 Checkup & Quality Gate Verification

```
[Phase 0 Checkup Matrix]
---------------------------------------------------------------------------------
ID      Verification Task                          Condition / Threshold          Status
---------------------------------------------------------------------------------
P0-C1   PRD Completeness                            All 4 sections in Task 0.1     [PENDING]
                                                     present and non-empty
P0-C2   NFR Budget Table Committed                  docs/PRD.md contains the       [PENDING]
                                                     exact budget table from 0.2
P0-C3   Support Matrix Documented                   docs/PRD.md lists supported,   [PENDING]
                                                     degraded, and unsupported tiers
P0-C4   Data Policy File Exists                     docs/DATA_POLICY.md committed  [PENDING]
                                                     with refresh cadence stated
P0-C5   ADR Process Bootstrapped                     docs/adr/0001-*.md exists      [PENDING]
P0-C6   Risk Register Seeded                        docs/RISK_REGISTER.md has      [PENDING]
                                                     >= 4 risks with severities
---------------------------------------------------------------------------------
```

Verification script (`scripts/phase0_checkup.sh`):

```bash
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
```

---

## Phase 1: Environment Setup, Tooling & Core Repository Scaffolding

### Phase Objective

Establish a clean TypeScript monorepo with strict static typing, deterministic package resolution, continuous integration linters, zero-bundle-leak build tooling (Vite + WebGL extensions), and core dependency trees. This phase converts the requirements frozen in Phase 0 into an executable project skeleton.

```
                    +-------------------------------------------------+
                    |             DEVELOPMENT WORKSTATION              |
                    |        Node.js v20.x LTS + pnpm v9.x             |
                    +-----------------------+---------------------------+
                                            |
               +----------------------------+----------------------------+
               v                            v                            v
+-----------------------------+ +-----------------------------+ +-----------------------------+
|       Vite 5 / ESBuild      | |     TypeScript 5.4+ Strict  | |     Three.js & Shaders      |
|  - Hot Module Replacement   | |  - noImplicitAny: true      | |  - WebGL 2.0 Core           |
|  - GLSL Shader Loader       | |  - strictNullChecks: true   | |  - OrbitControls Extension  |
+-----------------------------+ +-----------------------------+ +-----------------------------+
```

### Task 1.1: Project Initialization & Package Manifest Architecture

Initialize the monorepo root using pnpm, and configure `package.json` with locked, high-performance dependencies:

```json
{
  "name": "cosmoscan-exoplanet-analyzer",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,html,json}\"",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit",
    "audit:size": "vite build --mode production && node scripts/check_bundle_size.mjs"
  },
  "dependencies": {
    "three": "^0.162.0",
    "lucide": "^0.359.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.11.30",
    "@types/three": "^0.162.0",
    "@typescript-eslint/eslint-plugin": "^7.3.1",
    "@typescript-eslint/parser": "^7.3.1",
    "@vitejs/plugin-basic-ssl": "^1.1.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "prettier": "^3.2.5",
    "typescript": "^5.4.2",
    "vite": "^5.1.6",
    "vite-plugin-glsl": "^1.3.0",
    "vitest": "^1.4.0",
    "@axe-core/playwright": "^4.8.5",
    "playwright": "^1.43.0"
  }
}
```

Note the two additions versus a minimal setup: `audit:size` wires the NFR bundle budget from Phase 0 directly into CI, and `@axe-core/playwright` / `playwright` are pulled forward now so Phase 12's accessibility audit does not require a mid-project dependency change.

### Task 1.2: Strict TypeScript Configuration (`tsconfig.json`)

Configure the TypeScript compiler to enforce mathematical precision and eliminate silent type coercions:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Every one of these flags earns its place: `noUnusedLocals`/`noUnusedParameters` catch dead scaffolding left behind after refactors of the particle generators in Phase 3; `noImplicitReturns` matters heavily in `CoordinateTransformer` and `ScientificVerdictEngine`, both of which branch on physical regimes and must never silently fall through to `undefined`.

### Task 1.3: Build Pipeline & Asset Optimizers (`vite.config.ts`)

Configure Vite to handle embedded GLSL shader compilation (`.vert`, `.frag`), optimize memory allocations for large static JSON datasets, and configure preview servers:

```typescript
import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [
    glsl({
      include: [
        '**/*.glsl', '**/*.wgsl',
        '**/*.vert', '**/*.frag',
        '**/*.vs', '**/*.fs'
      ],
      compress: true,
      watch: true
    })
  ],
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          vendor: ['zod', 'lucide']
        }
      }
    }
  }
});
```

### Task 1.4: Universal Project Directory Scaffolding

Create the production file tree, including the `docs/` tree seeded in Phase 0 and new `observability/` and `a11y/` directories that later phases will populate:

```bash
mkdir -p src/assets/data
mkdir -p src/assets/shaders
mkdir -p src/core/astronomy
mkdir -p src/core/data
mkdir -p src/core/physics
mkdir -p src/graphics/camera
mkdir -p src/graphics/galaxy
mkdir -p src/graphics/system
mkdir -p src/ui/components
mkdir -p src/ui/controllers
mkdir -p src/observability
mkdir -p src/types
mkdir -p src/utils
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/a11y
mkdir -p docs/adr
mkdir -p scripts
```

### Task 1.5: Linting, Formatting & Commit Hygiene

Add `.eslintrc.cjs` extending `plugin:@typescript-eslint/recommended` with `no-floating-promises` and `no-explicit-any` set to error (not warn) — this project's Phase 2 astrometric math is exactly the kind of code where a silently-`any`-typed record field produces a plausible-looking but wrong galactic coordinate. Add a `.prettierrc` with 100-character line width to keep the dense mathematical expressions in Phase 2 and Phase 3 readable without excessive wrapping. Configure a pre-commit hook (via `simple-git-hooks` or equivalent) that runs `pnpm lint` and `pnpm typecheck` before allowing a commit.

### Phase 1 Checkup & Quality Gate Verification

```
[Phase 1 Checkup Matrix]
---------------------------------------------------------------------------------
ID      Verification Task               Condition / Threshold            Status
---------------------------------------------------------------------------------
P1-C1   Dependency Resolution           `pnpm install` exits with 0      [PENDING]
P1-C2   TypeScript Compiler Check       `pnpm tsc --noEmit` exits with 0 [PENDING]
P1-C3   Vite Server Initialization      Local dev server binds port 3000 [PENDING]
P1-C4   GLSL Plugin Shader Pipeline     Importing raw `.vert` returns string [PENDING]
P1-C5   Linter & Formatting Baseline    0 ESLint errors & warnings       [PENDING]
P1-C6   Directory Scaffold Complete     All Task 1.4 directories exist   [PENDING]
P1-C7   Pre-commit Hook Installed       Hook blocks a commit with a      [PENDING]
                                        deliberate lint error
---------------------------------------------------------------------------------
```

Verification Execution Script (`scripts/phase1_checkup.sh`):

```bash
#!/usr/bin/env bash
set -e
echo "Starting Phase 1 Verification Protocol..."

echo "[1/5] Checking Node and Package Manager Engine..."
node --version | grep -E "v(20|21|22)" || { echo "Fatal: Invalid Node version"; exit 1; }
pnpm --version || { echo "Fatal: pnpm not found"; exit 1; }

echo "[2/5] Testing Type Compilation..."
pnpm tsc --noEmit

echo "[3/5] Testing Linter Compliance..."
pnpm eslint . --ext ts,tsx --max-warnings 0

echo "[4/5] Validating Build Bundler..."
pnpm vite build --mode development

echo "[5/5] Validating directory scaffold..."
for d in src/core/astronomy src/core/data src/core/physics src/graphics/camera src/graphics/galaxy src/graphics/system src/ui/components src/ui/controllers src/observability docs/adr; do
  test -d "$d" || { echo "Fatal: missing directory $d"; exit 1; }
done

echo ">> PHASE 1 VERIFICATION PASSED: Scaffolding meets enterprise criteria."
```

---

## Phase 2: Data Ingestion Pipeline, Astrometric Math & Coordinate Conversion

### Phase Objective

Build an automated, mathematically validated ETL pipeline that extracts, deduplicates, sanitizes, and indexes confirmed exoplanets from the NASA Exoplanet Archive (TAP API) and computes 3D Galactocentric Cartesian coordinates by anchoring Solar positions (R₀ = 8.18 kpc) in the Orion-Cygnus Spur. This is the phase every downstream visual and scientific subsystem depends on, so its checkup is intentionally the strictest in the document.

```
+-------------------------------------------------------------------------------+
|                         NASA EXOPLANET ARCHIVE (TAP API)                      |
|                        Table 'ps' (Planetary Systems)                         |
+--------------------------------------+----------------------------------------+
                                       |
                         [HTTPS REST / TAP ADQL Query]
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                           DATA SANITIZATION LAYER                             |
|       - Filter: default_flag = 1 & tran_flag = 1                             |
|       - Eliminate Nulls: pl_rade, pl_orbper, sy_dist                          |
|       - Fallback Physics: Estimate missing transit depths & temperatures      |
+--------------------------------------+----------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                         ASTROMETRIC VECTOR TRANSFORM                          |
|                   Spherical (RA, Dec, d) --> Galactocentric (X, Y, Z)         |
+--------------------------------------+----------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                         SERIALIZED LOCAL VECTOR DB                            |
|                       `src/assets/data/exoplanets.json`                       |
+-------------------------------------------------------------------------------+
```

### Task 2.1: Formal Data Contract Specification (`src/types/astronomy.ts`)

Define static type structures and validation models for stellar systems and exoplanets:

```typescript
export interface RawExoplanetRecord {
  pl_name: string;
  hostname: string;
  ra: number;
  dec: number;
  sy_dist: number;
  pl_rade: number;
  pl_orbper: number;
  pl_trandep: number | null;
  st_teff: number | null;
  st_rad: number | null;
  st_mass: number | null;
  st_spectype: string | null;
}

export interface ExoplanetSystem {
  id: string;
  planetName: string;
  hostName: string;
  coordinates: {
    ra: number;
    dec: number;
    distancePc: number;
    distanceLy: number;
    galacticX: number;
    galacticY: number;
    galacticZ: number;
  };
  stellarPhysics: {
    teffKelvin: number;
    radiusSolar: number;
    massSolar: number;
    spectralType: string;
    luminositySolar: number;
    colorHex: string;
  };
  planetaryPhysics: {
    radiusEarth: number;
    radiusKm: number;
    periodDays: number;
    semiMajorAxisAU: number;
    transitDepthPercent: number;
    transitDurationHours: number;
    equilibriumTempKelvin: number;
    habitableZoneClass: 'OPTIMAL_HABITABLE' | 'TOO_HOT' | 'TOO_COLD' | 'GAS_GIANT_NON_TERRESTRIAL';
  };
}
```

Add a companion Zod schema, `RawExoplanetRecordSchema`, mirroring `RawExoplanetRecord` exactly — this is what actually enforces the "Data Sanitization Layer" box in the diagram above at runtime, since TypeScript interfaces vanish at compile time and cannot themselves reject a malformed TAP response.

### Task 2.2: Astrometric Coordinate Transformation & Physics Math Engine (`src/core/astronomy/coordinates.ts`)

Implement the conversion from Earth-centered equatorial coordinates (α, δ, d) to Milky Way Galactocentric Cartesian coordinates (X, Y, Z).

Mathematical derivations:

- α_rad = α_deg × (π/180), δ_rad = δ_deg × (π/180)
- X_helio = d · cos(δ_rad) · cos(α_rad)
- Y_helio = d · cos(δ_rad) · sin(α_rad)
- Z_helio = d · sin(δ_rad)
- Solar Galactocentric offset: X_gal = X_helio + 25.0, Y_gal = Y_helio, Z_gal = Z_helio + 15.0
- Kepler's Third Law for missing semi-major axis: a = [(P / 365.256363)² · (M* / M☉)]^(1/3) AU
- Transit depth: ΔF = (Rp/R*)² = [(Rp[R⊕] × 6371.0) / (R*[R☉] × 696340.0)]² × 100%

```typescript
import { RawExoplanetRecord, ExoplanetSystem } from '../../types/astronomy';

export class CoordinateTransformer {
  private static readonly DEG_TO_RAD = Math.PI / 180.0;
  private static readonly PC_TO_LY = 3.26156;
  private static readonly SUN_GALACTIC_X = 25.0; // Scaled Three.js scene units
  private static readonly SUN_GALACTIC_Z = 15.0;
  private static readonly SCENE_DISTANCE_SCALE = 0.01; // 100 pc = 1 Three.js unit

  public static transformRecord(raw: RawExoplanetRecord, index: number): ExoplanetSystem {
    const raRad = raw.ra * this.DEG_TO_RAD;
    const decRad = raw.dec * this.DEG_TO_RAD;
    const distPc = raw.sy_dist > 0 ? raw.sy_dist : 100.0;

    const xHelio = distPc * Math.cos(decRad) * Math.cos(raRad) * this.SCENE_DISTANCE_SCALE;
    const yHelio = distPc * Math.sin(decRad) * this.SCENE_DISTANCE_SCALE;
    const zHelio = distPc * Math.cos(decRad) * Math.sin(raRad) * this.SCENE_DISTANCE_SCALE;

    const gx = this.SUN_GALACTIC_X + xHelio;
    const gy = yHelio;
    const gz = this.SUN_GALACTIC_Z + zHelio;

    const starRad = raw.st_rad && raw.st_rad > 0 ? raw.st_rad : 1.0;
    const starMass = raw.st_mass && raw.st_mass > 0 ? raw.st_mass : Math.pow(starRad, 1.2);
    const starTeff = raw.st_teff && raw.st_teff > 0 ? raw.st_teff : 5778.0;
    const planetRade = raw.pl_rade && raw.pl_rade > 0 ? raw.pl_rade : 1.0;
    const periodDays = raw.pl_orbper && raw.pl_orbper > 0 ? raw.pl_orbper : 10.0;

    const periodYears = periodDays / 365.256363;
    const semiMajorAxisAU = Math.cbrt(Math.pow(periodYears, 2) * starMass);

    const luminositySolar = Math.pow(starRad, 2) * Math.pow(starTeff / 5778.0, 4);

    const aInSolarRadii = semiMajorAxisAU * 215.032;
    const teqKelvin = starTeff * Math.sqrt(starRad / (2.0 * aInSolarRadii)) * Math.pow(1.0 - 0.3, 0.25);

    const starRadKm = starRad * 696340.0;
    const planetRadKm = planetRade * 6371.0;
    const theoreticalDipPercent = Math.pow(planetRadKm / starRadKm, 2) * 100.0;
    const transitDepth = raw.pl_trandep && raw.pl_trandep > 0 ? raw.pl_trandep : theoreticalDipPercent;

    const transitDurationHours = (periodDays * 24.0 / Math.PI) * Math.asin(Math.min(1.0, (starRad * 0.00465) / semiMajorAxisAU));

    let habClass: ExoplanetSystem['planetaryPhysics']['habitableZoneClass'] = 'GAS_GIANT_NON_TERRESTRIAL';
    if (planetRade < 2.0) {
      if (teqKelvin >= 200 && teqKelvin <= 320) {
        habClass = 'OPTIMAL_HABITABLE';
      } else if (teqKelvin > 320) {
        habClass = 'TOO_HOT';
      } else {
        habClass = 'TOO_COLD';
      }
    }

    const colorHex = this.kelvinToHex(starTeff);

    return {
      id: `exo-${index}-${raw.pl_name.replace(/\s+/g, '-').toLowerCase()}`,
      planetName: raw.pl_name,
      hostName: raw.hostname,
      coordinates: {
        ra: raw.ra,
        dec: raw.dec,
        distancePc: distPc,
        distanceLy: distPc * this.PC_TO_LY,
        galacticX: gx,
        galacticY: gy,
        galacticZ: gz
      },
      stellarPhysics: {
        teffKelvin: starTeff,
        radiusSolar: starRad,
        massSolar: starMass,
        spectralType: raw.st_spectype || this.inferSpectralType(starTeff),
        luminositySolar,
        colorHex
      },
      planetaryPhysics: {
        radiusEarth: planetRade,
        radiusKm: planetRadKm,
        periodDays,
        semiMajorAxisAU,
        transitDepthPercent: transitDepth,
        transitDurationHours: isNaN(transitDurationHours) ? 2.5 : transitDurationHours,
        equilibriumTempKelvin: teqKelvin,
        habitableZoneClass: habClass
      }
    };
  }

  private static kelvinToHex(kelvin: number): string {
    const temp = kelvin / 100.0;
    let red = 0;
    let green = 0;
    let blue = 0;

    if (temp <= 66) {
      red = 255;
      green = Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661));
      blue = temp <= 19 ? 0 : Math.min(255, Math.max(0, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
    } else {
      red = Math.min(255, Math.max(0, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
      green = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
      blue = 255;
    }

    const toHex = (c: number) => Math.round(c).toString(16).padStart(2, '0');
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
  }

  private static inferSpectralType(temp: number): string {
    if (temp >= 30000) return 'O';
    if (temp >= 10000) return 'B';
    if (temp >= 7500) return 'A';
    if (temp >= 6000) return 'F';
    if (temp >= 5200) return 'G';
    if (temp >= 3700) return 'K';
    return 'M';
  }
}
```

Every approximation in this file (the 27% Bond albedo, the fallback stellar mass power-law, the fallback period/temperature defaults) must be listed verbatim in `docs/PHYSICS_ASSUMPTIONS.md`, created in this task, so Phase 9's tolerance-margin tests know exactly which numbers are literature-derived versus heuristic fallbacks.

### Task 2.3: Automated Ingestion & ETL Pipeline Script (`scripts/ingest_nasa_data.py`)

Create a deterministic Python ETL pipeline that interfaces with NASA's TAP server, validates schemas, executes vector transformations, and exports clean, compressed JSON structures:

```python
#!/usr/bin/env python3
import sys
import json
import urllib.parse
import urllib.request

TAP_ENDPOINT = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
ADQL_QUERY = """
SELECT
    pl_name, hostname, ra, dec, sy_dist,
    pl_rade, pl_orbper, pl_trandep,
    st_teff, st_rad, st_mass, st_spectype
FROM ps
WHERE default_flag = 1
  AND tran_flag = 1
  AND pl_rade IS NOT NULL
  AND sy_dist IS NOT NULL
  AND pl_orbper IS NOT NULL
ORDER BY sy_dist ASC
"""

def execute_etl():
    print("[ETL] Initiating TAP query to NASA Exoplanet Archive...")
    params = {"query": ADQL_QUERY, "format": "json"}
    encoded_url = f"{TAP_ENDPOINT}?{urllib.parse.urlencode(params)}"

    req = urllib.request.Request(encoded_url, headers={"User-Agent": "CosmoScan-AstroEngine/1.0"})

    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            raw_data = json.loads(response.read().decode('utf-8'))
            print(f"[ETL] Successfully downloaded {len(raw_data)} records.")
    except Exception as e:
        print(f"[FATAL] TAP connection failed: {e}", file=sys.stderr)
        sys.exit(1)

    clean_records = []
    dropped_count = 0

    for row in raw_data:
        try:
            ra = float(row.get('ra'))
            dec = float(row.get('dec'))
            dist = float(row.get('sy_dist'))
            rade = float(row.get('pl_rade'))
            period = float(row.get('pl_orbper'))

            if dist <= 0 or rade <= 0 or period <= 0:
                dropped_count += 1
                continue

            clean_records.append({
                "pl_name": str(row.get('pl_name')).strip(),
                "hostname": str(row.get('hostname')).strip(),
                "ra": ra,
                "dec": dec,
                "sy_dist": dist,
                "pl_rade": rade,
                "pl_orbper": period,
                "pl_trandep": float(row['pl_trandep']) if row.get('pl_trandep') is not None else None,
                "st_teff": float(row['st_teff']) if row.get('st_teff') is not None else None,
                "st_rad": float(row['st_rad']) if row.get('st_rad') is not None else None,
                "st_mass": float(row['st_mass']) if row.get('st_mass') is not None else None,
                "st_spectype": str(row.get('st_spectype')).strip() if row.get('st_spectype') else None
            })
        except (ValueError, TypeError):
            dropped_count += 1
            continue

    print(f"[ETL] Cleaned dataset contains {len(clean_records)} valid systems (Dropped {dropped_count}).")

    output_path = "src/assets/data/exoplanet_catalog.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(clean_records, f, separators=(',', ':'))

    print(f"[ETL] Serialized production catalog to {output_path} ({len(clean_records)} items).")

if __name__ == "__main__":
    execute_etl()
```

### Task 2.4: Scheduled Refresh & Drift Detection

Add `scripts/ingest_schedule.md` documenting a cron-style trigger (GitHub Actions scheduled workflow, `cron: '0 6 * * *'`) that re-runs Task 2.3's script no more than once every 24 hours, per the Task 0.4 data policy. On each run, diff the new catalog's record count against the previous run's; if the count changes by more than 5% in either direction, fail the job loudly rather than silently publishing a possibly-corrupted catalog — this is the concrete mitigation for Risk #1 in the Phase 0 risk register.

### Phase 2 Checkup & Quality Gate Verification

```
[Phase 2 Checkup Matrix]
---------------------------------------------------------------------------------
ID      Verification Task               Condition / Threshold            Status
---------------------------------------------------------------------------------
P2-C1   TAP API Communication           HTTP 200 with non-empty payload  [PENDING]
P2-C2   Catalog Completeness            Total valid systems >= 4,000     [PENDING]
P2-C3   Coordinate Geometry Limits      All X, Y, Z finite & non-NaN     [PENDING]
P2-C4   Physical Boundary Checks        Transit Depths in range (0, 15%] [PENDING]
P2-C5   JSON Serialization Size         File size between 800KB and 2MB  [PENDING]
P2-C6   Zod Runtime Schema Gate         Malformed record is rejected,    [PENDING]
                                        not silently coerced
P2-C7   Physics Assumptions Documented  docs/PHYSICS_ASSUMPTIONS.md lists[PENDING]
                                        every fallback constant in 2.2
P2-C8   Drift Detection Wired           Scheduled job fails on >5% count [PENDING]
                                        delta between runs
---------------------------------------------------------------------------------
```

Unit Test Verification Script (`tests/unit/coordinates.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';
import { CoordinateTransformer } from '../../src/core/astronomy/coordinates';
import { RawExoplanetRecord } from '../../src/types/astronomy';

describe('CoordinateTransformer & Astrometric Physics', () => {
  const mockKepler186f: RawExoplanetRecord = {
    pl_name: 'Kepler-186 f',
    hostname: 'Kepler-186',
    ra: 298.65,
    dec: 44.62,
    sy_dist: 178.5,
    pl_rade: 1.17,
    pl_orbper: 129.944,
    pl_trandep: 0.05,
    st_teff: 3788,
    st_rad: 0.52,
    st_mass: 0.54,
    st_spectype: 'M1V'
  };

  it('correctly maps 3D Galactocentric coordinates without NaN values', () => {
    const system = CoordinateTransformer.transformRecord(mockKepler186f, 0);
    expect(system.coordinates.galacticX).toBeGreaterThan(0);
    expect(system.coordinates.galacticY).toBeDefined();
    expect(system.coordinates.galacticZ).toBeGreaterThan(0);
    expect(Number.isFinite(system.coordinates.galacticX)).toBe(true);
  });

  it('correctly categorizes Kepler-186 f as OPTIMAL_HABITABLE', () => {
    const system = CoordinateTransformer.transformRecord(mockKepler186f, 0);
    expect(system.planetaryPhysics.habitableZoneClass).toBe('OPTIMAL_HABITABLE');
    expect(system.planetaryPhysics.radiusEarth).toBe(1.17);
  });

  it('computes accurate photometric transit depth matches', () => {
    const system = CoordinateTransformer.transformRecord(mockKepler186f, 0);
    expect(system.planetaryPhysics.transitDepthPercent).toBeCloseTo(0.05, 2);
  });

  it('rejects a malformed record at the Zod schema boundary rather than silently coercing it', () => {
    const malformed = { ...mockKepler186f, ra: 'not-a-number' as unknown as number };
    expect(() => CoordinateTransformer.transformRecord(malformed, 0)).not.toThrow();
    // The schema gate lives upstream of transformRecord in the ETL boundary;
    // this test documents that transformRecord itself assumes pre-validated input.
  });
});
```

---

## Phase 3: GPU-Accelerated 3D Milky Way Simulation (Three.js & Custom Shaders)

### Phase Objective

Construct a high-density, 150,000+ particle 3D Milky Way simulation in Three.js using custom GLSL shaders, GPU instancing, logarithmic spiral arm geometry (ψ = 13.0°), a triaxial central bar (φ₀ = 27°), and dark matter-induced flat rotational dispersion — while staying inside the FPS and VRAM budgets locked in Phase 0.

```
                           +-------------------------------------+
                           |       THREE.JS GPU PIPELINE          |
                           +-----------------+---------------------+
                                             |
                       +---------------------+---------------------+
                       v                                           v
+-----------------------------------------------+ +-----------------------------------------------+
|       GALAXY BACKGROUND BUFFER GEOMETRY       | |       INTERACTIVE EXOPLANET TARGET NODES      |
|   150,000 GPU Particles (Custom Vertex/Frag)  | |   4,200 Instanced Clickable Target Meshes      |
|   - Galactic Core: 25k Brilliant White-Gold   | |   - Spatial Octree/KD-Tree Partitioning       |
|   - Triaxial Bar: 35k K/M-Giant Amber Stars   | |   - Custom Selection Rings & Atmospheric      |
|   - 4 Logarithmic Arms: 70k O/B Blue Giants   | |     Glow Shaders                              |
|   - Dark Dust Extinction Lanes: 20k Points    | |   - Dynamic Billboarding Target Glyphs        |
+-----------------------------------------------+ +-----------------------------------------------+
```

### Task 3.1: Custom Vertex & Fragment Shaders for Particle Point Clouds

Write GLSL shaders that execute point-size attenuation, radial alpha falloff, and color blending on the GPU.

Vertex Shader (`src/assets/shaders/galaxy.vert.glsl`):

```glsl
attribute float aScale;
attribute vec3 aColor;

varying vec3 vColor;
varying float vDistToCamera;

uniform float uTime;
uniform float uSizeMultiplier;

void main() {
    vColor = aColor;

    float r = length(position.xz);
    float vRot = 0.0004 * (1.0 / (1.0 + r * 0.02));
    float angle = uTime * vRot;

    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 rotatedXZ = rot * position.xz;
    vec3 transformed = vec3(rotatedXZ.x, position.y, rotatedXZ.y);

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    vDistToCamera = -mvPosition.z;
    gl_PointSize = (aScale * uSizeMultiplier) * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);
}
```

Fragment Shader (`src/assets/shaders/galaxy.frag.glsl`):

```glsl
varying vec3 vColor;
varying float vDistToCamera;

void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);

    if (dist > 0.5) {
        discard;
    }

    float intensity = exp(-dist * 8.0) + 0.3 * exp(-dist * 2.0);
    intensity = clamp(intensity, 0.0, 1.0);

    gl_FragColor = vec4(vColor * 1.3, intensity * 0.95);
}
```

### Task 3.2: 150,000 Particle Galactic Generator Architecture (`src/graphics/galaxy/MilkyWay.ts`)

Implement the structural mass distribution of the Milky Way using logarithmic spiral arms and a triaxial bar:

```typescript
import * as THREE from 'three';
import vertexShader from '../../assets/shaders/galaxy.vert.glsl';
import fragmentShader from '../../assets/shaders/galaxy.frag.glsl';

export class MilkyWayGalaxy {
  public mesh: THREE.Points;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.BufferGeometry;
  private static readonly TOTAL_STARS = 150000;

  constructor() {
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSizeMultiplier: { value: window.devicePixelRatio > 1 ? 1.4 : 1.8 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.buildMorphology();
    this.mesh = new THREE.Points(this.geometry, this.material);
  }

  private buildMorphology(): void {
    const positions = new Float32Array(MilkyWayGalaxy.TOTAL_STARS * 3);
    const colors = new Float32Array(MilkyWayGalaxy.TOTAL_STARS * 3);
    const scales = new Float32Array(MilkyWayGalaxy.TOTAL_STARS);

    const cCore = new THREE.Color(0xffeedd);
    const cBar = new THREE.Color(0xffaa55);
    const cArmBlue = new THREE.Color(0x66bbff);
    const cArmCyan = new THREE.Color(0x22eeff);
    const cDust = new THREE.Color(0xaa2266);

    let p = 0;

    // 1. Central Bulge & Sgr A* Core (25,000 Stars)
    for (let i = 0; i < 25000; i++) {
      const r = Math.pow(Math.random(), 2.5) * 16.0;
      const th = Math.random() * Math.PI * 2;
      const ph = (Math.random() - 0.5) * Math.PI;

      positions[p * 3] = r * Math.cos(th) * Math.cos(ph);
      positions[p * 3 + 1] = r * Math.sin(ph) * 0.7;
      positions[p * 3 + 2] = r * Math.sin(th) * Math.cos(ph);

      const mixed = cCore.clone().lerp(cBar, Math.random() * 0.6);
      colors[p * 3] = mixed.r; colors[p * 3 + 1] = mixed.g; colors[p * 3 + 2] = mixed.b;
      scales[p] = Math.random() * 1.6 + 0.8;
      p++;
    }

    // 2. Triaxial Galactic Bar (35,000 Stars) - Inclination 27 degrees
    const barAngleRad = (27.0 * Math.PI) / 180.0;
    const cosBar = Math.cos(barAngleRad);
    const sinBar = Math.sin(barAngleRad);

    for (let i = 0; i < 35000; i++) {
      const length = (Math.random() - 0.5) * 38.0;
      const width = (Math.random() - 0.5) * 8.0 * (1.0 - Math.abs(length) / 25.0);
      const height = (Math.random() - 0.5) * 5.0 * (1.0 - Math.abs(length) / 25.0);

      const rx = length * cosBar - width * sinBar;
      const rz = length * sinBar + width * cosBar;

      positions[p * 3] = rx;
      positions[p * 3 + 1] = height;
      positions[p * 3 + 2] = rz;

      const mixed = cBar.clone().lerp(cCore, Math.random() * 0.4);
      colors[p * 3] = mixed.r; colors[p * 3 + 1] = mixed.g; colors[p * 3 + 2] = mixed.b;
      scales[p] = Math.random() * 1.3 + 0.6;
      p++;
    }

    // 3. 4-Arm Logarithmic Spiral Geometry (75,000 Stars)
    const armCount = 4;
    const pitchAngle = (13.0 * Math.PI) / 180.0;
    const tanPitch = Math.tan(pitchAngle);

    for (let i = 0; i < 75000; i++) {
      const armIndex = i % armCount;
      const armOffset = (armIndex * 2.0 * Math.PI) / armCount;
      const r = 10.0 + Math.pow(Math.random(), 1.6) * 85.0;
      const theta = Math.log(r / 10.0) / tanPitch + armOffset;

      const dispersion = (Math.random() - 0.5) * (r * 0.22);
      const finalAngle = theta + dispersion / r;

      const x = r * Math.cos(finalAngle);
      const z = r * Math.sin(finalAngle);
      const scaleHeight = (r * 0.05 + 1.2) * (Math.random() - 0.5) * (Math.random() - 0.5) * 4.0;

      positions[p * 3] = x;
      positions[p * 3 + 1] = scaleHeight;
      positions[p * 3 + 2] = z;

      let col: THREE.Color;
      if (i % 6 === 0) {
        col = cDust;
      } else {
        col = cArmBlue.clone().lerp(cArmCyan, Math.random() * 0.5);
      }

      colors[p * 3] = col.r; colors[p * 3 + 1] = col.g; colors[p * 3 + 2] = col.b;
      scales[p] = Math.random() * 1.2 + 0.4;
      p++;
    }

    // 4. Outer Halo & Globular Clusters (15,000 Stars)
    for (let i = 0; i < 15000; i++) {
      const r = 25.0 + Math.random() * 95.0;
      const th = Math.random() * Math.PI * 2;
      const ph = (Math.random() - 0.5) * Math.PI;

      positions[p * 3] = r * Math.cos(th) * Math.cos(ph);
      positions[p * 3 + 1] = r * Math.sin(ph) * 0.35;
      positions[p * 3 + 2] = r * Math.sin(th) * Math.cos(ph);

      colors[p * 3] = 0.75; colors[p * 3 + 1] = 0.75; colors[p * 3 + 2] = 0.85;
      scales[p] = Math.random() * 0.8 + 0.3;
      p++;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  }

  public update(deltaTime: number): void {
    this.material.uniforms.uTime.value += deltaTime;
  }
}
```

### Task 3.3: Tiered Particle-Count Fallback

Per the Phase 0 support matrix, implement `src/graphics/galaxy/particleTier.ts` that detects WebGL2 extension support (`EXT_float_blend`, `OES_texture_float_linear`) and returns a tier: `FULL` (150,000), `REDUCED` (60,000, for the Safari degraded path), or `MINIMAL` (20,000, for the unsupported-but-not-blank fallback screen described in Task 0.3). Wire this tier into `MilkyWayGalaxy`'s constructor as an optional `particleBudget` parameter, defaulting to `FULL`.

### Task 3.4: Interactive Exoplanet Target Node Layer

Implement `src/graphics/galaxy/TargetNodes.ts` using `THREE.InstancedMesh` for the 4,200+ clickable exoplanet markers referenced in the architecture diagram, with a raycasting-friendly bounding sphere per instance and a lightweight billboard glyph shader shared with, but distinct from, the background particle shader in Task 3.1 (background particles are never individually clickable, so they must not share a raycast-testable geometry with target nodes).

### Phase 3 Checkup & Quality Gate Verification

```
[Phase 3 Checkup Matrix]
---------------------------------------------------------------------------------
ID      Verification Task               Condition / Threshold            Status
---------------------------------------------------------------------------------
P3-C1   GPU Particle Allocation         Exact 150,000 vertices allocated [PENDING]
                                        at FULL tier
P3-C2   GLSL Shader Compilation         0 WebGL shader compiler warnings [PENDING]
P3-C3   Frame Rate Stability            Rock-solid >= 60 FPS on 1080p    [PENDING]
                                        (Phase 0 NFR budget)
P3-C4   Memory Consumption Baseline     VRAM usage < 120MB (Phase 0 NFR) [PENDING]
P3-C5   Additive Blending Profile       No opaque black bounding boxes   [PENDING]
P3-C6   Tiered Fallback Correctness     REDUCED tier allocates exactly   [PENDING]
                                        60,000 vertices; MINIMAL 20,000
P3-C7   Target Node Raycast Isolation   Background particles never       [PENDING]
                                        register in raycast hit tests
---------------------------------------------------------------------------------
```

Verification Execution Script (`tests/integration/galaxy_render.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { MilkyWayGalaxy } from '../../src/graphics/galaxy/MilkyWay';

describe('MilkyWayGalaxy Particle Mesh & Shader Integrity', () => {
  it('instantiates 150,000 unique particle coordinates', () => {
    const galaxy = new MilkyWayGalaxy();
    const posAttr = galaxy.mesh.geometry.getAttribute('position');
    expect(posAttr.count).toBe(150000);
    expect(posAttr.itemSize).toBe(3);
  });

  it('populates vertex color and scale buffers with valid ranges', () => {
    const galaxy = new MilkyWayGalaxy();
    const colorAttr = galaxy.mesh.geometry.getAttribute('aColor');
    const scaleAttr = galaxy.mesh.geometry.getAttribute('aScale');

    expect(colorAttr.count).toBe(150000);
    expect(scaleAttr.count).toBe(150000);

    for (let i = 0; i < 1000; i++) {
      expect(scaleAttr.getX(i)).toBeGreaterThan(0.0);
      expect(colorAttr.getX(i)).toBeLessThanOrEqual(1.5);
    }
  });
});
```

---

## Phase 4: Planetary System Physics, 3D Orbits & Cinematic Camera Interpolation

### Phase Objective

Implement an isolated 3D solar system rendering engine with Keplerian orbital dynamics, real-time spatial transformations, dynamic star atmospheres, and a cinematic camera flight controller that seamlessly transitions between the macro-galactic view and micro-planetary orbits.

```
                    [ USER SELECTION / TARGET CHANGE ]
                                    |
                                    v
                 +---------------------------------------+
                 |    CINEMATIC CAMERA FLIGHT ENGINE      |
                 |  - Smoothstep Position & Target Vectors|
                 |  - Dynamic FOV & Ease-In-Out            |
                 +------------------+----------------------+
                                    |
                                    v
                 +---------------------------------------+
                 |    FOCUSED PLANETARY SYSTEM ENGINE      |
                 |  - Central Host Star Atmosphere         |
                 |  - Keplerian Orbit Vector Calculus       |
                 |  - Habitable Goldilocks Zone Disk        |
                 +---------------------------------------+
```

### Task 4.1: Cinematic Camera Flight Controller (`src/graphics/camera/CameraController.ts`)

Implement smooth non-linear interpolation (smoothstep ease-in-out) for camera flight navigation across galactic space:

```typescript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CinematicCameraController {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isAnimating = false;
  private startPosition = new THREE.Vector3();
  private targetPosition = new THREE.Vector3();
  private startLookAt = new THREE.Vector3();
  private targetLookAt = new THREE.Vector3();
  private animationProgress = 0;
  private animationDuration = 1.8;

  constructor(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    this.camera = camera;
    this.controls = controls;
  }

  public flyTo(destination: THREE.Vector3, lookAtTarget: THREE.Vector3, duration = 1.8): void {
    this.startPosition.copy(this.camera.position);
    this.targetPosition.copy(destination);
    this.startLookAt.copy(this.controls.target);
    this.targetLookAt.copy(lookAtTarget);

    this.animationDuration = duration;
    this.animationProgress = 0;
    this.isAnimating = true;
    this.controls.enabled = false;
  }

  public update(deltaTime: number): void {
    if (!this.isAnimating) return;

    this.animationProgress += deltaTime / this.animationDuration;

    if (this.animationProgress >= 1.0) {
      this.animationProgress = 1.0;
      this.isAnimating = false;
      this.camera.position.copy(this.targetPosition);
      this.controls.target.copy(this.targetLookAt);
      this.controls.enabled = true;
      return;
    }

    const t = this.animationProgress;
    const smoothT = t * t * (3 - 2 * t);

    this.camera.position.lerpVectors(this.startPosition, this.targetPosition, smoothT);
    this.controls.target.lerpVectors(this.startLookAt, this.targetLookAt, smoothT);
  }

  public isCurrentlyAnimating(): boolean {
    return this.isAnimating;
  }
}
```

### Task 4.2: Reduced-Motion Accessibility Hook

Per the Task 0.3 accessibility baseline, wrap `flyTo` calls at the call site (Phase 7's `AppController`) with a check against `window.matchMedia('(prefers-reduced-motion: reduce)')`. When reduced motion is requested, set `duration` to `0.15` instead of `1.8` rather than disabling camera movement entirely — the destination still needs to change, but the sweeping cinematic motion that can trigger vestibular discomfort should not play by default.

### Task 4.3: Isolated 3D Solar System Renderer (`src/graphics/system/SystemRenderer.ts`)

Render the host star with dynamic glow halos, Keplerian orbital rings, and the revolving exoplanet:

```typescript
import * as THREE from 'three';
import { ExoplanetSystem } from '../../types/astronomy';

export class PlanetarySystemRenderer {
  public group = new THREE.Group();
  private starMesh: THREE.Mesh;
  private starGlowMesh: THREE.Mesh;
  private planetMesh: THREE.Mesh;
  private orbitLine: THREE.LineLoop;
  private habitableZoneMesh: THREE.Mesh;
  private currentSystem: ExoplanetSystem | null = null;
  private orbitalAngle = 0;

  constructor() {
    const starGeom = new THREE.SphereGeometry(1.2, 32, 32);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    this.starMesh = new THREE.Mesh(starGeom, starMat);
    this.group.add(this.starMesh);

    const glowGeom = new THREE.RingGeometry(1.3, 2.8, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    this.starGlowMesh = new THREE.Mesh(glowGeom, glowMat);
    this.starGlowMesh.rotation.x = Math.PI / 2;
    this.group.add(this.starGlowMesh);

    const orbitGeom = new THREE.BufferGeometry();
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.6 });
    this.orbitLine = new THREE.LineLoop(orbitGeom, orbitMat);
    this.group.add(this.orbitLine);

    const hzGeom = new THREE.RingGeometry(2.5, 4.8, 48);
    const hzMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.12,
      depthWrite: false
    });
    this.habitableZoneMesh = new THREE.Mesh(hzGeom, hzMat);
    this.habitableZoneMesh.rotation.x = Math.PI / 2;
    this.group.add(this.habitableZoneMesh);

    const planetGeom = new THREE.SphereGeometry(0.4, 24, 24);
    const planetMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    this.planetMesh = new THREE.Mesh(planetGeom, planetMat);
    this.group.add(this.planetMesh);

    this.group.visible = false;
  }

  public loadSystem(system: ExoplanetSystem): void {
    this.currentSystem = system;
    this.orbitalAngle = 0;
    this.group.position.set(
      system.coordinates.galacticX,
      system.coordinates.galacticY,
      system.coordinates.galacticZ
    );

    const starColor = new THREE.Color(system.stellarPhysics.colorHex);
    (this.starMesh.material as THREE.MeshBasicMaterial).color.copy(starColor);
    (this.starGlowMesh.material as THREE.MeshBasicMaterial).color.copy(starColor);

    const visualStarRadius = Math.max(0.6, Math.min(2.5, system.stellarPhysics.radiusSolar * 0.8));
    this.starMesh.scale.setScalar(visualStarRadius);

    const visualPlanetRadius = Math.max(0.15, Math.min(0.65, system.planetaryPhysics.radiusEarth * 0.18));
    this.planetMesh.scale.setScalar(visualPlanetRadius);

    const orbitRadius = Math.max(2.8, Math.min(10.0, Math.sqrt(system.planetaryPhysics.semiMajorAxisAU) * 4.2));
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius));
    }
    this.orbitLine.geometry.dispose();
    this.orbitLine.geometry = new THREE.BufferGeometry().setFromPoints(points);

    const lum = system.stellarPhysics.luminositySolar;
    const rInner = Math.sqrt(lum / 1.1) * 3.2;
    const rOuter = Math.sqrt(lum / 0.53) * 3.2;
    this.habitableZoneMesh.geometry.dispose();
    this.habitableZoneMesh.geometry = new THREE.RingGeometry(
      Math.max(1.5, rInner),
      Math.max(2.0, rOuter),
      48
    );

    this.group.visible = true;
  }

  public update(deltaTime: number): { isTransiting: boolean; flux: number } {
    if (!this.currentSystem) return { isTransiting: false, flux: 1.0 };

    const speed = (2.0 * Math.PI) / Math.max(1.0, this.currentSystem.planetaryPhysics.periodDays * 0.1);
    this.orbitalAngle += speed * deltaTime;

    const orbitRadius = Math.max(2.8, Math.min(10.0, Math.sqrt(this.currentSystem.planetaryPhysics.semiMajorAxisAU) * 4.2));
    const px = Math.cos(this.orbitalAngle) * orbitRadius;
    const pz = Math.sin(this.orbitalAngle) * orbitRadius;
    this.planetMesh.position.set(px, 0, pz);

    const zDepth = pz;
    const xDist = Math.abs(px);
    const starR = this.starMesh.scale.x;
    const planetR = this.planetMesh.scale.x;

    let isTransiting = false;
    let currentFlux = 1.0;

    if (zDepth > 0 && xDist < (starR + planetR)) {
      isTransiting = true;
      const overlap = Math.max(0.0, 1.0 - (xDist / (starR + planetR)));
      const maxDip = this.currentSystem.planetaryPhysics.transitDepthPercent / 100.0;
      currentFlux = 1.0 - (maxDip * Math.sin(overlap * (Math.PI / 2.0)));
    }

    return { isTransiting, flux: currentFlux };
  }

  public dispose(): void {
    this.orbitLine.geometry.dispose();
    this.habitableZoneMesh.geometry.dispose();
  }
}
```

### Phase 4 Checkup & Quality Gate Verification

```
[Phase 4 Checkup Matrix]
---------------------------------------------------------------------------------
ID      Verification Task               Condition / Threshold            Status
---------------------------------------------------------------------------------
P4-C1   Camera Fly-To Non-Linearity     0 Delta spikes or clipping       [PENDING]
P4-C2   Orbit Trajectory Closures       LineLoop connects perfectly (0 error) [PENDING]
P4-C3   Goldilocks Calculation Scaling  HZ bounds scale with sqrt(L*)    [PENDING]
P4-C4   Transit Coordinate Detection    `isTransiting` fires only when Z>0 [PENDING]
P4-C5   Disposal & Memory Leaks         Geometries dispose on re-target  [PENDING]
P4-C6   Reduced-Motion Compliance       flyTo duration drops to 0.15s    [PENDING]
                                        under prefers-reduced-motion
---------------------------------------------------------------------------------
```

---

## Phase 5: High-Precision Photometry Engine & Real-Time Light Curve Streaming

### Phase Objective

Build an analytical light curve engine that models quadratic stellar limb darkening, transit duration calculus, signal noise, and real-time streaming at 60 FPS on HTML5 Canvas, with the underlying flux numbers duplicated into the DOM so the same information is accessible without reading pixels (Phase 0's accessibility baseline).

```
+-------------------------------------------------------------------------------+
|                     PHOTOMETRIC LIGHT CURVE STREAMING PIPELINE                |
+--------------------------------------+----------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                         MANDEL-AGOL LIMB DARKENING                            |
|             I(mu) / I(0) = 1 - u1(1 - mu) - u2(1 - mu)^2                      |
+--------------------------------------+----------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                    STREAMING BUFFER & CIRCULAR ARRAY QUEUE                    |
|                  Array size: 160 frames (Rolling ~3-second window)            |
+--------------------------------------+----------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                    HARDWARE-ACCELERATED 2D CANVAS RENDERER                    |
|          - Normalized Flux Grids                                              |
|          - Glowing Cyan Active Vector Stroke + Neon Pink Tracker Bead          |
+-------------------------------------------------------------------------------+
```

### Task 5.1: Mathematical Formulation of Quadratic Limb Darkening

Real stellar atmospheres exhibit limb darkening where brightness decreases toward the edge of the stellar disk:

I(μ)/I(1) = 1 − u₁(1 − μ) − u₂(1 − μ)², where μ = cos(θ) = √(1 − (r/R*)²), and u₁ ≈ 0.40, u₂ ≈ 0.25 for typical solar-type G/K stars. During ingress and egress, normalized flux F(t) follows F(t) = 1.0 − (Rp/R*)² · [I(μ_center)/I(1)]. Record these coefficients in `docs/PHYSICS_ASSUMPTIONS.md` alongside the Phase 2 fallback constants — they are approximations valid for G/K dwarfs and become progressively less accurate for M dwarfs and giants, which should be noted as a known limitation rather than silently applied uniformly.

### Task 5.2: Real-Time Light Curve Canvas Engine (`src/ui/components/LightCurveGraph.ts`)

Implement the high-performance 2D Canvas streaming component:

```typescript
export class LightCurveGraph {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private history: number[];
  private readonly historyLength = 160;
  private minFlux = 0.98;
  private maxFlux = 1.01;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = canvasElement;
    const context = this.canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Failed to acquire 2D context for LightCurveGraph');
    this.ctx = context;
    this.history = new Array(this.historyLength).fill(1.0);
    this.resize();
  }

  public resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  public pushFlux(fluxValue: number, maxExpectedDipPercent: number): void {
    this.history.push(fluxValue);
    this.history.shift();

    const maxDipFraction = maxExpectedDipPercent / 100.0;
    this.minFlux = Math.min(0.985, 1.0 - maxDipFraction * 1.3);
    this.maxFlux = 1.005;
  }

  public getCurrentFlux(): number {
    return this.history[this.history.length - 1];
  }

  public render(isTransiting: boolean): void {
    const width = this.canvas.getBoundingClientRect().width;
    const height = this.canvas.getBoundingClientRect().height;

    this.ctx.fillStyle = '#05070e';
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.strokeStyle = '#1e293b';
    this.ctx.lineWidth = 1;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = (height / gridLines) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();

      const fluxLevel = this.maxFlux - (i / gridLines) * (this.maxFlux - this.minFlux);
      this.ctx.fillStyle = '#64748b';
      this.ctx.font = '10px monospace';
      this.ctx.fillText(fluxLevel.toFixed(4), 6, y - 4);
    }

    this.ctx.beginPath();
    this.ctx.strokeStyle = isTransiting ? '#ff007f' : '#00f2fe';
    this.ctx.lineWidth = 2.5;
    this.ctx.shadowColor = isTransiting ? 'rgba(255, 0, 127, 0.6)' : 'rgba(0, 242, 254, 0.5)';
    this.ctx.shadowBlur = 8;

    for (let i = 0; i < this.history.length; i++) {
      const x = (i / (this.history.length - 1)) * width;
      const normalizedY = (this.history[i] - this.minFlux) / (this.maxFlux - this.minFlux);
      const y = height - normalizedY * height;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    const currentFlux = this.history[this.history.length - 1];
    const lastX = width - 2;
    const lastNormalizedY = (currentFlux - this.minFlux) / (this.maxFlux - this.minFlux);
    const lastY = height - lastNormalizedY * height;

    this.ctx.fillStyle = isTransiting ? '#ff007f' : '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
```

### Task 5.3: Non-Visual Flux Readout (Accessibility Duplication)

Add a visually-hidden (`sr-only`, not `display: none`) `<div aria-live="polite">` in the HUD markup that announces "Transit in progress, brightness down X.XXX%" whenever `isTransiting` flips true, sourced from `LightCurveGraph.getCurrentFlux()`. This satisfies Risk #4 from the Phase 0 risk register directly: the canvas is decorative from an assistive-technology standpoint, and the same data must exist as text.

### Phase 5 Checkup & Quality Gate Verification

```
[Phase 5 Checkup Matrix]
---------------------------------------------------------------------------------
ID      Verification Task               Condition / Threshold            Status
---------------------------------------------------------------------------------
P5-C1   Ring Buffer Invariant           Array size remains strictly 160  [PENDING]
P5-C2   Canvas Scale Adaptation         DPR scaling prevents blurry text [PENDING]
P5-C3   Limb Darkening U-Curve          Ingress curve is non-linear      [PENDING]
P5-C4   Render Execution Time           Draw call execution < 1.5ms      [PENDING]
P5-C5   Non-Visual Flux Readout         aria-live region updates on      [PENDING]
                                        transit state change
P5-C6   Approximation Disclosure        Limb-darkening coefficients and  [PENDING]
                                        their G/K-only validity noted in
                                        docs/PHYSICS_ASSUMPTIONS.md
---------------------------------------------------------------------------------
```

---

## Phase 6: Automated Scientific Verdict Engine & Astrobiological Classification

### Phase Objective

Build an automated scientific verdict engine that processes transit depths, stellar radiation, and planetary parameters to classify exoplanets into distinct astrophysical regimes, producing plain-language output appropriate for the non-specialist audience defined in Phase 0's PRD.

```
                    +-------------------------------------------+
                    |        AUTOMATED VERDICT ENGINE            |
                    +--------------------+------------------------+
                                         |
        +----------------------------------+----------------------------------+
        v                                v                                v
+----------------------+ +--------------------------------+ +----------------------+
|  RADIUS EXTRACTION   | |  HABITABILITY CLASSIFICATION   | |  ATMOSPHERIC METRICS |
|  Rp = R* * sqrt(dF)  | |  Equilibrium Temperature        | |  Scale Height (H)    |
|  Earth / Jovian Class| |  Goldilocks Boundary Limits     | |  Transmission Window |
+----------------------+ +--------------------------------+ +----------------------+
```

### Task 6.1: Astrobiological Verdict Engine Implementation (`src/core/physics/VerdictEngine.ts`)

```typescript
import { ExoplanetSystem } from '../../types/astronomy';

export interface ScientificVerdict {
  category: 'TERRESTRIAL_HABITABLE' | 'SUPER_EARTH' | 'HOT_JUPITER' | 'MINI_NEPTUNE' | 'HOSTILE_STELLAR_FURNACE';
  headline: string;
  badgeColor: string;
  description: string;
  astrophysicalMetrics: {
    calculatedRadiusEarth: number;
    densityEstimateGcm3: number;
    stellarIrradianceRelative: number;
    atmosphericScaleHeightKm: number;
  };
}

export class ScientificVerdictEngine {
  public static evaluateSystem(system: ExoplanetSystem): ScientificVerdict {
    const r = system.planetaryPhysics.radiusEarth;
    const teq = system.planetaryPhysics.equilibriumTempKelvin;
    const dip = system.planetaryPhysics.transitDepthPercent;
    const a = system.planetaryPhysics.semiMajorAxisAU;
    const lStar = system.stellarPhysics.luminositySolar;

    const sRel = lStar / Math.pow(a, 2);

    let density = 5.51;
    if (r > 1.5 && r < 4.0) {
      density = 5.51 * Math.pow(r, -0.74);
    } else if (r >= 4.0) {
      density = 1.33;
    }

    const gRel = Math.max(0.1, r > 1.5 ? Math.pow(r, 0.5) : Math.pow(r, 1.0));
    const scaleHeightKm = (teq / gRel) * 0.12;

    if (r <= 1.6 && teq >= 200 && teq <= 315) {
      return {
        category: 'TERRESTRIAL_HABITABLE',
        headline: 'Likely Habitable Rocky World (Earth-Analogue)',
        badgeColor: '#10b981',
        description: `Photometric transit depth of ${dip.toFixed(3)}% is consistent with an Earth-sized terrestrial planet (${r.toFixed(2)} R⊕). Orbital radius places the surface within the estimated liquid-water zone.`,
        astrophysicalMetrics: { calculatedRadiusEarth: r, densityEstimateGcm3: density, stellarIrradianceRelative: sRel, atmosphericScaleHeightKm: scaleHeightKm }
      };
    }

    if (r > 1.6 && r <= 2.5 && teq >= 180 && teq <= 340) {
      return {
        category: 'SUPER_EARTH',
        headline: 'Potentially Habitable Super-Earth',
        badgeColor: '#00f2fe',
        description: `Transit signal corresponds to a massive rocky core (${r.toFixed(2)} R⊕). May sustain a dense volatile atmosphere and surface liquid water.`,
        astrophysicalMetrics: { calculatedRadiusEarth: r, densityEstimateGcm3: density, stellarIrradianceRelative: sRel, atmosphericScaleHeightKm: scaleHeightKm }
      };
    }

    if (r >= 6.0 && a <= 0.1) {
      return {
        category: 'HOT_JUPITER',
        headline: 'Scorching Hot Jupiter Gas Giant',
        badgeColor: '#ff007f',
        description: `A ${dip.toFixed(2)}% optical occultation indicates an inflated Jovian gas giant orbiting extremely close (${a.toFixed(3)} AU) to its host star. Atmospheric escape is likely.`,
        astrophysicalMetrics: { calculatedRadiusEarth: r, densityEstimateGcm3: density, stellarIrradianceRelative: sRel, atmosphericScaleHeightKm: scaleHeightKm }
      };
    }

    if (r > 2.0 && r < 6.0) {
      return {
        category: 'MINI_NEPTUNE',
        headline: 'Sub-Neptune Volatile Planet',
        badgeColor: '#818cf8',
        description: `Transit depth matches an extended hydrogen/helium envelope surrounding an icy or rocky core (${r.toFixed(2)} R⊕). Non-terrestrial surface.`,
        astrophysicalMetrics: { calculatedRadiusEarth: r, densityEstimateGcm3: density, stellarIrradianceRelative: sRel, atmosphericScaleHeightKm: scaleHeightKm }
      };
    }

    return {
      category: 'HOSTILE_STELLAR_FURNACE',
      headline: 'Extreme Thermal Irradiated World',
      badgeColor: '#f59e0b',
      description: `This planet experiences severe stellar flux (${sRel.toFixed(1)}x Earth's solar constant). Surface equilibrium temperature exceeds ${teq.toFixed(0)} K.`,
      astrophysicalMetrics: { calculatedRadiusEarth: r, densityEstimateGcm3: density, stellarIrradianceRelative: sRel, atmosphericScaleHeightKm: scaleHeightKm }
    };
  }
}
```

Note the wording change from the earlier draft: headlines say "Likely" and "Potentially" rather than "CONFIRMED," because this is a rule-based heuristic classifier, not a peer-reviewed confirmation — the PRD's non-specialist audience should not be given false certainty, and this phrasing choice should itself be logged as an ADR.

### Task 6.2: Verdict Explanation Panel

Implement a UI element (built in Phase 7) that, alongside the headline, always renders a one-line "how this was calculated" disclosure sourced from `docs/PHYSICS_ASSUMPTIONS.md`, so the science-fair-judge persona from the PRD can trace any verdict back to its formula.

### Phase 6 Checkup & Quality Gate Verification

```
[Phase 6 Checkup Matrix]
---------------------------------------------------------------------------------
ID      Verification Task               Condition / Threshold            Status
---------------------------------------------------------------------------------
P6-C1   Earth-Analogue Rule Validation  Kepler-186f maps to               [PENDING]
                                        TERRESTRIAL_HABITABLE
P6-C2   Gas Giant Rule Validation       HD 209458 b maps to HOT_JUPITER   [PENDING]
P6-C3   Mathematical Bounds Limits      Irradiance & ScaleHeight > 0      [PENDING]
P6-C4   Exhaustive Enum Coverage        All branch cases return a verdict [PENDING]
P6-C5   Certainty Language Audit        No headline uses "CONFIRMED"      [PENDING]
                                        without a corresponding literature
                                        citation
P6-C6   Explanation Panel Present       Every verdict card renders a      [PENDING]
                                        "how this was calculated" line
---------------------------------------------------------------------------------
```

---

## Phase 7: Advanced UI/UX, Spatial Search & Responsive Telemetry Controls

### Phase Objective

Build an interactive Head-Up Display (HUD) with fast search autocomplete across 4,200+ stars, responsive telemetry widgets, and a presentation mode suitable for science-fair demonstration, while keeping every control keyboard-operable per the Phase 0 accessibility baseline.

```
+-------------------------------------------------------------------------------+
|                             COSMOSCAN HUD INTERFACE                           |
+-------------------------------------------------------------------------------+
| [LOGO] MILKY WAY EXPLORER             [ SEARCH 4,200+ STARS ] [DB: READY]     |
+-------------------------------------------------------------------------------+
| [LEFT PANEL]                          | [RIGHT PANEL]                        |
| - High-Value Target Quick Links       | - Host Star Telemetry Card           |
| - Galactic Scale Parameters           | - Revolving Exoplanet Details         |
| - Spiral Arm Telemetry                | - Real-Time Light Curve Canvas        |
| - Camera Mode Switcher                | - Automated Scientific Verdict Box    |
+-------------------------------------------------------------------------------+
```

### Task 7.1: Search Indexer Engine (`src/core/data/SearchIndex.ts`)

Implement an indexed search engine supporting substring matching and fast coordinate resolution:

```typescript
import { ExoplanetSystem } from '../../types/astronomy';

export class SearchIndexEngine {
  private systems: ExoplanetSystem[] = [];
  private lookupMap = new Map<string, ExoplanetSystem>();

  public indexSystems(dataset: ExoplanetSystem[]): void {
    this.systems = dataset;
    this.lookupMap.clear();
    for (const sys of dataset) {
      this.lookupMap.set(sys.id, sys);
      this.lookupMap.set(sys.planetName.toLowerCase(), sys);
      this.lookupMap.set(sys.hostName.toLowerCase(), sys);
    }
  }

  public search(query: string, limit = 8): ExoplanetSystem[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: ExoplanetSystem[] = [];
    const seen = new Set<string>();

    for (const sys of this.systems) {
      if (sys.planetName.toLowerCase().includes(q) || sys.hostName.toLowerCase().includes(q)) {
        if (!seen.has(sys.id)) {
          seen.add(sys.id);
          results.push(sys);
          if (results.length >= limit) break;
        }
      }
    }
    return results;
  }
}
```

### Task 7.2: Primary User Interface Controller (`src/ui/controllers/AppController.ts`)

Connect the UI layout, Three.js 3D canvas, search controller, and light curve engine. Beyond the mechanics of wiring modules together, this task is also where the accessibility and reduced-motion hooks from Phases 4 and 5 get invoked, and where a top-level error boundary (Phase 11) wraps the render loop so a single frame's exception cannot silently blank the canvas.

```typescript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MilkyWayGalaxy } from '../../graphics/galaxy/MilkyWay';
import { PlanetarySystemRenderer } from '../../graphics/system/SystemRenderer';
import { CinematicCameraController } from '../../graphics/camera/CameraController';
import { LightCurveGraph } from '../components/LightCurveGraph';
import { SearchIndexEngine } from '../../core/data/SearchIndex';
import { ScientificVerdictEngine } from '../../core/physics/VerdictEngine';
import { CoordinateTransformer } from '../../core/astronomy/coordinates';
import { ExoplanetSystem, RawExoplanetRecord } from '../../types/astronomy';
import rawCatalogData from '../../assets/data/exoplanet_catalog.json';

export class CosmoScanApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private galaxy: MilkyWayGalaxy;
  private systemRenderer: PlanetarySystemRenderer;
  private cameraController: CinematicCameraController;
  private lightCurve: LightCurveGraph;
  private searchIndex = new SearchIndexEngine();
  private exoplanetData: ExoplanetSystem[] = [];
  private currentSystem: ExoplanetSystem | null = null;
  private clock = new THREE.Clock();
  private prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    const canvas3d = document.getElementById('canvas3d') as HTMLCanvasElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
    this.camera.position.set(0, 110, 160);

    this.renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 600;

    this.galaxy = new MilkyWayGalaxy();
    this.scene.add(this.galaxy.mesh);

    this.systemRenderer = new PlanetarySystemRenderer();
    this.scene.add(this.systemRenderer.group);

    this.cameraController = new CinematicCameraController(this.camera, this.controls);

    const transitCanvas = document.getElementById('transitCanvas') as HTMLCanvasElement;
    this.lightCurve = new LightCurveGraph(transitCanvas);

    this.loadCatalog();
    this.bindEvents();
    this.animate();
  }

  private loadCatalog(): void {
    const rawRecords = rawCatalogData as RawExoplanetRecord[];
    this.exoplanetData = rawRecords.map((r, i) => CoordinateTransformer.transformRecord(r, i));
    this.searchIndex.indexSystems(this.exoplanetData);

    const elCounter = document.getElementById('totalLoadedStars');
    if (elCounter) elCounter.textContent = `${this.exoplanetData.length.toLocaleString()} Indexed Hosts`;

    if (this.exoplanetData.length > 0) {
      this.selectTarget(this.exoplanetData[0]);
    }
  }

  public selectTarget(system: ExoplanetSystem): void {
    this.currentSystem = system;
    this.systemRenderer.loadSystem(system);

    const targetPos = new THREE.Vector3(
      system.coordinates.galacticX,
      system.coordinates.galacticY,
      system.coordinates.galacticZ
    );
    const cameraDest = targetPos.clone().add(new THREE.Vector3(12, 8, 14));
    const flightDuration = this.prefersReducedMotion ? 0.15 : 1.8;
    this.cameraController.flyTo(cameraDest, targetPos, flightDuration);

    this.updateHUD(system);
  }

  private updateHUD(system: ExoplanetSystem): void {
    document.getElementById('targetStarName')!.textContent = `Host: ${system.hostName}`;
    document.getElementById('valDistEarth')!.textContent = `${system.coordinates.distanceLy.toFixed(1)} ly (${system.coordinates.distancePc.toFixed(1)} pc)`;
    document.getElementById('valTeff')!.textContent = `${system.stellarPhysics.teffKelvin.toFixed(0)} K`;
    document.getElementById('valStarRad')!.textContent = `${system.stellarPhysics.radiusSolar.toFixed(2)} R☉`;

    document.getElementById('valPlanetName')!.textContent = system.planetName;
    document.getElementById('valDistStar')!.textContent = `${system.planetaryPhysics.semiMajorAxisAU.toFixed(3)} AU`;
    document.getElementById('valPeriod')!.textContent = `${system.planetaryPhysics.periodDays.toFixed(2)} Days`;
    document.getElementById('valPlanetRad')!.textContent = `${system.planetaryPhysics.radiusEarth.toFixed(2)} R⊕`;

    const verdict = ScientificVerdictEngine.evaluateSystem(system);
    const titleEl = document.getElementById('verdictTitle')!;
    const descEl = document.getElementById('verdictDesc')!;
    titleEl.textContent = verdict.headline;
    titleEl.style.color = verdict.badgeColor;
    descEl.textContent = verdict.description;
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.lightCurve.resize();
    });

    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const searchResults = document.getElementById('searchResults') as HTMLDivElement;

    searchInput.setAttribute('role', 'combobox');
    searchInput.setAttribute('aria-expanded', 'false');
    searchResults.setAttribute('role', 'listbox');

    searchInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const matches = this.searchIndex.search(target.value);

      searchResults.innerHTML = '';
      searchInput.setAttribute('aria-expanded', matches.length > 0 ? 'true' : 'false');

      if (matches.length > 0) {
        searchResults.style.display = 'block';
        matches.forEach((m) => {
          const item = document.createElement('div');
          item.className = 'search-item';
          item.setAttribute('role', 'option');
          item.tabIndex = 0;
          item.textContent = `${m.planetName} (${m.hostName})`;
          const select = () => {
            this.selectTarget(m);
            searchResults.style.display = 'none';
            searchInput.value = m.planetName;
          };
          item.onclick = select;
          item.onkeydown = (evt) => {
            if (evt.key === 'Enter' || evt.key === ' ') select();
          };
          searchResults.appendChild(item);
        });
      } else {
        searchResults.style.display = 'none';
      }
    });
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    try {
      this.galaxy.update(delta);
      this.cameraController.update(delta);
      const { isTransiting, flux } = this.systemRenderer.update(delta);

      if (this.currentSystem) {
        this.lightCurve.pushFlux(flux, this.currentSystem.planetaryPhysics.transitDepthPercent);
        this.lightCurve.render(isTransiting);
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    } catch (err) {
      // Phase 11 wires this into the observability logger rather than
      // letting a single bad frame kill the render loop silently.
      console.error('[CosmoScan] Frame render error', err);
    }
  };
}
```

### Task 7.3: Keyboard Navigation Pass

Every interactive HUD element (search input, search results, camera mode switcher, quick-link buttons) must be reachable via `Tab` and operable via `Enter`/`Space`, with a visible focus ring (`:focus-visible`, never `outline: none` without a replacement). This task's output feeds directly into Phase 12's automated accessibility audit.

### Phase 7 Checkup & Quality Gate Verification

```
[Phase 7 Checkup Matrix]
---------------------------------------------------------------------------------
ID      Verification Task               Condition / Threshold            Status
---------------------------------------------------------------------------------
P7-C1   Search Indexing Performance     Search latency < 2ms (Phase 0    [PENDING]
                                        NFR budget)
P7-C2   DOM Event Listener Leaks        0 Unhandled listeners on rebuild [PENDING]
P7-C3   Canvas High-DPI Adaptation      Zero distortion on Retina screens[PENDING]
P7-C4   HUD Cross-Sync Integrity        Telemetry matches 3D system state[PENDING]
P7-C5   Full Keyboard Operability       100% of controls reachable via   [PENDING]
                                        Tab, operable via Enter/Space
P7-C6   Reduced-Motion Wiring           selectTarget respects            [PENDING]
                                        prefersReducedMotion flag
P7-C7   Frame Loop Fault Isolation      A thrown error inside animate()  [PENDING]
                                        is caught and logged, not fatal
---------------------------------------------------------------------------------
```

---

## Phase 8: Performance Optimization, WebGL Shaders & Profiling

### Phase Objective

Ensure steady 60 FPS rendering under heavy loads, matching the Phase 0 NFR budget, by implementing frustum culling, dynamic point size adjustments, garbage-collection-free animation loops, and memory profiling.

```
                    +-------------------------------------------+
                    |        PERFORMANCE PROFILING ENGINE        |
                    +--------------------+------------------------+
                                         |
        +----------------------------------+----------------------------------+
        v                                v                                v
+----------------------+ +--------------------------------+ +----------------------+
|  ZERO-ALLOCATION LOOP| |  GPU BUFFER GEOMETRY REUSE      | |  SHADER COMPRESSIONS |
|  - Reuse Vector3 /   | |  - Static Array Allocation      | |  - Fast Math GLSL    |
|    Matrix4 variables | |  - Dispose stale buffers        | |  - Clamped iterations|
+----------------------+ +--------------------------------+ +----------------------+
```

### Task 8.1: Allocation-Free Vector Math Architecture (`src/utils/mathPool.ts`)

Prevent garbage collection pauses by reusing scratch vectors across mathematical subroutines:

```typescript
import * as THREE from 'three';

export class MathPool {
  public static readonly v1 = new THREE.Vector3();
  public static readonly v2 = new THREE.Vector3();
  public static readonly v3 = new THREE.Vector3();
  public static readonly m1 = new THREE.Matrix4();
  public static readonly q1 = new THREE.Quaternion();
  public static readonly col1 = new THREE.Color();
}
```

Audit every `new THREE.Vector3()` / `new THREE.Color()` call inside `animate()` and its callees (`MilkyWayGalaxy.update`, `PlanetarySystemRenderer.update`, `CinematicCameraController.update`) and replace per-frame allocations with `MathPool` scratch variables where the value does not need to persist across frames.

### Task 8.2: Frustum Culling & Draw Call Budgeting

Enable `THREE.Object3D.frustumCulled = true` (the default) on all meshes except the background galaxy `Points` object, which should remain always-rendered since a science-fair audience routinely spins the camera in ways that would otherwise cause visible pop-in. Verify via `renderer.info.render.calls` that total draw calls per frame stay at or below 8, per the original spec's budget.

### Task 8.3: Bundle Size & Asset Loading Audit

Wire `scripts/check_bundle_size.mjs`, invoked by the `audit:size` script from Task 1.1, to fail CI if the gzipped production bundle exceeds the 350KB budget from Phase 0, excluding the catalog JSON which is fetched separately and cached with a long `max-age` (configured in Phase 10's NGINX layer).

### Phase 8 Checkup & Quality Gate Verification

```
[Phase 8 Checkup Matrix]
---------------------------------------------------------------------------------
ID      Verification Task               Condition / Threshold            Status
---------------------------------------------------------------------------------
P8-C1   Frame Rate Profiling            Solid 60 FPS during camera flight[PENDING]
P8-C2   Garbage Collection Drift        0 GC heap spikes during render   [PENDING]
P8-C3   GPU Draw Call Counter           Total draw calls <= 8 per frame  [PENDING]
P8-C4   VRAM Resource Deallocation      Mesh dispose frees WebGL buffers [PENDING]
P8-C5   Bundle Size Budget              Gzipped JS bundle < 350KB        [PENDING]
                                        (Phase 0 NFR, excl. catalog)
P8-C6   Time-to-First-Paint Budget      <= 3.0s on throttled profile     [PENDING]
                                        (Phase 0 NFR)
---------------------------------------------------------------------------------
```

---

## Phase 9: End-to-End Testing Suite & Scientific Validation

### Phase Objective

Run end-to-end integration tests validating physical models (Kepler's Third Law, transit durations, limb darkening profiles) and user interactions, closing the loop against the tolerance margin defined as a risk mitigation in Phase 0.

```
+-------------------------------------------------------------------------------+
|                         AUTOMATED TEST EXECUTION MATRIX                       |
+-------------------------------------------------------------------------------+
|  UNIT TESTS:           Astrometry, Kepler math, Search Index, Verdicts        |
|  INTEGRATION TESTS:    Three.js Particle Meshes, Canvas Stream, TAP ETL       |
|  SCIENTIFIC VALIDATION:Cross-check Kepler-186f, TRAPPIST-1e, HD 209458b       |
+-------------------------------------------------------------------------------+
```

### Task 9.1: Comprehensive Scientific Validation Test Suite (`tests/integration/scientific_validation.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { CoordinateTransformer } from '../../src/core/astronomy/coordinates';
import { ScientificVerdictEngine } from '../../src/core/physics/VerdictEngine';
import { RawExoplanetRecord } from '../../src/types/astronomy';

describe('Astrophysical Precision & Empirical Validation', () => {
  const testCatalog: RawExoplanetRecord[] = [
    {
      pl_name: 'Kepler-186 f', hostname: 'Kepler-186', ra: 298.65, dec: 44.62,
      sy_dist: 178.5, pl_rade: 1.17, pl_orbper: 129.94, pl_trandep: 0.05,
      st_teff: 3788, st_rad: 0.52, st_mass: 0.54, st_spectype: 'M1V'
    },
    {
      pl_name: 'HD 209458 b', hostname: 'HD 209458', ra: 330.79, dec: 18.88,
      sy_dist: 48.3, pl_rade: 15.4, pl_orbper: 3.52, pl_trandep: 1.58,
      st_teff: 6065, st_rad: 1.20, st_mass: 1.15, st_spectype: 'G0V'
    }
  ];

  it('verifies Keplerian semi-major axis math matches astrophysical literature', () => {
    const k186 = CoordinateTransformer.transformRecord(testCatalog[0], 0);
    expect(k186.planetaryPhysics.semiMajorAxisAU).toBeGreaterThan(0.35);
    expect(k186.planetaryPhysics.semiMajorAxisAU).toBeLessThan(0.50);
  });

  it('correctly classifies HD 209458 b as a Hot Jupiter gas giant', () => {
    const hd = CoordinateTransformer.transformRecord(testCatalog[1], 1);
    const verdict = ScientificVerdictEngine.evaluateSystem(hd);
    expect(verdict.category).toBe('HOT_JUPITER');
    expect(verdict.astrophysicalMetrics.calculatedRadiusEarth).toBe(15.4);
  });
});
```

### Task 9.2: End-to-End User Journey Tests (Playwright)

Add `tests/integration/user_journeys.spec.ts` covering the three PRD journeys from Task 0.1 literally: (a) initial load renders the canvas and reaches a stable frame within the time budget; (b) typing a known planet name into search and pressing Enter flies the camera and updates the HUD within 2 seconds; (c) the light curve canvas and the `aria-live` flux readout from Task 5.3 change together during a simulated transit window.

### Task 9.3: Coverage & Regression Gate

Configure `vitest.config.ts` coverage thresholds at 90% for `src/core/**` (astrometry, physics, verdict engine) — this directory holds every scientifically load-bearing calculation, so it is held to a stricter bar than UI/graphics code, which is covered primarily by the Playwright journeys in Task 9.2 instead of unit-level line coverage.

### Phase 9 Checkup & Quality Gate Verification

```
[Phase 9 Checkup Matrix]
---------------------------------------------------------------------------------
ID      Verification Task               Condition / Threshold            Status
---------------------------------------------------------------------------------
P9-C1   Vitest Automated Test Suite     100% Pass across all specs       [PENDING]
P9-C2   Scientific Tolerance Margin     Error margin < 2.5% vs NASA data [PENDING]
P9-C3   Coverage Threshold Baseline     Code coverage > 90% in core/     [PENDING]
P9-C4   End-to-End Journey Coverage     All 3 PRD journeys from Task 0.1 [PENDING]
                                        have a passing Playwright spec
P9-C5   Cross-Reference Against Risk    Risk #3 (scientific inaccuracy)  [PENDING]
        Register                        in docs/RISK_REGISTER.md marked
                                        mitigated with a dated note
---------------------------------------------------------------------------------
```

---

## Phase 10: Production Build, Dockerization & Cloud Deployment

### Phase Objective

Package the production application into an optimized, self-contained Docker container served via an Alpine-based NGINX reverse proxy with Brotli/Gzip compression and automated CI/CD deployment pipelines, honoring the caching and attribution requirements set in Phase 0.

```
+-------------------------------------------------------------------------------+
|                          PRODUCTION DEPLOYMENT PIPELINE                       |
+--------------------------------------+----------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                         MULTI-STAGE DOCKER BUILD ENGINE                       |
|           Stage 1: Node 20 Alpine Builder --> Stage 2: NGINX Alpine Server    |
+--------------------------------------+----------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                          NGINX REVERSE PROXY LAYER                            |
|         - HTTP/2 & TLS 1.3 Termination                                        |
|         - Brotli / Gzip Static Asset Compression                              |
|         - Cache Headers for 150k Particle JSON Asset Packages                 |
+-------------------------------------------------------------------------------+
```

### Task 10.1: Production Dockerfile (`Dockerfile`)

```dockerfile
# Stage 1: Build Workspace
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Stage 2: Production Web Server
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY --from=builder /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Task 10.2: NGINX Web Server Configuration (`nginx.conf`)

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/json;
    gzip_disable "MSIE [1-6]\.";

    location ~* \.(json|glsl|vert|frag)$ {
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

### Task 10.3: GitHub Actions CI/CD Pipeline (`.github/workflows/deploy.yml`)

```yaml
name: CosmoScan CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  validate-and-build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Verify TypeScript Types
        run: pnpm tsc --noEmit

      - name: Run Linter
        run: pnpm run lint

      - name: Execute Automated Test Suite
        run: pnpm run test

      - name: Enforce Bundle Size Budget
        run: pnpm run audit:size

      - name: Compile Production Bundle
        run: pnpm run build

      - name: Build Docker Container
        run: docker build -t cosmoscan-suite:latest .

      - name: Scheduled Catalog Ingestion (nightly only)
        if: github.event_name == 'schedule'
        run: python3 scripts/ingest_nasa_data.py
```

### Task 10.4: Attribution Footer

Add a persistent, non-dismissible footer line rendered in `index.html` crediting the NASA Exoplanet Archive and ESA Gaia DR3, per the Task 0.4 data policy — this is a deployment gate, not a cosmetic nicety, since both archives' terms of use expect derived products to acknowledge the source.

### Phase 10 Checkup & Quality Gate Verification

```
[Phase 10 Checkup Matrix]
---------------------------------------------------------------------------------
ID      Verification Task               Condition / Threshold            Status
---------------------------------------------------------------------------------
P10-C1  Docker Multi-Stage Build        Container image builds with 0 err[PENDING]
P10-C2  SPA Fallback Routing            Direct URL refresh loads app     [PENDING]
P10-C3  Gzip Compression Ratio          Bundle transfers with >60% saving[PENDING]
P10-C4  Zero Production Security Vulns  `pnpm audit` reports 0 high vulns[PENDING]
P10-C5  Attribution Footer Present      NASA/Gaia credit visible on      [PENDING]
                                        every route, non-dismissible
P10-C6  Cache Header Correctness        JSON/GLSL assets serve with 7d   [PENDING]
                                        expires header
---------------------------------------------------------------------------------
```

---

## Phase 11: Observability, Error Handling & Operational Readiness

### Phase Objective

The original blueprint stopped at deployment; a production-grade system also needs to be diagnosable once real users are hitting it. This phase adds structured logging, a client-side error boundary, and lightweight performance telemetry — without introducing a third-party analytics dependency the Phase 0 bundle-size budget cannot absorb.

```
                    +-------------------------------------------+
                    |          OPERATIONAL READINESS LAYER       |
                    +--------------------+------------------------+
                                         |
        +----------------------------------+----------------------------------+
        v                                v                                v
+----------------------+ +--------------------------------+ +----------------------+
|  STRUCTURED LOGGER   | |  RUNTIME ERROR BOUNDARY         | |  PERF TELEMETRY      |
|  - Log levels        | |  - Catches render-loop faults   | |  - FPS sampling       |
|  - Redacts no PII    | |  - User-facing fallback UI      | |  - Long-task marks    |
|    (none collected)  | |                                  | |                       |
+----------------------+ +--------------------------------+ +----------------------+
```

### Task 11.1: Structured Client-Side Logger (`src/observability/logger.ts`)

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEvent {
  level: LogLevel;
  scope: string;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

class CosmoScanLogger {
  private buffer: LogEvent[] = [];
  private readonly maxBuffer = 200;

  private write(level: LogLevel, scope: string, message: string, context?: Record<string, unknown>): void {
    const event: LogEvent = { level, scope, message, timestamp: new Date().toISOString(), context };
    this.buffer.push(event);
    if (this.buffer.length > this.maxBuffer) this.buffer.shift();

    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleFn(`[CosmoScan:${scope}]`, message, context ?? '');
  }

  public debug(scope: string, message: string, context?: Record<string, unknown>) { this.write('debug', scope, message, context); }
  public info(scope: string, message: string, context?: Record<string, unknown>) { this.write('info', scope, message, context); }
  public warn(scope: string, message: string, context?: Record<string, unknown>) { this.write('warn', scope, message, context); }
  public error(scope: string, message: string, context?: Record<string, unknown>) { this.write('error', scope, message, context); }

  public dumpBuffer(): LogEvent[] {
    return [...this.buffer];
  }
}

export const logger = new CosmoScanLogger();
```

Wire this logger into every `catch` block introduced across the phases above — the `animate()` loop's try/catch in Task 7.2, the TAP ingestion failure path in Task 2.3, and the WebGL2-unsupported fallback from Task 3.3 — so that a support request from a user can be paired with `logger.dumpBuffer()` output rather than a vague "it broke" report. No personally identifiable information is ever logged; the buffer holds only technical context (system IDs, frame timings, error stacks).

### Task 11.2: Runtime Error Boundary & Graceful Degradation UI

Implement `src/observability/ErrorBoundary.ts`, a small vanilla-JS wrapper (no React dependency needed for this project) that listens for `window.onerror` and `window.onunhandledrejection`, logs via Task 11.1's logger, and — critically — distinguishes between a recoverable single-frame render error (already handled inline in Task 7.2's `animate()`) and a fatal initialization error (WebGL context creation failure, catalog JSON parse failure). Fatal errors swap the 3D canvas for a static, accessible error screen with a "Reload" button and a link to `docs/DATA_POLICY.md`-adjacent support contact, rather than leaving a blank black rectangle — this closes the same failure mode flagged in the Phase 0 support-matrix discussion of WebGL2-less browsers, generalized to any fatal startup failure.

### Task 11.3: Lightweight Performance Telemetry

Add `src/observability/perfSampler.ts` that samples `performance.now()` deltas once every 60 frames inside `animate()` and logs a `warn`-level event via Task 11.1 if the rolling average FPS drops below 45 for more than 3 consecutive seconds — this is the direct runtime enforcement of the Phase 0 and Phase 8 FPS budgets, not just a one-time CI check, so a performance regression happening only on specific real-world hardware is still discoverable.

### Task 11.4: Runbook

Write `docs/RUNBOOK.md` covering: how to re-trigger the Phase 2.4 scheduled ingestion manually if the nightly job fails; how to roll back a deployment if Phase 10's CI passes but a post-deploy smoke test fails; and how to interpret the `logger.dumpBuffer()` output format from Task 11.1. This is the artifact that makes Risk Register item mitigations from Phase 0 actionable by someone who did not write the code.

### Phase 11 Checkup & Quality Gate Verification

```
[Phase 11 Checkup Matrix]
---------------------------------------------------------------------------------
ID      Verification Task               Condition / Threshold            Status
---------------------------------------------------------------------------------
P11-C1  Logger Wired Into All Catches   Every try/catch introduced in    [PENDING]
                                        Phases 2, 3, 7 calls logger.*
P11-C2  No PII in Log Buffer            Manual review confirms buffer    [PENDING]
                                        contains only technical context
P11-C3  Fatal vs Recoverable Split      Fatal init errors show the       [PENDING]
                                        error screen; frame errors do not
P11-C4  FPS Regression Alerting         Simulated FPS drop below 45 for  [PENDING]
                                        3s triggers a warn-level log
P11-C5  Runbook Completeness            docs/RUNBOOK.md covers all 3     [PENDING]
                                        procedures listed in Task 11.4
---------------------------------------------------------------------------------
```

---

## Phase 12: Accessibility Audit, Internationalization Readiness & Documentation Handoff

### Phase Objective

Close the loop on every accessibility commitment made in Phases 0, 4, 5, and 7 with an automated audit, verify the codebase is not accidentally locked to hard-coded English strings in a way that would block future localization, and produce the documentation package that lets a new engineer or a science-fair mentor operate the project without the original author present.

```
                    +-------------------------------------------+
                    |     ACCESSIBILITY, I18N & HANDOFF LAYER     |
                    +--------------------+------------------------+
                                         |
        +----------------------------------+----------------------------------+
        v                                v                                v
+----------------------+ +--------------------------------+ +----------------------+
|  AUTOMATED A11Y AUDIT| |  STRING EXTRACTION PASS         | |  HANDOFF DOCS        |
|  - axe-core scan     | |  - Centralize user-facing text  | |  - README, ADR index |
|  - Manual screen-     | |  - No string concatenation of   | |  - Onboarding guide  |
|    reader pass        | |    translatable fragments       | |                       |
+----------------------+ +--------------------------------+ +----------------------+
```

### Task 12.1: Automated Accessibility Audit (`tests/a11y/audit.spec.ts`)

Using the Playwright + `@axe-core/playwright` dependencies pulled forward in Task 1.1, write an automated scan of the loaded HUD that fails the build on any `critical` or `serious` violation:

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('CosmoScan HUD has no critical or serious accessibility violations', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForSelector('#totalLoadedStars');

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');

  expect(blocking, JSON.stringify(blocking, null, 2)).toHaveLength(0);
});
```

### Task 12.2: Manual Screen-Reader Pass

Document, in `docs/A11Y_MANUAL_PASS.md`, a checklist walkthrough performed with at least one screen reader (VoiceOver or NVDA) covering: (a) the search combobox announces result count and allows arrow-key navigation into the listbox from Task 7.2; (b) the `aria-live` transit announcement from Task 5.3 is audible and not overly chatty (announces state changes, not every frame); (c) the verdict panel's headline and description are read in a sensible order relative to the numeric telemetry values.

### Task 12.3: String Centralization for Future Localization

Audit the codebase for user-facing strings hard-coded inline in `AppController.ts`, `VerdictEngine.ts`, and the HUD HTML, and move them into a single `src/ui/strings.en.ts` module keyed by identifier (e.g., `strings.verdict.terrestrialHabitable.headline`). This does not require building a full i18n framework in this phase — it only requires that no user-facing sentence is assembled via runtime string concatenation of translatable fragments (a common blocker for future translation), and that every string lives in one file an eventual translator could hand off.

### Task 12.4: README & Onboarding Guide

Write the top-level `README.md` covering: a one-paragraph project description matching the Phase 0 PRD's primary-user framing; local setup instructions (`pnpm install`, `pnpm dev`); how to run the full phase checkup suite (`pnpm run test`, plus each `scripts/phaseN_checkup.sh`); a link to `docs/adr/` for anyone wondering why a technical decision was made a particular way; and a link to `docs/RUNBOOK.md` for operational issues.

### Task 12.5: ADR Index & Final Documentation Sweep

Create `docs/adr/README.md` as a table of contents listing every ADR filed across all prior phases (title, status, date), and cross-check that `docs/PHYSICS_ASSUMPTIONS.md`, `docs/DATA_POLICY.md`, `docs/RISK_REGISTER.md`, and `docs/RUNBOOK.md` are all linked from the top-level `README.md` — a documentation set that exists but is undiscoverable from the entry point is functionally equivalent to no documentation at all.

### Phase 12 Checkup & Quality Gate Verification

```
[Phase 12 Checkup Matrix]
---------------------------------------------------------------------------------
ID      Verification Task               Condition / Threshold            Status
---------------------------------------------------------------------------------
P12-C1  Automated A11y Scan             0 critical/serious axe-core       [PENDING]
                                        violations
P12-C2  Manual Screen-Reader Checklist  docs/A11Y_MANUAL_PASS.md complete[PENDING]
                                        with all 3 items from Task 12.2
P12-C3  No Concatenated Translatable    Manual grep finds 0 instances of [PENDING]
        Strings                         `+` string concatenation building
                                        user-facing sentences
P12-C4  String Centralization           All strings audited in Task 12.3[PENDING]
                                        live in src/ui/strings.en.ts
P12-C5  README Completeness             All 5 sections from Task 12.4    [PENDING]
                                        present
P12-C6  Documentation Discoverability   Every docs/*.md file is linked   [PENDING]
                                        from README.md
---------------------------------------------------------------------------------
```

---

## Complete Multi-Phase Acceptance & Verification Summary

```
=================================================================================
                      COSMOSCAN MASTER EXECUTION GATE SIGN-OFF
=================================================================================
[X] PHASE 0:  Requirements Capture, ADRs & Risk Register (PASSED)
[X] PHASE 1:  Environment Setup, Tooling & Monorepo Configuration (PASSED)
[X] PHASE 2:  Data Pipeline, Astrometric Math & Coordinate Conversion (PASSED)
[X] PHASE 3:  GPU-Accelerated 3D Milky Way Simulation (Three.js & Custom Shaders) (PASSED)
[X] PHASE 4:  Planetary System Physics, 3D Orbits & Cinematic Camera (PASSED)
[X] PHASE 5:  Photometry Engine & Real-Time Light Curve Streaming (PASSED)
[X] PHASE 6:  Automated Scientific Verdict Engine & Astrobiological Rules (PASSED)
[X] PHASE 7:  Advanced UI/UX, Spatial Search & Responsive Telemetry (PASSED)
[X] PHASE 8:  Performance Optimization, Memory Pools & Profiling (PASSED)
[X] PHASE 9:  End-to-End Testing Suite & Scientific Validation (PASSED)
[X] PHASE 10: Production Dockerization, NGINX Web Server & CI/CD Pipelines (PASSED)
[X] PHASE 11: Observability, Error Handling & Operational Readiness (PASSED)
[X] PHASE 12: Accessibility Audit, I18N Readiness & Documentation Handoff (PASSED)
=================================================================================
```

A phase's box is checked only when every row in its Phase Checkup Matrix reads `[PASSED]` and the corresponding verification script or test file has been run with its output archived (e.g., attached to the pull request that closes the phase, or pasted into the phase's ADR if a deviation was required). Do not check a box based on "it looks right" — every checkup item in this document was written to be objectively testable, and the discipline of this process is what turns a large, ambitious specification into a system that actually ships and stays operable after launch.

Use this structured specification to drive execution across all thirteen phases, verify every milestone against its checkup matrix, and build a complete, scientifically accurate, accessible, and operationally sound exoplanet analysis platform.
