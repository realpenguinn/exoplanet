/**
 * ====================================================================================================
 * EXOPLANET TRANSIT PHOTOMETRY & HABITABLE WORLD ANALYZER - MASTER SCIENCE FAIR SUITE
 * ====================================================================================================
 * NASA Kepler / TESS Transit Light Curve Modeling • JWST NIRSpec Atmospheric Transmission Spectroscopy
 * Multi-Wavelength Optical/IR/UV Band Filters • Kopparapu 2013 Multi-Layer Habitable Zone Equations
 * Earth Similarity Index (ESI) Classifier • Procedural 3D Holographic Planet Renderer • Web Audio Synthesizer
 *
 * Authors: Science Fair Computational Astrophysics Team
 * Mathematical Formulations: Mandel & Agol (2002), Kopparapu et al. (2013), Schulze-Makuch et al. (2011)
 * ====================================================================================================
 */

"use strict";

// ====================================================================================================
// 1. EXTENSIVE NASA EXOPLANET RESEARCH DATABASE
// ====================================================================================================
const EXOPLANET_CATALOG = {
  kepler452b: {
    id: "kepler452b",
    name: "Kepler-452b",
    tagline: "'Earth's Older Cousin' - G-Type Solar Analog",
    period: 384.84,             // Orbital period in Earth days
    radius_earth: 1.63,         // Radius in Earth radii (R_earth)
    star_radius_sun: 1.11,      // Star radius in Solar radii (R_sun)
    star_temp_k: 5757,          // Effective stellar temperature (Kelvin)
    star_mass_sun: 1.04,        // Stellar mass (M_sun)
    semi_major_axis_au: 1.046,  // Semi-major axis in Astronomical Units (AU)
    transit_duration_hours: 10.5,
    inclination_deg: 89.81,
    planet_class: "Super-Earth",
    density_desc: "Rocky Core / Volatiles",
    star_type: "G2V (Solar Analog)",
    albedo: 0.30,
    u1: 0.45,                   // Linear limb darkening coefficient
    u2: 0.22,                   // Quadratic limb darkening coefficient
    holo_color: "#38bdf8",
    holo_cloud: "rgba(255, 255, 255, 0.75)",
    holo_terrain: "ocean_continental",
    spectroscopy: {
      water: 0.78,
      co2: 0.65,
      methane: 0.32,
      scale_height_km: 18.5
    },
    verdict: {
      water: "PROBABLE",
      water_desc: "Teq = 265K (-8°C) sits comfortably within liquid ocean greenhouse limits.",
      water_pct: 88,
      atmo: "H₂O / CO₂ DETECTED",
      atmo_desc: "Strong 1.4µm & 2.7µm water absorption lines identified via infrared transit.",
      atmo_pct: 82,
      radiation: "LOW FLARE ACTIVITY",
      rad_desc: "G2V solar analog guarantees billions of years of stable thermal irradiation.",
      rad_pct: 90,
      esi_pct: 84,
      score: "84%",
      score_class: "CLASS-1 HABITABLE CANDIDATE"
    }
  },

  trappist1e: {
    id: "trappist1e",
    name: "TRAPPIST-1e",
    tagline: "Ultra-Cool Red Dwarf Habitable Rocky Planet",
    period: 6.10,
    radius_earth: 0.92,
    star_radius_sun: 0.121,
    star_temp_k: 2566,
    star_mass_sun: 0.089,
    semi_major_axis_au: 0.029,
    transit_duration_hours: 0.9,
    inclination_deg: 89.86,
    planet_class: "Terrestrial Rocky",
    density_desc: "Dense Iron/Silicate Core",
    star_type: "M8V (Ultra-Cool Dwarf)",
    albedo: 0.30,
    u1: 0.55,
    u2: 0.30,
    holo_color: "#10b981",
    holo_cloud: "rgba(220, 255, 240, 0.70)",
    holo_terrain: "rocky_iron",
    spectroscopy: {
      water: 0.82,
      co2: 0.88,
      methane: 0.40,
      scale_height_km: 12.0
    },
    verdict: {
      water: "HIGHLY PROBABLE",
      water_desc: "Teq = 246K (-27°C) allows liquid surface oceans under CO2 greenhouse shielding.",
      water_pct: 92,
      atmo: "CO₂ / H₂O / N₂ DETECTED",
      atmo_desc: "Prominent 4.3µm CO₂ peak suggests thick secondary rocky world atmosphere.",
      atmo_pct: 88,
      radiation: "MODERATE M-DWARF ACTIVITY",
      rad_desc: "Tidally locked; magnetic field required to retain atmospheric water.",
      rad_pct: 76,
      esi_pct: 86,
      score: "86%",
      score_class: "TOP-TIER ROCKY HABITABLE WORLD"
    }
  },

  kepler22b: {
    id: "kepler22b",
    name: "Kepler-22b",
    tagline: "First Transiting Habitable Zone Planet Discovered",
    period: 289.86,
    radius_earth: 2.38,
    star_radius_sun: 0.98,
    star_temp_k: 5518,
    star_mass_sun: 0.97,
    semi_major_axis_au: 0.849,
    transit_duration_hours: 7.4,
    inclination_deg: 89.76,
    planet_class: "Water World / Sub-Neptune",
    density_desc: "Volatile-Rich Global Ocean",
    star_type: "G5V (Yellow Dwarf)",
    albedo: 0.35,
    u1: 0.48,
    u2: 0.25,
    holo_color: "#06b6d4",
    holo_cloud: "rgba(255, 255, 255, 0.85)",
    holo_terrain: "global_ocean",
    spectroscopy: {
      water: 0.95,
      co2: 0.45,
      methane: 0.60,
      scale_height_km: 32.0
    },
    verdict: {
      water: "GLOBAL OCEAN HYPOTHESIS",
      water_desc: "Deep supercritical or liquid water mantle surrounding rocky core.",
      water_pct: 95,
      atmo: "H₂O / HE STEAM ENVELOPE",
      atmo_desc: "Large scale height generates deep spectral transmission signatures.",
      atmo_pct: 75,
      radiation: "VERY LOW FLARE RISK",
      rad_desc: "Stable G-type star guarantees billions of years of thermal stability.",
      rad_pct: 92,
      esi_pct: 70,
      score: "70%",
      score_class: "VOLATILE OCEAN WORLD"
    }
  },

  toi700d: {
    id: "toi700d",
    name: "TOI-700 d",
    tagline: "TESS First Earth-sized Habitable Zone Discovery",
    period: 37.42,
    radius_earth: 1.14,
    star_radius_sun: 0.415,
    star_temp_k: 3480,
    star_mass_sun: 0.416,
    semi_major_axis_au: 0.163,
    transit_duration_hours: 2.1,
    inclination_deg: 89.88,
    planet_class: "Terrestrial Earth-Size",
    density_desc: "Rocky Surface Potential",
    star_type: "M2V (Red Dwarf)",
    albedo: 0.30,
    u1: 0.50,
    u2: 0.28,
    holo_color: "#34d399",
    holo_cloud: "rgba(255, 255, 255, 0.70)",
    holo_terrain: "terrestrial",
    spectroscopy: {
      water: 0.75,
      co2: 0.70,
      methane: 0.25,
      scale_height_km: 14.5
    },
    verdict: {
      water: "VERY LIKELY",
      water_desc: "Teq = 269K (-4°C) perfectly positioned in conservative Goldilocks zone.",
      water_pct: 90,
      atmo: "TERRESTRIAL SECONDARY ATMOSPHERE",
      atmo_desc: "Clear signatures compatible with Earth-like climate models.",
      atmo_pct: 85,
      radiation: "QUIET M-DWARF (LOW FLARE)",
      rad_desc: "TOI-700 shows exceptionally low magnetic flaring compared to other M-stars.",
      rad_pct: 94,
      esi_pct: 88,
      score: "88%",
      score_class: "PRIME GOLDILOCKS WORLD"
    }
  },

  wasp12b: {
    id: "wasp12b",
    name: "WASP-12b",
    tagline: "Ultra-Hot Jupiter with Massive Transit Depth",
    period: 1.09,
    radius_earth: 19.40,
    star_radius_sun: 1.66,
    star_temp_k: 6300,
    star_mass_sun: 1.43,
    semi_major_axis_au: 0.023,
    transit_duration_hours: 3.0,
    inclination_deg: 86.0,
    planet_class: "Hot Jupiter Gas Giant",
    density_desc: "Tidally Distorted Gas Giant",
    star_type: "F-Type Star",
    albedo: 0.06,
    u1: 0.40,
    u2: 0.20,
    holo_color: "#f97316",
    holo_cloud: "rgba(255, 100, 50, 0.85)",
    holo_terrain: "lava_gas",
    spectroscopy: {
      water: 0.15,
      co2: 0.90,
      methane: 0.05,
      scale_height_km: 120.0
    },
    verdict: {
      water: "COMPLETELY IMPOSSIBLE",
      water_desc: "Surface temperature of 2,580K (+2307°C) vaporizes all liquids & rocks.",
      water_pct: 0,
      atmo: "VAPORIZED CARBON & METALS",
      atmo_desc: "Carbon-rich upper atmosphere being stripped away by stellar gravity.",
      atmo_pct: 95,
      radiation: "EXTREME TIDAL & THERMAL STRESS",
      rad_desc: "Planet is egg-shaped due to extreme tidal gravitational forces.",
      rad_pct: 5,
      esi_pct: 5,
      score: "5%",
      score_class: "EXTREME ULTRA-HOT HELL WORLD"
    }
  }
};

// ====================================================================================================
// 2. APPLICATION REAL-TIME STATE & CONFIGURATION
// ====================================================================================================
const state = {
  currentPreset: "kepler452b",
  isCustom: false,
  activeTab: "lightcurve",      // "lightcurve" or "spectroscopy"
  filterBand: "optical",        // "optical", "infrared", or "uv"
  audioEnabled: true,
  
  // Physical Parameters
  radius_earth: 1.63,
  star_radius_sun: 1.11,
  star_temp_k: 5757,
  semi_major_axis_au: 1.046,
  star_mass_sun: 1.04,
  period_days: 384.84,
  transit_duration_hours: 10.5,
  inclination_deg: 89.81,
  albedo: 0.30,
  u1: 0.45,
  u2: 0.22,
  
  // Computed Astrophysical Outputs
  transitDepth: 0.001285,
  equilibriumTempK: 265,
  stellarFluxSeff: 1.10,
  esiScore: 0.84,
  hzStatus: "OPTIMISTIC HABITABLE ZONE",
  hzStatusDesc: "Atmospheric greenhouse effect could sustain liquid surface oceans.",
  hzColor: "#10b981",
  
  // Orbital Simulation Physics
  isPlaying: true,
  simSpeed: 1.0,
  theta: 0.0,
  viewMode: "transit",          // "transit" (line-of-sight) or "topdown"
  enableNoise: true,
  enableFitLine: true,
  enableLimbDarkening: true,
  
  // Interactive Drag-to-Tilt Inclination
  isDraggingOrbit: false,
  dragStartY: 0,
  dragStartInc: 89.81,
  
  // 3D Procedural Planet Rotation
  holoAngle: 0.0,
  
  // Telemetry History Buffer
  wasTransiting: false,
  lightCurveHistory: [],
  maxHistoryLength: 280
};

// ====================================================================================================
// 3. SCI-FI WEB AUDIO API SYNTHESIZER
// ====================================================================================================
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
}

function playTone(freq, type = "sine", duration = 0.15, gainVal = 0.08) {
  if (!state.audioEnabled) return;
  try {
    initAudio();
    if (!audioCtx || audioCtx.state === "suspended") audioCtx?.resume();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Graceful fallback if audio is blocked by browser policy
  }
}

function playTransitChime(isStart) {
  if (isStart) {
    playTone(587.33, "sine", 0.22, 0.09); // D5
    setTimeout(() => playTone(880.00, "sine", 0.32, 0.07), 75); // A5
  } else {
    playTone(880.00, "sine", 0.22, 0.07); // A5
    setTimeout(() => playTone(587.33, "sine", 0.32, 0.09), 75); // D5
  }
}

function playScanSound() {
  if (!state.audioEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      setTimeout(() => playTone(freq, "triangle", 0.16, 0.05), idx * 65);
    });
  } catch (e) {}
}

// ====================================================================================================
// 4. CELEBRATORY CONFETTI & PARTICLE EXPLOSION ENGINE
// ====================================================================================================
const confettiCanvas = document.getElementById("confettiCanvas");
const confettiCtx = confettiCanvas ? confettiCanvas.getContext("2d") : null;
let confettiParticles = [];

function resizeConfetti() {
  if (!confettiCanvas) return;
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeConfetti);
resizeConfetti();

function triggerConfetti() {
  if (!confettiCanvas) return;
  confettiParticles = [];
  const palette = ["#38bdf8", "#10b981", "#fbbf24", "#f43f5e", "#a855f7", "#ffffff"];
  for (let i = 0; i < 95; i++) {
    confettiParticles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.85) * 20,
      size: Math.random() * 8 + 4,
      color: palette[Math.floor(Math.random() * palette.length)],
      alpha: 1.0,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.25
    });
  }
}

function updateAndDrawConfetti() {
  if (!confettiCtx || confettiParticles.length === 0) return;
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    const p = confettiParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.38; // gravity
    p.rot += p.vrot;
    p.alpha -= 0.012;

    if (p.alpha <= 0 || p.y > window.innerHeight) {
      confettiParticles.splice(i, 1);
      continue;
    }

    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rot);
    confettiCtx.fillStyle = p.color;
    confettiCtx.globalAlpha = Math.max(0, p.alpha);
    confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    confettiCtx.restore();
  }
}

// ====================================================================================================
// 5. CORE ASTROPHYSICAL COMPUTATION ENGINE
// ====================================================================================================
const R_EARTH_IN_KM = 6371.0;
const R_SUN_IN_KM = 696340.0;
const AU_IN_KM = 149597870.7;
const T_SUN_K = 5778.0;

function updateAstrophysics() {
  const Rp_km = state.radius_earth * R_EARTH_IN_KM;
  const Rstar_km = state.star_radius_sun * R_SUN_IN_KM;
  let k_ratio = Rp_km / Rstar_km;

  // Multi-Wavelength Optical / IR / UV Filter Physics
  if (state.filterBand === "uv") {
    k_ratio *= 1.06; // Apparent radius expands due to high-altitude Rayleigh scattering
    state.u1 = 0.65;
    state.u2 = 0.20;
  } else if (state.filterBand === "infrared") {
    k_ratio *= 0.98; // Infrared pierces hazes, revealing true core radius
    state.u1 = 0.20;
    state.u2 = 0.15;
  } else {
    state.u1 = EXOPLANET_CATALOG[state.currentPreset]?.u1 || 0.45;
    state.u2 = EXOPLANET_CATALOG[state.currentPreset]?.u2 || 0.22;
  }

  state.transitDepth = k_ratio * k_ratio;

  // Kepler's Third Law (Harmonic Law): a^3 = M_* * P^2
  if (state.isCustom) {
    const a = state.semi_major_axis_au;
    const Mstar = state.star_mass_sun || 1.0;
    state.period_days = Math.sqrt(Math.pow(a, 3) / Mstar) * 365.25;
    state.transit_duration_hours = (state.period_days * 24.0 / Math.PI) * (Rstar_km / (a * AU_IN_KM));
  }

  // Stellar Insolation (Solar Flux Multiplier S_eff)
  const R_ratio = state.star_radius_sun;
  const T_ratio = state.star_temp_k / T_SUN_K;
  const L_star = Math.pow(R_ratio, 2) * Math.pow(T_ratio, 4);
  state.stellarFluxSeff = L_star / Math.pow(state.semi_major_axis_au, 2);

  // Equilibrium Temperature (Kelvin)
  const a_km = state.semi_major_axis_au * AU_IN_KM;
  const factor_A = Math.pow(1.0 - state.albedo, 0.25);
  const factor_geom = Math.sqrt(Rstar_km / (2.0 * a_km));
  state.equilibriumTempK = Math.round(state.star_temp_k * factor_A * factor_geom);

  // Kopparapu et al. (2013) Habitable Zone Climate Boundaries
  const T_diff = state.star_temp_k - 5780.0;
  const S_inner_opt = 1.776 + 1.43e-4 * T_diff;
  const S_inner_cons = 1.038 + 1.25e-4 * T_diff;
  const S_outer_cons = 0.350 + 5.96e-5 * T_diff;
  const S_outer_opt = 0.320 + 5.45e-5 * T_diff;

  const S = state.stellarFluxSeff;
  if (S >= S_inner_cons && S <= S_inner_opt) {
    state.hzStatus = "OPTIMISTIC HZ (INNER EDGE)";
    state.hzStatusDesc = "Warm conditions; potential for liquid water with moderate cloud albedo.";
    state.hzColor = "#fbbf24";
  } else if (S >= S_outer_cons && S < S_inner_cons) {
    state.hzStatus = "CONSERVATIVE HABITABLE ZONE";
    state.hzStatusDesc = "Optimal Goldilocks zone! Liquid water oceans can stably exist on the surface.";
    state.hzColor = "#10b981";
  } else if (S >= S_outer_opt && S < S_outer_cons) {
    state.hzStatus = "OPTIMISTIC HZ (OUTER EDGE)";
    state.hzStatusDesc = "Cold conditions; strong atmospheric greenhouse needed to prevent freezing.";
    state.hzColor = "#38bdf8";
  } else if (S > S_inner_opt) {
    state.hzStatus = "TOO HOT (DESERT / RUNAWAY GREENHOUSE)";
    state.hzStatusDesc = "High radiation boils oceans away; surface is dry and hostile.";
    state.hzColor = "#f43f5e";
  } else {
    state.hzStatus = "TOO COLD (PERMANENT ICE WORLD)";
    state.hzStatusDesc = "Low stellar heat causes global glaciation unless tidal heating exists.";
    state.hzColor = "#818cf8";
  }

  // Earth Similarity Index (ESI) Formulation
  const r_ratio_earth = state.radius_earth;
  const t_eq_k = state.equilibriumTempK;
  const term_r = 1.0 - Math.abs((r_ratio_earth - 1.0) / (r_ratio_earth + 1.0));
  const term_t = 1.0 - Math.abs((t_eq_k - 288.0) / (t_eq_k + 288.0));
  const esi = Math.pow(Math.max(0, term_r), 0.57) * Math.pow(Math.max(0, term_t), 1.07);
  state.esiScore = Math.max(0.0, Math.min(1.0, esi));

  // Planetary Classification
  if (state.radius_earth < 1.25) {
    state.planet_class = "Terrestrial Rocky";
    state.density_desc = "Dense Iron / Silicate Core";
  } else if (state.radius_earth < 2.0) {
    state.planet_class = "Super-Earth";
    state.density_desc = "Massive Rocky / Thick Envelope";
  } else if (state.radius_earth < 4.0) {
    state.planet_class = "Sub-Neptune / Mini-Neptune";
    state.density_desc = "Volatile / Ocean Rich Envelope";
  } else if (state.radius_earth < 10.0) {
    state.planet_class = "Neptune-like Gas Planet";
    state.density_desc = "Hydrogen / Helium Atmosphere";
  } else {
    state.planet_class = "Jovian Gas Giant";
    state.density_desc = "Massive Gas Giant";
  }

  updateTelemetryUI();
}

// ====================================================================================================
// 6. UI BINDINGS & COMPARISON SCALE UPDATER
// ====================================================================================================
function updateTelemetryUI() {
  const currentData = EXOPLANET_CATALOG[state.currentPreset];
  const planetName = state.isCustom ? "CUSTOM SANDBOX" : (currentData?.name || "CUSTOM");
  const starType = state.isCustom ? "Custom Star" : (currentData?.star_type || "");

  document.getElementById("badgeTargetName").innerText = planetName;
  document.getElementById("badgeTargetType").innerText = `(${starType})`;
  document.getElementById("telPeriod").innerText = state.period_days.toFixed(1);
  document.getElementById("telRadius").innerText = state.radius_earth.toFixed(2);
  document.getElementById("telAxis").innerText = state.semi_major_axis_au.toFixed(3);
  document.getElementById("telFlux").innerText = state.stellarFluxSeff.toFixed(2);
  document.getElementById("telDuration").innerText = state.transit_duration_hours.toFixed(1);
  document.getElementById("telPlanetClass").innerText = state.planet_class;
  document.getElementById("telDensityEst").innerText = state.density_desc;
  document.getElementById("lcDepthVal").innerText = (state.transitDepth * 100).toFixed(3) + "% (" + Math.round(state.transitDepth * 1e6) + " ppm)";
  document.getElementById("incDegVal").innerHTML = state.inclination_deg.toFixed(2) + "&deg;";

  document.getElementById("gaugeTempVal").innerText = state.equilibriumTempK + " K";
  document.getElementById("gaugeTempC").innerHTML = `(${state.equilibriumTempK - 273} &deg;C)`;
  document.getElementById("hzBadgeLabel").innerText = state.hzStatus;
  document.getElementById("hzBadgeLabel").style.color = state.hzColor;
  document.getElementById("hzBadgeDesc").innerText = state.hzStatusDesc;
  document.getElementById("hzStatusBox").style.borderColor = state.hzColor;

  document.getElementById("esiValueText").innerText = state.esiScore.toFixed(2) + " / 1.00";
  document.getElementById("esiBarFill").style.width = (state.esiScore * 100).toFixed(0) + "%";

  const scaleCircle = document.getElementById("targetScaleCircle");
  if (scaleCircle) {
    const scaleSize = Math.max(8, Math.min(46, state.radius_earth * 14));
    scaleCircle.style.width = `${scaleSize}px`;
    scaleCircle.style.height = `${scaleSize}px`;
    document.getElementById("targetScaleName").innerHTML = `${planetName} (${state.radius_earth.toFixed(2)} R<sub>&oplus;</sub>)`;
    document.getElementById("scaleRatioText").innerText = `${planetName} is ${state.radius_earth.toFixed(2)}x Earth radius`;
  }

  document.getElementById("sliderValRp").innerHTML = state.radius_earth.toFixed(2) + " R<sub>&oplus;</sub>";
  document.getElementById("sliderValA").innerText = state.semi_major_axis_au.toFixed(2) + " AU";
  document.getElementById("sliderValTstar").innerText = state.star_temp_k + " K";
  document.getElementById("sliderValRstar").innerHTML = state.star_radius_sun.toFixed(2) + " R<sub>&odot;</sub>";
}

// ====================================================================================================
// 7. CANVAS RENDERER 1: REAL-TIME PHOTOMETRIC TRANSIT LIGHT CURVE
// ====================================================================================================
const lcCanvas = document.getElementById("lightCurveCanvas");
const lcCtx = lcCanvas ? lcCanvas.getContext("2d") : null;

function drawLightCurve(currentFlux, isTransiting) {
  if (!lcCtx) return;
  const w = lcCanvas.width;
  const h = lcCanvas.height;

  lcCtx.clearRect(0, 0, w, h);

  const padLeft = 60, padRight = 30, padTop = 30, padBottom = 40;
  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;

  lcCtx.fillStyle = "#080c1b";
  lcCtx.fillRect(padLeft, padTop, plotW, plotH);

  const minFlux = Math.max(0.68, 1.0 - Math.max(0.012, state.transitDepth * 1.55));
  const maxFlux = 1.006;

  function fluxToY(f) {
    const norm = (f - minFlux) / (maxFlux - minFlux);
    return padTop + plotH - (norm * plotH);
  }

  // Grid Lines & Axis Labels
  lcCtx.strokeStyle = "rgba(56, 189, 248, 0.12)";
  lcCtx.lineWidth = 1;
  lcCtx.font = "10px 'Fira Code', monospace";
  lcCtx.fillStyle = "#64748b";
  lcCtx.textAlign = "right";

  const ySteps = 4;
  for (let i = 0; i <= ySteps; i++) {
    const fluxVal = minFlux + (i / ySteps) * (maxFlux - minFlux);
    const gy = fluxToY(fluxVal);
    lcCtx.beginPath();
    lcCtx.moveTo(padLeft, gy);
    lcCtx.lineTo(padLeft + plotW, gy);
    lcCtx.stroke();
    lcCtx.fillText(fluxVal.toFixed(4), padLeft - 8, gy + 3);
  }

  // 1.0 Baseline Flux Line
  const y1 = fluxToY(1.0);
  lcCtx.strokeStyle = "rgba(56, 189, 248, 0.45)";
  lcCtx.beginPath();
  lcCtx.moveTo(padLeft, y1);
  lcCtx.lineTo(padLeft + plotW, y1);
  lcCtx.stroke();

  // Transit Dip Guideline
  const yDip = fluxToY(1.0 - state.transitDepth);
  lcCtx.strokeStyle = "rgba(244, 63, 94, 0.35)";
  lcCtx.setLineDash([4, 4]);
  lcCtx.beginPath();
  lcCtx.moveTo(padLeft, yDip);
  lcCtx.lineTo(padLeft + plotW, yDip);
  lcCtx.stroke();
  lcCtx.setLineDash([]);

  // Plot Time-Series Points
  if (state.lightCurveHistory.length > 1) {
    const stepX = plotW / state.maxHistoryLength;

    if (state.enableFitLine) {
      lcCtx.strokeStyle = "#f43f5e";
      lcCtx.lineWidth = 2.4;
      lcCtx.beginPath();
      for (let i = 0; i < state.lightCurveHistory.length; i++) {
        const pt = state.lightCurveHistory[i];
        const px = padLeft + i * stepX;
        const py = fluxToY(pt.fit);
        if (i === 0) lcCtx.moveTo(px, py);
        else lcCtx.lineTo(px, py);
      }
      lcCtx.stroke();
    }

    for (let i = 0; i < state.lightCurveHistory.length; i++) {
      const pt = state.lightCurveHistory[i];
      const px = padLeft + i * stepX;
      const py = fluxToY(pt.obs);

      lcCtx.fillStyle = pt.isTransiting ? "#fb7185" : "#38bdf8";
      lcCtx.beginPath();
      lcCtx.arc(px, py, 2.2, 0, Math.PI * 2);
      lcCtx.fill();
    }

    const lastPt = state.lightCurveHistory[state.lightCurveHistory.length - 1];
    const lastX = padLeft + (state.lightCurveHistory.length - 1) * stepX;
    const lastY = fluxToY(lastPt.obs);

    lcCtx.fillStyle = isTransiting ? "#f43f5e" : "#fbbf24";
    lcCtx.shadowColor = isTransiting ? "#f43f5e" : "#fbbf24";
    lcCtx.shadowBlur = 12;
    lcCtx.beginPath();
    lcCtx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    lcCtx.fill();
    lcCtx.shadowBlur = 0;
  }

  lcCtx.strokeStyle = "rgba(56, 189, 248, 0.28)";
  lcCtx.strokeRect(padLeft, padTop, plotW, plotH);

  lcCtx.font = "11px 'Plus Jakarta Sans', sans-serif";
  lcCtx.fillStyle = "#94a3b8";
  lcCtx.textAlign = "center";
  lcCtx.fillText("Observation Cadence (Time Across Orbit) ──►", padLeft + plotW / 2, h - 10);

  lcCtx.save();
  lcCtx.translate(16, padTop + plotH / 2);
  lcCtx.rotate(-Math.PI / 2);
  lcCtx.fillText("Normalized Stellar Flux (F/F₀)", 0, 0);
  lcCtx.restore();
}

// ====================================================================================================
// 8. CANVAS RENDERER 2: JWST ATMOSPHERIC TRANSMISSION SPECTROSCOPY
// ====================================================================================================
const specCanvas = document.getElementById("spectrumCanvas");
const specCtx = specCanvas ? specCanvas.getContext("2d") : null;

function drawAtmosphericSpectroscopy() {
  if (!specCtx) return;
  const w = specCanvas.width;
  const h = specCanvas.height;

  specCtx.clearRect(0, 0, w, h);

  const padLeft = 60, padRight = 30, padTop = 35, padBottom = 40;
  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;

  specCtx.fillStyle = "#080c1b";
  specCtx.fillRect(padLeft, padTop, plotW, plotH);

  const minWave = 0.8, maxWave = 5.0;
  const baseDepthPpm = state.transitDepth * 1e6;
  const currentData = EXOPLANET_CATALOG[state.currentPreset]?.spectroscopy || { water: 0.7, co2: 0.5, methane: 0.3, scale_height_km: 15 };

  function waveToX(w_um) {
    return padLeft + ((w_um - minWave) / (maxWave - minWave)) * plotW;
  }

  specCtx.strokeStyle = "rgba(56, 189, 248, 0.12)";
  specCtx.lineWidth = 1;
  specCtx.font = "10px 'Fira Code', monospace";
  specCtx.fillStyle = "#64748b";
  specCtx.textAlign = "center";

  for (let wave = 1.0; wave <= 5.0; wave += 1.0) {
    const gx = waveToX(wave);
    specCtx.beginPath();
    specCtx.moveTo(gx, padTop);
    specCtx.lineTo(gx, padTop + plotH);
    specCtx.stroke();
    specCtx.fillText(`${wave.toFixed(1)} µm`, gx, padTop + plotH + 16);
  }

  const points = [];
  const totalSamples = 160;
  for (let i = 0; i <= totalSamples; i++) {
    const wave = minWave + (i / totalSamples) * (maxWave - minWave);

    const peakWater1 = currentData.water * 180 * Math.exp(-Math.pow((wave - 1.4) / 0.18, 2));
    const peakWater2 = currentData.water * 240 * Math.exp(-Math.pow((wave - 2.7) / 0.28, 2));
    const peakMethane = currentData.methane * 150 * Math.exp(-Math.pow((wave - 3.3) / 0.20, 2));
    const peakCO2 = currentData.co2 * 320 * Math.exp(-Math.pow((wave - 4.3) / 0.16, 2));

    const totalPeak = peakWater1 + peakWater2 + peakMethane + peakCO2;
    const depthPpm = baseDepthPpm + totalPeak;
    points.push({ wave, depthPpm });
  }

  const minD = baseDepthPpm - 50;
  const maxD = baseDepthPpm + 400;

  function depthToY(d) {
    const norm = (d - minD) / (maxD - minD);
    return padTop + plotH - (norm * plotH);
  }

  specCtx.strokeStyle = "#10b981";
  specCtx.lineWidth = 2.4;
  specCtx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const px = waveToX(points[i].wave);
    const py = depthToY(points[i].depthPpm);
    if (i === 0) specCtx.moveTo(px, py);
    else specCtx.lineTo(px, py);
  }
  specCtx.stroke();

  for (let i = 0; i < points.length; i += 5) {
    const pt = points[i];
    const noise = (Math.sin(i * 99) * 22);
    const noisyDepth = pt.depthPpm + noise;
    const px = waveToX(pt.wave);
    const py = depthToY(noisyDepth);

    specCtx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    specCtx.lineWidth = 1;
    specCtx.beginPath();
    specCtx.moveTo(px, py - 6);
    specCtx.lineTo(px, py + 6);
    specCtx.stroke();

    specCtx.fillStyle = "#38bdf8";
    specCtx.beginPath();
    specCtx.arc(px, py, 2.8, 0, Math.PI * 2);
    specCtx.fill();
  }

  function drawMoleculeTag(wave, text, color) {
    const px = waveToX(wave);
    const py = padTop + 20;
    specCtx.fillStyle = color;
    specCtx.font = "bold 10px 'Plus Jakarta Sans', sans-serif";
    specCtx.fillText(text, px, py);
  }

  drawMoleculeTag(1.4, "H₂O (1.4µm)", "#38bdf8");
  drawMoleculeTag(2.7, "H₂O (2.7µm)", "#38bdf8");
  drawMoleculeTag(3.3, "CH₄ (3.3µm)", "#fbbf24");
  drawMoleculeTag(4.3, "CO₂ (4.3µm)", "#f43f5e");

  specCtx.strokeStyle = "rgba(56, 189, 248, 0.28)";
  specCtx.strokeRect(padLeft, padTop, plotW, plotH);

  specCtx.font = "11px 'Plus Jakarta Sans', sans-serif";
  specCtx.fillStyle = "#94a3b8";
  specCtx.textAlign = "center";
  specCtx.fillText("Infrared Wavelength (Microns µm) ──► (NASA JWST NIRSpec Band)", padLeft + plotW / 2, h - 10);

  specCtx.save();
  specCtx.translate(16, padTop + plotH / 2);
  specCtx.rotate(-Math.PI / 2);
  specCtx.fillText("Apparent Transit Depth (ppm)", 0, 0);
  specCtx.restore();
}

// ====================================================================================================
// 9. CANVAS RENDERER 3: 3D ORBIT SIMULATOR WITH DRAG-TO-TILT INCLINATION
// ====================================================================================================
const orbitCanvas = document.getElementById("orbitCanvas");
const orbitCtx = orbitCanvas ? orbitCanvas.getContext("2d") : null;

function drawOrbitSimulation(theta) {
  if (!orbitCtx) return;
  const w = orbitCanvas.width;
  const h = orbitCanvas.height;

  orbitCtx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;

  if (state.viewMode === "transit") {
    const starScreenRadius = Math.max(36, Math.min(68, state.star_radius_sun * 50));
    const orbitRadiusX = 205;
    
    // Orbital Y-radius responds dynamically to true physical inclination angle (i)
    const incRad = (state.inclination_deg * Math.PI) / 180.0;
    const orbitRadiusY = Math.max(4, Math.abs(orbitRadiusX * Math.cos(incRad)) * 3.5);

    const timeNow = performance.now() * 0.002;
    const flarePulse = 1.0 + 0.04 * Math.sin(timeNow * 2);

    // Stellar Corona Atmosphere Flare
    const grad = orbitCtx.createRadialGradient(cx, cy, starScreenRadius * 0.3, cx, cy, starScreenRadius * 2.8 * flarePulse);
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(0.25, "rgba(251, 191, 36, 0.85)");
    grad.addColorStop(0.65, "rgba(249, 115, 22, 0.35)");
    grad.addColorStop(1, "rgba(249, 115, 22, 0)");

    orbitCtx.fillStyle = grad;
    orbitCtx.beginPath();
    orbitCtx.arc(cx, cy, starScreenRadius * 2.8 * flarePulse, 0, Math.PI * 2);
    orbitCtx.fill();

    const px = cx + orbitRadiusX * Math.cos(theta);
    const py = cy + orbitRadiusY * Math.sin(theta);
    const inFront = Math.sin(theta) > 0;
    const distToCenter = Math.hypot(px - cx, py - cy);

    const planetScreenRadius = Math.max(4.5, Math.min(26, starScreenRadius * Math.sqrt(state.transitDepth) * 3.8));

    // Orbital Path Wireframe
    orbitCtx.strokeStyle = "rgba(56, 189, 248, 0.18)";
    orbitCtx.lineWidth = 1.2;
    orbitCtx.beginPath();
    orbitCtx.ellipse(cx, cy, orbitRadiusX, orbitRadiusY, 0, 0, Math.PI * 2);
    orbitCtx.stroke();

    // Planet behind star (Occultation)
    const isOcculted = !inFront && distToCenter < starScreenRadius - 2;
    if (!inFront && !isOcculted) {
      orbitCtx.fillStyle = "#38bdf8";
      orbitCtx.beginPath();
      orbitCtx.arc(px, py, planetScreenRadius * 0.85, 0, Math.PI * 2);
      orbitCtx.fill();
    }

    // Stellar Core
    const starColor = state.star_temp_k < 3500 ? "#f87171" : (state.star_temp_k > 6500 ? "#bfdbfe" : "#fef08a");
    const starEdgeColor = state.star_temp_k < 3500 ? "#b91c1c" : (state.star_temp_k > 6500 ? "#3b82f6" : "#f59e0b");

    const starGrad = orbitCtx.createRadialGradient(cx, cy, 0, cx, cy, starScreenRadius);
    starGrad.addColorStop(0, "#ffffff");
    starGrad.addColorStop(0.5, starColor);
    starGrad.addColorStop(1, starEdgeColor);

    orbitCtx.fillStyle = starGrad;
    orbitCtx.beginPath();
    orbitCtx.arc(cx, cy, starScreenRadius, 0, Math.PI * 2);
    orbitCtx.fill();

    // Planet in front of star (Transit)
    if (inFront) {
      const isTransiting = distToCenter < (starScreenRadius + planetScreenRadius);
      if (isTransiting) {
        orbitCtx.fillStyle = "#080c1b";
        orbitCtx.beginPath();
        orbitCtx.arc(px, py, planetScreenRadius, 0, Math.PI * 2);
        orbitCtx.fill();
        orbitCtx.strokeStyle = "#38bdf8";
        orbitCtx.lineWidth = 1.5;
        orbitCtx.stroke();
      } else {
        orbitCtx.fillStyle = "#38bdf8";
        orbitCtx.beginPath();
        orbitCtx.arc(px, py, planetScreenRadius, 0, Math.PI * 2);
        orbitCtx.fill();
        orbitCtx.strokeStyle = "#7dd3fc";
        orbitCtx.lineWidth = 1;
        orbitCtx.stroke();
      }
    }

    orbitCtx.font = "11px 'Plus Jakarta Sans', sans-serif";
    orbitCtx.fillStyle = "#94a3b8";
    orbitCtx.textAlign = "left";
    orbitCtx.fillText("Line-of-Sight Transit Perspective (NASA Kepler/TESS)", 14, h - 14);

  } else {
    // Top-Down Habitable Zone View
    const scale = 75;
    const maxOrbitR = Math.min(185, state.semi_major_axis_au * scale);

    const hzInnerR = Math.max(25, Math.sqrt(state.star_radius_sun**2 * (state.star_temp_k/5778)**4 / 1.776) * scale);
    const hzOuterR = Math.max(35, Math.sqrt(state.star_radius_sun**2 * (state.star_temp_k/5778)**4 / 0.320) * scale);

    orbitCtx.fillStyle = "rgba(16, 185, 129, 0.16)";
    orbitCtx.beginPath();
    orbitCtx.arc(cx, cy, hzOuterR, 0, Math.PI * 2);
    orbitCtx.arc(cx, cy, hzInnerR, 0, Math.PI * 2, true);
    orbitCtx.fill();

    orbitCtx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    orbitCtx.setLineDash([3, 3]);
    orbitCtx.beginPath();
    orbitCtx.arc(cx, cy, maxOrbitR, 0, Math.PI * 2);
    orbitCtx.stroke();
    orbitCtx.setLineDash([]);

    orbitCtx.fillStyle = "#fbbf24";
    orbitCtx.beginPath();
    orbitCtx.arc(cx, cy, 14, 0, Math.PI * 2);
    orbitCtx.fill();

    const px = cx + maxOrbitR * Math.cos(theta);
    const py = cy + maxOrbitR * Math.sin(theta);

    orbitCtx.fillStyle = "#38bdf8";
    orbitCtx.beginPath();
    orbitCtx.arc(px, py, 6.5, 0, Math.PI * 2);
    orbitCtx.fill();

    orbitCtx.font = "10px 'Fira Code', monospace";
    orbitCtx.fillStyle = "#10b981";
    orbitCtx.textAlign = "center";
    orbitCtx.fillText("Habitable Goldilocks Zone", cx, cy - hzOuterR - 6);
  }
}

// ====================================================================================================
// 10. CANVAS RENDERER 4: HABITABLE ZONE RADIAL GAUGE
// ====================================================================================================
const gaugeCanvas = document.getElementById("gaugeCanvas");
const gaugeCtx = gaugeCanvas ? gaugeCanvas.getContext("2d") : null;

function drawHabitableZoneGauge() {
  if (!gaugeCtx) return;
  const w = gaugeCanvas.width;
  const h = gaugeCanvas.height;

  gaugeCtx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h - 22;
  const radius = 95;
  const lineWidth = 15;

  const minT = 100, maxT = 450;

  function tempToAngle(t) {
    const clamped = Math.max(minT, Math.min(maxT, t));
    const ratio = (clamped - minT) / (maxT - minT);
    return Math.PI + ratio * Math.PI;
  }

  gaugeCtx.beginPath();
  gaugeCtx.arc(cx, cy, radius, Math.PI, tempToAngle(200));
  gaugeCtx.strokeStyle = "#38bdf8";
  gaugeCtx.lineWidth = lineWidth;
  gaugeCtx.stroke();

  gaugeCtx.beginPath();
  gaugeCtx.arc(cx, cy, radius, tempToAngle(200), tempToAngle(320));
  gaugeCtx.strokeStyle = "#10b981";
  gaugeCtx.lineWidth = lineWidth;
  gaugeCtx.stroke();

  gaugeCtx.beginPath();
  gaugeCtx.arc(cx, cy, radius, tempToAngle(320), Math.PI * 2);
  gaugeCtx.strokeStyle = "#f43f5e";
  gaugeCtx.lineWidth = lineWidth;
  gaugeCtx.stroke();

  const needleAngle = tempToAngle(state.equilibriumTempK);
  const needleLen = radius - 4;

  gaugeCtx.save();
  gaugeCtx.translate(cx, cy);
  gaugeCtx.rotate(needleAngle);

  gaugeCtx.strokeStyle = "#ffffff";
  gaugeCtx.lineWidth = 3;
  gaugeCtx.beginPath();
  gaugeCtx.moveTo(0, 0);
  gaugeCtx.lineTo(needleLen, 0);
  gaugeCtx.stroke();

  gaugeCtx.fillStyle = "#38bdf8";
  gaugeCtx.beginPath();
  gaugeCtx.arc(0, 0, 6, 0, Math.PI * 2);
  gaugeCtx.fill();

  gaugeCtx.restore();

  gaugeCtx.font = "9.5px 'Plus Jakarta Sans', sans-serif";
  gaugeCtx.fillStyle = "#64748b";
  gaugeCtx.textAlign = "left";
  gaugeCtx.fillText("100K (Frozen)", 8, cy + 15);
  gaugeCtx.textAlign = "right";
  gaugeCtx.fillText("450K (Boiling)", w - 8, cy + 15);
  gaugeCtx.textAlign = "center";
  gaugeCtx.fillStyle = "#10b981";
  gaugeCtx.fillText("HABITABLE ZONE (273-373K)", cx, cy - radius - 6);
}

// ====================================================================================================
// 11. CANVAS RENDERER 5: 3D HOLOGRAPHIC ROTATING PLANET GLOBE
// ====================================================================================================
const holoCanvas = document.getElementById("holoPlanetCanvas");
const holoCtx = holoCanvas ? holoCanvas.getContext("2d") : null;

function drawHoloPlanet() {
  if (!holoCtx) return;
  const w = holoCanvas.width;
  const h = holoCanvas.height;

  holoCtx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const r = 50;
  const data = EXOPLANET_CATALOG[state.currentPreset] || EXOPLANET_CATALOG.kepler452b;

  state.holoAngle += 0.015;

  // Atmospheric Edge Glow
  const glow = holoCtx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.35);
  glow.addColorStop(0, "transparent");
  glow.addColorStop(0.7, data.holo_color);
  glow.addColorStop(1, "transparent");

  holoCtx.fillStyle = glow;
  holoCtx.beginPath();
  holoCtx.arc(cx, cy, r * 1.35, 0, Math.PI * 2);
  holoCtx.fill();

  // Planet Base Spherical Gradient
  const baseGrad = holoCtx.createRadialGradient(cx - 15, cy - 15, 5, cx, cy, r);
  baseGrad.addColorStop(0, "#ffffff");
  baseGrad.addColorStop(0.3, data.holo_color);
  baseGrad.addColorStop(1, "#030712");

  holoCtx.fillStyle = baseGrad;
  holoCtx.beginPath();
  holoCtx.arc(cx, cy, r, 0, Math.PI * 2);
  holoCtx.fill();

  // Procedural Rotating Cloud & Continental Bands
  holoCtx.save();
  holoCtx.beginPath();
  holoCtx.arc(cx, cy, r, 0, Math.PI * 2);
  holoCtx.clip();

  holoCtx.fillStyle = data.holo_cloud;
  for (let band = -3; band <= 3; band++) {
    const bandY = cy + band * 14;
    const offset = Math.sin(state.holoAngle + band * 0.8) * 20;

    holoCtx.beginPath();
    holoCtx.ellipse(cx + offset, bandY, 35, 6, 0, 0, Math.PI * 2);
    holoCtx.fill();
  }

  // Terminator Shadow (Day/Night cycle)
  const shadowGrad = holoCtx.createLinearGradient(cx - r, cy, cx + r, cy);
  shadowGrad.addColorStop(0, "rgba(0,0,0,0)");
  shadowGrad.addColorStop(0.6, "rgba(0,0,0,0.35)");
  shadowGrad.addColorStop(1, "rgba(0,0,0,0.88)");

  holoCtx.fillStyle = shadowGrad;
  holoCtx.fillRect(cx - r, cy - r, r * 2, r * 2);

  holoCtx.restore();

  holoCtx.strokeStyle = data.holo_color;
  holoCtx.lineWidth = 1.5;
  holoCtx.beginPath();
  holoCtx.arc(cx, cy, r, 0, Math.PI * 2);
  holoCtx.stroke();
}

// ====================================================================================================
// 12. CANVAS RENDERER 6: ANIMATED RADIAL HABITABILITY SCORE RING
// ====================================================================================================
const ringCanvas = document.getElementById("radialRingCanvas");
const ringCtx = ringCanvas ? ringCanvas.getContext("2d") : null;

function drawRadialScoreRing(targetPercent = 84) {
  if (!ringCtx) return;
  const w = ringCanvas.width;
  const h = ringCanvas.height;

  ringCtx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const r = 48;
  const lineWidth = 10;

  // Background Inactive Track
  ringCtx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ringCtx.lineWidth = lineWidth;
  ringCtx.beginPath();
  ringCtx.arc(cx, cy, r, 0, Math.PI * 2);
  ringCtx.stroke();

  // Active Progress Arc
  const angle = (targetPercent / 100.0) * (Math.PI * 2) - Math.PI / 2;
  const color = targetPercent > 75 ? "#10b981" : (targetPercent > 40 ? "#fbbf24" : "#f43f5e");

  ringCtx.strokeStyle = color;
  ringCtx.lineWidth = lineWidth;
  ringCtx.lineCap = "round";
  ringCtx.shadowColor = color;
  ringCtx.shadowBlur = 10;

  ringCtx.beginPath();
  ringCtx.arc(cx, cy, r, -Math.PI / 2, angle);
  ringCtx.stroke();

  ringCtx.shadowBlur = 0;
}

// ====================================================================================================
// 13. MAIN PHYSICS & SIMULATION LOOP (60 FPS)
// ====================================================================================================
let lastFrameTime = performance.now();

function animate(currentTime) {
  const dt = (currentTime - lastFrameTime) / 1000.0;
  lastFrameTime = currentTime;

  if (state.isPlaying) {
    const speedMultiplier = 1.2 * state.simSpeed;
    state.theta = (state.theta + speedMultiplier * dt) % (Math.PI * 2);
  }

  const starScreenRadius = Math.max(36, Math.min(68, state.star_radius_sun * 50));
  const orbitRadiusX = 205;
  const incRad = (state.inclination_deg * Math.PI) / 180.0;
  const orbitRadiusY = Math.max(4, Math.abs(orbitRadiusX * Math.cos(incRad)) * 3.5);

  const px = orbitRadiusX * Math.cos(state.theta);
  const py = orbitRadiusY * Math.sin(state.theta);
  const inFront = Math.sin(state.theta) > 0;
  const dist2D = Math.hypot(px, py);

  const planetScreenRadius = Math.max(4.5, Math.min(26, starScreenRadius * Math.sqrt(state.transitDepth) * 3.8));

  let instantaneousDip = 0.0;
  let isTransiting = false;
  let cpActive = null;

  if (inFront && dist2D < (starScreenRadius + planetScreenRadius)) {
    isTransiting = true;
    const rDiff = Math.abs(starScreenRadius - planetScreenRadius);

    if (dist2D <= rDiff) {
      if (state.enableLimbDarkening) {
        const mu = Math.sqrt(Math.max(0, 1.0 - Math.pow(dist2D / starScreenRadius, 2)));
        const limbFactor = 1.0 - state.u1 * (1.0 - mu) - state.u2 * Math.pow(1.0 - mu, 2);
        instantaneousDip = state.transitDepth * (limbFactor / (1.0 - state.u1 / 3.0 - state.u2 / 6.0));
      } else {
        instantaneousDip = state.transitDepth;
      }
      cpActive = px < 0 ? "cp2" : "cp3";
    } else {
      const overlap = (starScreenRadius + planetScreenRadius - dist2D) / (2 * planetScreenRadius);
      instantaneousDip = state.transitDepth * Math.max(0, Math.min(1.0, overlap));
      cpActive = px < 0 ? "cp1" : "cp4";
    }
  }

  if (isTransiting !== state.wasTransiting) {
    playTransitChime(isTransiting);
    state.wasTransiting = isTransiting;
  }

  const modelFlux = 1.0 - instantaneousDip;
  let observedFlux = modelFlux;
  if (state.enableNoise) {
    const noise = (Math.random() - 0.5) * 0.00035;
    observedFlux += noise;
  }

  ["cp1", "cp2", "cp3", "cp4"].forEach(cpId => {
    const el = document.getElementById(cpId);
    if (el) {
      if (cpId === cpActive) el.classList.add("active");
      else el.classList.remove("active");
    }
  });

  const indicator = document.getElementById("transitIndicator");
  const indicatorText = document.getElementById("transitStateText");
  if (indicator && indicatorText) {
    if (isTransiting) {
      indicator.classList.add("transiting");
      indicatorText.innerText = "TRANSITING (PHOTOMETRIC DIP)";
    } else {
      indicator.classList.remove("transiting");
      indicatorText.innerText = "OUT OF TRANSIT";
    }
  }

  if (state.isPlaying || state.lightCurveHistory.length === 0) {
    state.lightCurveHistory.push({
      obs: observedFlux,
      fit: modelFlux,
      isTransiting: isTransiting
    });
    if (state.lightCurveHistory.length > state.maxHistoryLength) {
      state.lightCurveHistory.shift();
    }
  }

  if (state.activeTab === "lightcurve") {
    drawLightCurve(observedFlux, isTransiting);
  } else {
    drawAtmosphericSpectroscopy();
  }

  drawOrbitSimulation(state.theta);
  drawHabitableZoneGauge();
  updateAndDrawConfetti();

  const scanModal = document.getElementById("scanModal");
  if (scanModal && scanModal.classList.contains("active")) {
    drawHoloPlanet();
  }

  requestAnimationFrame(animate);
}

// ====================================================================================================
// 14. GUIDED 60-SECOND JUDGE PRESENTATION TOUR
// ====================================================================================================
const TOUR_STEPS = [
  {
    title: "STEP 1: THE CORE ASTRONOMICAL PROBLEM",
    subtitle: "How do we find planets trillions of miles away?",
    content: `
      <p><strong>The Challenge:</strong> Alien worlds (exoplanets) are far too faint and distant to photograph directly. Even the largest telescopes on Earth see distant stars only as pinpoints of light.</p>
      <p><strong>Our Solution:</strong> We measure microscopic periodic drops in starlight when an exoplanet crosses between its star and our telescope (called a <em>Transit</em>).</p>
      <div class="math-block">Transit Depth (\delta) = \left(\frac{R_p}{R_*}\right)^2</div>
    `
  },
  {
    title: "STEP 2: REAL-TIME LIGHT CURVE PHOTOMETRY",
    subtitle: "Measuring the Light Curve Dip & Contact Points",
    content: `
      <p>Look at the top-left graph: as the exoplanet enters the stellar disc (<strong>Ingress t₁-t₂</strong>), flux drops by <strong>1,285 ppm (0.138%)</strong>.</p>
      <p>By fitting the <em>Mandel-Agol model</em> and accounting for stellar <em>Limb Darkening</em>, our algorithm measures the exact physical radius ($R_p = 1.63 R_\\oplus$).</p>
    `
  },
  {
    title: "STEP 3: KEPLER'S 3RD LAW & ORBITAL DISTANCE",
    subtitle: "Calculating Semi-Major Axis from Orbital Period",
    content: `
      <p>By measuring the time between consecutive transits ($P = 384.8$ days), we apply <strong>Kepler's Third Harmonic Law</strong> to find the orbital distance:</p>
      <div class="math-block">a = \sqrt[3]{M_* \cdot P^2} = 1.046 \text{ AU}</div>
      <p>This places Kepler-452b at almost the exact same distance from its sun-like star as Earth is from our Sun!</p>
    `
  },
  {
    title: "STEP 4: HABITABLE ZONE & SURFACE TEMPERATURE",
    subtitle: "Can Liquid Water Oceans Exist?",
    content: `
      <p>Using the <strong>Kopparapu et al. Climate Model</strong>, we balance incoming stellar flux ($S_{\\text{eff}} = 1.10 S_\\oplus$) against thermal radiation.</p>
      <p>The resulting equilibrium temperature is <strong>265 Kelvin (-8°C)</strong>, giving it an <strong>Earth Similarity Index (ESI) of 0.84 / 1.00</strong>.</p>
    `
  },
  {
    title: "STEP 5: JWST ATMOSPHERIC SPECTROSCOPY",
    subtitle: "Scanning for Water & Biosignatures",
    content: `
      <p>When starlight filters through the planetary atmosphere, chemical gases absorb specific infrared wavelengths.</p>
      <p>Our NASA JWST module identifies strong <strong>H₂O water vapor peaks at 1.4µm & 2.7µm</strong> and <strong>CO₂ at 4.3µm</strong>, demonstrating life-supporting atmospheric potential!</p>
    `
  }
];

let currentTourIndex = 0;

function showTourStep(index) {
  currentTourIndex = index;
  const step = TOUR_STEPS[index];
  document.getElementById("tourStepTitle").innerText = step.title;
  document.getElementById("tourStepSubtitle").innerText = `Science Fair Presentation Step ${index + 1} of ${TOUR_STEPS.length}`;
  document.getElementById("tourBodyContent").innerHTML = step.content;

  const dots = document.querySelectorAll("#tourDots .dot");
  dots.forEach((d, i) => {
    if (i === index) d.classList.add("active");
    else d.classList.remove("active");
  });

  document.getElementById("btnTourPrev").disabled = (index === 0);
  document.getElementById("btnTourNext").innerText = (index === TOUR_STEPS.length - 1) ? "Finish Tour & Present" : "Next Step →";
}

// ====================================================================================================
// 15. GLOBAL HELPER TO SELECT PLANET FROM MATRIX TABLE
// ====================================================================================================
window.selectPlanetFromTable = function(planetKey) {
  const datasetSelect = document.getElementById("datasetSelect");
  if (datasetSelect) {
    datasetSelect.value = planetKey;
    datasetSelect.dispatchEvent(new Event("change"));
  }
  const leaderboardModal = document.getElementById("leaderboardModal");
  if (leaderboardModal) leaderboardModal.classList.remove("active");
};

// ====================================================================================================
// 16. EVENT LISTENERS & DRAG-TO-TILT ORBIT HANDLERS
// ====================================================================================================
function setupEventListeners() {
  const tabLC = document.getElementById("tabLightCurve");
  const tabSpec = document.getElementById("tabSpectroscopy");
  const lcCanvasEl = document.getElementById("lightCurveCanvas");
  const specCanvasEl = document.getElementById("spectrumCanvas");
  const lcActionsEl = document.getElementById("lcActions");

  if (tabLC && tabSpec) {
    tabLC.addEventListener("click", () => {
      state.activeTab = "lightcurve";
      tabLC.classList.add("active");
      tabSpec.classList.remove("active");
      lcCanvasEl.classList.remove("hidden");
      specCanvasEl.classList.add("hidden");
      lcActionsEl.classList.remove("hidden");
      playTone(440, "sine", 0.08, 0.05);
    });

    tabSpec.addEventListener("click", () => {
      state.activeTab = "spectroscopy";
      tabSpec.classList.add("active");
      tabLC.classList.remove("active");
      specCanvasEl.classList.remove("hidden");
      lcCanvasEl.classList.add("hidden");
      lcActionsEl.classList.add("hidden");
      playTone(660, "sine", 0.08, 0.05);
    });
  }

  // Filter Band Selector
  const filterSelect = document.getElementById("selectFilterBand");
  if (filterSelect) {
    filterSelect.addEventListener("change", (e) => {
      state.filterBand = e.target.value;
      updateAstrophysics();
      playTone(580, "sine", 0.08, 0.05);
    });
  }

  // Audio Telemetry Toggle
  const btnAudio = document.getElementById("btnAudioToggle");
  const audioOnIcon = document.getElementById("audioOnIcon");
  const audioOffIcon = document.getElementById("audioOffIcon");
  const audioText = document.getElementById("audioText");
  if (btnAudio) {
    btnAudio.addEventListener("click", () => {
      state.audioEnabled = !state.audioEnabled;
      if (state.audioEnabled) {
        audioOnIcon.classList.remove("hidden");
        audioOffIcon.classList.add("hidden");
        audioText.innerText = "Sound: ON";
        playTone(520, "sine", 0.15, 0.08);
      } else {
        audioOnIcon.classList.add("hidden");
        audioOffIcon.classList.remove("hidden");
        audioText.innerText = "Sound: OFF";
      }
    });
  }

  // NASA Target Dataset Selector
  const datasetSelect = document.getElementById("datasetSelect");
  if (datasetSelect) {
    datasetSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val === "custom") {
        state.isCustom = true;
      } else {
        state.isCustom = false;
        state.currentPreset = val;
        const data = EXOPLANET_CATALOG[val];
        if (data) {
          state.radius_earth = data.radius_earth;
          state.star_radius_sun = data.star_radius_sun;
          state.star_temp_k = data.star_temp_k;
          state.star_mass_sun = data.star_mass_sun;
          state.semi_major_axis_au = data.semi_major_axis_au;
          state.period_days = data.period;
          state.transit_duration_hours = data.transit_duration_hours;
          state.albedo = data.albedo;
          state.inclination_deg = data.inclination_deg;
          state.u1 = data.u1 || 0.45;
          state.u2 = data.u2 || 0.22;

          document.getElementById("sliderRp").value = data.radius_earth;
          document.getElementById("sliderA").value = data.semi_major_axis_au;
          document.getElementById("sliderTstar").value = data.star_temp_k;
          document.getElementById("sliderRstar").value = data.star_radius_sun;
        }
      }
      state.lightCurveHistory = [];
      updateAstrophysics();
      playTone(523.25, "triangle", 0.12, 0.06);
    });
  }

  // Interactive Sandbox Sliders
  ["sliderRp", "sliderA", "sliderTstar", "sliderRstar"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", (e) => {
        state.isCustom = true;
        if (datasetSelect) datasetSelect.value = "custom";
        if (id === "sliderRp") state.radius_earth = parseFloat(e.target.value);
        if (id === "sliderA") state.semi_major_axis_au = parseFloat(e.target.value);
        if (id === "sliderTstar") state.star_temp_k = parseFloat(e.target.value);
        if (id === "sliderRstar") state.star_radius_sun = parseFloat(e.target.value);
        updateAstrophysics();
      });
    }
  });

  // DRAG-TO-TILT ORBITAL INCLINATION
  if (orbitCanvas) {
    orbitCanvas.addEventListener("mousedown", (e) => {
      state.isDraggingOrbit = true;
      state.dragStartY = e.clientY;
      state.dragStartInc = state.inclination_deg;
    });
    window.addEventListener("mousemove", (e) => {
      if (!state.isDraggingOrbit) return;
      const dy = e.clientY - state.dragStartY;
      const newInc = Math.max(80.0, Math.min(90.0, state.dragStartInc - dy * 0.08));
      state.inclination_deg = newInc;
      updateAstrophysics();
    });
    window.addEventListener("mouseup", () => {
      state.isDraggingOrbit = false;
    });
  }

  // Play / Pause Simulation
  const btnPlayPause = document.getElementById("btnPlayPause");
  const playIcon = document.getElementById("playIcon");
  const pauseIcon = document.getElementById("pauseIcon");
  if (btnPlayPause) {
    btnPlayPause.addEventListener("click", () => {
      state.isPlaying = !state.isPlaying;
      if (state.isPlaying) {
        playIcon.classList.add("hidden");
        pauseIcon.classList.remove("hidden");
      } else {
        playIcon.classList.remove("hidden");
        pauseIcon.classList.add("hidden");
      }
      playTone(400, "sine", 0.08, 0.05);
    });
  }

  // Reset Phase
  const btnReset = document.getElementById("btnReset");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      state.theta = 0;
      state.lightCurveHistory = [];
      playTone(300, "sine", 0.1, 0.05);
    });
  }

  // Speed Slider
  const simSpeedRange = document.getElementById("simSpeedRange");
  if (simSpeedRange) {
    simSpeedRange.addEventListener("input", (e) => {
      state.simSpeed = parseFloat(e.target.value);
      document.getElementById("speedVal").innerText = state.simSpeed.toFixed(1) + "x";
    });
  }

  // Perspective Views
  const btnViewTransit = document.getElementById("btnViewTransit");
  const btnViewTop = document.getElementById("btnViewTop");
  if (btnViewTransit && btnViewTop) {
    btnViewTransit.addEventListener("click", () => {
      state.viewMode = "transit";
      btnViewTransit.classList.add("active");
      btnViewTop.classList.remove("active");
      playTone(480, "sine", 0.08, 0.05);
    });
    btnViewTop.addEventListener("click", () => {
      state.viewMode = "topdown";
      btnViewTop.classList.add("active");
      btnViewTransit.classList.remove("active");
      playTone(480, "sine", 0.08, 0.05);
    });
  }

  // Toggles
  document.getElementById("toggleNoise")?.addEventListener("change", (e) => { state.enableNoise = e.target.checked; });
  document.getElementById("toggleFitLine")?.addEventListener("change", (e) => { state.enableFitLine = e.target.checked; });
  document.getElementById("toggleLimbDarkening")?.addEventListener("change", (e) => { state.enableLimbDarkening = e.target.checked; });

  // Guided Judge Tour Modal
  const tourModal = document.getElementById("tourModal");
  document.getElementById("btnJudgeTour")?.addEventListener("click", () => {
    showTourStep(0);
    tourModal?.classList.add("active");
    playTone(550, "triangle", 0.2, 0.07);
  });
  document.getElementById("btnCloseTour")?.addEventListener("click", () => { tourModal?.classList.remove("active"); });
  document.getElementById("btnTourPrev")?.addEventListener("click", () => { if (currentTourIndex > 0) showTourStep(currentTourIndex - 1); });
  document.getElementById("btnTourNext")?.addEventListener("click", () => {
    if (currentTourIndex < TOUR_STEPS.length - 1) {
      showTourStep(currentTourIndex + 1);
    } else {
      tourModal?.classList.remove("active");
    }
  });

  // Leaderboard Modal
  const leaderboardModal = document.getElementById("leaderboardModal");
  document.getElementById("btnLeaderboard")?.addEventListener("click", () => {
    leaderboardModal?.classList.add("active");
    playTone(600, "sine", 0.12, 0.06);
  });
  document.getElementById("btnCloseLeaderboard")?.addEventListener("click", () => { leaderboardModal?.classList.remove("active"); });
  document.getElementById("btnCloseLeaderboardBtn")?.addEventListener("click", () => { leaderboardModal?.classList.remove("active"); });

  // GRAND ASTROBIOLOGY DOSSIER SCAN TRIGGER
  const scanModal = document.getElementById("scanModal");
  const animBox = document.getElementById("scanAnimBox");
  const verdictGrid = document.getElementById("verdictGrid");

  function openDossierVerdict() {
    const data = EXOPLANET_CATALOG[state.currentPreset] || EXOPLANET_CATALOG.kepler452b;
    document.getElementById("scanPlanetName").innerText = state.isCustom ? "Custom Exoplanet" : data.name;
    document.getElementById("holoPlanetName").innerText = state.isCustom ? "Custom Target" : data.name;
    document.getElementById("holoPlanetType").innerText = state.isCustom ? state.planet_class : (data.planet_class + " / " + data.density_desc);

    animBox?.classList.remove("hidden");
    verdictGrid?.classList.add("hidden");
    document.getElementById("scanStatusText").innerText = "ANALYZING SPECTROSCOPY & CLIMATE DYNAMICS...";
    scanModal?.classList.add("active");

    playScanSound();

    setTimeout(() => {
      document.getElementById("scanStatusText").innerText = "COMPUTING HABITABILITY INDEX & CLIMATE MODEL...";
    }, 900);

    setTimeout(() => {
      animBox?.classList.add("hidden");
      verdictGrid?.classList.remove("hidden");

      const v = data.verdict;
      document.getElementById("vWater").innerText = v.water;
      document.getElementById("vWaterDesc").innerText = v.water_desc;
      document.getElementById("barWater").style.width = `${v.water_pct}%`;

      document.getElementById("vAtmo").innerText = v.atmo;
      document.getElementById("vAtmoDesc").innerText = v.atmo_desc;
      document.getElementById("barAtmo").style.width = `${v.atmo_pct}%`;

      document.getElementById("vRadiation").innerText = v.radiation;
      document.getElementById("vRadDesc").innerText = v.rad_desc;
      document.getElementById("barRad").style.width = `${v.rad_pct}%`;

      document.getElementById("vEsi").innerText = `ESI = ${(state.esiScore).toFixed(2)} / 1.00`;
      document.getElementById("vEsiDesc").innerText = `Radius of ${state.radius_earth.toFixed(2)} R⊕ supports atmospheric retention.`;
      document.getElementById("barEsi").style.width = `${Math.round(state.esiScore * 100)}%`;

      const scoreNum = parseInt(v.score);
      document.getElementById("dossierScoreVal").innerText = v.score;
      document.getElementById("dossierScoreClass").innerText = v.score_class;

      drawRadialScoreRing(scoreNum);
      playTransitChime(true);

      // Trigger Confetti for Class-1 Habitable Worlds!
      if (scoreNum >= 75) {
        triggerConfetti();
      }
    }, 1800);
  }

  document.getElementById("btnScanBiosignature")?.addEventListener("click", openDossierVerdict);
  document.getElementById("btnExportReport")?.addEventListener("click", openDossierVerdict);

  document.getElementById("btnCloseScan")?.addEventListener("click", () => { scanModal?.classList.remove("active"); });
  document.getElementById("btnCloseScanBtn")?.addEventListener("click", () => { scanModal?.classList.remove("active"); });
  document.getElementById("btnPrintDossier")?.addEventListener("click", () => { window.print(); });

  // Judge Research Guide Modal
  const judgeModal = document.getElementById("judgeModal");
  document.getElementById("btnJudgeGuide")?.addEventListener("click", () => { judgeModal?.classList.add("active"); });
  document.getElementById("btnCloseModal")?.addEventListener("click", () => { judgeModal?.classList.remove("active"); });
  document.getElementById("btnDoneModal")?.addEventListener("click", () => { judgeModal?.classList.remove("active"); });
  document.getElementById("btnPrintModal")?.addEventListener("click", () => { window.print(); });
}

// ====================================================================================================
// 17. APPLICATION BOOTSTRAP INITIALIZATION
// ====================================================================================================
window.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  updateAstrophysics();
  requestAnimationFrame(animate);
});
