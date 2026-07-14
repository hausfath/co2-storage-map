# Methodology — Global CO₂ Storage Atlas

## Scope
Two storage mechanisms:
1. **Geologic subsurface sequestration** — supercritical CO₂ injection into sedimentary
   reservoirs (deep saline aquifers, depleted oil & gas fields).
2. **In-situ subsurface mineralization (ISM)** — injection into mafic/ultramafic rock
   (basalt, peridotite, serpentinite) with rapid conversion to solid carbonate.

Excluded: EOR/ECBM (utilization, not durable CDR storage), ex-situ surface mineralization (siting is driven
by alkalinity + CO₂ logistics, not subsurface geology).

## Capacity tiers
All capacity numbers carry a tier and tiers are never summed or averaged:
- **Theoretical** — full pore volume (sedimentary) or full rock-mass stoichiometry (ISM).
- **Effective** — screened for injectivity, depth, reservoir quality.
- **Practical** — additionally screened for access, economics, regulation.

Global anchors: geologic ~1,290 Gt prudent (Gasser et al. 2025) / ~14,300 Gt catalogued
(OGCI CSRC Cycle 5, 2025) / 55,000 Gt ceiling (Kearns et al. 2017). ISM ~10⁶ Gt
theoretical (NAS 2019; Kelemen et al.), with practical deployment projected at
~1.2–5 Gt/yr by 2050 (RMI 2023).

## Injection layer
**Default view: per-basin.** 92 basins compiled in `data/research/basin_capacity.{json,md}`
(46 with capacity estimates, the rest mapped as assessed-extent-only), joined to polygons
by name+alias in `scripts/build_basins.py`. Geometry priority: national layers — USGS
Coleman & Cahan 2012 (US), Geoscience Australia Geological Provinces (CC-BY), ANP Brazil,
USGS OFR 00-047 (China), curated WCSB/Williston (Canada) — then the USGS World Petroleum
Resources 2009-11 provinces + Circum-Arctic (CARA 2008) as global backbone. Basins whose
only estimate is theoretical/prospective/aggregated tier render dashed. ~21 capacity rows
remain polygon-less (small EU onshore basins covered by the CO2StoP detail layer;
Japan/Korea offshore areas). Overlap rule: detail layers (NATCARB US formations, CO2StoP
EU units) draw above basins; a basin's number is its own assessment, never a sum of
formations within it.

**Alternative view: per-country choropleth** using each country's preferred estimate from
`data/research/sedimentary_capacity.{json,md}` (45 countries). Known issues: Norway
18–84 Gt across sources; Russia/Argentina have no citable national estimate (uncolored);
West Siberian Basin mapped but unassessed.

## Mineralization layer
35-formation inventory with literature capacity estimates in
`data/research/mineralization_capacity.{json,md}` (Snæbjörnsdóttir 2020, Kelemen &
Matter 2008/2019, McGrail/PNNL, Goldberg, NAS 2019). Six key numbers spot-verified;
Columbia River updated to PNNL 2024 (36–148 Gt); Deccan flagged for a lower
probabilistic reassessment. Polygons: Ernst & Youbi LIP outlines (flood basalts),
PLATES/UTIG global ophiolite compilation (matched by geographic descriptor;
unmatched bodies shown as "uncharacterized"), circle approximations where no
polygon exists (rift/arc volcanics, offshore basalt, harrats). US ultramafics
(USGS DS-414) downloaded but not yet rendered.

## Projects layer
84 dedicated-storage projects (69 geologic, 15 ISM), statuses as of mid-2026,
compiled in `data/research/projects.{json,md}` from GCCSI, IEA CCUS database,
EPA Class VI tracker, operator disclosures, press. Operational: ~20.2 Mtpa geologic
vs ~0.05 Mtpa ISM.

## Build
`python3 scripts/build_geo.py && python3 scripts/build_bundle.py` regenerates
`data/geo/geometry_*.js` and `src/data_bundle.js` from `data/raw/` + `data/research/`.
The app (`src/index.html`) is fully static; open it in any browser.
