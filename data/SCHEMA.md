# Data schema — CO₂ Storage Atlas

## Mechanisms
- `geologic` — supercritical CO₂ injection into sedimentary reservoirs (saline aquifer / depleted O&G).
- `mineralization` — in-situ mineralization (ISM) in mafic/ultramafic rock (basalt / peridotite / serpentinite).

## Capacity tiers (applies to both mechanisms; never sum across tiers)
- `theoretical` — full pore-volume / full-stoichiometry ceiling (e.g., USGS TASR, Kelemen rock-mass numbers).
- `effective` — screened for injectivity, depth, reservoir quality (e.g., CSRC sub-commercial+undiscovered, PNNL CRBG).
- `practical` — additionally screened for access, economics, regulation (e.g., Teletzke 2018, CSRC commercial).

## Generated artifacts
- `data/geo/geometry_injection.js` → `window.GEO_COUNTRIES` (Natural Earth countries with
  `cap` properties joined from sedimentary_capacity.json), `window.GEO_INJ_NATCARB`
  (US NATCARB saline formation polygons, WGS84, simplified).
- `data/geo/geometry_ism.js` → `window.GEO_ISM_LIPS` (LIP flood-basalt polygons matched to
  formation inventory), `window.GEO_ISM_OPH` (global ophiolite polygons, matched or
  uncharacterized), `window.GEO_ISM_FALLBACK` (circle approximations for formations
  without polygon data: rift volcanics, offshore basalt, harrats).
- `src/data_bundle.js` → `window.ATLAS` = {global, countries[], formations[], projects[], meta}.

### Basin feature properties (`data/geo/geometry_basins.js`, window.GEO_BASINS)
`{basin, countries[], cap_low_gt, cap_mid_gt, cap_high_gt, tier, onshore_offshore, src, notes,
  alt_estimates[{gt, tier, source}]?, usgs_code?, formations[]?, units[]?, unit?, _layer}`.
`usgs_code` (e.g. "C5047") marks a US basin whose number is the USGS 2013 basin aggregate
(DS 774 Table 1: low = P5, mid = mean, high = P95); its `formations[]` =
`{formation, tasr_mean_mt, variants[{variant: main|Deep, tasr_mean_mt, depth_ft}]}` from
`data/research/usgs_ds774_saus.json`. Built by `scripts/basin_attrs.py` (shared by
`build_basins.py` and `refresh_attrs.py`).

### Research text fields
Reader-facing text (`notes`, `onshore_offshore_notes`, `capacity_basis`, `depth_porosity_notes`,
`suitability_notes`, `existing_activity`) is short public copy (2026-10-15). The original
research text is kept alongside as `<field>_research`, and for the 9 US basin rows also
`capacity_research`, `tier_research`, `source_research`. Apps should never display `*_research`.

### Fields added 2026-10-15 (verification round)
- `alt_estimates[].gt_label` (optional): display text overriding the number, e.g. ">100 Gt".
- Country rows: `added` marks the 29 countries added from the OGCI catalogue tables; `preferred_estimate_gt`
  may be `null` (tier "not assessed"), which leaves the country uncolored.
- Basin rows: `basin_research` keeps a previous name after a rename; `match_names` includes the old
  name so geometry joins still work (e.g. "Southern North Sea Basin (UK sector)").
- Formation rows: `alt_estimates` (same shape as basins), shown under "Other estimates".
- `data/research/source_links.json` links carry a `label` (clean citation shown in panels).

### Formation feature properties (ISM polygons)
`{fid, name, category(flood_basalt|ophiolite|rift_volcanic|offshore_basalt), rock,
  cap_low_gt, cap_mid_gt, cap_high_gt, cap_basis, tier, matched(bool), src}`
Unmatched ophiolite polygons: `{name: geogdesc, matched:false}` — shown as
"mapped ophiolite/ultramafic (capacity uncharacterized)".

### Country properties (injection choropleth)
`{iso3, name, cap_pref_gt, cap_low_gt, cap_high_gt, tier, src, basins[], notes}`

### Project points
See `data/research/projects.json` — {name, mechanism, storage_type, country, lat, lon,
status, capacity_mtpa, cumulative_stored_mt, operator, start_year, onshore_offshore,
source, notes}. EOR/ECBM excluded (utilization, not durable CDR storage).
