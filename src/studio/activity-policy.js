'use strict';

// Presentation and activity permissions only. Every destination uses the same
// model and solver; academic preferences never gate engineering capabilities.
function isLearning(view) {
    return view.workspaceMode !== 'design' && view.tab === 'learn';
}
function toolLevel(view) { return isLearning(view) ? view.level : 'all'; }
function modelLocked(view) { return !!(view.session?.active || view.session?.review); }
function resultVisibility(view) {
    const exam = isLearning(view) && !!view.session?.active && view.session.mode === 'exam';
    const masked = isLearning(view) && !view.session?.review && (exam || !!view.practice || !!view.activityMismatch);
    const step = masked ? exam || view.activityMismatch ? 0 : Math.max(0, Math.min(4, Number(view.practiceStep) || 0)) : 4;
    return {masked, step, exam, complete:step === 4,
        reactions:step >= 1, shear:step >= 2, moment:step >= 3, deformation:step >= 4};
}
function questionMatches(view, fingerprint) {
    const expected = view.session?.active ? view.session.questionReference
        : view.lessonId ? view.lessonModelReference : view.challengeId ? view.challengeModelReference : null;
    const fixedQuestion = !!(view.session?.active || view.lessonId || view.challengeId);
    return fixedQuestion ? !!expected && expected === fingerprint : true;
}
function resultActionBlocked(view, name, id) {
    if (resultVisibility(view).complete) return false;
    if (name === 'export') return id !== 'json';
    return ['working','step','audit','export-audit','jump-critical','compare','compare-details',
        'design-export','design-jump','issue-report','ai-open','ai-send','ai-quick','ai-design'].includes(name);
}
function restrictionMessage(view) {
    return resultVisibility(view).exam
        ? 'Solutions stay hidden until you submit the exam. You can exit to restore your own study.'
        : 'This activity still has hidden results. Reveal the remaining responses in Learn, or return to your model for unrestricted analysis.';
}
module.exports = {isLearning, toolLevel, modelLocked, resultVisibility, questionMatches, resultActionBlocked, restrictionMessage};
