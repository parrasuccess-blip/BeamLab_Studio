"use strict";
Object.defineProperty(exports,"__esModule",{value:true});
exports.lessonSets=exports.challengeSets=void 0;
exports.listChallenges=listChallenges;
exports.getChallenge=getChallenge;
exports.answerFor=answerFor;
exports.checkAnswer=checkAnswer;
exports.listLessons=listLessons;
exports.getLesson=getLesson;
exports.predictionFor=predictionFor;
exports.checkPrediction=checkPrediction;
exports.sketchReference=sketchReference;
exports.checkSketch=checkSketch;
exports.topicForTask=topicForTask;
exports.updateMastery=updateMastery;
exports.masteryScore=masteryScore;
exports.sessionPlan=sessionPlan;
exports.explainAt=explainAt;
const study_1=require("../model/study");
const y1=[
 {id:'y1-reaction',title:'Centre-load reactions',example:'reference',prompt:'What is the vertical reaction at Support A?',target:'reaction:0',unit:'kN'},
 {id:'y1-moment',title:'UDL peak moment',example:'simple',prompt:'What is the maximum absolute bending moment?',target:'peakM',unit:'kN m'},
 {id:'y1-cantilever',title:'Cantilever fixed-end moment',example:'cantilever',prompt:'What is the magnitude of the fixed-end reaction moment?',target:'reactionMoment:0',unit:'kN m'}
];
const y2=[
 {id:'y2-continuous',title:'Continuous-beam reaction',example:'continuous',prompt:'What is the vertical reaction at the middle support B?',target:'reaction:1',unit:'kN'},
 {id:'y2-triangle',title:'Triangular-load moment',example:'triangle',prompt:'What is the maximum absolute bending moment?',target:'peakM',unit:'kN m'},
 {id:'y2-fixed-deflection',title:'Fixed-ended deflection',example:'fixed',prompt:'What is the maximum absolute vertical deflection?',target:'peakDmm',unit:'mm'}
];
const y3=[
 {id:'y3-suspended',title:'Suspended-span reaction',example:'suspended',prompt:'What is the vertical reaction at Support B?',target:'reaction:1',unit:'kN'},
 {id:'y3-gerber',title:'Gerber peak moment',example:'gerber',prompt:'What is the maximum absolute bending moment?',target:'peakM',unit:'kN m'},
 {id:'y3-overhang',title:'Overhang peak shear',example:'overhang',prompt:'What is the maximum absolute shear force?',target:'peakV',unit:'kN'}
];
exports.challengeSets={year1:y1,year2:y2,year3:y3,all:y3};
function listChallenges(level){return exports.challengeSets[level]||y1;}
function getChallenge(id){for(const set of Object.values(exports.challengeSets)){const hit=set.find(x=>x.id===id);if(hit)return hit;}return null;}
function answerFor(spec,a){
 if(!spec||!a)throw new Error('A valid challenge and solved model are required.');
 const [kind,indexText]=String(spec.target).split(':'); const index=Number(indexText||0); let value;
 if(kind==='reaction')value=a.reactions[index]?.force;
 else if(kind==='reactionMoment')value=Math.abs(a.reactions[index]?.moment);
 else if(kind==='peakM')value=Math.abs(a.peakM.M);
 else if(kind==='peakV')value=Math.abs(a.peakV.V);
 else if(kind==='peakDmm')value=Math.abs(a.peakD.v)*1000;
 else throw new Error('Unknown challenge target.');
 if(!Number.isFinite(value))throw new Error('Challenge target is unavailable for this model.');
 return value;
}
function checkAnswer(spec,guess,a){
 if(!Number.isFinite(guess))throw new Error('Enter a finite numerical answer.');
 const expected=answerFor(spec,a); const tolerance=Math.max(0.02,Math.abs(expected)*0.01); const error=Math.abs(guess-expected);
 return {correct:error<=tolerance,expected,tolerance,error};
}

const lessonsYear1=[
 {id:'l1-point-shear',title:'Point load → shear jump',tag:'SFD',example:'reference',target:'V',summary:'A concentrated vertical force changes shear instantly at its position.',concept:'Before the point load, the left reaction holds shear positive. Crossing a downward point load makes the SFD jump downward by that force.',recap:'The jump size equals the concentrated force. The beam has +10 kN shear before the 20 kN load and -10 kN after it.',predict:{kind:'pointShear',prompt:'Which shear-force shape should the centre-loaded bridge produce?',choices:[['step-down','Constant +V, then a downward jump to constant -V'],['linear-down','One straight sloping line from +V to -V'],['parabola-up','A smooth curved arch']]},revealStep:2},
 {id:'l1-udl-shear',title:'UDL → sloping shear',tag:'SFD',example:'simple',target:'V',summary:'Uniform distributed loading changes shear continuously instead of in one jump.',concept:'A constant downward load intensity removes the same amount of shear per metre, so the SFD becomes a straight descending line.',recap:'Under a constant UDL, shear varies linearly because the load intensity is constant.',predict:{kind:'udlShear',prompt:'What should the SFD look like between the supports?',choices:[['horizontal','Horizontal / constant shear'],['linear-down','Straight line sloping downward'],['curved-down','Curved line with changing slope']]},revealStep:2},
 {id:'l1-shear-moment',title:'Shear → moment slope',tag:'BMD',example:'reference',target:'M',summary:'Shear tells you whether the bending-moment diagram is rising or falling.',concept:'Positive shear makes moment rise. Negative shear makes moment fall. For a centre point load those two straight slopes meet at midspan.',recap:'The BMD is triangular and reaches its positive maximum where shear changes from positive to negative.',predict:{kind:'pointMoment',prompt:'Which bending-moment shape matches the centre-loaded bridge?',choices:[['triangle-up','A triangular sagging diagram peaking at midspan'],['parabola-up','A smooth parabolic sagging curve'],['hogging-support','A negative hogging valley at midspan']]},revealStep:3}
];
const lessonsYear2=[
 {id:'l2-continuous-moment',title:'Continuity creates hogging',tag:'BMD',example:'continuous',target:'M',summary:'An internal support in a continuous beam can carry non-zero bending moment.',concept:'Continuity restrains rotation across the middle support, so compatibility creates a hogging region even though the support itself is a roller.',recap:'A simple support at an internal point does not force M=0 when the beam is continuous through it.',predict:{kind:'continuousMoment',prompt:'What key feature should appear around the middle support?',choices:[['sagging-only','Positive sagging only across both spans'],['hogging-support','A negative hogging region over the middle support'],['zero-every-support','Moment forced to zero at every support']]},revealStep:3},
 {id:'l2-deflection',title:'Moment → curvature → deflection',tag:'DEFLECTION',example:'simple',target:'v',summary:'The same bending moment that creates stress also curves the member.',concept:'With constant EI, bending moment controls curvature. The simply supported UDL beam therefore bows downward most strongly near midspan.',recap:'Changing E or I changes deformation without changing statically determinate reactions.',predict:{kind:'simpleDeflection',prompt:'Which qualitative deformed shape should appear?',choices:[['sag-down','Smooth downward sag with zero support displacement'],['rise-up','Smooth upward arch'],['kink-mid','A sharp displacement kink at midspan']]},revealStep:4},
 {id:'l2-hinge-release',title:'Internal hinge → M = 0',tag:'HINGE',example:'gerber',target:'M',summary:'An internal hinge transfers force but releases bending moment.',concept:'Vertical displacement stays compatible through the hinge, while the two sides can rotate relative to one another.',recap:'The bending-moment diagram must pass through zero at the hinge. The slope of the deflected shape may change there.',predict:{kind:'hingeMoment',prompt:'What must the BMD do at the internal hinge?',choices:[['zero-hinge','Pass exactly through M = 0'],['nonzero-hinge','Keep a non-zero moment through the hinge'],['jump-hinge','Jump vertically because of the hinge alone']]},revealStep:3}
];
const lessonsYear3=[
 {id:'l3-variable-shear',title:'Variable load → curved shear',tag:'ADVANCED SFD',example:'triangle',target:'V',summary:'When load intensity changes linearly, shear no longer has a constant slope.',concept:'A triangular distributed load has linearly varying w(x). Integrating that loading gives a quadratic shear curve.',recap:'The local relation dV/dx = -w means a linearly varying load produces curved shear.',predict:{kind:'variableShear',prompt:'What qualitative SFD should the triangular load produce?',choices:[['linear-down','A straight descending line'],['curved-down','A curved descending line with changing slope'],['horizontal','A horizontal constant line']]},revealStep:2},
 {id:'l3-fixed-restraint',title:'Restraint redistributes moment',tag:'BMD',example:'fixed',target:'M',summary:'Fixed ends restrain rotation and therefore develop reaction moments.',concept:'Compatibility changes the moment field: hogging develops at the fixed ends while positive sagging can remain in the span.',recap:'The end moments come from rotational restraint, not from an externally applied couple.',predict:{kind:'fixedMoment',prompt:'What should the fixed-ended UDL BMD show?',choices:[['fixed-hogging','Hogging at both fixed ends with sagging in the span'],['sagging-only','Only positive sagging moment'],['zero-every-support','Zero moment at both fixed supports']]},revealStep:3},
 {id:'l3-suspended-hinge',title:'Suspended span releases moment',tag:'GERBER',example:'suspended',target:'M',summary:'Multiple internal hinges make a longer system statically determinate in segments.',concept:'Each internal hinge enforces zero moment while preserving vertical displacement compatibility between connected pieces.',recap:'The BMD is constrained to zero at both hinges even though forces continue through the system.',predict:{kind:'multiHingeMoment',prompt:'What condition must hold at both internal hinges?',choices:[['zero-hinge','M = 0 at each hinge'],['nonzero-hinge','The same non-zero moment passes through'],['jump-hinge','Moment jumps at every hinge']]},revealStep:3}
];
exports.lessonSets={year1:lessonsYear1,year2:lessonsYear2,year3:lessonsYear3,all:lessonsYear3};
function listLessons(level){return exports.lessonSets[level]||lessonsYear1;}
function getLesson(id){for(const set of Object.values(exports.lessonSets)){const hit=set.find(x=>x.id===id);if(hit)return hit;}return null;}
function effective(m){try{return (0,study_1.effectiveModel)(m);}catch{return m;}}
function predictionFor(spec,a,m){
 if(!spec?.predict||!a||!m)throw new Error('A solved lesson model is required.');
 const actual=effective(m), kind=spec.predict.kind, L=m.length, eps=Math.max(1e-6,L*1e-7);
 if(kind==='pointShear'){
   const p=actual.items.find(i=>i.kind==='point'); if(!p)throw new Error('Point load not found.');
   const left=a.sample(Math.max(0,p.x-eps),'left').V, right=a.sample(Math.min(L,p.x+eps),'right').V;
   return right<left?'step-down':'step-up';
 }
 if(kind==='udlShear'){
   const q=actual.items.find(i=>i.kind==='udl'); if(!q)throw new Error('Uniform load not found.');
   return q.value>=0?'linear-down':'linear-up';
 }
 if(kind==='pointMoment') return a.peakM.M>=0?'triangle-up':'triangle-down';
 if(kind==='continuousMoment'){
   const supports=actual.items.filter(i=>['pin','roller','fixed'].includes(i.kind)).sort((x,y)=>x.x-y.x);
   const mid=supports.length>2?supports[Math.floor(supports.length/2)]:null;
   return mid&&a.sample(mid.x).M< -1e-7?'hogging-support':'sagging-only';
 }
 if(kind==='simpleDeflection') return a.peakD.v<=0?'sag-down':'rise-up';
 if(kind==='hingeMoment'||kind==='multiHingeMoment'){
   const hinges=actual.items.filter(i=>i.kind==='hinge');
   return hinges.length&&hinges.every(h=>Math.abs(a.sample(h.x).M)<1e-6)?'zero-hinge':'nonzero-hinge';
 }
 if(kind==='variableShear'){
   const q=actual.items.find(i=>i.kind==='variable'); if(!q)throw new Error('Variable load not found.');
   return Math.abs((q.endValue??q.value)-q.value)>1e-9?'curved-down':'linear-down';
 }
 if(kind==='fixedMoment'){
   const supports=actual.items.filter(i=>i.kind==='fixed');
   if(supports.length<2)return 'sagging-only';
   const left=a.sample(supports[0].x).M, right=a.sample(supports[supports.length-1].x,'left').M;
   return left< -1e-7&&right< -1e-7?'fixed-hogging':'sagging-only';
 }
 throw new Error('Unknown lesson prediction.');
}
function checkPrediction(spec,choice,a,m){
 const expected=predictionFor(spec,a,m);
 return {correct:String(choice||'')===expected,expected};
}
function sketchValue(spec,a,m,x){
 const side=x>=m.length-1e-9?'left':'right', s=a.sample(Math.max(0,Math.min(m.length,x)),side);
 if(spec.target==='V')return s.V;
 if(spec.target==='M')return s.M;
 if(spec.target==='v')return s.v;
 throw new Error('This lesson does not have a drawable response.');
}
function sketchReference(spec,a,m,count=81){
 if(!spec||!a||!m)throw new Error('A solved lesson model is required.');
 count=Math.max(21,Math.min(161,Number(count)||81));
 const raw=Array.from({length:count},(_,i)=>({x:i/(count-1),y:sketchValue(spec,a,m,m.length*i/(count-1))}));
 const peak=Math.max(1e-12,...raw.map(p=>Math.abs(p.y)));
 return raw.map(p=>({x:p.x,y:p.y/peak}));
}
function prepareSketch(points){
 const clean=(Array.isArray(points)?points:[]).filter(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)).map(p=>({x:Math.max(0,Math.min(1,p.x)),y:Math.max(-1.5,Math.min(1.5,p.y))}));
 if(clean.length<6)return {points:clean,coverage:0};
 clean.sort((a,b)=>a.x-b.x);
 const merged=[];
 for(const p of clean){
   if(merged.length&&Math.abs(p.x-merged[merged.length-1].x)<.001)merged[merged.length-1]=p;
   else merged.push(p);
 }
 return {points:merged,coverage:merged[merged.length-1].x-merged[0].x};
}
function sketchInterp(points,x){
 if(!points.length)return 0;
 if(x<=points[0].x)return points[0].y;
 if(x>=points[points.length-1].x)return points[points.length-1].y;
 let lo=0,hi=points.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(points[mid].x<=x)lo=mid;else hi=mid;}
 const a=points[lo],b=points[hi],t=(x-a.x)/Math.max(1e-9,b.x-a.x);
 return a.y+(b.y-a.y)*t;
}
function smooth(values){
 return values.map((v,i,a)=>{let s=0,n=0;for(let j=Math.max(0,i-1);j<=Math.min(a.length-1,i+1);j++){s+=a[j];n++;}return s/n;});
}
function clamp01(v){return Math.max(0,Math.min(1,v));}
function checkSketch(spec,points,a,m){
 const prepared=prepareSketch(points), ref=sketchReference(spec,a,m,81);
 if(prepared.points.length<6||prepared.coverage<.65)return {correct:false,ready:false,score:0,shape:0,slope:0,sign:0,conditions:0,coverage:prepared.coverage,tips:['Draw one continuous prediction across most of the member before checking.']};
 const userRaw=ref.map(p=>sketchInterp(prepared.points,p.x));
 const userPeak=Math.max(1e-9,...userRaw.map(Math.abs));
 const user=smooth(userRaw.map(y=>y/userPeak)), target=smooth(ref.map(p=>p.y));
 const rmse=Math.sqrt(user.reduce((s,y,i)=>s+(y-target[i])**2,0)/user.length);
 const shape=clamp01(1-rmse/.72);
 let signN=0,signOK=0;
 for(let i=0;i<target.length;i++)if(Math.abs(target[i])>.12){signN++;if(user[i]*target[i]>0)signOK++;}
 const sign=signN?signOK/signN:1;
 const du=user.slice(1).map((y,i)=>y-user[i]), dr=target.slice(1).map((y,i)=>y-target[i]);
 const duScale=Math.max(.01,...du.map(Math.abs)), drScale=Math.max(.01,...dr.map(Math.abs));
 const ndU=du.map(x=>x/duScale), ndR=dr.map(x=>x/drScale);
 const drmse=Math.sqrt(ndU.reduce((s,y,i)=>s+(y-ndR[i])**2,0)/Math.max(1,ndU.length));
 const slope=clamp01(1-drmse/.9);
 const conditionXs=[];
 const addCondition=x=>{if(!conditionXs.some(v=>Math.abs(v-x)<1e-5))conditionXs.push(x);};
 if(Math.abs(ref[0].y)<.08)addCondition(0);
 if(Math.abs(ref[ref.length-1].y)<.08)addCondition(1);
 const actual=effective(m);
 if(spec.target==='M')actual.items.filter(i=>i.kind==='hinge').forEach(i=>addCondition(i.x/m.length));
 if(spec.target==='v')actual.items.filter(i=>['pin','roller','fixed'].includes(i.kind)).forEach(i=>addCondition(i.x/m.length));
 let conditions=1;
 if(conditionXs.length){
   conditions=conditionXs.reduce((s,x)=>s+clamp01(1-Math.abs(sketchInterp(prepared.points,x)/userPeak)/.35),0)/conditionXs.length;
 }
 const score=clamp01(.4*shape+.25*slope+.25*sign+.1*conditions);
 const tips=[];
 if(sign<.78)tips.push('Check which regions should be positive and which should be negative relative to the zero axis.');
 if(conditions<.68)tips.push('Check the zero or support/hinge boundary conditions before changing the curve between them.');
 if(slope<.62)tips.push('Check whether each region should be flat, straight or curved, and where its slope changes.');
 if(shape<.62)tips.push('The overall profile differs from the calculated response; focus on where peaks, valleys and jumps occur.');
 if(!tips.length&&score<.72)tips.push('Your idea is close. Refine the peak locations and the transition between neighbouring regions.');
 const correct=score>=.72&&sign>=.72&&conditions>=.52;
 if(correct)tips.push('Good structural shape. BeamLab ignores your drawing scale and checks the qualitative response features.');
 return {correct,ready:true,score,shape,slope,sign,conditions,coverage:prepared.coverage,tips:tips.slice(0,3)};
}
const masteryTopicMap={
 'l1-point-shear':'Point loads & shear','l1-udl-shear':'Distributed loads & shear','l1-shear-moment':'Shear → moment','y1-reaction':'Reactions & equilibrium','y1-moment':'Simply-supported bending','y1-cantilever':'Cantilever equilibrium',
 'l2-continuous-moment':'Continuity & indeterminacy','y2-continuous':'Continuity & indeterminacy','l2-deflection':'Deflection & stiffness','y2-fixed-deflection':'Deflection & stiffness','l2-hinge-release':'Internal hinges','y2-triangle':'Varying distributed loads',
 'l3-variable-shear':'Varying distributed loads','l3-fixed-restraint':'Fixed-end restraint','l3-suspended-hinge':'Gerber & suspended spans','y3-suspended':'Gerber & suspended spans','y3-gerber':'Gerber & suspended spans','y3-overhang':'Overhang response'
};
function topicForTask(kind,id){return masteryTopicMap[id]||(kind==='lesson'?'Diagram behaviour':'Structural calculation');}
function updateMastery(stat,correct,firstTry){
 const s={attempts:0,correct:0,firstAttempts:0,firstCorrect:0,reveals:0,...(stat||{})};
 s.attempts+=1;if(correct)s.correct+=1;if(firstTry){s.firstAttempts+=1;if(correct)s.firstCorrect+=1;}s.lastAt=Date.now();return s;
}
function masteryScore(stat){
 if(!stat||!(stat.firstAttempts>0))return null;
 const first=stat.firstCorrect/stat.firstAttempts,overall=(stat.correct||0)/Math.max(1,stat.attempts||0);
 return Math.max(0,Math.min(100,Math.round(100*(.7*first+.3*overall))));
}
function sessionPlan(level,stats={},mode='practice'){
 const lessons=listLessons(level).map(spec=>({kind:'lesson',id:spec.id,title:spec.title,topic:topicForTask('lesson',spec.id)}));
 const challenges=listChallenges(level).map(spec=>({kind:'challenge',id:spec.id,title:spec.title,topic:topicForTask('challenge',spec.id)}));
 const rank=t=>{const s=masteryScore(stats?.[t.topic]);return s===null?50:s;};
 const sort=list=>[...list].sort((a,b)=>rank(a)-rank(b)||((stats?.[a.topic]?.attempts||0)-(stats?.[b.topic]?.attempts||0))||a.id.localeCompare(b.id));
 const A=sort(lessons),B=sort(challenges),mixed=[];
 for(let i=0;i<Math.max(A.length,B.length);i++){if(A[i])mixed.push(A[i]);if(B[i])mixed.push(B[i]);}
 return mixed.slice(0,mode==='exam'?Math.min(6,mixed.length):Math.min(4,mixed.length));
}
function intensity(item,x){
 if(!['udl','variable'].includes(item.kind)||x<item.x-1e-9||x>(item.end??item.x)+1e-9)return 0;
 if(item.kind==='udl')return item.value||0;
 const L=(item.end??item.x)-item.x; if(L<=0)return 0;
 return (item.value||0)+((item.endValue ?? item.value ?? 0)-(item.value||0))*(x-item.x)/L;
}
function fmt(n,d=3){if(!Number.isFinite(n))return '--'; const z=Math.abs(n)<.5*10**(-d)?0:n; return z.toFixed(d);}
function explainAt(m,a,x,level='year1') {
 return require('./explanation').explainAt(m,a,x,level);
}
