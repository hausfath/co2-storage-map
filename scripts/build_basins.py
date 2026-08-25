#!/usr/bin/env python3
"""Join basin capacity table to basin polygons -> data/geo/geometry_basins.js.

Priority: national layers (US Coleman&Cahan, GA Australia, ANP Brazil, USGS China,
BiCRS Canada) over the USGS WEP-2009/11 global provinces backbone.
One polygon set per capacity row; unmatched rows reported.
"""
import json, re, unicodedata
from pathlib import Path

import geopandas as gpd
from shapely.geometry import mapping, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "basins"
GEO = ROOT / "data" / "geo"
RESEARCH = ROOT / "data" / "research"

SIMPLIFY_DEG = 0.015
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


def load_js_fc(path, varname):
    txt = path.read_text()
    return json.loads(re.search(varname + r" = (\{.*\});", txt, re.S).group(1))


# capacity-table basin name -> USGS SAU basin name (US basins with SAU coverage
# take their geometry from the dissolved SAU footprints and gain a per-formation
# breakdown; overlapping stacked SAUs are never drawn individually)
SAU_ALIASES = {
    "Gulf Coast Basin": "U.S. Gulf Coast",
    "San Joaquin Basin / California": "San Joaquin Basin",
    "Alaska North Slope Basin": "Alaska North Slope",
}

VARIANT_RE = re.compile(r"^(.*?)(?:\s+(Deep|Shallow|Updip|Downdip))?$")


def formation_breakdown(sau_feats):
    """Group a basin's SAUs by formation root; 'X' + 'X Deep' become one entry."""
    seen, roots = set(), {}
    for f in sau_feats:
        p = f["properties"]
        code = p.get("sau_code")
        if code in seen:
            continue
        seen.add(code)
        name = p.get("sau_name") or code or "SAU"
        m = VARIANT_RE.match(name)
        root, variant = m.group(1), (m.group(2) or "main")
        r = roots.setdefault(root, {"formation": root, "variants": []})
        r["variants"].append({"variant": variant,
                              "tasr_mean_mt": p.get("tasr_mean_mt"),
                              "depth_ft": p.get("depth_ml_ft")})
    out = []
    for r in roots.values():
        s = sum(v["tasr_mean_mt"] or 0 for v in r["variants"])
        r["tasr_mean_mt"] = round(s, 1) if s else None
        out.append(r)
    out.sort(key=lambda r: -(r["tasr_mean_mt"] or 0))
    return out


def sau_union_geom(sau_feats):
    geom = unary_union([shape(f["geometry"]) for f in sau_feats])
    geom = geom.simplify(SIMPLIFY_DEG, preserve_topology=True).buffer(0)
    return round_geom(mapping(geom))


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

    # USGS 2013 SAU footprints (dissolved per basin) take priority for US basins
    sau_fc = load_js_fc(GEO / "geometry_us_saus.js", r"window\.GEO_US_SAUS")
    sau_groups = {}
    for f in sau_fc["features"]:
        sau_groups.setdefault(f["properties"].get("basin") or "?", []).append(f)
    sau_by_norm = {norm(k): k for k in sau_groups}

    feats, unmatched = [], []
    for b in basins:
        cands = [b["basin"]] + (b.get("match_names") or [])
        cand_norms = [norm(c) for c in cands if c]
        hit = None
        # USGS SAU dissolve first (US only)
        sau_key = SAU_ALIASES.get(b["basin"])
        if sau_key is None and "USA" in (b.get("countries") or []):
            for cn_ in cand_norms:
                if cn_ in sau_by_norm:
                    sau_key = sau_by_norm[cn_]
                    break
        if sau_key and sau_key in sau_groups:
            sfeats = sau_groups.pop(sau_key)
            cap = b.get("capacity_gt") or {}
            feats.append({"type": "Feature", "properties": {
                "basin": b["basin"], "countries": b.get("countries"),
                "cap_low_gt": cap.get("low"), "cap_mid_gt": cap.get("mid"),
                "cap_high_gt": cap.get("high"), "tier": b.get("tier"),
                "soft_tier": False,
                "onshore_offshore": b.get("onshore_offshore"),
                "src": b.get("source"), "notes": b.get("notes"),
                "formations": formation_breakdown(sfeats),
                "_layer": "usgs_saus"},
                "geometry": sau_union_geom(sfeats)})
            continue
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

    # USGS SAU basins with no capacity-table row become new basin features,
    # with capacity = sum of SAU mean TASR (range = summed P5/P95 — labeled as
    # such, not a formal percentile aggregation)
    for bname, sfeats in sorted(sau_groups.items()):
        seen, p5 = set(), 0.0
        mean, p95 = 0.0, 0.0
        for f in sfeats:
            p = f["properties"]
            if p.get("sau_code") in seen:
                continue
            seen.add(p.get("sau_code"))
            mean += p.get("tasr_mean_mt") or 0
            p5 += p.get("tasr_p5_mt") or 0
            p95 += p.get("tasr_p95_mt") or 0
        feats.append({"type": "Feature", "properties": {
            "basin": bname, "countries": ["USA"],
            "cap_low_gt": round(p5 / 1000, 1) or None,
            "cap_mid_gt": round(mean / 1000, 1) or None,
            "cap_high_gt": round(p95 / 1000, 1) or None,
            "tier": "technically accessible (USGS 2013)", "soft_tier": False,
            "onshore_offshore": "onshore & state waters (US)",
            "src": "USGS 2013 National Assessment (DS 774)",
            "notes": f"Basin total is the sum of mean technically accessible storage "
                     f"resource (TASR) across {len(seen)} assessed storage assessment "
                     f"units; the range sums SAU P5/P95 values and is not a formal "
                     f"percentile.",
            "formations": formation_breakdown(sfeats),
            "_layer": "usgs_saus_new"},
            "geometry": sau_union_geom(sfeats)})

    # EU CO2StoP storage units: attach to the basin polygon that contains them
    # (listed in the basin's detail panel); draw standalone only where no basin
    # polygon exists (e.g. Paris Basin), so units are never stacked on basins.
    eu_fc = load_js_fc(GEO / "geometry_eu_storage.js", r"window\.GEO_EU_STORAGE")
    basin_shapes = []
    for f in feats:
        g = shape(f["geometry"])
        minx, miny, maxx, maxy = g.bounds
        if maxx > -35 and minx < 65 and maxy > 30:  # Europe-adjacent only
            basin_shapes.append((g, f))
    n_units, n_attached = 0, 0
    for u in eu_fc["features"]:
        up = u["properties"]
        pt = shape(u["geometry"]).representative_point()
        n_units += 1
        host = next((f for g, f in basin_shapes if g.contains(pt)), None)
        rec = {"name": up.get("name"), "country": up.get("country"),
               "storage_type": up.get("storage_type") or "saline"}
        if host is not None:
            host["properties"].setdefault("units", []).append(rec)
            n_attached += 1
        else:
            feats.append({"type": "Feature", "properties": {
                "basin": up.get("name"), "countries": [up.get("country")],
                "cap_low_gt": None, "cap_mid_gt": None, "cap_high_gt": None,
                "tier": None, "soft_tier": False, "unit": True,
                "onshore_offshore": None,
                "src": "EU CO2StoP storage unit",
                "notes": f"CO2StoP storage unit ({rec['storage_type']}); shown "
                         f"individually because no basin-level assessment polygon "
                         f"covers this area.",
                "_layer": "co2stop_unit"},
                "geometry": u["geometry"]})
    print(f"EU CO2StoP: {n_attached}/{n_units} units attached to basins, "
          f"{n_units - n_attached} drawn standalone")

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
