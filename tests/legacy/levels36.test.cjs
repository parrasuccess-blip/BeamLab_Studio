const test = require('node:test');
const assert = require('node:assert/strict');
const levels = require('../../src/studio/levels.js');

const study = {
  items: [
    { id: 's1', kind: 'pin', x: 0 },
    { id: 's2', kind: 'roller', x: 6 },
    { id: 'p1', kind: 'point', x: 3, value: 20 },
    { id: 'h1', kind: 'hinge', x: 4 },
    { id: 'm1', kind: 'moment', x: 2, value: 10 },
  ],
  cases: [{ id: 'dead', enabled: true, factor: 1 }, { id: 'live', enabled: true, factor: 1.5 }],
  selfWeight: true,
  section: { catalogue: '310UB40.4' },
};

test('1st Year keeps the beam workspace fundamental', () => {
  assert.deepEqual(levels.allowedTabs('year1'), ['build', 'learn']);
  for (const k of ['pin', 'roller', 'fixed', 'point', 'udl']) assert.equal(levels.canUseTool('year1', k), true, k);
  for (const k of ['hinge', 'moment', 'variable']) assert.equal(levels.canUseTool('year1', k), false, k);
  assert.equal(levels.canUseFeature('year1', 'deformation'), false);
  assert.equal(levels.canUseFeature('year1', 'teaching'), true);
});

test('2nd Year exposes mechanics-of-materials and structural behaviour tools', () => {
  assert.equal(levels.canUseTool('year2', 'hinge'), true);
  for (const k of ['deformation', 'stress', 'shear', 'teaching']) assert.equal(levels.canUseFeature('year2', k), true, k);
  assert.equal(levels.canUseFeature('year2', 'cases'), false);
  assert.equal(levels.canUseFeature('year2', 'moving'), false);
});

test('3rd+ exposes analysis context but All Tools remains the superset', () => {
  for (const k of ['cases', 'catalogue', 'selfweight', 'moving', 'review']) assert.equal(levels.canUseFeature('year3', k), true, k);
  for (const id of levels.modeOrder) assert.ok(levels.mode(id).title);
  assert.ok(levels.mode('all').features.length >= levels.mode('year3').features.length);
});

test('lowering the UI level identifies advanced study state without mutating it', () => {
  const before = JSON.stringify(study);
  const restricted = levels.restrictedStudyFeatures('year1', study, { deformation: true, stress: true, moving: true });
  assert.ok(restricted.includes('2 advanced objects'));
  assert.ok(restricted.includes('load cases/factors'));
  assert.ok(restricted.includes('self-weight'));
  assert.ok(restricted.includes('catalogue section'));
  assert.equal(JSON.stringify(study), before);
});

test('recommended examples and unlock summaries progress with study depth', () => {
  assert.equal(levels.recommendedExample('year1'), 'reference');
  assert.equal(levels.recommendedExample('year2'), 'continuous');
  assert.equal(levels.recommendedExample('year3'), 'suspended');
  const u = levels.unlockSummary('year1', 'year2');
  assert.ok(u.tools.includes('hinge'));
  assert.ok(u.features.includes('deformation'));
});
