/* Global CO2 Storage Atlas — single-page Leaflet app.
   Data: window.ATLAS (bundle), window.GEO_* (geometry). No network calls. */
(function () {
  "use strict";
  const A = window.ATLAS;
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  // ---------- map ----------
  const map = L.map("map", {
    zoomControl: true, worldCopyJump: true, minZoom: 2, maxZoom: 10,
    renderer: L.canvas({ padding: 0.4 }),
  }).setView([22, 15], 2);
  map.attributionControl.addAttribution(
    "Geometry: Natural Earth, USGS 2013 SAUs, Ernst & Youbi LIPs, PLATES/UTIG ophiolites");

  // ---------- injection choropleth ----------
  const BINS = [150, 500];                             // Gt CO2 (preferred estimate)
  const RAMP = ["--inj-2", "--inj-4", "--inj-6"];
  function injColor(gt) {
    if (gt == null) return null;
    let i = 0;
    while (i < BINS.length && gt >= BINS[i]) i++;
    return css(RAMP[i]);
  }

  const landStyle = { color: css("--land-line"), weight: 0.6,
                      fillColor: css("--land"), fillOpacity: 1 };

  const baseLayer = L.geoJSON(window.GEO_COUNTRIES, { style: landStyle }).addTo(map);

  const injLayer = L.geoJSON(window.GEO_COUNTRIES, {
    filter: (f) => f.properties.cap_pref_gt != null,
    style: (f) => {
      const t = f.properties.tier || "";
      const soft = /theoretical|prospective/i.test(t) && !/practic|effective|technical/i.test(t);
      if (soft) return { color: css("--inj-4"), weight: 0.8, dashArray: "3 3",
                         fillColor: css("--inj-1"), fillOpacity: 0.3 };
      return { color: css("--land-line"), weight: 0.6,
               fillColor: injColor(f.properties.cap_pref_gt), fillOpacity: 0.85 };
    },
    onEachFeature: (f, ly) => {
      const p = f.properties;
      ly.bindTooltip(`<b>${p.name}</b>${fmtGt(p.cap_pref_gt)} Gt CO₂ <small>(${short(p.tier)})</small>`,
                     { sticky: true });
      ly.on("click", (e) => { showCountry(p); L.DomEvent.stop(e); });
    },
  });

  const basinsLayer = L.geoJSON(window.GEO_BASINS, {
    style: (f) => {
      const p = f.properties;
      if (p.unit)  // standalone EU CO2StoP unit (no basin polygon covers it)
        return { color: css("--inj-deep"), weight: 0.7,
                 fillColor: css("--inj-deep"), fillOpacity: 0.35 };
      if (p.cap_mid_gt == null || p.soft_tier)
        return { color: css("--inj-4"), weight: 0.8, dashArray: "3 3",
                 fillColor: css("--inj-1"), fillOpacity: 0.3 };
      return { color: css("--land-line"), weight: 0.6,
               fillColor: injColor(p.cap_mid_gt), fillOpacity: 0.8 };
    },
    onEachFeature: (f, ly) => {
      const p = f.properties;
      const cap = p.unit
        ? `<small>${p.units && p.units.length > 1
            ? p.units.length + " stacked CO2StoP storage units" : "CO2StoP storage unit"}</small>`
        : p.cap_mid_gt != null
          ? `${fmtGt(p.cap_mid_gt)} Gt CO₂ <small>(${short(p.tier)})</small>`
          : "assessed extent — no capacity estimate";
      ly.bindTooltip(`<b>${p.basin}</b>${cap}`, { sticky: true });
      ly.on("click", (e) => { showBasin(p); L.DomEvent.stop(e); });
    },
  });

  // ---------- ISM formations ----------
  const CAT = {
    ophiolite:     { v: "--oph",   label: "Ophiolite / peridotite / serpentinite" },
    flood_basalt:  { v: "--flood", label: "Continental flood basalt (LIP)" },
    offshore_basalt: { v: "--offsh", label: "Offshore basalt" },
    rift_volcanic: { v: "--rift",  label: "Rift / arc volcanic basalt" },
  };
  function ismStyle(f) {
    const p = f.properties;
    if (!p.matched) return { color: css("--oph"), weight: 0.5,
                             fillColor: css("--oph"), fillOpacity: 0.4 };
    const c = css(CAT[p.category].v);
    return { color: c, weight: 1, fillColor: c, fillOpacity: 0.55 };
  }
  function ismEach(f, ly) {
    const p = f.properties;
    const cap = p.cap_mid_gt != null
      ? `${fmtGt(p.cap_low_gt)}–${fmtGt(p.cap_high_gt)} Gt CO₂`
      : "capacity uncharacterized";
    ly.bindTooltip(`<b>${p.name}</b>${cap}<small>${CAT[p.category]?.label || ""}</small>`,
                   { sticky: true });
    ly.on("click", (e) => { showFormation(p); L.DomEvent.stop(e); });
  }
  const ismMatched = L.geoJSON(
    { type: "FeatureCollection",
      features: [...window.GEO_ISM_LIPS.features,
                 ...window.GEO_ISM_FALLBACK.features,
                 ...window.GEO_ISM_OPH.features.filter((f) => f.properties.matched)] },
    { style: ismStyle, onEachFeature: ismEach });
  const ismOther = L.geoJSON(
    { type: "FeatureCollection",
      features: window.GEO_ISM_OPH.features.filter((f) => !f.properties.matched) },
    { style: ismStyle, onEachFeature: ismEach });

  // ---------- projects ----------
  const ST_SOLID = { operational: 1, construction: 0.75, approved: 0.75 };
  function projLayerBuild() {
    const g = L.layerGroup();
    A.projects.forEach((p) => {
      if (p.lat == null || p.lon == null) return;
      const color = css(p.mechanism === "mineralization" ? "--proj-ism" : "--proj-geo");
      const solid = ST_SOLID[p.status] || 0;
      const r = 3 + Math.sqrt(Math.min(p.capacity_mtpa || 0.05, 12)) * 2.2;
      const m = L.circleMarker([p.lat, p.lon], {
        radius: r, color, weight: 1.6,
        fillColor: color, fillOpacity: solid ? 0.55 * solid : 0.08,
        pane: "markerPane",
      });
      m.bindTooltip(`<b>${p.name}</b>${p.status.replace(/_/g, " ")}` +
        `${p.capacity_mtpa ? ` · ${p.capacity_mtpa} Mtpa` : ""}` +
        `<small>${p.mechanism === "mineralization" ? "In-situ mineralization" : "CO₂ injection"}` +
        ` — ${p.storage_type}</small>`, { sticky: true });
      m.on("click", (e) => { showProject(p); L.DomEvent.stop(e); });
      g.addLayer(m);
    });
    return g;
  }
  const projLayer = projLayerBuild();

  // ---------- stats ----------
  function fmtGt(x) {
    if (x == null) return "–";
    if (x >= 1e6) return (x / 1e6).toLocaleString(undefined, { maximumFractionDigits: 1 }) + "M";
    if (x >= 1000) return x.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (x >= 10) return x.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return x.toLocaleString(undefined, { maximumSignificantDigits: 2 });
  }
  function short(tier) { return tierInfo(tier).label.toLowerCase(); }

  const G = A.global.geologic, M = A.global.mineralization;
  const nOpGeo = A.projects.filter((p) => p.mechanism === "geologic" && p.status === "operational").length;
  const nOpIsm = A.projects.filter((p) => p.mechanism === "mineralization" && p.status === "operational").length;
  const geoTip = "Potential range spans methodological tiers: ~1,290 Gt prudent " +
    "risk-screened (Gasser et al. 2025) to ~14,300 Gt catalogued resource (OGCI CO2 " +
    "Storage Resource Catalogue Cycle 5, 2025); theoretical ceilings reach 55,000 Gt " +
    "(Kearns et al. 2017). Tiers answer different questions and are never summed.";
  const ismTip = "Theoretical ceiling ~1,000,000 Gt from reactive rock mass " +
    "(NAS 2019; Kelemen et al.); practical deployment projected at ~1.2-5 Gt/yr by " +
    "2050 (RMI 2023). Operating figure is current injection capacity.";
  document.getElementById("stats").innerHTML = `
    <div class="stat-tile geo"><div class="k">CO₂ injection storage
        <span class="info" tabindex="0" data-tip="${geoTip}">ⓘ</span></div>
      <div class="v">${G.operational_mtpa} Mtpa</div>
      <div class="s">operating today across ${nOpGeo} sites<br>
      potential: <b>1,290–14,300 Gt</b></div></div>
    <div class="stat-tile ism"><div class="k">In-situ mineralization
        <span class="info" tabindex="0" data-tip="${ismTip}">ⓘ</span></div>
      <div class="v">${M.operational_mtpa} Mtpa</div>
      <div class="s">operating today across ${nOpIsm} sites<br>
      potential: <b>~${fmtGt(M.theoretical_gt)} Gt</b></div></div>`;

  // ---------- legend ----------
  function legend() {
    const rows = [];
    if (on("ly-basins") || on("ly-injection")) {
      rows.push(`<div class="lg-title">CO₂ injection storage (Gt CO₂, ${on("ly-basins") ? "per basin" : "per country"})</div>`);
      const lab = ["0–150", "150–500", ">500"];
      lab.forEach((l, i) => rows.push(
        `<div class="lg-row"><span class="lg-sw" style="background:${css(RAMP[i])}"></span>${l}</div>`));
      rows.push(`<div class="lg-row"><span class="lg-sw" style="background:${css("--inj-1")};opacity:.5;border:1.2px dashed ${css("--inj-4")}"></span>${on("ly-basins") ? "known basin, capacity unquantified or theoretical only" : "theoretical/prospective estimate only"}</div>`);
    }
    if (on("ly-basins")) {
      rows.push(`<div class="lg-row"><span class="lg-sw" style="background:${css("--inj-deep")};opacity:.6"></span>CO2StoP storage unit (EU, no basin assessment)</div>`);
    }
    if (on("ly-ism")) {
      rows.push(`<div class="lg-title">Mineralization formations</div>`);
      Object.values(CAT).forEach((c) => rows.push(
        `<div class="lg-row"><span class="lg-sw" style="background:${css(c.v)}"></span>${c.label}</div>`));
      rows.push(`<div class="lg-row"><small>mapped surface extent of reactive rock — see ⓘ / Methodology</small></div>`);
    }
    if (on("ly-projects")) {
      rows.push(`<div class="lg-title">Storage sites</div>`);
      rows.push(`<div class="lg-row"><span class="lg-sw round" style="background:${css("--proj-geo")}"></span>CO₂ injection site</div>`);
      rows.push(`<div class="lg-row"><span class="lg-sw round" style="background:${css("--proj-ism")}"></span>In-situ mineralization site</div>`);
      rows.push(`<div class="lg-row"><span class="lg-sw round" style="background:transparent;border:1.6px solid ${css("--proj-geo")}"></span>Planned / in permitting (hollow)</div>`);
      rows.push(`<div class="lg-row"><small>Size ∝ capacity (Mtpa)</small></div>`);
    }
    document.getElementById("legend-body").innerHTML = rows.join("");
  }

  // ---------- detail panel ----------
  const detail = document.getElementById("detail");
  function openDetail(title, html) {
    document.getElementById("detail-title").textContent = title;
    document.getElementById("detail-body").innerHTML = html;
    detail.hidden = false;
    detail.scrollTop = 0;
  }
  document.getElementById("detail-close").onclick = () => (detail.hidden = true);

  // ---------- detail-panel helpers ----------
  // Research tier strings are precise but dense; map them to five plain labels
  // and keep the raw string as a hover title for specialists.
  function tierInfo(t) {
    const s = (t || "").toLowerCase().split(/;| \/ |\balt\b/)[0];
    if (!s || /unassessed|n\/a|unsplit|data gap|not recovered|not basin-split|project-level/.test(s))
      return { label: "Not assessed", blurb: "No basin-specific capacity estimate in the sources reviewed." };
    if (/practic/.test(s))
      return { label: "Practical", blurb: "Screened for access, economics and regulation as well as geology." };
    if (/theoretical/.test(s) && /technical/.test(s))  // mixed tiers: conservative label
      return { label: "Theoretical", blurb: "Blend of theoretical and technical estimates; treat as an upper bound." };
    if (/effective|technical/.test(s))
      return { label: "Effective", blurb: "Screened for depth, injectivity and reservoir quality; not yet for access or economics." };
    if (/aggregated|catalog/.test(s))
      return { label: "Catalogued", blurb: "Resource-catalogue total (OGCI/SRMS) mixing maturity levels from stored to undiscovered." };
    if (/theoretical|prospective|unproven|structural|stochastic|hydrodynamic/.test(s))
      return { label: "Theoretical", blurb: "Volumetric estimate before screening for injectivity, access or economics — an upper bound." };
    return { label: "Estimate", blurb: "Basin-level estimate whose screening level is not stated in the source." };
  }
  function tierChip(t) {
    const i = tierInfo(t);
    return `<span class="tier-badge" title="${(t || "").replace(/"/g, "'")}">${i.label}</span>`;
  }
  function tierLine(t, override) {
    const blurb = override || tierInfo(t).blurb;
    return blurb ? `<div class="src">${blurb} Gt = billion tonnes CO₂.</div>` : "";
  }
  function more(title, html) {
    return html && html.trim()
      ? `<details class="more"><summary>${title}</summary>${html}</details>` : "";
  }
  function firstSentence(s, max = 200) {
    if (!s) return "";
    const m = s.match(/^.*?[.!?](\s|$)/);
    let out = (m ? m[0] : s).trim();
    if (out.length > max) {
      const cut = out.slice(0, max);
      const clause = Math.max(cut.lastIndexOf(", "), cut.lastIndexOf("; "), cut.lastIndexOf(" — "));
      out = (clause > max * 0.5 ? cut.slice(0, clause) : cut.replace(/\s+\S*$/, "")) + "…";
    }
    return out;
  }
  const ISO_NAME = {};
  (window.GEO_COUNTRIES?.features || []).forEach((f) => {
    if (f.properties.iso3 && f.properties.name) ISO_NAME[f.properties.iso3] = f.properties.name;
  });
  function countryNames(list) {
    return (list || []).filter(Boolean).map((c) => ISO_NAME[c] || c).join(", ");
  }
  // Full text for the details section only if the summary shown above was truncated.
  function restOf(text, max) {
    if (!text) return "";
    const shown = firstSentence(text, max), full = text.trim();
    if (shown === full) return "";                     // nothing beyond the summary
    if (shown.endsWith("…")) return full;              // summary was cut mid-sentence
    return full.slice(shown.length).trim();            // remainder only, no repeat
  }
  const STORAGE_LABEL = { saline: "Saline aquifer", depleted_og: "Depleted oil & gas field",
    basalt: "Basalt", peridotite: "Peridotite", serpentinite: "Serpentinite" };
  function pretty(s) { return (s || "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()); }

  function showCountry(p) {
    const c = A.countries.find((x) => x.iso3 === p.iso3) || {};
    const alts = (c.alt_estimates || []).filter((a) => a.gt).map((a) =>
      `<div>${fmtGt(a.gt)} Gt — ${tierInfo(a.tier).label.toLowerCase()} <span class="src">(${a.source})</span></div>`).join("");
    openDetail(p.name, `
      <div><span class="cap-big">${fmtGt(p.cap_pref_gt)} Gt CO₂</span>${tierChip(p.tier)}</div>
      ${tierLine(p.tier)}
      <dl>${c.key_basins ? `<dt>Key basins</dt><dd>${c.key_basins.join(", ")}</dd>` : ""}
      ${c.onshore_offshore_notes ? `<dt>Setting</dt><dd>${firstSentence(c.onshore_offshore_notes)}</dd>` : ""}</dl>
      ${more(`Other estimates (${(c.alt_estimates || []).filter((a) => a.gt).length})`, alts)}
      ${more("Notes & sources", `${c.notes ? `<p>${c.notes}</p>` : ""}<div class="src">${p.src || ""}</div>`)}`);
  }

  // ---------- storage cost lines (detail panels only; see Methodology) ----------
  const COSTS = A.costs || {};
  const COST_NOTE = "Indicative only: storage cost varies several-fold with site and project scale, and excludes capture.";

  // Returns {line, source} for a basin, or null.
  function basinCost(p) {
    const name = p.basin || "";
    const qgess = COSTS.qgess_us_basins?.by_basin?.[name];
    if (qgess != null)
      return { line: `~$${Math.round(qgess)} per tonne`,
               source: `NETL QGESS 2019 (2018$), includes ~100 km of pipeline transport.` };
    const sc = COSTS.strategy_ccus_eu?.by_region || {};
    const region = Object.keys(sc).find((k) => name.toLowerCase().includes(k.toLowerCase()));
    if (region) {
      const r = sc[region];
      const rng = r.eur_t_low === r.eur_t_high ? `€${r.eur_t_low}` : `€${r.eur_t_low}–${r.eur_t_high}`;
      return { line: `${rng} per tonne`,
               source: `STRATEGY CCUS D4.5 (2022), storage capex+opex for prospects ${r.prospects}; EU project report, not peer-reviewed.` };
    }
    // NETL modeled costs for formations present in this basin (US)
    const byState = COSTS.netl_us_formations?.by_state || {};
    const vals = [];
    (p.formations || []).forEach((f) => Object.values(byState).forEach((v) => {
      if (f.formation.toLowerCase().includes(v.formation.toLowerCase())) vals.push(v.usd_t);
    }));
    if (vals.length) {
      const lo = Math.round(Math.min(...vals)), hi = Math.round(Math.max(...vals));
      return { line: lo === hi ? `from ~$${lo} per tonne` : `$${lo}–${hi} per tonne`,
               source: `NETL 2024 saline storage cost model (2023$, first-year break-even incl. permitting and monitoring), lowest-cost cases for formations found in this basin — not a basin-specific estimate.` };
    }
    const offshore = /offshore/i.test(p.onshore_offshore || "") && !/onshore/i.test(p.onshore_offshore || "");
    const cr = COSTS.class_ranges?.ranges?.[offshore ? "offshore_saline" : "onshore_saline"];
    if (!cr) return null;
    return { line: `$${cr.low}–${cr.high} per tonne`,
             source: `Generic ${offshore ? "offshore" : "onshore"} saline-reservoir range (Schmelz et al. 2020, after Rubin et al. 2015), not site-specific.` };
  }

  function formationRows(p) {
    if (!p.formations || !p.formations.length) return "";
    const row = (f) => {
      const gt = f.tasr_mean_mt != null ? `${fmtGt(f.tasr_mean_mt / 1000)} Gt` : "–";
      const depth = (v) => v.depth_ft ? `~${(v.depth_ft * 0.3048 / 1000).toFixed(1)} km deep` : "";
      const detail = f.variants.length > 1
        ? `${f.variants.length} intervals` : depth(f.variants[0] || {});
      return `<div class="row"><span>${f.formation}</span><span class="v">${gt}</span>` +
             `${detail ? `<small>${detail}</small>` : ""}</div>`;
    };
    const first = p.formations.slice(0, 5).map(row).join("");
    const rest = p.formations.slice(5).map(row).join("");
    return `<div class="lg-title">Storage formations <small>(USGS 2013, technically accessible)</small></div>
      ${first}${rest ? more(`Show all ${p.formations.length} formations`, rest) : ""}`;
  }

  function unitRows(p) {
    if (!p.units || !p.units.length) return "";
    const rows = p.units.map((u) =>
      `<div class="row"><span>${u.name}</span><small>${[u.country, u.storage_type].filter(Boolean).join(", ")}</small></div>`).join("");
    const title = p.unit ? `Storage units at this location (${p.units.length})`
                         : `Assessed storage units in this basin (${p.units.length})`;
    return p.unit ? `<div class="lg-title">${title}</div>${rows}` : more(title, rows);
  }

  function showBasin(p) {
    if (p.unit) {  // standalone CO2StoP unit(s)
      openDetail(p.basin, `
        <div class="src">EU CO2StoP storage unit${(p.units || []).length > 1 ? "s" : ""}: an assessed
        formation with no basin-level capacity estimate covering this area.</div>
        ${unitRows(p)}`);
      return;
    }
    const capLine = p.cap_mid_gt != null
      ? `<span class="cap-big">${fmtGt(p.cap_mid_gt)} Gt CO₂</span>${tierChip(p.tier)}`
      : `<span class="cap-big">No capacity estimate</span>${tierChip(p.tier)}`;
    const range = (p.cap_low_gt != null && p.cap_high_gt != null && p.cap_low_gt !== p.cap_mid_gt)
      ? `<div class="src">Range across sources and methods: ${fmtGt(p.cap_low_gt)}–${fmtGt(p.cap_high_gt)} Gt.</div>` : "";
    const cost = basinCost(p);
    openDetail(p.basin, `
      <div>${capLine}</div>
      ${tierLine(p.tier)}
      <dl>${p.countries ? `<dt>Countries</dt><dd>${countryNames(p.countries)}</dd>` : ""}
      ${p.onshore_offshore ? `<dt>Setting</dt><dd>${pretty(p.onshore_offshore)}</dd>` : ""}
      ${cost ? `<dt>Storage cost</dt><dd>${cost.line} <span class="src">(indicative)</span></dd>` : ""}</dl>
      ${formationRows(p)}
      ${unitRows(p)}
      ${more("Details & sources", `
        ${range}
        ${p.notes ? `<p>${p.notes}</p>` : ""}
        ${cost ? `<p><b>Cost basis:</b> ${cost.source} ${COST_NOTE}</p>` : ""}
        ${p.formations ? `<p class="src">Formation capacities are mean technically accessible storage resource (USGS DS 774); rows combine base and deep intervals of the same formation.</p>` : ""}
        <div class="src">Capacity tier as recorded: ${p.tier || "–"}</div>
        <div class="src">${p.src || ""}</div>`)}`);
  }

  const ISM_EXTENT_NOTE = `<div class="src">Shaded area is where this reactive rock is mapped
    at the surface — an upper bound on where storage could be developed, not proven capacity.</div>`;

  function showFormation(p) {
    if (!p.matched) {
      openDetail(p.name, `
        <div><span class="cap-big">Not assessed</span></div>
        <p>Mapped ophiolite / ultramafic rock body. Suitable in principle for in-situ
        mineralization, but its thickness, depth and storage capacity have not been
        characterized.</p>
        ${ISM_EXTENT_NOTE}
        ${more("Source", `<div class="src">${p.src || ""}</div>`)}`);
      return;
    }
    const capLine = p.cap_low_gt != null || p.cap_high_gt != null
      ? `<span class="cap-big">${fmtGt(p.cap_low_gt)}–${fmtGt(p.cap_high_gt)} Gt CO₂</span>${tierChip("theoretical")}`
      : `<span class="cap-big">Capacity not quantified</span>`;
    openDetail(p.name, `
      <div>${capLine}</div>
      ${p.cap_low_gt != null ? tierLine("theoretical", "Theoretical: based on the volume and chemistry of reactive rock, before any screening — an upper bound.") : ""}
      <dl><dt>Rock</dt><dd>${CAT[p.category]?.label || p.category}${p.rock ? ` (${p.rock})` : ""}</dd>
      ${p.suitability ? `<dt>Suitability</dt><dd>${firstSentence(p.suitability)}</dd>` : ""}
      ${p.activity ? `<dt>Activity</dt><dd>${firstSentence(p.activity)}</dd>` : ""}</dl>
      ${ISM_EXTENT_NOTE}
      ${more("Details & sources", `
        ${p.cap_basis ? `<p><b>How the capacity was estimated:</b> ${p.cap_basis}</p>` : ""}
        ${p.depth ? `<p><b>Depth and thickness:</b> ${p.depth}</p>` : ""}
        ${restOf(p.suitability) ? `<p><b>Suitability (cont.):</b> ${restOf(p.suitability)}</p>` : ""}
        ${restOf(p.activity) ? `<p><b>Activity (cont.):</b> ${restOf(p.activity)}</p>` : ""}
        <div class="src">${p.src || ""}</div>`)}`);
  }

  function showProject(p) {
    const mech = p.mechanism === "mineralization" ? "In-situ mineralization" : "CO₂ injection";
    openDetail(p.name, `
      <div><span class="cap-big">${p.capacity_mtpa != null ? p.capacity_mtpa + " Mt/yr" : pretty(p.status)}</span>
        <span class="tier-badge">${pretty(p.status)}</span></div>
      ${p.capacity_mtpa != null ? `<div class="src">${p.status === "operational" ? "Injection rate" : "Planned injection rate"}, million tonnes CO₂ per year.</div>` : ""}
      <dl><dt>Type</dt><dd>${mech} — ${STORAGE_LABEL[p.storage_type] || pretty(p.storage_type)}</dd>
      <dt>Operator</dt><dd>${p.operator || "–"}</dd>
      ${p.start_year ? `<dt>Started</dt><dd>${p.start_year}</dd>` : ""}
      ${p.cumulative_stored_mt ? `<dt>Stored to date</dt><dd>${p.cumulative_stored_mt} Mt</dd>` : ""}
      <dt>Setting</dt><dd>${pretty(p.onshore_offshore) || "–"}</dd></dl>
      ${p.notes ? `<p>${firstSentence(p.notes, 220)}</p>` : ""}
      ${more("Details & sources", `${restOf(p.notes, 220) ? `<p>${restOf(p.notes, 220)}</p>` : ""}<div class="src">${p.source || ""}</div>`)}`);
  }

  // ---------- layer toggles ----------
  function on(id) { return document.getElementById(id).checked; }
  function sync() {
    toggle(injLayer, on("ly-injection"));
    toggle(basinsLayer, on("ly-basins"));
    toggle(ismOther, on("ly-ism"));
    toggle(ismMatched, on("ly-ism"));
    toggle(projLayer, on("ly-projects"));
    legend();
  }
  function toggle(layer, want) {
    if (want && !map.hasLayer(layer)) layer.addTo(map);
    if (!want && map.hasLayer(layer)) map.removeLayer(layer);
  }
  // basins and country view are alternate renderings of the same data — never both
  document.getElementById("ly-injection").addEventListener("change", (e) => {
    if (e.target.checked) document.getElementById("ly-basins").checked = false;
  });
  document.getElementById("ly-basins").addEventListener("change", (e) => {
    if (e.target.checked) document.getElementById("ly-injection").checked = false;
  });
  ["ly-injection", "ly-basins", "ly-ism", "ly-projects"]
    .forEach((id) => document.getElementById(id).addEventListener("change", sync));
  sync();

  // ---------- methodology modal ----------
  const modal = document.getElementById("method-modal");
  document.getElementById("btn-method").onclick = () => (modal.hidden = false);
  document.getElementById("method-close").onclick = () => (modal.hidden = true);
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.hidden = true; });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!modal.hidden) modal.hidden = true;
    else detail.hidden = true;
  });
  document.getElementById("method-body").innerHTML = `
    <h3>What this map shows</h3>
    <p>An inventory of global CO₂ storage opportunity across two mechanisms.
    <b>Geologic injection</b>: supercritical CO₂ injected into porous sedimentary
    reservoirs (deep saline aquifers, depleted oil &amp; gas fields), trapped by caprock and
    mineralizing over ~1,000s of years. <b>In-situ mineralization (ISM)</b>: CO₂ injected
    into reactive mafic/ultramafic rock (basalt, peridotite, serpentinite), converting to
    solid carbonate within months–years. EOR and ECBM are excluded. The ideal storage site
    depends on transport distance and cost from the CO₂ source, permitting and development
    time, and cost per ton stored.</p>
    <h3>Capacity tiers — read before comparing numbers</h3>
    <p><b>Theoretical</b> (full pore volume or full rock stoichiometry),
    <b>effective</b> (screened for injectivity/depth/quality), and <b>practical</b>
    (also screened for access, economics, regulation) answer different questions and are
    never summed here. Geologic global anchors: ~1,290 Gt prudent (Gasser 2025),
    ~14,300 Gt catalogued (OGCI CSRC Cycle 5), 55,000 Gt theoretical ceiling (Kearns 2017).
    ISM theoretical ceiling ~10⁶ Gt (NAS 2019; Kelemen et al.) — orders of magnitude above
    any plausible need, but the practical rate is projected at only ~1.2–5 Gt/yr by 2050
    (RMI 2023).</p>
    <h3>Storage costs (detail panels)</h3>
    <p>Cost lines are indicative and storage-only (capture always excluded; transport
    excluded except where noted). US formations: NETL's 2024 run of the FE/NETL saline
    storage cost model across 314 formations — first-year break-even price, 2023$,
    including Class VI permitting and monitoring (nationally, &gt;200 Gt of prospective
    resource at ≤$8/t). Four US basins carry NETL QGESS (2019) transport+storage figures
    (2018$, ~100 km pipeline). Southern-EU regions: STRATEGY CCUS D4.5 (2022; EU project
    report, sites pre-bankability). Everywhere else: generic reservoir-class ranges
    (Schmelz et al. 2020, after Rubin et al. 2015). Costs vary 2–10× within a single
    basin with injection rate, depth, and reservoir quality — none of these figures are
    site-specific.</p>
    <h3>ISM suitability &amp; depth — why no depth screen is applied</h3>
    <p>Mineralization polygons show the mapped surface extent of reactive rock — an
    upper bound on geographic availability, not screened storage resource. The familiar
    ≥800 m criterion comes from conventional injection storage (IPCC SRCCS 2005: below
    ~800 m CO₂ remains supercritical) and carries over to supercritical basalt storage
    (the Wallula pilot injected at 828–887 m; NAS 2019), but dissolved-phase injection
    (CarbFix, Hellisheiði) operates at ~500 m — trading depth for substantial water
    demand — and engineered peridotite concepts target ~3 km (Kelemen &amp; Matter 2008).
    No global thickness or depth dataset exists for basalt/ophiolite bodies (published
    isopachs are figures, not GIS; the US-only SubMAP-CO2 3D mapping effort is in
    progress), so no depth screen is applied here. Detail panels carry per-formation
    depth/thickness notes where literature exists.</p>
    <h3>Why mineralization matters (the complementarity case)</h3>
    <p>ISM-suitable rock sits in geographies that sedimentary basins don't reach —
    ophiolite belts (Oman/UAE, the Balkans, SE Asia, New Caledonia), flood basalts
    (India's Deccan, the Pacific Northwest, Ethiopia), and rift/island basalt (Iceland,
    Kenya, Japan). Several of these regions (India, Japan, Korea, SE Asia) are exactly
    where conventional storage is projected to fall short of demand. Mineral trapping is
    also immediate, easing monitoring burdens and potentially public acceptance.</p>
    <h3>Sources (injection)</h3>
    <p class="method-src">OGCI CO₂ Storage Resource Catalogue Cycles 2/4/5; USGS 2013 National Assessment;
    NETL NATCARB / Carbon Storage Atlas V; Teletzke et al. 2018; Kearns et al. 2017;
    EU GeoCapacity / CO2StoP; national atlases (NPD, UK CO2Stored, Geoscience Australia);
    academic national assessments (China, India, Brazil, Indonesia…). Country colors use
    each country's preferred (most defensible) estimate; click a country for all tiers.</p>
    <h3>Sources (mineralization)</h3>
    <p class="method-src">Snæbjörnsdóttir et al. 2020; Kelemen &amp; Matter 2008/2019; McGrail et al.
    2006/2017 (Wallula); Goldberg et al. 2008/2010; NAS 2019; PNNL 2024 (Columbia River);
    formation polygons from Ernst &amp; Youbi LIP compilation and the PLATES/UTIG global
    ophiolite dataset; US ultramafics from USGS DS-414.</p>
    <h3>Projects</h3>
    <p>${A.projects.length} dedicated-storage projects
    (${A.projects.filter((p) => p.mechanism === "geologic").length} geologic,
    ${A.projects.filter((p) => p.mechanism === "mineralization").length} ISM) with
    mid-2026 statuses, compiled from the Global CCS Institute, IEA CCUS database,
    EPA Class VI tracker, operator disclosures, and press. Full citations:
    <code>data/research/</code> in the repository.</p>`;

  legend();

  // ---------- first-visit tour ----------
  // Step copy pulls the same computed values as the stat tiles; the 55,000 Gt
  // theoretical ceiling matches the geoTip / methodology text (Kearns 2017).
  const TOUR = [
    { el: "#stats", title: "Start with the headline numbers", html:
      `CO₂ storage to date is almost all injection — <b>${G.operational_mtpa} Mtpa</b> ` +
      `operating across ${nOpGeo} sites, vs <b>${M.operational_mtpa} Mtpa</b> at ` +
      `${nOpIsm} in-situ mineralization (ISM) sites. But ISM's theoretical potential ` +
      `(~${fmtGt(M.theoretical_gt)} Gt) exceeds even the largest theoretical estimates ` +
      `for injection (~55,000 Gt), and it reaches many regions with no good injection ` +
      `formations. Carbon removal at scale needs both.` },
    { el: "#map", title: "Reading the map", html:
      `<b>Blues</b> are sedimentary basins suited to CO₂ injection — darker means more ` +
      `assessed capacity, dashed means unquantified. <b>Warm colors and purple</b> are ` +
      `reactive rock (basalts, ophiolites) suited to ISM.` },
    { el: "#map", title: "Explore the data", html:
      `Hover any region for a quick number. Click a basin, formation, or storage site ` +
      `for capacity estimates, tiers, and sources.` },
    { el: "#layers", title: "Layers &amp; the fine print", html:
      `Toggle <b>storage sites</b> to see operating and proposed projects; Advanced offers ` +
      `a country-level view. Click any basin for formation-level detail. Capacity tiers ` +
      `(theoretical / effective / practical) answer different questions and are never ` +
      `summed — see the ⓘ icons.` },
  ];
  const tourWrap = document.createElement("div");
  tourWrap.id = "tour";
  tourWrap.hidden = true;
  tourWrap.innerHTML = `<div id="tour-spotlight"></div>
    <div id="tour-card" role="dialog" aria-modal="true" aria-label="Introduction tour" tabindex="-1">
      <h3></h3><p></p>
      <div class="tour-foot"><div class="tour-dots"></div>
        <button id="tour-skip">Skip</button><button id="tour-back">Back</button>
        <button id="tour-next" class="primary">Next</button></div></div>`;
  document.body.appendChild(tourWrap);
  const tq = (s) => tourWrap.querySelector(s);
  let ti = 0;
  function tourShow(i) {
    ti = i;
    const step = TOUR[i];
    const target = document.querySelector(step.el);
    target.scrollIntoView({ block: "nearest" });
    const r = target.getBoundingClientRect();
    const sp = tq("#tour-spotlight");
    sp.style.left = r.left - 6 + "px";
    sp.style.top = r.top - 6 + "px";
    sp.style.width = r.width + 12 + "px";
    sp.style.height = r.height + 12 + "px";
    tq("h3").innerHTML = step.title;
    tq("p").innerHTML = step.html;
    tq(".tour-dots").innerHTML = TOUR.map((_, k) =>
      `<span${k === i ? ' class="cur"' : ""}></span>`).join("");
    tq("#tour-back").style.visibility = i ? "visible" : "hidden";
    tq("#tour-next").textContent = i === TOUR.length - 1 ? "Done" : "Next";
    tourWrap.hidden = false;
    const card = tq("#tour-card");
    if (window.innerWidth > 760) {
      if (step.el === "#map") {
        card.style.left = Math.round(r.left + r.width / 2 - 150) + "px";
        card.style.top = Math.round(r.top + 56) + "px";
      } else {
        card.style.left = Math.round(Math.min(r.right + 14, window.innerWidth - 314)) + "px";
        card.style.top = Math.round(Math.max(12,
          Math.min(r.top, window.innerHeight - card.offsetHeight - 12))) + "px";
      }
    }
    card.focus({ preventScroll: true });
  }
  function tourEnd() {
    tourWrap.hidden = true;
    try { localStorage.setItem("atlas_tour_seen", "1"); } catch (e) {}
  }
  tq("#tour-next").onclick = () => (ti < TOUR.length - 1 ? tourShow(ti + 1) : tourEnd());
  tq("#tour-back").onclick = () => { if (ti) tourShow(ti - 1); };
  tq("#tour-skip").onclick = tourEnd;
  tourWrap.addEventListener("click", (e) => {
    if (!tq("#tour-card").contains(e.target)) tq("#tour-next").click();
  });
  document.addEventListener("keydown", (e) => {
    if (tourWrap.hidden) return;
    if (e.key === "Escape") tourEnd();
    if (e.key === "ArrowRight") tq("#tour-next").click();
    if (e.key === "ArrowLeft") tq("#tour-back").click();
  });
  window.addEventListener("resize", () => { if (!tourWrap.hidden) tourShow(ti); });
  document.getElementById("btn-tour").onclick = () => tourShow(0);
  let tourSeen = true;
  try { tourSeen = !!localStorage.getItem("atlas_tour_seen"); } catch (e) {}
  if (!tourSeen) setTimeout(() => tourShow(0), 400);
})();
