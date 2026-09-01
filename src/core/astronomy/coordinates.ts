import { RawExoplanetRecord, ExoplanetSystem, CrossMatchedRecord } from '../../types/astronomy';

export class CoordinateTransformer {
  private static readonly DEG_TO_RAD = Math.PI / 180.0;
  private static readonly PC_TO_LY = 3.26156;

  // Real Sun Galactocentric position inside the Milky Way disk (Orion Spur, R0 = 8.2 kpc)
  private static readonly SUN_GALACTIC_X = 8.2;
  private static readonly SUN_GALACTIC_Y = 0.02;
  private static readonly SUN_GALACTIC_Z = 0.0;

  // 1 scene unit = 1000 pc (1 kpc). Scale 0.002 maps 1000 pc to 2 units around Sun
  private static readonly SCENE_DISTANCE_SCALE = 0.002;

  // IAU J2000 Transformation constants (Equatorial to Galactic)
  private static readonly RA_NGP = 192.85948 * (Math.PI / 180.0);   // RA of North Galactic Pole
  private static readonly DEC_NGP = 27.12825 * (Math.PI / 180.0);   // Dec of North Galactic Pole
  private static readonly L_NCP = 122.93192 * (Math.PI / 180.0);    // Galactic longitude of NCP

  public static transformRecord(
    input: CrossMatchedRecord | RawExoplanetRecord,
    index: number
  ): ExoplanetSystem {
    const raw: RawExoplanetRecord = 'exoplanet' in input ? input.exoplanet : input;
    const gaia = 'gaiaMatch' in input ? input.gaiaMatch : null;

    const raRad = raw.ra * this.DEG_TO_RAD;
    const decRad = raw.dec * this.DEG_TO_RAD;
    const distPc = raw.sy_dist > 0 ? raw.sy_dist : 100.0;

    // 1. Rigorous Astronomical Equatorial (RA, Dec) -> Galactic (l, b) Conversion
    const sinB = Math.sin(decRad) * Math.sin(this.DEC_NGP) +
                 Math.cos(decRad) * Math.cos(this.DEC_NGP) * Math.cos(raRad - this.RA_NGP);
    const b = Math.asin(Math.max(-1.0, Math.min(1.0, sinB)));
    const cosB = Math.cos(b);

    const sinL0MinusL = (Math.cos(decRad) * Math.sin(raRad - this.RA_NGP)) / (cosB || 1e-6);
    const cosL0MinusL = (Math.sin(decRad) * Math.cos(this.DEC_NGP) -
                         Math.cos(decRad) * Math.sin(this.DEC_NGP) * Math.cos(raRad - this.RA_NGP)) / (cosB || 1e-6);
    const l = (this.L_NCP - Math.atan2(sinL0MinusL, cosL0MinusL) + Math.PI * 2.0) % (Math.PI * 2.0);

    // 2. Project into Galactocentric 3D coordinates aligned with the Milky Way disk
    // l = 0° points towards Galactic Center (-X from Sun)
    // l = 90° points in direction of Galactic rotation (+Z)
    // b = 90° points towards North Galactic Pole (+Y)
    const dScene = distPc * this.SCENE_DISTANCE_SCALE;
    const xHelio = -dScene * Math.cos(b) * Math.cos(l);
    const yHelio = dScene * Math.sin(b);
    const zHelio = dScene * Math.cos(b) * Math.sin(l);

    const gx = this.SUN_GALACTIC_X + xHelio;
    const gy = this.SUN_GALACTIC_Y + yHelio;
    const gz = this.SUN_GALACTIC_Z + zHelio;

    // Stellar radius fallback
    const starRad = raw.st_rad && raw.st_rad > 0 ? raw.st_rad : 1.0;

    // st_mass never exists in source exoplanet_catalog.json — derived via empirical mass-radius power law
    const starMass = Math.pow(starRad, 1.2);

    // st_teff is null in ~2.4% of records; fallback to Gaia cross-match GSP-Phot temperature, then 5778 K (Solar)
    const starTeff = raw.st_teff && raw.st_teff > 0
      ? raw.st_teff
      : (gaia?.teffGspphotK ?? 5778.0);

    const planetRade = raw.pl_rade && raw.pl_rade > 0 ? raw.pl_rade : 1.0;
    const periodDays = raw.pl_orbper && raw.pl_orbper > 0 ? raw.pl_orbper : 10.0;

    // Kepler's Third Law: a = [(P / 365.256)^2 * M*]^(1/3)
    const periodYears = periodDays / 365.256363;
    const semiMajorAxisAU = Math.cbrt(Math.pow(periodYears, 2) * starMass);

    // Stefan-Boltzmann Luminosity: L/L_sun = (R/R_sun)^2 * (T/T_sun)^4
    const luminositySolar = Math.pow(starRad, 2) * Math.pow(starTeff / 5778.0, 4);

    // Planetary equilibrium temperature with 0.3 Bond albedo
    const aInSolarRadii = semiMajorAxisAU * 215.032;
    const teqKelvin = starTeff * Math.sqrt(starRad / (2.0 * aInSolarRadii)) * Math.pow(1.0 - 0.3, 0.25);

    // Transit depth (Rp / R*)^2
    // pl_trandep is null in ~84% of records. The theoretical dip is the PRIMARY computational path,
    // not a rare fallback, with archive pl_trandep serving as an empirical override when present.
    const starRadKm = starRad * 696340.0;
    const planetRadKm = planetRade * 6371.0;
    const theoreticalDipPercent = Math.pow(planetRadKm / starRadKm, 2) * 100.0;
    const transitDepth = raw.pl_trandep && raw.pl_trandep > 0 ? raw.pl_trandep : theoreticalDipPercent;

    // Transit duration (hours)
    const transitDurationHours = (periodDays * 24.0 / Math.PI) * Math.asin(Math.min(1.0, (starRad * 0.00465) / semiMajorAxisAU));

    // Astrobiological habitability classification (180K - 320K equilibrium temp account for greenhouse warming)
    let habClass: ExoplanetSystem['planetaryPhysics']['habitableZoneClass'] = 'GAS_GIANT_NON_TERRESTRIAL';
    if (planetRade < 2.0) {
      if (teqKelvin >= 180 && teqKelvin <= 320) {
        habClass = 'OPTIMAL_HABITABLE';
      } else if (teqKelvin > 320) {
        habClass = 'TOO_HOT';
      } else {
        habClass = 'TOO_COLD';
      }
    }

    const colorHex = this.kelvinToHex(starTeff);
    const spectralType = this.inferSpectralType(starTeff);

    const system: ExoplanetSystem = {
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
        spectralType,
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

    if (gaia) {
      system.gaiaAstrometry = {
        sourceId: gaia.sourceId,
        parallaxMas: gaia.parallaxMas,
        photGMeanMag: gaia.photGMeanMag,
        bpRp: gaia.bpRp
      };
    }

    return system;
  }

  public static kelvinToHex(kelvin: number): string {
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

  public static inferSpectralType(temp: number): string {
    if (temp >= 30000) return 'O';
    if (temp >= 10000) return 'B';
    if (temp >= 7500) return 'A';
    if (temp >= 6000) return 'F';
    if (temp >= 5200) return 'G';
    if (temp >= 3700) return 'K';
    return 'M';
  }
}
