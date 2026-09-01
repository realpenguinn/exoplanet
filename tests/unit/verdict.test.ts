import { describe, it, expect } from 'vitest';
import { ScientificVerdictEngine } from '../../src/core/physics/VerdictEngine';
import { CoordinateTransformer } from '../../src/core/astronomy/coordinates';
import { RawExoplanetRecord } from '../../src/types/astronomy';

describe('ScientificVerdictEngine Astrobiological Classification', () => {
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

  const mockHD209458b: RawExoplanetRecord = {
    pl_name: 'HD 209458 b',
    hostname: 'HD 209458',
    ra: 330.79,
    dec: 18.88,
    sy_dist: 48.3,
    pl_rade: 15.4,
    pl_orbper: 3.52,
    pl_trandep: 1.58,
    st_teff: 6065,
    st_rad: 1.20
  };

  it('correctly classifies Kepler-186 f as TERRESTRIAL_HABITABLE', () => {
    const sys = CoordinateTransformer.transformRecord(mockKepler186f, 0);
    const verdict = ScientificVerdictEngine.evaluateSystem(sys);

    expect(verdict.category).toBe('TERRESTRIAL_HABITABLE');
    expect(verdict.headline).toContain('Likely Habitable');
    expect(verdict.astrophysicalMetrics.calculatedRadiusEarth).toBeCloseTo(1.17, 2);
    expect(verdict.calculationDisclosure).toBeTruthy();
  });

  it('correctly classifies HD 209458 b as HOT_JUPITER', () => {
    const sys = CoordinateTransformer.transformRecord(mockHD209458b, 1);
    const verdict = ScientificVerdictEngine.evaluateSystem(sys);

    expect(verdict.category).toBe('HOT_JUPITER');
    expect(verdict.headline).toContain('Hot Jupiter');
    expect(verdict.astrophysicalMetrics.calculatedRadiusEarth).toBeCloseTo(15.4, 2);
  });

  it('enforces positive astrophysical metrics and transparent calculation citations', () => {
    const sys = CoordinateTransformer.transformRecord(mockKepler186f, 0);
    const verdict = ScientificVerdictEngine.evaluateSystem(sys);

    expect(verdict.astrophysicalMetrics.densityEstimateGcm3).toBeGreaterThan(0);
    expect(verdict.astrophysicalMetrics.stellarIrradianceRelative).toBeGreaterThan(0);
    expect(verdict.astrophysicalMetrics.atmosphericScaleHeightKm).toBeGreaterThan(0);
    expect(verdict.calculationDisclosure.length).toBeGreaterThan(15);
  });

  it('satisfies certainty language audit: no headline uses unsourced CONFIRMED', () => {
    const sys1 = CoordinateTransformer.transformRecord(mockKepler186f, 0);
    const sys2 = CoordinateTransformer.transformRecord(mockHD209458b, 1);

    expect(ScientificVerdictEngine.evaluateSystem(sys1).headline).not.toContain('CONFIRMED');
    expect(ScientificVerdictEngine.evaluateSystem(sys2).headline).not.toContain('CONFIRMED');
  });
});
