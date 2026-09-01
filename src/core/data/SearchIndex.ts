import { ExoplanetSystem } from '../../types/astronomy';

export class SearchIndexEngine {
  private systems: ExoplanetSystem[] = [];
  private lookupMap = new Map<string, ExoplanetSystem>();

  public indexSystems(dataset: ExoplanetSystem[]): void {
    this.systems = dataset;
    this.lookupMap.clear();
    for (const sys of dataset) {
      this.lookupMap.set(sys.id, sys);
      this.lookupMap.set(sys.planetName.toLowerCase(), sys);
      this.lookupMap.set(sys.hostName.toLowerCase(), sys);
    }
  }

  // Enforces Phase 0 NFR search budget: < 2ms latency per query
  public search(query: string, limit = 8): ExoplanetSystem[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: ExoplanetSystem[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < this.systems.length; i++) {
      const sys = this.systems[i];
      if (
        sys.planetName.toLowerCase().includes(q) ||
        sys.hostName.toLowerCase().includes(q)
      ) {
        if (!seen.has(sys.id)) {
          seen.add(sys.id);
          results.push(sys);
          if (results.length >= limit) break;
        }
      }
    }
    return results;
  }

  public getSystemCount(): number {
    return this.systems.length;
  }
}
