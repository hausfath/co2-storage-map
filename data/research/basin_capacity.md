# Basin-level CO2 storage capacity — methodology and caveats

*Compiled 2026-07-13/14. Companion file: `basin_capacity.json` (92 basin rows, array schema
documented in the task brief — basin/match_names/countries/capacity_gt/tier/split/
onshore_offshore/source/notes). Intended to be joined onto a basin polygon layer by name
(use `match_names` for fuzzy matching against whatever basin-name field the polygon source
uses — polygon datasets are inconsistent about "Basin" suffixes, hyphenation, and
composite/regional names).*

## Source hierarchy (highest to lowest authority per basin, when multiple exist)

1. **Basin-specific academic/government assessments** (e.g., USGS SAU chapters, Vishal et al.
   for India, Hendriana et al. for Indonesia, the Saudi/Algeria/Mexico national academic
   papers, China's Wuhan Institute basin table, GeoCapacity/CO2StoP country papers for
   Europe). These are the only sources that are genuinely basin-attributed rather than
   country-aggregated, so they are preferred wherever available.
2. **CSRC/OGCI Cycle 4/5 country totals**, apportioned to a basin only when the country's
   own documentation names a single dominant basin (e.g., Kazakhstan → Precaspian, UAE →
   Rub al Khali, Mozambique → Rovuma). Where a country's CSRC total spans multiple basins
   with no published split (South Africa, Malaysia, France, Spain), the CSRC number is
   either apportioned as an explicit, flagged approximation (South Africa: 50/50 Outeniqua/
   Zululand-Durban) or left on a single named "dominant" row with the caveat that it's a
   national, not basin, figure (France's Paris Basin, Spain's Ebro Basin).
3. **National theoretical totals from secondary literature** (CO2StoP for Europe, MEMR for
   Indonesia) used only as upper-bound context (`high` field), not as basin-level numbers,
   unless a paper explicitly basin-splits them.
4. **Project-level reserves/injection rates** (Cooper Basin Santos reserves, Tomakomai/
   Niigata annual injection design rates, Gippsland CarbonNet subset) — used only as a floor/
   context note, explicitly flagged as NOT basin-comprehensive, because summing project
   reserves would badly understate true basin capacity.

## How to avoid double-counting

- **Formation-within-basin**: Mt. Simon Sandstone (USA) is a formation inside the Illinois
  Basin — do not add Mt. Simon-specific numbers on top of the Illinois Basin row. Same
  logic applies to Utsira/Johansen (inside the Norwegian North Sea Basin row) and any other
  named storage complex that is a sub-unit of a basin already in this file.
- **Basin-within-basin / regional provinces**: the Southern Permian Basin row is a parent
  supra-national province containing the North German Basin, Dutch and UK Southern North Sea
  sectors, and part of the Danish sector — all four already appear as separate rows. The
  Southern Permian Basin row's capacity is intentionally null; it exists only so the polygon
  layer has a reference shape for the whole province. Do not sum it with its four children.
  Likewise Western Canada Sedimentary Basin subsumes the Canadian portion of the Williston
  Basin — there is no separate "Williston (Canada)" row to avoid this exact trap.
- **Combined basin-pair figures reported as one number**: Brazil's Paraná + Espírito Santo
  (6.1 Gt) and Indonesia's South Sumatra + West Java (14.8 Gt high) are each a single number
  covering two basin rows in this file. The second basin of each pair has capacity left null
  with a note pointing back to the combined figure — summing both rows would double the true
  total.
- **Country total vs. basin total**: for most countries a CSRC/national aggregate exists
  alongside one or more named-basin rows. Where the basin row *is* essentially the whole
  country's assessed capacity (New Zealand/Taranaki, UAE/Rub al Khali, Mozambique/Rovuma,
  Kazakhstan/Precaspian, Qatar/Qatar Arch, Kuwait/Arabian Basin, Oman/South Oman Salt Basin),
  the basin figure equals the country figure — if a country-level layer is also being built
  for this atlas, do not add the country total AND the basin total for these countries, they
  are the same number presented two ways.
- **EOR vs. dedicated storage**: Brazil's Santos and Campos basin rows carry an explicit
  caveat that Petrobras pre-salt CO2 reinjection is CO2-EOR (revenue-driven reinjection into
  producing fields), not a geologic-storage capacity assessment — do not treat reported EOR
  injection volumes as basin storage capacity. India's Vishal et al. figures separately mix
  saline theoretical capacity with Deccan Traps basalt mineralization potential (a different
  storage mechanism); the India country entry in `sedimentary_capacity.json` already flags
  this — this file's Cambay Basin row uses only the clastic/carbonate saline+HC figure.
- **Tier mixing**: within a single basin row, `capacity_gt.low/mid/high` sometimes span
  different tiers (e.g., Gulf Coast Basin: low=practicable, high=CSRC whole-country
  aggregate). This is flagged in each `tier` field — never treat low/mid/high as a normal
  confidence interval on one quantity without reading the tier field first, exactly as
  documented for the global figure in `sedimentary_capacity.json`.

## Regional caveats

- **USA**: Teletzke et al. 2018 (practicable, P50/P95) is the only source with a clean
  basin-level breakdown (Gulf Coast, California, Williston, Illinois). USGS 2013 SAU chapters
  exist for Appalachian, Michigan, Powder River, Denver, and Alaska North Slope but
  basin-specific Gt figures were not extracted in this pass — these five rows are included
  for polygon coverage with capacity null. Do not sum Teletzke practicable-tier basins with
  USGS technical-tier basins; they are different tiers of the same underlying resource.
- **Canada**: WCSB figure (385 Gt) already includes the Canadian Williston Basin portion.
  National theoretical total (877 Gt, all 51 basins) is unverified against Bachu primary
  literature — treat as an upper bound only.
- **Europe**: CSRC country totals are used as basin proxies wherever a country maps cleanly
  to one basin (Denmark, Ireland, Portugal-adjacent Lusitanian). Where a country spans
  multiple basins (Germany's North German Basin vs. any southern basins, France's Paris vs.
  Aquitaine, Spain's Ebro vs. Duero, the Pannonian Basin's four-country footprint), the split
  is either approximate or entirely unavailable — see individual `notes` fields. The Southern
  Permian Basin cross-border province is included as a reference-only null-capacity row.
- **Middle East**: Saudi Arabia's 432-446 Gt national effective-capacity total is split into
  a basin-attributed Rub al Khali range (40-318 Gt, cited directly) and a derived "Eastern
  Arabian Basin" residual (~282 Gt) that is NOT independently basin-sourced — flagged as low
  confidence. UAE's entire CSRC total is Rub al Khali-attributed; do not add UAE's country
  total on top of the Rub al Khali basin row.
- **North Africa**: Algeria's Ahnet-Gourara/In Salah area and Illizi-Berkine Basin are
  geologically and geographically distinct — do not conflate the In Salah project (Ahnet-
  Gourara/Sbaa Basin) with Illizi-Berkine (Algeria's more easterly, more prolific hydrocarbon
  basin, shared with Libya/Tunisia as the Ghadames Basin). Egypt (Gulf of Suez) and Libya
  (Sirte Basin) are complete data gaps — absent from CSRC and all academic literature
  reviewed; included for polygon coverage only.
- **South Africa**: CSRC's 342.93 Gt national total is not officially split between the
  Outeniqua and Zululand-Durban basins; this file applies a 50/50 placeholder split flagged
  as low confidence. Karoo Basin (onshore) has no CO2-storage-specific assessment — South
  Africa's assessed capacity is entirely offshore.
- **China**: The three largest saline-theoretical basins (Songliao 694.5, Tarim 552.8, Bohai
  Bay 490.6 Gt) sum to ~1,738 Gt, well under half of China's ~2,240-3,077 Gt national
  saline/aggregate totals — meaning substantial additional capacity sits in Ordos, Sichuan,
  Junggar, and other basins not individually quantified here (included as null rows).
  Depleted gas-reservoir (15.3 Gt) and oil-field EOR (5.1 Gt) national aggregates are not
  basin-split; Ordos/Sichuan/Bohai Bay/Tarim host the former, Songliao/Bohai Bay/Ordos/
  Junggar the latter, per the source review, with basins appearing in multiple lists.
- **India**: Only Cambay Basin has a clean basin-level figure (16.4 Gt theoretical, 0.65 Gt
  HC-fields). Krishna-Godavari, Cauvery, Mahanadi collectively make up most of the remainder
  of India's national 300-400 Gt saline theoretical range but are not individually split.
  Assam Basin is a genuine data gap.
- **Indonesia**: South Sumatra + West Java combined figure (14.8 Gt) from Hendriana et al.
  2017 is the only real basin-pair split found; Kutai Basin is qualitatively ranked among the
  top prospects but has no Gt figure. MEMR's much larger national theoretical total (578 Gt)
  is not basin-split at all and is not used at the basin level in this file.
- **Australia**: Bonaparte (32-88 Gt) and Browse (7.0-16.3 Gt) are the best-quantified
  basins. Gippsland — despite being Australia's most prominent storage basin (CarbonNet) —
  only yielded a 0.7 Gt project-level subset, almost certainly a large underestimate of true
  basin capacity; flagged as the top Australian follow-up priority. Cooper-Eromanga, Surat,
  Otway, Perth, and North Carnarvon are included for polygon coverage with null capacity
  (Geoscience Australia has published basin-level assessments for several of these that
  should be checked directly — ga.gov.au geological storage studies — in a future pass).
- **Americas (non-US/Canada)**: Mexico has the best basin-level split in this dataset outside
  the US (five provinces, academic InTech study, 81.59 Gt total) — note this runs on a
  different, lower-tier methodology than CSRC's 100.8 Gt Mexico country aggregate; both are
  plausible, do not sum them. Brazil's Paraná Basin — one of South America's largest
  sedimentary basins — is confirmed as a known, significant data gap: the only quantified
  figure (6.1 Gt, combined with Espírito Santo) almost certainly understates its true
  theoretical potential. Argentina (Neuquén, Golfo San Jorge, Austral-Magallanes) and
  Venezuela (Orinoco/Eastern Venezuela Basin) are complete data gaps with no CO2-storage
  literature located in this pass.

## Known name-matching hazards for the polygon join

- "Williston Basin" appears in US sources as a standalone name but this file merges it into
  "Western Canada Sedimentary Basin" for the Canadian portion — a polygon layer that treats
  Williston as one cross-border basin will need to split the WCSB capacity figure manually,
  or accept the US-only Williston Basin row (15 Gt) as that basin's number and treat WCSB's
  385 Gt as Alberta-only-adjacent.
- "North Sea" is not one basin in this file — it's split into UK Southern North Sea,
  Norwegian North Sea/Norwegian Sea, Danish North Sea, and Dutch Southern North Sea rows.
  A polygon layer with a single "North Sea Basin" shape will need one-to-many matching
  against these four rows, likely via a spatial (EEZ-boundary) rather than name-based join.
- "Pannonian Basin" and "Vienna Basin" are geologically nested (Vienna Basin is a Pannonian
  Basin System sub-basin) but presented as one combined row here — a polygon layer that
  distinguishes them will need the row split using the per-country breakdown in the `notes`
  field (HRV+HUN ≈ Pannonian proper; AUT+SVK ≈ Vienna Basin).
- Malaysia's "Malay Basin" (this file, offshore Peninsular Malaysia / Gulf of Thailand
  trend) is a different feature from Thailand's "Malay Basin (Thailand sector)" used as a
  match_name on the Gulf of Thailand Basin row — same basin system, different national
  jurisiction/polygon, do not merge into one row when joining by name only.
- "Rub al Khali" spans four countries (SAU/ARE/OMN/YEM) as one polygon in most basin
  datasets, but this file also has a separate "South Oman Salt Basin" row for Oman that is
  geologically adjacent but distinct — verify against the actual polygon boundary which
  basin(s) Oman's shape represents before joining.
- China basin names in Chinese academic literature (Songliao, Bohai Bay, Ordos, Sichuan,
  Tarim, Junggar) are stable and match common polygon datasets well, but "Pearl River Mouth
  Basin" may appear in some polygon layers as "Zhujiang Kou Basin" or "South China Sea
  (Pearl River Mouth) Basin" — both listed as match_names.
- "Illizi-Berkine Basin" spans Algeria/Libya/Tunisia and may appear in some datasets under
  its Libyan-side name "Ghadames Basin" only — both listed as match_names, but be aware a
  polygon layer might split this into two or three national sub-polygons.

## Basin count summary

- **92 basin rows total.**
- **46 rows have a numeric mid-point capacity estimate**; 46 are null (included for polygon
  coverage / extent-mapping only, per the task brief's instruction to include unassessed
  basins rather than omit them).
- **10 largest basins by mid estimate** (Gt CO2, approximate, mixed tiers — see each row's
  `tier` field before comparing across basins):
  1. Niger Delta Basin (NGA) — 10,700 (prospective/theoretical, IFC 2025)
  2. Gulf Coast Basin (USA) — 1,770 (mid = USGS technical-tier basin share; practicable P50
     is a much more conservative 366)
  3. Songliao Basin (CHN) — 694.5 (theoretical saline)
  4. Precaspian Basin (KAZ/RUS) — 582.9 (CSRC aggregated / academic effective, well
     cross-validated)
  5. Tarim Basin (CHN) — 552.8 (theoretical saline)
  6. Bohai Bay Basin (CHN) — 490.6 (theoretical saline)
  7. Western Canada Sedimentary Basin (CAN) — 385 (theoretical/technical, WCSB)
  8. Eastern Arabian Basin (SAU) — 282 (derived residual, low confidence)
  9. Outeniqua Basin / Zululand-Durban Basin (ZAF) — 171.5 each (50/50 placeholder split of
     South Africa's 342.93 Gt national CSRC total)
  10. Rub' al Khali Basin (SAU/ARE/OMN/YEM) — 150 (mid of 40-318 Gt cited range)

  Caveat: this "top 10" mixes tiers as noted throughout — Gulf Coast's 1,770 Gt technical-tier
  midpoint would rank far lower if the more deployment-relevant 366 Gt practicable figure
  were used instead, which would place it below Songliao and Precaspian.
