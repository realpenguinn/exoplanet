import { describe, it, expect } from 'vitest';
import { CoordinateTransformer } from '../../src/core/astronomy/coordinates';
import { RawExoplanetRecord, RawExoplanetRecordSchema } from '../../src/types/astronomy';

describe('CoordinateTransformer & Astrometric Physics', () => {
  const mockKepler186f: RawExoplanetRecord = {
    pl_name: 'Kepler-186 f',
    hostname: 'Kepler-186',
    ra: 298.65,
    dec: 44.62,
    sy_dist: 178.5,
    pl_rade: 1.17,
    pl_orbper: 129.944,
    pl_trandep: 0.05,
    st_teff: 3788,
    st_rad: 0.52
  };

  it('correctly maps 3D Galactocentric coordinates without NaN values', () => {
    const system = CoordinateTransformer.transformRecord(mockKepler186f, 0);
    expect(system.coordinates.galacticX).toBeGreaterThan(0);
    expect(Number.isFinite(system.coordinates.galacticX)).toBe(true);
    expect(Number.isFinite(system.coordinates.galacticY)).toBe(true);
    expect(Number.isFinite(system.coordinates.galacticZ)).toBe(true);
  });

  it('correctly categorizes Kepler-186 f as OPTIMAL_HABITABLE', () => {
    const system = CoordinateTransformer.transformRecord(mockKepler186f, 0);
    expect(system.planetaryPhysics.habitableZoneClass).toBe('OPTIMAL_HABITABLE');
    expect(system.planetaryPhysics.radiusEarth).toBe(1.17);
  });

  it('computes accurate photometric transit depth matches', () => {
    const system = CoordinateTransformer.transformRecord(mockKepler186f, 0);
    expect(system.planetaryPhysics.transitDepthPercent).toBeCloseTo(0.05, 2);
  });

  it('falls back to theoretical transit depth (Rp/R*)^2 when pl_trandep is null', () => {
    const nullDipRecord = { ...mockKepler186f, pl_trandep: null };
    const system = CoordinateTransformer.transformRecord(nullDipRecord, 1);
    expect(system.planetaryPhysics.transitDepthPercent).toBeGreaterThan(0);
    expect(Number.isFinite(system.planetaryPhysics.transitDepthPercent)).toBe(true);
  });

  it('validates valid records and rejects malformed schema input', () => {
    const parseSuccess = RawExoplanetRecordSchema.safeParse(mockKepler186f);
    expect(parseSuccess.success).toBe(true);

    const malformed = { ...mockKepler186f, ra: 'invalid_angle' };
    const parseFail = RawExoplanetRecordSchema.safeParse(malformed);
    expect(parseFail.success).toBe(false);
  });
});
