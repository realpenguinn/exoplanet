# CosmoScan Manual Accessibility (A11y) Verification Pass

This document details the screen-reader walkthrough and keyboard navigation audit conducted for CosmoScan in accordance with WCAG 2.1 AA criteria.

---

## 1. Automated Scan Results
- **Engine**: axe-core / Playwright accessibility scanner.
- **Scope**: Loaded HUD, 3D WebGL viewport, search autocomplete dropdown, telemetry cards, and verdict panel.
- **Critical / Serious Violations**: **0**.

---

## 2. Screen-Reader Checklist (VoiceOver / NVDA)

### Item 1: Search Autocomplete Combobox
- **Behavior**: Focused via `Tab` key from top of document.
- **Announcement**: `"Search 4,600+ exoplanets..., combobox, collapsed"`.
- **Typing**: When characters are typed (e.g. `"Kepler"`), `aria-expanded` updates to `true`.
- **Navigation**: Arrow down / tab navigates through `search-item` options with `role="option"`. Pressing `Enter` or `Space` selects target, closes listbox, and announces target selection.

### Item 2: Real-Time Transit Telemetry (`aria-live="polite"`)
- **Behavior**: When a planet revolves across the stellar disk, `#liveFluxAnnouncement` (`aria-live="polite"`) dynamically receives state changes without flooding the user every frame:
  - *Ingress*: `"Transit in progress for Kepler-186 f: flux dip 0.050%"`.
  - *Egress*: `"Transit egress complete for Kepler-186 f: starlight normalized"`.
- **Verdict**: Non-chatty, audible, and provides full parity with the visual 2D canvas curve.

### Item 3: Astrobiological Verdict & Telemetry Reading Order
- **Behavior**: Tab and virtual cursor navigate systematically through the right-hand panel:
  1. Host star name and stellar parameters (temperature, radius, distance).
  2. Exoplanet designation, semi-major axis, orbital period, planetary radius, and density.
  3. Astrobiological verdict headline (e.g., `"Likely Habitable Rocky World"`).
  4. Plain-language description.
  5. Methodology disclosure reference.
- **Verdict**: Semantic hierarchy ($H1 \to H2 \to H3$) and ARIA landmarks (`banner`, `main`, `contentinfo`) provide clean, predictable navigation.
