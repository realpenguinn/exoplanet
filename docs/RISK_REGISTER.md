# CosmoScan Risk Register

This document records identified technical, scientific, and performance risks across the CosmoScan suite, including severity ratings, trigger conditions, and active mitigations.

---

### Risk 1: NASA TAP API Schema Drift & Ingestion Breaking
- **Severity**: Medium
- **Trigger Condition**: Scheduled or manual ingestion run returns unexpected nulls, renamed columns, or missing required fields in NASA's `ps` table.
- **Impact**: Upstream breaking changes could produce malformed vector catalogs or break downstream coordinate transformations.
- **Mitigation**: 
  1. Runtime Zod schema validation gate (`RawExoplanetRecordSchema`) rejects malformed records rather than silently coercing them.
  2. The ingestion pipeline requires a $\pm 5\%$ sanity check on total record counts before overwriting production data.
  3. Decoupled local vector cache (`src/assets/data/exoplanet_catalog.json`) ensures runtime application is completely insulated from live API outages.

---

### Risk 2: GPU Particle Budget Exceeded on Lower-End Hardware (Frame Drop below 60 FPS)
- **Severity**: High
- **Trigger Condition**: Frame rate profiling drops below 60 FPS on integrated GPUs (e.g. Intel UHD/Iris Xe) or high-DPI displays when rendering 150,000 particles.
- **Impact**: Jittery camera navigation, poor user experience during science fair demos.
- **Mitigation**:
  1. Dynamic tier detection (`src/graphics/galaxy/particleTier.ts`) automatically falls back to 60,000 particles (`REDUCED`) on constrained platforms.
  2. Device Pixel Ratio clamped to a maximum of 2.0 (or 1.5 in degraded mode).
  3. All rotation kinematics and color grading calculations are 100% GPU-bound inside GLSL shaders with zero per-frame CPU iteration.
  4. Allocation-free `MathPool` prevents Garbage Collection sawtooth hitches.

---

### Risk 3: Scientific Inaccuracy in Derived Physics & Astrobiological Verdicts
- **Severity**: High
- **Status**: **MITIGATED** (Validated 2026-09-02 via automated test suite `tests/integration/scientific_validation.test.ts` with error margin < 2.5% against NASA literature data)
- **Trigger Condition**: Derived values (Keplerian semi-major axis, transit depth, equilibrium temperature) deviate from published astrophysical literature by $> 2.5\%$.
- **Impact**: Scientific credibility loss before science-fair judges and researchers.
- **Mitigation**: 
  1. Strictly use peer-reviewed mathematical models (Kepler's Third Harmonic Law, Mandel & Agol 2002 quadratic limb darkening, Kopparapu 2013 circumstellar habitable zone boundaries).
  2. Document every physical assumption and fallback constant transparently in `docs/PHYSICS_ASSUMPTIONS.md`.
  3. Automated scientific validation unit tests (`tests/integration/scientific_validation.test.ts`) assert accuracy within 2.5% against benchmarks (Kepler-186 f, HD 209458 b, TRAPPIST-1 e).
  4. Language audit: Use probabilistic terminology ("Likely", "Potentially") rather than unsupported certainty claims.

---

### Risk 4: Accessibility Regressions in WebGL & Shader-Heavy UI
- **Severity**: Medium
- **Trigger Condition**: Interactive 3D WebGL canvas obscures telemetry data from screen-reader users, or high-speed camera flights trigger vestibular discomfort.
- **Impact**: Non-compliance with WCAG 2.1 AA accessibility guidelines.
- **Mitigation**:
  1. All critical visual data (transit flux, host star temperature, habitable classification) is mirrored into accessible DOM elements with ARIA roles and an `aria-live="polite"` telemetry announcer.
  2. Camera flight controller respects `prefers-reduced-motion: reduce`, dropping animation duration from 1.8s to 0.15s.
  3. 100% of interactive controls are keyboard-navigable (`Tab`, `Enter`, `Space`) with explicit `:focus-visible` styling.
  4. Automated `@axe-core/playwright` accessibility tests enforce 0 critical or serious violations.
