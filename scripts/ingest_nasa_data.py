#!/usr/bin/env python3
import sys
import json
import os
import urllib.parse
import urllib.request

TAP_ENDPOINT = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
ADQL_QUERY = """
SELECT
    pl_name, hostname, ra, dec, sy_dist,
    pl_rade, pl_orbper, pl_trandep,
    st_teff, st_rad
FROM ps
WHERE default_flag = 1
  AND tran_flag = 1
  AND pl_rade IS NOT NULL
  AND sy_dist IS NOT NULL
  AND pl_orbper IS NOT NULL
ORDER BY sy_dist ASC
"""

def execute_etl():
    print("[ETL] Initiating TAP query to NASA Exoplanet Archive...")
    params = {"query": ADQL_QUERY, "format": "json"}
    encoded_url = f"{TAP_ENDPOINT}?{urllib.parse.urlencode(params)}"

    req = urllib.request.Request(encoded_url, headers={"User-Agent": "CosmoScan-AstroEngine/1.0"})

    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            raw_data = json.loads(response.read().decode('utf-8'))
            print(f"[ETL] Successfully downloaded {len(raw_data)} records.")
    except Exception as e:
        print(f"[WARN] Live TAP connection failed ({e}). Checking local fallback...", file=sys.stderr)
        return

    clean_records = []
    dropped_count = 0

    for row in raw_data:
        try:
            ra = float(row.get('ra'))
            dec = float(row.get('dec'))
            dist = float(row.get('sy_dist'))
            rade = float(row.get('pl_rade'))
            period = float(row.get('pl_orbper'))

            if dist <= 0 or rade <= 0 or period <= 0:
                dropped_count += 1
                continue

            clean_records.append({
                "pl_name": str(row.get('pl_name')).strip(),
                "hostname": str(row.get('hostname')).strip(),
                "ra": ra,
                "dec": dec,
                "sy_dist": dist,
                "pl_rade": rade,
                "pl_orbper": period,
                "pl_trandep": float(row['pl_trandep']) if row.get('pl_trandep') is not None else None,
                "st_teff": float(row['st_teff']) if row.get('st_teff') is not None else None,
                "st_rad": float(row['st_rad']) if row.get('st_rad') is not None else None,
            })
        except (ValueError, TypeError):
            dropped_count += 1
            continue

    print(f"[ETL] Cleaned dataset contains {len(clean_records)} valid systems (Dropped {dropped_count}).")

    output_path = "src/assets/data/exoplanet_catalog.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(clean_records, f, separators=(',', ':'))

    print(f"[ETL] Serialized production catalog to {output_path} ({len(clean_records)} items).")

if __name__ == "__main__":
    execute_etl()
