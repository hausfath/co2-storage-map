#!/usr/bin/env python3
"""Join basin capacity table to basin polygons -> data/geo/geometry_basins.js.

Priority: national layers (US Coleman&Cahan, GA Australia, ANP Brazil, USGS China,
BiCRS Canada) over the USGS WEP-2009/11 global provinces backbone.
One polygon set per capacity row; unmatched rows reported.
"""
import json, re, unicodedata
from pathlib import Path

import geopandas as gpd
from shapely.geometry import mapping

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "basins"
GEO = ROOT / "data" / "geo"
RESEARCH = ROOT / "data" / "research"

SIMPLIFY_DEG = 0.04
DEC = 3


def norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    s = s.lower()
    s = re.sub(r"\b(basin|province|sector|graben|trough|the|of)\b", " ", s)
    s = re.sub(r"[^a-z0-9]+", " ", s).strip()
    return s


def round_geom(geom):
    def rnd(c):
        if isinstance(c[0], (int, float)):
            return [round(c[0], DEC), round(c[1], DEC)]
        return [rnd(x) for x in c]
    g = dict(geom)
    g["coordinates"] = rnd(g["coordinates"])
    return g


def load_layers():
    """Return list of (layer_name, gdf, name_column). Order = join priority."""
    layers = []
    us = gpd.read_file(RAW / "usgs_sedimentary_basins_usa.geojson").to_crs(4326)
    layers.append(("us_coleman", us, "nogaprvnce"))
    au = gpd.read_file(RAW / "ga_australian_geological_provinces_simplified.geojson").to_crs(4326)
    au = au[au["type"].str.contains("sediment", case=False, na=False)]
    layers.append(("ga_australia", au, "name"))
    br = gpd.read_file(RAW / "anp_brazil_basins_dissolved.geojson").to_crs(4326)
    layers.append(("anp_brazil", br, "BACIA"))
    cn = gpd.read_file(RAW / "usgs_china_sedimentary_basins.geojson").to_crs(4326)
    layers.append(("usgs_china", cn, "NAME"))
    wep = gpd.read_file(RAW / "usgs_wep_2009-2011_provinces_dissolved.geojson").to_crs(4326)
    layers.append(("usgs_wep_global", wep, "PRV_NAME"))
    cara = gpd.read_file(RAW / "usgs_cara_2008_arctic_provinces_dissolved.geojson").to_crs(4326)
    layers.append(("usgs_cara_arctic", cara, "PROV_NAME"))
    return layers


# Manual overrides: capacity-table basin -> (layer_name, [exact polygon names] or
# for us_coleman, [tokens contained in the comma-separated province string]).
ALIASES = {
    "Gulf Coast Basin": ("us_coleman", ["W Gulf", "E Texas Basin", "Louisiana-Mississippi Salt Basins"]),
    "Alaska North Slope Basin": ("usgs_cara_arctic", ["Arctic Alaska"]),
    "Precaspian Basin": ("usgs_wep_global", ["North Caspian Basin"]),
    "Southern Permian Basin": ("usgs_wep_global", ["Anglo-Dutch Basin"]),
    "Eastern Arabian Basin": ("usgs_wep_global", ["Greater Ghawar Uplift", "Interior Homocline-Central Arch"]),
    "Gulf of Suez Basin": ("usgs_wep_global", ["Red Sea Basin"]),
    "Ahnet-Gourara Basin (In Salah area)": ("usgs_wep_global", ["Grand Erg/Ahnet Basin"]),
    "Outeniqua Basin": ("usgs_wep_global", ["South African Coastal"]),
    "Rovuma Basin": ("usgs_wep_global", ["Mozambique Coastal"]),
    "Arabian Basin (Kuwait)": ("usgs_wep_global", ["Mesopotamian Foredeep Basin"]),
    "Kutai Basin": ("usgs_wep_global", ["Kutei Basin"]),
    "Sureste Basin": ("usgs_wep_global", ["Saline-Comalcalco Basin", "Macuspana Basin", "Villahermosa Uplift"]),
    "Orinoco / Eastern Venezuela Basin": ("usgs_wep_global", ["East Venezuela Basin"]),
}


def main():
    basins = json.loads((RESEARCH / "basin_capacity.json").read_text())
    layers = load_layers()

    # Canada: reuse curated BiCRS polygons (WCSB + Williston-CA), loaded as raw JS
    ca_js = (GEO / "bicrs_reuse" / "geometry_ca_basins.js").read_text()
    ca_fc = json.loads(re.search(r"window\.GEO_CA_BASINS\s*=\s*(\{.*?\});", ca_js, re.S).group(1))

    # Pre-normalize layer names
    indexed = []
    for lname, gdf, col in layers:
        idx = {}
        for i, row in gdf.iterrows():
            idx.setdefault(norm(str(row[col])), []).append(i)
        indexed.append((lname, gdf, col, idx))

    feats, unmatched = [], []
    for b in basins:
        cands = [b["basin"]] + (b.get("match_names") or [])
        cand_norms = [norm(c) for c in cands if c]
        hit = None
        # manual alias override first
        if b["basin"] in ALIASES:
            lname_want, wanted = ALIASES[b["basin"]]
            for lname, gdf, col, idx in indexed:
                if lname != lname_want:
                    continue
                if lname == "us_coleman":
                    rows = [i for i, r in gdf.iterrows()
                            if any(t in str(r[col]) for t in wanted)]
                else:
                    wn = {norm(w) for w in wanted}
                    rows = [i for i, r in gdf.iterrows() if norm(str(r[col])) in wn]
                if rows:
                    hit = (lname, gdf, col, rows)
                break
        # exact normalized match, in layer priority order
        if hit is None:
            for lname, gdf, col, idx in indexed:
                for cn_ in cand_norms:
                    if cn_ in idx:
                        hit = (lname, gdf, col, idx[cn_]); break
                if hit: break
        # substring fallback (candidate within polygon name or vice versa)
        if hit is None:
            for lname, gdf, col, idx in indexed:
                for key, rows in idx.items():
                    if any(cn_ and (cn_ in key or key in cn_) and min(len(cn_), len(key)) >= 5
                           for cn_ in cand_norms):
                        hit = (lname, gdf, col, rows); break
                if hit: break
        # special-case Canada curated polygons
        if hit is None and "CAN" in (b.get("countries") or []):
            wants_wcsb = "western canada" in norm(b["basin"])
            src = [f for f in ca_fc["features"]
                   if ("Western Canada" in f["properties"]["name"]) == wants_wcsb]
            if src:
                hit = ("bicrs_canada", src, None, None)

        if hit is None:
            unmatched.append(b["basin"])
            continue

        cap = b.get("capacity_gt") or {}
        tier_s = b.get("tier") or ""
        soft = (bool(re.search(r"theoretical|prospective", tier_s, re.I))
                and not re.search(r"practic|effective|technical", tier_s, re.I))
        props = {"basin": b["basin"],
                 "countries": b.get("countries"),
                 "cap_low_gt": cap.get("low"), "cap_mid_gt": cap.get("mid"),
                 "cap_high_gt": cap.get("high"), "tier": b.get("tier"),
                 "soft_tier": soft,
                 "onshore_offshore": b.get("onshore_offshore"),
                 "src": b.get("source"), "notes": b.get("notes")}

        if hit[0] == "bicrs_canada":
            for f in hit[1]:
                feats.append({"type": "Feature", "properties": {**props, "_layer": hit[0]},
                              "geometry": f["geometry"]})
            continue
        lname, gdf, col, rows = hit
        for i in rows:
            geom = gdf.geometry.iloc[gdf.index.get_loc(i)] if not isinstance(i, int) else gdf.loc[i].geometry
            geom = geom.simplify(SIMPLIFY_DEG, preserve_topology=True)
            if geom is None or geom.is_empty:
                continue
            feats.append({"type": "Feature", "properties": {**props, "_layer": lname},
                          "geometry": round_geom(mapping(geom))})

    fc = {"type": "FeatureCollection", "features": feats}
    out = ("// Generated by build_basins.py -- assessed basins joined to polygons\n"
           f"window.GEO_BASINS = {json.dumps(fc, separators=(',', ':'))};\n")
    (GEO / "geometry_basins.js").write_text(out)

    with_cap = sum(1 for b in basins if (b.get("capacity_gt") or {}).get("mid") is not None)
    matched_names = {f["properties"]["basin"] for f in feats}
    print(f"basins in table: {len(basins)} ({with_cap} with capacity); "
          f"matched: {len(matched_names)}; features: {len(feats)}")
    print("unmatched:", unmatched)


if __name__ == "__main__":
    main()
