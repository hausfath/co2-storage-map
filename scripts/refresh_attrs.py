#!/usr/bin/env python3
"""Refresh panel attributes in the generated geometry files from data/research/.

Standard library only (no geopandas): geometry is untouched, only the text and
capacity attributes that build_basins.py / build_geo.py copy from the research
files are re-derived. Run after editing research text, then build_bundle.py:
    python3 scripts/refresh_attrs.py && python3 scripts/build_bundle.py
"""
import json
import re
from pathlib import Path

import basin_attrs

ROOT = Path(__file__).resolve().parent.parent
RESEARCH = ROOT / "data" / "research"
GEO = ROOT / "data" / "geo"

# Same field mapping as fprops() in build_geo.py.
ISM_FIELDS = {"cap_basis": "capacity_basis", "suitability": "suitability_notes",
              "activity": "existing_activity", "depth": "depth_porosity_notes",
              "src": "source"}


def fid(name):
    return re.sub(r"\W+", "_", name.lower())[:40]


def refresh_ism():
    path = GEO / "geometry_ism.js"
    txt = path.read_text()
    forms = {fid(f["name"]): f for f in
             json.loads((RESEARCH / "mineralization_capacity.json").read_text())["formations"]}
    n = 0

    def patch(m):
        nonlocal n
        fc = json.loads(m.group(2))
        for f in fc["features"]:
            p = f["properties"]
            src = forms.get(p.get("fid")) if p.get("matched") else None
            if src is None:
                continue
            cap = src.get("capacity_gt") or {}
            p.update({k: src.get(v) for k, v in ISM_FIELDS.items()})
            p.update({"cap_low_gt": cap.get("low"), "cap_mid_gt": cap.get("mid"),
                      "cap_high_gt": cap.get("high")})
            if src.get("alt_estimates"):
                p["alt_estimates"] = src["alt_estimates"]
            else:
                p.pop("alt_estimates", None)
            n += 1
        return f"{m.group(1)}{json.dumps(fc, separators=(',', ':'))};"

    txt = re.sub(r"(window\.GEO_ISM_\w+ = )(\{.*?\});(?=\n)", patch, txt, flags=re.S)
    path.write_text(txt)
    print(f"refreshed {n} matched ISM features in {path.relative_to(ROOT)}")


def refresh_countries():
    """Country choropleth attributes, mirroring the country block of build_geo.py."""
    path = GEO / "geometry_injection.js"
    txt = path.read_text()
    rows = {c["iso3"]: c for c in
            json.loads((RESEARCH / "sedimentary_capacity.json").read_text())["countries"]}
    m = re.search(r"(window\.GEO_COUNTRIES = )(\{.*?\});(?=\n)", txt, flags=re.S)
    fc = json.loads(m.group(2))
    n = 0
    for f in fc["features"]:
        p = f["properties"]
        c = rows.get(p.get("iso3"))
        for k in ("cap_low_gt", "cap_high_gt", "tier", "src", "basins", "cap_notes"):
            p.pop(k, None)
        p["cap_pref_gt"] = None
        if c:
            cap = c.get("capacity_gt") or {}
            p.update({"cap_pref_gt": c.get("preferred_estimate_gt"),
                      "cap_low_gt": cap.get("low"), "cap_high_gt": cap.get("high"),
                      "tier": c.get("tier"), "src": c.get("preferred_source"),
                      "basins": c.get("key_basins"), "cap_notes": c.get("notes")})
            n += 1
    txt = txt[:m.start()] + m.group(1) + json.dumps(fc, separators=(",", ":")) + ";" + txt[m.end():]
    path.write_text(txt)
    print(f"refreshed {n} countries in {path.relative_to(ROOT)}")


if __name__ == "__main__":
    basin_attrs.main()
    refresh_ism()
    refresh_countries()
