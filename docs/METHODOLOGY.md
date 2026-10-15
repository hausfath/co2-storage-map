# Methodology — Global CO₂ Storage Atlas

## Scope
Two storage mechanisms:
1. **Geologic subsurface sequestration** — supercritical CO₂ injection into sedimentary
   reservoirs (deep saline aquifers, depleted oil & gas fields).
2. **In-situ subsurface mineralization (ISM)** — injection into mafic/ultramafic rock
   (basalt, peridotite, serpentinite) with rapid conversion to solid carbonate.

Excluded: EOR/ECBM (utilization, not durable CDR storage), ex-situ surface mineralization (siting is driven
by alkalinity + CO₂ logistics, not subsurface geology).

## Kinds of capacity estimate
All capacity numbers carry a label for the kind of estimate, and different kinds are never
summed or averaged. Three are screening tiers, and the fourth is a resource-catalogue total:
- **Theoretical**: full pore volume (sedimentary) or full rock-mass stoichiometry (ISM).
- **Effective**: screened for injectivity, depth, reservoir quality. Includes USGS
  "technically accessible" (TASR) estimates.
- **Practical**: additionally screened for access, economics, regulation.
- **Catalogued**: OGCI CO2 Storage Resource Catalogue (CSRC) "aggregated" totals. CSRC
  classifies sites under the SPE Storage Resources Management System (SRMS) and sums every
  maturity class (stored, capacity, sub-commercial, undiscovered). These do not map onto a
  single screening tier: globally, 13,579 of 14,256 Gt (95%) is Undiscovered (CSRC Cycle 5
  Main Report, Aug 2025, executive summary). Catalogued is the most common country label in the atlas (67 of
  74 countries; 10 of 108 mapped basins after the 2026-10-15 corrections), so it is described alongside the three tiers in the UI
  fine print, tour, tooltips and methodology modal (2026-10-15).

**Labels in the UI:** detail panels show one of six labels (Practical, Effective, Catalogued,
Theoretical, Not assessed, Estimate) derived from the *primary* tier recorded in the research
tables (`tierInfo()` in `src/app.js`: regex on the text before any `;` / ` / ` / `alt`), each
with a one-line explainer. Mixed theoretical/technical tiers are labeled Theoretical
(conservative). "Estimate" is a fallback for a source that does not state its screening level;
only the Gulf of Thailand composite (2.69 Gt) uses it. The raw tier string is kept as the
badge's hover title and under "Details & sources". Research notes, alternate estimates and
citations are collapsed by default; formation and unit lists show the first five entries.

**Dashed outlines (2026-10-15 fix):** a basin or country is drawn dashed when it has no
number or its label is Theoretical, i.e. the same primary-tier rule as the badge
(`isSoft()` in `src/app.js`). Previously the build flagged "soft" tiers by matching
"theoretical/prospective" anywhere in the tier string, which disagreed with the badge for 11
basins and 1 country: 7 Catalogued basins whose *alternate* estimate was theoretical were
dashed (UK and Dutch Southern North Sea, Po Valley/Adriatic, Polish Lowlands, Moesian
Platform, Ebro, Pannonian) and are now solid; 4 basins labeled Theoretical were solid (WCSB,
Ahnet-Gourara, Bonaparte, Browse) and Algeria (country view) was solid; these are now dashed.
The `soft_tier` field was removed from `geometry_basins.js` and `build_basins.py`.

Global anchors: geologic 1,290 Gt, the low end of the risk-screened "prudent planetary
limit" (Gidden et al. 2025, Nature, doi:10.1038/s41586-025-09423-y: central ~1,460 Gt, range
1,290–2,710 Gt) / ~14,300 Gt catalogued (OGCI CSRC Cycle 5, 2025: 14,256 Gt) / up to 55,000 Gt,
the top of Kearns et al. 2017's range. Their abstract: "Globally, we estimate there are between
8,000 and 55,000 gigatonnes (Gt) of practically accessible geologic storage capacity for carbon
dioxide." The atlas previously called this a "theoretical ceiling"; it now uses the authors'
term (2026-10-15). Abstract read via the Semantic Scholar copy (publisher pages block scripts);
Crossref confirms the bibliographic record. ISM ~10⁶ Gt
theoretical (NASEM 2019; Snæbjörnsdóttir et al. 2020). Deployment: RMI's Applied Innovation
Roadmap for CDR (2023), section 8.2, has in-situ mineralization providing "up to 1.2 GtCO2/y
of sequestration globally" by 2050 in an optimistic "success story" scenario, with "several
GtCO2/y" possible later in the century.

**Citation corrections (2026-10-15):** (1) the prudent-limit paper was cited as "Gasser et
al."; the first author is Gidden (Crossref), corrected everywhere. (2) The ISM deployment
range was given as "~1.2–5 Gt/yr by 2050 (RMI 2023)", carried over from a secondary summary
rather than the report itself. RMI's report gives up to 1.2 GtCO2/y by 2050 as an optimistic scenario and does not give
5 Gt/yr, so the text now says that.

## Injection layer
**Default view: per-basin.** 92 basins compiled in `data/research/basin_capacity.{json,md}`
(51 with capacity estimates after the 2026-10-15 USGS fill, the rest mapped as
assessed-extent-only), joined to polygons by name+alias in `scripts/build_basins.py`. With the
26 USGS-assessed US basins added below, the map draws 108 distinct basins (112 features;
Sureste, Eastern Arabian and Kutai are multi-part), 71 of them with a capacity number: 82 of the
92 research rows (48 with a number) plus the 26 USGS-only basins (23 quantified). All 35 US
basins (9 research rows + 26) headline USGS 2013 basin totals. Counts in the methodology modal are computed
from the data at load time, counting each basin name once. Geometry priority: national layers — USGS
Coleman & Cahan 2012 (US), Geoscience Australia Geological Provinces (CC-BY), ANP Brazil,
USGS OFR 00-047 (China), curated WCSB/Williston (Canada) — then the USGS World Petroleum
Resources 2009-11 provinces + Circum-Arctic (CARA 2008) as global backbone. Basins render
dashed when their primary tier is Theoretical or they have no number (see above). 10
research rows have no polygon: 7 without a capacity number (Guadalquivir, Anambra, Subei,
Mahanadi, Tomakomai, Niigata/Sea of Japan, Jeju) and 3 with one (Zululand-Durban, Cambay,
Ulleung). Basin polygons simplified at 0.015 deg (~1.5 km; was 0.04).

**European basin reconstruction (2026-08):** 11 European capacity basins absent from
every open polygon source (Paris, North German, Aquitaine, Polish Lowlands, Baltic,
Moesian, Transylvanian, Ebro, Pannonian, Celtic Sea, Lusitanian) are drawn as the
dissolved extent of the CO2StoP formations and storage units assigned to them (by
name keyword, country, and proximity to the basin center; raw polygons from the
CO2StoP open-format package, Zenodo 10.5281/zenodo.15837736, saved at
`data/raw/basins/co2stop_formations.geojson`). Panels label these outlines as
assessed-extent, not structural boundaries. Guadalquivir has no CO2StoP polygons at
all and remains unmapped. Williston is drawn as the full cross-border structural
basin (US Coleman outline + curated Canadian portion) with the US-only capacity
caveat in its panel, and the WCSB polygon is clipped to meet it at the basin margin
rather than the national border.

**Merged US/EU formation detail (2026-08):** there is no separate saline-formation
layer — formation detail is folded into the basin layer to avoid stacked, overlapping
polygons. US: basins with USGS 2013 National Assessment coverage take their geometry
from the dissolved union of that basin's Storage Assessment Unit footprints (191 SAUs
queried from the USGS ArcGIS StudyAreas services, public domain; capacity from DS 774
Table 1; `scripts/build_us_saus.py` + `scripts/build_basins.py`), and the basin detail
panel lists each formation with its mean TASR and USGS most-likely depth from surface
(DS 774 Table 1, column "SAU depth from surface, M.Likely"). USGS assessed each storage
assessment unit (SAU) between 3,000 and 13,000 ft; where favorable reservoir rock existed
below 13,000 ft the assessor could define a separate "Deep" SAU (Brennan et al. 2010, OFR
2010-1127; Blondes et al. 2013, OFR 2013-1055). All 46 Deep SAUs in DS 774 have a minimum
depth of exactly 13,000 ft. 45 formations in the atlas have a main + Deep pair; their panel
row shows the formation total with one indented sub-row per interval (depth and mean TASR,
shallowest first, the Deep one marked "deep interval"), replacing the earlier "2 intervals"
placeholder (2026-10-15). This replaced both the NATCARB 10-km grid (the cause of the
blocky US outlines) and the Coleman & Cahan outlines for those basins. EU: CO2StoP
storage units inside a mapped basin are listed in that basin's detail panel; units
with no covering basin polygon (Paris, Ebro, etc.) draw standalone with the same dashed
"capacity unquantified" style as other basins (2026-10-15; previously a separate deep-blue legend
class), and their panel names CO2StoP as the source.

**US basins: one consistent USGS headline (2026-10-15, second pass).** Previously US basins
mixed sources: Gulf Coast showed the USGS technical share (1,770 Gt), Illinois, San Joaquin and
Williston showed Teletzke et al. 2018 practicable P50s (12 / 30 / 15 Gt), five basins
(Appalachian, Michigan, Powder River, Denver, Alaska North Slope) showed "No capacity estimate"
although their panels listed USGS formations, and the 26 USGS-only basins showed a sum of SAU
means with a summed P5/P95 range. Now every US basin headlines USGS's own basin aggregate from
DS 774 Table 1 ("Aggregated totals" rows: mean, with P5–P95 as the range; USGS computed these
with dependence between SAUs, so no summed-percentile caveat is needed). Tier label: Effective
("technically accessible (USGS 2013)"). Teletzke practicable values are kept as `alt_estimates`
and shown under "Other estimates".
- Data: `scripts/extract_ds774.py` writes `data/research/usgs_ds774_saus.json` (all 202 SAUs in
  36 basins plus the basin aggregates) from Table 1. Validation: SAU means sum to 2,984 Gt and
  basin aggregates to 3,013 Gt, against USGS's published ~3,000 Gt national mean (aggregates are
  rounded to two significant figures; Bend Arch–Fort Worth SAUs sum to 15.9 Gt vs a 15 Gt
  aggregate). Gulf Coast = 59.7% of the national aggregate total.
- Formation lists now come from this table rather than the SAU polygons, so Williston (9 SAUs,
  150 Gt, no published polygons) lists its formations. Kandik Basin (Alaska, 1.5 Gt) has no
  polygon of any kind and is not drawn.
- Headline changes: Gulf Coast 1,770 → 1,800 Gt; Illinois 12 → 150; San Joaquin 30 → 51;
  Williston 15 → 150; Appalachian 20, Michigan 57, Powder River 18, Denver 3.7, Alaska North
  Slope 270 (previously blank). Alaska's 270 Gt matches a figure the original research had
  dismissed as an uncorroborated secondary value.
- 10 SAUs are marked non-quantitative (NQ) by USGS. Three basins consist only of NQ SAUs
  (Central California Coast, Eastern Oregon-Washington, Raton): they show "No capacity estimate"
  with the label Not assessed and the explainer "USGS assessed this basin in 2013 but did not
  estimate its storage capacity". NQ formations elsewhere show "not quantified".
- The research rows keep the previous values in `capacity_research`, `tier_research`,
  `source_research` and `notes_research`.

## Storage costs (removed 2026-10-15)
Indicative storage-cost lines were previously shown in basin detail panels (NETL 2024
saline cost model, NETL QGESS 2019, STRATEGY CCUS D4.5, Schmelz et al. 2020 class
ranges). They are withheld from the atlas for now. The transcriptions remain in
`data/research/storage_costs.json`; restoring them means re-adding `costs` to
`scripts/build_bundle.py` and the cost lookup in `src/app.js` (see git history).

**Alternative view: per-country choropleth** using each country's preferred estimate from
`data/research/sedimentary_capacity.{json,md}` (74 countries, 70 with an estimate; 29 added
2026-10-15 from the OGCI catalogue). Uncolored: Russia (no citable national estimate),
Finland, Cyprus and Oman (no published estimate). West Siberian Basin mapped but unassessed.

## Mineralization layer
34-formation inventory (35 before the 2026-10-15 merge of the Vøring/Møre entry into the
North Atlantic Igneous Province entry) with literature capacity estimates in
`data/research/mineralization_capacity.{json,md}` (Snæbjörnsdóttir 2020, Kelemen &
Matter 2008/2019, McGrail/PNNL, Goldberg, NAS 2019). Six key numbers spot-verified;
Deccan flagged for a lower probabilistic reassessment.

**Columbia River (resolved 2026-10-15):** the old "PNNL 2024, 36-148 Gt" was a mis-read of
manuscript line numbers, and the "McGrail 2006, 10-50 Gt" figure in the research notes does not
exist: McGrail et al. 2006 (para 34) give "greater than 100 Gt CO2" for the whole basalt group.
The headline is now 21-40 Gt (Cao et al. 2024 accepted manuscript, 10,000 km2 Grande Ronde study
area), with McGrail >100 Gt and Cao's published-abstract 181-351 Gt (P50 304) as alternates; the
two Cao numbers for the same area are unreconciled (published full text not accessible).

Polygons: Ernst & Youbi LIP outlines (flood basalts),
PLATES/UTIG global ophiolite compilation (matched by geographic descriptor;
unmatched bodies shown as "uncharacterized"), circle approximations where no
polygon exists (rift/arc volcanics, offshore basalt, harrats). US ultramafics
(USGS DS-414) downloaded but not yet rendered, so DS-414 is no longer listed as a map
source in the methodology modal.

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
100 dedicated-storage projects (83 geologic, 17 ISM), statuses as of mid-2026,
compiled in `data/research/projects.{json,md}` from GCCSI, IEA CCUS database,
EPA Class VI tracker, operator disclosures, press. Operational: ~16.8 Mtpa geologic
(18 sites) vs ~0.05 Mtpa ISM (was ~20.4 Mtpa before the 2026-10-15 EOR exclusions below).

## Public detail panels (2026-10-15)
Panels show key information only and send readers to linked sources: headline and label with a
one-line explainer, the range, key facts (countries/setting, rock, suitability, activity, depth),
a short note shown in full, formation/unit lists, "Other estimates", and a visible Sources list.
The collapsible "Details & sources" sections, "(cont.)" overflow, raw "Capacity tier as recorded"
line and first-sentence truncation were removed (the truncation split at abbreviations such as
"vs.", which cut off the CAMP suitability text).
- Stat-tile (i) tooltips were simplified to plain language without citations (2026-10-15);
  the sources are in the methodology modal. The (i) icons now sit beside the "potential range" /
  "theoretical potential" labels they describe, rather than the tile titles.
- The one-line explainer for each kind of estimate (e.g. "Screened for depth, injectivity and
  reservoir quality...") and the "Gt = billion tonnes CO2" line were removed from the panel body
  at the user's request; the explainer is now the hover tooltip on the kind-of-estimate badge.
  The "Why mineralization matters" paragraph was removed from the methodology modal.
  The modal no longer links to the GitHub repository (data/research, METHODOLOGY.md), since the
  published version will not expose it; the LIP-outline credit now links to the Ernst & Youbi
  2017 paper rather than the GitHub-hosted outline files.
- "Other estimates" rows show the kind label when the tier maps to one, otherwise the
  estimate's own short description; an optional `gt_label` (e.g. ">100 Gt") overrides the
  number, and bare `doi:` citations are linked to doi.org.
- Reader-facing text in the research JSON (basin `notes`; country `notes`,
  `onshore_offshore_notes`; ISM `capacity_basis`, `depth_porosity_notes`, `suitability_notes`,
  `existing_activity`; project `notes`) was rewritten as public copy of at most two short
  sentences, keeping every caveat that matters for interpreting the number and dropping
  research-log language ("this pass", "row", "polygon coverage", "do not sum", stale references
  to removed layers such as the separate Mt. Simon polygon). Drafts were written by subagents
  against a style brief, then checked for new numbers, length and dashes before merging; two
  were changed by hand (China: catalogue total may draw on Dahowski, so not "supporting"; West
  Siberian: dropped an unsourced analogy-based range). Originals are kept in `<field>_research`.
  Totals merged: 75 basin notes, 29 countries, 124 ISM fields (35 formations), 103 project notes.
- Superlatives: about 45 uncomputed superlatives in ISM and project text ("X's first CCS
  project", "longest-running", "world's largest", "most mature") were removed or neutralized
  ("a very large ophiolite", "a CCS project injecting..."), per the rule that superlatives appear
  only when computed from the data. Dated "first injection" milestones were kept.
- Columbia River: resolved, see the Mineralization layer section.
- Asset URLs in `src/index.html` carry a version query (`?v=YYYYMMDDx`) so returning visitors
  do not combine a new `app.js` with cached geometry; bump it whenever data files change.
- Sources: each research citation string is split on top-level semicolons. A part containing a
  known citation (`source_links.json` `match`) is shown as that link's clean `label` (one label
  per URL, added 2026-10-15), deduplicated; unlinked parts are trimmed of annotations
  (" -- ..." tails, ScienceDirect/PMC accession codes), and "none found" / "see X entry" parts
  are dropped. The raw strings are unchanged in the research files.

## Data corrections (2026-10-15, verification round)
Each flagged issue was checked against primary sources by verification subagents and the
values below were applied; originals are kept in `*_research` fields. Proposals and evidence
quotes were reviewed before merging.

**OGCI catalogue (CSRC) values re-extracted.** Many country figures had been mis-extracted in
2026-07 (via a text proxy; `csrc_country_capacity.md` had flagged them for spot-checking).
Values were re-read from the Cycle 5 appendices (Europe, Americas, Asia, Oceania; image tables
rendered and read), the Cycle 5 main report Table 4-3 (countries added in Cycles 5-6, Mt) and the
Cycle 4 main report Table 4-4 and appendices D/F (MENA and Sub-Saharan Africa; no Cycle 5 version
of either was found). Corrected (Gt, old → new): Norway 18.1 → 100.918; UK 55 → 81.341; Germany 120.657 →
51.208; Netherlands 18.5 → 3.210; Poland 3.48 → 82.870; Romania 4.1 → 18.425; Spain 2.47 →
20.771; Italy 7.02 → 8.203; Slovakia 1.8 → 11.318; Ireland 8.0 → 90.634; Sweden 0 → 3.369;
Malaysia 28.25 → 149.6; Australia 485 → 502.429. Confirmed unchanged: Austria, Bulgaria, Croatia,
Denmark, France, Greece, Hungary, Mexico, Brazil, Canada, USA, China, India, Bangladesh,
Indonesia, Japan, Kazakhstan, Brunei, New Zealand, UAE, Kuwait, Qatar, South Africa, Mozambique.
Oman's 0.558 Gt is an error inside CSRC Cycle 4 (identical to Brunei's value; the same section
says Oman has zero sites) and is now "not assessed". Finland and Cyprus (no published estimate)
are "not assessed" rather than 0. 29 countries catalogued in Cycles 4-6 were added to the
country view (e.g. South Korea 203.4, Ukraine 64.5, Uzbekistan 34.6, Pakistan 31.7, Colombia
28.3, Philippines 23.3, Vietnam 21.8, Argentina 14.4, Israel 11.8, Thailand 10.5 Gt). Albania
was left out: the Europe appendix table shows 0 while main-report Table 4-3 shows 131 Mt.

**National totals on basins (user decision).** A national figure is shown on a basin only when
essentially all of that country's catalogued sites lie in it (Norway, Netherlands, Denmark, the
UK shelf, Polish Lowlands, Pannonian as HUN+HRV+SVK, Kuwait, Qatar). Otherwise the basin is
"Not assessed" with a note pointing to the country view: North German, Moesian, Ebro, Po
Valley/Adriatic, Paris, Aquitaine, Celtic Sea (Ireland's sites are in the Peel, Slyne and East
Irish Sea basins), Malay, Sarawak, Outeniqua, Zululand-Durban (previously an invented 50/50
split), Rovuma (Mozambique's sites are onshore gas fields), South Oman Salt.
"Southern North Sea Basin (UK sector)" was renamed "UK Continental Shelf (North Sea and East
Irish Sea)" because it carried whole-UK figures (81.3 Gt CSRC; 78 Gt UKSAP, of which 15 Gt is in
the Southern North Sea).

**Other basin and country corrections.** WCSB 148/385/390 (877 Gt national secondary figure
removed; 385 Gt is Clean Prosperity 2024 from NATCARB) and Canada high 389. Precaspian 461 Gt
(Kazakh sector, Abuov et al. 2020, previously misattributed to "Amantayeva"; the CSRC Kazakhstan
figure is compiled from the same paper, so they are not independent). Rub' al Khali 105/154/219
and Eastern Arabian 139/214/316 Gt (Saudi parts, Ye et al. 2023; the previous 40-318 range and
derived residual were not in the paper). Algeria 1.03/1.05/5.16 Gt (the 45 Gt and 10,000 Gt
figures were not in the cited sources; In Salah injected ~3.8 Mt in 2004-2011, then suspended).
Nigeria range 2,742-29,046 Gt (IFC atlas low/high cases; CSRC's 0 meant "no published
information"). China: CSRC's 3,067 Gt saline figure is copied from PNNL/Dahowski 2009 (with IRSM
Wuhan), so not independent; basin values are from Liu et al. 2022 with PNNL values as
alternates. Taranaki 0.43 Gt (New Zealand's 2.47 Gt saline is in Canterbury-Otago, not
Taranaki). Paraná scoped to Brazil only, Espírito Santo separated. Gulf of Thailand: 2.69 Gt
removed as a basin headline (a national depleted-field estimate, partly onshore, not from the
cited paper). Australian basins from the Carbon Storage Taskforce 2009 Table 3 (E=4%,
theoretical): Gippsland 30.8/52.0/81.7 (offshore+onshore), Cooper-Eromanga 15.7/34.7/67.2
(Cooper+Eromanga SA), Surat 6.1/10.3/16.1, Otway 12.9/25.5/44.7, Perth 13.8/29.6/51.0, Browse
mid 11.65 → 11.3 (summed-percentile ranges are approximate). Germany note: the KSpG amendment
(in force late Nov 2025) allows offshore storage in the EEZ; onshore needs a state opt-in.

**Mineralization.** Columbia River (see above). Deccan 41-305 Gt (Gorain et al. 2025 deep-basalt
low end; Vishal et al. 2021 Deccan-only high; the old 316 Gt was Deccan+Rajmahal). Rajmahal
3.4-11 Gt (Vishal 2021) and corrected thickness (450-600 m). Harrat: capacity removed (the only
published figure, 4.2 Gt, is for Jizan rift basalts outside the harrats). Kenya Rift: unsourced
50/200 Gt bounds removed; 400 Gt shown only as a company statement. Mid-ocean ridges 2,000/
40,000/100,000 Gt (Snæbjörnsdóttir et al. 2014 methods). Reykjanes 60-7,000 Gt is the offshore
ridge estimate (Snæbjörnsdóttir & Gislason 2016); onshore Iceland 21-2,470 Gt (2014 paper).
North Atlantic Igneous Province merged with the duplicate Vøring/Møre entry. Juan de Fuca
245/840/2,450 Gt CO2 with the two study areas stated separately. BC serpentinite: the CO2 Lock
pilot is at the SAM property ~50 km SW of Prince George, not Atlin.

**Projects (user decision).** Removed as EOR/utilization or without a storage site: Guohua Jinjie
(all CO2 used for EOR and chemicals), Al Reyadah (EOR), Alberta Carbon Trunk Line (CCS with EOR;
replaced by Enhance's dedicated Origins saline hub, under construction, 1.5 Mtpa), Summit Carbon
Solutions (North Dakota storage permits voided March 2026; no named replacement site). Huaneng
Zhengning counted at its 0.5 Mtpa dedicated saline share; ONGC Gandhar kept as a planned pilot.
Status/date fixes: Ordos (pilot concluded, 2011-2015, coordinates moved ~300 km east), Donghae-1
(planned, 2030; coordinates moved to ~60 km SE of Ulsan), Kasawari (depleted gas field, not
saline), Arthit (approved, 2028), Prinos (approved), Ankeron (planned), Jubail (start 2028),
Tundra (approved, start year unknown), Northern Lights Phase 2 (adds ~3.5 Mtpa). Operating
sedimentary storage falls from ~20.4 to ~16.8 Mtpa as a result.

**Resolved after review (2026-10-15).** Saudi Arabia: headline 432 Gt (Ye et al. 2023 abstract:
saline ~432, depleted oil ~5, gas ~9 Gt at P50), range 432-446; the previous 440 was an unpublished
midpoint. Bonaparte mid 60 → 55.3 Gt (Taskforce P50; low/high already matched). Kasawari moved
from near Kuching to the Kasawari field in Central Luconia (~200 km off Bintulu; Offshore
Technology); CO2 goes to the depleted M1 field via a 138 km pipeline, so the point is approximate.
Reykjanes Ridge pilot status "pilot" → "planned" (monitoring boreholes only, no injection).
Reykjanes circle redrawn by the full rebuild.

**Still open.** Cao et al. 2024's two inconsistent ranges for the same study area (published full
text not accessible); Jubail's reported $1.5bn EPC contract (kept out of public text); the
Donghae-1 review withdrawal (news reports only); Jeju (23.5-687 Gt) and Subei/Ordos saline figures
(Liu et al. 2022) not added; Albania (catalogue tables disagree, 0 vs 131 Mt) left out; the
global mid-ocean ridge entry has no map geometry (pre-existing).

## Source hyperlinks
Detail-panel citations are linked at render time via `data/research/source_links.json`
(citation substring -> verified URL) plus raw-URL detection; projects carry a verified `url`.
Method, coverage and the review list of unverified/rejected candidates: `data/research/source_links.md`.

**Methodology modal (2026-10-15):** every source in the in-app "Methodology & sources" modal
is linked (DOIs where they exist, otherwise the official landing or download page used for the
build). DOIs were checked against Crossref; landing pages by HTTP fetch. Natural Earth was confirmed by fetch (HTTP 200, 2026-10-15). The Norway Sodir CO2 atlas link
(https://www.sodir.no/en/whats-new/publications/co2-atlases/) is taken from the search index because
the site blocks scripted requests. No OGCI catalogue Cycle 6 was found as of 2026-10-15; Cycle 5
(Aug 2025) is the "Latest Report" on the catalogue page. USGS Circular 1386 has a corporate author
(USGS Geologic Carbon Dioxide Storage Resources Assessment Team); OFR 2013-1055 is Blondes et al. The UTIG PLATES ophiolite link is the http download URL used for the build. All counts
in the modal (basins, basins with numbers, USGS-only basins, reconstructed EU basins,
Catalogued countries/basins, formations, projects) are computed from the bundled data.

## Build
1. `python3 scripts/extract_ds774.py Table_1.xlsx` writes `data/research/usgs_ds774_saus.json`
   (USGS DS 774 Table 1, https://pubs.usgs.gov/ds/774/tables/Table_1.xlsx).
2. `python3 scripts/build_us_saus.py Table_1.xlsx` (USGS SAU polygons).
3. `python3 scripts/build_geo.py && python3 scripts/build_basins.py` (geometry; need geopandas).
4. `python3 scripts/build_bundle.py` (standard library only).

Text and number edits to `data/research/*.json` do not need geopandas:
`python3 scripts/refresh_attrs.py && python3 scripts/build_bundle.py` re-derives the panel
attributes in `geometry_basins.js` and `geometry_ism.js` without touching geometry, using the
same functions as the full build (`scripts/basin_attrs.py`; the ISM field map mirrors
`fprops()` in `build_geo.py`). Before the 2026-10-15 edits, running it reproduced
`geometry_ism.js` byte for byte. The app (`src/index.html`) is fully static. For testing, opening
`src/index.html?debug` exposes `window.__atlas.basin(name)`, `.country(iso3)`, `.formation(name)`
and `.project(name)` to open any detail panel. After any data change, bump the `?v=` asset version in
`src/index.html`.
Caveat: the refresh keeps `units` and `countries` from the existing features (both are set by
geometry steps in `build_basins.py`: EU unit attachment and the cross-border Williston), so an
edit to a basin's `countries` in the research JSON only takes effect after a full geopandas
rebuild.

**Full geometry rebuild (2026-10-15, geopandas 1.2.0 / shapely 2.2.0 in a local `.venv`):**
`build_geo.py` and `build_basins.py` were re-run and their output is now the committed geometry
(`build_us_saus.py` was not re-run; it needs the live USGS services and its inputs are unchanged).
Before replacing the files, every attribute was compared with the refresh output: identical for all
198 basin features, all ISM features and all 242 countries (apart from absent-vs-null `depth` on
unmatched ophiolites). Geometry differs only by re-simplification under the newer shapely: maximum
bounding-box shift 0.03 deg (about 3 km), except the intended resize of the Reykjanes Ridge circle
to its corrected 93,000 km2. The Vøring/Møre circle is gone (entry merged). `build_geo.py` no
longer writes the unused NATCARB saline grid
(`GEO_INJ_NATCARB`), cutting `geometry_injection.js` from 1.09 MB to 0.75 MB.
