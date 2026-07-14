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
