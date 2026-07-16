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
    "Geometry: Natural Earth, NETL NATCARB, Ernst & Youbi LIPs, PLATES/UTIG ophiolites");

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
      if (p.cap_mid_gt == null || p.soft_tier)
        return { color: css("--inj-4"), weight: 0.8, dashArray: "3 3",
                 fillColor: css("--inj-1"), fillOpacity: 0.3 };
      return { color: css("--land-line"), weight: 0.6,
               fillColor: injColor(p.cap_mid_gt), fillOpacity: 0.8 };
    },
    onEachFeature: (f, ly) => {
      const p = f.properties;
      const cap = p.cap_mid_gt != null
        ? `${fmtGt(p.cap_mid_gt)} Gt CO₂ <small>(${short(p.tier)})</small>`
        : "assessed extent — no capacity estimate";
      ly.bindTooltip(`<b>${p.basin}</b>${cap}`, { sticky: true });
      ly.on("click", (e) => { showBasin(p); L.DomEvent.stop(e); });
    },
  });

  const natcarbLayer = L.geoJSON(window.GEO_INJ_NATCARB, {
    style: { color: css("--inj-deep"), weight: 0.7, fillColor: css("--inj-deep"), fillOpacity: 0.35 },
    onEachFeature: (f, ly) => {
      ly.bindTooltip(`<b>${f.properties.BASIN_NAME || "Saline formation"}</b>` +
        `<small>NATCARB saline storage formation (US)</small>`, { sticky: true });
    },
  });

  const euStorageLayer = L.geoJSON(window.GEO_EU_STORAGE, {
    style: { color: css("--inj-deep"), weight: 0.7, fillColor: css("--inj-deep"), fillOpacity: 0.35 },
    onEachFeature: (f, ly) => {
      const p = f.properties;
      ly.bindTooltip(`<b>${p.name}</b><small>${p.country || ""} — CO2StoP storage unit (${p.storage_type || "saline"})</small>`,
                     { sticky: true });
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
  function short(tier) { return (tier || "").split(/[ (]/)[0] || "estimate"; }

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
      rows.push(`<div class="lg-row"><span class="lg-sw" style="background:${css("--inj-1")};opacity:.5;border:1.2px dashed ${css("--inj-4")}"></span>known basin, capacity unquantified or theoretical only</div>`);
    }
    if (on("ly-ism")) {
      rows.push(`<div class="lg-title">Mineralization formations</div>`);
      Object.values(CAT).forEach((c) => rows.push(
        `<div class="lg-row"><span class="lg-sw" style="background:${css(c.v)}"></span>${c.label}</div>`));

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

  function tierBadge(t) { return `<span class="tier-badge">${t || "unspecified tier"}</span>`; }

  function showCountry(p) {
    const c = A.countries.find((x) => x.iso3 === p.iso3) || {};
    const alts = (c.alt_estimates || []).map((a) =>
      `<div>· ${fmtGt(a.gt)} Gt — ${a.tier} <span class="src">(${a.source})</span></div>`).join("");
    openDetail(p.name, `
      <div><span class="cap-big">${fmtGt(p.cap_pref_gt)} Gt CO₂</span>${tierBadge(p.tier)}</div>
      <div class="src">${p.src || ""}</div>
      <dl>${c.key_basins ? `<dt>Key basins</dt><dd>${c.key_basins.join(", ")}</dd>` : ""}
      ${c.onshore_offshore_notes ? `<dt>On/offshore</dt><dd>${c.onshore_offshore_notes}</dd>` : ""}</dl>
      ${alts ? `<div class="lg-title">Alternate estimates (other tiers)</div>${alts}` : ""}
      ${c.notes ? `<p>${c.notes}</p>` : ""}`);
  }

  function showBasin(p) {
    const capLine = p.cap_mid_gt != null
      ? `<span class="cap-big">${fmtGt(p.cap_mid_gt)} Gt CO₂</span>${tierBadge(p.tier)}`
      : `<span class="cap-big">No published capacity estimate</span>`;
    const range = (p.cap_low_gt != null && p.cap_high_gt != null &&
                   p.cap_low_gt !== p.cap_mid_gt)
      ? `<div class="src">range ${fmtGt(p.cap_low_gt)}–${fmtGt(p.cap_high_gt)} Gt across tiers/sources</div>` : "";
    openDetail(p.basin, `
      <div>${capLine}</div>${range}
      <dl>${p.countries ? `<dt>Countries</dt><dd>${p.countries.join(", ")}</dd>` : ""}
      ${p.onshore_offshore ? `<dt>On/offshore</dt><dd>${p.onshore_offshore}</dd>` : ""}</dl>
      ${p.notes ? `<p>${p.notes}</p>` : ""}
      <div class="src">${p.src || ""}</div>`);
  }

  function showFormation(p) {
    if (!p.matched) {
      openDetail(p.name, `
        <p>Mapped ophiolite / ultramafic body from the PLATES/UTIG global compilation.
        Reactive rock suitable in principle for in-situ mineralization, but no published
        site-specific storage capacity estimate was found.</p>
        <div class="src">${p.src || ""}</div>`);
      return;
    }
    const capLine = p.cap_low_gt != null || p.cap_high_gt != null
      ? `<span class="cap-big">${fmtGt(p.cap_low_gt)}–${fmtGt(p.cap_high_gt)} Gt CO₂</span>
         ${tierBadge("theoretical–effective")}`
      : `<span class="cap-big">Capacity uncharacterized</span>`;
    openDetail(p.name, `
      <div>${capLine}</div>
      <dl><dt>Category</dt><dd>${CAT[p.category]?.label || p.category}</dd>
      <dt>Rock</dt><dd>${p.rock || "–"}</dd></dl>
      ${p.cap_basis ? `<p><b>Capacity basis:</b> ${p.cap_basis}</p>` : ""}
      ${p.suitability ? `<p><b>Suitability:</b> ${p.suitability}</p>` : ""}
      ${p.activity ? `<p><b>Activity:</b> ${p.activity}</p>` : ""}
      <div class="src">${p.src || ""}</div>`);
  }

  function showProject(p) {
    openDetail(p.name, `
      <dl><dt>Mechanism</dt><dd>${p.mechanism === "mineralization"
          ? "In-situ mineralization" : "CO₂ injection"} (${p.storage_type})</dd>
      <dt>Status</dt><dd>${p.status.replace(/_/g, " ")}</dd>
      <dt>Operator</dt><dd>${p.operator || "–"}</dd>
      <dt>Capacity</dt><dd>${p.capacity_mtpa != null ? p.capacity_mtpa + " Mtpa" : "–"}</dd>
      ${p.cumulative_stored_mt ? `<dt>Stored to date</dt><dd>${p.cumulative_stored_mt} Mt</dd>` : ""}
      ${p.start_year ? `<dt>Start</dt><dd>${p.start_year}</dd>` : ""}
      <dt>Setting</dt><dd>${p.onshore_offshore || "–"}</dd></dl>
      ${p.notes ? `<p>${p.notes}</p>` : ""}
      <div class="src">${p.source || ""}</div>`);
  }

  // ---------- layer toggles ----------
  function on(id) { return document.getElementById(id).checked; }
  function sync() {
    toggle(injLayer, on("ly-injection"));
    toggle(basinsLayer, on("ly-basins"));
    toggle(natcarbLayer, on("ly-detail"));
    toggle(euStorageLayer, on("ly-detail"));
    toggle(ismOther, on("ly-ism"));
    toggle(ismMatched, on("ly-ism"));
    toggle(projLayer, on("ly-projects"));
    legend();
  }
  function toggle(layer, want) {
    if (want && !map.hasLayer(layer)) layer.addTo(map);
    if (!want && map.hasLayer(layer)) map.removeLayer(layer);
  }
  ["ly-injection", "ly-basins", "ly-detail", "ly-ism", "ly-projects"]
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
    solid carbonate within months–years. EOR and ECBM are excluded.</p>
    <h3>Capacity tiers — read before comparing numbers</h3>
    <p><b>Theoretical</b> (full pore volume or full rock stoichiometry),
    <b>effective</b> (screened for injectivity/depth/quality), and <b>practical</b>
    (also screened for access, economics, regulation) answer different questions and are
    never summed here. Geologic global anchors: ~1,290 Gt prudent (Gasser 2025),
    ~14,300 Gt catalogued (OGCI CSRC Cycle 5), 55,000 Gt theoretical ceiling (Kearns 2017).
    ISM theoretical ceiling ~10⁶ Gt (NAS 2019; Kelemen et al.) — orders of magnitude above
    any plausible need, but the practical rate is projected at only ~1–5 Gt/yr by 2050.</p>
    <h3>Why mineralization matters (the complementarity case)</h3>
    <p>ISM-suitable rock sits in geographies that sedimentary basins don't reach —
    ophiolite belts (Oman/UAE, the Balkans, SE Asia, New Caledonia), flood basalts
    (India's Deccan, the Pacific Northwest, Ethiopia), and rift/island basalt (Iceland,
    Kenya, Japan). Several of these regions (India, Japan, Korea, SE Asia) are exactly
    where conventional storage is projected to fall short of demand. Mineral trapping is
    also immediate, easing monitoring burdens and potentially public acceptance.</p>
    <h3>Sources (injection)</h3>
    <p>OGCI CO₂ Storage Resource Catalogue Cycles 2/4/5; USGS 2013 National Assessment;
    NETL NATCARB / Carbon Storage Atlas V; Teletzke et al. 2018; Kearns et al. 2017;
    EU GeoCapacity / CO2StoP; national atlases (NPD, UK CO2Stored, Geoscience Australia);
    academic national assessments (China, India, Brazil, Indonesia…). Country colors use
    each country's preferred (most defensible) estimate; click a country for all tiers.</p>
    <h3>Sources (mineralization)</h3>
    <p>Snæbjörnsdóttir et al. 2020; Kelemen &amp; Matter 2008/2019; McGrail et al.
    2006/2017 (Wallula); Goldberg et al. 2008/2010; NAS 2019; PNNL 2024 (Columbia River);
    formation polygons from Ernst &amp; Youbi LIP compilation and the PLATES/UTIG global
    ophiolite dataset; US ultramafics from USGS DS-414.</p>
    <h3>Projects</h3>
    <p>84 dedicated-storage projects (69 geologic, 15 ISM) with mid-2026 statuses,
    compiled from the Global CCS Institute, IEA CCUS database, EPA Class VI tracker,
    operator disclosures, and press. Full citations: <code>data/research/</code> in the
    repository.</p>`;

  legend();
})();
