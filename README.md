# Global CO₂ Storage Atlas

An interactive map inventorying the world's CO₂ storage opportunities, split by
storage mechanism:

- **Geologic subsurface sequestration** — supercritical CO₂ injected into
  sedimentary reservoirs (deep saline aquifers, depleted oil & gas fields).
- **In-situ subsurface mineralization (ISM)** — CO₂ injected into reactive
  mafic/ultramafic rock (basalt, peridotite, serpentinite) where it converts to
  solid carbonate within months–years (the Carbfix / 44.01 / Cella model).

**Live map: https://hausfath.github.io/co2-storage-map/src/index.html**

Or run it locally: open `src/index.html` in any browser. No server, no build
step — all data is bundled as JavaScript.

## What's on the map

- **Injection capacity by basin** (default) — 92 assessed sedimentary basins
  worldwide, 46 with published storage capacity estimates (Gt CO₂), colored by
  capacity with dashed styling for theoretical-tier-only numbers and for basins
  mapped but not yet assessed. Click any basin for the estimate, tier,
  cross-source range, and citations. A country-level choropleth (45 countries)
  is available as an alternative view, plus US (NATCARB) and EU (CO2StoP)
  formation-level detail layers.
- **In-situ mineralization formations** — a 35-formation global inventory
  (continental flood basalts, ophiolite/peridotite belts, rift and arc
  volcanics, offshore basalt) with literature capacity estimates, drawn from
  LIP and global-ophiolite GIS compilations; plus ~1,000 additional mapped
  ophiolite bodies shown as "uncharacterized."
- **Storage projects** — 84 dedicated-storage projects (69 geologic, 15 ISM)
  with statuses as of mid-2026, sized by capacity, colored by mechanism.
  EOR/ECBM projects are excluded.

Headline framing: geologic storage resources are vast (~1,290 Gt prudent →
~14,300 Gt catalogued → 55,000 Gt theoretical) but concentrated in sedimentary
basins; ISM capacity is effectively unlimited (~10⁶ Gt theoretical) and sits in
*different* geographies — including regions where sedimentary storage is scarce
(India, Japan/Korea, East Africa, Oman/UAE, Iceland, the US Pacific Northwest).
Capacity tiers (theoretical / effective / practical) answer different questions
and are never summed on this map.

See **[docs/METHODOLOGY.md](docs/METHODOLOGY.md)** for sources, tier
definitions, join logic, and caveats. Compiled research with full citations
lives in `data/research/`.

## Layout

```
src/index.html, app.js, styles.css   # the application (vendored Leaflet in src/vendor)
src/data_bundle.js                   # capacity + project data (generated)
data/geo/geometry_*.js               # web-ready geometry (generated)
data/research/                       # compiled research: JSON + cited markdown
data/raw/                            # downloaded geodata (not in repo; see
                                     #   data/research/geodata_sources.json for URLs)
scripts/build_basins.py              # basin capacity ↔ polygon join
scripts/build_geo.py                 # ISM + country geometry build
scripts/build_bundle.py              # data bundle build
docs/METHODOLOGY.md                  # methodology & source list
```

Rebuild generated files: `python3 scripts/build_geo.py && python3
scripts/build_basins.py && python3 scripts/build_bundle.py` (needs geopandas;
raw inputs re-downloadable via the URLs in `data/research/geodata_sources.json`).

## Geometry credits

Natural Earth (countries); USGS World Petroleum Resources 2009–11 provinces and
Circum-Arctic CARA 2008; USGS Coleman & Cahan 2012 US sedimentary basins; NETL
NATCARB saline formations; Geoscience Australia Geological Provinces (CC-BY 4.0);
ANP Brazil basins; USGS OFR 00-047 China basins; EU CO2StoP storage units;
Ernst & Youbi LIP outlines; PLATES/UTIG global ophiolite compilation.
