'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {example, makeItem} = require('../../src/model/examples');
const {normalise, solveStudy} = require('../../src/model/study');
const lessons = require('../../src/studio/challenges');
const {RELEASE, fingerprint, benchmarks} = require('../../src/studio/verification');
const {catalogue, fromCatalogue} = require('../../src/model/catalogue');
const {sectionProperties} = require('../../src/model/sections');
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-7*(1+Math.abs(b)), `${a} versus ${b}`);
function reference() {
  const m=normalise(example('simple'));
  m.length=6;
  m.items=m.items.filter(i=>i.kind==='pin'||i.kind==='roller');
  m.items[1].x=6;
  m.items.push({...makeItem('point',3,undefined,20),caseId:'base'});
  return m;
}
const shapes={
 'l1-point-shear':'step-down','l1-udl-shear':'linear-down','l1-shear-moment':'triangle-up',
 'l2-continuous-moment':'hogging-support','l2-deflection':'sag-down','l2-hinge-release':'zero-hinge',
 'l3-variable-shear':'curved-down','l3-fixed-restraint':'fixed-hogging','l3-suspended-hinge':'zero-hinge'
};
const answers={
 'y1-reaction':10,'y1-moment':62.5,'y1-cantilever':500,
 'y2-continuous':31.25,'y2-triangle':62.3538290724796,'y2-fixed-deflection':1.8601190476190477,
 'y3-suspended':45,'y3-gerber':60,'y3-overhang':28
};
for(const level of ['year1','year2','year3']) {
 for(const spec of lessons.listLessons(level)) test(`Lesson ${spec.id}: independent shape and all distractors`,()=>{
   const m=spec.example==='reference'?reference():normalise(example(spec.example)),before=JSON.stringify(m),a=solveStudy(m);
   assert.equal(lessons.predictionFor(spec,a,m),shapes[spec.id]);
   for(const [choice] of spec.predict.choices) assert.equal(lessons.checkPrediction(spec,choice,a,m).correct,choice===shapes[spec.id]);
   assert.equal(JSON.stringify(m),before);
 });
 for(const spec of lessons.listChallenges(level)) test(`Challenge ${spec.id}: independent answer and rejection`,()=>{
   const m=spec.example==='reference'?reference():normalise(example(spec.example)),before=JSON.stringify(m),a=solveStudy(m),expected=answers[spec.id];
   near(lessons.answerFor(spec,a),expected);
   assert.ok(lessons.checkAnswer(spec,expected,a).correct);
   assert.equal(lessons.checkAnswer(spec,expected+Math.max(1,Math.abs(expected)*.1),a).correct,false);
   assert.throws(()=>lessons.checkAnswer(spec,NaN,a));assert.equal(JSON.stringify(m),before);
 });
}
test('Contextual explanation uses current shear and level without mutation',()=>{
 const m=reference(),before=JSON.stringify(m),a=solveStudy(m),x=lessons.explainAt(m,a,3,'year1');
 assert.match(x.title,/shear jump/i);assert.ok(x.lines.some(l=>l.includes('V = -10.000 kN')));
 const y=lessons.explainAt(m,a,1.5,'year2');assert.match(y.formula,/dV\/dx/);assert.ok(y.lines.some(l=>l.includes('Elastic displacement')));
 assert.equal(JSON.stringify(m),before);
});
test('Release identity and finite in-app reference benchmarks',()=>{
 assert.equal(RELEASE,'4.1.1');assert.match(fingerprint(reference()),/^BL410-[A-F0-9]{8}$/);
 const checks=benchmarks();assert.equal(checks.length,21);for(const c of checks)assert.ok(c.pass,c.name);
});
for(const row of catalogue)test(`Catalogue conversion and density weight ${row.name}`,()=>{
 const s=fromCatalogue(row.name),p=sectionProperties(s);
 near(p.I*1e12,row.I);near(p.A*1e6,row.A);near(p.weight,s.density*row.A*1e-6*9.80665/1000);
});
