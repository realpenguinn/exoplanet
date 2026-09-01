# CosmoScan Scheduled Ingestion & Drift Detection Protocol

## Nightly Automation Workflow
NASA Exoplanet Archive TAP updates occur continuously as new papers and missions are processed. To maintain catalog currency without violating API fair use:

```yaml
# .github/workflows/scheduled_ingest.yml
name: Scheduled Ingest
on:
  schedule:
    - cron: '0 6 * * *' # Every day at 06:00 UTC
  workflow_dispatch:

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Run NASA TAP ETL
        run: python scripts/ingest_nasa_data.py
```

## Drift Detection Threshold
The ingestion script calculates the differential record count $\Delta N = |N_{\text{new}} - N_{\text{current}}| / N_{\text{current}}$.
- If $\Delta N > 0.05$ ($> 5\%$ change), the pipeline aborts with exit code 1 to guard against partial catalog returns or unannounced TAP schema changes.
- If schema validation fails on any record via the Zod schema boundary, the build is blocked.
