# CosmoScan — Exoplanet Data Analyzer & 3D Milky Way Suite

CosmoScan is a high-performance astronomical visualization platform and exoplanet transit analyzer. Powered by real data cross-matched from the **NASA Exoplanet Archive** and the **ESA Gaia DR3** catalog, CosmoScan simulates 150,000 Milky Way stars, animates Keplerian exoplanet systems in 3D, streams real-time Mandel-Agol transit light curves, and classifies planetary habitability using transparent astrobiological heuristics.

---

## 🌟 Key Architecture & Capabilities

- **150,000 Particle Milky Way Simulation**: Dynamic differential galactic rotation, perspective-dependent color grading, dust-lane extinction darkening, and warm core bloom running on custom GLSL shaders.
- **60 FPS High-Performance Engine**: Sustained 60 FPS animation loop with a zero-allocation `MathPool` architecture, device pixel ratio clamping ($\le 2.0$), and a 160-point circular ring buffer rendering in $< 1.5$ms.
- **Data-Grounded Scientific Accuracy**: 4,606 indexed exoplanet systems with decoded Gaia DR3 astrometry (VOTable `BINARY2` parser with per-row null bitmasks), power-law stellar mass derivations ($M_* = R_*^{1.2}$), and Mandel-Agol quadratic limb-darkening occultation curves.
- **Automated Astrobiological Verdict Engine**: Transparent planetary classification (Terrestrial Habitable, Super-Earth, Hot Jupiter, Mini-Neptune) grounded in Kopparapu (2013) habitable zone flux bounds, Weiss & Marcy (2014) bulk density models, and Fulton (2017) radius valley analysis.
- **Sub-2ms Spatial Search**: Instantaneous client-side indexed search across 4,600+ exoplanets and host stars.
- **Accessible & Compliant (WCAG 2.1 AA)**: Full keyboard combobox navigation, screen reader `aria-live` non-visual photometric transit audio streaming, and high-contrast color tokens.

---

## 🚀 Quickstart

### Prerequisites
- Node.js 20+
- pnpm 9+ or 10+
- Python 3.10+ (for optional raw VOTable reprocessing)

### Local Development
```bash
# Clone the repository
git clone https://github.com/realpenguinn/exoplanet.git
cd exoplanet

# Install dependencies
pnpm install

# Start local dev server (default http://localhost:5173)
pnpm dev
```

### Production Build & Size Audit
```bash
# Type check and lint
pnpm typecheck
pnpm lint

# Run all 39 unit, integration, scientific, and a11y tests
pnpm test

# Verify production bundle against < 350KB budget
pnpm build
pnpm audit:size
```

### Docker Deployment
```bash
docker build -t cosmoscan-suite:latest .
docker run -p 8080:80 cosmoscan-suite:latest
```

---

## 📖 Architecture & Reference Documentation

- [Product Requirements Document (PRD)](file:///c:/Users/realr/OneDrive/Desktop/Exoplanet/docs/PRD.md)
- [Scientific & Physical Assumptions](file:///c:/Users/realr/OneDrive/Desktop/Exoplanet/docs/PHYSICS_ASSUMPTIONS.md)
- [Data Governance & Attribution Policy](file:///c:/Users/realr/OneDrive/Desktop/Exoplanet/docs/DATA_POLICY.md)
- [Operational Runbook & Recovery Procedures](file:///c:/Users/realr/OneDrive/Desktop/Exoplanet/docs/RUNBOOK.md)
- [Risk Register & Mitigation Strategy](file:///c:/Users/realr/OneDrive/Desktop/Exoplanet/docs/RISK_REGISTER.md)
- [Accessibility Manual Verification Pass](file:///c:/Users/realr/OneDrive/Desktop/Exoplanet/docs/A11Y_MANUAL_PASS.md)
- [Architecture Decision Records (ADRs)](file:///c:/Users/realr/OneDrive/Desktop/Exoplanet/docs/adr/README.md)

---

## 📜 Scientific Attribution

- **NASA Exoplanet Archive**: Data courtesy of the NASA Exoplanet Archive, operated by the California Institute of Technology under contract with the National Aeronautics and Space Administration under the Exoplanet Exploration Program.
- **ESA Gaia DR3**: Astrometric cross-matching relies on data from the European Space Agency (ESA) mission Gaia (https://www.cosmos.esa.int/gaia), processed by the Gaia Data Processing and Analysis Consortium (DPAC).
