# CosmoScan — Product Requirements Document (PRD)

## 1. Product Overview & Purpose
CosmoScan is a high-performance, web-based astronomical data exploration and transit photometry suite. It combines real-time astrometric datasets (NASA Exoplanet Archive and ESA Gaia DR3) with a GPU-accelerated 3D Milky Way simulation (150,000+ particles), a Keplerian orbital dynamics solver, Mandel-Agol photometric transit synthesis, and an astrobiological habitability classifier.

## 2. Target Audience & Personas
- **Primary User**: Science-communication audience, astrophysics students, space enthusiasts, and judges at science exhibitions exploring exoplanet systems visually, requiring intuitive, responsive, and scientifically grounded representations.
- **Secondary User**: Educators and computational astronomy researchers seeking quick visual confirmation and validation of planetary transit depths and habitability classifications.

## 3. Core User Journeys
1. **Initial Exploration (Macro Galaxy View)**: Land on the application and see the 150,000-particle 3D Milky Way galaxy render smoothly at $\ge 60$ FPS within 3 seconds on standard consumer hardware.
2. **Target Search & Cinematic Navigation**: Search any of 4,600+ confirmed exoplanets by name or host star with sub-2ms autocomplete latency, selecting a target to initiate a smoothstep camera fly-to across galactic coordinates to the target solar system within 2 seconds.
3. **Planetary System & Orbital Mechanics**: Observe the host star with temperature-accurate Planck coloring and dynamic glow halo, Keplerian orbital path, circumstellar habitable zone boundaries, and the revolving exoplanet.
4. **Photometric Light Curve Streaming**: Watch a real-time, 60 FPS Canvas 2D photometric light curve stream during orbital transit, modeling quadratic stellar limb darkening, contact points, and radius extraction $(\Delta F = (R_p / R_*)^2)$.
5. **Astrobiological Verdict Inspection**: Read an automated, transparent scientific habitability assessment evaluating surface temperature, density estimate, relative solar irradiance, and atmospheric scale height.

## 4. Non-Goals
- **Not a Mission Planner**: Not intended as an orbital mission trajectory solver or professional instrument pointing scheduler.
- **Not a Catalog Editor**: Does not support user mutations or crowdsourced data uploads; catalog data is synchronized from official scientific archives.
- **No Synchronous External Ingestion**: The browser client does not make synchronous, blocking network calls to NASA or ESA TAP servers on load.

## 5. Non-Functional Requirement (NFR) Budgets
The following hard technical constraints are verified across CI/CD and runtime performance profiling:

| Budget | Target | Rationale |
|---|---|---|
| Steady-state frame rate | $\ge 60$ FPS at 1080p on mid-tier GPU / Iris Xe | Ensures fluid camera flight, orbit animation, and responsive interactions |
| Time to first meaningful paint | $\le 3.0$s on throttled 4x CPU / Fast 3G profile | Prevents bounce rate on visual web demonstration |
| VRAM footprint for galaxy mesh | $< 120$MB | Leaves memory headroom for system renderer, shaders, and textures |
| Production JS bundle (gzipped) | $< 350$KB (excluding catalog JSON) | Keeps initial network transfer lightweight |
| Catalog JSON size | 800KB–2MB | Accommodates 4,600+ systems with full astrometric parameters |
| Search latency | $< 2$ms per keystroke across full catalog | Guarantees zero typing lag or UI freezing |
| Keyboard operability | 100% of interactive controls reachable & operable | Accessible baseline compliance (WCAG 2.1 AA) |

## 6. Browser & Device Support Matrix
- **Tier 1 (Fully Supported)**: Latest two stable versions of Chrome, Edge, Firefox on desktop with WebGL 2.0 support. Full 150,000 particle simulation with perspective-dependent color grading, additive blending, and high-DPI scaling.
- **Tier 2 (Degraded Mode)**: Safari desktop and mobile browsers. Particle budget automatically reduced to 60,000 particles; bloom and additive blending adjusted to preserve $\ge 60$ FPS.
- **Tier 3 (Unsupported Fallback)**: Devices without WebGL 2.0 receive an accessible static fallback screen with mission briefing notes and links to supported browsers, preventing silent black-screen failures.
