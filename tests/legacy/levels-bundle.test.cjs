'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'dist', 'index.html'), 'utf8');
const start = html.indexOf('const modules = {');
const stop = html.indexOf("load('studio/app');", start);
assert.ok(start >= 0 && stop > start, 'Expected the production module bundle');
const context = vm.createContext({ TextEncoder, TextDecoder, console });
new vm.Script(html.slice(start, stop) + '; globalThis.productionLoad = load;').runInContext(context);
const load = context.productionLoad;
const levels = load('studio/levels');
const near = (a,b,t=1e-8) => assert.ok(Math.abs(a-b) <= t * (1 + Math.abs(b)), `${a} != ${b}`);
const { example } = load('model/examples');
const { normalise, solveStudy, clone } = load('model/study');
const { RELEASE, fingerprint } = load('studio/verification');

test('Production release and learning-level registry are current', () => {
  assert.equal(RELEASE, '4.1.4');
  assert.deepEqual(Array.from(levels.modeOrder), ['year1','year2','year3','all']);
  assert.ok(fingerprint(normalise(example('simple'))).startsWith('BL410-'));
});

test('First-year preset is a strict UI subset, not a separate solver', () => {
  assert.deepEqual(Array.from(levels.allowedTabs('year1')), ['build','learn']);
  for (const tool of ['pin','roller','fixed','point','udl']) assert.ok(levels.canUseTool('year1', tool));
  for (const tool of ['hinge','moment','variable']) assert.equal(levels.canUseTool('year1', tool), false);
  for (const feature of ['deformation','stress','shear','moving','cases']) assert.equal(levels.canUseFeature('year1', feature), false);
  const m = normalise(example('simple'));
  const a = solveStudy(m);
  near(a.reactions[0].force, 25);
  near(a.reactions[1].force, 25);
  near(a.peakM.M, 62.5);
});

test('Second-year and third-year presets unlock in syllabus-informed stages', () => {
  for (const feature of ['deformation','stress','shear']) assert.ok(levels.canUseFeature('year2', feature));
  assert.equal(levels.canUseFeature('year2','moving'), false);
  assert.equal(levels.canUseFeature('year2','cases'), false);
  for (const feature of ['deformation','stress','shear','moving','cases','catalogue','selfweight']) assert.ok(levels.canUseFeature('year3', feature));
  assert.deepEqual(Array.from(levels.allowedTabs('year3')), ['build','cases','section','layers','learn']);
});

test('Lowering the workspace level never mutates an advanced study', () => {
  const m = normalise(example('suspended'));
  const before = JSON.stringify(m);
  const beforeResult = solveStudy(m);
  const restricted = levels.restrictedStudyFeatures('year1', m, { deformation: true, stress: true });
  assert.ok(restricted.some(x => /advanced object/.test(x)));
  assert.ok(restricted.includes('deformation'));
  assert.ok(restricted.includes('stress'));
  assert.equal(JSON.stringify(m), before);
  const afterResult = solveStudy(clone(m));
  assert.equal(afterResult.peakM.M, beforeResult.peakM.M);
  assert.equal(afterResult.peakD.v, beforeResult.peakD.v);
});

test('Guided examples and unlock summaries progress monotonically', () => {
  assert.equal(levels.recommendedExample('year1'), 'reference');
  assert.equal(levels.recommendedExample('year2'), 'continuous');
  assert.equal(levels.recommendedExample('year3'), 'suspended');
  const y2 = levels.unlockSummary('year1','year2');
  assert.ok(y2.tools.includes('hinge'));
  assert.ok(y2.features.includes('deformation'));
  const y3 = levels.unlockSummary('year2','year3');
  assert.ok(y3.features.includes('moving'));
  assert.ok(y3.features.includes('cases'));
});
