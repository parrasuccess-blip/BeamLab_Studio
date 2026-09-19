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
const design = load('studio/design');
const designWorkflow = load('studio/design-workflow');

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


test('guided Design workflow defines five stable review stages', () => {
  assert.equal(designWorkflow.steps.length, 5);
  assert.deepEqual(Array.from(designWorkflow.steps, row => row.short), ['Demand','Criteria','Ratios','Missing','Finish']);
  assert.equal(designWorkflow.clampStep(0), 1);
  assert.equal(designWorkflow.clampStep(99), 5);
});

test('guided Design workflow is source-native and progressively disclosed', () => {
  assert.match(html, /GUIDED DESIGN REVIEW/);
  assert.match(html, /Review analysis demand/);
  assert.match(html, /Enter design criteria/);
  assert.match(html, /Review utilisation/);
  assert.match(html, /Check what is still missing/);
  assert.match(html, /Review and export/);
  assert.match(html, /design-step:/);
  assert.match(html, /name === 'design-step'/);
  assert.match(html, /design-next/);
  assert.match(html, /design-back/);
  assert.doesNotMatch(html, /READ THIS PAGE IN ORDER/);
});

test('guided Design workflow preserves deterministic entered-check ratios', () => {
  const m = centreLoad();
  const r = solveStudy(m);
  const review = design.evaluate(m, r, {
    momentCapacity: 60,
    shearCapacity: 20,
    deflectionMode: 'direct',
    deflectionLimitMm: 2
  });
  near(review.checks.find(row => row.id === 'moment').ratio, 0.5);
  near(review.checks.find(row => row.id === 'shear').ratio, 0.5);
  near(review.checks.find(row => row.id === 'deflection').ratio, 0.6428571428571422);
  assert.equal(review.governing.id, 'deflection');
});
