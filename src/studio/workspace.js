'use strict';
const {esc} = require('./common');
const {allowedTabs} = require('./levels');

const steps = [
    {id:'build', title:'Build', detail:'Geometry, supports & loads', heading:'Make the model yours.', help:'Drag a support or load on the beam. Select it for precise values. Your results update as you work.', next:'analyse', nextLabel:'Explore the results'},
    {id:'analyse', title:'Analyse', detail:'Diagrams, stress & movement', heading:'Follow the forces through the beam.', help:'Inspect the same position across Structure, SFD and BMD. Add only the response layers you need.', next:'learn', nextLabel:'Learn with this model'},
    {id:'learn', title:'Learn', detail:'Lessons & guided practice', heading:'Turn results into understanding.', help:'Choose a short lesson, practise a calculation, or follow a guided study plan. Sessions restore your own beam when you finish.', next:'review', nextLabel:'Review & export'},
    {id:'review', title:'Review', detail:'Checks, criteria & reports', heading:'Check the evidence. Keep a record.', help:'Inspect numerical checks, record your criteria, and export the model or calculation report. Entered limits remain separate from code design.', next:'build', nextLabel:'Return to your model'}
];
function phaseFor(view) {
    return view.workspaceMode === 'design' ? 'review' : view.tab === 'learn' ? 'learn' : view.tab === 'layers' ? 'analyse' : 'build';
}
function tabsFor(view) {
    const phase = phaseFor(view);
    return allowedTabs(view.level).filter(tab => phase === 'learn' ? tab === 'learn' : phase === 'analyse' ? tab === 'layers' : ['build','section','cases'].includes(tab));
}
function transition(view, target) {
    if (!steps.some(s => s.id === target)) return null;
    if ((view.session?.active || view.session?.review) && target !== 'learn') return null;
    return {workspaceMode:target === 'review' ? 'design' : 'analysis', tab:target === 'analyse' ? 'layers' : target === 'learn' ? 'learn' : 'build', controls:true};
}
function renderNavigation(view) {
    const current = phaseFor(view);
    return `<nav class="workflow-nav" aria-label="BeamLab workflow">${steps.map((step,index) => `<button type="button" data-action="workflow:${step.id}" ${step.id===current?'aria-current="step"':''}><span class="workflow-number">${String(index+1).padStart(2,'0')}</span><span><b>${step.title}</b><small>${step.detail}</small></span><span class="workflow-arrow" aria-hidden="true">↗</span></button>`).join('')}</nav>`;
}
function renderContext(view, valid) {
    const step = steps.find(s => s.id === phaseFor(view));
    return `<div class="workflow-context"><div><span class="eyebrow">${esc(step.detail)}</span><h2>${step.heading}</h2><p>${step.help}</p></div><div class="workflow-context-actions">${step.id==='review'?'<button type="button" class="secondary" data-action="audit" '+(!valid?'disabled':'')+'>Numerical checks</button>':''}<button type="button" class="secondary" data-action="workflow:${step.next}" ${view.session?.active||view.session?.review?'disabled':''}>${step.nextLabel} <span aria-hidden="true">→</span></button></div></div>`;
}
module.exports = {steps,phaseFor,tabsFor,transition,renderNavigation,renderContext};
