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
const { normalise, solveStudy, validateStudy, reviewLimits } = load('model/study');
const stiffness = load('model/stiffness');
const sectionRegions = load('model/section-regions');
const { sectionProperties } = load('model/sections');
const levels = load('studio/levels');
const verification = load('studio/verification');
const { benchmarks } = verification;
const design = load('studio/design');
const designWorkflow = load('studio/design-workflow');
const learningEvidence = load('studio/learning-evidence');
const learningPath = load('studio/learning-path');
const adaptivePractice = load('studio/adaptive-practice');
const sessionReview = load('studio/session-review');
const learningTrajectory = load('studio/learning-trajectory');
const topicDrilldown = load('studio/topic-drilldown');
const studyPlan = load('studio/study-plan');
const studyBlock = load('studio/study-block');
const studyBlockResume = load('studio/study-block-resume');

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

test('piecewise EI cantilever matches an independent exact tip-deflection integral', () => {
  const m = normalise(example('cantilever'));
  m.stiffnessRegions = [{id:'ei-left',label:'Stiff left half',x:0,end:5,factor:2}];
  validateStudy(m);
  const r = solveStudy(m);
  near(r.reactions[0].force, 50);
  near(r.reactions[0].moment, 500);
  near(r.sample(10).v * 1000, -133.92857142857144, 1e-7);
  assert.deepEqual(Array.from(r.elements, e => e.stiffnessFactor), [2,1]);
  assert.equal(r.hasVaryingEI, true);
});

test('piecewise EI changes compatibility reactions without breaking equilibrium', () => {
  const uniform = normalise(example('continuous'));
  const stepped = normalise(example('continuous'));
  stepped.stiffnessRegions = [{id:'ei-left',label:'Stiff left quarter',x:0,end:2.5,factor:2}];
  const a = solveStudy(uniform), b = solveStudy(stepped);
  assert.ok(Math.abs(b.reactions[1].force - a.reactions[1].force) > 1e-5);
  near(b.reactions.reduce((sum,row)=>sum+row.force,0), b.total, 1e-8);
  near(b.forceResidual, 0, 1e-8);
  near(b.momentResidual, 0, 1e-8);
});

test('piecewise EI validation rejects overlaps and invalid multipliers', () => {
  const overlap = normalise(example('simple'));
  overlap.stiffnessRegions = [
    {id:'a',label:'A',x:0,end:6,factor:1.5},
    {id:'b',label:'B',x:5,end:10,factor:.8}
  ];
  assert.throws(() => validateStudy(overlap), /cannot overlap/i);
  const invalid = normalise(example('simple'));
  invalid.stiffnessRegions = [{id:'bad',label:'Bad',x:0,end:5,factor:.01}];
  assert.throws(() => validateStudy(invalid), /between 0\.05 and 20/i);
});

test('legacy uniform studies remain uniform and preserve all analytical benchmarks', () => {
  const m = normalise(example('simple'));
  assert.deepEqual(Array.from(m.stiffnessRegions), []);
  assert.equal(stiffness.hasVaryingEI(m), false);
  const rows = benchmarks();
  assert.equal(rows.length, 21);
  assert.ok(rows.every(row => row.pass));
});

test('varying EI energy audit uses local element stiffness', () => {
  const m = normalise(example('cantilever'));
  m.stiffnessRegions = [{id:'ei-left',label:'Stiff left half',x:0,end:5,factor:2}];
  const a = solveStudy(m);
  const audit = verification.audit(m, a);
  const energy = audit.checks.find(row => row.name === 'Strain energy / external work');
  assert.ok(energy);
  assert.equal(energy.pass, true);
  assert.ok(Math.abs(energy.residual) <= energy.tolerance);
});

test('EI-only zones disable local stress inference instead of inventing section properties', () => {
  const m = normalise(example('cantilever'));
  m.stiffnessRegions = [{id:'ei-left',label:'Stiff left half',x:0,end:5,factor:2}];
  const a = solveStudy(m);
  const limits = reviewLimits(a, m);
  assert.equal(limits.stress, null);
  assert.equal(limits.stressUnavailable, true);
  const review = design.evaluate(m, a, {fyMPa:300,momentCapacity:600,shearCapacity:100,deflectionMode:'direct',deflectionLimitMm:200});
  assert.equal(review.demand.elasticStressMPa, null);
  assert.equal(review.elasticReference.momentKNm, null);
  assert.equal(review.elasticReference.unavailable, true);
  assert.ok(review.readiness.some(row => row.id === 'piecewise-section' && row.state === 'missing'));
  assert.equal(review.section.stiffnessZones.length, 1);
});

test('piecewise EI editing is progressive and source-native', () => {
  assert.equal(levels.canUseFeature('year1','varyingEI'), false);
  assert.equal(levels.canUseFeature('year2','varyingEI'), false);
  assert.equal(levels.canUseFeature('year3','varyingEI'), true);
  assert.equal(levels.canUseFeature('all','varyingEI'), true);
  assert.match(html, /QUICK EI OVERRIDES \/ STIFFNESS ONLY/);
  assert.match(html, /stiffness-add/);
  assert.match(html, /stiffness-save:/);
  assert.match(html, /stiffness-band/);
  assert.match(html, /Local stress layers paused/);
  assert.match(html, /Not inferred for EI-only zones/);
  assert.match(html, /stiffnessRegions \|\| \[\]\)\.forEach\(r => \{ r\.x \*= ratio; r\.end \*= ratio; \}\)/);
});

test('true stepped section cantilever matches the exact piecewise-EI tip deflection', () => {
  const m = normalise(example('cantilever'));
  const stiff = JSON.parse(JSON.stringify(m.section));
  stiff.I *= 2;
  m.sectionRegions = [{id:'section-root',label:'Stiffer root half',x:0,end:5,section:stiff}];
  validateStudy(m);
  const r = solveStudy(m);
  near(r.reactions[0].force, 50);
  near(r.reactions[0].moment, 500);
  near(r.sample(10).v * 1000, -133.92857142857144, 1e-7);
  assert.equal(r.hasSectionRegions, true);
  assert.equal(r.hasEIOnlyRegions, false);
  assert.deepEqual(Array.from(r.elements, e => e.sectionRegionId), ['section-root', null]);
  near(r.elements[0].properties.I, 2 * r.elements[1].properties.I);
});

test('true stepped sections restore exact local elastic stress and Design mechanics references', () => {
  const m = normalise(example('cantilever'));
  const stiff = JSON.parse(JSON.stringify(m.section));
  stiff.I *= 2;
  m.sectionRegions = [{id:'section-root',label:'Stiffer root half',x:0,end:5,section:stiff}];
  const r = solveStudy(m);
  const expectedRootStress = 500 * (stiff.h/2000) / (stiff.I*1e-12) / 1000;
  near(r.elasticStressEnvelope.stress, expectedRootStress, 1e-8);
  near(r.elasticStressEnvelope.x, 0);
  assert.equal(r.elasticStressEnvelope.regionLabel, 'Stiffer root half');
  const local = r.localSectionAt(2);
  assert.equal(local.regionId, 'section-root');
  near(local.properties.I, stiff.I*1e-12);
  const limits = reviewLimits(r, m);
  near(limits.stress, expectedRootStress, 1e-8);
  assert.equal(limits.stressUnavailable, false);
  assert.equal(limits.stressSection, 'Custom section');
  const review = design.evaluate(m, r, {fyMPa:300,momentCapacity:600,shearCapacity:100,deflectionMode:'direct',deflectionLimitMm:200});
  near(review.demand.elasticStressMPa, expectedRootStress, 1e-8);
  assert.equal(review.elasticReference.unavailable, false);
  near(review.elasticReference.ratio, 500 / 1050, 1e-8);
  assert.ok(review.readiness.some(row => row.id === 'stepped-section-profile' && row.state === 'ready'));
  assert.ok(review.readiness.some(row => row.id === 'stepped-capacity-applicability' && row.state === 'missing'));
});

test('true stepped-section self-weight uses each local area and satisfies analytical equilibrium', () => {
  const m = normalise(example('simple'));
  m.items = m.items.filter(i => i.kind === 'pin' || i.kind === 'roller');
  m.selfWeight = true;
  const heavy = JSON.parse(JSON.stringify(m.section));
  heavy.A *= 2;
  m.sectionRegions = [{id:'heavy-half',label:'Heavy right half',x:5,end:10,section:heavy}];
  const baseProps = sectionProperties(m.section), heavyProps = sectionProperties(heavy);
  const W1 = baseProps.weight * 5, W2 = heavyProps.weight * 5;
  const expectedRB = (W1*2.5 + W2*7.5) / 10;
  const expectedRA = W1 + W2 - expectedRB;
  const r = solveStudy(m);
  near(r.total, W1+W2, 1e-8);
  near(r.reactions[0].force, expectedRA, 1e-8);
  near(r.reactions[1].force, expectedRB, 1e-8);
  near(r.forceResidual, 0, 1e-8);
  near(r.momentResidual, 0, 1e-8);
});

test('true stepped-section validation rejects overlap and stale catalogue metadata', () => {
  const m = normalise(example('simple'));
  const s = JSON.parse(JSON.stringify(m.section));
  m.sectionRegions = [
    {id:'one',label:'One',x:0,end:6,section:s},
    {id:'two',label:'Two',x:5,end:10,section:s}
  ];
  assert.throws(() => validateStudy(m), /cannot overlap/i);
  const cat = normalise(example('simple'));
  const chosen = load('model/catalogue').fromCatalogue('310UB40.4');
  chosen.I *= 1.1;
  cat.sectionRegions = [{id:'bad-cat',label:'Tampered catalogue',x:0,end:5,section:chosen}];
  assert.throws(() => validateStudy(cat), /no longer matches its source/i);
});

test('EI-only overrides remain conservative even when true local sections exist', () => {
  const m = normalise(example('cantilever'));
  const stiff = JSON.parse(JSON.stringify(m.section));
  stiff.I *= 2;
  m.sectionRegions = [{id:'section-root',label:'Stiffer root half',x:0,end:5,section:stiff}];
  m.stiffnessRegions = [{id:'approx-tip',label:'Unknown tip stiffness',x:5,end:10,factor:.8}];
  const r = solveStudy(m);
  assert.equal(r.hasSectionRegions, true);
  assert.equal(r.hasEIOnlyRegions, true);
  assert.equal(r.elasticStressEnvelope, null);
  assert.equal(reviewLimits(r,m).stressUnavailable, true);
  const review = design.evaluate(m,r,{fyMPa:300});
  assert.equal(review.demand.elasticStressMPa, null);
  assert.equal(review.elasticReference.unavailable, true);
});

test('true stepped-section energy audit uses local section EI and remains consistent', () => {
  const m = normalise(example('cantilever'));
  const stiff = JSON.parse(JSON.stringify(m.section));
  stiff.I *= 2;
  m.sectionRegions = [{id:'section-root',label:'Stiffer root half',x:0,end:5,section:stiff}];
  const a = solveStudy(m);
  const audit = verification.audit(m,a);
  const energy = audit.checks.find(row => row.name === 'Strain energy / external work');
  assert.ok(energy);
  assert.equal(energy.pass, true);
  assert.ok(Math.abs(energy.residual) <= energy.tolerance);
  assert.match(audit.scope,/verified piecewise section properties/i);
});

test('true stepped sections are progressive, editable and represented throughout the built app', () => {
  assert.equal(levels.canUseFeature('year1','steppedSections'), false);
  assert.equal(levels.canUseFeature('year2','steppedSections'), false);
  assert.equal(levels.canUseFeature('year3','steppedSections'), true);
  assert.equal(levels.canUseFeature('all','steppedSections'), true);
  assert.match(html, /TRUE STEPPED SECTIONS \/ LOCAL PROPERTIES/);
  assert.match(html, /section-region-add/);
  assert.match(html, /section-region-save:/);
  assert.match(html, /section-region-band/);
  assert.match(html, /THROUGH THE LOCAL SECTION/);
  assert.match(html, /piecewise from local section area\/density/i);
  assert.match(html, /stepped-section-profile/);
  assert.match(html, /True stepped-section regions:/);
  assert.match(html, /sectionRegions \|\| \[\]\)\.forEach\(r => \{ r\.x \*= ratio; r\.end \*= ratio; \}\)/);
  assert.match(html, /48 structural objects is the limit/);
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


test('learning evidence is bounded and prioritises recent difficulty without declaring a misconception', () => {
  let events = [];
  const base = { event:'attempt', kind:'lesson', taskId:'l1-shear-moment', taskTitle:'Shear to moment', topic:'Shear → moment', expected:'Moment rises where shear is positive', mode:'practice' };
  events = learningEvidence.appendEvent(events, { ...base, correct:false, firstTry:true, tries:1, answer:'Moment falls where shear is positive', timestamp:1000 }, 1000);
  events = learningEvidence.appendEvent(events, { ...base, correct:false, firstTry:false, tries:2, answer:'Moment falls where shear is positive', timestamp:2000 }, 2000);
  events = learningEvidence.appendEvent(events, { event:'reveal', kind:'lesson', taskId:base.taskId, taskTitle:base.taskTitle, topic:base.topic, expected:base.expected, mode:'practice', timestamp:3000 }, 3000);
  const snap = learningEvidence.snapshot(events, {
    'Shear → moment': { attempts:2, correct:0, firstAttempts:1, firstCorrect:0, reveals:1, lastAt:3000 }
  }, { kind:'lesson', id:base.taskId, title:base.taskTitle, topic:base.topic });
  assert.equal(snap.priorityTopics[0].topic, 'Shear → moment');
  assert.equal(snap.repeatedWrongResponses.length, 1);
  assert.equal(snap.repeatedWrongResponses[0].count, 2);
  assert.match(snap.interpretationBoundary, /not proof of a misconception/i);
});

test('weak aggregate mastery alone does not invent a repeated wrong response', () => {
  const snap = learningEvidence.snapshot([], {
    'Reactions & equilibrium': { attempts:5, correct:1, firstAttempts:3, firstCorrect:0, reveals:2, lastAt:1000 }
  }, null);
  assert.equal(snap.repeatedWrongResponses.length, 0);
  assert.equal(snap.priorityTopics[0].topic, 'Reactions & equilibrium');
});

test('learning evidence stays bounded to the newest events', () => {
  let events = [];
  for (let i = 0; i < 40; i++) events = learningEvidence.appendEvent(events, {
    event:'attempt', kind:'challenge', taskId:'q'+i, taskTitle:'Question '+i, topic:'Topic', correct:i % 2 === 0, firstTry:true, tries:1, timestamp:i+1
  }, i+1);
  assert.equal(events.length, learningEvidence.MAX_EVENTS);
  assert.equal(events[0].taskId, 'q16');
  assert.equal(events.at(-1).taskId, 'q39');
});

test('production tutor wiring exposes the adaptive evidence provider', () => {
  assert.match(html, /BeamLabLearningEvidence/);
  assert.match(html, /learning-evidence/);
  assert.match(html, /repeatedWrongResponses/);
  assert.match(html, /adaptive context/);
});


test('recommended-next prioritises a recent unresolved difficulty', () => {
  const evidence = {
    recentEvents: [{event:'attempt',topic:'Shear → moment',correct:false,timestamp:20}],
    priorityTopics: [{topic:'Shear → moment',priority:6}]
  };
  const rec = learningPath.recommendNext('year1', evidence, {}, {});
  assert.equal(rec.topic, 'Shear → moment');
  assert.equal(rec.kind, 'lesson');
  assert.equal(rec.basis, 'recent-difficulty');
});

test('recommended-next advances after the latest relevant correction', () => {
  const evidence = {
    recentEvents: [
      {event:'attempt',topic:'Shear → moment',correct:false,timestamp:10},
      {event:'attempt',topic:'Shear → moment',correct:true,timestamp:20}
    ],
    priorityTopics: [{topic:'Shear → moment',priority:9}]
  };
  const rec = learningPath.recommendNext('year1', evidence, {'l1-shear-moment':true}, {});
  assert.notEqual(rec.topic, 'Shear → moment');
  assert.equal(rec.basis, 'advance-after-correction');
});

test('recommended-next becomes mixed practice when level tasks are complete', () => {
  const tasks = learningPath.buildTasks('year1');
  const lessons = Object.fromEntries(tasks.lessons.map(task => [task.id,true]));
  const challenges = Object.fromEntries(tasks.challenges.map(task => [task.id,true]));
  const rec = learningPath.recommendNext('year1', {}, lessons, challenges);
  assert.equal(rec.kind, 'session');
  assert.equal(rec.id, 'practice');
  assert.equal(rec.basis, 'level-complete');
});

test('Learn UI exposes one deterministic recommended-next card and reset clears its evidence', () => {
  assert.match(html, /RECOMMENDED NEXT/);
  assert.match(html, /recommended-next:/);
  assert.match(html, /learningRecommendation/);
  assert.match(html, /learning-evidence/);
  assert.match(html, /recent learning evidence reset/i);
});


test('adaptive practice starts with unresolved recent difficulty', () => {
  const evidence = {
    recentEvents: [{event:'attempt',kind:'lesson',taskId:'l1-shear-moment',topic:'Shear → moment',correct:false,timestamp:20}],
    priorityTopics: [{topic:'Shear → moment',priority:9}]
  };
  const plan = adaptivePractice.planPractice('year1', evidence, {}, {}, {}, {count:4});
  assert.equal(plan.length, 4);
  assert.equal(plan[0].topic, 'Shear → moment');
  assert.equal(plan[0].basis, 'repair');
  assert.match(plan[0].reason, /Repair:/);
});

test('adaptive practice moves on after the newest correction', () => {
  const evidence = {
    recentEvents: [
      {event:'attempt',kind:'lesson',taskId:'l1-shear-moment',topic:'Shear → moment',correct:false,timestamp:10},
      {event:'attempt',kind:'lesson',taskId:'l1-shear-moment',topic:'Shear → moment',correct:true,timestamp:20}
    ],
    priorityTopics: [{topic:'Shear → moment',priority:9}]
  };
  const plan = adaptivePractice.planPractice('year1', evidence, {'l1-shear-moment':true}, {}, {
    'Shear → moment': {attempts:2,correct:1,firstAttempts:1,firstCorrect:0,reveals:0}
  }, {count:4});
  assert.equal(plan.length, 4);
  assert.notEqual(plan[0].topic, 'Shear → moment');
});

test('adaptive practice never repeats answered tasks when replanning', () => {
  const evidence = {
    recentEvents: [{event:'skip',kind:'lesson',taskId:'l1-point-shear',topic:'Point loads & shear',timestamp:30}],
    priorityTopics: [{topic:'Point loads & shear',priority:6}]
  };
  const plan = adaptivePractice.planPractice('year1', evidence, {}, {}, {}, {
    count:3,
    excludeIds:['l1-point-shear','y1-reaction']
  });
  assert.equal(plan.length, 3);
  assert.equal(new Set(plan.map(row => row.id)).size, plan.length);
  assert.ok(!plan.some(row => ['l1-point-shear','y1-reaction'].includes(row.id)));
});

test('Exam Mode keeps the fixed mastery-based session planner', () => {
  const challenges = load('studio/challenges');
  const exam = challenges.sessionPlan('year1', {}, 'exam');
  assert.equal(exam.length, 6);
  assert.ok(exam.every(row => !('reason' in row)));
  assert.match(html, /sessionMode === 'practice'[\s\S]*planPractice/);
  assert.match(html, /sessionPlan\)\(v\.level, masteryStats, 'exam'\)/);
});

test('Learn UI explains that practice can replan only unanswered questions', () => {
  assert.match(html, /ADAPTIVE PRACTICE/);
  assert.match(html, /WHY THIS QUESTION/);
  assert.match(html, /only unanswered questions can change/i);
  assert.match(html, /planRevision/);
});


test('post-session review separates first-try, recovered and unresolved outcomes', () => {
  const summary = sessionReview.summarise([
    {topic:'Reactions & equilibrium',firstCorrect:true,correct:true,tries:1},
    {topic:'Shear → moment',firstCorrect:false,correct:true,tries:2},
    {topic:'Deflection & stiffness',firstCorrect:false,correct:false,tries:1},
    {topic:'Internal hinges',firstCorrect:false,correct:false,skipped:true,tries:0}
  ]);
  assert.equal(summary.firstTry, 1);
  assert.equal(summary.recovered, 1);
  assert.equal(summary.unresolved, 2);
  assert.deepEqual(Array.from(summary.strengths), ['Reactions & equilibrium']);
  assert.deepEqual(Array.from(summary.recoveredTopics), ['Shear → moment']);
  assert.deepEqual(Array.from(summary.unresolvedTopics), ['Deflection & stiffness','Internal hinges']);
  assert.match(summary.explanation, /not proof of a misconception/i);
});

test('post-session review does not keep a recovered topic unresolved', () => {
  const summary = sessionReview.summarise([
    {topic:'Shear → moment',firstCorrect:false,correct:false,tries:1},
    {topic:'Shear → moment',firstCorrect:false,correct:true,tries:2}
  ]);
  assert.equal(summary.recovered, 1);
  assert.equal(summary.unresolved, 1);
  assert.deepEqual(Array.from(summary.unresolvedTopics), ['Shear → moment']);
  assert.deepEqual(Array.from(summary.recoveredTopics), []);
});

test('session review UI feeds directly into Recommended Next', () => {
  assert.match(html, /SESSION REVIEW/);
  assert.match(html, /FIRST-TRY STRENGTHS/);
  assert.match(html, /RECOVERED DURING SESSION/);
  assert.match(html, /STILL UNRESOLVED/);
  assert.match(html, /RECOMMENDED NEXT \/ DETERMINISTIC/);
  assert.match(html, /session-review-next/);
  assert.doesNotMatch(html, /session-review-weak/);
});

test('CI uses Node 24 with current GitHub action runtimes', () => {
  const ci = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'ci.yml'), 'utf8');
  assert.match(ci, /actions\/checkout@v5/);
  assert.match(ci, /actions\/setup-node@v5/);
  assert.match(ci, /node-version:\s*"24"/);
});


test('learning trajectory moves from unresolved to recovered to stable', () => {
  const topic = 'Shear → moment';
  let view = learningTrajectory.build([
    {event:'attempt',topic,correct:false,firstTry:true,timestamp:1}
  ], {}, 6);
  assert.equal(view.rows[0].status, 'unresolved');

  view = learningTrajectory.build([
    {event:'attempt',topic,correct:false,firstTry:true,timestamp:1},
    {event:'attempt',topic,correct:true,firstTry:false,timestamp:2}
  ], {}, 6);
  assert.equal(view.rows[0].status, 'recovered');

  view = learningTrajectory.build([
    {event:'attempt',topic,correct:false,firstTry:true,timestamp:1},
    {event:'attempt',topic,correct:true,firstTry:false,timestamp:2},
    {event:'attempt',topic,correct:true,firstTry:true,timestamp:3},
    {event:'attempt',topic,correct:true,firstTry:true,timestamp:4}
  ], {}, 6);
  assert.equal(view.rows[0].status, 'stable');
  assert.match(view.rows[0].explanation, /two newest checked attempts/i);
});

test('learning trajectory drops back to unresolved when newer evidence is unresolved', () => {
  const topic = 'Reactions & equilibrium';
  const view = learningTrajectory.build([
    {event:'attempt',topic,correct:true,firstTry:true,timestamp:1},
    {event:'attempt',topic,correct:true,firstTry:true,timestamp:2},
    {event:'skip',topic,timestamp:3}
  ], {}, 6);
  assert.equal(view.rows[0].status, 'unresolved');
  assert.equal(view.rows[0].markers.at(-1).label, 'Skipped');
});

test('learning trajectory stability is not inferred across an intervening difficulty', () => {
  const topic = 'Deflection & stiffness';
  const view = learningTrajectory.build([
    {event:'attempt',topic,correct:true,firstTry:true,timestamp:1},
    {event:'reveal',topic,timestamp:2},
    {event:'attempt',topic,correct:true,firstTry:true,timestamp:3}
  ], {}, 6);
  assert.notEqual(view.rows[0].status, 'stable');
  assert.equal(view.rows[0].status, 'recovered');
});

test('learning trajectory keeps a non-judgmental evidence boundary', () => {
  const view = learningTrajectory.build([
    {event:'attempt',topic:'Internal hinges',correct:false,firstTry:true,timestamp:1}
  ], {}, 6);
  assert.match(view.boundary, /not intelligence/i);
  assert.match(view.boundary, /not.*grade/i);
  assert.match(view.boundary, /not.*proof of a misconception/i);
});

test('Learn mastery UI exposes recent trajectory without gamification', () => {
  assert.match(html, /RECENT LEARNING TRAJECTORY \/ LOCAL/);
  assert.match(html, /unresolved → recovered → first-try stable/);
  assert.match(html, /trajectory-mark/);
  assert.match(html, /learningTrajectory/);
  assert.doesNotMatch(html, /learning streak/i);
});


test('topic drill-down exposes the evidence transitions behind a trajectory state', () => {
  const topic = 'Shear → moment';
  const d = topicDrilldown.detail('year1', topic, [
    {event:'attempt',kind:'lesson',taskId:'l1-shear-moment',taskTitle:'Shear to moment',topic,correct:false,firstTry:true,answer:'Falls',expected:'Rises',timestamp:1},
    {event:'attempt',kind:'lesson',taskId:'l1-shear-moment',taskTitle:'Shear to moment',topic,correct:true,firstTry:false,answer:'Rises',expected:'Rises',timestamp:2},
    {event:'attempt',kind:'challenge',taskId:'y1-shear-moment',taskTitle:'Moment from shear',topic,correct:true,firstTry:true,answer:'30',expected:'30',timestamp:3}
  ], {}, {}, {});
  assert.equal(d.current.status, 'recovered');
  assert.deepEqual(Array.from(d.events, row => row.stateKey), ['unresolved','recovered','recovered']);
  assert.equal(d.events[0].taskTitle, 'Shear to moment');
  assert.equal(d.events[0].answer, 'Falls');
  assert.equal(d.events[0].expected, 'Rises');
});

test('topic drill-down recommends an unfinished same-topic exercise for unresolved evidence', () => {
  const topic = 'Point loads & shear';
  const d = topicDrilldown.detail('year1', topic, [
    {event:'skip',kind:'lesson',taskId:'l1-point-shear',taskTitle:'Point load shear jump',topic,timestamp:10}
  ], {}, {}, {});
  assert.equal(d.current.status, 'unresolved');
  assert.ok(d.nextTask);
  assert.equal(d.nextTask.topic, topic);
  assert.match(d.nextReason, /Revisit the concept/i);
});

test('topic drill-down avoids over-drilling a stable topic', () => {
  const topic = 'Reactions & equilibrium';
  const d = topicDrilldown.detail('year1', topic, [
    {event:'attempt',kind:'challenge',taskId:'y1-reaction',taskTitle:'Support reaction',topic,correct:true,firstTry:true,timestamp:1},
    {event:'attempt',kind:'challenge',taskId:'y1-reaction',taskTitle:'Support reaction',topic,correct:true,firstTry:true,timestamp:2}
  ], {}, {}, {});
  assert.equal(d.current.status, 'stable');
  assert.equal(d.nextTask, null);
  assert.match(d.nextReason, /over-drilling/i);
  assert.match(d.boundary, /does not diagnose/i);
});

test('trajectory UI opens inspectable evidence and can launch the topic exercise', () => {
  assert.match(html, /trajectory-topic:/);
  assert.match(html, /trajectory-next:/);
  assert.match(html, /EVENTS BEHIND THIS STATE/);
  assert.match(html, /BEST NEXT EXERCISE \/ DETERMINISTIC/);
  assert.match(html, /AVAILABLE TASKS AT THIS LEVEL/);
});


test('personalised study plan starts with unresolved evidence and ends with a mixed check', () => {
  const topic = 'Shear → moment';
  const evidence = {
    recentEvents: [{event:'attempt',kind:'lesson',taskId:'l1-shear-moment',taskTitle:'Shear to moment',topic,correct:false,firstTry:true,timestamp:20}]
  };
  const trajectory = learningTrajectory.build(evidence.recentEvents, {}, 6);
  const plan = studyPlan.build('year1', evidence, trajectory, {}, {}, {});
  assert.ok(plan.steps.length >= 2);
  assert.equal(plan.steps[0].phase, 'repair');
  assert.equal(plan.steps[0].topic, topic);
  assert.equal(plan.steps.at(-1).kind, 'session');
  assert.equal(plan.steps.at(-1).id, 'practice');
  assert.match(plan.boundary, /not a grade/i);
});

test('personalised study plan never uses a stable topic as filler', () => {
  const stable = 'Reactions & equilibrium';
  const events = [
    {event:'attempt',kind:'challenge',taskId:'y1-reaction',taskTitle:'Reaction',topic:stable,correct:true,firstTry:true,timestamp:1},
    {event:'attempt',kind:'challenge',taskId:'y1-reaction',taskTitle:'Reaction',topic:stable,correct:true,firstTry:true,timestamp:2}
  ];
  const trajectory = learningTrajectory.build(events, {}, 6);
  const plan = studyPlan.build('year1', {recentEvents:events}, trajectory, {}, {}, {});
  assert.ok(plan.steps.filter(step => step.kind !== 'session').every(step => step.topic !== stable));
  assert.match(plan.rationale, /de-prioritised/i);
});

test('personalised study plan has no duplicate launch tasks', () => {
  const topic = 'Point loads & shear';
  const events = [{event:'skip',kind:'lesson',taskId:'l1-point-shear',taskTitle:'Point load shear',topic,timestamp:10}];
  const trajectory = learningTrajectory.build(events, {}, 6);
  const plan = studyPlan.build('year1', {recentEvents:events}, trajectory, {}, {}, {});
  const ids = plan.steps.map(step => step.kind + ':' + step.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(plan.estimatedMinutes, plan.steps.reduce((sum,step)=>sum+step.minutes,0));
});

test('personalised study plan falls back to incomplete work when evidence is sparse', () => {
  const plan = studyPlan.build('year1', {recentEvents:[]}, {rows:[]}, {}, {}, {});
  assert.ok(plan.steps.some(step => step.phase === 'build'));
  assert.equal(plan.steps.at(-1).phase, 'mixed-check');
  assert.match(plan.rationale, /little recent evidence/i);
});

test('Learn mastery UI exposes launchable deterministic study plan steps', () => {
  assert.match(html, /PERSONALISED STUDY PLAN \/ DETERMINISTIC/);
  assert.match(html, /study-plan-step:/);
  assert.match(html, /learningStudyPlan/);
  assert.match(html, /study-sequencing aid/i);
});


test('study planner uses a wider retained trajectory than the six-topic display', () => {
  assert.match(html, /learning_trajectory_1\.build\)\(learningEvidenceEvents, masteryStats, 6\)/);
  assert.match(html, /planningTrajectory = \(0, learning_trajectory_1\.build\)\(learningEvidenceEvents, masteryStats, 10\)/);
  assert.match(html, /study_plan_1\.build\)[\s\S]*planningTrajectory/);
});


test('guided study block builds focused phases followed by a mixed check', () => {
  const plan = {
    steps: [
      {kind:'lesson',id:'l1-shear-moment',title:'Shear to moment',topic:'Shear → moment',phase:'repair',reason:'repair'},
      {kind:'challenge',id:'y1-shear-moment',title:'Moment from shear',topic:'Shear → moment',phase:'transfer',reason:'transfer'},
      {kind:'lesson',id:'l1-point-shear',title:'Point load shear',topic:'Point loads & shear',phase:'build',reason:'build'},
      {kind:'session',id:'practice',title:'Adaptive mixed check',topic:'Mixed revision',phase:'mixed-check',reason:'mixed'}
    ]
  };
  const mixed = [
    {kind:'challenge',id:'y1-reaction',title:'Reaction',topic:'Reactions & equilibrium',reason:'mixed 1'},
    {kind:'challenge',id:'y1-udl',title:'UDL',topic:'Distributed loads',reason:'mixed 2'},
    {kind:'lesson',id:'l1-deflection',title:'Deflection',topic:'Deflection & stiffness',reason:'mixed 3'},
    {kind:'challenge',id:'y1-hinge',title:'Hinge',topic:'Internal hinges',reason:'mixed 4'}
  ];
  const built = studyBlock.buildQueue(plan, mixed, {focusTarget:3,mixedTarget:4});
  assert.equal(built.phaseTotal, 4);
  assert.equal(built.queue.filter(row => row.blockRole === 'focus').length, 3);
  assert.equal(built.queue.filter(row => row.blockRole === 'mixed').length, 4);
  assert.deepEqual(Array.from(built.queue.slice(0,3), row => row.studyPhase), [1,2,3]);
  assert.ok(built.queue.slice(3).every(row => row.studyPhase === 4));
  assert.deepEqual(Array.from(built.queue.slice(3), row => row.mixedIndex), [1,2,3,4]);
});

test('guided study block replans only the unfinished focus tail', () => {
  const initial = studyBlock.buildQueue({
    steps:[
      {kind:'lesson',id:'a',title:'A',topic:'A',phase:'repair'},
      {kind:'lesson',id:'b',title:'B',topic:'B',phase:'build'},
      {kind:'challenge',id:'c',title:'C',topic:'C',phase:'build'}
    ]
  }, [
    {kind:'challenge',id:'m1',title:'M1',topic:'M1'},
    {kind:'challenge',id:'m2',title:'M2',topic:'M2'},
    {kind:'challenge',id:'m3',title:'M3',topic:'M3'},
    {kind:'challenge',id:'m4',title:'M4',topic:'M4'}
  ], {focusTarget:3,mixedTarget:4});
  const replanned = studyBlock.replanFocusTail(initial.queue, 0, {
    steps:[
      {kind:'lesson',id:'a',title:'A',topic:'A',phase:'repair'},
      {kind:'challenge',id:'d',title:'D',topic:'D',phase:'confirm'},
      {kind:'lesson',id:'e',title:'E',topic:'E',phase:'build'}
    ]
  }, [
    {kind:'challenge',id:'m1',title:'M1',topic:'M1'},
    {kind:'challenge',id:'m5',title:'M5',topic:'M5'},
    {kind:'challenge',id:'m6',title:'M6',topic:'M6'},
    {kind:'challenge',id:'m7',title:'M7',topic:'M7'},
    {kind:'challenge',id:'m8',title:'M8',topic:'M8'}
  ], {focusTarget:3,mixedTarget:4});
  assert.equal(replanned[0].id, 'a');
  assert.deepEqual(Array.from(replanned.slice(1,3), row => row.id), ['d','e']);
  assert.ok(!replanned.slice(1).some(row => row.id === 'a'));
});

test('guided study block mixed replanning never moves answered questions', () => {
  const queue = [
    {kind:'lesson',id:'a',title:'A',topic:'A',blockRole:'focus',studyPhase:1,studyPhaseTotal:2},
    {kind:'challenge',id:'m1',title:'M1',topic:'M1',blockRole:'mixed',studyPhase:2,studyPhaseTotal:2,mixedIndex:1,mixedTotal:4},
    {kind:'challenge',id:'m2',title:'M2',topic:'M2',blockRole:'mixed',studyPhase:2,studyPhaseTotal:2,mixedIndex:2,mixedTotal:4}
  ];
  const replanned = studyBlock.replanMixedTail(queue, 1, [
    {kind:'challenge',id:'m3',title:'M3',topic:'M3'},
    {kind:'challenge',id:'m4',title:'M4',topic:'M4'},
    {kind:'challenge',id:'m5',title:'M5',topic:'M5'}
  ], {mixedTarget:4,phaseTotal:2});
  assert.equal(replanned[0].id, 'a');
  assert.equal(replanned[1].id, 'm1');
  assert.deepEqual(Array.from(replanned.slice(2), row => row.mixedIndex), [2,3,4]);
});

test('guided study block review reports trajectory changes without grading', () => {
  const initial = {rows:[
    {topic:'Shear → moment',status:'unresolved',label:'Unresolved'},
    {topic:'Reactions & equilibrium',status:'stable',label:'First-try stable'}
  ]};
  const final = {rows:[
    {topic:'Shear → moment',status:'recovered',label:'Recovered'},
    {topic:'Reactions & equilibrium',status:'stable',label:'First-try stable'}
  ]};
  const review = studyBlock.review(initial, final, [
    {blockRole:'focus',correct:true,firstCorrect:false,tries:2},
    {blockRole:'mixed',correct:true,firstCorrect:true,tries:1}
  ], {startedAt:1000,finishedAt:61000,planRevision:3});
  assert.equal(review.trajectoryChanges.length, 1);
  assert.equal(review.trajectoryChanges[0].from, 'Unresolved');
  assert.equal(review.trajectoryChanges[0].to, 'Recovered');
  assert.equal(review.recovered, 1);
  assert.equal(review.firstTry, 1);
  assert.equal(review.planRevision, 3);
  assert.match(review.boundary, /does not assign a grade/i);
});

test('guided study block is wired into Learn with phase progress and final change review', () => {
  assert.match(html, /GUIDED STUDY BLOCK/);
  assert.match(html, /session-start:plan/);
  assert.match(html, /studyPhaseTotal/);
  assert.match(html, /completed work stays fixed; only unfinished work can change/i);
  assert.match(html, /STUDY BLOCK REVIEW \/ WHAT CHANGED/);
  assert.match(html, /session-review-plan-again/);
  assert.match(html, /study_block_1\.review/);
});

test('learning evidence preserves guided plan mode', () => {
  const row = learningEvidence.normaliseEvent({event:'attempt',topic:'Shear → moment',mode:'plan',correct:true,firstTry:true}, 123);
  assert.equal(row.mode, 'plan');
});


test('guided study block can shrink the unfinished phase count after new evidence', () => {
  const initial = studyBlock.buildQueue({
    steps:[
      {kind:'lesson',id:'a',title:'A',topic:'A',phase:'repair'},
      {kind:'lesson',id:'b',title:'B',topic:'B',phase:'build'},
      {kind:'challenge',id:'c',title:'C',topic:'C',phase:'build'}
    ]
  }, [
    {kind:'challenge',id:'m1',title:'M1',topic:'M1'},
    {kind:'challenge',id:'m2',title:'M2',topic:'M2'},
    {kind:'challenge',id:'m3',title:'M3',topic:'M3'},
    {kind:'challenge',id:'m4',title:'M4',topic:'M4'}
  ], {focusTarget:3,mixedTarget:4});
  const replanned = studyBlock.replanFocusTail(initial.queue, 0, {
    steps:[{kind:'session',id:'practice',title:'Mixed',topic:'Mixed revision',phase:'mixed-check'}]
  }, [
    {kind:'challenge',id:'m1',title:'M1',topic:'M1'},
    {kind:'challenge',id:'m2',title:'M2',topic:'M2'},
    {kind:'challenge',id:'m3',title:'M3',topic:'M3'},
    {kind:'challenge',id:'m4',title:'M4',topic:'M4'}
  ], {focusTarget:3,mixedTarget:4});
  assert.equal(replanned[0].studyPhase, 1);
  assert.equal(replanned.at(-1).studyPhase, 2);
  assert.ok(replanned.every(row => row.studyPhaseTotal === 2));
});

test('topic drill-down preserves guided plan event labels', () => {
  const topic = 'Shear → moment';
  const d = topicDrilldown.detail('year1', topic, [
    {event:'attempt',kind:'lesson',taskId:'l1-shear-moment',taskTitle:'Shear to moment',topic,correct:true,firstTry:true,mode:'plan',timestamp:1}
  ], {}, {}, {});
  assert.equal(d.events[0].mode, 'plan');
});


test('guided study resume preserves active elapsed time without counting time away', () => {
  const session = {
    active:true, mode:'plan', startedAt:1000,
    queue:[
      {kind:'lesson',id:'a',title:'A',topic:'Topic A',blockRole:'focus'},
      {kind:'challenge',id:'b',title:'B',topic:'Topic B',blockRole:'focus'}
    ],
    results:[],
    focusTarget:2,mixedTarget:4,phaseTotal:3,planRevision:1,targetCount:6,
    initialTrajectory:{rows:[]},studyPlanRationale:'Focus first',
    origin:{model:{name:'Original'},past:[],future:[],compareModel:null,levelStarterActive:false,view:{level:'year1',selected:[]}}
  };
  const saved = studyBlockResume.create(session, 'year1', 61000);
  assert.equal(saved.elapsedMs, 60000);
  const restored = studyBlockResume.normalise(saved, 361000);
  assert.equal(restored.elapsedMs, 60000);
});

test('guided study resume freezes only contiguous completed activities', () => {
  const base = {
    version:studyBlockResume.VERSION,savedAt:1000,level:'year1',elapsedMs:5000,
    session:{
      queue:[
        {kind:'lesson',id:'a',title:'A',topic:'A'},
        {kind:'challenge',id:'b',title:'B',topic:'B'},
        {kind:'challenge',id:'c',title:'C',topic:'C'}
      ],
      results:[{locked:true},{locked:false},{locked:true}],
      focusTarget:2,mixedTarget:4,phaseTotal:3,planRevision:0,targetCount:7,
      initialTrajectory:null,studyPlanRationale:'',
      origin:{model:{name:'Original'},past:[],future:[],view:{selected:[]}}
    }
  };
  const restored = studyBlockResume.normalise(base, 2000);
  assert.equal(studyBlockResume.completedCount(restored), 1);
  const summary = studyBlockResume.summary(restored);
  assert.equal(summary.completedCount, 1);
  assert.equal(summary.nextTitle, 'B');
});

test('guided study resume rejects expired or completed snapshots', () => {
  const base = {
    version:studyBlockResume.VERSION,savedAt:1000,level:'year1',elapsedMs:5000,
    session:{
      queue:[{kind:'lesson',id:'a',title:'A',topic:'A'}],
      results:[],
      focusTarget:1,mixedTarget:4,phaseTotal:2,planRevision:0,targetCount:5,
      initialTrajectory:null,studyPlanRationale:'',
      origin:{model:{name:'Original'},past:[],future:[],view:{selected:[]}}
    }
  };
  assert.equal(studyBlockResume.normalise(base, 1000 + studyBlockResume.MAX_AGE_MS + 1), null);
  base.savedAt = 5000;
  base.session.results = [{locked:true}];
  assert.equal(studyBlockResume.normalise(base, 6000), null);
});

test('guided study resume UI requires explicit resume or discard before a new plan', () => {
  assert.match(html, /SAVED GUIDED STUDY BLOCK \/ THIS BROWSER/);
  assert.match(html, /study-block-resume/);
  assert.match(html, /study-block-resume-discard/);
  assert.match(html, /Resume or discard the saved block above/i);
  assert.match(html, /Time while BeamLab was closed is not added/i);
});

test('guided study block persists on lifecycle events and clears on explicit exit or completion', () => {
  assert.match(html, /study-block-resume/);
  assert.match(html, /persistGuidedStudyBlock/);
  assert.match(html, /pagehide[\s\S]*persistGuidedStudyBlock/);
  assert.match(html, /session-exit-confirm[\s\S]*clearGuidedStudyBlockResume/);
  assert.match(html, /s\.active = false; s\.review = true;[\s\S]*clearGuidedStudyBlockResume/);
});

test('guided study resume replans only unfinished work from current evidence', () => {
  assert.match(html, /resumeGuidedStudyBlock/);
  assert.match(html, /completedCount/);
  assert.match(html, /replanGuidedStudyBlock\(s\)/);
  assert.match(html, /Date\.now\(\) - saved\.elapsedMs/);
  assert.match(html, /Time away from the tab was not counted/);
});


test('piecewise EI boundaries propagate through worked solution, Design and exports', () => {
  assert.match(html, /using compatibility and the EI assigned to each event-aligned beam element/i);
  assert.match(html, /EI ×/);
  assert.match(html, /Peak elastic extreme-fibre stress is not inferred for EI-only stiffness zones/i);
  assert.match(html, /Euler-Bernoulli small-deflection bending with optional piecewise-constant EI/i);
  assert.match(html, /Not inferred for EI-only zones/i);
  assert.match(html, /Verify local section geometry and that every entered capacity applies to the relevant zone/i);
  assert.match(html, /Piecewise EI stiffness profile changed/i);
  assert.match(html, /localStressInferenceAvailable/);
});
