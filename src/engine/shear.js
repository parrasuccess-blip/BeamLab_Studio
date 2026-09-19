'use strict';
/** Elementary width-averaged transverse shear, not torsion or shear deformation. */
const {sectionProperties}=require('../model/sections');
function shearProfile(section,V){
    if(!Number.isFinite(V))throw new Error('Shear force must be finite.');
    if(section.catalogue || !['rectangle','i'].includes(section.shape))return {supported:false,reason:'Use a dimension-derived solid rectangle or symmetric I-section for a shear profile. Custom/catalogue sections and hollow sections are not assigned an invented Q or shear-flow field.'};
    const p=sectionProperties(section),h=section.h,b=section.b,t=section.t,tf=section.tf,c=h/2,I=p.I*1e12;
    const slices=section.shape==='rectangle'?[{lo:-c,hi:c,b}]:[{lo:-c,hi:-c+tf,b},{lo:-c+tf,hi:c-tf,b:t},{lo:c-tf,hi:c,b}];
    function at(y,side='above'){
        if(!Number.isFinite(y)||Math.abs(y)>c+1e-8)throw new Error('Fibre location is outside the section.');
        const strip=slices.find(s=>side==='above'?y>=s.lo-1e-10&&y<s.hi-1e-10:y>s.lo+1e-10&&y<=s.hi+1e-10)||(y<=-c?slices[0]:slices.at(-1));
        const Q=slices.reduce((sum,s)=>sum+(s.hi>y?s.b*(s.hi*s.hi-Math.max(y,s.lo)**2)/2:0),0);
        const tau=V*1000*Math.max(0,Q)/(I*strip.b);
        return {y,Q,width:strip.b,tau,side};
    }
    const data=slices.flatMap(s=>Array.from({length:31},(_,i)=>at(s.lo+(s.hi-s.lo)*i/30,i===30?'below':'above')));
    const peak=data.reduce((a,b)=>Math.abs(a.tau)>Math.abs(b.tau)?a:b);
    // Three-point Gauss quadrature exactly integrates quadratic tau*b per strip.
    const z=[-Math.sqrt(3/5),0,Math.sqrt(3/5)],w=[5/9,8/9,5/9];
    const recoveredForce=slices.reduce((sum,s)=>sum+z.reduce((a,z,i)=>a+w[i]*at((s.lo+s.hi)/2+z*(s.hi-s.lo)/2).tau*s.b*(s.hi-s.lo)/2,0),0)/1000;
    return {supported:true,data,peak,at,recoveredForce,forceResidual:recoveredForce-V,I,scope:'Elastic VQ/(I b), width-averaged through the depth. I-section flange field is an elementary approximation, not a two-dimensional stress solution. No torsion, fillets, local loading or capacity check. The beam deflection solver remains Euler-Bernoulli.'};
}
module.exports={shearProfile};
