/* Run with: node --test tests/math.test.cjs
 * Uses the actual extracted production JavaScript modules, never a duplicated
 * test-only implementation of the solver.
 */
const test = require('node:test');
const { after } = require('node:test');
const assert = require('node:assert/strict');
const { solveBeam } = require('../../src/engine/solver.js');
const { example, makeItem } = require('../../src/model/examples.js');
const { sectionProperties, defaultSection } = require('../../src/model/sections.js');
const { parseModel } = require('../../src/model/validation.js');
const { roots01 } = require('../../src/engine/linear.js');
const near = (actual, expected, atol = 1e-8, rtol = 1e-7) => assert.ok(Math.abs(actual - expected) <= atol + rtol * Math.abs(expected), `${actual} != ${expected}`);
const EI = 70000; // kN m2
const clean = m => { m.items = m.items.filter(o => ['pin','roller','fixed','hinge'].includes(o.kind)); return m; };
const copy = m => JSON.parse(JSON.stringify(m));

test('Simply supported UDL: reactions, peak and quartic deflection', () => {
  const a = solveBeam(example('simple'));
  a.reactions.forEach(r => near(r.force, 25)); near(a.peakM.M, 62.5); near(a.peakM.x, 5);
  near(a.sample(5).v, -5 * 5 * 10 ** 4 / (384 * EI)); near(a.peakD.x, 5);
  near(a.sample(0).M, 0); near(a.sample(10).M, 0);
});
test('Centre point: cubic response and one-sided shear jump', () => {
  const m = clean(example('simple')); m.items.push(makeItem('point',5,undefined,50)); const a=solveBeam(m);
  near(a.peakM.M,125); near(a.sample(5).v,-50*1000/(48*EI));
  near(a.sample(5).V-a.sample(5,'left').V,-50);
});
test('Off-centre point load plus direct load on support', () => {
  const m=clean(example('simple'));m.items.push(makeItem('point',3,undefined,80),makeItem('point',0,undefined,17));
  const a=solveBeam(m);near(a.reactions[0].force,73);near(a.reactions[1].force,24);near(a.peakM.M,168);
});
test('Cantilever tip point: fixed moment and tip slope', () => {
  const a=solveBeam(example('cantilever'));near(a.reactions[0].force,50);near(a.reactions[0].moment,500);
  near(a.sample(0).M,-500);near(a.sample(10).M,0);near(a.sample(10).v,-50*1000/(3*EI));near(a.sample(10).theta,-50*100/(2*EI));
});
test('Right-fixed cantilever mirror', () => {
  const m=example('cantilever');m.items[0].x=10;m.items[1].x=0;const a=solveBeam(m);
  near(a.reactions[0].moment,-500);near(a.sample(0).v,-50*1000/(3*EI));
});
test('Cantilever UDL: exact deflection and rotation', () => {
  const m=clean(example('cantilever'));m.items.push(makeItem('udl',0,10,5));const a=solveBeam(m);
  near(a.reactions[0].moment,250);near(a.sample(10).v,-5*10**4/(8*EI));near(a.sample(10).theta,-5*1000/(6*EI));
});
test('Pure tip couple: constant moment, zero shear', () => {
  const m=clean(example('cantilever'));m.items.push(makeItem('moment',10,undefined,60));const a=solveBeam(m);
  near(a.reactions[0].moment,-60);near(a.sample(4).V,0);near(a.sample(4).M,60);near(a.sample(10).v,60*100/(2*EI));
});
test('Interior applied couple jumps moment, not shear', () => {
  const m=clean(example('cantilever'));m.items.push(makeItem('moment',4,undefined,60));const a=solveBeam(m);
  near(a.sample(4).M-a.sample(4,'left').M,-60);near(a.sample(4).V-a.sample(4,'left').V,0);
});
test('Simply supported couple: opposite reactions and uplift warning', () => {
  const m=clean(example('simple'));m.items.push(makeItem('moment',4,undefined,60));const a=solveBeam(m);
  near(a.reactions[0].force,6);near(a.reactions[1].force,-6);assert.ok(a.warnings.some(w=>w.includes('hold-down')));
});
test('Triangular load centroid and exact quadratic shear root', () => {
  const a=solveBeam(example('triangle'));near(a.reactions[0].force,18);near(a.reactions[1].force,36);
  near(a.peakM.x,9/Math.sqrt(3));near(a.peakM.M,12*81/(9*Math.sqrt(3)));
});
test('Cantilever triangle: exact quintic particular solution', () => {
  const m=clean(example('cantilever'));m.length=6;m.items.push(makeItem('variable',0,6,0,10));const a=solveBeam(m);
  near(a.sample(6).v,-11*10*6**4/(120*EI));
});
test('Trapezoid: independent resultant and first moment', () => {
  const m=example('triangle');m.items[2].value=4;m.items[2].endValue=10;const a=solveBeam(m);
  near(a.total,63);near(a.reactions[0].force,27);near(a.reactions[1].force,36);
});
test('Sign-changing distributed load: zero net force but nonzero couple', () => {
  const m=example('triangle');m.items[2].value=-12;const a=solveBeam(m);
  near(a.total,0);near(a.reactions[0].force,-18);near(a.reactions[1].force,18);
});
test('Two-span continuous UDL: closed-form reactions and support moment', () => {
  const a=solveBeam(example('continuous'));[9.375,31.25,9.375].forEach((r,i)=>near(a.reactions[i].force,r));
  near(a.sample(5).M,-5*25/8);near(a.sample(5).v,0);
});
test('Fixed-ended UDL: restrained moments and exact interior deflection', () => {
  const a=solveBeam(example('fixed'));near(a.reactions[0].moment,500/12);near(a.reactions[1].moment,-500/12);
  near(a.sample(5).M,500/24);near(a.sample(5).v,-5*10000/(384*EI));
});
test('Propped cantilever: independent force-method result', () => {
  const m=example('simple');m.items[0].kind='fixed';const a=solveBeam(m);
  near(a.reactions[0].force,5*50/8);near(a.reactions[1].force,3*50/8);near(a.reactions[0].moment,500/8);
});
test('Gerber UDL: moment release, continuity, slope jump, deflection', () => {
  const a=solveBeam(example('gerber'));[20,80,20].forEach((r,i)=>near(a.reactions[i].force,r));
  near(a.sample(8).M,0);near(a.sample(8,'left').v,a.sample(8).v);
  near(Math.abs(a.sample(8).theta-a.sample(8,'left').theta),0.001285714285714);
  near(Math.abs(a.peakD.v),0.00190476190476);
});
test('Gerber suspended-side point load', () => {
  const m=clean(example('gerber'));m.items.push(makeItem('point',10,undefined,40));const a=solveBeam(m);
  [-20/3,80/3,20].forEach((r,i)=>near(a.reactions[i].force,r));
});
test('Two-hinge suspended span: independent segment equilibrium', () => {
  const a=solveBeam(example('suspended'));[0,45,45,0].forEach((r,i)=>near(a.reactions[i].force,r));
  near(a.sample(6).M,0);near(a.sample(12).M,0);near(a.sample(9).M,22.5);
});
test('Uniform EI scaling preserves reactions and halves deflection', () => {
  const m=example('continuous'),a=solveBeam(m);m.section.E*=2;const b=solveBeam(m);
  a.reactions.forEach((r,i)=>near(b.reactions[i].force,r.force));near(b.peakD.v,a.peakD.v/2);
});
test('Section formulae and length unit conversion', () => {
  const p=sectionProperties({...defaultSection,shape:'rectangle',b:200,h:400});near(p.A,.08);near(p.I,.2*.4**3/12);near(p.c,.2);
  const b=sectionProperties({...defaultSection,shape:'box',b:200,h:400,t:10});near(b.I,(.2*.4**3-.18*.38**3)/12);
});
test('Self-weight and stress force/length unit conversion', () => {
  const m=clean(example('simple'));m.selfWeight=true;const a=solveBeam(m),w=7850*.01*9.80665/1000;
  near(a.total,w*10);near(a.sample(5).M,w*100/8);
  const n=solveBeam(example('simple'));near(Math.abs(n.peakM.M)*n.properties.c/(n.properties.I*1000),35.7142857142857);
});
test('Polynomial roots include tangencies and all three crossings', () => {
  const r=roots01([.25,-1,1]);near(r[0],.5);assert.equal(r.length,1);
  const s=roots01([-.08,.66,-1.5,1]);near(s[0],.2);near(s[1],.5);near(s[2],.8);
});
test('Mechanism guardrails: one pin, two rollers, released simple beam', () => {
  const m=clean(example('simple'));m.items=[m.items[0]];assert.throws(()=>solveBeam(m));
  const r=example('simple');r.items[0].kind='roller';assert.throws(()=>solveBeam(r),/horizontal/);
  const h=example('simple');h.items.push(makeItem('hinge',5));assert.throws(()=>solveBeam(h),/unstable/);
});
test('Invalid inputs, duplicated support and couple on hinge', () => {
  const m=example('simple');m.length=201;assert.throws(()=>solveBeam(m));m.length=10;m.items[2].value=NaN;assert.throws(()=>solveBeam(m));
  assert.throws(()=>parseModel('{"version":3}'));
  for (const patch of [{ material: 7 }, { I: 1e308 }, { A: 1e308 }, { E: 1e-300 }]) {
    const invalid = example('simple'); Object.assign(invalid.section, patch);
    assert.throws(() => parseModel(JSON.stringify(invalid)));
  }
  const h=example('gerber');h.items.push(makeItem('moment',8,undefined,60));assert.throws(()=>solveBeam(h),/ambiguous/);
  const d=example('simple');d.items[1].x=0;assert.throws(()=>solveBeam(d),/same position/);
});
test('1 m, 150 m and 200 m analytic UDL checks', () => {
  for(const length of [1,150,200]){const m=example('simple');m.length=length;m.items[1].x=length;m.items[2].end=length;const a=solveBeam(m);
    near(a.peakM.M,5*length**2/8);near(a.peakD.v,-25*length**4/(384*EI));}
});
test('Unloaded member returns zero finite fields', () => {
  const a=solveBeam(clean(example('simple')));near(a.peakV.V,0);near(a.peakM.M,0);near(a.peakD.v,0);assert.ok(a.points.every(s=>['x','V','M','v','theta','I','c','localEI','stiffnessFactor'].every(k=>Number.isFinite(s[k]))));
});
test('Upward centre point reverses deflection and reaction signs', () => {
  const m=clean(example('simple'));m.items.push(makeItem('point',5,undefined,-50));const a=solveBeam(m);
  near(a.reactions[0].force,-25);near(a.sample(5).v,50*1000/(48*EI));near(a.sample(5).M,-125);
});
test('SFD peak may occur inside a sign-changing distributed load', () => {
  const m=example('triangle');m.items[2].value=-12;m.items.push(makeItem('moment',0,undefined,162));
  // The applied couple cancels the load first moment: RA=RB=0.
  // V(x)=12x-(4/3)x^2 has its absolute maximum 27 kN at x=4.5 m.
  const a=solveBeam(m);near(a.peakV.x,4.5);near(a.peakV.V,27);
});
let seed=20260915;
const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let n=0;n<150;n++){
  test(`Seeded mixed-load model ${n+1}: equilibrium, splitting, scaling, differential identities`,()=>{
    const m=clean(example(n%3===0?'continuous':n%3===1?'gerber':'simple')),l=m.length;
    const x=l*(.12+.15*rand()),end=l*(.78+.1*rand()),w0=15*(rand()-.3),w1=15*(rand()-.3);
    const dist=makeItem('variable',x,end,w0,w1);
    m.items.push(dist,makeItem('point',l*(.35+.1*rand()),undefined,60*(rand()-.25)),makeItem('moment',l*(.9+.08*rand()),undefined,20*(rand()-.5)));
    const a=solveBeam(m);near(a.forceResidual,0,1e-5);near(a.momentResidual,0,1e-5);near(a.hingeResidual,0,1e-5);
    const split=copy(m),mid=(x+end)/2;split.items=split.items.filter(i=>i.id!==dist.id);
    split.items.push(makeItem('variable',x,mid,w0,(w0+w1)/2),makeItem('variable',mid,end,(w0+w1)/2,w1));
    const b=solveBeam(split);a.reactions.forEach((r,i)=>near(b.reactions[i].force,r.force,1e-5));
    for(const z of [.11,.31,.61,.83]){near(a.sample(z*l).M,b.sample(z*l).M,1e-5);near(a.sample(z*l).v,b.sample(z*l).v,1e-8);}
    const doubled=copy(m);doubled.items.filter(i=>['point','variable','moment'].includes(i.kind)).forEach(i=>{i.value*=2;if(i.endValue!==undefined)i.endValue*=2;});
    const c=solveBeam(doubled);near(c.peakD.v,2*a.peakD.v,1e-7);
    for(const e of a.elements){const xx=(e.a+e.b)/2,h=Math.min(1e-4,(e.b-e.a)*1e-4);
      near((a.sample(xx+h).M-a.sample(xx-h).M)/(2*h),a.sample(xx).V,1e-5);
      near((a.sample(xx+h).V-a.sample(xx-h).V)/(2*h),-(e.w0+e.slope*(xx-e.a)),1e-5);}
  });
}
