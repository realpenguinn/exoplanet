# CosmoScan Operational Runbook

This runbook documents operational procedures, incident response protocols, and telemetry inspection guidelines for operators and maintainers.

---

## 1. Procedure: Manual Ingestion Re-Trigger (TAP Sync Recovery)
If the automated nightly TAP sync fails due to network partition or NASA TAP maintenance:
1. Ensure Python 3.10+ is installed on the host or runner.
2. Execute the parser and ETL pipelines locally:
   ```bash
   python scripts/parse_gaia_binary2.py
   python scripts/ingest_nasa_data.py
   ```
3. Verify output integrity:
   - Check that `src/assets/data/exoplanet_catalog.json` contains $\ge 4,000$ records.
   - Run the Phase 2 checkup:
     ```bash
     node scripts/phase2_checkup.mjs
     ```
4. Rebuild the application bundle:
   ```bash
   pnpm build
   ```

---

## 2. Procedure: Emergency Deployment Rollback
If a deployment exhibits regressions or rendering failures in production:
1. **GitHub Actions Rollback**:
   - Revert the offending commit on branch `main`:
     ```bash
     git revert HEAD
     git push origin main
     ```
2. **Container Image Rollback**:
   - Re-tag and deploy the previous known-healthy Docker image:
     ```bash
     docker pull ghcr.io/cosmoscan/suite:previous-stable
     docker tag ghcr.io/cosmoscan/suite:previous-stable cosmoscan-suite:latest
     docker-compose up -d --force-recreate
     ```
3. **Smoke Test Verification**:
   - Confirm HTTP 200 on `/`.
   - Verify `#canvas3d` is visible and `#fallbackScreen` is hidden.
   - Confirm search combobox returns results for `Kepler-186 f`.

---

## 3. Procedure: Telemetry & Buffer Inspection (`logger.dumpBuffer()`)
CosmoScan maintains an in-memory ring buffer of the last 200 diagnostic events without recording any PII.
1. Open the browser Developer Tools Console (`F12`).
2. Run:
   ```javascript
   console.table(window.__COSMOSCAN_LOGGER__ ? window.__COSMOSCAN_LOGGER__.dumpBuffer() : []);
   ```
3. **Log Event Schema**:
   - `level`: `'debug' | 'info' | 'warn' | 'error'`
   - `scope`: Subsystem identifier (`'Bootstrap'`, `'Graphics'`, `'Performance'`, `'RenderLoop'`, `'Runtime'`)
   - `message`: Diagnostic statement
   - `timestamp`: ISO-8601 UTC timestamp
   - `context`: Sanitized numeric and structural data (e.g. `{ currentFPS: 54, sampleCount: 60 }`)
