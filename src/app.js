/* Global CO2 Storage Atlas: single-page Leaflet app.
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
      if (isSoft(f.properties.tier)) return { color: css("--inj-4"), weight: 0.8, dashArray: "3 3",
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
      // Standalone EU CO2StoP units (no basin polygon covers them) are known storage
      // formations without a capacity number, so they share the unquantified style.
      if (p.unit || p.cap_mid_gt == null || isSoft(p.tier))
        return { color: css("--inj-4"), weight: 0.8, dashArray: "3 3",
                 fillColor: css("--inj-1"), fillOpacity: 0.3 };
      return { color: css("--land-line"), weight: 0.6,
               fillColor: injColor(p.cap_mid_gt), fillOpacity: 0.8 };
    },
    onEachFeature: (f, ly) => {
      const p = f.properties;
      const cap = p.unit
        ? "assessed extent, no capacity estimate"
        : p.cap_mid_gt != null
          ? `${fmtGt(p.cap_mid_gt)} Gt CO₂ <small>(${short(p.tier)})</small>`
          : "assessed extent, no capacity estimate";
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
  const STORAGE_LABEL = { saline: "Saline aquifer", depleted_og: "Depleted oil & gas field",
    basalt: "Basalt", peridotite: "Peridotite", serpentinite: "Serpentinite" };
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
        `${p.capacity_mtpa ? ` · ${p.capacity_mtpa} Mt/yr` : ""}` +
        `<small>${p.mechanism === "mineralization" ? "Mineralization" : "Sedimentary storage"}` +
        `: ${(STORAGE_LABEL[p.storage_type] || p.storage_type.replace(/_/g, " ")).toLowerCase()}</small>`, { sticky: true });
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
  const INJ_UPPER_GT = 55000;  // top of Kearns et al. 2017 "practically accessible" range
  const ismRatio = Math.round(M.theoretical_gt / INJ_UPPER_GT);
  const fmtBig = (x) => Math.round(x).toLocaleString("en-US");
  // Plain-language tooltips; sources and caveats are in the methodology modal.
  const geoTip = "The low end is a risk-adjusted assessment of how much can be stored safely. " +
    "The high end is the total of all catalogued storage sites, most of them not yet explored. " +
    "See Methodology for sources.";
  const ismTip = "This reflects the theoretical capacity based on the volume and chemistry of " +
    "reactive rock. See Methodology for sources.";
  document.getElementById("stats").innerHTML = `
    <div class="stat-tile geo"><div class="k">Injection in sedimentary basins</div>
      <div class="v">${G.operational_mtpa} Mt/yr</div>
      <div class="s">operating today, ${nOpGeo} sites</div>
      <div class="v2">1,290–14,300 Gt</div>
      <div class="s">potential range
        <span class="info" tabindex="0" data-tip="${geoTip}">ⓘ</span></div></div>
    <div class="stat-tile ism"><div class="k">Mineralization in reactive rock</div>
      <div class="v">${M.operational_mtpa} Mt/yr</div>
      <div class="s">operating today, ${nOpIsm} sites</div>
      <div class="v2">~${fmtBig(M.theoretical_gt)} Gt</div>
      <div class="s">theoretical potential
        <span class="info" tabindex="0" data-tip="${ismTip}">ⓘ</span></div></div>`;

  // ---------- legend ----------
  function legend() {
    const rows = [];
    if (injOn()) {
      rows.push(`<div class="lg-title">Sedimentary storage: capacity per ${injMode() === "basins" ? "basin" : "country"} (Gt CO₂)</div>`);
      const lab = ["0–150", "150–500", ">500"];
      lab.forEach((l, i) => rows.push(
        `<div class="lg-row"><span class="lg-sw" style="background:${css(RAMP[i])}"></span>${l}</div>`));
      rows.push(`<div class="lg-row"><span class="lg-sw" style="background:${css("--inj-1")};opacity:.5;border:1.2px dashed ${css("--inj-4")}"></span>${injMode() === "basins" ? "Known basin, capacity unquantified or theoretical only" : "Theoretical or prospective estimate only"}</div>`);
    }
    if (on("ly-ism")) {
      rows.push(`<div class="lg-title">Mineralization: type of reactive rock formation</div>`);
      Object.values(CAT).forEach((c) => rows.push(
        `<div class="lg-row"><span class="lg-sw" style="background:${css(c.v)}"></span>${c.label}</div>`));
    }
    if (on("ly-projects")) {
      rows.push(`<div class="lg-title">Storage sites</div>`);
      rows.push(`<div class="lg-row"><span class="lg-sw round" style="background:${css("--proj-geo")}"></span>Sedimentary</div>`);
      rows.push(`<div class="lg-row"><span class="lg-sw round" style="background:${css("--proj-ism")}"></span>Mineralization</div>`);
    }
    document.getElementById("legend-body").innerHTML = rows.join("");
  }

  // ---------- detail panel ----------
  const detail = document.getElementById("detail");
  // Consistent units and notation in displayed text (link URLs untouched): CO2 -> CO₂
  // (not inside names such as CO2StoP, CO2CRC, CO2 Lock), Mtpa -> Mt/yr, km2 -> km².
  function tidyText(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      n.nodeValue = n.nodeValue
        .replace(/\bCO2\b(?!\s?(Lock|Stored|StoP|CRC|Basalt|RE|-SCREEN)\b)/g, "CO₂")
        .replace(/(\d)\s?Mtpa\b/g, "$1 Mt/yr").replace(/\bMtpa\b/g, "Mt/yr")
        .replace(/\bkm2\b/g, "km²");
    }
  }
  function openDetail(title, html) {
    document.getElementById("detail-title").textContent = title;
    document.getElementById("detail-body").innerHTML = html;
    tidyText(document.getElementById("detail-body"));
    detail.hidden = false;
    detail.scrollTop = 0;
  }
  document.getElementById("detail-close").onclick = () => (detail.hidden = true);

  // ---------- detail-panel helpers ----------
  // Research tier strings are precise but dense; map them to five plain labels
  // and keep the raw string as a hover title for specialists.
  function tierInfo(t) {
    const s = (t || "").toLowerCase().split(/;| \/ |\balt\b/)[0];
    if (/national total only|not split|no basin-level/.test(s))
      return { label: "Not assessed", blurb: "This basin's capacity is included in a national estimate that is not split by basin; see the country view." };
    if (/^not assessed/.test(s))
      return { label: "Not assessed", blurb: "No published storage estimate for this country." };
    if (/not quantified/.test(s))
      return { label: "Not assessed", blurb: "USGS assessed this basin in 2013 but did not estimate its storage capacity." };
    if (!s || /unassessed|n\/a|unsplit|data gap|not recovered|not basin-split|project-level/.test(s))
      return { label: "Not assessed", blurb: "No basin-specific capacity estimate in the sources reviewed." };
    if (/practic/.test(s))
      return { label: "Practical", blurb: "Screened for access, economics and regulation as well as geology." };
    if (/theoretical/.test(s) && /technical/.test(s))  // mixed tiers: conservative label
      return { label: "Theoretical", blurb: "Blend of theoretical and technical estimates; treat as an upper bound." };
    if (/effective|technical/.test(s))
      return { label: "Effective", blurb: "Screened for depth, injectivity and reservoir quality; not yet for access or economics." };
    if (/aggregated|catalog/.test(s))
      return { label: "Catalogued", blurb: "Total from the OGCI CO₂ Storage Resource Catalogue, adding up sites at every stage from already storing CO₂ to not yet explored (globally, 95% of the catalogue is undiscovered)." };
    if (/theoretical|prospective|unproven|structural|stochastic|hydrodynamic/.test(s))
      return { label: "Theoretical", blurb: "Volumetric estimate before screening for injectivity, access or economics, so an upper bound." };
    return { label: "Estimate", blurb: "Basin-level estimate whose screening level is not stated in the source." };
  }
  // Dashed outline = the same rule as the "Theoretical" badge (primary tier only).
  function isSoft(t) { return tierInfo(t).label === "Theoretical"; }
  // The explainer for each kind of estimate lives in the badge's hover tooltip (2026-10-15:
  // removed from the panel body at the user's request).
  function tierChip(t, blurb) {
    const i = tierInfo(t);
    return `<span class="tier-badge" title="${(blurb || i.blurb || "").replace(/"/g, "'")}">${i.label}</span>`;
  }
  function more(title, html) {
    return html && html.trim()
      ? `<details class="more"><summary>${title}</summary>${html}</details>` : "";
  }
  const ISO_NAME = {};
  (window.GEO_COUNTRIES?.features || []).forEach((f) => {
    if (f.properties.iso3 && f.properties.name) ISO_NAME[f.properties.iso3] = f.properties.name;
  });
  function countryNames(list) {
    return (list || []).filter(Boolean).map((c) => ISO_NAME[c] || c).join(", ");
  }
  // Turn URLs and bare domains in research text into links with a readable label.
  const URL_RE = /(https?:\/\/[^\s<>()"']+|(?<![\w@\/.])(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|org|gov|edu|net|eu|int|io|no|dk|uk|de|fr|ch|is|ca|au|nl|be|pt|es|it|se|fi|jp|kr|in|br|za|ae|om|hr|bg|pl|ro|hu|cz|gr|sk|si|lt|lv|ee|ie|nz|cn|id|my|sa|qa|ng|ke|tw|th|mx|ar|cl|co)(?:\/[^\s<>()"']*)?)(?![\w.-])/gi;
  const SOURCE_LINKS = (A.source_links || []).slice()
    .sort((x, y) => y.match.length - x.match.length);
  function linkify(text) {
    if (!text) return "";
    // 1. known citations -> placeholders (protects them from the URL pass)
    const held = [];
    let out = String(text);
    SOURCE_LINKS.forEach((l) => {
      if (!l.url || !out.includes(l.match)) return;
      held.push(`<a href="${l.url}" target="_blank" rel="noopener">${l.match}</a>`);
      out = out.split(l.match).join(`\u0001${held.length - 1}\u0001`);
    });
    // 1b. bare DOIs ("doi:10.xxxx/...") -> doi.org links
    out = out.replace(/\bdoi:\s*(10\.\d{4,9}\/[^\s,;()]+[^\s,;().])/gi, (m, d) => {
      held.push(`<a href="https://doi.org/${d}" target="_blank" rel="noopener">${m}</a>`);
      return `\u0001${held.length - 1}\u0001`;
    });
    // 2. raw URLs / domains
    out = out.replace(URL_RE, (m) => {
      let url = m, trail = "";
      const t = url.match(/[.,;:]+$/);
      if (t) { trail = t[0]; url = url.slice(0, -trail.length); }
      const href = /^https?:\/\//i.test(url) ? url : "https://" + url;
      let label = url;
      try {
        const u = new URL(href);
        label = u.hostname.replace(/^www\./, "") + (u.pathname && u.pathname !== "/" ? u.pathname : "");
      } catch (e) { /* keep raw */ }
      if (label.length > 44) label = label.slice(0, 42).replace(/[\/-]+$/, "") + "…";
      return `<a href="${href}" target="_blank" rel="noopener">${label}</a>${trail}`;
    });
    return out.replace(/\u0001(\d+)\u0001/g, (_, i) => held[+i]);
  }
  // Public panels show short notes in full and send readers to linked sources.
  // Research citation strings carry annotations; show each as its clean label.
  function splitTop(str) {           // split on ";" outside parentheses
    const out = []; let depth = 0, cur = "";
    for (const ch of String(str)) {
      if (ch === "(") depth++;
      if (ch === ")") depth = Math.max(0, depth - 1);
      if (ch === ";" && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
    }
    out.push(cur);
    return out.map((x) => x.trim()).filter(Boolean);
  }
  const SRC_DROP = /(not located|not found|not extracted|not recovered)\.?$|^(n\/a$|seed data$|none found|no [a-z0-9 -]*(study|studies|estimate|assessment|figure)|no isolated|see |secondary review|gt figure not extracted)/i;
  const esc = (x) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  function cleanCite(x) {
    return x.replace(/\s+--\s.*$/, "")
      .replace(/\s*\([^()]*\b(recovered|extracted|entry|see|identified|secondary|unverified|apportion\w*|derived)\b[^()]*\)/gi, "")
      .replace(/^secondary summary of\s*/i, "")
      .replace(/,?\s*\(?(via )?ScienceDirect S\d{10,}[^)]*\)?/g, "")
      .replace(/,?\s*\(?PMC\d+\)?/g, "").replace(/\s{2,}/g, " ").replace(/[,(\s]+$/, "").trim();
  }
  function citations(str) {          // -> [{html, key}]
    const out = [];
    splitTop(str).forEach((x) => {
      // longest matches first; skip a match that sits inside one already taken
      const hits = [];
      SOURCE_LINKS.forEach((l) => {
        if (l.url && x.includes(l.match) && !hits.some((h) => h.match.includes(l.match))) hits.push(l);
      });
      if (hits.length) {
        hits.forEach((l) => out.push({ key: l.label || l.url,
          html: `<a href="${l.url}" target="_blank" rel="noopener">${esc(l.label || l.match)}</a>` }));
        return;
      }
      if (SRC_DROP.test(x)) return;
      const u = x.match(/https?:\/\/[^\s<>()"']+/);
      if (u) {
        const url = u[0].replace(/[.,;:]+$/, "");
        let text = cleanCite(x.replace(u[0], "").replace(/['"]/g, ""));
        if (!text) try { text = new URL(url).hostname.replace(/^www\./, ""); } catch (e) { text = url; }
        out.push({ key: url, html: `<a href="${url}" target="_blank" rel="noopener">${esc(text)}</a>` });
        return;
      }
      const text = cleanCite(x);
      if (text) out.push({ key: text, html: linkify(text) });
    });
    return out;
  }
  function sources(...srcs) {
    const seen = new Set(), items = [];
    srcs.filter(Boolean).forEach((s_) => citations(s_).forEach((c) => {
      if (!seen.has(c.key)) { seen.add(c.key); items.push(c.html); }
    }));
    return items.length
      ? `<div class="sources"><div class="lg-title">Sources</div><ul>${
          items.map((h) => `<li>${h}</li>`).join("")}</ul></div>` : "";
  }
  function note(text) { return text ? `<p class="note">${linkify(text)}</p>` : ""; }
  function pretty(s) { return (s || "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()); }

  function altRows(list) {
    const alts = (list || []).filter((a) => a.gt);
    // Kind label when the tier maps to one; otherwise the estimate's own short description.
    const kind = (t) => {
      const l = tierInfo(t).label;
      if (l !== "Estimate" && l !== "Not assessed") return l;
      const d = (t || "").split(/[;(]/)[0].trim();
      return d ? d.charAt(0).toUpperCase() + d.slice(1) : "Estimate";
    };
    return alts.length ? `<div class="lg-title">Other estimates</div>${alts.map((a) =>
      `<div class="row"><span>${a.label || kind(a.tier)} <small>(${citations(a.source).map((c) => c.html).join("; ") || "source not stated"})</small></span>` +
      `<span class="v">${a.gt_label || fmtGt(a.gt) + " Gt"}</span></div>`).join("")}` : "";
  }

  function showCountry(p) {
    const c = A.countries.find((x) => x.iso3 === p.iso3) || {};
    openDetail(p.name, `
      <div><span class="cap-big">${p.cap_pref_gt != null ? fmtGt(p.cap_pref_gt) + " Gt CO₂" : "No capacity estimate"}</span>${tierChip(p.tier)}</div>
      <dl>${c.key_basins && c.key_basins.length ? `<dt>Key basins</dt><dd>${c.key_basins.join(", ")}</dd>` : ""}
      ${c.onshore_offshore_notes ? `<dt>Setting</dt><dd>${c.onshore_offshore_notes}</dd>` : ""}</dl>
      ${note(c.notes)}
      ${altRows(c.alt_estimates)}
      ${sources(p.src)}`);
  }

  function formationRows(p) {
    if (!p.formations || !p.formations.length) return "";
    const gt = (mt) => mt != null ? `${fmtGt(mt / 1000)} Gt` : "not quantified";
    const depth = (v) => v.depth_ft ? `~${(v.depth_ft * 0.3048 / 1000).toFixed(1)} km deep` : "";
    // Formations USGS split at 13,000 ft get one sub-row per interval, shallowest first.
    const row = (f) => {
      if (f.variants.length < 2) {
        const d = depth(f.variants[0] || {});
        return `<div class="frm"><div class="row"><span>${f.formation}</span><span class="v">${gt(f.tasr_mean_mt)}</span>` +
               `${d ? `<small>${d}</small>` : ""}</div></div>`;
      }
      const subs = f.variants.slice().sort((a, b) => (a.depth_ft || 0) - (b.depth_ft || 0))
        .map((v) => `<div class="row sub"><span>${depth(v) || "depth not reported"}` +
          `${v.variant === "Deep" ? " (deep interval)" : ""}</span><span class="v">${gt(v.tasr_mean_mt)}</span></div>`)
        .join("");
      return `<div class="frm"><div class="row"><span>${f.formation}</span><span class="v">${gt(f.tasr_mean_mt)}</span></div>${subs}</div>`;
    };
    const first = p.formations.slice(0, 5).map(row).join("");
    const rest = p.formations.slice(5).map(row).join("");
    return `<div class="lg-title">Storage formations <small>(USGS 2013, technically accessible)</small></div>
      ${first}${rest ? more(`Show all ${p.formations.length} formations`, rest) : ""}
      <div class="src">Mean estimates at typical depth. A "deep interval" is the part of a formation
      below 13,000 ft (~4 km), which USGS assessed separately.</div>`;
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
    if (p.unit) {  // standalone CO2StoP unit(s): known storage formation, no capacity number
      const n = (p.units || []).length;
      openDetail(p.basin, `
        <div><span class="cap-big">No capacity estimate</span>${tierChip("unassessed",
          "Known storage formation; no basin-level capacity estimate covers this area.")}</div>
        <dl>${p.countries && p.countries.length ? `<dt>Countries</dt><dd>${countryNames(p.countries)}</dd>` : ""}</dl>
        <p class="note">Outline from the EU CO2StoP database of assessed storage
        ${n > 1 ? `formations (${n} units stacked at different depths here)` : "formations"}. No
        basin-level capacity estimate covers this area; see the country view for national figures.</p>
        ${unitRows(p)}
        <div class="sources"><div class="lg-title">Sources</div><ul>
          <li><a href="https://doi.org/10.5281/zenodo.15837736" target="_blank" rel="noopener">EU CO2StoP storage database (JRC, open data)</a></li>
          <li><a href="https://data.geus.dk/pure-pdf/30624_GEUS-R_2014_56_opt.pdf" target="_blank" rel="noopener">CO2StoP final report (GEUS 2014)</a></li></ul></div>`);
      return;
    }
    const capLine = p.cap_mid_gt != null
      ? `<span class="cap-big">${fmtGt(p.cap_mid_gt)} Gt CO₂</span>${tierChip(p.tier)}`
      : `<span class="cap-big">No capacity estimate</span>${tierChip(p.tier)}`;
    const hasRange = p.cap_low_gt != null && p.cap_high_gt != null && p.cap_low_gt !== p.cap_high_gt;
    const range = !hasRange ? "" : p.usgs_code
      ? `<div class="src">USGS basin total; likely range ${fmtGt(p.cap_low_gt)}–${fmtGt(p.cap_high_gt)} Gt (5th–95th percentile).</div>`
      : `<div class="src">Range across sources and methods: ${fmtGt(p.cap_low_gt)}–${fmtGt(p.cap_high_gt)} Gt.</div>`;
    openDetail(p.basin, `
      <div>${capLine}</div>
      ${range}
      <dl>${p.countries ? `<dt>Countries</dt><dd>${countryNames(p.countries)}</dd>` : ""}</dl>
      ${note(p.notes)}
      ${formationRows(p)}
      ${unitRows(p)}
      ${altRows(p.alt_estimates)}
      ${sources(p.src)}`);
  }

  const ISM_EXTENT_NOTE = `<div class="src">Shaded area is where this reactive rock is mapped
    at the surface: an upper bound on where storage could be developed, not proven capacity.</div>`;

  function showFormation(p) {
    if (!p.matched) {
      openDetail(p.name, `
        <div><span class="cap-big">Not assessed</span></div>
        <p>Mapped ophiolite / ultramafic rock body. Suitable in principle for in-situ
        mineralization, but its thickness, depth and storage capacity have not been
        characterized.</p>
        ${ISM_EXTENT_NOTE}
        ${sources(p.src)}`);
      return;
    }
    const capLine = p.cap_low_gt != null || p.cap_high_gt != null
      ? `<span class="cap-big">${fmtGt(p.cap_low_gt)}–${fmtGt(p.cap_high_gt)} Gt CO₂</span>${tierChip("theoretical", "Theoretical: based on the volume and chemistry of reactive rock, before any screening, so an upper bound.")}`
      : `<span class="cap-big">Capacity not quantified</span>`;
    openDetail(p.name, `
      <div>${capLine}</div>
      <dl><dt>Rock</dt><dd>${CAT[p.category]?.label || p.category}${p.rock &&
        !(CAT[p.category]?.label || "").toLowerCase().includes(p.rock.toLowerCase()) ? ` (${p.rock})` : ""}</dd>
      ${p.suitability ? `<dt>Suitability</dt><dd>${p.suitability}</dd>` : ""}
      ${p.activity ? `<dt>Activity</dt><dd>${p.activity}</dd>` : ""}
      ${p.depth ? `<dt>Depth</dt><dd>${p.depth}</dd>` : ""}</dl>
      ${p.cap_basis ? `<p class="note">${p.cap_basis}</p>` : ""}
      ${altRows(p.alt_estimates)}
      ${ISM_EXTENT_NOTE}
      ${sources(p.src)}`);
  }

  function showProject(p) {
    const mech = p.mechanism === "mineralization" ? "Mineralization (reactive rock)" : "Sedimentary storage (CO₂ injection)";
    openDetail(p.name, `
      <div><span class="cap-big">${p.capacity_mtpa != null ? p.capacity_mtpa + " Mt/yr" : pretty(p.status)}</span>
        <span class="tier-badge">${pretty(p.status)}</span></div>
      ${p.capacity_mtpa != null ? `<div class="src">${p.status === "operational" ? "Injection rate" : "Planned injection rate"}, million tonnes CO₂ per year.</div>` : ""}
      <dl><dt>Type</dt><dd>${mech}: ${STORAGE_LABEL[p.storage_type] || pretty(p.storage_type)}</dd>
      <dt>Operator</dt><dd>${p.operator || "–"}</dd>
      ${p.start_year ? `<dt>${/^(planned|in_permitting|construction|approved)$/.test(p.status) ? "Planned start" : "Started"}</dt><dd>${p.start_year}</dd>` : ""}
      ${p.cumulative_stored_mt ? `<dt>Stored to date</dt><dd>${p.cumulative_stored_mt} Mt</dd>` : ""}
      <dt>Setting</dt><dd>${pretty(p.onshore_offshore) || "–"}</dd></dl>
      ${note(p.notes)}
      ${p.url ? `<div><a href="${p.url}" target="_blank" rel="noopener">Project page ↗</a></div>` : ""}
      ${sources(p.source)}`);
  }

  // Test hook: open any panel by name when the page URL contains ?debug.
  if (/[?&]debug\b/.test(location.search)) {
    const props = (fc) => (fc?.features || []).map((f) => f.properties);
    window.__atlas = {
      basin: (n) => showBasin(props(window.GEO_BASINS).find((p) => p.basin === n)),
      country: (iso) => showCountry(props(window.GEO_COUNTRIES).find((p) => p.iso3 === iso)),
      formation: (n) => showFormation([window.GEO_ISM_LIPS, window.GEO_ISM_OPH, window.GEO_ISM_FALLBACK]
        .flatMap(props).find((p) => p.name === n)),
      project: (n) => showProject(A.projects.find((p) => p.name === n)),
    };
  }

  // ---------- layer toggles ----------
  function on(id) { return document.getElementById(id).checked; }
  const injOn = () => on("ly-basins");
  const injMode = () => (document.querySelector('input[name="inj-mode"]:checked') || {}).value || "basins";
  function sync() {
    toggle(injLayer, injOn() && injMode() === "country");
    toggle(basinsLayer, injOn() && injMode() === "basins");
    document.getElementById("inj-mode").classList.toggle("disabled", !injOn());
    toggle(ismOther, on("ly-ism"));
    toggle(ismMatched, on("ly-ism"));
    toggle(projLayer, on("ly-projects"));
    legend();
  }
  function toggle(layer, want) {
    if (want && !map.hasLayer(layer)) layer.addTo(map);
    if (!want && map.hasLayer(layer)) map.removeLayer(layer);
  }
  ["ly-basins", "ly-ism", "ly-projects"]
    .forEach((id) => document.getElementById(id).addEventListener("change", sync));
  document.querySelectorAll('input[name="inj-mode"]').forEach((r) => r.addEventListener("change", sync));
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
  // Counts are computed from the bundled data so the text cannot drift from the map.
  const BF = (window.GEO_BASINS?.features || []).map((f) => f.properties);
  // Some basins are drawn as several features (e.g. Sureste); count each basin once.
  const basinsAll = [...new Map(BF.filter((p) => !p.unit).map((p) => [p.basin, p])).values()];
  const nBasinCap = basinsAll.filter((p) => p.cap_mid_gt != null).length;
  const nUsgs = basinsAll.filter((p) => p.usgs_code).length;
  const nUsgsNq = basinsAll.filter((p) => p.usgs_code && p.cap_mid_gt == null).length;
  const nEuRecon = BF.filter((p) => p._layer === "co2stop_reconstructed").length;
  const nCountryCat = A.countries.filter((c) => tierInfo(c.tier).label === "Catalogued").length;
  const nBasinCat = basinsAll.filter((p) => tierInfo(p.tier).label === "Catalogued").length;
  const ln = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
  document.getElementById("method-body").innerHTML = `
    <h3>What this map shows</h3>
    <p>An inventory of global CO₂ storage opportunities across two mechanisms.
    <b>Sedimentary basin storage</b>: supercritical CO₂ injected into porous sedimentary reservoirs (deep
    saline aquifers, depleted oil &amp; gas fields), trapped by caprock and mineralizing over
    ~1,000s of years. <b>In-situ mineralization (ISM)</b>: CO₂ injected into reactive
    mafic/ultramafic rock (basalt, peridotite, serpentinite), converting to solid carbonate within
    months to years. Enhanced oil recovery and Enhanced Coal Bed Methane storage are excluded. The
    ideal storage site depends on transport distance and cost from the CO₂ source, permitting and
    development time, and cost per ton stored.</p>

    <h3>Kinds of capacity estimates: read before comparing numbers</h3>
    <p>Every capacity number carries a label for the kind of estimate behind it:</p>
    <ul class="method-list">
      <li><b>Theoretical</b>: The full pore volume of a reservoir, or the full volume and
      chemistry of reactive rock, before any screening. It is an upper bound, illustrated with
      dashed outlines on the map.</li>
      <li><b>Effective</b>: Screened for depth, injectivity and reservoir quality, but not yet
      for access or economics. Includes the USGS "technically accessible" estimates.</li>
      <li><b>Practical</b>: Effective capacity reduced to reflect regulatory, land access, and
      economic constraints.</li>
      <li><b>Catalogued</b>: Identified sites at every stage of maturity, most of them not yet well
      characterized. Totals come from the ${ln("https://www.ogci.com/ccus/co2-storage-catalogue/", "OGCI CO₂ Storage Resource Catalogue")},
      which classifies sites with the SPE Storage Resources Management System and adds up every
      maturity class, from sites already storing CO₂ to formations not yet explored. Globally,
      13,579 of its 14,256 Gt (95%) is in the least mature, undiscovered class
      (${ln("https://www.ogci.com/wp-content/uploads/2025/11/CSRC_Cycle_5_Main-Report_August_2025.pdf", "Cycle 5 report, 2025")}).
      This is the most common kind here: ${nCountryCat} of ${A.countries.length} countries and
      ${nBasinCat} basins.</li>
    </ul>
    <p>Mapped basins with no capacity number are labeled <b>Not assessed</b>. Different kinds of
    estimate are never added together.</p>

    <h3>Context on headline capacities</h3>
    <ul class="method-list">
      <li><b>Sedimentary</b>: 1,290 Gt is the low end of the risk-screened "prudent planetary
      limit" of ${ln("https://doi.org/10.1038/s41586-025-09423-y", "Gidden et al. 2025")} (central
      ~1,460 Gt, range 1,290–2,710 Gt); ~14,300 Gt is the OGCI catalogue total; and ~55,000 Gt is
      the top of the 8,000–55,000 Gt global range that
      ${ln("https://doi.org/10.1016/j.egypro.2017.03.1603", "Kearns et al. 2017")} call "practically
      accessible" storage capacity.</li>
      <li><b>Mineralization</b>: The theoretical ceiling is ~10⁶ Gt
      (${ln("https://doi.org/10.17226/25259", "NASEM 2019")};
      ${ln("https://doi.org/10.1038/s43017-019-0011-8", "Snæbjörnsdóttir et al. 2020")}). In RMI's
      optimistic scenario, in-situ mineralization stores up to ~1.2 Gt CO₂/yr by 2050
      (${ln("https://rmi.org/insight/the-applied-innovation-roadmap-for-cdr", "RMI 2023")}).</li>
    </ul>

    <h3>Sedimentary basin layer</h3>
    <p>Of the ${basinsAll.length} mapped basins, ${nBasinCap} have a capacity number. Outlines come
    from national surveys where they exist (USGS for the US, Geoscience Australia, ANP Brazil,
    USGS for China) and otherwise from the USGS World Petroleum Resources provinces. Each basin's
    number is its own published assessment.</p>
    <p><b>United States.</b> All ${nUsgs} US basins use one consistent source, the
    ${ln("https://pubs.usgs.gov/circ/1386/", "USGS 2013 National Assessment")}: the number is USGS's
    basin total of technically accessible storage, with its 5th–95th percentile range
    (${ln("https://pubs.usgs.gov/ds/774/", "Data Series 774")}, Table 1). Other published estimates,
    such as Teletzke et al. 2018's practical figures, appear under "Other estimates". USGS
    assessed ${nUsgsNq} basins without estimating capacity; they show as not assessed. Panels list
    each assessed formation with its mean estimate and most likely depth. USGS assessed
    each formation between 3,000 and 13,000 ft (~0.9–4 km); where rock below 13,000 ft looked
    favorable, it assessed that part separately, shown as a "deep interval"
    (${ln("https://pubs.usgs.gov/of/2010/1127/", "Brennan et al. 2010")}).</p>
    <p><b>Europe.</b> ${nEuRecon} European basins with no open outline are drawn from the extent of
    the EU CO2StoP storage formations assigned to them, so the outline shows assessed extent,
    not a structural boundary. CO2StoP storage units outside any mapped basin are drawn like
    other basins without a capacity number (dashed;
    ${ln("https://doi.org/10.5281/zenodo.15837736", "CO2StoP data")};
    ${ln("https://data.geus.dk/pure-pdf/30624_GEUS-R_2014_56_opt.pdf", "final report")}).</p>
    <p>The per-country view colors each of ${A.countries.length} countries by its most defensible
    national estimate; click a country for the alternatives.</p>

    <h3>Mineralization layer</h3>
    <p>${A.formations.length} reactive-rock formations have literature capacity estimates and are
    drawn from large igneous province outlines
    (${ln("https://doi.org/10.1016/j.palaeo.2017.03.014", "Ernst &amp; Youbi 2017")}) and the
    UTIG PLATES global ophiolite compilation, with circles where no outline exists (rift and arc
    volcanics, offshore basalt). Another ${(window.GEO_ISM_OPH?.features || [])
      .filter((f) => !f.properties.matched).length.toLocaleString("en-US")} mapped ophiolite
    bodies are shown as uncharacterized.</p>
    <p><b>Why no depth screen.</b> Mineralization polygons show the mapped surface extent of
    reactive rock, which is an upper bound rather than a screened storage resource. While the
    depth of the reactive rock is a determining factor in the practical storage capacity of a
    given formation, no global thickness or depth dataset exists for basalt and ophiolite
    bodies, so no depth screen is applied. Detail panels carry per-formation depth and thickness
    notes where literature exists.</p>
    <p>For context, conventional injection storage occurs at depths greater than about 800 m
    (${ln("https://www.ipcc.ch/report/carbon-dioxide-capture-and-storage/", "IPCC 2005")}: below
    ~800 m CO₂ remains supercritical), and supercritical basalt storage occurs at similar depths
    (the Wallula pilot injected at 828–887 m; NASEM 2019). However, dissolved-phase injection
    (Carbfix, Hellisheiði) operates at ~500 m, trading depth for substantial water demand, and
    engineered peridotite mineralization targets injections at ~3,000 m
    (${ln("https://doi.org/10.1073/pnas.0805794105", "Kelemen &amp; Matter 2008")}).</p>

    <h3>Storage sites</h3>
    <p>${A.projects.length} storage projects
    (${A.projects.filter((p) => p.mechanism === "geologic").length} sedimentary,
    ${A.projects.filter((p) => p.mechanism === "mineralization").length} mineralization) with
    mid-2026 statuses are shown, compiled from the
    ${ln("https://www.globalccsinstitute.com/co2re/", "Global CCS Institute CO2RE database")},
    the ${ln("https://www.iea.org/data-and-statistics/data-product/ccus-projects-database", "IEA CCUS Projects Database")},
    the ${ln("https://www.epa.gov/uic/current-class-vi-projects-under-review-epa", "EPA Class VI tracker")},
    operator disclosures, and press. The site panel links to a project page if available.</p>

    <h3>Sources</h3>
    <p class="method-src"><b>Sedimentary capacity:</b>
    ${ln("https://www.ogci.com/ccus/co2-storage-catalogue/", "OGCI CO₂ Storage Resource Catalogue, Cycles 4–5")};
    ${ln("https://pubs.usgs.gov/circ/1386/", "USGS 2013 National Assessment")} and
    ${ln("https://pubs.usgs.gov/ds/774/", "DS 774")};
    ${ln("https://edx.netl.doe.gov/dataset/netl-carbon-storage-atlas-fifth-edition/resource/4f44abdf-0976-4251-8838-457c60e638ba", "NETL Carbon Storage Atlas V")};
    ${ln("https://doi.org/10.1038/s41586-025-09423-y", "Gidden et al. 2025")};
    ${ln("https://doi.org/10.1016/j.egypro.2017.03.1603", "Kearns et al. 2017")};
    ${ln("https://doi.org/10.2139/ssrn.3366176", "Teletzke et al. 2018")};
    ${ln("https://cordis.europa.eu/project/id/518318/reporting", "EU GeoCapacity")};
    ${ln("https://data.geus.dk/pure-pdf/30624_GEUS-R_2014_56_opt.pdf", "EU CO2StoP")};
    national atlases (${ln("https://www.sodir.no/en/whats-new/publications/co2-atlases/", "Norway")},
    ${ln("https://www.co2stored.co.uk/home/about", "UK CO2Stored")},
    ${ln("https://www.ga.gov.au/scientific-topics/energy/resources/carbon-capture-and-storage-ccs/geological-storage-studies", "Geoscience Australia")});
    and academic national assessments, cited and linked in each basin and country panel.</p>
    <p class="method-src"><b>Mineralization:</b>
    ${ln("https://doi.org/10.1038/s43017-019-0011-8", "Snæbjörnsdóttir et al. 2020")};
    ${ln("https://doi.org/10.1073/pnas.0805794105", "Kelemen &amp; Matter 2008")};
    ${ln("https://doi.org/10.3389/fclim.2019.00009", "Kelemen et al. 2019")};
    McGrail et al. ${ln("https://doi.org/10.1029/2005JB004169", "2006")} and
    ${ln("https://doi.org/10.1021/acs.estlett.6b00387", "2017")} (Wallula);
    Goldberg et al. ${ln("https://doi.org/10.1073/pnas.0804397105", "2008")} and
    ${ln("https://doi.org/10.1073/pnas.0913721107", "2010")};
    ${ln("https://doi.org/10.17226/25259", "NASEM 2019")};
    ${ln("https://doi.org/10.1016/j.ijggc.2024.104206", "Cao et al. 2024")} (PNNL, Columbia River);
    ${ln("https://rmi.org/insight/the-applied-innovation-roadmap-for-cdr", "RMI 2023")}.</p>
    <p class="method-src"><b>Map geometry:</b>
    ${ln("https://www.naturalearthdata.com/", "Natural Earth")} (countries);
    ${ln("https://doi.org/10.5066/P94Z7QC2", "USGS World Petroleum Resources provinces")};
    ${ln("https://pubs.usgs.gov/of/2012/1111/", "Coleman &amp; Cahan 2012")} (US basins);
    USGS 2013 storage assessment units;
    ${ln("https://amsis-geoscience-au.hub.arcgis.com/maps/geoscience-au::australian-geological-provinces-1/about", "Geoscience Australia Geological Provinces")} (CC-BY 4.0);
    ${ln("https://www.gov.br/anp/pt-br/assuntos/exploracao-e-producao-de-oleo-e-gas/estudos-geologicos-e-geofisicos/classificacao-de-modelos-exploratorios-das-bacias-sedimentares", "ANP Brazil")};
    ${ln("https://geo-nsdi.er.usgs.gov/metadata/open-file/00-47/sed_basins.html", "USGS OFR 00-047")} (China);
    ${ln("https://doi.org/10.5281/zenodo.15837736", "EU CO2StoP")};
    ${ln("https://doi.org/10.1016/j.palaeo.2017.03.014", "Ernst &amp; Youbi LIP outlines")};
    ${ln("http://www-udc.ig.utexas.edu/external/plates/data/ophiolites.zip", "UTIG PLATES ophiolites")}.</p>`;

  tidyText(document.getElementById("method-body"));
  legend();

  // ---------- first-visit tour ----------
  // Step copy pulls the same computed values as the stat tiles; the 55,000 Gt
  // upper end matches the geoTip / methodology text (Kearns et al. 2017).
  const TOUR = [
    { el: "#stats", title: "Start with the headline numbers", html:
      `Almost all CO₂ storage operating today is in <b>sedimentary basins</b>: <b>${G.operational_mtpa} Mt/yr</b> ` +
      `across ${nOpGeo} sites, versus <b>${M.operational_mtpa} Mt/yr</b> at ${nOpIsm} ` +
      `<b>mineralization</b> sites. But the theoretical potential of mineralization in reactive ` +
      `rock (~${fmtBig(M.theoretical_gt)} Gt) is about ${ismRatio}× the upper end of global estimates ` +
      `for sedimentary storage (~${fmtBig(INJ_UPPER_GT)} Gt), and reactive rock reaches many ` +
      `regions with no good sedimentary option. Carbon removal at scale needs both.` },
    { el: "#map", title: "Look at the map’s colors to identify storage types", html:
      `<b>Blues</b> are sedimentary basins suited to CO₂ injection; darker means more ` +
      `assessed capacity, dashed means unquantified. <b>Warm colors and purple</b> are ` +
      `reactive rock (basalts, ophiolites) suited to mineralization.` },
    { el: "#map", title: "Explore the data", html:
      `Hover over any region for its name and capacity. Click a basin, formation, or storage ` +
      `site for detail on capacity estimates and sources.` },
    { el: "#layers", title: "Toggle layers to switch between storage sites and types", html:
      `Toggle <b>storage sites</b> to see operating and proposed projects, and switch the ` +
      `sedimentary basin layer between per-basin and per-country views. Basins and formations ` +
      `may have different kinds of capacity estimate that answer different questions: ` +
      `theoretical, effective, practical, and catalogued resource totals. See the ⓘ icons and ` +
      `Methodology for more detail.` },
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
  document.getElementById("btn-tour-top").onclick = () => tourShow(0);
  let tourSeen = true;
  try { tourSeen = !!localStorage.getItem("atlas_tour_seen"); } catch (e) {}
  if (!tourSeen) setTimeout(() => tourShow(0), 400);
})();
