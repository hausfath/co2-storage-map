# CO2 Storage Atlas — Open Geospatial Data: Recipe & Gaps

Companion to `geodata_sources.json` (machine-readable per-dataset records). This
file explains how to turn what we found into the two web-map layers: (A)
injection targets (sedimentary basins / saline formations) and (B)
mineralization targets (mafic/ultramafic rock).

## Downloads completed this session

| File | Size | Layer | Coverage |
|---|---|---|---|
| `data/raw/basins/ga_advanced_co2_storage_sites_2030.zip` | 147 KB | injection | Australia (Cooper, Surat, Gippsland) |
| `data/raw/basins/usgs_sau_regional/*.zip` (5 files) | 3.1 MB total | injection | US: Appalachian, Black Warrior, Illinois, Michigan, Anadarko/S.Oklahoma basins |
| `data/raw/lithology/plates_global_ophiolites.zip` | 656 KB | mineralization | Global ophiolite belts |
| `data/raw/lithology/lip_shapefiles_ernst_youbi2017.zip` | 56 KB | mineralization | Global LIPs, 0–1300 Ma |
| `data/raw/lithology/usgs_ds414_ultramafic_us.zip` | 1.1 MB | mineralization | Conterminous US ultramafic rocks |
| `data/raw/projects/sodir_co2_licence_current.geojson` | 160 KB | injection (proxy) | Norwegian continental shelf CO2 licence areas |

Plus pre-existing from earlier session: `natcarb_saline_poly_shapefile.zip` (US
saline formations, injection) and `hartmann-moosdorf_2012_glim_raster_0.5deg.zip`
(coarse global lithology raster, mineralization).

## Layer A — Injection (sedimentary basins / saline formations)

**Recipe:**
1. Base global context: none of the fully-global open basin compilations
   panned out cleanly this session (see gaps below) — recommend either (a)
   digitizing basin outlines from published atlas figures at low
   resolution for a "context" layer, or (b) using Macrostrat's sedimentary
   basin extents as a fallback base, styled as low-emphasis background.
2. Overlay high-confidence regional/national datasets where available:
   - US: `natcarb_saline_poly_shapefile.zip` (saline formations) +
     `usgs_sau_regional/*` (SAU polygons for 5 basins — union with NATCARB,
     dedupe by basin name, USGS is likely more authoritative for capacity
     numbers).
   - Australia: `ga_advanced_co2_storage_sites_2030.zip` — small but
     high-confidence "advanced" sites; Queensland Atlas (gap, see below)
     would add more basin-wide coverage.
   - Norway: `sodir_co2_licence_current.geojson` is licence-area only, not
     geological storage-unit polygons — usable as a "planned/licenced
     project" point-of-interest style layer, not as a storage-formation
     polygon layer. True Sodir storage-complex/aquifer polygons were not
     located (see gap).
3. Processing: reproject all inputs to EPSG:4326 (WGS84) with `ogr2ogr`,
   simplify with `mapshaper -simplify 5-15%` depending on basin size (large
   basins can tolerate more aggressive simplification for web performance;
   preserve topology with `mapshaper -simplify keep-shapes`), and tag each
   feature with `source` and `country` fields for the popup/legend before
   merging into a single `injection_targets.geojson`.
4. Style: color/opacity by data confidence — e.g. USGS/NETL/GA CC-BY sources
   solid fill, licence-area proxies (Norway, and UK if retrieved) as outline
   only or dashed, to visually flag "not the same thing as a mapped storage
   unit."

## Layer B — Mineralization (mafic/ultramafic rock)

**Recipe:**
1. Base global layer: full-resolution GLiM vector is the best global
   substrate (1.24M polygons, includes lithology class codes). It was
   **not downloaded** this session (1.1 GB, over the 100 MB budget) but the
   download link is verified working:
   `https://www.dropbox.com/s/9vuowtebp9f1iud/LiMW_GIS%202015.gdb.zip?dl=1`.
   Recommended out-of-band step: download once, then in QGIS/ogr2ogr filter
   to level-1 classes `vb` (volcanic basic) and `pb` (plutonic basic) — these
   are the GLiM codes for mafic rock; check Hartmann & Moosdorf 2012 Table 1
   for whether a distinct ultramafic subclass exists within `pb`/`vb` or
   needs identifying via the level-2/level-3 subclass fields. Export the
   filtered subset (should be well under 100 MB) before adding to the repo.
2. Sharpen with LIP polygons (`lip_shapefiles_ernst_youbi2017.zip`,
   `LIP_Outline_edited.shp`) for flood-basalt provinces — these are large,
   well-studied targets (Deccan, Siberian Traps, Columbia River Basalt,
   etc.) worth their own visual emphasis/tier above the generic GLiM mafic
   fill.
3. Add ophiolite/serpentinite specificity with
   `plates_global_ophiolites.zip` — coarse but global; supplement with
   country-level detail where available:
   - US: `usgs_ds414_ultramafic_us.zip` (`US_ultra.shp`) — direct swap-in
     replacement for the US portion of the ophiolite/GLiM layers, purpose-
     built for CO2 mineralization siting.
   - Oman: Samail ophiolite `.gpkg` (see gap below) — highest-value single
     ophiolite in the world for in-situ mineralization (Talc/Vani, 44.01),
     get this file manually if possible.
   - BC/Quebec: access routes confirmed (see gap notes) but not extracted;
     BC Digital Geology and SIGEOM both support filtered SHP/GPKG export.
4. Processing: reproject to EPSG:4326, simplify at 10-20% for GLiM (huge
   polygon count, needs aggressive simplification for web use — consider
   dissolving by lithology class first with `ogr2ogr -dialect sqlite -sql
   "SELECT ST_Union(geometry), xx FROM layer GROUP BY xx"` or mapshaper
   `-dissolve` before simplifying, both to shrink file size and because
   individual GLiM polygons are geologically granular beyond what a global
   web map needs). Keep LIP and ophiolite layers as separate GeoJSON files
   from GLiM-mafic so they can be toggled/styled independently (LIP = flood
   basalt fill, ophiolite = point-hatch or distinct color, GLiM-mafic =
   base wash).

## Verified-not-downloaded (real, working sources — fetch when possible)

- **GLiM full vector** (1.1 GB) — see Layer B recipe above; verified
  working Dropbox link.
- **Sedimentary Basins of the World** (AAPG Datapages/CGG,
  `hub.arcgis.com/datasets/9845f1f30a1641efbe54dd1f9c8c668b`) — ArcGIS Hub
  API returned `"Subscription is canceled, the item is not accessible"`
  when queried directly; likely no longer freely downloadable despite
  being indexed as an "open file." Treat as inaccessible for now; CGG is
  proprietary anyway per the original brief, so this is a low-priority gap.
- **EU CO2StoP** (GEUS/JRC/EGDI) — real dataset, JRC converted to open
  KML+CSV, but the direct file URLs are buried in the interactive
  setis.ec.europa.eu / EGDI (maps.europe-geology.eu) portal and were not
  extracted this session. Next step: query the EGDI WFS service directly
  for CO2StoP storage-unit layers, or email GEUS.
- **UK NSTA UKCS Carbon Storage Licences** — confirmed real ArcGIS
  FeatureServer at `data.nstauthority.co.uk/arcgis/rest/services/
  Public_ED50/UKCS_CarbonStorage_Licences_ED50/FeatureServer/0` (polygon,
  supports GeoJSON output) via web search, but the host would not resolve
  via DNS from this sandbox (both curl and WebFetch failed to resolve —
  likely a sandbox network restriction, not a dead service). Retry from an
  unrestricted network. Note: like Norway, this is licence-area data, not
  the full CO2Stored storage-unit polygons (those need registered access
  at co2stored.co.uk — confirmed still gated, per original brief).
- **Queensland CO2 Geological Storage Atlas GIS** (GGSS 2010,
  data.gov.au) — data.gov.au has migrated off its old CKAN API to a
  Drupal portal; automated fetch failed (403/HTML shell). Manual browser
  visit needed: `https://data.gov.au/data/dataset/1321c7e2-805f-4434-9347-9e0181cfbce5`.
- **Samail Ophiolite (Oman/UAE) GeoPackage** (CU Scholar,
  `scholar.colorado.edu/concern/datasets/zp38wd78m`) — real, high-value
  dataset (5 lithology classes incl. Dunite/Wehrlite, Harzburgite, Mafic)
  but the repository page 403'd on WebFetch (likely needs a JS-rendered
  download button). Manual browser visit needed.
- **USGS national SAU coverage** — only 5 of ~18 regional OFR 2012-1024
  basins have been migrated to ScienceBase spatial-data child items so far
  (Appalachian/Black Warrior/Illinois/Michigan/Anadarko — downloaded;
  California x5 and Wind River items exist but their file URLs 404'd,
  likely a ScienceBase backend migration issue — retry the item pages
  directly). Remaining basins (Gulf Coast, Columbia Basin, Williston,
  Powder River, San Juan, etc.) need to be checked chapter-by-chapter at
  `pubs.usgs.gov/of/2012/1024/{a..r}/` for their own GIS download links.
- **Norway Sodir storage-formation/aquifer polygons** — the Factmaps
  ArcGIS service only exposes CO2 licence areas and storage wellbore
  points, not the geological storage-unit polygons shown in the CO2
  Storage Atlas PDF maps. Those may only exist as static map graphics;
  digitizing from the atlas PDFs (sodir.no/en/whats-new/publications/
  co2-atlases/) may be the only route.
- **BC Digital Geology** and **SIGEOM (Quebec)** — both confirmed
  freely-accessible extraction tools (no login required), not yet queried
  for serpentinite/ultramafic-filtered exports. Both would need scripted
  per-tile or per-lithology-code extraction rather than a single bulk
  download.
- **Macrostrat API** — not a bulk download; documented as a fallback
  query pattern (`lith_class=mafic`/`ultramafic` filter on the
  `/api/v2/geologic_units/map` endpoint) for gap-filling specific regions,
  particularly the US where Macrostrat's merged state geologic maps give
  good resolution.

## License notes

- US federal sources (NATCARB, USGS DS414, USGS SAU regional shapefiles)
  are public domain / US Government work — no restrictions.
- Geoscience Australia (CC-BY 4.0) and Norway Sodir (Norwegian open
  government data policy) are attribution-only.
- GLiM (Hartmann & Moosdorf 2012) is CC-BY — attribution required, cite
  the 2012 GGG paper.
- LIP shapefiles (Swanson-Hysell Group / Ernst & Youbi 2017) have no
  explicit repo license — cite Ernst & Youbi (2017) and Park et al. (2020,
  Zenodo DOI 10.5281/zenodo.3981262) for safety.
- PLATES ophiolite compilation (UTIG) has no explicit license stated —
  treat as research/academic use only until confirmed otherwise; do not
  present as a commercial-cleared layer without following up with UTIG.
- CGG/Sedimentary Basins of the World is proprietary-adjacent per the
  original brief and now appears inaccessible even via the "open file"
  mirror — do not use.

## Processing/projection notes (general)

- Standardize everything to EPSG:4326 for Leaflet.
- Use `mapshaper` for simplification (`-simplify visvalingam keep-shapes`)
  to avoid topology breaks, target under ~5 MB per layer file for
  reasonable web load times; consider TopoJSON output if multiple layers
  share boundaries, to save bytes.
- Keep injection and mineralization layers as separate GeoJSON/TopoJSON
  files (not combined) so the front-end can toggle them independently, and
  keep a `source` attribute on every feature for the info-panel citation
  and to preserve the confidence-tiering described in the Layer A/B
  recipes above.
