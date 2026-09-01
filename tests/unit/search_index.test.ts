import { describe, it, expect } from 'vitest';
import { SearchIndexEngine } from '../../src/core/data/SearchIndex';
import { CoordinateTransformer } from '../../src/core/astronomy/coordinates';
import { RawExoplanetRecord } from '../../src/types/astronomy';
import rawCatalogData from '../../src/assets/data/exoplanet_catalog.json';

describe('SearchIndexEngine Sub-2ms Performance & Accuracy', () => {
  const systems = (rawCatalogData as RawExoplanetRecord[]).map((r, i) =>
    CoordinateTransformer.transformRecord(r, i)
  );
  const index = new SearchIndexEngine();
  index.indexSystems(systems);

  it('indexes all systems correctly', () => {
    expect(index.getSystemCount()).toBe(systems.length);
    expect(index.getSystemCount()).toBeGreaterThan(4000);
  });

  it('executes search queries within 2ms Phase 0 NFR latency budget', () => {
    const queries = ['kepler', 'hd', 'wasp', 'hat', 'k2'];

    for (const q of queries) {
      const t0 = performance.now();
      const results = index.search(q, 8);
      const t1 = performance.now();
      const latencyMs = t1 - t0;

      expect(latencyMs).toBeLessThan(2.0);
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(8);
    }
  });

  it('finds Kepler-186 f and matches case-insensitively', () => {
    const res = index.search('kEplEr-186 F', 5);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].planetName.toLowerCase()).toContain('kepler-186 f');
  });

  it('returns empty array on empty or whitespace query', () => {
    expect(index.search('')).toEqual([]);
    expect(index.search('   ')).toEqual([]);
  });
});
