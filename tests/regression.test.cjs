'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'dist', 'index.html'), 'utf8');
const start = html.indexOf('const modules = {');
const stop = html.indexOf("load('studio/app');", start);
assert.ok(start >= 0 && stop > start, 'production module registry exists');
const ctx = vm.createContext({ TextEncoder, TextDecoder, setTimeout, clearTimeout, setInterval, clearInterval, AbortController, console, Date });
new vm.Script(html.slice(start, stop) + ';globalThis.productionLoad=load;').runInContext(ctx);
const load = ctx.productionLoad;
const { example, makeItem } = load('model/examples');
const { normalise, solveStudy } = load('model/study');
const { benchmarks } = load('studio/verification');

const near = (a,b,t=1e-8) => assert.ok(Math.abs(a-b) <= t * (1 + Math.abs(b)), `${a} != ${b}`);
function centreLoad() {
  const m = normalise(example('simple'));
  m.length = 6;
  m.items = m.items.filter(i => i.kind === 'pin' || i.kind === 'roller');
  m.items[1].x = 6;
  m.items.push({ ...makeItem('point', 3, undefined, 20), caseId: 'base' });
  return m;
}

test('centre-loaded reference remains exact', () => {
  const r = solveStudy(centreLoad());
  near(r.reactions[0].force, 10);
  near(r.reactions[1].force, 10);
  near(r.peakM.M, 30);
});

test('10 m 5 kN/m UDL remains exact', () => {
  const r = solveStudy(normalise(example('simple')));
  near(r.reactions[0].force, 25);
  near(r.reactions[1].force, 25);
  near(r.peakM.M, 62.5);
});

test('all built-in analytical benchmarks remain passing', () => {
  const rows = benchmarks();
  assert.equal(rows.length, 21);
  for (const row of rows) assert.equal(row.pass, true, row.name);
});

test('migration preserves Design Studio and tutor hooks', () => {
  assert.match(html, /BeamLab Studio 4\.0 - Design Studio/);
  assert.match(html, /BEAMLAB 4\.0 \/ DESIGN STUDIO/);
  assert.match(html, /BeamLabTutorApi/);
  assert.match(html, /Screening review · not code approval/);
});
