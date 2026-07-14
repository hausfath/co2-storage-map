#!/usr/bin/env python3
"""Build web-ready geometry for the CO2 Storage Atlas.

Inputs:  data/raw/** shapefiles, data/geo/countries_50m.geojson, data/research/*.json
Outputs: data/geo/geometry_injection.js, data/geo/geometry_ism.js
"""
import json, math, re
from pathlib import Path

import geopandas as gpd
from shapely.geometry import Point, mapping

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
GEO = ROOT / "data" / "geo"
RESEARCH = ROOT / "data" / "research"

SIMPLIFY_DEG = 0.03      # ~3 km at equator; fine for a global map
COORD_DECIMALS = 3


def load_formations():
    mc = json.loads((RESEARCH / "mineralization_capacity.json").read_text())
    return mc["formations"], mc.get("global", {})


def fmt_fc(gdf, props):
    """GeoDataFrame -> compact FeatureCollection dict with selected properties."""
    gdf = gdf.copy()
    gdf["geometry"] = gdf.geometry.simplify(SIMPLIFY_DEG, preserve_topology=True)
    gdf = gdf[~gdf.geometry.is_empty & gdf.geometry.notna()]
    feats = []
    for _, row in gdf.iterrows():
        geom = mapping(row.geometry)
        geom = round_geom(geom)
        feats.append({"type": "Feature",
                      "properties": {k: row.get(k) for k in props},
                      "geometry": geom})
    return {"type": "FeatureCollection", "features": feats}


def round_geom(geom):
    def rnd(coords):
        if isinstance(coords[0], (int, float)):
            return [round(coords[0], COORD_DECIMALS), round(coords[1], COORD_DECIMALS)]
        return [rnd(c) for c in coords]
    geom = dict(geom)
    geom["coordinates"] = rnd(geom["coordinates"])
    return geom


def circle_poly(lon, lat, area_km2, n=48):
    """Approximate circle polygon of given area centered at lon/lat."""
    r_km = math.sqrt(max(area_km2, 1000) / math.pi)
    r_km = min(r_km, 600)  # cap the visual footprint
    pts = []
    for i in range(n + 1):
        a = 2 * math.pi * i / n
        dlat = (r_km / 111.32) * math.sin(a)
        dlon = (r_km / (111.32 * max(math.cos(math.radians(lat)), 0.2))) * math.cos(a)
        pts.append([round(lon + dlon, 3), round(lat + dlat, 3)])
    return {"type": "Polygon", "coordinates": [pts]}


# ---------- formation matching ----------

LIP_MATCH = {  # formation name regex -> LIP NAME_EVENT regex
    r"Columbia River": r"^Columbia River$",
    r"Deccan": r"^Deccan$",
    r"Siberian": r"^Siberian Trap",
    r"Paran": r"^(Parana|Etendeka|Parana-Etendeka)$",
    r"Karoo": r"^Karoo$",
    r"Ethiopian-Yemen": r"^Afro-Arabian$",
    r"North Atlantic Igneous": r"^NAIP",
    r"Emeishan": r"^Emeishan$",
    r"Central Atlantic Magmatic": r"^CAMP-(Eastern North America \(ENA\)|Africa|Europe)$",
}

OPH_MATCH = [  # (geogdesc keyword regex, formation name regex)
    (r"OMAN", r"Samail"),
    (r"NEW CALEDONIA", r"New Caledonia"),
    (r"NEW GUINEA|MANUS|NEW HANOVER|PAPUA", r"Papua New Guinea"),
    (r"PHILIPPINES|LUZON|ZAMBOANGA|PALAWAN", r"Zambales"),
    (r"CYPRUS", r"Troodos"),
    (r"TURKEY|KIRSEHIR|BEY DAGLARI|LYCIA", r"Turkish"),
    (r"DINARIDES|GREECE|EUBOEA", r"Mirdita"),
    (r"CALIFORNIA|KLAMATH|JOSEPHINE|FRANCISCAN|GREAT VALLEY|OREGON", r"California"),
    (r"NEWFOUNDLAND", r"Bay of Islands"),
    (r"CACHE CREEK|CASSIER|FRENCH/NAKINA|ALEXANDER/CRAIG|NW NORTH AME", r"British Columbia"),
    (r"LAURENTIA-", r"Thetford"),
    (r"HONSHU|JAPAN|SAKHALIN", r"Japan Ophiolites"),
    (r"KALIMANTAN|SULAWESI|OBI ISLAND|HALMAHERA|SUMATRA", r"Kalimantan"),
]


def build_ism(formations):
    def find_formation(pattern):
        for f in formations:
            if re.search(pattern, f["name"], re.I):
                return f
        return None

    def fprops(f, matched=True, name=None):
        cap = f.get("capacity_gt") or {}
        return {
            "fid": re.sub(r"\W+", "_", f["name"].lower())[:40],
            "name": name or f["name"],
            "category": f["category"], "rock": f.get("rock_type"),
            "cap_low_gt": cap.get("low"), "cap_mid_gt": cap.get("mid"),
            "cap_high_gt": cap.get("high"), "cap_basis": f.get("capacity_basis"),
            "suitability": f.get("suitability_notes"), "activity": f.get("existing_activity"),
            "src": f.get("source"), "matched": matched,
        }

    matched_formations = set()

    # --- LIPs ---
    lip = gpd.read_file(RAW / "lithology/extracted/lip_shapefiles/LIP_Outline_edited.shp").to_crs(4326)
    lip_feats = []
    for form_pat, lip_pat in LIP_MATCH.items():
        f = find_formation(form_pat)
        if f is None:
            continue
        sel = lip[lip["NAME_EVENT"].fillna("").str.match(lip_pat)]
        if sel.empty:
            continue
        matched_formations.add(f["name"])
        sel = sel.copy()
        sel["geometry"] = sel.geometry.simplify(SIMPLIFY_DEG, preserve_topology=True)
        for _, row in sel.iterrows():
            if row.geometry is None or row.geometry.is_empty:
                continue
            lip_feats.append({"type": "Feature", "properties": fprops(f),
                              "geometry": round_geom(mapping(row.geometry))})
    lips_fc = {"type": "FeatureCollection", "features": lip_feats}

    # --- Ophiolites ---
    oph = gpd.read_file(RAW / "lithology/extracted/ophiolites/ophiolites.shp").to_crs(4326)
    oph_feats = []
    for _, row in oph.iterrows():
        desc = (row.get("geogdesc") or "").upper()
        form = None
        for kw, form_pat in OPH_MATCH:
            if re.search(kw, desc):
                form = find_formation(form_pat)
                break
        geom = row.geometry.simplify(SIMPLIFY_DEG, preserve_topology=True)
        if geom is None or geom.is_empty:
            geom = row.geometry  # tiny slivers: keep original
        if form is not None:
            matched_formations.add(form["name"])
            props = fprops(form, name=f"{form['name']}", matched=True)
        else:
            props = {"fid": "oph_other", "name": desc.title() or "Mapped ophiolite",
                     "category": "ophiolite", "rock": "ophiolite/ultramafic",
                     "cap_low_gt": None, "cap_mid_gt": None, "cap_high_gt": None,
                     "cap_basis": None, "suitability": None, "activity": None,
                     "src": "PLATES/UTIG global ophiolite compilation", "matched": False}
        oph_feats.append({"type": "Feature", "properties": props,
                          "geometry": round_geom(mapping(geom))})
    oph_fc = {"type": "FeatureCollection", "features": oph_feats}

    # --- Fallback circles for formations with no polygon match ---
    fb_feats = []
    for f in formations:
        if f["name"] in matched_formations:
            continue
        ext = f.get("approx_extent") or {}
        if ext.get("lat") is None or ext.get("lon") is None:
            continue
        geom = circle_poly(ext["lon"], ext["lat"], ext.get("area_km2") or 20000)
        fb_feats.append({"type": "Feature", "properties": fprops(f), "geometry": geom})
    fb_fc = {"type": "FeatureCollection", "features": fb_feats}

    out = (
        "// Generated by build_geo.py -- ISM (in-situ mineralization) geometry\n"
        f"window.GEO_ISM_LIPS = {json.dumps(lips_fc, separators=(',', ':'))};\n"
        f"window.GEO_ISM_OPH = {json.dumps(oph_fc, separators=(',', ':'))};\n"
        f"window.GEO_ISM_FALLBACK = {json.dumps(fb_fc, separators=(',', ':'))};\n"
    )
    (GEO / "geometry_ism.js").write_text(out)
    print(f"ISM: {len(lip_feats)} LIP feats, {len(oph_feats)} ophiolite feats "
          f"({sum(1 for x in oph_feats if x['properties']['matched'])} matched), "
          f"{len(fb_feats)} fallback circles; matched formations: {len(matched_formations)}")
    unmatched = [f['name'] for f in formations
                 if f['name'] not in matched_formations and not (f.get('approx_extent') or {}).get('lat')]
    if unmatched:
        print("  formations with no geometry at all:", unmatched)


def build_injection():
    sed = json.loads((RESEARCH / "sedimentary_capacity.json").read_text())
    bycountry = {c["iso3"]: c for c in sed["countries"]}

    ne = gpd.read_file(GEO / "countries_50m.geojson").to_crs(4326)
    ne["geometry"] = ne.geometry.simplify(SIMPLIFY_DEG, preserve_topology=True)
    feats = []
    for _, row in ne.iterrows():
        if row.geometry is None or row.geometry.is_empty:
            continue
        iso = row.get("ADM0_A3")
        if iso in (None, "-99"):
            iso = row.get("ISO_A3")
        p = {"iso3": iso, "name": row.get("ADMIN") or row.get("NAME"), "cap_pref_gt": None}
        c = bycountry.get(iso)
        if c:
            cap = c.get("capacity_gt") or {}
            p.update({"cap_pref_gt": c.get("preferred_estimate_gt"),
                      "cap_low_gt": cap.get("low"), "cap_high_gt": cap.get("high"),
                      "tier": c.get("tier"), "src": c.get("preferred_source"),
                      "basins": c.get("key_basins"), "cap_notes": c.get("notes")})
        feats.append({"type": "Feature", "properties": p,
                      "geometry": round_geom(mapping(row.geometry))})
    countries = {"type": "FeatureCollection", "features": feats}

    nat = gpd.read_file(RAW / "basins/extracted_natcarb/Natcarb_Saline_poly_shapefile/NATCARB_Saline_Poly_v1502.shp").to_crs(4326)
    nat_fc = fmt_fc(nat, ["BASIN_NAME", "RESOURCE_N"])

    out = (
        "// Generated by build_geo.py -- injection (geologic sequestration) geometry\n"
        f"window.GEO_COUNTRIES = {json.dumps(countries, separators=(',', ':'))};\n"
        f"window.GEO_INJ_NATCARB = {json.dumps(nat_fc, separators=(',', ':'))};\n"
    )
    (GEO / "geometry_injection.js").write_text(out)
    n_with = sum(1 for f in countries['features'] if f['properties'].get('cap_pref_gt'))
    print(f"Injection: {n_with} countries with capacity, {len(nat_fc['features'])} NATCARB polys")


if __name__ == "__main__":
    formations, _ = load_formations()
    build_ism(formations)
    build_injection()
