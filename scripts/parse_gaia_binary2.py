#!/usr/bin/env python3
import base64
import struct
import re
import math
import json
import os
import sys

def extract_stream(vot_path: str) -> bytes:
    with open(vot_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    match = re.search(r"<STREAM[^>]*>(.*?)</STREAM>", content, re.DOTALL)
    if not match:
        raise ValueError("No <STREAM> block found in VOTable.")
    b64_payload = match.group(1).strip()
    return base64.b64decode(b64_payload)

def parse_binary2(vot_path: str) -> list[dict]:
    raw = extract_stream(vot_path)

    # Field order and struct format codes, matching Gaia DR3 query declarations
    fields = [
        ("source_id", "q"),   # 8 bytes, signed long (64-bit int), big-endian
        ("ra", "d"),          # 8 bytes, double
        ("dec", "d"),         # 8 bytes, double
        ("parallax", "d"),    # 8 bytes, double
        ("pmra", "d"),        # 8 bytes, double
        ("pmdec", "d"),       # 8 bytes, double
        ("phot_g_mean_mag", "f"), # 4 bytes, float
        ("bp_rp", "f"),           # 4 bytes, float
        ("teff_gspphot", "f"),    # 4 bytes, float
    ]
    n_fields = len(fields)
    null_bitmask_bytes = math.ceil(n_fields / 8)

    rows = []
    offset = 0
    while offset < len(raw):
        if offset + null_bitmask_bytes > len(raw):
            break
        # Read the per-row null bitmask
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
                val = struct.unpack(">" + fmt, chunk)[0]
                # Convert source_id to string to avoid JavaScript IEEE 754 precision loss (> 2^53)
                if name == "source_id":
                    row[name] = str(val)
                elif isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
                    row[name] = None
                else:
                    row[name] = val

        rows.append(row)

    return rows

if __name__ == "__main__":
    vot_file = "gaia.vot"
    if not os.path.exists(vot_file):
        print(f"Error: {vot_file} not found.", file=sys.stderr)
        sys.exit(1)

    print(f"[Gaia Parser] Reading {vot_file}...")
    records = parse_binary2(vot_file)
    print(f"[Gaia Parser] Decoded {len(records)} astrometric records.")

    out_dir = os.path.join("scripts", "output")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "gaia_parsed.json")

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(records, f)

    print(f"[Gaia Parser] Serialized output to {out_file}.")
