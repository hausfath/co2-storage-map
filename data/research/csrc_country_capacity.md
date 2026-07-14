# CO2 Storage Resource Catalogue (CSRC/OGCI) — per-country capacity extraction

*Compiled by research agent, 2026-07-13. All figures Gt CO2. SRMS categories:
Stored < Capacity (Commercial) < Sub-Commercial (Discovered) < Undiscovered (Prospective).
"Aggregated" = sum of all four — the report itself cautions these are not mutually risked;
use tier-appropriate values, not aggregates, for headline claims.*

Extraction route: r.jina.ai text proxy over OGCI PDFs (direct fetch failed on binaries).
Spot-check against original PDFs before publication.

## Global totals
- **Cycle 2 (2021)**, 18 countries, 715 sites: Stored 0.037 / Capacity 0.217 /
  Sub-Comm 551 / Undiscovered 12,407 / **total 12,958 Gt**.
- **Cycle 4 (Aug 2024)**, 54 countries, 1,272 sites: Discovered 626.5 / Commercial 3.1 /
  Undiscovered 13,434 / **aggregated 14,316.6 Gt**. Commercial-grade only in AUS, CAN, NOR, USA.
- **Cycle 5 (Aug 2025)**: Stored ~0.063 / Commercial 1.73–1.77 / Sub-Comm 71.7–675.4 /
  Undiscovered up to 13,579 / **aggregated ~14,256 Gt** (129.1 Gt project-specified only).
  Type split: saline ~13,653 Gt (95.8%), O&G fields ~541 Gt (3.8%). Commercial-resource
  countries now seven: AUS, CAN, DNK, NLD, NOR, GBR, USA. 111 assessed countries report zero.
  Main report: https://www.ogci.com/wp-content/uploads/2025/11/CSRC_Cycle_5_Main-Report_August_2025.pdf

## Country detail (Stored / Capacity / Sub-Commercial / Undiscovered / Aggregated, Gt)

### Americas — Cycle 5 (Aug 2025)
- BRA: 0 / 0 / 2.470 / 0 / **2.470** (all O&G fields, discovered but regulatorily inaccessible)
- CAN: 0.008 / 0.061 / 25.6 (3.9 project) / 121.4 / **147.7** (67 sites, 4 basins)
- MEX, USA: Cycle 5 extraction failed → use Cycle 4.

### Americas — Cycle 4 (Aug 2024)
- BRA: 0.0006 / 0 / 2.47 / 0 / **2.47**
- CAN: 0.01 / 0.05 / 43.64 / 104.30 / **148.0**
- MEX: 0 / 0 / 89.5 / 11.3 / **100.8**
- USA: 0.0052 / 0.004 / 258 / 7,804 / **8,061.8**

### Europe — Cycle 4 (Aug 2024)
AUT 0.146 · BGR 2.567 · HRV 4.897 · DNK 16.028 (Capacity 0.125) · FRA 7.208 ·
DEU 51.208 · GRC 3.984 · HUN 10.828 · ITA 7.020 · IRL 8.0 · NLD 18.5 (Capacity 1.5) ·
NOR 84.339 (Stored 0.039, Capacity 1.0) · POL 3.480 · ROU 4.100 · SVK 1.8 · ESP 2.470 ·
GBR 36.0 (Stored 0.295, Capacity 15.0) · SWE/CYP/FIN zero. (Aggregated values.)

### Europe — Cycle 5 (Aug 2025) revisions
- DNK: **~16.03** (unchanged)
- DEU: **120.657** (saline only; big upward revision from 51.2)
- NOR: **18.136** (Capacity 2.488; big DOWNWARD revision from 84.3)
- GBR: **55.0** (Capacity 3.0 / Sub-Comm 5.0 / Undisc 47.0; up from 36.0)
- NLD not re-covered in Cycle 5 Appendix C as fetched.

### Asia — Cycle 5 (Aug 2025)
- BGD: **21.13** (20 Gt saline undiscovered + 1.13 Gt gas fields discovered)
- BRN: **0.558**
- CHN: 0.0003 / 0 / 10.5 / 3,067 / **3,077** (72 sites, ≥21 basins; gas 5.2 + oil/EOR 4.8, rest saline)
- IND: 0 / 0 / 0.84 / 63.3 / **64.14**
- IDN: 0 / 0 / 2.46 / 13.40 / **15.86** (saline ~89%)
- JPN: 0.0003 / 0 / 36.23 / 116.04 / **152.27** (depleted fields ~3.5)
- KAZ: 0 / 0 / 1.17 / 581.71 / **582.88** (Precaspian dominant)
- MYS: 0 / 0 / 0 / 28.25 / **28.25**

### Middle East & North Africa — Cycle 5 (Aug 2025)
- KWT **0.44** · OMN **0.558** · QAT **0.23** · SAU **0.742** (1 oil field, inaccessible) ·
  ARE **16.70** (all saline, Rub al Khali; 5.91 project-specified)

### Oceania — Cycle 5 (Aug 2025)
- AUS: Stored 0.009 / Capacity 0.1 / Undiscovered 473 (saline basin-play ~485);
  depleted fields ~16.5 Gt (older Carbon Storage Taskforce lineage). Santos Cooper
  Basin: 1P 6 Mt, 2P 9 Mt, 2C 91 Mt.
- NZL: depleted fields ~0.42 Gt (Maui ~0.30, Kapuni ~0.10, McKee 0.023); saline ~2.47 Gt
  (3 formations @1% efficiency).
- 12 Pacific Island nations: 0.

### Sub-Saharan Africa — Cycle 4 (Aug 2024)
- MOZ: **17.55** (saline; depleted-field potential unquantified)
- NGA: **0** ("no published information")
- ZAF: **342.93** (mostly saline, Sub-Comm 19.91 + Undisc 323.02)

## Known gaps
1. USA & MEX Cycle 5 country chapters not extracted (PDF truncation) — Cycle 4 used.
2. Cycle 5 Table 4-3 (master country table) not extracted in full.
3. NLD absent from fetched Cycle 5 Europe appendix.
4. Saline/O&G splits quantified only for AUS, CAN, CHN, KAZ, JPN(partial), BGD, IND,
   DEU(100% saline), ARE(100% saline), BRA(100% O&G), SAU(100% O&G).
5. Argentina & smaller Americas countries absent from CSRC Cycles 4–5.
