import { describe, it, expect } from 'vitest';
import gaiaParsed from '../../scripts/output/gaia_parsed.json';

describe('Gaia BINARY2 Parser Output Integrity', () => {
  it('decodes no more than the TOP 5000 query ceiling', () => {
    expect((gaiaParsed as unknown[]).length).toBeLessThanOrEqual(5000);
    expect((gaiaParsed as unknown[]).length).toBe(5000);
  });

  it('preserves source_id precision as a string, not a lossy number', () => {
    const sample = (gaiaParsed as { source_id: string }[])[0];
    expect(typeof sample.source_id).toBe('string');
    expect(sample.source_id.length).toBeGreaterThan(15); // Gaia DR3 IDs are ~19 digits
  });

  it('never produces NaN for a non-null teff_gspphot field', () => {
    const withTeff = (gaiaParsed as { teff_gspphot: number | null }[]).filter(r => r.teff_gspphot !== null);
    expect(withTeff.length).toBeGreaterThan(0);
    for (const r of withTeff) {
      expect(Number.isFinite(r.teff_gspphot)).toBe(true);
    }
  });
});
