'use strict';
const {esc} = require('./common');
const {allowedTabs} = require('./levels');
const {toolLevel} = require('./activity-policy');

const steps = [
    {id:'build', title:'Build / Explore', detail:'Geometry, supports & loads', heading:'Make the model yours.', help:'Drag a support or load on the beam. Select it for precise values. All tools are available without completing lessons.', next:'analyse', nextLabel:'Explore the results'},
    {id:'analyse', title:'Analyse', detail:'Diagrams, stress & movement', heading:'Follow the forces through the beam.', help:'Inspect the same position across Structure, SFD and BMD. Add the response layers you need, or open Learn whenever you want guidance.', next:'review', nextLabel:'Review & export'},
    {id:'learn', title:'Learn', detail:'Optional lessons & practice', heading:'Turn results into understanding.', help:'Choose any lesson, practise a calculation, or follow a guided study plan. Learning examples are temporary; your own beam stays safe.', next:'build', nextLabel:'Return to your model'},
    {id:'review', title:'Review', detail:'Checks, criteria & reports', heading:'Check the evidence. Keep a record.', help:'Inspect numerical checks, record your criteria, and export the model or calculation report. Entered limits remain separate from code design.', next:'build', nextLabel:'Return to your model'}
];
function phaseFor(view) {
    return view.workspaceMode === 'design' ? 'review' : view.tab === 'learn' ? 'learn' : view.tab === 'layers' ? 'analyse' : 'build';
}
function tabsFor(view) {
    const phase = phaseFor(view);
    return allowedTabs(toolLevel(view)).filter(tab => phase === 'learn' ? tab === 'learn' : phase === 'analyse' ? tab === 'layers' : ['build','section','cases'].includes(tab));
}
function transition(view, target) {
    if (!steps.some(s => s.id === target)) return null;
    if ((view.session?.active || view.session?.review) && target !== 'learn') return null;
    return {workspaceMode:target === 'review' ? 'design' : 'analysis', tab:target === 'analyse' ? 'layers' : target === 'learn' ? 'learn' : 'build', controls:true};
}
function renderNavigation(view) {
    const current = phaseFor(view);
    const item = step => `<button type="button" data-action="workflow:${step.id}" ${step.id===current?'aria-current="page"':''}><span><b>${step.title}</b><small>${step.detail}</small></span><span class="workflow-arrow" aria-hidden="true">↗</span></button>`;
    return `<nav class="workflow-nav" aria-label="BeamLab workspace"><div class="workflow-engineering"><span class="workflow-group-label">YOUR MODEL · freely move between steps</span><div class="workflow-path">${['build','analyse','review'].map(id => item(steps.find(s => s.id === id))).join('')}</div></div><div class="workflow-learning"><span class="workflow-group-label">OPTIONAL · try a guided activity</span>${item(steps.find(s => s.id === 'learn'))}</div></nav>`;
}
function renderContext(view, valid) {
    const step = steps.find(s => s.id === phaseFor(view));
    return `<div class="workflow-context"><div><span class="eyebrow">${esc(step.detail)}</span><h2>${step.heading}</h2><p>${step.help}</p></div><div class="workflow-context-actions">${step.id==='review'?'<button type="button" class="secondary" data-action="audit" '+(!valid?'disabled':'')+'>Numerical checks</button>':''}<button type="button" class="secondary" data-action="workflow:${step.next}" >${step.nextLabel} <span aria-hidden="true">→</span></button></div></div>`;
}
function activityPosition(list, id) {
    const index = list.findIndex(task => task.id === id);
    return {index, total:list.length, previous:index > 0 ? list[index-1].id : null, next:index >= 0 && index+1 < list.length ? list[index+1].id : null};
}
function renderActivityNavigation(list, id, kind) {
    const p = activityPosition(list, id);
    if (p.index < 0 || !['lesson','challenge'].includes(kind)) return '';
    return `<nav class="activity-navigation" aria-label="${kind === 'lesson' ? 'Lesson' : 'Challenge'} navigation"><button type="button" data-action="learning-library" class="secondary">← All ${kind === 'lesson' ? 'lessons' : 'challenges'}</button><span>${p.index+1} of ${p.total}</span><div><button type="button" data-action="${kind}-start:${esc(p.previous || '')}" class="secondary" ${p.previous?'':'disabled'}>Previous</button><button type="button" data-action="${kind}-start:${esc(p.next || '')}" class="secondary" ${p.next?'':'disabled'}>Next</button></div></nav>`;
}
module.exports = {steps,phaseFor,tabsFor,transition,renderNavigation,renderContext,activityPosition,renderActivityNavigation};
