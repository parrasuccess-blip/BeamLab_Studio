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
const learningEvidence = load('studio/learning-evidence');
const learningPath = load('studio/learning-path');
const adaptivePractice = load('studio/adaptive-practice');
const sessionReview = load('studio/session-review');
const learningTrajectory = load('studio/learning-trajectory');

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
