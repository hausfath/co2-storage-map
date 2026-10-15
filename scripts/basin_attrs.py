#!/usr/bin/env python3
"""Basin panel attributes, shared by build_basins.py and the in-place refresh.

Standard library only. `research_props(row)` turns a basin_capacity.json row
into feature properties; `usgs_props(code)` builds a basin straight from the
USGS 2013 assessment (DS 774 Table 1 extract, data/research/usgs_ds774_saus.json).
Any row with a `usgs_code` also gets its USGS formation list, so US basins list
their formations even where USGS published no SAU polygons (Williston).

Run directly to refresh data/geo/geometry_basins.js attributes from the research
files without touching geometry (no geopandas needed):
    python3 scripts/basin_attrs.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESEARCH = ROOT / "data" / "research"
GEO = ROOT / "data" / "geo"

DS774 = json.loads((RESEARCH / "usgs_ds774_saus.json").read_text())
USGS_BASINS = DS774["basins"]
VARIANT_RE = re.compile(r"^(.*?)(?:\s+(Deep|Shallow|Updip|Downdip))?$")
USGS_TIER = "technically accessible (USGS 2013)"
USGS_NQ_TIER = "USGS 2013: assessed, capacity not quantified"
USGS_SRC = "USGS National Assessment 2013 (Data Series 774)"

# CO2StoP-reconstructed EU basins carry this outline caveat after their note.
CO2STOP_OUTLINE = ("Outline shows the extent of CO2StoP-assessed formations grouped to this "
                   "basin, not a structural basin boundary.")


def formation_breakdown(code):
    """Group a USGS basin's SAUs by formation; 'X' + 'X Deep' become one entry."""
    roots = {}
    for s in DS774["saus"]:
        if s["basin_code"] != code:
            continue
        name = re.sub(r"\s*\((NQ|non-quantitative)\)\s*$", "", s["sau_name"], flags=re.I)
        m = VARIANT_RE.match(name)
        root, variant = m.group(1).strip(), (m.group(2) or "main")
        r = roots.setdefault(root, {"formation": root, "variants": []})
        r["variants"].append({"variant": variant, "tasr_mean_mt": s["tasr_mean_mt"],
                              "depth_ft": s["depth_ml_ft"]})
    out = []
    for r in roots.values():
        vals = [v["tasr_mean_mt"] for v in r["variants"] if v["tasr_mean_mt"] is not None]
        r["tasr_mean_mt"] = round(sum(vals), 1) if vals else None
        out.append(r)
    out.sort(key=lambda r: -(r["tasr_mean_mt"] or 0))
    return out


def usgs_capacity(code):
    """USGS's own basin aggregate (Gt): low = P5, mid = mean, high = P95."""
    b = USGS_BASINS[code]
    gt = lambda k: round(b[k] / 1000, 2) if b.get(k) is not None else None
    return {"low": gt("tasr_p5_mt"), "mid": gt("tasr_mean_mt"), "high": gt("tasr_p95_mt")}


def usgs_props(code, name=None):
    cap = usgs_capacity(code)
    return {"basin": name or USGS_BASINS[code]["usgs_basin"], "countries": ["USA"],
            "cap_low_gt": cap["low"], "cap_mid_gt": cap["mid"], "cap_high_gt": cap["high"],
            "tier": USGS_TIER if cap["mid"] is not None else USGS_NQ_TIER,
            "onshore_offshore": "onshore & state waters (US)",
            "src": USGS_SRC, "notes": "", "usgs_code": code,
            "formations": formation_breakdown(code)}


def research_props(b, layer=None):
    cap = b.get("capacity_gt") or {}
    notes = b.get("notes") or ""
    if layer == "co2stop_reconstructed":
        notes = (notes + " " + CO2STOP_OUTLINE).strip()
    props = {"basin": b["basin"], "countries": b.get("countries"),
             "cap_low_gt": cap.get("low"), "cap_mid_gt": cap.get("mid"),
             "cap_high_gt": cap.get("high"), "tier": b.get("tier"),
             "onshore_offshore": b.get("onshore_offshore"),
             "src": b.get("source"), "notes": notes}
    if b.get("alt_estimates"):
        props["alt_estimates"] = b["alt_estimates"]
    if b.get("usgs_code"):
        props["usgs_code"] = b["usgs_code"]
        props["formations"] = formation_breakdown(b["usgs_code"])
    return props


# Map-feature names that differ from the research row they come from.
DISPLAY_TO_RESEARCH = {"Williston Basin": "Williston Basin (US)"}
# usgs_saus_new features are named by the USGS geometry service; DS 774 Table 1
# uses slightly different names for a few basins.
GEO_TO_DS774 = {"Anadarko-Southern Oklahoma Basins": "Anadarko and Southern Oklahoma Basins",
                "Southwestern Wyoming Province": "Greater Green River Basin",
                "Eastern Oregon-Washington Basin": "Columbia Basin of Oregon, Washington, and Idaho",
                "Western Oregon-Washington Basins": "Western Oregon and Washington Basins",
                "U.S. Gulf Coast": "U.S. Gulf Coast"}


def code_for_usgs_name(name):
    want = GEO_TO_DS774.get(name, name)
    for code, b in USGS_BASINS.items():
        if b["usgs_basin"] == want:
            return code
    raise KeyError(f"no DS 774 basin named {want!r}")


# Set by geometry steps in build_basins.py after the attributes above: EU
# CO2StoP units attached to a basin, and Williston's cross-border countries.
BUILD_SET_KEYS = ("units", "countries")


def refresh_features(features, research_rows):
    """Re-derive attributes for existing features in place (geometry untouched)."""
    by_name = {b["basin"]: b for b in research_rows}
    n = 0
    for f in features:
        p = f["properties"]
        layer = p.get("_layer")
        if p.get("unit"):
            continue
        if layer == "usgs_saus_new":
            new = usgs_props(code_for_usgs_name(p["basin"]), p["basin"])
        else:
            row = by_name.get(DISPLAY_TO_RESEARCH.get(p["basin"], p["basin"]))
            if row is None:      # research row renamed since the last build
                row = next((r for r in research_rows
                            if p["basin"] in (r.get("match_names") or []) + [r.get("basin_research")]), None)
            if row is None:
                raise KeyError(f"feature {p['basin']!r} has no research row")
            new = research_props(row, layer)
            if p["basin"] in DISPLAY_TO_RESEARCH:          # keep deliberate display names
                new["basin"] = p["basin"]
        new["_layer"] = layer
        # keep attributes set by later geometry steps of build_basins.py
        for k in BUILD_SET_KEYS:
            # units always come from the geometry step; countries only for the
            # deliberately renamed cross-border Williston feature
            if k in p and (k != "countries" or p["basin"] in DISPLAY_TO_RESEARCH):
                new[k] = p[k]
        f["properties"] = new
        n += 1
    return n


def main():
    path = GEO / "geometry_basins.js"
    txt = path.read_text()
    head, body = txt.split("window.GEO_BASINS = ", 1)
    fc = json.loads(body.rstrip().rstrip(";"))
    rows = json.loads((RESEARCH / "basin_capacity.json").read_text())
    n = refresh_features(fc["features"], rows)
    path.write_text(head + f"window.GEO_BASINS = {json.dumps(fc, separators=(',', ':'))};\n")
    print(f"refreshed {n} basin features in {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
