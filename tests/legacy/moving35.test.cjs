'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {prepareMoving,influenceLine,envelope,envelopeCsv,validateConfig}=require('../../src/engine/moving');
const {shearProfile}=require('../../src/engine/shear');
const {example,makeItem}=require('../../src/model/examples');
const {normalise,solveStudy,clone}=require('../../src/model/study');
const {sectionProperties}=require('../../src/model/sections');
const near=(a,b,abs=1e-8,rel=1e-7)=>assert.ok(Math.abs(a-b)<=abs+rel*Math.abs(b),`${a} != ${b}`);
const model=key=>normalise(example(key));
const clean=m=>({...m,selfWeight:false,items:m.items.filter(i=>!['point','udl','variable','moment'].includes(i.kind))});
const config={target:'M',station:5,steps:60,includeBase:false,axles:[{offset:0,force:20}]};
for(let j=0;j<=40;j++)test(`Fixed-topology kernel versus closed-form beam / point ${j}`,()=>{
 const m=model('simple'),P=20,z=j/4,a=prepareMoving(m).solve([{x:z,value:P}]),EI=70000,L=10;
 near(a.reactions[0].force,P*(L-z)/L);near(a.reactions[1].force,P*z/L);
 for(const x of [0,1.3,3,5,8.7,10]){
  const M=P*Math.min(x,z)*(L-Math.max(x,z))/L;
  const v=x<=z?-P*(L-z)*x/(6*L*EI)*(L*L-(L-z)**2-x*x):-P*z*(L-x)/(6*L*EI)*(L*L-z*z-(L-x)**2);
  near(a.sample(x).M,M);near(a.sample(x).v,v);near(a.sample(x).v,prepareMoving(m).solve([{x,value:P}]).sample(z).v);
 }
});
let seed=0x51c0ffee;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
const types=['simple','overhang','cantilever','continuous','gerber','suspended','fixed','triangle'];
for(let n=0;n<128;n++)test(`Independent load formulations agree / seeded model ${n}`,()=>{
 const key=types[n%types.length],m=clean(model(key)),forces=Array.from({length:1+n%4},()=>({x:(.03+.94*rand())*m.length,value:(rand()-.3)*160}));
 const p=prepareMoving(m).solve(forces),f=clone(m);forces.forEach(q=>f.items.push({...makeItem('point',q.x,undefined,q.value),caseId:'base'}));
 const b=solveStudy(f);
 p.reactions.forEach((r,i)=>{near(r.force,b.reactions[i].force,2e-5);near(r.moment,b.reactions[i].moment,2e-5);});
 for(let j=0;j<=16;j++){const x=m.length*j/16;for(const k of ['V','M','v','theta'])near(p.sample(x)[k],b.sample(x)[k],2e-5,2e-6);}
 for(const h of m.items.filter(i=>i.kind==='hinge')){near(p.sample(h.x,'left').M,0,1e-7);near(p.sample(h.x).M,0,1e-7);near(p.sample(h.x,'left').v,p.sample(h.x).v,1e-8);}
 near(p.forceResidual,0,1e-7);near(p.momentResidual,0,1e-6);
});
test('Unit reaction influence excludes nominal loads and self-weight',async()=>{
 const m=model('simple');m.selfWeight=true;m.cases[0].factor=2;
 const before=JSON.stringify(m),r=await influenceLine(m,{...config,target:'reaction',supportId:m.items[1].id});
 for(const p of r.data)near(p.value,p.z/10);assert.equal(JSON.stringify(m),before);
});
test('Moment and displacement influence closed forms at midspan',async()=>{
 const m=model('simple');const r=await influenceLine(m,config);for(const p of r.data)near(p.value,Math.min(p.z,10-p.z)/2);
 near(r.max.value,2.5);near(r.max.z,5);const d=await influenceLine(m,{...config,target:'v'});near(d.min.value,-1000/(48*70000)*1000);
});
test('Shear influence preserves the one-sided unit jump',async()=>{
 const m=model('simple'),r=await influenceLine(m,{...config,target:'V',station:3});
 for(const p of r.data)near(p.value,1-p.z/10-(p.z<=3?1:0),1e-7);
 const before=r.data.find(p=>p.z<3&&p.z>2.99999),after=r.data.find(p=>p.z>3&&p.z<3.00001);
 near(after.value-before.value,1,1e-6);
});
test('Near-support moving forces do not create ill-conditioned small elements',()=>{
 for(const x of [1e-9,5-1e-9,5+1e-9,10-1e-9]){const a=prepareMoving(model('continuous')).solve([{x,value:10}]);near(a.forceResidual,0,1e-7);near(a.momentResidual,0,1e-7);}
});
test('Cantilever unit tip displacement influence and force at support',async()=>{
 const m=model('cantilever'),r=await influenceLine(m,{...config,target:'v',station:10});
 for(const q of r.data)near(q.value,-q.z*q.z*(30-q.z)/(6*70000)*1000);
 near(prepareMoving(m).solve([{x:0,value:20}]).sample(5).M,0);
});
test('Single-axle envelope matches analytic pointwise moment and shear bounds',async()=>{
 const m=model('simple'),r=await envelope(m,config);near(r.extrema.M.max,50);near(r.extrema.v.min,-20*1000/(48*70000)*1000);
 for(const row of r.rows){near(row.M.max,20*row.x*(10-row.x)/10);near(row.M.min,0,1e-7);if(row.x>0&&row.x<10){near(row.V.min,-20*row.x/10,1e-5);near(row.V.max,20*(1-row.x/10),1e-5);}}
 const csv=envelopeCsv(r).split('\n');assert.equal(csv.length,r.rows.length+1);assert.equal(csv[1].split(',').length,14);
});
test('Tandem envelope contains correct section max and its replay',async()=>{
 const m=model('simple'),c={...config,station:3,axles:[{offset:0,force:20},{offset:2,force:20}]},r=await envelope(m,c);
 const row=r.rows.find(p=>p.x===3);near(row.M.max,72);near(row.M.min,0);const a=prepareMoving(m).solve(c.axles.map(q=>({x:row.M.maxAt-q.offset,value:q.force})));near(a.sample(3).M,row.M.max);
 // For the whole 10 m beam, the maximum occurs under an axle at x=4.5 or 5.5.
 near(r.extrema.M.max,81);
});
test('Positive and negative axles, all-off base and active factors are superposed once',async()=>{
 const m=model('simple');m.cases[0].factor=2;m.selfWeight=true;
 const baseline=solveStudy(m),before=JSON.stringify(m);
 const c={...config,includeBase:true,axles:[{offset:0,force:20},{offset:2,force:-7}]};
 const r=await envelope(m,c),p=prepareMoving(m);
 for(const row of r.rows.filter((_,i)=>i%8===0))for(const k of ['V','M','v'])for(const type of ['min','max']){
   const z=row[k][type+'At'];const a=p.solve(c.axles.map(q=>({x:z-q.offset,value:q.force})));near(row[k][type],(a.sample(row.x,row.side)[k]+baseline.sample(row.x,row.side)[k])*(k==='v'?1000:1));
 }
 assert.equal(JSON.stringify(m),before);
});
test('Travel refinement preserves/coarsens bounds monotonically at same stations',async()=>{
 const m=model('continuous'),c={...config,axles:[{offset:0,force:20},{offset:1.7,force:30}]};const r=await envelope(m,c),f=await envelope(m,{...c,steps:120});
 r.rows.forEach((row,i)=>{for(const k of ['V','M','v']){assert.ok(f.rows[i][k].max>=row[k].max-1e-8);assert.ok(f.rows[i][k].min<=row[k].min+1e-8);}});
});
test('Cancelled scan produces no partial complete result',async()=>{
 const controller=new AbortController();let calls=0;
 await assert.rejects(envelope(model('simple'),config,{signal:controller.signal,progress:()=>{calls++;controller.abort();}}),/cancelled/);assert.ok(calls>0);
});
test('Input guardrails reject invalid offsets, unknown reaction and unstable mechanisms',async()=>{
 const m=model('simple');for(const c of [{...config,steps:0},{...config,station:11},{...config,axles:[{offset:1,force:20}]},{...config,axles:[{offset:0,force:20},{offset:0,force:10}]}])assert.throws(()=>validateConfig(m,c));
 await assert.rejects(influenceLine(m,{...config,target:'reaction',supportId:'missing'}),/existing support/);
 const unstable=clean(m);unstable.items=unstable.items.slice(0,1);assert.throws(()=>prepareMoving(unstable));
});
for(const shape of ['rectangle','i'])for(let j=0;j<18;j++)test(`${shape} shear depth force recovery ${j}`,()=>{
 const m=model('simple'),s={...m.section,shape,b:200+j*3,h:400+j*5,t:12,tf:20};const V=(j-8)*17.5,p=shearProfile(s,V);assert.ok(p.supported);near(p.recoveredForce,V);near(p.at(s.h/2).tau,0);near(p.at(-s.h/2).tau,0);
 for(const y of [-s.h*.31,0,s.h*.31])near(p.at(y).tau,p.at(-y).tau);
 if(shape==='rectangle')near(Math.abs(p.peak.tau),1.5*Math.abs(V)*1000/(s.b*s.h));
 else{const hf=s.h/2-s.tf,Q=s.b*s.tf*(s.h/2-s.tf/2)+s.t*hf*hf/2;near(p.at(0).tau,V*1000*Q/(sectionProperties(s).I*1e12*s.t));}
});
test('Unsupported shear geometries do not fabricate a result',()=>{
 const s=model('simple').section;assert.equal(shearProfile(s,10).supported,false);assert.equal(shearProfile({...s,shape:'box'},10).supported,false);assert.equal(shearProfile({...s,shape:'i',catalogue:'a named product'},10).supported,false);assert.throws(()=>shearProfile({...s,shape:'i'},NaN));
});

test('Requested envelope observation station is retained exactly',async()=>{
 const m=model('simple'),station=3.137,r=await envelope(m,{...config,station});
 const row=r.rows.find(p=>p.x===station);assert.ok(row);near(row.M.max,20*station*(10-station)/10);
});
