'use strict';
/**
 * Static moving point-load analysis on a FIXED support/hinge topology.
 * Interior forces use consistent Hermite nodal loads; exact Macaulay terms
 * recover section fields. This differs from the main event-aligned solver and
 * is cross-checked against it. No moving-load DOF is inserted near supports.
 * Units: kN, m, upward displacement in m, CCW rotation in rad.
 */
const { solveSPD } = require('./linear');
const { validateStudy, solveStudy, clone } = require('../model/study');
const { isSupport, isLoad } = require('../model/validation');
const { sectionProperties } = require('../model/sections');
const { sectionAt } = require('../model/section-regions');
const { factorAt } = require('../model/stiffness');

function prepareMoving(study) {
    validateStudy(study);
    const m = clone(study), L = m.length;
    const supports = m.items.filter(i => isSupport(i.kind)).sort((a,b) => a.x-b.x);
    const hinges = m.items.filter(i => i.kind === 'hinge');
    if (!supports.some(i => i.kind === 'fixed' || i.kind === 'pin')) throw new Error('A pin or fixed support is needed.');
    if (supports.length + hinges.length > 16) throw new Error('Moving-load studies support at most 16 supports and hinges together.');
    const positions = [0,L,...supports.map(i=>i.x),...hinges.map(i=>i.x),...(m.sectionRegions||[]).flatMap(r=>[r.x,r.end]),...(m.stiffnessRegions||[]).flatMap(r=>[r.x,r.end])].sort((a,b)=>a-b);
    const xs = positions.filter((x,i)=>!i || x-positions[i-1]>L*1e-10);
    if (xs.some((x,i)=>i && x-xs[i-1]<L*1e-6)) throw new Error('Support/hinge spacing is too small for this moving-load model.');
    const index = x => xs.findIndex(t=>Math.abs(t-x)<L*1e-9);
    let ndof = 0;
    const nodes = xs.map(x=>{
        const v=ndof++, left=ndof++;
        const right=hinges.some(h=>Math.abs(h.x-x)<L*1e-9)?ndof++:left;
        return {v,left,right};
    });
    const p = sectionProperties(m.section);
    const K = Array.from({length:ndof},()=>Array(ndof).fill(0));
    const fixed = new Set();
    supports.forEach(s=>{const n=nodes[index(s.x)];fixed.add(n.v);if(s.kind==='fixed')fixed.add(n.left);});
    const elements = xs.slice(0,-1).map((a,i)=>{
        const b=xs[i+1], l=b-a;
        const EI=sectionProperties(sectionAt(m,(a+b)/2)).EI*factorAt(m.stiffnessRegions||[],(a+b)/2);
        const dofs=[nodes[i].v,nodes[i].right,nodes[i+1].v,nodes[i+1].left];
        const k=[[12,6*l,-12,6*l],[6*l,4*l*l,-6*l,2*l*l],[-12,-6*l,12,-6*l],[6*l,2*l*l,-6*l,4*l*l]].map(row=>row.map(v=>v*EI/l**3));
        dofs.forEach((r,j)=>dofs.forEach((c,h)=>{K[r][c]+=k[j][h];}));
        return {a,b,l,dofs,k,EI};
    });
    const free=Array.from({length:ndof},(_,i)=>i).filter(i=>!fixed.has(i));
    const Kff=free.map(i=>free.map(j=>K[i][j]));
    // A zero RHS still validates positive definiteness (do not regularise a mechanism).
    solveSPD(Kff,free.map(()=>0));
    function solve(forces) {
        if (!Array.isArray(forces)||forces.length>4) throw new Error('Use one to four axle forces.');
        const F=Array(ndof).fill(0), ef=elements.map(()=>[0,0,0,0]), inner=elements.map(()=>[]);
        for (const q of forces) {
            if(!Number.isFinite(q.x)||!Number.isFinite(q.value)||Math.abs(q.value)>100000)throw new Error('Invalid moving force.');
            if(q.x<0||q.x>L)continue;
            const ni=xs.findIndex(x=>Math.abs(x-q.x)<=L*1e-12);
            if(ni>=0) { F[nodes[ni].v]-=q.value;continue; }
            const ei=elements.findIndex(e=>q.x>e.a && q.x<e.b);
            if(ei<0)throw new Error('Cannot locate moving force.');
            const e=elements[ei], t=q.x-e.a, z=t/e.l;
            const N=[1-3*z*z+2*z*z*z,e.l*(z-2*z*z+z*z*z),3*z*z-2*z*z*z,e.l*(-z*z+z*z*z)];
            e.dofs.forEach((di,j)=>{const f=-q.value*N[j];F[di]+=f;ef[ei][j]+=f;});
            inner[ei].push({t,value:q.value});
        }
        const q=solveSPD(Kff,free.map(i=>F[i])), d=Array(ndof).fill(0);
        free.forEach((di,i)=>{d[di]=q[i];});
        const R=K.map((row,i)=>row.reduce((s,v,j)=>s+v*d[j],0)-F[i]);
        const field=elements.map((e,i)=>{
            const de=e.dofs.map(j=>d[j]);
            const r=e.k.map((row,j)=>row.reduce((s,v,h)=>s+v*de[h],0)-ef[i][j]);
            return {...e,d:de,r,loads:inner[i]};
        });
        function sample(x,side='right') {
            x=Math.max(0,Math.min(L,x));
            const e=field.find(e=>side==='left'?x>e.a+L*1e-12 && x<=e.b+L*1e-12:x>=e.a-L*1e-12 && x<e.b-L*1e-12)||(x===0?field[0]:field.at(-1));
            const t=x-e.a;
            let V=e.r[0], M=-e.r[1]+e.r[0]*t;
            let theta=e.d[1]+(-e.r[1]*t+e.r[0]*t*t/2)/e.EI;
            let v=e.d[0]+e.d[1]*t+(-e.r[1]*t*t/2+e.r[0]*t**3/6)/e.EI;
            for(const load of e.loads){
                const z=t-load.t;
                if(z>0 || (Math.abs(z)<L*1e-12 && side==='right'))V-=load.value;
                if(z>0){M-=load.value*z;theta-=load.value*z*z/(2*e.EI);v-=load.value*z**3/(6*e.EI);}
            }
            return {x,V,M,v,theta};
        }
        const reactions=supports.map(s=>{const n=nodes[index(s.x)];return {id:s.id,label:s.label,x:s.x,force:R[n.v],moment:s.kind==='fixed'?R[n.left]:0};});
        const active=forces.filter(q=>q.x>=0&&q.x<=L);
        const forceResidual=reactions.reduce((s,r)=>s+r.force,0)-active.reduce((s,q)=>s+q.value,0);
        const momentResidual=reactions.reduce((s,r)=>s+r.force*r.x+r.moment,0)-active.reduce((s,q)=>s+q.value*q.x,0);
        const scale=Math.max(1,active.reduce((s,q)=>s+Math.abs(q.value),0));
        if(![...d,forceResidual,momentResidual].every(Number.isFinite)||Math.abs(forceResidual)>scale*1e-7||Math.abs(momentResidual)>scale*L*1e-7)throw new Error('Moving-load numerical check failed.');
        return {sample,reactions,forceResidual,momentResidual};
    }
    return {length:L,supports,hinges,properties:p,solve,positions:xs};
}
function validateConfig(m,c) {
    if(!c||!Number.isInteger(c.steps)||c.steps<20||c.steps>480)throw new Error('Travel intervals must be an integer from 20 to 480.');
    if(!Number.isFinite(c.station)||c.station<0||c.station>m.length)throw new Error('The observation section must lie on the beam.');
    if(c.target && !['M','V','v','reaction'].includes(c.target))throw new Error('Choose a valid influence response.');
    if(c.axles){
        if(!Array.isArray(c.axles)||!c.axles.length||c.axles.length>4)throw new Error('Use one to four axles.');
        for(const q of c.axles)if(!Number.isFinite(q.offset)||q.offset<0||q.offset>200||!Number.isFinite(q.force)||Math.abs(q.force)>100000)throw new Error('Axle offsets must be 0-200 m; forces must be finite and within +/-100000 kN.');
        if(c.axles[0].offset!==0)throw new Error('The leading axle offset must be zero.');
        if(c.axles.some((q,i)=>i&&q.offset<=c.axles[i-1].offset))throw new Error('Axle offsets must increase strictly from the leading axle.');
    }
}
const unique=(arr,tol=1e-10)=>arr.sort((a,b)=>a-b).filter((x,i,a)=>!i||x-a[i-1]>tol);
const abortError=()=>{const e=new Error('Calculation cancelled.');e.name='AbortError';return e;};
const yieldFrame=()=>new Promise(resolve=>setTimeout(resolve,0));
async function influenceLine(m,c,{signal,progress}={}) {
    validateConfig(m,c);
    if(!['M','V','v','reaction'].includes(c.target))throw new Error('Choose a valid influence response.');
    const prepared=prepareMoving(m), L=m.length, eps=L*1e-8;
    if(c.target==='reaction'&&!prepared.supports.some(s=>s.id===c.supportId))throw new Error('Choose an existing support reaction.');
    const points=unique([...Array.from({length:c.steps+1},(_,i)=>L*i/c.steps),...prepared.positions,c.station,
        ...[...prepared.positions,c.station].flatMap(x=>[x-eps,x+eps]).filter(x=>x>=0&&x<=L)]);
    const data=[];
    for(let i=0;i<points.length;i++){
        if(signal?.aborted)throw abortError();
        const z=points[i],a=prepared.solve([{x:z,value:1}]);
        const s=a.sample(c.station,'right');
        const value=c.target==='reaction'?a.reactions.find(r=>r.id===c.supportId).force:c.target==='v'?s.v*1000:s[c.target];
        data.push({z,value});
        if(i%12===0){progress?.(i/points.length);await yieldFrame();}
    }
    if(signal?.aborted)throw abortError();
    const min=data.reduce((a,b)=>b.value<a.value?b:a),max=data.reduce((a,b)=>b.value>a.value?b:a);
    progress?.(1);
    return {kind:'influence',data,min,max,config:clone(c),length:L,positionCount:data.length,
        unit:c.target==='reaction'||c.target==='V'?'kN/kN':c.target==='M'?'kN m/kN':'mm/kN',
        scope:'Unit downward force only. Existing loads and self-weight excluded. Static linear-elastic response; plotted peaks are sampled. Near-event shear ordinates are one-sided samples.'};
}
function stationsFor(m,n=80,extra=[]){
    const nodes=unique([0,m.length,...Array.from({length:n+1},(_,i)=>m.length*i/n),...m.items.flatMap(i=>i.end!==undefined?[i.x,i.end]:[i.x]),...(m.sectionRegions||[]).flatMap(r=>[r.x,r.end]),...(m.stiffnessRegions||[]).flatMap(r=>[r.x,r.end]),...extra]);
    return nodes.flatMap(x=>x>0&&x<m.length&&m.items.some(i=>Math.abs(i.x-x)<1e-9&&(isSupport(i.kind)||i.kind==='point'||i.kind==='moment'))?[{x,side:'left'},{x,side:'right'}]:[{x,side:x===m.length?'left':'right'}]);
}
async function envelope(m,c,{signal,progress}={}){
    validateConfig(m,c);if(!c.axles)throw new Error('Define an axle set.');
    const prepared=prepareMoving(m),L=m.length,eps=L*1e-8,tail=c.axles.at(-1).offset,travel=L+tail;
    const stations=stationsFor(m,80,[c.station]);
    const events=unique([...prepared.positions,...stations.map(s=>s.x)]);
    const placements=unique([-eps,travel+eps,...Array.from({length:c.steps+1},(_,i)=>travel*i/c.steps),...c.axles.flatMap(q=>events.flatMap(x=>[x+q.offset-eps,x+q.offset,x+q.offset+eps]))].filter(z=>z>=-eps&&z<=travel+eps),1e-11);
    if(placements.length>2200)throw new Error('This scan exceeds the 2200-position limit. Simplify the model or axle set.');
    const base=c.includeBase?solveStudy(m):null;
    const rows=stations.map(s=>({...s,...Object.fromEntries(['V','M','v'].map(k=>[k,{min:Infinity,max:-Infinity,minAt:0,maxAt:0}]))}));
    let forceResidual=0,momentResidual=0;
    for(let i=0;i<placements.length;i++){
        if(signal?.aborted)throw abortError();
        const z=placements[i],a=prepared.solve(c.axles.map(q=>({x:z-q.offset,value:q.force})));
        forceResidual=Math.max(forceResidual,Math.abs(a.forceResidual));momentResidual=Math.max(momentResidual,Math.abs(a.momentResidual));
        for(const row of rows){
            const moving=a.sample(row.x,row.side),staticValue=base?.sample(row.x,row.side);
            for(const k of ['V','M','v']){
                const value=(moving[k]+(staticValue?.[k]||0))*(k==='v'?1000:1);
                if(!Number.isFinite(value))throw new Error('Envelope contains a non-finite result.');
                if(value<row[k].min){row[k].min=value;row[k].minAt=z;}
                if(value>row[k].max){row[k].max=value;row[k].maxAt=z;}
            }
        }
        if(i%12===0){progress?.(i/placements.length);await yieldFrame();}
    }
    if(signal?.aborted)throw abortError();
    const extrema={};
    for(const k of ['V','M','v']){
        const lo=rows.reduce((a,b)=>b[k].min<a[k].min?b:a),hi=rows.reduce((a,b)=>b[k].max>a[k].max?b:a);
        extrema[k]={min:lo[k].min,minX:lo.x,minAt:lo[k].minAt,max:hi[k].max,maxX:hi.x,maxAt:hi[k].maxAt};
    }
    progress?.(1);
    return {kind:'envelope',rows,extrema,config:clone(c),length:L,travel,positionCount:placements.length,stationCount:rows.length,forceResidual,momentResidual,
        scope:'Sampled static envelopes, not dynamics, code loading or certified maxima. Different positions govern each point. Off-beam axles are excluded. Axle forces are unfactored; active static cases are included only when selected. Near crossings use 1e-8 span perturbations.'};
}
function envelopeCsv(result){
    if(result.kind!=='envelope')throw new Error('An envelope is required.');
    const head='section_x_m,section_side,V_min_kN,V_min_lead_m,V_max_kN,V_max_lead_m,M_min_kNm,M_min_lead_m,M_max_kNm,M_max_lead_m,v_min_mm,v_min_lead_m,v_max_mm,v_max_lead_m';
    return [head,...result.rows.map(r=>[r.x,r.side,...['V','M','v'].flatMap(k=>[r[k].min,r[k].minAt,r[k].max,r[k].maxAt])].join(','))].join('\n');
}
module.exports={prepareMoving,validateConfig,influenceLine,envelope,envelopeCsv,stationsFor};
