# Geologic Subsurface CO2 Sequestration Capacity — Methodology & Synthesis

*Compiled by research agent, 2026-07-13. Final synthesis of the sedimentary-capacity workstream.
Companion data file: `sedimentary_capacity.json`. Predecessor files: `csrc_country_capacity.md`,
`sedimentary_us_canada_tiers.md` (read first — they are not repeated here).*

## 1. Why the numbers don't agree

Every "CO2 storage capacity" figure in circulation is the output of a **tier** in a resource
pyramid, and different tiers for the same country can differ by 1-3 orders of magnitude. From
loosest to tightest constraint:

1. **Theoretical** — total pore volume in a formation meeting basic depth/pressure criteria
   (>800m, supercritical), assuming all pore space is accessible. This is what EU GeoCapacity,
   CO2StoP, USGS TASR, NETL/NATCARB, and most national academic assessments (China, India,
   Indonesia, Saudi Arabia, Kazakhstan, Algeria) report.
2. **Effective/Practicable** — theoretical capacity filtered by realistic sweep efficiency,
   trapping mechanism, and engineering access (e.g., Teletzke et al. 2018 for the US, CSLF/USDOE
   method estimates for Kazakhstan/Saudi Arabia).
3. **Discovered/Sub-Commercial and Undiscovered/Prospective (SRMS)** — the OGCI/CSRC framework
   used by industry, requiring an actual identified structure or basin-play with some subsurface
   data, risked but not yet appraised to project maturity.
4. **Commercial/Capacity** — appraised, injectable-ready sites. Vanishingly small everywhere
   except AUS, CAN, NOR, USA, DNK, NLD, GBR (the only 7 countries with any CSRC Cycle 5
   commercial-tier resource at all).
5. **Prudent/risk-screened** — a 2025 Nature paper (Gasser et al., "A prudent planetary limit for
   geologic carbon storage") takes the ~11,800 Gt starting physical potential and sequentially
   excludes areas by depth, seismicity, protected status, and a 25km populated-area buffer,
   arriving at a **global central estimate of 1,460 Gt (range 1,290–2,710 Gt)** — roughly an
   order of magnitude below industry-cited totals. This is the most methodologically conservative
   figure in the literature and is a useful sanity-check ceiling for any "how much can we really
   use" framing, as distinct from "how much pore space exists."

**Never sum figures across tiers**, and never compare a theoretical number for one country against
a discovered/effective number for another without noting the tier difference. This single point
explains the majority of apparent country-to-country "anomalies" in the dataset (e.g., Poland
3.48 Gt CSRC vs 200 Gt CO2StoP theoretical — same country, same rough geology, ~60x apart purely
because of tier).

## 2. Global range chosen for the atlas

- **Low: 1,290 Gt** — Gasser et al. 2025 prudent-limit lower bound.
- **Central: ~14,300 Gt** — CSRC/OGCI Cycle 4/5 aggregated resource (Stored+Commercial+
  Sub-Commercial+Undiscovered) across the ~54-111 countries CSRC has assessed. Chosen as central
  because it is (a) built bottom-up from country/basin-level SRMS assessments rather than a
  top-down statistical method, and (b) lands consistently near the low end of the independently-
  derived Kearns et al. 2017 "practically accessible" range (8,000–55,000 Gt) — two very different
  methodologies converging on the same order of magnitude is reassuring.
- **High: 55,000 Gt** — Kearns et al. 2017 upper bound.

These three numbers are presented as a *range of methodological framings*, not a confidence
interval on a single physical quantity. For mapping purposes we recommend defaulting to
country-level CSRC/academic mid-estimates (see `countries` array) rather than trying to
back-calculate country shares of the global range.

## 3. Kearns et al. 2017 — access failure (flag for user)

This was assigned as the "backbone" source for regions CSRC doesn't cover, but **the primary
per-region table could not be retrieved**. Both ScienceDirect
(https://www.sciencedirect.com/science/article/pii/S1876610217317976) and ResearchGate
(publication 319195088) served CAPTCHA/security-check pages to every fetch attempt, including
via the r.jina.ai text proxy, across ~4 separate tries. The MIT CS3/Global Change Institute
publication pages (https://cs3.mit.edu/publication/16946) also do not host an open PDF.

What *was* recoverable, only via a secondary paper (a 2026 Russia CCUS policy review) that
quotes Kearns' regional splits in passing:
- North America: 2,600–21,770 Gt
- Asia: ~2,964–2,984 Gt (this band is suspiciously narrow given China alone has academic
  theoretical estimates of 2,420–3,067 Gt; almost certainly a garbled or partial quotation of
  the true Kearns Asia range — **do not treat as reliable**, flagged in the JSON)
- South America: ~2,030 Gt (single point, no low/high split found)
- Global: 8,000–55,000 Gt (the only figure confirmed across many independent secondary citations)

**Recommendation for next session:** try Sci-Hub-style access via DOI 10.1016/j.egypro.2017.03.1603
through an institutional proxy, or request the table directly — Energy Procedia is nominally a
Elsevier open-access conference series (CC BY-NC-ND), so a clean PDF likely exists somewhere
public that simple search didn't surface (e.g. a university repository mirror).

## 4. Europe: EU GeoCapacity / CO2StoP vs CSRC

- **EU GeoCapacity** (Vangkilde-Pedersen et al. 2009, FP6 project, 21 member states): theoretical
  storage potential **87 Gt total** = 69 Gt deep saline aquifers + 17 Gt depleted hydrocarbon
  fields + 1 Gt unmineable coal beds. This is the original pan-European baseline; a full
  per-country breakdown table exists in the WP2 D16 report but could not be extracted cleanly
  (PDF paywalled/binary-garbled on every fetch route tried).
- **CO2StoP** (2015 EC-funded follow-on project): country-level theoretical figures, partially
  recovered via a 2021 GEUS/CATF summary PDF (also mostly binary-garbled, but a jina.ai proxy
  pass extracted scattered country numbers — see `countries` array, "CO2StoP 2015" source tags
  for Poland, Germany, France, Spain, Italy, Romania, Netherlands, Austria). GEUS's own caveat:
  "large differences exist between what kind and quality of data each country has available,"
  and the CO2StoP database is now >10 years old.
- **Norway**: NPD/Sodir's own CO2 Storage Atlas of the Norwegian Continental Shelf reports
  **70–80 Gt** (43 Gt saline + 27 Gt petroleum-related fields, growing from earlier 29/48.4 Gt
  estimates as more aquifers were characterized). This sits well above CSRC Cycle 5's 18.1 Gt
  (itself a sharp downward revision from Cycle 4's 84.3 Gt after CSRC tightened SRMS maturity
  criteria). **This is the single largest and most consequential European discrepancy in the
  dataset** — Norway is the most CCS-mature jurisdiction in Europe (Sleipner, Northern Lights)
  and yet its "authoritative" number varies 4-5x depending on source. We default to CSRC for
  cross-country consistency but flag NPD's 70-80 Gt as the better choice for a Norway-specific
  view.
- **UK**: CO2Stored/UKSAP's 78 Gt (P50 theoretical) and CSRC Cycle 5's 55 Gt are reasonably
  consistent (same order of magnitude, ~1.4x apart) — a useful contrast with Norway showing that
  large discrepancies aren't universal, they depend on how much a given national program has
  re-assessed vs. how CSRC's stricter criteria bite.

## 5. China

CSRC Cycle 5 (3,077 Gt) and Dahowski et al.'s independent theoretical estimate (3,067 Gt, 27
basins, full-brine-dissolution assumption) agree to within 0.3% — remarkable convergence given
completely different methodologies (industry SRMS aggregation vs. academic basin-scale
theoretical modeling). A third academic source (Wuhan Institute of Rock and Soil Mechanics, CAS)
gives 2,420 Gt theoretical saline, and a range of Chinese "effective capacity" studies span
65–1,551 Gt (reflecting the theoretical-to-effective tier gap discussed in §1). We use CSRC's
3,077 Gt as the preferred mapping figure given the cross-validation.

## 6. Other national assessments — findings and confidence

| Country | Preferred (Gt) | Tier | Confidence | Note |
|---|---|---|---|---|
| Australia | 485 | CSRC undiscovered saline | Medium-high | Carbon Storage Taskforce's older 417 Gt "potential" and CSRC's 31 Gt "sub-commercial realistic" bracket this; Gippsland Basin remains the standout site. |
| India | 64.14 (CSRC) / 291-671 (academic, incl. basalt) | Mixed | Medium | Vishal et al. 2021's academic figure mixes saline-clastic and Deccan Traps basalt mineralization — a genuinely different storage mechanism, not directly additive with saline totals elsewhere in this dataset. |
| Brazil | **no consolidated national total found** | — | Low (gap) | CSRC's 2.47 Gt is O&G-fields-only and known incomplete; Ketzer et al. 2015's Brazilian Atlas ranks basins qualitatively but a citable national Gt aggregate (esp. for the large Paraná Basin) was not located this pass. **Priority gap.** |
| Indonesia | 15.86 (CSRC) / 385-578 (MEMR/academic theoretical) | Mixed | Medium | ~36x theoretical-to-mature-resource gap, one of the largest in the dataset — Indonesia's basin area is hugely under-assessed at CSRC maturity standard. |
| Russia | **no reliable estimate found** | — | Very low (gap) | Absent from all three CSRC cycles. Only figure found (7.3 Gt) is a narrow CO2-EOR-suitable subset, not a national theoretical estimate. By basin-area analogy with Kazakhstan's Precaspian Basin (adjacent, ~460-583 Gt), Russia's true potential is very likely hundreds to low thousands of Gt, but this is inference, not a citable source. **Top priority gap for a G20 economy.** |
| Saudi Arabia | 440 (academic effective, P50) | Effective | Medium-high | First comprehensive national basin assessment (2023); CSRC's 0.742 Gt figure covers only one legacy oil field and is explicitly not representative — academic figure strongly preferred here. |
| Argentina | **no estimate found** | — | Very low (gap) | Not in CSRC; no basin-scale academic Gt figure located despite Neuquén Basin being a plausible large target. |
| Nigeria | 10,700 (IFC prospective atlas, March 2025) | Prospective | Medium | Closes what CSRC (Aug 2024) reported as a flat data gap ("no published information"); post-dates CSRC's Nigeria assessment window. Treat as prospective/theoretical tier, not mature resource — same caveats as other basin-scale prospective figures. |
| Algeria | 45 (national, hydrodynamic-trap upper bound) | Theoretical | Low-medium | National range spans 90 Mt (structural traps) to 45 Gt (hydrodynamic traps) — a >500x internal spread depending on trapping mechanism assumed. An extreme 10,000 Gt figure sometimes quoted for In Salah-area aquifers is treated as not credible / too wide to use. |
| Kazakhstan | 582.88 | CSRC / effective | High | CSRC (582.88 Gt) and independent academic effective-capacity study (583 Gt, Amantayeva et al. 2020) agree almost exactly — best cross-validated country figure in the whole dataset alongside China. |

## 7. Full source list

- OGCI, CSRC Cycles 2/4/5 (2021/2024/2025) — https://www.ogci.com/wp-content/uploads/2025/11/CSRC_Cycle_5_Main-Report_August_2025.pdf and Cycle 4 equivalents
- Kearns, J., Teletzke, G., Palmer, J., Thomann, H., Kheshgi, H., Chen, H., Paltsev, S., Herzog, H. (2017). "Developing a Consistent Database for Regional Geologic CO2 Storage Capacity Worldwide." Energy Procedia 114:4697-4709. doi:10.1016/j.egypro.2017.03.1603 (primary table inaccessible this pass — see §3)
- Gasser et al. (2025). "A prudent planetary limit for geologic carbon storage." Nature 645:124-. doi:10.1038/s41586-025-09423-y. PMC12408384. https://cgs.umd.edu/research-impact/publications/prudent-planetary-limit-geologic-carbon-storage
- Vangkilde-Pedersen, T. et al. (2009). EU GeoCapacity project final report, WP2 D16, "Assessing European Capacity for Geological Storage of Carbon Dioxide." https://www.sciencedirect.com/science/article/pii/S1876610209006778
- GEUS/CATF (2021). "EU Geological CO2 storage summary." GEUS-R_2021_34. https://cdn.catf.us/wp-content/uploads/2021/10/20183953/EU-CO2-storage-summary_GEUS-report-2021-34_Oct2021.pdf (CO2StoP country figures)
- Norwegian Offshore Directorate (NPD/Sodir), CO2 Storage Atlas of the Norwegian Continental Shelf. https://www.sodir.no/490a7e/globalassets/1-sodir/publikasjoner/atlas-eng/co2-atlas-north-sea.pdf
- British Geological Survey / The Crown Estate, CO2Stored / UK Storage Appraisal Project (UKSAP). https://www.co2stored.co.uk
- Dahowski, R. et al. — China theoretical saline aquifer capacity (27 basins)
- Wuhan Institute of Rock and Soil Mechanics, CAS — China theoretical saline capacity assessment
- Vishal, V. et al. (2021). "A systematic capacity assessment and classification of geologic CO2 storage systems in India." https://www.sciencedirect.com/science/article/abs/pii/S1750583621002103
- Indonesia Ministry of Energy and Mineral Resources (MEMR) national CO2 storage estimate; academic mid-case national assessment (South Sumatra/West Java basins)
- Amantayeva, M. et al. (2020). "CO2 storage potential in sedimentary basins of Kazakhstan." https://www.sciencedirect.com/science/article/abs/pii/S1750583620306113
- Saudi Arabia first comprehensive national basin assessment (2023). https://www.sciencedirect.com/science/article/pii/S0012825223002283
- CO2-storage assessment and effective capacity in Algeria. PMC4940307. https://pmc.ncbi.nlm.nih.gov/articles/PMC4940307/
- IFC, Nigerian CO2 Storage Atlas (March 2025). https://www.ifc.org/content/dam/ifc/doc/2025/nigerian-co2-storage-atlas.pdf
- Ketzer, J.M. et al. (2015). Brazilian Atlas of CO2 Capture and Storage (basin ranking, no consolidated national Gt total recovered)
- Australian Carbon Storage Taskforce (national "potential" lineage figure); Geoscience Australia basin studies (Gippsland, Bonaparte, Browse)
- Russia CCUS policy review, ScienceDirect S2666519026000786 (source of the only Russia figure found, and of the garbled Kearns regional fragments)
- All CSRC and US/Canada tier sources from the two predecessor files (`csrc_country_capacity.md`, `sedimentary_us_canada_tiers.md`) — not re-listed here.

## 8. Biggest remaining gaps, ranked

1. **Kearns et al. 2017 primary regional table** — still inaccessible; the atlas currently relies
   on the CSRC aggregate as its de facto "backbone," which is actually a reasonable substitute
   since CSRC has grown to cover 54-111 countries by Cycle 5.
2. **Russia** — no national estimate at all, for one of the world's largest sedimentary-basin
   endowments (West Siberian Basin). High priority given Russia's OGCI-catalogued potential as a
   future storage hub given oil/gas infrastructure legacy.
3. **Argentina** — no estimate found despite the large, well-studied Neuquén Basin.
4. **Brazil** — CSRC figure is O&G-fields-only (2.47 Gt); no consolidated saline-aquifer national
   total found despite substantial Paraná Basin literature existing.
5. **EU GeoCapacity full per-country table** — only the pan-European 87 Gt total and a handful of
   country figures (via the CO2StoP secondary summary) were recoverable; the primary WP2 D16
   report's country tables remain unfetched (PDF access issues).
6. Countries entirely absent from this pass and from CSRC: most of Sub-Saharan Africa beyond
   ZAF/MOZ/NGA (e.g., Angola, Kenya, Egypt, Libya — the latter two have real sedimentary-basin
   potential), most of Central Asia beyond Kazakhstan, most Latin America beyond
   USA/CAN/MEX/BRA/ARG, and Iran (a plausible large MENA storage endowment given basin geology
   similar to Saudi Arabia/Kuwait/UAE, but no search was run for it this pass — flag for
   follow-up).
