# EXOPLANET TRANSIT PHOTOMETRY & HABITABLE WORLD ANALYZER
## School Science Fair Complete Project Report & Presentation Guide

---

### Project Information
- **Project Title**: Detecting and Characterizing Alien Worlds via NASA Transit Photometry and Orbital Physics
- **Subject Category**: Physics, Computational Astronomy & Space Science
- **Grade Level**: Middle School / High School Level

---

## 1. Project Abstract
Over 5,500 exoplanets have been discovered beyond our Solar System, with more than 70% detected using the **Transit Photometry Method**. Because distant planets are too faint to image directly, space telescopes like NASA's Kepler and TESS measure periodic, microscopic dips in stellar brightness as planets cross their host stars. 

In this project, we built a computational astrophysics analyzer and interactive simulation suite. By modeling light curve dips, applying **Kepler’s Third Law of Planetary Motion**, and using **Kopparapu Habitable Zone Stellar Flux Models**, our software calculates planetary radius ($R_p$), semi-major axis ($a$), equilibrium temperature ($T_{eq}$), and Earth Similarity Index (ESI) across five real NASA exoplanet systems (Kepler-452b, TRAPPIST-1e, Kepler-22b, TOI-700 d, and WASP-12b) as well as custom user-defined systems.

---

## 2. Scientific Problem Statement & Hypothesis

### Problem Statement:
How can astronomers determine the size, orbit, temperature, and potential habitability of an exoplanet hundreds of light-years away when optical telescopes cannot photograph its surface?

### Hypothesis:
If high-precision time-series photometry records the fractional depth ($\delta$) and duration of a stellar brightness dip during a transit event, then applying the geometric ratio $\delta = (R_p / R_*)^2$ alongside Kepler's Third Law will allow us to accurately calculate the planet’s physical radius, distance from its star, and surface temperature to determine whether it can sustain liquid water.

---

## 3. Mathematical Principles & Physics Derivations

### A. Transit Depth & Planetary Radius
When an opaque spherical planet of radius $R_p$ crosses in front of a host star of radius $R_*$, the fractional decrease in flux is proportional to the area occulted:

$$\delta = \frac{\Delta F}{F_0} = \frac{\pi R_p^2}{\pi R_*^2} = \left(\frac{R_p}{R_*}\right)^2$$

Solving for the exoplanet radius:

$$R_p = R_* \cdot \sqrt{\delta}$$

*Example*: For Kepler-452b orbiting a star with $R_* = 1.11 R_\odot$, an observed dip of $\delta \approx 1,285\text{ ppm}$ yields $R_p \approx 1.63 R_\oplus$ (a Super-Earth).

---

### B. Kepler's Third Law (Harmonic Law)
The orbital period $P$ (time between consecutive transit events) relates directly to the orbital semi-major axis $a$ and host star mass $M_*$:

$$P^2 = \frac{4\pi^2}{G M_*} a^3 \implies a = \left(\frac{G M_* P^2}{4\pi^2}\right)^{1/3}$$

In Solar System units ($P$ in years, $M_*$ in Solar masses $M_\odot$, $a$ in AU):

$$a \approx \sqrt[3]{M_* \cdot P^2}$$

---

### C. Planetary Equilibrium Temperature ($T_{eq}$)
Assuming radiative equilibrium where absorbed stellar radiation equals emitted thermal radiation:

$$L_{\text{absorbed}} = \pi R_p^2 \cdot (1 - A) \cdot \frac{L_*}{4\pi a^2}$$
$$L_{\text{emitted}} = 4\pi R_p^2 \cdot \sigma T_{eq}^4$$

Equating both terms gives:

$$T_{eq} = T_* \cdot (1 - A)^{1/4} \cdot \sqrt{\frac{R_*}{2a}}$$

Where:
- $T_*$: Host star effective temperature (Kelvin)
- $A$: Bond albedo (reflectivity $\approx 0.30$ for Earth-like planets)
- $R_*$: Stellar radius
- $a$: Distance from star

---

### D. Habitable (Goldilocks) Zone Evaluation
We utilized the **Kopparapu et al. (2013)** atmospheric climate model:
- **Inner Edge (Runaway Greenhouse)**: Liquid oceans boil away into steam ($S_{\text{eff}} \approx 1.04$).
- **Outer Edge (Maximum Greenhouse)**: $CO_2$ clouds condense, leading to irreversible global glaciation ($S_{\text{eff}} \approx 0.35$).
- **Conservative Goldilocks Zone**: $0.35 \le S_{\text{eff}} \le 1.04$ Solar Flux units.

---

## 4. Summary Results Table

| Exoplanet System | Host Star Type | Orbital Period | Planet Radius | Transit Depth | Surface Temp ($T_{eq}$) | ESI Score | Scientific Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Kepler-452b** | G2V (Sun-like) | 384.8 days | 1.63 $R_\oplus$ | 1,285 ppm | 265 K (-8°C) | **0.84** | Optimistic Habitable Zone |
| **TRAPPIST-1e** | M8V (Red Dwarf) | 6.1 days | 0.92 $R_\oplus$ | 4,839 ppm | 246 K (-27°C) | **0.86** | Conservative Habitable Zone |
| **TOI-700 d** | M2V (Red Dwarf) | 37.4 days | 1.14 $R_\oplus$ | 632 ppm | 269 K (-4°C) | **0.88** | Conservative Habitable Zone |
| **Kepler-22b** | G5V (Yellow Dwarf) | 289.9 days | 2.38 $R_\oplus$ | 494 ppm | 262 K (-11°C) | **0.70** | Water World / Sub-Neptune |
| **WASP-12b** | F-Type Star | 1.09 days | 19.4 $R_\oplus$ | 11,433 ppm | 2,580 K (+2307°C) | **0.05** | Ultra-Hot Jupiter Gas Giant |

---

## 5. Judge Presentation Speaking Script

### 1. Opening Hook (0:00 - 0:30)
> *"Hello respected judges! My project is the **Exoplanet Data Analyzer**. Over 5,000 planets have been discovered beyond our Solar System, but because they are trillions of miles away, we can't take direct pictures of them. My project demonstrates how astronomers use **Transit Photometry**—measuring tiny dips in starlight—to calculate a planet’s size, distance, and whether it could support liquid water and life."*

### 2. Live Interactive Demonstration (0:30 - 1:15)
> *"Here on the dashboard, you can see our real-time simulator:
> - On the right is the **3D orbital view** showing Kepler-452b crossing its star.
> - On the left is the **Light Curve Photometer**. Notice how the exact moment the planet enters the star's disc (**Ingress**), the brightness drops by **1,285 parts per million** (0.138%).
> - When the planet exits (**Egress**), the brightness returns to 100%."*

### 3. Mathematics & Habitability Analysis (1:15 - 2:00)
> *"From that tiny dip, our software applies the geometric formula $R_p = R_* \sqrt{\delta}$ to find that Kepler-452b is 1.63 times the radius of Earth.
> Next, using **Kepler's Third Law**, we calculate its distance at 1.05 AU with a 384-day year.
> Finally, our **Habitable Zone Gauge** computes an equilibrium temperature of 265 Kelvin (-8°C), placing it right inside the 'Goldilocks Zone' with an Earth Similarity Index of 0.84."*

### 4. Interactive Judge Sandbox (2:00 - 2:30)
> *"Judges, you can test custom systems in our sandbox! If we drag this slider to move the planet closer or make the star hotter, you can see how the equilibrium temperature shoots up into the red zone and the light curve changes instantly."*

---

## 6. Likely Judge Questions & Answers

**Q1: Why do different stars have different Habitable Zone distances?**
> *Answer:* Hotter, brighter stars (like F or A type) emit much more radiation, pushing the habitable zone further out (several AU). Cool red dwarf stars (M-dwarf) emit less energy, so planets must orbit very close (e.g., 0.03 AU like TRAPPIST-1e) to stay warm enough for liquid water.

**Q2: What is limb darkening and why does it affect the light curve?**
> *Answer:* Stars appear brighter in the center and dimmer near their outer edges (limbs) because we see cooler, higher atmospheric layers near the edge. This causes the bottom of real transit light curves to have a subtle curve rather than a perfectly flat box.

**Q3: Can a planet be inside the habitable zone but still uninhabitable?**
> *Answer:* Yes! If a planet is too massive (like a gas giant), it will lack a solid surface. Furthermore, M-dwarf stars often produce severe coronal mass ejections and ultraviolet flares that can strip a planet's atmosphere, and close-in planets can be tidally locked.

---

## 7. How to Run the Project on Your Computer

### Option A: Interactive Web Dashboard (Recommended for Presentation)
Double click `index.html` or open it in any web browser (Chrome, Edge, Firefox). You can also run a simple local web server:
```powershell
python -m http.server 8000
```
Then navigate to `http://localhost:8000`.

### Option B: Standalone Python Scientific Analyzer
Run the Python script in your terminal to see the telemetry table and generate the 4-panel science chart:
```powershell
python analyzer.py
```
This will generate `exoplanet_analysis_charts.png`.

### Option C: Standalone Pygame 3D Visualizer
Run the Pygame simulation:
```powershell
python xxx.py
```
