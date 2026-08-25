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
Japan/Korea offshore areas). Basin polygons simplified at 0.015 deg (~1.5 km; was 0.04).

**Merged US/EU formation detail (2026-08):** there is no separate saline-formation
layer — formation detail is folded into the basin layer to avoid stacked, overlapping
polygons. US: basins with USGS 2013 National Assessment coverage take their geometry
from the dissolved union of that basin's Storage Assessment Unit footprints (191 SAUs
queried from the USGS ArcGIS StudyAreas services, public domain; capacity from DS 774
Table 1; `scripts/build_us_saus.py` + `scripts/build_basins.py`), and the basin detail
panel lists each formation (base + Deep variants grouped, mean TASR, depth, matched
NETL cost case). The 26 assessed USGS basins with no row in the capacity table are
added as basins in their own right, colored by the sum of SAU mean TASR (tier
"technically accessible (USGS 2013)"; their low-high range sums SAU P5/P95 and is not
a formal percentile). This replaced both the NATCARB 10-km grid (the cause of the
blocky US outlines) and the Coleman & Cahan outlines for those basins. EU: CO2StoP
storage units inside a mapped basin are listed in that basin's detail panel; units
with no covering basin polygon (Paris, Ebro, etc.) draw standalone in deep blue.
A basin's headline number remains its own assessment, never a sum of formations.

## Storage costs (detail panels)
Indicative, storage-only figures shown on click (never a choropleth — precision does
not support it): NETL 2024 AGU model run of FE/NETL CO2_S_COM across 314 US saline
formations (first-year break-even, 2023$, incl. Class VI permitting & Subpart RR
monitoring; lowest-cost formation per state; >200 Gt nationally at <=$8/t); NETL
QGESS 2019 transport+storage for 4 US basins (2018$); STRATEGY CCUS D4.5 (2022) for
8 southern-EU regions (EUR/t, capex+opex, project report, pre-bankability sites);
generic reservoir-class ranges elsewhere (Schmelz et al. 2020 after Rubin et al.
2015). Full transcriptions: `data/research/storage_costs.json`. Costs vary 2-10x
within a basin with rate/depth/quality; vintages differ across sources.

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

**Depth/suitability (2026-08, responding to expert review):** ISM polygons are mapped
surface extents of reactive rock — an upper bound on geographic availability, now
labeled as such in the UI. A blanket >=800 m screen was considered and rejected: 800 m
is the supercritical-CO2 criterion from conventional injection storage (IPCC SRCCS
2005) and applies to supercritical basalt storage (Wallula pilot: 828-887 m, NAS 2019),
but dissolved-phase injection (CarbFix Hellisheidi) operates at ~500 m (NAS 2019), and
engineered peridotite concepts target ~3 km (Kelemen & Matter 2008, PNAS). No global
thickness/depth GIS exists for basalt/ophiolite bodies (Ernst LIP database carries
per-province volumes only; isopachs are published as figures; SubMAP-CO2 at UT
Austin/NETL is building US-only 3D coverage) — so a depth screen is not currently
implementable and per-formation depth notes are shown instead.

## Projects layer
104 dedicated-storage projects (87 geologic, 17 ISM), statuses as of mid-2026,
compiled in `data/research/projects.{json,md}` from GCCSI, IEA CCUS database,
EPA Class VI tracker, operator disclosures, press. Operational: ~20.4 Mtpa geologic
vs ~0.05 Mtpa ISM.

## Build
`python3 scripts/build_geo.py && python3 scripts/build_bundle.py` regenerates
`data/geo/geometry_*.js` and `src/data_bundle.js` from `data/raw/` + `data/research/`.
The app (`src/index.html`) is fully static; open it in any browser.
