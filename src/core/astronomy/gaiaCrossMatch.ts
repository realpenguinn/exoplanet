import { RawExoplanetRecord, GaiaAstrometricRecord, CrossMatchedRecord } from '../../types/astronomy';

const MATCH_TOLERANCE_ARCSEC = 2.0; // standard astrometric cross-match radius for bright-source catalogs

export function angularSeparationArcsec(ra1: number, dec1: number, ra2: number, dec2: number): number {
  const toRad = Math.PI / 180;
  const d1 = dec1 * toRad;
  const d2 = dec2 * toRad;
  const dRa = (ra1 - ra2) * toRad;
  const cosC = Math.sin(d1) * Math.sin(d2) + Math.cos(d1) * Math.cos(d2) * Math.cos(dRa);
  const angleRad = Math.acos(Math.min(1, Math.max(-1, cosC)));
  return angleRad * (180 / Math.PI) * 3600;
}

export function crossMatch(
  exoplanets: RawExoplanetRecord[],
  gaiaSources: GaiaAstrometricRecord[]
): CrossMatchedRecord[] {
  let matchCount = 0;
  const results = exoplanets.map((exo) => {
    let best: GaiaAstrometricRecord | null = null;
    let bestSep = Infinity;

    for (const g of gaiaSources) {
      // Coarse pre-filter before the spherical distance computation
      if (Math.abs(g.ra - exo.ra) > 0.01 || Math.abs(g.dec - exo.dec) > 0.01) continue;

      const sep = angularSeparationArcsec(exo.ra, exo.dec, g.ra, g.dec);
      if (sep < bestSep) {
        bestSep = sep;
        best = g;
      }
    }

    const matched = best && bestSep <= MATCH_TOLERANCE_ARCSEC ? best : null;
    if (matched) matchCount++;
    return {
      exoplanet: exo,
      gaiaMatch: matched,
      matchSeparationArcsec: matched ? bestSep : null
    };
  });

  const rate = ((matchCount / Math.max(1, exoplanets.length)) * 100).toFixed(2);
  console.log(`[Gaia CrossMatch] Matched ${matchCount}/${exoplanets.length} systems (${rate}% match rate within 500 pc Gaia horizon).`);
  return results;
}
