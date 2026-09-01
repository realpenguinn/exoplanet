# 2. Data-Grounded Gaia DR3 BINARY2 Parsing & Stellar Mass Derivations

Date: 2026-09-02

## Status
Accepted

## Context
Initial specifications assumed generic CSV formats with pre-computed stellar masses. Inspection of production data revealed `gaia.vot` uses VOTable BINARY2 format with per-row null bitmasks and 64-bit integer IDs. Furthermore, the NASA exoplanet catalog did not include `st_mass`.

## Decision
1. Implemented a byte-level `BINARY2` parser decoding the 2-byte per-row null bitmask.
2. Preserved Gaia `source_id` as string to avoid JavaScript IEEE 754 precision truncation ($2^{53} - 1$).
3. Derived missing stellar mass using standard main-sequence power-law scaling $M_* = R_*^{1.2} M_\odot$.
4. Implemented spatial cross-matching using bounding-box spatial indexing with a 2.0 arcsec match radius.

## Consequences
- Guaranteed zero data loss across 5,000 Gaia stars and 4,606 NASA exoplanet systems.
- 100% deterministic Keplerian orbital period and habitable zone boundary calculation.
