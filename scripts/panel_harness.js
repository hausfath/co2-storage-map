// Render every detail-panel type headlessly (stubbed Leaflet/DOM) for review.
// Usage: node scripts/panel_harness.js <repo root> <out.html>
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2], OUT = process.argv[3];
global.window = global;
const clickHandlers = [];  // {props, fire}
function mkEl(id) {
  const el = { id, innerHTML: '', textContent: '', hidden: false, checked: false, style: {},
    children: [], listeners: {},
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
    querySelector() { return mkEl('q'); }, appendChild(c) { this.children.push(c); },
    scrollIntoView() {}, getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 50, right: 100 }; },
    focus() {}, click() {}, set onclick(f) { this._onclick = f; }, get onclick() { return this._onclick; },
    contains() { return false; }, get open() { return false; }, set open(v) {} };
  return el;
}
const els = {};
['ly-basins', 'ly-ism'].forEach((id) => { els[id] = mkEl(id); els[id].checked = true; });
global.document = {
  documentElement: {},
  getElementById(id) { return els[id] || (els[id] = mkEl(id)); },
  querySelector(sel) { return mkEl(sel); },
  createElement(t) { return mkEl(t); },
  body: mkEl('body'),
  addEventListener() {},
};
global.getComputedStyle = () => ({ getPropertyValue: () => '#123456' });
global.localStorage = { getItem: () => '1', setItem() {} };
global.innerWidth = 1200; global.innerHeight = 800;
global.addEventListener = () => {}; global.setTimeout = () => {};
function layerStub(props) {
  const l = { props, bindTooltip() { return l; }, on(t, f) { if (t === 'click') clickHandlers.push({ props, fire: () => f({}) }); return l; }, addTo() { return l; } };
  return l;
}
const mapStub = { setView() { return mapStub; }, attributionControl: { addAttribution() {} }, hasLayer: () => false, addLayer() {}, removeLayer() {} };
global.L = {
  map: () => mapStub, canvas: () => ({}),
  geoJSON(data, opts = {}) { (data.features || []).forEach((f) => { if (opts.filter && !opts.filter(f)) return; if (opts.onEachFeature) opts.onEachFeature(f, layerStub(f.properties)); }); return { addTo() {}, }; },
  layerGroup: () => ({ addLayer() {}, addTo() {} }),
  circleMarker: (ll, o) => { const l = layerStub({ _marker: true }); return l; },
  DomEvent: { stop() {} },
};
for (const f of ['src/data_bundle.js', 'data/geo/geometry_injection.js', 'data/geo/geometry_basins.js', 'data/geo/geometry_ism.js'])
  eval(fs.readFileSync(path.join(ROOT, f), 'utf8'));
// projects use circleMarker with closures; capture via a wrapper: patch L.circleMarker to record project from tooltip? Simpler: expose by monkeypatching bindTooltip to parse nothing; instead we call showProject indirectly by re-binding handlers list order = projects order.
const projOrder = [];
L.circleMarker = () => { const l = layerStub({ _marker: true }); projOrder.push(l); return l; };
eval(fs.readFileSync(path.join(ROOT, 'src/app.js'), 'utf8'));
const T = () => document.getElementById('detail-title'), B = () => document.getElementById('detail-body');
function fireFor(pred) { const h = clickHandlers.find((c) => pred(c.props)); if (!h) return null; h.fire(); return { title: T().textContent, html: B().innerHTML }; }
const proj = (name) => { const i = ATLAS.projects.findIndex((p) => p.name.includes(name)); const h = clickHandlers.filter((c) => c.props._marker)[i]; h.fire(); return { title: T().textContent, html: B().innerHTML }; };
const panels = [
  ['Basin — Gulf Coast (US, SAU formations)', fireFor((p) => p.basin === 'Gulf Coast Basin')],
  ['Basin — Pannonian (EU reconstructed)', fireFor((p) => p.basin === 'Pannonian Basin')],
  ['Basin — Niger Delta', fireFor((p) => p.basin === 'Niger Delta Basin')],
  ['Standalone units — merged stack', fireFor((p) => p.unit && (p.units || []).length > 1)],
  ['ISM — Deccan Traps', fireFor((p) => (p.name || '').includes('Deccan'))],
  ['ISM — unmatched ophiolite', fireFor((p) => p.matched === false)],
  ['Project — Blue Flint', proj('Blue Flint')],
  ['Project — Northern Lights', proj('Northern Lights')],
  ['Project — CarbonTerraVault', proj('CarbonTerraVault')],
  ['Country — Nigeria', fireFor((p) => p.iso3 === 'NGA')],
];
const css = fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf8');
let html = `<!doctype html><meta charset="utf-8"><title>panel preview</title><style>${css}
body{background:var(--ocean);padding:16px;display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start}
.card{position:static!important;width:320px}</style>`;
for (const [label, r] of panels) {
  if (!r) { html += `<div class="card" id="detail"><b>${label}: NOT FOUND</b></div>`; continue; }
  html += `<aside id="detail" class="card"><div class="detail-head"><h2>${r.title}</h2></div><div class="src" style="margin:-4px 0 6px">${label}</div><div id="detail-body">${r.html}</div></aside>`;
  console.log(`\n=== ${label} | ${r.title} ===\n` + r.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 700));
}
fs.writeFileSync(OUT, html);
console.log('\nwrote', OUT);
