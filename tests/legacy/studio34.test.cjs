const test = require('node:test');
const assert = require('node:assert/strict');
const { example, makeItem } = require('../../src/model/examples');
const { normalise, clone, solveStudy, parseStudy, setCombination } = require('../../src/model/study');
const { audit, fingerprint, benchmarks, criticalLocations } = require('../../src/studio/verification');
const { sweepPosition, nextProgress } = require('../../src/studio/presentation');
const near = (x,y,atol=1e-8,rtol=1e-7) => assert.ok(Math.abs(x-y)<=atol+rtol*Math.abs(y),`${x} vs ${y}`);
const EI=70000;
const simple = () => normalise(example('simple'));
const loadsOnly = m => { m.items=m.items.filter(i=>['pin','roller','fixed','hinge'].includes(i.kind)); return m; };

test('Live suite executes 16 finite analytical checks',()=>{
 const c=benchmarks();assert.equal(c.length,21);assert.ok(c.every(c=>c.pass && Number.isFinite(c.actual)));
});
test('Deterministic model reference ignores JSON property order, not input changes',()=>{
 const m=simple(),f=fingerprint(m);assert.match(f,/^BL410-[0-9A-F]{8}$/);
 assert.equal(f,fingerprint(JSON.parse(JSON.stringify(m))));
 assert.equal(f,fingerprint(Object.fromEntries(Object.entries(m).reverse())));
 m.items[2].value=6;assert.notEqual(f,fingerprint(m));
});
test('UDL energy versus independent closed form w2 L5 / (240 EI)',()=>{
 const m=simple(),r=audit(m);near(r.energy.strainEnergy_kNm,25*10**5/(240*EI));assert.ok(r.pass);
});
test('Cantilever point energy versus P2 L3 / (6 EI)',()=>{
 const r=audit(normalise(example('cantilever')));near(r.energy.strainEnergy_kNm,50**2*10**3/(6*EI));assert.ok(r.pass);
});
test('Pure couple strain energy C2 L/(2EI)',()=>{
 const m=loadsOnly(normalise(example('cantilever')));m.items.push({...makeItem('moment',10,undefined,-60),caseId:'base'});
 const r=audit(m);near(r.energy.strainEnergy_kNm,60**2*10/(2*EI));assert.ok(r.pass);
});
test('Unloaded audit is finite and zero',()=>{
 const r=audit(loadsOnly(simple()));assert.ok(r.pass);near(r.energy.strainEnergy_kNm,0);assert.ok(r.checks.every(c=>Number.isFinite(c.residual)));
});
test('Audit does not mutate model or leave nominal factors changed',()=>{
 const m=simple();m.cases[0].factor=1.35;m.selfWeight=true;const saved=JSON.stringify(m);audit(m);assert.equal(JSON.stringify(m),saved);
});
test('Audit catches corruption of a supplied result independently',()=>{
 const m=simple(),a=solveStudy(m);const base=a.sample;
 a.sample=(x,side)=>({...base(x,side),v:base(x,side).v*1.01});
 assert.equal(audit(m,a).checks.find(c=>c.name.includes('energy')).pass,false);
});
test('Factored UDL energy scales quadratically, not linearly',()=>{
 const m=simple(),u=audit(m).energy.strainEnergy_kNm;m.cases[0].factor=2.2;
 near(audit(m).energy.strainEnergy_kNm,u*2.2**2);
});
test('Catalogue shear-centre warnings preserved in model evidence',()=>{
 const m=simple();m.section.material='Concrete (uncracked demo)';const r=audit(m);assert.ok(r.warnings.some(w=>w.includes('Concrete')));
});
test('Critical locations distinguish sagging and hogging, not absolute only',()=>{
 const m=normalise(example('continuous')),a=solveStudy(m),c=criticalLocations(a,m);
 const pos=c.find(c=>c.name.includes('sagging')),neg=c.find(c=>c.name.includes('hogging'));
 assert.ok(pos.value>0);near(neg.value,-15.625);near(neg.x,5);
});
test('Tour progress reflects at boundaries, never overshoots',()=>{
 const q=nextProgress(.9,1,2.4,12);near(q.progress,.9);assert.equal(q.direction,-1);
 for(let n=0;n<1000;n++){const q=nextProgress(.4,n%2?1:-1,n/17,12);assert.ok(q.progress>=0&&q.progress<=1);const x=sweepPosition(6,q.progress);assert.ok(x>=.3-1e-12&&x<=5.7+1e-12);}
 assert.throws(()=>nextProgress(0,1,-1));assert.throws(()=>sweepPosition(NaN,.5));
});
test('Unknown/reserved IDs and duplicate combinations rejected before import',()=>{
 const m=simple();m.items[2].id='__weight__';assert.throws(()=>parseStudy(JSON.stringify(m)),/identifier/);
 const n=simple();n.combinations=[{id:'x',name:'A',factors:{base:1}},{id:'x',name:'B',factors:{base:2}}];assert.throws(()=>parseStudy(JSON.stringify(n)),/duplicated/);
});
// Independent textbook reactions, peak moment and deflection for every sweep
// position. Closed forms below do not call the production assembly or audit.
for(let i=0;i<=60;i++) test(`Moving point benchmark ${i}/60: independent statics and deflection`,()=>{
 const m=loadsOnly(simple());m.length=6;m.items[1].x=6;
 const x=6*i/60, P=20,b=6-x;m.items.push({...makeItem('point',x,undefined,P),caseId:'base'});
 const a=solveStudy(m);near(a.reactions[0].force,P*b/6);near(a.reactions[1].force,P*x/6);near(a.sample(x).M,P*x*b/6);
 near(a.sample(x).v,-P*x*x*b*b/(3*EI*6));assert.ok(audit(m,a).pass);
 for(const z of [1.11,2.42,4.73]) {
  const expected=z<=x ? -P*b*z*(36-b*b-z*z)/(6*6*EI) : -P*x*(6-z)*(36-x*x-(6-z)**2)/(6*6*EI);
  near(a.sample(z).v,expected);
 }
});
let seed=340016;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
for(let i=0;i<100;i++)test(`Energy and reciprocity mixed model ${i+1}`,()=>{
 const m=loadsOnly(normalise(example(['continuous','gerber','suspended','simple','fixed'][i%5]))),L=m.length;
 const x=L*(.21+.06*rand()),y=L*(.72+.06*rand());
 m.items.push({...makeItem('point',x,undefined,-10+50*rand()),caseId:'base'},{...makeItem('moment',y,undefined,25*(rand()-.5)),caseId:'base'},{...makeItem('variable',0,L,-2+8*rand(),5*rand()),caseId:'base'});
 m.selfWeight=i%2===0;m.cases[0].factor=-1+3*rand();const r=audit(m);assert.ok(r.pass,JSON.stringify(r.checks));
 // Maxwell-Betti reciprocal unit-force displacement from two separately solved models.
 const ma=loadsOnly(clone(m)),mb=loadsOnly(clone(m));ma.selfWeight=mb.selfWeight=false;ma.cases[0].factor=mb.cases[0].factor=1;
 ma.items.push({...makeItem('point',x,undefined,1),caseId:'base'});mb.items.push({...makeItem('point',y,undefined,1),caseId:'base'});
 near(solveStudy(ma).sample(y).v,solveStudy(mb).sample(x).v,1e-9,1e-6);
});
