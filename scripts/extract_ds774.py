#!/usr/bin/env python3
"""Extract per-SAU capacity from USGS DS 774 Table 1 into data/research/usgs_ds774_saus.json.

Covers all 202 storage assessment units (SAUs), including the 11 with no
polygon in the USGS StudyAreas services (Williston, Kandik), so US basin
formation lists and totals do not depend on geometry availability.

Usage: python3 scripts/extract_ds774.py path/to/Table_1.xlsx
Table_1.xlsx: https://pubs.usgs.gov/ds/774/tables/Table_1.xlsx
Values are Technically Accessible Storage Resource (TASR), Mt CO2 (P5 < P95).
Each basin also carries USGS's "Aggregated totals" row, which USGS computed
with dependence between SAUs, so its P5-P95 is the proper basin range.
"""
import json
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "research" / "usgs_ds774_saus.json"


def num(x):
    return float(x) if isinstance(x, (int, float)) else None


def main():
    ws = openpyxl.load_workbook(sys.argv[1], read_only=True)["Comprehensive Data Table"]
    basins, rows, code = {}, [], None
    for r in ws.iter_rows(min_row=1, values_only=True):
        c = r[0]
        if isinstance(c, str):
            # basin header row, e.g. "Illinois Basin (C5064)", "U.S. Gulf Coast (C5047 and C5049)"
            m = re.match(r"^(.*?)\s*\((C\d{4})(?:\s+and\s+C\d{4})*\)$", c.strip())
            if m:
                code = m.group(2)
                basins[code] = {"usgs_basin": m.group(1)}
                continue
            if c.startswith("Aggregated totals") and code:
                # USGS's own basin aggregate (accounts for dependence between SAUs)
                basins[code].update({"tasr_p5_mt": num(r[78]), "tasr_p50_mt": num(r[79]),
                                     "tasr_p95_mt": num(r[80]), "tasr_mean_mt": num(r[81])})
                continue
        if not (c and str(c).startswith("C") and len(str(c)) == 9):
            continue
        name = re.sub(r"\s+", " ", str(r[1])).strip()
        mean = num(r[81])
        rows.append({
            # SAUs belong to the basin header above them (the Gulf Coast header
            # spans several province-code prefixes)
            "sau_code": str(c), "basin_code": code,
            "usgs_basin": basins[code]["usgs_basin"], "sau_name": name,
            "tasr_p5_mt": num(r[78]), "tasr_p50_mt": num(r[79]),
            "tasr_p95_mt": num(r[80]), "tasr_mean_mt": mean,
            "depth_ml_ft": num(r[50]),
            "non_quantitative": mean is None or "(NQ)" in name or "non-quantitative" in name.lower(),
        })
    out = {"source": "USGS Data Series 774 (Blondes et al. 2013), Table 1, "
                     "https://pubs.usgs.gov/ds/774/tables/Table_1.xlsx",
           "units": "Mt CO2, technically accessible storage resource (TASR); "
                    "basin rows are USGS 'Aggregated totals'",
           "basins": basins, "saus": rows}
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    tot = sum(r["tasr_mean_mt"] or 0 for r in rows) / 1000
    agg = sum(b.get("tasr_mean_mt") or 0 for b in basins.values()) / 1000
    print(f"{len(rows)} SAUs in {len(basins)} basins; SAU mean sum {tot:,.0f} Gt, "
          f"basin aggregate sum {agg:,.0f} Gt (USGS published ~3,000 Gt)")
    for k, b in basins.items():
        s_ = sum(r["tasr_mean_mt"] or 0 for r in rows if r["basin_code"] == k)
        if b.get("tasr_mean_mt") and abs(s_ - b["tasr_mean_mt"]) > 0.05 * b["tasr_mean_mt"]:
            print(f"  note: {b['usgs_basin']} SAU mean sum {s_:,.0f} vs aggregate {b['tasr_mean_mt']:,.0f} Mt")


if __name__ == "__main__":
    main()
