'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
const start=html.indexOf('const modules = {'),end=html.indexOf("load('studio/app');",start);
const ctx=vm.createContext({TextEncoder,TextDecoder,setTimeout,clearTimeout,console,AbortController,btoa,atob});
new vm.Script(html.slice(start,end)+';globalThis.productionLoad=load;').runInContext(ctx);
const load=ctx.productionLoad;
const {example,makeItem}=load('model/examples');
const {normalise,solveStudy,validateStudy,clone}=load('model/study');
const {defaultSection,sectionProperties,sectionDetails}=load('model/sections');
const {prepareMoving,envelope,influenceLine}=load('engine/moving');
const {audit,canonical}=load('studio/verification');
const {fibreResponse,render:renderFibre}=load('studio/section-lab');
const workflow=load('studio/workspace');
const transfer=load('studio/learning-transfer');
const {listLessons,topicForTask}=load('studio/challenges');
const {toolsPanel}=load('studio/panels');
const review=load('studio/review-hub');
const near=(actual,expected,tol=1e-8)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tol*(1+Math.abs(expected)),`${actual} != ${expected}`);
const plain=value=>JSON.parse(JSON.stringify(value));
const unloaded=key=>{const m=normalise(example(key));m.items=m.items.filter(i=>['pin','roller','fixed','hinge'].includes(i.kind));return m;};

test('cleared or invalid span-ratio criteria remain unassessed instead of silently using L/250',()=>{
  const design=load('studio/design'),m=normalise(example('simple')),a=solveStudy(m);
  for(const value of [null,'',0,-1,NaN,Infinity,'invalid']) {
    const r=design.evaluate(m,a,{deflectionMode:'ratio',deflectionRatio:value});
    assert.equal(r.settings.deflectionRatio,null);
    assert.equal(r.checks.find(c=>c.id==='deflection').status,'not-assessed');
  }
  near(design.evaluate(m,a,{deflectionMode:'ratio',deflectionRatio:400}).checks.find(c=>c.id==='deflection').limit,m.length*1000/400);
  assert.equal(design.normaliseSettings({}).deflectionRatio,250);
});

test('fixed-ended imposed rotation matches the independent cubic Hermite solution',()=>{
  const m=unloaded('fixed');m.items[0].rotationMrad=2;
  const a=solveStudy(m),EI=sectionProperties(m.section).EI,L=m.length,theta=.002;
  near(a.reactions[0].force,6*EI*theta/L**2);
  near(a.reactions[1].force,-6*EI*theta/L**2);
  near(a.reactions[0].moment,4*EI*theta/L);
  near(a.reactions[1].moment,2*EI*theta/L);
  for(const x of [0,1.1,3.7,5,8.9,10]) {
    const z=x/L,s=a.sample(x);
    near(s.v,L*theta*(z-2*z*z+z**3));
    near(s.theta,theta*(1-4*z+3*z*z));
    near(s.M,EI*theta/L*(-4+6*z));
  }
  near(audit(m,a).energy.strainEnergy_kNm,.056);
  assert.ok(audit(m,a).checks.every(c=>c.pass));
  assert.equal(a.hasSupportRotation,true);
});

test('free cantilever follows a rigid prescribed displacement and rotation without spurious stress',()=>{
  const m=unloaded('cantilever');m.items[0].settlementMm=-3;m.items[0].rotationMrad=2;
  const a=solveStudy(m);
  near(a.sample(10).v,.017);near(a.sample(10).theta,.002);
  near(a.reactions[0].force,0);near(a.reactions[0].moment,0);
  near(a.peakM.M,0);assert.equal(audit(m,a).pass,true);
});

test('prescribed rotations reject non-fixed supports and non-finite or excessive input',()=>{
  for(const value of [NaN,Infinity,101,-101]) {const m=unloaded('fixed');m.items[0].rotationMrad=value;assert.throws(()=>validateStudy(m));}
  const m=unloaded('simple');m.items[0].rotationMrad=1;assert.throws(()=>validateStudy(m),/fixed/i);
});

test('rotation is preserved by model JSON and shared snapshots',()=>{
  const m=unloaded('fixed');m.items[0].rotationMrad=-1.25;
  const exp=load('studio/export');
  const restored=exp.fromSnapshot(exp.snapshotCode(m));
  near(restored.items[0].rotationMrad,-1.25);
  near(solveStudy(restored).sample(4).v,solveStudy(m).sample(4).v);
});

test('moving cantilever uses the independently integrated stepped EI flexibility',()=>{
  const m=unloaded('cantilever');const section={...m.section,I:m.section.I*2};
  m.sectionRegions=[{id:'root',label:'Stiffer root',x:0,end:5,section}];
  const r=prepareMoving(m).solve([{x:10,value:50}]);
  // Integral P * (L-x)^2/EI(x) dx; root half is twice the base EI.
  const EI=sectionProperties(m.section).EI;
  near(r.sample(10).v,-50/EI*((1000-125)/6+125/3));
  near(r.reactions[0].force,50);near(r.reactions[0].moment,500);
});

test('moving variable-section engine agrees with event-aligned static solves, including both sides',()=>{
  for(const key of ['continuous','gerber','fixed']) {
    const m=unloaded(key);
    m.sectionRegions=[{id:'s',label:'Stiffer span',x:0,end:2.5,section:{...m.section,I:m.section.I*1.7,E:150}}];
    m.stiffnessRegions=[{id:'ei',label:'EI zone',x:3,end:4,factor:.8}];
    const before=canonical(m),p=prepareMoving(m);
    for(const z of [0,1.17,2.5,3.5,5,m.length]) {
      const a=p.solve([{x:z,value:13}]),n=clone(m);
      n.items.push({...makeItem('point',z,undefined,13),caseId:'base'});
      const b=solveStudy(n);
      for(const x of [0,2.5,3,4,5,m.length]) for(const side of ['left','right']) {
        const av=a.sample(x,side),bv=b.sample(x,side);
        for(const field of ['V','M','v','theta']) near(av[field],bv[field],1e-7);
      }
      a.reactions.forEach((r,i)=>{near(r.force,b.reactions[i].force);near(r.moment,b.reactions[i].moment);});
    }
    assert.equal(canonical(m),before);
  }
});

test('moving increments exclude prescribed movements; optional base includes them exactly once',async()=>{
  const m=unloaded('fixed');m.items[0].rotationMrad=1;m.items[1].settlementMm=-2;
  const zero=prepareMoving(m).solve([]);near(zero.sample(4).v,0);near(zero.sample(4).M,0);
  const c={steps:20,station:4,axles:[{offset:0,force:0}]};
  const incremental=await envelope(m,{...c,includeBase:false});
  const combined=await envelope(m,{...c,includeBase:true}),a=solveStudy(m);
  for(const row of incremental.rows) for(const k of ['V','M','v']) {near(row[k].min,0);near(row[k].max,0);}
  for(const row of combined.rows) for(const k of ['V','M','v']) {const value=a.sample(row.x,row.side)[k]*(k==='v'?1000:1);near(row[k].min,value);near(row[k].max,value);}
});

test('influence ordinates are increments, not the response to imposed movement',async()=>{
  const m=unloaded('fixed');const c={steps:20,station:3,target:'M'};
  const a=await influenceLine(m,c);m.items[0].rotationMrad=3;
  const b=await influenceLine(m,c);assert.deepEqual(plain(a.data),plain(b.data));
});

for(const shape of ['rectangle','box','i','circle','tube','custom']) test(`section properties for ${shape} retain correct units and explicit availability`,()=>{
  const s={...defaultSection,shape},p=sectionProperties(s),d=sectionDetails(s);
  near(d.A,p.A*1e6);near(d.Ix,p.I*1e12);near(d.elasticX,d.Ix/(s.h/2));near(d.rx,Math.sqrt(d.Ix/d.A));
  if(shape==='custom') {assert.equal(d.Iy,null);assert.equal(d.plasticX,null);assert.match(d.source,/User-entered/);}
  else {assert.ok(d.Iy>0&&d.plasticX>0);near(d.ry,Math.sqrt(d.Iy/d.A));}
  if(['circle','tube'].includes(shape)) {const di=shape==='tube'?s.h-2*s.t:0;near(d.A,Math.PI*(s.h**2-di**2)/4);near(d.Ix,Math.PI*(s.h**4-di**4)/64);near(d.torsionJ,2*d.Ix);near(d.plasticX,(s.h**3-di**3)/6);}
  else assert.equal(d.torsionJ,null);
});

test('circular tubes reject invalid wall thickness',()=>{
  assert.throws(()=>sectionProperties({...defaultSection,shape:'tube',h:40,t:20}),/half/i);
});

test('interactive rectangle fibres match independent bending and elementary shear formulas',()=>{
  const m=normalise(example('simple'));m.section.shape='rectangle';
  const a=solveStudy(m),before=canonical(m);
  near(fibreResponse(a,2,1).sigma,-7.5);near(fibreResponse(a,2,-1).sigma,7.5);
  near(fibreResponse(a,2,0).sigma,0);near(fibreResponse(a,2,0).tau,.28125);
  near(fibreResponse(a,2,1).tau,0);near(fibreResponse(a,2,-1).tau,0);
  assert.match(renderFibre(m,a,2,1),/compression/);
  assert.equal(canonical(m),before);
});

test('fibre inspection resolves the selected side of a true section boundary',()=>{
  const m=normalise(example('simple'));
  m.sectionRegions=[{id:'s',label:'Left half',x:0,end:5,section:{...m.section,I:2*m.section.I}}];
  const a=solveStudy(m),left=fibreResponse(a,5,1,'left'),right=fibreResponse(a,5,1,'right');
  near(left.M,right.M);near(2*left.sigma,right.sigma);
  assert.equal(left.local.regionLabel,'Left half');
  assert.equal(right.tau,null);
});

test('stress explorer refuses EI-only inference and out-of-domain fibres',()=>{
  const m=normalise(example('simple'));m.stiffnessRegions=[{id:'ei',label:'Override',x:2,end:4,factor:2}];
  const a=solveStudy(m);assert.equal(fibreResponse(a,3).available,false);
  for(const [x,y] of [[-1,0],[11,0],[2,1.01],[NaN,0],[2,Infinity]])assert.throws(()=>fibreResponse(a,x,y));
  assert.throws(()=>fibreResponse(a,2,0,'average'));
});

for(const level of ['year1','year2','year3','all']) test(`${level} workflow separates destinations without touching an edited beam`,()=>{
  const m=normalise(example('simple'));m.items[2].value=7.6;
  const before=canonical(m),v={level,tab:'build',workspaceMode:'analysis',selected:new Set(),session:null,moving:{}};
  for(const target of ['build','analyse','learn','review']) {
    const next=workflow.transition(v,target);assert.ok(next);Object.assign(v,next);
    assert.equal(workflow.phaseFor(v),target);
    assert.equal((workflow.renderNavigation(v).match(/aria-current=/g)||[]).length,1);
    if(target==='analyse') assert.doesNotThrow(()=>toolsPanel(m,v));
    if(target==='review') {const content=review.render(m,solveStudy(m),v);assert.match(content,/Numerical/);assert.match(content,/not/i);}
  }
  assert.equal(canonical(m),before);assert.equal(workflow.transition(v,'unknown'),null);
});

test('active learning and review sessions cannot be abandoned by navigation',()=>{
  for(const session of [{active:true},{review:true}]) for(const target of ['build','analyse','review'])assert.equal(workflow.transition({session},target),null);
  assert.ok(workflow.transition({session:{active:true}},'learn'));
});

test('portable progress round-trips known activities and excludes models, levels and sessions',()=>{
  const lesson=listLessons('year1')[0],topic=topicForTask('lesson',lesson.id);
  const state=transfer.create({[lesson.id]:true},{},{[topic]:{attempts:2,firstAttempts:1,firstCorrect:0,correct:1,reveals:0,lastAt:100}},[]);
  const copy=transfer.parse(JSON.stringify({...state,model:{length:999},level:'all',session:{active:true}}));
  assert.deepEqual(plain(transfer.summary(copy)),{lessons:1,challenges:0,topics:1,events:0});
  assert.equal(copy.model,undefined);assert.equal(copy.level,undefined);assert.equal(copy.session,undefined);
  assert.equal(copy.mastery[topic].attempts,2);
});

test('portable progress rejects corrupt files, unknown tasks, inconsistent counters and oversized history',()=>{
  const base=()=>({format:'BeamLabLearning',schema:1,lessons:{},challenges:{},mastery:{},events:[]});
  for(const data of [{...base(),schema:2},{...base(),lessons:{unknown:true}},{...base(),challenges:[]},{...base(),events:Array(25).fill({})},{...base(),events:[{event:'made-up',timestamp:1}]}])assert.throws(()=>transfer.parse(JSON.stringify(data)));
  const topic=topicForTask('lesson',listLessons('year1')[0].id);
  for(const stat of [{attempts:-1},{attempts:1,correct:2},{attempts:1,firstAttempts:2},{attempts:NaN},{attempts:1.5}])assert.throws(()=>transfer.validate({...base(),mastery:{[topic]:stat}}));
  assert.throws(()=>transfer.parse('{invalid'));assert.throws(()=>transfer.parse(' '.repeat(100001)));
});
