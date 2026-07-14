# Basin/Province Polygon Geometry — Property Schema & Name-Matching Notes

Session goal: acquire a global sedimentary basin / geologic province polygon backbone plus
regional fills. All files below live in `data/raw/basins/`. All are public-domain or
CC-BY/open-government licensed (see `data/research/geodata_sources.json` for full citations
and per-dataset license text).

## 1. Global backbone: USGS World Petroleum Resources Project 2009-2011

**File:** `usgs_wep_2009-2011_provinces_dissolved.geojson` (153 features, dissolved from the
270-feature assessment-unit layer `WEP_AU` inside `extracted_wep2009/DDS69ff.gdb/`)

- Join field: **`PRV_NAME`** (string) — e.g. `"Rub al Khali Basin"`, `"Niger Delta"`,
  `"Santos Basin"`, `"Songliao Basin"`, `"Bohaiwan Basin"`, `"North Sea Graben"`,
  `"Alberta Basin"` (= Canadian WCSB), `"Zagros Fold Belt"`, `"West Siberian Basin"`.
- Secondary key: `PRV_CODE` (numeric, stable across USGS fact sheets)
- `REG_NAME`: one of 8 World Energy Program regions (e.g. "Middle East and North Africa")
- Coverage: non-US priority + boutique provinces from the international 2009-2011 assessment
  cycle. **Does not include US basins** (assessed separately domestically — see USA layer
  below) and has gaps for Australia (no Cooper Basin — see AU layer) and South Asia (no
  Indus Basin found in this or any other source this session — confirmed gap).
- Original AU-level (undissolved) data retains `AU_NAME`, `TPS_NAME`, `FactSheet` (URL to
  USGS fact sheet PDF per province) — useful if finer-than-province granularity is wanted.

**Companion Arctic layer:** `usgs_cara_2008_arctic_provinces_dissolved.geojson` (32
features, from `CARA_AU` in the same .gdb) — join field **`PROV_NAME`**, secondary
`PROVCODE`. Covers Circum-Arctic Resource Appraisal provinces (Russian, Norwegian,
Canadian, Alaskan Arctic shelves) not otherwise in WEP_AU.

**Known gap / what didn't work:** the originally-targeted USGS "Geologic Provinces of the
World, 2000 World Petroleum Assessment" (Osmonson & Klett) ScienceBase items
(`60ad2fd7d34e4043c850edb3` all-defined, `60ad2fa1d34e4043c850ed98` assessed-only) have lost
their actual shapefiles — only thumbnail JPGs remain on ScienceBase, and their WFS/WMS
endpoints 404. The legacy `pubs.usgs.gov/dds/dds-060/regions/reg[1-8].zip` bundles (26–110MB
each, checked via direct download of reg7) contain only PDF chapter reports, zero GIS files.
The WEP_AU 2009-2011 dataset above is the best available substitute (more recent, still
public domain, same lineage/agency).

## 2. United States: Coleman & Cahan (2012) Sedimentary Basins catalog

**File:** `usgs_sedimentary_basins_usa.geojson` (144 features, queried live from
`energy.usgs.gov/arcgis/rest/services/BaseMaps/Sedimentary_Basin/MapServer/0`)

- Join field: **`name`** (string) — e.g. `"Illinois Basin"`, `"Permian Basin"`,
  `"Williston Basin"`, `"Michigan Basin"`, `"Appalachian Basin"`, `"Gulf of Mexico Basin"`,
  `"Anadarko Basin"`.
- Other fields: `nogaprvnce` (National Oil & Gas Assessment province code), `area_acres`,
  `perimet_mi`, `plttectset` (plate-tectonic setting), `era`, `basintype`, `source`,
  `source_scl` (source scale), `basin_num`.
- This is a superset of the piecemeal `usgs_sau_regional/` storage-assessment-unit
  shapefiles acquired in an earlier session (those are finer-grained SAU polygons within a
  subset of these basins — join on basin name once both layers are loaded).

## 3. Australia: Australian Geological Provinces 2018.01

**File:** `ga_australian_geological_provinces_simplified.geojson` (516 features total;
filter `properties.type == "sedimentary"` for 406 basin-relevant polygons)

- Join field: **`name`** — e.g. `"Cooper Basin"`, `"Gippsland Basin"`, `"Surat Basin"`,
  `"Bowen Basin"`, `"Perth Basin"`, `"Canning Basin"`, `"Bonaparte Basin"`,
  `"Northern Carnarvon Basin"`, `"Otway Basin"`.
- `type` ∈ {sedimentary, igneous, metallogenic, tectonic} — filter to `sedimentary`.
- Other fields: `provinceid`, `altname`, `subtype`, `rank`, `parentname` (parent
  basin/province for nested sub-basins), `state`, `onoffshore`, `source` (citation).
- Geometry was simplified (`.simplify(0.005°, preserve_topology=True)`) to shrink from a
  148MB raw pull to 6.3MB — fine detail lost is negligible at basin-outline scale.
- This supersedes the previously-held `ga_advanced_co2_storage_sites_2030.zip`, which only
  covered 3 advanced-stage 2030 storage sites, not full basin prospectivity.

## 4. Brazil: ANP Bacias Sedimentares (exploratory-model sectors)

**File:** `anp_brazil_basins_dissolved.geojson` (36 features, dissolved from 188
sector-level polygons in `extracted_anp_brazil/SETORES_TODOS_SIRGAS.shp`)

- Join field: **`BACIA`** (Portuguese basin name) — e.g. `"Santos"`, `"Campos"`,
  `"Sergipe_Alagoas"`, `"Pelotas"`, `"Potiguar"`, `"Recôncavo"`, `"Amazonas"`,
  `"Foz do Amazonas"`, `"Paraná"`.
- **CRS is EPSG:4674 (SIRGAS 2000)**, not 4326 — reproject before combining with other
  layers (`gdf.to_crs(4326)`).
- Note for reproduction: the direct .zip URL returns HTTP 403 without a browser
  `User-Agent` header; works fine with one set (e.g. `curl -A "Mozilla/5.0 ..."`).

## 5. China: USGS OFR 2000-047 structural sedimentary basins

**File:** `usgs_china_sedimentary_basins.geojson` (43 features)

- Join field: **`NAME`** — e.g. `"Songliao Basin"`, `"Bohai Bay Basin"`,
  `"Sichuan Basin"`, `"Tarim Basin"`, `"Ordos Basin"`, `"Junggar Basin"`,
  `"Qaidam Basin"`, `"Zhujiangkou (Pearl R. Mouth) Basin"`.
- Other fields: `AREA`, `PERIMETER`, `AGE_BASIN_` (code), `AGE_BASIN_1` (duplicate code
  column, renamed to avoid a geopandas column-name collision), `ERA`.
- Source shapefile had no `.prj`; CRS was manually assigned EPSG:4326 after confirming the
  raw coordinate bounding box (73.6–133.8°E, 17.6–50.3°N) matches geographic WGS84 over
  China/adjacent seas.
- A handful of trailing rows (`South Bijia Basin`, `North/South Shuangfeng Basin` ×3 each,
  2 unnamed `None` rows) are small supplementary/offshore fragments — harmless noise for a
  name-join, filter out `NAME is null` if they cause problems.

## Target-basin coverage checklist (from task brief)

| Basin | Found in | Join value |
|---|---|---|
| Illinois | USA layer | `name = "Illinois Basin"` |
| Permian | USA layer | `name = "Permian Basin"` |
| WCSB (Alberta) | WEP_AU global | `PRV_NAME = "Alberta Basin"` |
| North Sea | WEP_AU global | `PRV_NAME = "North Sea Graben"` (+ `"Anglo-Dutch Basin"`) |
| Rub al Khali | WEP_AU global | `PRV_NAME = "Rub al Khali Basin"` |
| Songliao | WEP_AU global AND China layer | both have it |
| Bohai Bay | WEP_AU global (`"Bohaiwan Basin"`) AND China layer (`"Bohai Bay Basin"`) | either |
| Cooper | Australia layer | `name = "Cooper Basin"` |
| Santos | WEP_AU global AND Brazil layer | `PRV_NAME`/`BACIA = "Santos Basin"`/`"Santos"` |
| Niger Delta | WEP_AU global | `PRV_NAME = "Niger Delta"` |
| Indus | **NOT FOUND** — no source this session contains an Indus/Pakistan basin polygon. Confirmed gap. |

## Known gaps / not pursued

- **Indus Basin (Pakistan)** — not present in any acquired source; would need a
  Pakistan-specific or South Asia regional GIS source not located this session.
- **Nyberg & Howell (2015)** global basin classification — searched GSA Data Repository,
  Zenodo, PANGAEA, Dryad; no open GIS file found, only static figures in the paper. Skipped.
- **AAPG Datapages / CGG Sedimentary Basins of the World** (800+ basins) — confirmed
  proprietary (CGG license text explicitly forbids redistribution) and the ArcGIS Online
  item is currently inaccessible (HTTP 403, "Subscription is canceled"). Correctly skipped
  per task instructions.
- **EU CO2StoP, UK NSTA, Norway Sodir, Queensland GGSS** — flagged in an earlier session as
  verified-but-not-downloaded (portal/API access issues); not re-attempted this session
  since the global+regional backbone above already covers those regions at province level.

## Suggested join strategy for the name-matching pipeline

1. Normalize all name fields: lowercase, strip "Basin"/"Province"/diacritics, collapse
   whitespace.
2. Prefer country/regional layers (USA, Australia, Brazil, China) over the WEP_AU global
   layer where both exist — they're higher resolution and more current.
3. Use WEP_AU (`PRV_NAME`) + CARA_AU (`PROV_NAME`) as the fallback/global layer for
   everywhere else (Middle East, Africa, most of Asia, South America outside Brazil, FSU,
   Europe outside national fills).
4. Flag any storage-project or capacity-estimate basin name that doesn't match any of the
   6 layers above — the Indus Basin is a known one; there may be others in Central Asia or
   smaller African/Southeast Asian basins not covered by WEP_AU's "priority/boutique"
   province selection.
