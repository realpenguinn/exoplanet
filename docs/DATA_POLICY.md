# CosmoScan Data Refresh & Licensing Policy

## 1. Primary Data Sources
CosmoScan integrates confirmed astrophysical datasets from two primary public archives:
1. **NASA Exoplanet Archive (IPAC / Caltech)**:
   - Planetary Systems Composite Parameters Table (`ps`).
   - Filter criteria: `default_flag = 1`, `tran_flag = 1`, confirmed exoplanets with valid orbital period and sky coordinates.
2. **ESA Gaia DR3 (European Space Agency)**:
   - Gaia Data Release 3 Astrometric and Astrophysical Parameters (`gaia_source`).
   - Selected astrometry, proper motion, and effective stellar temperature ($T_{\text{eff}}$ from GSP-Phot pipeline).

## 2. Ingestion Cadence & Rate Limits
- **Scheduled Ingestion**: Synchronization queries to NASA's TAP server run via a scheduled background job no more than once every 24 hours (`0 6 * * *`), adhering to fair-use guidelines and eliminating unnecessary load on public scientific infrastructure.
- **Client Decoupling**: The web application client *never* calls the NASA TAP endpoint or ESA Gaia server directly at runtime. All records are ingested, cross-matched, sanitized, and bundled into a local static vector cache (`src/assets/data/exoplanet_catalog.json`).
- **Drift Threshold**: A $\pm 5\%$ threshold is enforced between sync runs. Any sudden deviation in record count halts deployment to prevent corrupted upstream data releases from reaching users.

## 3. Terms of Use & Mandatory Scientific Attribution
In compliance with NASA and ESA open-science data policies, CosmoScan prominently includes permanent attribution in the user interface footer and all generated dossiers:
- *"This research has made use of the NASA Exoplanet Archive, which is operated by the California Institute of Technology, under contract with the National Aeronautics and Space Administration under the Exoplanet Exploration Program."*
- *"This work has made use of data from the European Space Agency (ESA) mission Gaia (https://www.cosmos.esa.int/gaia), processed by the Gaia Data Processing and Analysis Consortium (DPAC)."*
