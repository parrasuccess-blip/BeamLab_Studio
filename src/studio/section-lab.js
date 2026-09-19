'use strict';
const {sectionDetails} = require('../model/sections');
const {sectionAt} = require('../model/study');
const {shearProfile} = require('../engine/shear');
const {renderSection} = require('./diagrams');
const {esc,fmt,signed} = require('./common');

function fibreResponse(analysis,x,eta=0,side='right') {
    if(!analysis || !Number.isFinite(x) || x<0 || x>analysis.elements.at(-1).b || !Number.isFinite(eta) || Math.abs(eta)>1 || !['left','right'].includes(side)) throw new Error('Choose a position on the beam and a fibre between -1 and +1.');
    const local=sectionAt(analysis,x,side), sample=analysis.sample(x,side);
    if(!local.properties || Math.abs((local.stiffnessFactor??1)-1)>1e-12) return {available:false,reason:'Local stress requires actual section properties; an EI-only multiplier is insufficient.'};
    const y=eta*local.properties.c*1000;
    const sigma=-sample.M*(y/1000)/local.properties.I/1000;
    const profile=shearProfile(local.section,sample.V);
    const shear=profile.supported?profile.at(y):null;
    return {available:true,x,side,y,eta,sigma,tau:shear?.tau??null,V:sample.V,M:sample.M,local,properties:sectionDetails(local.section),shearReason:profile.supported?null:profile.reason};
}
function render(m,a,x,eta=0,side='right') {
    if(!a) return '<div class="section-lab-empty">Complete a stable model to inspect section stresses.</div>';
    const r=fibreResponse(a,x,eta,side);
    if(!r.available) return `<div class="section-lab-empty">${esc(r.reason)}</div>`;
    // Select the same one-sided section for both the schematic and numerical readout.
    const view=Object.create(a);
    view.sample=(position)=>a.sample(position,side);
    view.localSectionAt=(position)=>a.localSectionAt(position,side);
    const diagram=renderSection(m,view,x);
    const p=r.properties;
    const row=(label,value,unit)=>`<div><span>${label}</span><b>${value===null?'Not supplied':Math.abs(value)>1e6?value.toExponential(3):fmt(value,2)} ${value===null?'':unit}</b></div>`;
    return `${diagram}<div class="fibre-lab"><div class="fibre-controls"><label for="fibre-slider">Explore a fibre <span>bottom −1 · neutral axis 0 · top +1</span></label><input id="fibre-slider" type="range" min="-1" max="1" step=".01" value="${eta}" data-range="fibre" aria-label="Fibre position through section"><div class="section-side" role="group" aria-label="Side of section cut"><button data-action="section-side:left" aria-pressed="${side==='left'}">Left side of cut</button><button data-action="section-side:right" aria-pressed="${side==='right'}">Right side of cut</button></div><small>Choose a side at a point load, couple, or section boundary. The beam inspection control selects x.</small></div><div class="fibre-results"><article><span>Fibre y · above neutral axis +</span><b>${signed(r.y,2)} mm</b></article><article class="${r.sigma>=0?'tension':'compression'}"><span>σ · ${Math.abs(r.sigma)<1e-8?'neutral':r.sigma>0?'tension':'compression'}</span><b>${signed(r.sigma,3)} MPa</b></article><article><span>τ · elementary width average</span><b>${r.tau===null?'Unavailable':signed(r.tau,3)+' MPa'}</b></article></div><p class="fibre-boundary">σ = −My/I. ${r.tau===null?esc(r.shearReason):'τ = VQ/(Ib). Width-averaged shear is a beam-theory approximation; local flange flow, torsion and stress concentrations are excluded.'} No combined failure or member-capacity criterion is inferred.</p><details class="section-properties"><summary>Section properties &amp; source</summary><div class="section-property-grid">${row('Area',p.A,'mm²')}${row('Ix',p.Ix,'mm⁴')}${row('Iy',p.Iy,'mm⁴')}${row('Elastic modulus Ix/c',p.elasticX,'mm³')}${row('Plastic modulus about x',p.plasticX,'mm³')}${row('Radius rx',p.rx,'mm')}${row('Radius ry',p.ry,'mm')}${row('Circular torsion constant J',p.torsionJ,'mm⁴')}</div><p>${esc(p.source)} Plastic modulus is a geometric reference, not a code capacity.</p></details></div>`;
}
module.exports={fibreResponse,render};
