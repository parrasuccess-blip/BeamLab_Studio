"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildQueue = buildQueue;
exports.replanFocusTail = replanFocusTail;
exports.replanMixedTail = replanMixedTail;
exports.review = review;

function key(task) {
    return task ? task.kind + ':' + task.id : '';
}
function copyTask(task) {
    return task && typeof task === 'object' ? { ...task } : null;
}
function focusSteps(plan, exclude = new Set(), count = 3) {
    return (Array.isArray(plan?.steps) ? plan.steps : [])
        .filter(step => step && (step.kind === 'lesson' || step.kind === 'challenge'))
        .filter(step => !exclude.has(key(step)))
        .slice(0, Math.max(0, count));
}
function decorateFocus(tasks, startPhase, phaseTotal) {
    return tasks.map((task, index) => ({
        ...copyTask(task),
        blockRole: 'focus',
        studyPhase: startPhase + index,
        studyPhaseTotal: phaseTotal,
        phaseTitle: task.phase ? String(task.phase).replace(/-/g, ' ') : 'focused task'
    }));
}
function decorateMixed(tasks, phase, phaseTotal, offset = 0, total = 4) {
    return tasks.map((task, index) => ({
        ...copyTask(task),
        blockRole: 'mixed',
        studyPhase: phase,
        studyPhaseTotal: phaseTotal,
        phaseTitle: 'adaptive mixed check',
        mixedIndex: offset + index + 1,
        mixedTotal: total
    }));
}
function uniqueTasks(tasks, excluded = new Set()) {
    const out = [];
    const seen = new Set(excluded);
    for (const task of Array.isArray(tasks) ? tasks : []) {
        const k = key(task);
        if (!task || !k || seen.has(k)) continue;
        seen.add(k);
        out.push(task);
    }
    return out;
}
function buildQueue(plan, mixedTasks, options = {}) {
    const focusTarget = Math.max(0, Math.min(3, Number(options.focusTarget) || 3));
    const mixedTarget = Math.max(1, Math.min(6, Number(options.mixedTarget) || 4));
    const focus = focusSteps(plan, new Set(), focusTarget);
    const focusKeys = new Set(focus.map(key));
    const mixed = uniqueTasks(mixedTasks, focusKeys).slice(0, mixedTarget);
    const actualFocus = focus.length;
    const phaseTotal = actualFocus + 1;
    return {
        queue: [
            ...decorateFocus(focus, 1, phaseTotal),
            ...decorateMixed(mixed, phaseTotal, phaseTotal, 0, mixedTarget)
        ],
        focusTarget: actualFocus,
        mixedTarget,
        phaseTotal
    };
}
function replanFocusTail(queueInput, indexInput, freshPlan, freshMixed, options = {}) {
    const queue = Array.isArray(queueInput) ? queueInput : [];
    const index = Math.max(0, Math.min(queue.length - 1, Number(indexInput) || 0));
    const seen = queue.slice(0, index + 1).map(copyTask);
    const focusTarget = Math.max(0, Number(options.focusTarget) || seen.filter(row => row.blockRole === 'focus').length);
    const mixedTarget = Math.max(1, Number(options.mixedTarget) || 4);
    const completedFocus = seen.filter(row => row.blockRole === 'focus').length;
    const remainingFocus = Math.max(0, focusTarget - completedFocus);
    const excluded = new Set(seen.map(key));
    const focus = focusSteps(freshPlan, excluded, remainingFocus);
    for (const task of focus) excluded.add(key(task));
    const mixed = uniqueTasks(freshMixed, excluded).slice(0, mixedTarget);
    const phaseTotal = focusTarget + 1;
    return [
        ...seen.map(row => ({ ...row, studyPhaseTotal: phaseTotal })),
        ...decorateFocus(focus, completedFocus + 1, phaseTotal),
        ...decorateMixed(mixed, phaseTotal, phaseTotal, 0, mixedTarget)
    ];
}
function replanMixedTail(queueInput, indexInput, freshMixed, options = {}) {
    const queue = Array.isArray(queueInput) ? queueInput : [];
    const index = Math.max(0, Math.min(queue.length - 1, Number(indexInput) || 0));
    const seen = queue.slice(0, index + 1).map(copyTask);
    const mixedTarget = Math.max(1, Number(options.mixedTarget) || 4);
    const mixedSeen = seen.filter(row => row.blockRole === 'mixed').length;
    const remaining = Math.max(0, mixedTarget - mixedSeen);
    const excluded = new Set(seen.map(key));
    const tail = uniqueTasks(freshMixed, excluded).slice(0, remaining);
    const phaseTotal = Number(options.phaseTotal) || seen.at(-1)?.studyPhaseTotal || 1;
    return [
        ...seen,
        ...decorateMixed(tail, phaseTotal, phaseTotal, mixedSeen, mixedTarget)
    ];
}
function rowsMap(view) {
    return new Map((Array.isArray(view?.rows) ? view.rows : []).map(row => [row.topic, row]));
}
function review(initialTrajectory, finalTrajectory, resultsInput, meta = {}) {
    const before = rowsMap(initialTrajectory);
    const after = rowsMap(finalTrajectory);
    const topics = new Set([...before.keys(), ...after.keys()]);
    const changes = [];
    for (const topic of topics) {
        const a = before.get(topic), b = after.get(topic);
        const from = a?.label || 'No recent state';
        const to = b?.label || 'No recent state';
        if (from === to) continue;
        changes.push({
            topic,
            from,
            to,
            fromStatus: a?.status || 'none',
            toStatus: b?.status || 'none'
        });
    }
    const results = (Array.isArray(resultsInput) ? resultsInput : []).filter(Boolean);
    const focus = results.filter(row => row.blockRole === 'focus');
    const mixed = results.filter(row => row.blockRole === 'mixed');
    const attempts = results.reduce((sum,row) => sum + (Number(row.tries) || 0), 0);
    const firstTry = results.filter(row => row.firstCorrect === true).length;
    const recovered = results.filter(row => row.correct === true && row.firstCorrect === false).length;
    const unresolved = results.filter(row => !row.correct).length;
    const startedAt = Number(meta.startedAt) || 0;
    const finishedAt = Number(meta.finishedAt) || startedAt;
    const elapsedMs = Math.max(0, finishedAt - startedAt);
    const unresolvedBefore = [...before.values()].filter(row => row.status === 'unresolved').length;
    const unresolvedAfter = [...after.values()].filter(row => row.status === 'unresolved').length;
    const stableBefore = [...before.values()].filter(row => row.status === 'stable').length;
    const stableAfter = [...after.values()].filter(row => row.status === 'stable').length;

    let headline = 'Study block complete.';
    let explanation = 'BeamLab compared the bounded local trajectory at the start and end of this block.';
    if (unresolvedAfter < unresolvedBefore) {
        headline = 'The block reduced unresolved recent evidence.';
        explanation = 'At least one topic moved out of an unresolved recent state during this study block. That is evidence of progress in this window, not a permanent mastery claim.';
    } else if (stableAfter > stableBefore) {
        headline = 'A recent topic became first-try stable.';
        explanation = 'The retained evidence now contains an additional topic with two recent first-try correct checks and no intervening unresolved event.';
    } else if (changes.length) {
        headline = 'The recent learning pattern changed.';
        explanation = 'Some topic states moved during the block even though the unresolved count did not decrease.';
    } else {
        explanation = 'The retained trajectory labels did not change during this block. The response evidence is still kept for the next deterministic plan.';
    }

    return {
        headline,
        explanation,
        elapsedMs,
        focusCompleted: focus.length,
        mixedCompleted: mixed.length,
        attempts,
        firstTry,
        recovered,
        unresolved,
        planRevision: Math.max(0, Number(meta.planRevision) || 0),
        trajectoryChanges: changes,
        unresolvedBefore,
        unresolvedAfter,
        stableBefore,
        stableAfter,
        boundary: 'This review compares bounded local response evidence from this study block. It does not assign a grade, diagnose a misconception, or predict ability.'
    };
}
