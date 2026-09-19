'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {solveBeam}=require('../../src/engine/solver');
const {example,makeItem}=require('../../src/model/examples');
const {normalise,clone,solveStudy,effectiveModel,parseStudy,setCombination,stressAt,reviewLimits,resultant}=require('../../src/model/study');
const {fromCatalogue,catalogue}=require('../../src/model/catalogue');
const {sectionProperties}=require('../../src/model/sections');
const {snapshotCode,fromSnapshot,resultsCsv}=require('../../src/studio/export');
const {History}=require('../../src/studio/history');
const {teaching,renderDiagrams}=require('../../src/studio/diagrams');
const {button}=require('../../src/studio/common');
const near=(a,b,t=1e-7)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=t*(1+Math.abs(b)),`${a} != ${b}`);
const simple=()=>normalise(example('simple'));
const cut=m=>{m.items=m.items.filter(o=>['pin','roller','fixed','hinge'].includes(o.kind));return m};

test('6 m / 20 kN meeting reference uses the real stiffness, not an invented deflection',()=>{
 const m=cut(simple());m.length=6;m.items[1].x=6;m.items.push({...makeItem('point',3,undefined,20),caseId:'base'});
 const a=solveStudy(m);near(a.reactions[0].force,10);near(a.reactions[1].force,10);near(a.peakM.M,30);near(a.peakM.x,3);near(a.peakD.v*1000,-1.2857142857142858);
});
test('Case factor is applied once and nominal input is immutable',()=>{
 const m=simple();m.cases[0].factor=1.5;const before=JSON.stringify(m);const a=solveStudy(m);near(a.reactions[0].force,37.5);near(a.peakM.M,93.75);assert.equal(JSON.stringify(m),before);near(m.items[2].value,5);
});
test('Case-factored self weight is not added a second time',()=>{
 const m=simple();m.selfWeight=true;m.cases[0].factor=2;const w=sectionProperties(m.section).weight;
 const a=solveStudy(m);near(a.total,100+20*w);near(a.reactions[0].force,50+10*w);assert.equal(effectiveModel(m).selfWeight,false);
});
test('Disabled case removes its loads and self weight',()=>{
 const m=simple();m.selfWeight=true;m.cases[0].enabled=false;const a=solveStudy(m);near(a.total,0);near(a.peakM.M,0);near(a.peakD.v,0);
});
test('Negative factor reverses loads and stress signs',()=>{
 const m=simple();m.cases[0].factor=-1;const a=solveStudy(m);near(a.reactions[0].force,-25);near(a.peakM.M,-62.5);near(a.sample(5).v,9.300595238095e-3);assert.ok(stressAt(a,5).top>0);
});
test('Analytical elastic stress units and signs',()=>{
 const a=solveStudy(simple());near(stressAt(a,5).top,-62.5*.2/.00035/1000);near(stressAt(a,5).bottom,35.714285714285715);
});
test('Manual limit ratios remain user comparisons, not capacity',()=>{
 const m=simple();m.review={stressMPa:50,displacementMm:10};const r=reviewLimits(solveStudy(m),m);near(r.stressRatio,35.714285714285715/50);near(r.displacementRatio,9.300595238095239/10);
});
test('Saved factors preserve zeros and do not alter nominal input',()=>{
 const m=simple();m.cases.push({id:'live',name:'Live',enabled:true,factor:1});const n=setCombination(m,{base:1.2,live:0});assert.equal(n.cases[1].enabled,false);near(n.cases[0].factor,1.2);near(m.cases[0].factor,1);
});
test('Resultant first moment for load which changes sign',()=>{
 const r=resultant(makeItem('variable',1,5,-5,5));near(r.force,0);near(r.firstMoment,40/3);assert.equal(r.position,null);
});
test('Snapshot safely round-trips unicode and signed case factors',()=>{
 const m=simple();m.name='Bridge \u2013 \u03b4 \u4e2d';m.cases[0].factor=-2.3;const n=fromSnapshot(snapshotCode(m));assert.deepEqual(n,m);assert.deepEqual(fromSnapshot('https://example.test/#model='+snapshotCode(m)),m);
});
test('Malformed and oversized snapshots are rejected',()=>{assert.throws(()=>fromSnapshot('this is bad'));assert.throws(()=>fromSnapshot('a'.repeat(211000)));assert.throws(()=>parseStudy('{"version":3}'));});
test('History restores original model and clears redo after a new branch',()=>{
 const h=new History(simple());const m=clone(h.model);m.name='First';h.commit(m,'Rename');h.undo();assert.notEqual(h.model.name,'First');h.redo();assert.equal(h.model.name,'First');h.undo();const n=clone(h.model);n.name='New branch';h.commit(n,'Branch');assert.equal(h.future.length,0);
});
test('CSV retains both sides of an applied force discontinuity',()=>{
 const m=cut(simple());m.items.push({...makeItem('point',5,undefined,50),caseId:'base'});const csv=resultsCsv(solveStudy(m));const rows=csv.split('\n').slice(1).map(r=>r.split(',')).filter(r=>Number(r[0])===5);assert.ok(rows.some(r=>r[1]==='left'&&Math.abs(Number(r[2])-25)<1e-8));assert.ok(rows.some(r=>r[1]==='right'&&Math.abs(Number(r[2])+25)<1e-8));
});
test('Right-hand teaching intensity at a UDL start matches the traced region',()=>{
 const m=cut(simple());m.items.push({...makeItem('udl',3,8,5),caseId:'base'});const text=teaching(m,solveStudy(m),3);assert.match(text,/\+5\.00 kN\/m/);
});
test('Invalid catalogue metadata cannot impersonate tabulated properties',()=>{
 const m=simple();m.section=fromCatalogue('310UB40.4');m.section.I*=2;assert.throws(()=>solveStudy(m),/Catalogue/);
});
test('Action attributes escape imported HTML characters',()=>{assert.ok(button('x" onclick="bad','Label').includes('&quot;'));});
test('Combination identifiers reject markup',()=>{const m=simple();m.combinations=[{id:'" onclick="bad',name:'bad',factors:{base:1}}];assert.throws(()=>solveStudy(m));});
for(const row of catalogue) test('Catalogue unit conversion / '+row.name,()=>{
 const m=simple();m.section=fromCatalogue(row.name);const a=solveStudy(m);near(a.properties.I,row.I*1e-12,1e-11);near(a.properties.A,row.A*1e-6,1e-11);near(a.properties.c,row.h/2000);near(a.peakD.v,-5*5*1e4/(384*200e6*row.I*1e-12));
});
for(const [shape,expectedA,expectedI] of [['rectangle',80000,200*400**3/12],['box',200*400-176*376,(200*400**3-176*376**3)/12],['i',2*200*20+12*360,(200*400**3-188*360**3)/12]]) test('Derived geometry / '+shape,()=>{
 const m=simple();m.section.shape=shape;const p=sectionProperties(m.section);near(p.A*1e6,expectedA);near(p.I*1e12,expectedI);
});
let seed=310033;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
for(let k=0;k<120;k++) test('Seeded multi-case superposition / '+String(k).padStart(3,'0'),()=>{
 const m=normalise(example(k%3===0?'continuous':k%3===1?'gerber':'simple'));m.items=m.items.filter(i=>!['udl','variable','point','moment'].includes(i.kind));const L=m.length;
 m.cases=[{id:'dead',name:'Dead',enabled:true,factor:.8+rand()},{id:'live',name:'Live',enabled:true,factor:-1+rand()*3}];m.selfWeightCase='dead';
 m.items.push({...makeItem('udl',0,L,rand()*8),caseId:'dead'}, {...makeItem('variable',L*.2,L*.9,-3+rand()*9,3+rand()*10),caseId:'live'}, {...makeItem('point',L*.37,undefined,-20+rand()*60),caseId:'live'});
 const all=solveStudy(m),ma=clone(m),mb=clone(m);ma.cases[1].enabled=false;mb.cases[0].enabled=false;const aa=solveStudy(ma),ab=solveStudy(mb);
 all.reactions.forEach((r,i)=>near(r.force,aa.reactions[i].force+ab.reactions[i].force,2e-6));
 for(const t of [.07,.24,.43,.68,.94]) {const x=L*t,s=all.sample(x),u=aa.sample(x),v=ab.sample(x);near(s.V,u.V+v.V,2e-6);near(s.M,u.M+v.M,2e-6);near(s.v,u.v+v.v,2e-7);}
 near(all.forceResidual,0,3e-6);near(all.momentResidual,0,3e-5);near(all.hingeResidual,0,3e-5);
});
