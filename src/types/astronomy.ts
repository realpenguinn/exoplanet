import { z } from 'zod';

// Matches exoplanet_catalog.json exactly as observed — 10 fields, no more.
export interface RawExoplanetRecord {
  pl_name: string;
  hostname: string;
  ra: number;
  dec: number;
  sy_dist: number;
  pl_rade: number;
  pl_orbper: number;
  pl_trandep: number | null; // null in ~84% of real records — treated as primary branch
  st_teff: number | null;    // null in ~2.4% of real records
  st_rad: number | null;     // null in ~0.6% of real records
}

export const RawExoplanetRecordSchema = z.object({
  pl_name: z.string().min(1),
  hostname: z.string().min(1),
  ra: z.number().min(0).max(360),
  dec: z.number().min(-90).max(90),
  sy_dist: z.number().positive(),
  pl_rade: z.number().positive(),
  pl_orbper: z.number().positive(),
  pl_trandep: z.number().nonnegative().nullable(),
  st_teff: z.number().positive().nullable(),
  st_rad: z.number().positive().nullable()
});

// Matches gaia.vot's FIELD definitions exactly.
export interface GaiaAstrometricRecord {
  sourceId: string;        // source_id, Gaia DR3 unique identifier (string to prevent 64-bit float precision loss)
  ra: number;              // deg, ICRS, epoch J2016.0
  dec: number;             // deg, ICRS, epoch J2016.0
  parallaxMas: number;     // milliarcseconds; distance_pc ~= 1000 / parallaxMas
  pmraMasYr: number;       // proper motion in RA, mas/yr
  pmdecMasYr: number;      // proper motion in Dec, mas/yr
  photGMeanMag: number;    // Gaia G-band apparent magnitude
  bpRp: number;            // BP-RP color index (blue minus red magnitude)
  teffGspphotK: number;    // effective temperature from GSP-Phot pipeline, Kelvin
}

export const GaiaAstrometricRecordSchema = z.object({
  sourceId: z.string().min(1),
  ra: z.number().min(0).max(360),
  dec: z.number().min(-90).max(90),
  parallaxMas: z.number(), // can legitimately be near-zero or slightly negative for distant/noisy sources
  pmraMasYr: z.number(),
  pmdecMasYr: z.number(),
  photGMeanMag: z.number(),
  bpRp: z.number(),
  teffGspphotK: z.number().positive()
});

// Joined cross-matched record consumed by CoordinateTransformer
export interface CrossMatchedRecord {
  exoplanet: RawExoplanetRecord;
  gaiaMatch: GaiaAstrometricRecord | null;
  matchSeparationArcsec: number | null;
}

// Normalized production domain model
export interface ExoplanetSystem {
  id: string;
  planetName: string;
  hostName: string;
  coordinates: {
    ra: number;
    dec: number;
    distancePc: number;
    distanceLy: number;
    galacticX: number;
    galacticY: number;
    galacticZ: number;
  };
  stellarPhysics: {
    teffKelvin: number;
    radiusSolar: number;
    massSolar: number;
    spectralType: string;
    luminositySolar: number;
    colorHex: string;
  };
  planetaryPhysics: {
    radiusEarth: number;
    radiusKm: number;
    periodDays: number;
    semiMajorAxisAU: number;
    transitDepthPercent: number;
    transitDurationHours: number;
    equilibriumTempKelvin: number;
    habitableZoneClass: 'OPTIMAL_HABITABLE' | 'TOO_HOT' | 'TOO_COLD' | 'GAS_GIANT_NON_TERRESTRIAL';
  };
  gaiaAstrometry?: {
    sourceId: string;
    parallaxMas: number;
    photGMeanMag: number;
    bpRp: number;
  };
}
