# Global CO₂ Storage Project Inventory — Summary (as of mid-2026)

Point inventory of dedicated CO₂ storage projects worldwide, tagged by mechanism.
Excludes pure CO₂-EOR/ECBM projects (e.g. Weyburn-Midale, CNPC Jilin, Sinopec
Qilu-Shengli/Shengli EOR, Saudi Aramco Uthmaniyah EOR, Core Energy Michigan EOR,
and Petrobras Santos Basin pre-salt CO₂ reinjection — the latter is the world's
largest CO₂-reinjection program by volume, ~67.9 Mt cumulative 2008-2024 and a
2025 target of ~80 Mt, but it is enhanced-oil-recovery reinjection, not dedicated
storage, so it is intentionally omitted from the point counts below).

Source files merged: `bicrs_storage_sites_seed.json` (~81 sites), `bicrs_storage_sites_seed2.json`
(~28 sites), `projects_apac_checkpoint.json` (27 APAC projects), plus new research
on in-situ mineralization (ISM) and North America / Europe / MEA 2025-26 status
updates captured in `projects_checkpoint.json`. Final deduplicated file: `projects.json`.

## Total: 84 unique projects

### By mechanism
- **Geologic** (dedicated saline/depleted-O&G, excl. EOR): 69
- **Mineralization** (in-situ basalt/peridotite/serpentinite): 15

### By status
| Status | Count |
|---|---|
| operational | 23 |
| in_permitting | 17 |
| construction | 14 |
| planned | 13 |
| approved | 6 |
| pilot | 6 |
| pilot_concluded | 5 |

### By mechanism × status
- Geologic: operational 21, in_permitting 15, construction 12, planned 12, approved 6, pilot_concluded 2, pilot 1
- Mineralization: pilot 5, pilot_concluded 3, construction 2, in_permitting 2, operational 2, planned 1

### Operational capacity (Mtpa, among projects with a reported nameplate/injection rate)
- **Geologic operational: ~20.2 Mtpa** across 21 sites (Sleipner, Snøhvit, Northern Lights Ph.1,
  Quest, ADM Decatur, Al Reyadah, Ravenna Ph.1, Guohua Jinjie, QatarEnergy Ras Laffan,
  ACTL, Aquistore, Red Trail Energy, Stratos, CarbonTerraVault I, Gorgon, Santos Moomba,
  CO2CRC Otway, Tomakomai [concluded, excluded from live total], CNOOC Enping 15-1,
  China Energy Guohua Ordos, Huaneng Gansu Zhengning — see projects.json for individual figures).
- **Mineralization operational: ~0.05 Mtpa** — the sector remains overwhelmingly pilot/demonstration
  scale (Carbfix Hellisheiði is the only mineralization site with a quasi-industrial injection rate;
  everything else is sub-kt/yr). The Coda Terminal (3 Mtpa targeted by 2031) and Project Hajar/ADNOC
  Fujairah scale-ups are the mechanism's path to Mtpa scale, but none had crossed into "operational"
  at meaningful volume as of mid-2026.

### By country (top entries)
USA 17, CAN 8, CHN 6, AUS 5, ISL 5, NOR 5, JPN 4, MYS 4, ARE 4, GBR 4, IDN 2, IND 2,
OMN 2, KEN 2, NLD 2, DNK 2, +TLS/KOR/THA/TWN 1 each, plus others in seed data not
re-verified this round (SAU, QAT, DZA, ITA, ZAF).

## Notable 2025-26 developments captured this round

**Mineralization (ISM) — priority focus:**
- Carbfix Coda Terminal (Straumsvík, Iceland): under construction; first commercial
  imported-CO₂ injection targeted mid-2026, ramping to 3 Mtpa by 2031.
- 44.01 Project Hajar (Al Qabil, Oman): world's first commercial-scale peridotite
  mineralization concession signed with Oman's government; in permitting/early buildout.
- 44.01/ADNOC Fujairah: pilot (10 t in <100 days, 2023-24) succeeded; Phase 1 scale-up
  to 300+ t underway.
- Octavia Carbon/Cella Project Hummingbird (Kenya): first African DAC+mineral-storage
  injection, ~460 kg CO₂ into basalt near Lake Elementaita, May 2026 — first Southern
  Hemisphere ISM injection.
- Deep Sky/Carbfix (Quebec): first North American mineralization injection, Thetford
  Mines serpentinite belt.
- CO2 Lock SAM project (BC, Canada): first successful CO₂ injection into brucite-rich
  ultramafic rock.
- Ankeron PNW DAC/mineralization hub: DOE-funded feasibility study stage, no injection yet.
- PNNL Wallula: historical basalt pilot (2013, concluded) — foundational precedent, ~1 kt injected.

**North America geologic:**
- EPA Class VI permitting wave: ExxonMobil Jefferson County TX (3 permits, Oct 2025,
  5 Mtpa combined); PureField Carbon Capture Kansas (Apr 2026); Texas granted Class VI
  state primacy (Nov 2025).
- CarbonTerraVault I (Elk Hills, CA): California's first operational CCS project,
  first injection achieved May 2026.
- Stratos (1PointFive/Oxy): first-ever Class VI permits for a DAC project (Apr 2025);
  operational 2025.
- ADM Decatur: under EPA compliance order after 2024-25 fluid-migration incident;
  continuing/restarting injection under corrective monitoring.
- Summit Carbon Solutions Midwest pipeline: **major setback** — ND judge revoked the
  underground storage permit (Mar 2026), SD banned eminent domain for CO₂ pipelines
  (2025), and the company has pivoted messaging toward EOR use, undermining its
  original dedicated-sequestration framing.
- Wabash Valley Resources (IN): Class VI permit still under appeal; Indiana pursuing
  state primacy.
- Broadwing Energy Center (Decatur, IL): draft air permit issued Apr 2026; FID targeted
  Q2 2026, storing into ADM's existing wells.

**Europe geologic:**
- Northern Lights: first CO₂ received/stored Aug 2025 (Phase 1, 1.5 Mtpa); Phase 2
  (NOK 7.5bn, →5 Mtpa) approved Mar 2025, targeted ready H2 2028.
- Porthos: schedule slipped — commercial start pushed from 2026 to not before H2 2027.
- Greensand (Denmark): Denmark's/EU's first full-scale CO₂ storage site, ramping from
  mid-2026 (0.4 Mtpa → 4-8 Mtpa by 2030); 2023 pilot injected ~4,100 t via first
  cross-border offshore CCS value chain.
- UK East Coast Cluster/HyNet/Viking: all under construction/FEED, targeting first
  injection 2027-2029.

**Middle East/Africa:**
- Aramco Jubail hub (Saudi Arabia): transitioned to execution in 2025 ($1.7B+ in
  contracts, incl. $1.5B EPC to L&T); on track for 9 Mtpa by 2027.
- ADNOC Habshan CCUS: FID'd, 1.5 Mtpa, first ADNOC project with genuinely dedicated
  (non-EOR) geological storage in the Bab Far North Field; targeted 2026 commissioning.
  (Al Reyadah remains EOR-linked but ADNOC is evaluating conversion to a Northern
  Lights-style dedicated Transport & Storage Company model.)
- South Africa: first CCUS pilot/research site inaugurated at Leandra, Mpumalanga
  (Sep 2024); Phase 2 (injection) not yet started as of mid-2026.

## Key sources
Global CCS Institute facility database & Global Status of CCS 2025 report; IEA CCUS
project database; EPA UIC Class VI newsroom/data repository; Clean Air Task Force
Class VI tracker; company press releases (Equinor, Shell, ExxonMobil, Oxy/1PointFive,
Carbfix, 44.01, ADNOC, Aramco, CRC); Carbon Herald, JPT/SPE, Offshore Energy, Inside
Climate News, MIT Technology Review trade coverage 2025-26.

## Data gaps / caveats
- Many seed "regional/basin" entries (e.g. Permian Basin, Ordos Basin, Congo Basin)
  are capacity-assessment regions, not discrete projects, and were intentionally
  excluded from this point inventory (see `mineralization_capacity.json` and
  `csrc_country_capacity.md` for basin/formation-level capacity context).
- Coordinates for several early-stage ISM sites (Great Carbon Valley Kenya, Ankeron
  PNW Hub, 44.01 Project Hajar Al Qabil) are approximate — exact injection-well
  coordinates were not yet public as of this research pass.
- Petrobras Santos Basin, Weyburn-Midale, CNPC Jilin, Sinopec Qilu-Shengli, Saudi
  Aramco Uthmaniyah, and Core Energy Michigan are all large-volume CO₂-EOR operations
  intentionally excluded per the dedicated-storage-only scope; flagging here so totals
  aren't mistaken for undercounting.
