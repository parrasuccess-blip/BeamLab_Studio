"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.steps = void 0;
exports.clampStep = clampStep;
exports.renderHeader = renderHeader;
exports.renderNavigation = renderNavigation;
exports.renderFinishCard = renderFinishCard;
const common_1 = require("./common");

exports.steps = [
    { id: 1, short: 'Demand', title: 'Review analysis demand', hint: 'What BeamLab solved', instruction: 'Start with the deterministic analysis. Confirm the demand and section context you are carrying into the review.' },
    { id: 2, short: 'Criteria', title: 'Enter design criteria', hint: 'What you provide', instruction: 'Enter only capacities, limits and sources you have independently verified. Blank fields remain Not assessed.' },
    { id: 3, short: 'Ratios', title: 'Review utilisation', hint: 'Demand ÷ criterion', instruction: 'Compare BeamLab demand with the criteria you entered. The largest entered ratio is useful context, not a code-compliance verdict.' },
    { id: 4, short: 'Missing', title: 'Check what is still missing', hint: 'Readiness gaps', instruction: 'Review the active factor basis and the design checks BeamLab does not yet perform before treating this as anything more than screening.' },
    { id: 5, short: 'Finish', title: 'Review and export', hint: 'Traceability', instruction: 'Confirm the review scope, export the transparent record, or ask BeamLab to explain the supplied review without turning it into structural approval.' }
];

function clampStep(value) {
    return Math.max(1, Math.min(exports.steps.length, Number(value) || 1));
}

function renderHeader(stepValue) {
    const step = clampStep(stepValue);
    const current = exports.steps[step - 1];
    const tabs = exports.steps.map(row => `<button type="button" class="design-step-tab ${row.id === step ? 'active' : ''} ${row.id < step ? 'complete' : ''}" data-action="design-step:${row.id}" aria-current="${row.id === step ? 'step' : 'false'}"><span>${row.id < step ? '✓' : row.id}</span><b>${(0, common_1.esc)(row.short)}</b><small>${(0, common_1.esc)(row.hint)}</small></button>`).join('');
    return `<header class="design-workflow-head"><div><span class="eyebrow">GUIDED DESIGN REVIEW</span><h3>One engineering decision at a time.</h3><p>Only the current stage is emphasised. Your entered criteria remain available as you move between steps.</p></div><strong>STEP ${step} OF ${exports.steps.length}</strong></header><nav class="design-stepper" aria-label="Design review steps">${tabs}</nav><section class="design-current-step"><span>STEP ${step} · ${(0, common_1.esc)(current.short)}</span><h3>${(0, common_1.esc)(current.title)}</h3><p>${(0, common_1.esc)(current.instruction)}</p></section>`;
}

function renderNavigation(stepValue) {
    const step = clampStep(stepValue);
    const back = step > 1 ? (0, common_1.button)('design-back', '← Back', 'secondary') : '<span></span>';
    const next = step < exports.steps.length ? (0, common_1.button)('design-next', step === 4 ? 'Continue to review →' : 'Continue →', 'primary') : '';
    return `<footer class="design-workflow-nav">${back}<div><span>Screening review · not code approval</span>${next}</div></footer>`;
}

function renderFinishCard(model, review, governing, sourceLine, examMode) {
    const entered = review.checks.filter(check => check.ratio !== null).length;
    const missing = review.readiness.filter(row => row.state === 'missing').map(row => row.label);
    return `<section class="design-card design-review-summary"><span class="eyebrow">REVIEW SUMMARY</span><h3>Finish with a traceable screening record.</h3><p>BeamLab keeps deterministic demand, your entered criteria and the known gaps separate so the review is easy to audit.</p><div class="design-summary-grid"><article><span>Study</span><b>${(0, common_1.esc)(model.name || 'Untitled study')}</b></article><article><span>Entered checks</span><b>${entered} / ${review.checks.length}</b></article><article><span>Governing entered ratio</span><b>${(0, common_1.esc)(governing)}</b></article><article><span>Known missing areas</span><b>${missing.length}</b></article></div>${sourceLine}<div class="design-missing-summary"><span>Still outside this screening release</span><p>${missing.length ? missing.map(item => (0, common_1.esc)(item)).join(' · ') : 'Review the readiness ledger before relying on this screening context.'}</p></div><div class="design-warning">The exported record is not structural design approval and does not establish automatic AS 4100 or AS/NZS 1170 compliance.</div><div class="design-final-actions">${(0, common_1.button)('design-export', 'Export design review JSON', 'primary')}${(0, common_1.button)('ai-design', '✦ Ask BeamLab about this review', 'secondary', examMode)}</div></section>`;
}
