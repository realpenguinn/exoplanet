# CosmoScan Physics Assumptions & Mathematical Formulations

This document lists all physical constants, mathematical models, empirical approximations, and fallback boundaries used across CosmoScan.

---

## 1. Coordinate Systems & Galactocentric Geometry
- **Equatorial to Galactocentric Cartesian Coordinates**:
  - Solar Galactocentric Position: $R_0 = 8.18\text{ kpc}$, anchored in the Orion-Cygnus Spur at scaled scene coordinates:
    $$\vec{X}_{\odot} = (25.0, 0.0, 15.0)\text{ Three.js scene units}$$
  - Distance scale: $0.01\text{ units/pc}$ ($100\text{ pc} = 1\text{ scene unit}$).
  - Conversion:
    $$X_{\text{helio}} = d \cdot \cos(\delta) \cdot \cos(\alpha) \cdot 0.01$$
    $$Y_{\text{helio}} = d \cdot \sin(\delta) \cdot 0.01$$
    $$Z_{\text{helio}} = d \cdot \cos(\delta) \cdot \sin(\alpha) \cdot 0.01$$
    $$X_{\text{gal}} = 25.0 + X_{\text{helio}}, \quad Y_{\text{gal}} = Y_{\text{helio}}, \quad Z_{\text{gal}} = 15.0 + Z_{\text{helio}}$$

---

## 2. Stellar Physics & Derivations
- **Mass-Radius Power Law**:
  - In NASA Exoplanet Archive exports without direct radial-velocity mass solutions, stellar mass is derived via the standard main-sequence mass-radius relation:
    $$M_* / M_\odot = (R_* / R_\odot)^{1.2}$$
- **Stefan-Boltzmann Stellar Luminosity**:
  $$L_* / L_\odot = (R_* / R_\odot)^2 \cdot \left(\frac{T_{\text{eff}}}{5778\text{ K}}\right)^4$$
- **Color Temperature Approximations**:
  - Conversion from $T_{\text{eff}}$ in Kelvin to RGB hex colors follows the Tanner-Helland analytic Planckian locus fit.
- **Spectral Types**:
  - $T \ge 30,000\text{ K} \to \text{O}$
  - $10,000\text{ K} \le T < 30,000\text{ K} \to \text{B}$
  - $7,500\text{ K} \le T < 10,000\text{ K} \to \text{A}$
  - $6,000\text{ K} \le T < 7,500\text{ K} \to \text{F}$
  - $5,200\text{ K} \le T < 6,000\text{ K} \to \text{G}$
  - $3,700\text{ K} \le T < 5,200\text{ K} \to \text{K}$
  - $T < 3,700\text{ K} \to \text{M}$

---

## 3. Planetary Orbital Mechanics
- **Kepler's Third Harmonic Law**:
  $$a = \left[ \left(\frac{P}{365.256\text{ days}}\right)^2 \cdot \left(\frac{M_*}{M_\odot}\right) \right]^{1/3}\text{ AU}$$
- **Circumstellar Habitable Zone (Kopparapu et al. 2013)**:
  $$r_{\text{inner}} = \sqrt{\frac{L_*}{1.1}}\text{ AU}, \quad r_{\text{outer}} = \sqrt{\frac{L_*}{0.53}}\text{ AU}$$
- **Planetary Equilibrium Temperature ($T_{\text{eq}}$)**:
  - Assumes a standard Bond albedo of $A_B = 0.30$ and complete atmospheric thermal redistribution:
    $$T_{\text{eq}} = T_{\text{eff}} \cdot \sqrt{\frac{R_*}{2a}} \cdot (1 - A_B)^{1/4}$$
    where $a$ is expressed in stellar radii ($a_{\text{solar}} = a_{\text{AU}} \cdot 215.032$).

---

## 4. Photometric Transit & Limb Darkening (Mandel & Agol 2002)
- **Primary Transit Depth**:
  $$\Delta F = \left(\frac{R_p}{R_*}\right)^2 = \left(\frac{R_p [R_\oplus] \times 6371.0\text{ km}}{R_* [R_\odot] \times 696340.0\text{ km}}\right)^2 \times 100\%$$
  *Data Grounding Note*: In `exoplanet_catalog.json`, `pl_trandep` is null in ~84% of systems. The theoretical $(R_p/R_*)^2$ dip is treated as the primary computational path, with archival `pl_trandep` acting as an empirical override when available.
- **Limb Darkening Model**:
  - Quadratic limb darkening law:
    $$\frac{I(\mu)}{I(1)} = 1 - u_1(1 - \mu) - u_2(1 - \mu)^2, \quad \mu = \sqrt{1 - (r/R_*)^2}$$
  - Coefficients: $u_1 = 0.40, u_2 = 0.25$ (valid for solar-type G/K dwarfs; progressive divergence for M-dwarfs and giants is a documented simplification).
- **Transit Duration**:
  $$T_{\text{dur}} = \frac{P \times 24}{\pi} \arcsin\left(\frac{R_* \times 0.00465}{a}\right)\text{ hours}$$

---

## 5. Astrobiological Verdict Heuristics
- **Classification Categories**:
  - `TERRESTRIAL_HABITABLE`: $R_p \le 1.6\ R_\oplus$ and $200\text{ K} \le T_{\text{eq}} \le 315\text{ K}$.
  - `SUPER_EARTH`: $1.6 < R_p \le 2.5\ R_\oplus$ and $180\text{ K} \le T_{\text{eq}} \le 340\text{ K}$.
  - `HOT_JUPITER`: $R_p \ge 6.0\ R_\oplus$ and $a \le 0.1\text{ AU}$.
  - `MINI_NEPTUNE`: $2.0 < R_p < 6.0\ R_\oplus$ (volatile envelope over core).
  - `HOSTILE_STELLAR_FURNACE`: Planets with extreme stellar flux ($S_{\text{rel}} \gg 1$) or $T_{\text{eq}} > 350\text{ K}$.
- **Atmospheric Scale Height**:
  $$H = \frac{T_{\text{eq}}}{g_{\text{rel}}} \times 0.12\text{ km}$$
