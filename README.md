# 🪐 Exoplanet Data Analyzer & Habitable World Classifier (Pro Edition)

> **NASA Kepler & TESS Transit Photometry • JWST NIRSpec Atmospheric Spectroscopy • Habitable Zone Analyzer**

A state-of-the-art computational astrophysics research suite and interactive simulation engine designed for high-precision exoplanet characterization and science fair exhibitions.

---

## 🌟 Key Scientific Capabilities

1. **🔬 High-Precision Real-Time Transit Photometer**:
   - Implements the analytical **Mandel & Agol (2002)** light curve model with quadratic stellar limb darkening ($I(\mu) = 1 - u_1(1-\mu) - u_2(1-\mu)^2$).
   - Contact points detection ($t_1, t_2, t_3, t_4$) for ingress and egress phases.
   - Multi-wavelength optical ($V$-band), infrared (JWST), and ultraviolet Rayleigh scattering filters.

2. **🪐 Draggable 3D Orbit & Transit Geometry Simulator**:
   - Interactive line-of-sight perspective matching space telescope observations.
   - Live drag-to-tilt inclination physics ($90^\circ \to 80^\circ$) to explore grazing vs. full transits.
   - Top-down Circumstellar Habitable Zone orbit projections.

3. **🔭 JWST Atmospheric Transmission Spectroscopy**:
   - Simulates infrared molecular absorption spectra for **Water Vapor ($\text{H}_2\text{O}$ at 1.4µm & 2.7µm)**, **Carbon Dioxide ($\text{CO}_2$ at 4.3µm)**, and **Methane ($\text{CH}_4$ at 3.3µm)**.

4. **🌍 Astrobiological Habitability & Biosignature Dossier**:
   - **Kopparapu et al. (2013)** multi-layer habitable zone climate equations.
   - **Schulze-Makuch (2011)** Earth Similarity Index (ESI) calculation.
   - Procedural 3D rotating planetary globe with atmospheric glow, dynamic cloud layers, and daytime/nighttime shadow terminators.
   - Official Gold Science Fair Certification Seal and 1-page printable executive brief.

5. **🔊 Sci-Fi Web Audio API Telemetry Synthesizer**:
   - Real-time auditory telemetry cues on transit ingress, egress, and biosignature scans.

---

## 📁 Repository Structure

```
├── index.html                  # Master Interactive Web Observatory Dashboard
├── style.css                   # Space Observatory Design System & Glassmorphism
├── app.js                      # 60 FPS Physics Engine, 3D Canvas Globe, Web Audio
├── run.py                      # 1-Click Master Project Launcher
├── analyzer.py                 # Python Data Science Pipeline & 4-Panel Research Plots
├── xxx.py                      # Desktop 60 FPS Pygame Orbital Simulation
├── SCIENCE_FAIR_GUIDE.md       # Complete Project Report, Hypothesis, & Judge Q&A
├── exoplanet_analysis_charts.png # Publication-Grade 4-Panel Scientific Figure
└── README.md                   # Project Documentation
```

---

## 🚀 How to Run Locally

### 1. Launch the Web Observatory:
Open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari).

### 2. Run the 1-Click Master Python Launcher:
```bash
python run.py
```

### 3. Run the Python Astrophysics Pipeline:
```bash
python analyzer.py
```

### 4. Run the Pygame Desktop Simulator:
```bash
python xxx.py
```

---

## 📐 Mathematical Physics Formulations

- **Transit Depth Formula**:
  $$\delta = \frac{\Delta F}{F} = \left(\frac{R_p}{R_*}\right)^2 \implies R_p = R_* \sqrt{\delta}$$

- **Kepler's Third Harmonic Law**:
  $$a = \sqrt[3]{M_* \cdot P^2} \quad (\text{in AU, } M_\odot, \text{ years})$$

- **Stellar Insolation**:
  $$S_{\text{eff}} = \left(\frac{R_*}{R_\odot}\right)^2 \left(\frac{T_*}{T_\odot}\right)^4 \frac{1}{a^2}$$

- **Equilibrium Temperature ($T_{eq}$)**:
  $$T_{eq} = T_* (1 - A)^{1/4} \sqrt{\frac{R_*}{2a}}$$

---

## 🏆 Science Fair Presentation Script (30-Second Pitch)

> *"Over 70% of all 5,500+ exoplanets were discovered using transit photometry. When an alien planet passes in front of its star, it blocks a microscopic fraction of starlight. Our software analyzes this light curve dip and applies Kepler's Third Law to determine the planet's radius, orbital distance, surface temperature, and atmospheric water vapor potential."*
