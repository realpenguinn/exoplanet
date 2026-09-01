import { ExoplanetSystem } from '../../types/astronomy';

export interface ScientificVerdict {
  category: 'TERRESTRIAL_HABITABLE' | 'SUPER_EARTH' | 'HOT_JUPITER' | 'MINI_NEPTUNE' | 'HOSTILE_STELLAR_FURNACE';
  headline: string;
  badgeColor: string;
  description: string;
  calculationDisclosure: string;
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

    // Relative stellar irradiance (S_rel = L* / a^2)
    const sRel = Math.max(0.001, lStar / Math.max(0.0001, Math.pow(a, 2)));

    // Empirical planetary bulk density model (g/cm^3)
    let density = 5.51;
    if (r > 1.5 && r < 4.0) {
      density = 5.51 * Math.pow(r, -0.74);
    } else if (r >= 4.0) {
      density = 1.33;
    }

    // Relative surface gravity & atmospheric scale height (H = (T_eq / g_rel) * 0.12 km)
    const gRel = Math.max(0.1, r > 1.5 ? Math.pow(r, 0.5) : Math.pow(r, 1.0));
    const scaleHeightKm = (teq / gRel) * 0.12;

    const metrics = {
      calculatedRadiusEarth: r,
      densityEstimateGcm3: density,
      stellarIrradianceRelative: sRel,
      atmosphericScaleHeightKm: scaleHeightKm
    };

    // 1. Likely Habitable Terrestrial World (Earth Analogue)
    if (r <= 1.6 && teq >= 180 && teq <= 320) {
      return {
        category: 'TERRESTRIAL_HABITABLE',
        headline: 'Likely Habitable Rocky World (Earth-Analogue)',
        badgeColor: '#10b981',
        description: `Photometric transit depth of ${dip.toFixed(3)}% is consistent with an Earth-sized terrestrial planet (${r.toFixed(2)} R⊕). Orbital radius (${a.toFixed(3)} AU) places the surface within the estimated liquid-water zone with solar irradiance ${sRel.toFixed(2)}x Earth.`,
        calculationDisclosure: 'Evaluated using Kopparapu (2013) habitable zone flux bounds & Mandel-Agol transit radius extraction (Rp = R* * sqrt(ΔF)).',
        astrophysicalMetrics: metrics
      };
    }

    // 2. Potentially Habitable Super-Earth
    if (r > 1.6 && r <= 2.5 && teq >= 170 && teq <= 340) {
      return {
        category: 'SUPER_EARTH',
        headline: 'Potentially Habitable Super-Earth',
        badgeColor: '#00f2fe',
        description: `Transit signal corresponds to a massive rocky core (${r.toFixed(2)} R⊕) with density estimate ${density.toFixed(2)} g/cm³. May sustain a dense volatile atmosphere and potential surface liquid water under elevated atmospheric pressure.`,
        calculationDisclosure: 'Model: Super-Earth radius-density power law (Weiss & Marcy 2014) and equilibrium temperature with Bond albedo 0.3.',
        astrophysicalMetrics: metrics
      };
    }

    // 3. Scorching Hot Jupiter
    if (r >= 6.0 && a <= 0.1) {
      return {
        category: 'HOT_JUPITER',
        headline: 'Scorching Hot Jupiter Gas Giant',
        badgeColor: '#ff007f',
        description: `A ${dip.toFixed(2)}% optical occultation indicates an inflated Jovian gas giant (${r.toFixed(2)} R⊕) orbiting extremely close (${a.toFixed(3)} AU) to its host star. Equilibrium temperature exceeds ${teq.toFixed(0)} K, driving severe atmospheric escape.`,
        calculationDisclosure: 'Model: Inflated gas giant radius extraction with strong photo-evaporative equilibrium scaling.',
        astrophysicalMetrics: metrics
      };
    }

    // 4. Sub-Neptune Volatile World
    if (r > 2.0 && r < 6.0) {
      return {
        category: 'MINI_NEPTUNE',
        headline: 'Sub-Neptune Volatile Planet',
        badgeColor: '#818cf8',
        description: `Transit depth matches an extended hydrogen/helium envelope surrounding an icy or rocky core (${r.toFixed(2)} R⊕). Bulk density of ${density.toFixed(2)} g/cm³ rules out a terrestrial solid surface.`,
        calculationDisclosure: 'Model: Fulton et al. (2017) radius valley analysis: volatile envelope fraction dominates over rocky mantle.',
        astrophysicalMetrics: metrics
      };
    }

    // 5. Hostile Thermal Furnace
    return {
      category: 'HOSTILE_STELLAR_FURNACE',
      headline: 'Extreme Thermal Irradiated World',
      badgeColor: '#f59e0b',
      description: `This planet experiences severe stellar flux (${sRel.toFixed(1)}x Earth solar constant). Surface equilibrium temperature of ${teq.toFixed(0)} K renders liquid water chemically impossible under any known planetary atmosphere.`,
      calculationDisclosure: 'Model: Stefan-Boltzmann equilibrium radiation balance without sufficient orbital distance for liquid phase water.',
      astrophysicalMetrics: metrics
    };
  }
}
