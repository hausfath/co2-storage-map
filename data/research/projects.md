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

## Total: 99 unique projects (post 2026-07 audit; was 84)

### By mechanism
- **Geologic** (dedicated saline/depleted-O&G, excl. EOR): 82
- **Mineralization** (in-situ basalt/peridotite/serpentinite): 17

### By status
| Status | Count |
|---|---|
| operational | 24 |
| in_permitting | 23 |
| planned | 16 |
| construction | 15 |
| approved | 8 |
| pilot | 7 |
| pilot_concluded | 6 |

### By mechanism × status
See `projects.json` for individual figures; the 2026-07 audit added 15 new projects,
mostly to `in_permitting`/`planned` (Europe gap-fill) and two new `pilot`/`pilot_concluded`
mineralization entries (Saudi Arabia, India).

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
USA 17, CAN 9, NOR 8, GBR 7, CHN 6, AUS 5, ISL 5, JPN 4, MYS 4, ARE 4, IDN 3, IND 3,
OMN 2, KEN 2, NLD 2, DNK 2, SAU 2, +TLS/KOR/THA/TWN/NZL/DZA/ITA/QAT/ZAF/GRC/BRA/HRV/HUN/BGR
1 each (last five countries — GRC, BRA, HRV, HUN, BGR — newly added in the 2026-07 audit).

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

## 2026-07 audit additions

A colleague-flagged gap check (Greek Prinos project) triggered a systematic sweep for
missing dedicated-storage projects (excl. EOR/ECBM) across Europe, MEA, the Americas,
Asia-Pacific, and in-situ mineralization (ISM). 15 new projects added, bringing the
total from 84 to 99. Full detail is in each project's `notes` field in `projects.json`;
summary below.

**Confirmed originally missing, now added — Prinos (the flagged item):**
- **Prinos CO2 Storage (EnEarth/Energean, Greece)** — depleted Prinos/Epsilon oil
  fields + underlying saline sand, offshore Gulf of Kavala, N. Aegean; EU PCI; 25-yr
  storage permit granted by HEREMA Feb 2026; FEED to Kent; Phase 1 ~1 Mtpa (2025-28)
  rising to ~2.8-3 Mtpa by 2029; status `in_permitting`, first injection realistically
  2026-27. No second Greek storage site was found (checked and excluded).

**Europe (8 added):**
- **Morecambe Net Zero** (Spirit Energy/Centrica, UK, East Irish Sea) — depleted
  North/South Morecambe gas fields, license CS010; Assess Phase June 2026; 3 Mtpa;
  `in_permitting`.
- **Bacton Thames Net Zero** (Eni UK, Hewett Field, North Sea) — 6→10 Mtpa; cooperation
  agreement/pre-FEED stage; `planned`.
- **Errai CCS** (Horisont Energi/Neptune Energy, Norway) — onshore Gismarvik terminal +
  North Sea license; 4-8 Mtpa; flagged schedule risk (original 2026 target has slipped);
  `in_permitting`.
- **Luna** and **Havstjerne** CO2 storage licenses (Norway, North Sea) — both distinct
  from the already-tracked Smeaheia license; Harbour Energy-linked; 5 Mtpa and 7 Mtpa
  targets respectively; both `in_permitting`, no FID.
- **Croatia Geothermal CCS** (Bočkovac, Osijek-Baranja) — EU PCI-listed, paired with
  geothermal plant, ~0.6 Mtpa; early feasibility, `planned`.
- **Danube Removals CCS** (Pannonia Bio, Hungary) — Hungary's first dedicated storage
  project, biogenic CO2 into Pannonian Basin saline aquifer; ~0.5 Mtpa; `construction`,
  targeting Sept 2027 start.
- **ANRAV CCS** (Heidelberg Materials Devnya / Galata Field, Bulgaria) — EU PCI-listed;
  cement-plant capture to depleted offshore Black Sea gas field; ~0.8 Mtpa; `planned`.
- **Medway Hub** (Synergia Energy, Camelot License CS019, UK southern North Sea) —
  genuine named site (depleted Camelot field, 70-100 Mt potential, up to 6.5 Mtpa) but
  added with a caveat: anchor partner Wintershall Dea exited the JV in Nov 2024 and
  Synergia is still seeking a replacement partner as of mid-2026; `in_permitting`.

**Americas (2 added):**
- **Deep Sky Alpha** (Innisfail, Alberta, Canada) — North America's first DAC-fed
  dedicated saline-storage site; operational since Aug 2025, ~3,000 t/yr; distinct
  from the already-tracked Deep Sky/Carbfix Thetford Mines (Quebec) mineralization
  pilot — Alpha is geologic saline storage, not ISM.
- **Petrobras São Tomé CCS Pilot** (Cabiúnas/Barra do Furado, Rio de Janeiro, Brazil) —
  Brazil's first dedicated (non-EOR, non-pre-salt) saline storage pilot, ~0.1 Mtpa;
  `approved`, targeting ~2028 start.

**Asia-Pacific (1 added):**
- **Repsol Sakakemang CCS** (South Sumatra, Indonesia) — high-CO2 gas field injecting
  into adjacent depleted Dayung/Gelam fields; genuinely distinct operator/block from
  BP Tangguh and ExxonMobil/Pertamina Sunda-Asri; ~1.5-2 Mtpa; `approved`, targeting
  ~2028.

**In-situ mineralization (2 added):**
- **KAUST/Aramco Jizan Basalt Mineralization Pilot** (Saudi Arabia) — first Arabian
  Peninsula basalt ISM field pilot, Carbfix-like method; 131 t injected, ~70% mineralized;
  results published Nature Apr 2026; `pilot_concluded`, no scale-up site yet.
- **IISER Bhopal/CSIR-NGRI Deccan Traps CO2 Injection Well** (India, DeCarbFaroe
  programme) — billed as India's first dedicated CO2-storage well, basalt ISM research
  well launched Aug 2025; `pilot`, coordinates approximate (exact site not disclosed).

**Checked but deliberately NOT added (with reason):**
- **Callisto** (Italy/France) — folds into the already-tracked Ravenna CCS hub;
  no independently sited French storage location identified.
- **Pycasso** (SW France, Lacq) — officially abandoned/cancelled due to local
  opposition; no site was ever finalized.
- **GeoZero/Lacq** — no live project found; only a long-closed 2010-2013 Total
  Lacq/Rousse pilot exists historically.
- **ECO2CEE / Poland-Baltic hub** — this is CO2 transshipment-terminal
  infrastructure (Port of Gdańsk), not a storage site; Baltic sub-sea storage is
  currently blocked by the Helsinki Convention.
- **"CO2 Highway"/Norne** — "CO2 Highway Europe" is a pipeline concept feeding the
  already-tracked Smeaheia license, not a separate storage site; "Norne Carbon
  Storage Hub" is actually a Port of Aalborg, Denmark reception project with no
  storage site finalized yet.
- **Pilot STRATEGY** (EU Horizon project) — pure research/characterization program
  across 5 basins; no committed injection site.
- **Second Greek storage site** — none found beyond Prinos.
- Saudi Jubail: verified existing entry, no second distinct Saudi site found; SABIC
  Jubail carbon capture is utilization (CO2 sold), not storage — excluded.
- **Oman Marsa LNG** — low-carbon-design LNG plant (electrification + solar), no
  CO2 capture/storage component.
- **Egypt** — only real named project (Eni/Meleiha) is EOR-adjacent and still
  pilot/study-stage; other Egyptian sites are academic modeling papers only.
- **Morocco, Nigeria** — no genuinely sited, non-EOR, past-feasibility-stage project
  found (Nigeria has a March 2025 IFC/World Bank storage-potential atlas identifying
  candidate sites, but none has reached FID).
- **Kenya third project** — none found beyond the two already tracked.
- **Argentina/YPF** — only an MOU-stage siting study (Bahía Blanca) with no named
  site.
- **Trinidad and Tobago** — only atlas/feasibility-mapping work, no sited project.
- **Colombia, Mexico, Chile** — academic capacity assessments or pre-siting
  intentions only.
- **Japan Chubu (Ise Bay) and Kinki (Southern Offshore Malay Peninsula) JOGMEC
  projects** — real CO2-source-region studies, but their overseas storage
  destinations ("Oceania," "southern offshore Malay Peninsula"/possible Duyong,
  Malaysia) are not yet sited with coordinates; worth revisiting once a storage
  location crystallizes.
- **Vietnam** — only basin-scale capacity estimates and a stated strategic
  intent (PVEP, 2026); no named site or operator commitment.
- **India additional site ("Juna"/Mumbai High)** — no "Juna" project found; Mumbai
  High is discussed only as an EOR candidate, excluded per scope.
- **New Carbfix/44.01/Cella/CO2Lock sites** — none found beyond what's already
  tracked; Carbfix's "Steingerður"/Silverstone permit (2025) is the same Hellisheiði
  site already in inventory, not a new location. A DNV-led "CO2RockLock" joint
  industry project (2026) is a research/knowledge-gap study, not a field site —
  excluded.
