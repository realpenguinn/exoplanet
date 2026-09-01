# Phase 2 (Revised): Data Ingestion Pipeline, Gaia Cross-Match & Coordinate Conversion
## Grounded in Actual Reference Files: `exoplanet_catalog.json` + `gaia.vot`

This replaces the original Phase 2 in the master execution document. The original assumed a `RawExoplanetRecord` shape with `st_mass` and `st_spectype` always present, and assumed the Gaia cross-match was a trivial row-parse. Neither is true of the real data. This revision is written against the **actual observed schema and null distribution** of the two uploaded reference files, not an idealized one.

---

## Phase Objective

Build a deterministic ETL pipeline that (a) ingests the exoplanet catalog exactly as NASA's TAP export actually shapes it — 10 fields, no stellar mass, no spectral type, 84% of transit depths missing — (b) parses the Gaia DR3 `BINARY2`-encoded VOTable to extract astrometric cross-match data, (c) joins the two on sky position, and (d) produces the same `ExoplanetSystem` output contract the rest of the app depends on, with every fallback now sized to the real null rates instead of guessed ones.

```
+-------------------------------------------------------------------------------+
|                    ACTUAL REFERENCE DATA SHAPES (OBSERVED)                    |
+-------------------------------------------------------------------------------+
| exoplanet_catalog.json                                                        |
|   4,606 records | 10 fields | NO st_mass | NO st_spectype                     |
|   pl_trandep null: 84% (3,864/4,606)  st_teff null: 2.4%  st_rad null: 0.6%   |
+--------------------------------------+----------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                    gaia.vot  (ESA Gaia Archive TAP Export)                    |
|   ~5,000 rows (TOP 5000) | BINARY2 + base64 encoded, not TABLEDATA           |
|   WHERE parallax > 2.0 AND teff_gspphot IS NOT NULL                          |
|   ORDER BY phot_g_mean_mag ASC (brightest first)                             |
|   Fields: source_id, ra, dec, parallax, pmra, pmdec,                          |
|           phot_g_mean_mag, bp_rp, teff_gspphot                                |
+-------------------------------------------------------------------------------+
```

---

## Task 2.1 (Revised): Data Contract Matching the Real Schema

The original `RawExoplanetRecord` interface listed `st_mass: number | null` and `st_spectype: string | null` as if they always arrived from the source. They don't exist in the actual catalog at all — not "null," genuinely **absent keys**. Fix the type to reflect reality, and make the downstream physics engine derive what it needs instead of expecting it to be handed over:

```typescript
// src/types/astronomy.ts

// Matches exoplanet_catalog.json exactly as observed — 10 fields, no more.
export interface RawExoplanetRecord {
  pl_name: string;
  hostname: string;
  ra: number;
  dec: number;
  sy_dist: number;
  pl_rade: number;
  pl_orbper: number;
  pl_trandep: number | null;   // null in ~84% of real records — treat as the common case
  st_teff: number | null;      // null in ~2.4% of real records
  st_rad: number | null;       // null in ~0.6% of real records
  // st_mass and st_spectype DO NOT EXIST in the source file.
  // Do not declare them here — derive them in CoordinateTransformer instead
  // (Task 2.3), so the type system can't lie about what the ETL actually receives.
}

// Matches gaia.vot's <FIELD> definitions exactly.
export interface GaiaAstrometricRecord {
  sourceId: string;        // source_id, Gaia DR3 unique identifier (BIGINT — keep as string, don't coerce to number)
  ra: number;               // deg, ICRS, epoch J2016.0
  dec: number;               // deg, ICRS, epoch J2016.0
  parallaxMas: number;      // milliarcseconds; distance_pc ~= 1000 / parallaxMas
  pmraMasYr: number;        // proper motion in RA, mas/yr
  pmdecMasYr: number;       // proper motion in Dec, mas/yr
  photGMeanMag: number;     // Gaia G-band apparent magnitude
  bpRp: number;              // BP-RP color index (blue minus red magnitude)
  teffGspphotK: number;     // effective temperature from GSP-Phot pipeline, Kelvin
}

// The joined, cross-matched record consumed by CoordinateTransformer.
export interface CrossMatchedRecord {
  exoplanet: RawExoplanetRecord;
  gaiaMatch: GaiaAstrometricRecord | null; // null when no sky match found within tolerance
  matchSeparationArcsec: number | null;
}
```

Add the Zod runtime companions for both `RawExoplanetRecord` and `GaiaAstrometricRecord` — this is what actually stops a schema-drift incident (Risk #1 from the Phase 0 risk register) rather than just documenting the risk. Since `pl_trandep`, `st_teff`, and `st_rad` are genuinely nullable in the real data, the Zod schema must use `.nullable()`, not `.optional()` — the key is always present, its value is sometimes `null`, and those are different failure modes to validate against.

```typescript
import { z } from 'zod';

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

export const GaiaAstrometricRecordSchema = z.object({
  sourceId: z.string().min(1),
  ra: z.number().min(0).max(360),
  dec: z.number().min(-90).max(90),
  parallaxMas: z.number(),          // can legitimately be near-zero or slightly negative for distant/noisy sources
  pmraMasYr: z.number(),
  pmdecMasYr: z.number(),
  photGMeanMag: z.number(),
  bpRp: z.number(),
  teffGspphotK: z.number().positive()
});
```

---

## Task 2.2 (Revised): Gaia `BINARY2` VOTable Parser

The original pipeline implicitly assumed a `<TABLEDATA>` block of plain `<TR><TD>` rows, which is the simple, human-readable VOTable serialization. The actual `gaia.vot` file uses `BINARY2` — a compact, base64-encoded binary row format wrapped in `<STREAM encoding='base64'>`. This is what the real Gaia TAP service returns by default, so the parser has to handle it, not the simplified format.

`BINARY2` row layout, derived directly from the file's own `<FIELD>` declarations (in table order):

| Field | VOTable datatype | Bytes | Notes |
|---|---|---|---|
| `source_id` | `long` | 8 | Java-style big-endian signed 64-bit int |
| `ra` | `double` | 8 | IEEE 754 big-endian |
| `dec` | `double` | 8 | IEEE 754 big-endian |
| `parallax` | `double` | 8 | IEEE 754 big-endian |
| `pmra` | `double` | 8 | IEEE 754 big-endian |
| `pmdec` | `double` | 8 | IEEE 754 big-endian |
| `phot_g_mean_mag` | `float` | 4 | IEEE 754 big-endian |
| `bp_rp` | `float` | 4 | IEEE 754 big-endian |
| `teff_gspphot` | `float` | 4 | IEEE 754 big-endian |

`BINARY2` additionally prefixes **each row** with a null-bitmask (one bit per field, packed into `ceil(nFields / 8)` bytes) before the field bytes themselves — this is the detail most naive parsers miss, and skipping it silently misaligns every row after the first one that contains a null.

```python
# scripts/parse_gaia_binary2.py
import base64
import struct
import re
import math

def extract_stream(vot_path: str) -> bytes:
    with open(vot_path, 'r', encoding='utf-8') as f:
        content = f.read()
    match = re.search(r"<STREAM[^>]*>(.*?)</STREAM>", content, re.DOTALL)
    if not match:
        raise ValueError("No <STREAM> block found — is this really a BINARY2 VOTable?")
    b64_payload = match.group(1).strip()
    return base64.b64decode(b64_payload)

def parse_binary2(vot_path: str) -> list[dict]:
    raw = extract_stream(vot_path)

    # Field order and struct format codes, matching the <FIELD> declarations above.
    fields = [
        ("source_id", "q"),   # 8 bytes, signed long, big-endian
        ("ra", "d"),
        ("dec", "d"),
        ("parallax", "d"),
        ("pmra", "d"),
        ("pmdec", "d"),
        ("phot_g_mean_mag", "f"),
        ("bp_rp", "f"),
        ("teff_gspphot", "f"),
    ]
    n_fields = len(fields)
    null_bitmask_bytes = math.ceil(n_fields / 8)

    rows = []
    offset = 0
    while offset < len(raw):
        # 1. Read and skip the per-row null bitmask.
        bitmask = raw[offset: offset + null_bitmask_bytes]
        offset += null_bitmask_bytes

        row = {}
        for i, (name, fmt) in enumerate(fields):
            byte_index = i // 8
            bit_index = 7 - (i % 8)
            is_null = bool(bitmask[byte_index] & (1 << bit_index)) if byte_index < len(bitmask) else False

            size = struct.calcsize(">" + fmt)
            chunk = raw[offset: offset + size]
            offset += size

            if is_null or len(chunk) < size:
                row[name] = None
            else:
                row[name] = struct.unpack(">" + fmt, chunk)[0]

        rows.append(row)

    return rows

if __name__ == "__main__":
    records = parse_binary2("gaia.vot")
    print(f"[Gaia Parser] Decoded {len(records)} astrometric records.")
    print(f"[Gaia Parser] Sample: {records[0]}")
```

Note the `source_id` decode: Gaia source IDs exceed JavaScript's safe integer range (they're ~19-digit numbers), so once this crosses into the TypeScript side, keep it as a `string`, never a `number` — this is why `GaiaAstrometricRecord.sourceId` above is typed `string`, not `number`. Convert in Python with `str(source_id)` before serializing to the intermediate JSON this script hands off to the TypeScript build step.

---

## Task 2.3 (Revised): Cross-Match Join & Real-Null-Rate Fallback Physics

With `pl_trandep` missing in 84% of real records, the theoretical transit-depth formula `(Rp/R*)²` isn't a rare fallback — treat it as the default computation and `pl_trandep` as a rare **override** used only when present, and say so explicitly in code comments so a future maintainer doesn't "simplify" it into an edge case handler later.

Sky cross-match: join each exoplanet host star to its nearest Gaia source by angular separation, since neither file carries a shared ID:

```typescript
// src/core/astronomy/gaiaCrossMatch.ts
import { RawExoplanetRecord, GaiaAstrometricRecord, CrossMatchedRecord } from '../../types/astronomy';

const MATCH_TOLERANCE_ARCSEC = 2.0; // standard astrometric cross-match radius for bright-source catalogs

function angularSeparationArcsec(ra1: number, dec1: number, ra2: number, dec2: number): number {
  const toRad = Math.PI / 180;
  const d1 = dec1 * toRad, d2 = dec2 * toRad;
  const dRa = (ra1 - ra2) * toRad;
  const cosC = Math.sin(d1) * Math.sin(d2) + Math.cos(d1) * Math.cos(d2) * Math.cos(dRa);
  const angleRad = Math.acos(Math.min(1, Math.max(-1, cosC)));
  return angleRad * (180 / Math.PI) * 3600;
}

export function crossMatch(
  exoplanets: RawExoplanetRecord[],
  gaiaSources: GaiaAstrometricRecord[]
): CrossMatchedRecord[] {
  return exoplanets.map((exo) => {
    let best: GaiaAstrometricRecord | null = null;
    let bestSep = Infinity;

    for (const g of gaiaSources) {
      // Coarse pre-filter before the expensive trig call — real cross-match
      // pipelines always do this; without it, 4,606 x 5,000 = ~23M full
      // spherical-distance calculations run on every ingestion pass.
      if (Math.abs(g.ra - exo.ra) > 0.01 || Math.abs(g.dec - exo.dec) > 0.01) continue;

      const sep = angularSeparationArcsec(exo.ra, exo.dec, g.ra, g.dec);
      if (sep < bestSep) {
        bestSep = sep;
        best = g;
      }
    }

    const matched = best && bestSep <= MATCH_TOLERANCE_ARCSEC ? best : null;
    return {
      exoplanet: exo,
      gaiaMatch: matched,
      matchSeparationArcsec: matched ? bestSep : null
    };
  });
}
```

Because `gaia.vot` was queried with `parallax > 2.0` (i.e., only sources within ~500 pc), **most exoplanet hosts will not find a Gaia match** — many entries in `exoplanet_catalog.json` sit well beyond 500 pc (e.g., the sample record `Kepler-1812 b` at 1,409 pc). This is expected, not a bug: log the match rate after each ingestion run and treat anything wildly outside a sane range (e.g., under 5% or over 60%) as a signal to re-check the join tolerance, not proof the join is broken.

When a Gaia match exists, prefer its `teffGspphotK` over `st_teff` for cross-validation (log a `warn` if they disagree by more than 15%, per the observability logger from the master document's Phase 11) and use `parallaxMas` to derive an independent distance estimate — `distancePc ≈ 1000 / parallaxMas` — as a sanity check against `sy_dist`, without silently overwriting the archive-provided value.

Update `CoordinateTransformer.transformRecord` to accept the joined record and fall back correctly given the *real* null rates:

```typescript
public static transformRecord(cross: CrossMatchedRecord, index: number): ExoplanetSystem {
  const raw = cross.exoplanet;
  const gaia = cross.gaiaMatch;

  // st_mass never exists in source data — always derive it.
  const starRad = raw.st_rad && raw.st_rad > 0 ? raw.st_rad : 1.0;
  const starMass = Math.pow(starRad, 1.2); // mass-radius power law is now the ONLY path, not a fallback

  // st_teff is null ~2.4% of the time; prefer a real Gaia cross-match value when available.
  const starTeff = raw.st_teff && raw.st_teff > 0
    ? raw.st_teff
    : (gaia?.teffGspphotK ?? 5778.0);

  // pl_trandep is null ~84% of the time — this branch is the default, not the exception.
  // (theoreticalDipPercent computed exactly as in the original Task 2.2 formula)
  // ... existing (Rp/R*)^2 computation unchanged ...

  // st_spectype never exists in source data — always infer from temperature.
  const spectralType = this.inferSpectralType(starTeff);

  // ... remainder of the original transform logic, unchanged ...
}
```

---

## Phase 2 (Revised) Checkup & Quality Gate Verification

```
[Phase 2 Revised Checkup Matrix]
---------------------------------------------------------------------------------
ID      Verification Task                          Condition / Threshold         Status
---------------------------------------------------------------------------------
P2R-C1  Catalog Schema Match                        Type has exactly the 10       [PENDING]
                                                     observed fields; st_mass and
                                                     st_spectype are NOT declared
                                                     on RawExoplanetRecord
P2R-C2  Real Record Count                           Parsed count == 4,606         [PENDING]
P2R-C3  Null-Rate Assertion                         pl_trandep null rate is       [PENDING]
                                                     between 75% and 90% (catches
                                                     silent source-format changes)
P2R-C4  BINARY2 Row Alignment                       Decoded Gaia row count is     [PENDING]
                                                     consistent after a null-
                                                     bitmask field is hit (no
                                                     offset drift)
P2R-C5  Gaia Row Count                              Parsed Gaia rows <= 5,000     [PENDING]
                                                     (TOP 5000 query ceiling)
P2R-C6  source_id Precision                         sourceId round-trips as a     [PENDING]
                                                     string with no precision loss
                                                     (test against a value > 2^53)
P2R-C7  Cross-Match Sanity Bound                     Match rate logged and falls  [PENDING]
                                                     inside a documented sane
                                                     range, not silently assumed
P2R-C8  Fallback Comment Accuracy                    Code comments state pl_trandep[PENDING]
                                                     fallback is the default path,
                                                     not an edge case
---------------------------------------------------------------------------------
```

Verification script (`tests/unit/gaia_binary2_parser.test.ts` — TypeScript-side check against the Python parser's JSON output):

```typescript
import { describe, it, expect } from 'vitest';
import gaiaParsed from '../../scripts/output/gaia_parsed.json'; // produced by parse_gaia_binary2.py

describe('Gaia BINARY2 Parser Output Integrity', () => {
  it('decodes no more than the TOP 5000 query ceiling', () => {
    expect((gaiaParsed as unknown[]).length).toBeLessThanOrEqual(5000);
  });

  it('preserves source_id precision as a string, not a lossy number', () => {
    const sample = (gaiaParsed as { source_id: string }[])[0];
    expect(typeof sample.source_id).toBe('string');
    expect(sample.source_id.length).toBeGreaterThan(15); // Gaia DR3 IDs are ~19 digits
  });

  it('never produces NaN for a non-null teff_gspphot field', () => {
    const withTeff = (gaiaParsed as { teff_gspphot: number | null }[]).filter(r => r.teff_gspphot !== null);
    for (const r of withTeff) {
      expect(Number.isFinite(r.teff_gspphot)).toBe(true);
    }
  });
});
```

---

## Summary of What Changed vs. the Original Phase 2

| Assumption in original document | Reality in uploaded files | Fix applied here |
|---|---|---|
| `st_mass` always present | Field does not exist | Removed from type; always derived via mass-radius power law |
| `st_spectype` always present | Field does not exist | Removed from type; always inferred from `st_teff` |
| `pl_trandep` occasionally missing | Missing 84% of the time | Reframed as the default computation path, not a fallback |
| Gaia VOTable is simple `<TABLEDATA>` rows | Actual file is `BINARY2` + base64, with per-row null bitmasks | Full binary parser with explicit bitmask handling |
| Gaia `source_id` treated as a number | Exceeds JS safe integer range | Typed and carried as `string` end-to-end |
| Cross-match assumed implicit | No shared ID between the two files | Explicit angular-separation join with logged match-rate sanity check |
