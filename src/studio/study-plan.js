"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = build;

const learning_path_1 = require("./learning-path");
const topic_drilldown_1 = require("./topic-drilldown");

function progress(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function rows(value) {
    return Array.isArray(value) ? value : [];
}
function completed(task, lessonProgress, challengeProgress) {
    return task.kind === 'lesson' ? !!lessonProgress[task.id] : !!challengeProgress[task.id];
}
function launchLabel(task) {
    if (task.kind === 'lesson') return 'Open lesson';
    if (task.kind === 'challenge') return 'Open challenge';
    return 'Start adaptive practice';
}
function addStep(plan, usedIds, task, phase, reason, minutes = 5) {
    if (!task || usedIds.has(task.id)) return false;
    usedIds.add(task.id);
    plan.push({
        index: plan.length + 1,
        phase,
        minutes,
        kind: task.kind,
        id: task.id,
        title: task.title,
        topic: task.topic,
        reason,
        actionLabel: launchLabel(task)
    });
    return true;
}
function incompleteTasks(level, lessonProgress, challengeProgress, stableTopics, usedIds) {
    const tasks = (0, learning_path_1.buildTasks)(level).all;
    return tasks
        .filter(task => !completed(task, lessonProgress, challengeProgress))
        .filter(task => !stableTopics.has(task.topic))
        .filter(task => !usedIds.has(task.id));
}
function transferTask(level, topic, firstTask, lessonProgress, challengeProgress, usedIds) {
    const tasks = (0, learning_path_1.buildTasks)(level).all
        .filter(task => task.topic === topic && !usedIds.has(task.id));
    const alternate = tasks.find(task => task.kind !== firstTask.kind && !completed(task, lessonProgress, challengeProgress));
    if (alternate) return alternate;
    const unfinished = tasks.find(task => !completed(task, lessonProgress, challengeProgress));
    if (unfinished) return unfinished;
    return tasks.find(task => task.kind !== firstTask.kind) || null;
}
function topicRowMap(trajectory) {
    return new Map(rows(trajectory?.rows).map(row => [row.topic, row]));
}
function newestByStatus(trajectory, statuses) {
    return rows(trajectory?.rows)
        .filter(row => statuses.includes(row.status))
        .sort((a,b) => Number(b.latestAt || 0) - Number(a.latestAt || 0));
}

function build(level, evidence = {}, trajectory = {}, lessonProgressInput = {}, challengeProgressInput = {}, mastery = {}) {
    const lessonProgress = progress(lessonProgressInput);
    const challengeProgress = progress(challengeProgressInput);
    const plan = [];
    const usedIds = new Set();
    const usedTopics = new Set();
    const rowMap = topicRowMap(trajectory);
    const stableTopics = new Set(rows(trajectory?.rows).filter(row => row.status === 'stable').map(row => row.topic));
    const eventRows = rows(evidence?.recentEvents);

    const unresolved = newestByStatus(trajectory, ['unresolved']);
    if (unresolved.length) {
        const focus = unresolved[0];
        const detail = (0, topic_drilldown_1.detail)(level, focus.topic, eventRows, mastery, lessonProgress, challengeProgress);
        if (detail.nextTask && addStep(
            plan,
            usedIds,
            detail.nextTask,
            'repair',
            `Repair ${focus.topic}: the latest retained checked evidence is unresolved, so this plan starts with one focused task before adding new material.`
        )) {
            usedTopics.add(focus.topic);
            const transfer = transferTask(level, focus.topic, detail.nextTask, lessonProgress, challengeProgress, usedIds);
            if (transfer) {
                addStep(
                    plan,
                    usedIds,
                    transfer,
                    'transfer',
                    `Transfer ${focus.topic}: use a different task or representation so the idea is checked beyond the first repair exercise.`
                );
            }
        }
    }

    if (plan.length < 2) {
        const confirmRows = newestByStatus(trajectory, ['recovered','first_try']);
        for (const focus of confirmRows) {
            if (stableTopics.has(focus.topic)) continue;
            const detail = (0, topic_drilldown_1.detail)(level, focus.topic, eventRows, mastery, lessonProgress, challengeProgress);
            if (detail.nextTask && addStep(
                plan,
                usedIds,
                detail.nextTask,
                focus.status === 'recovered' ? 'confirm' : 'stabilise',
                focus.status === 'recovered'
                    ? `Confirm ${focus.topic}: recent evidence shows a recovery, so one different checked task tests whether that correction transfers.`
                    : `Stabilise ${focus.topic}: the newest attempt was first-try correct; another independent check can show whether that success is becoming a stable recent pattern.`
            )) {
                usedTopics.add(focus.topic);
                break;
            }
        }
    }

    while (plan.length < 3) {
        const incomplete = incompleteTasks(level, lessonProgress, challengeProgress, stableTopics, usedIds);
        if (!incomplete.length) break;
        const newTopic = incomplete.find(task => !usedTopics.has(task.topic));
        const task = newTopic || incomplete[0];
        if (!task) break;
        const state = rowMap.get(task.topic);
        const reason = state
            ? `Build breadth with ${task.topic}: this is still incomplete and is not currently classified as first-try stable.`
            : `Build breadth with ${task.topic}: this incomplete task has little recent evidence, so it adds a new checked concept instead of repeating a familiar one.`;
        if (!addStep(plan, usedIds, task, 'build', reason)) break;
        usedTopics.add(task.topic);
    }

    const practiceStep = {
        kind: 'session',
        id: 'practice',
        title: 'Adaptive mixed check',
        topic: 'Mixed revision'
    };
    addStep(
        plan,
        usedIds,
        practiceStep,
        'mixed-check',
        plan.length
            ? 'Finish with a mixed four-question check so BeamLab can test whether the earlier work transfers across topics and update the next recommendation from fresh evidence.'
            : 'There is no urgent single-topic repair in the retained evidence. Use a mixed four-question check to sample the level and create fresh evidence.',
        5
    );

    const estimatedMinutes = plan.reduce((sum, step) => sum + step.minutes, 0);
    const unresolvedCount = unresolved.length;
    const stableCount = stableTopics.size;
    let rationale = 'The plan balances recent evidence with unfinished curriculum work.';
    if (unresolvedCount) rationale = 'The plan starts with unresolved recent evidence, then broadens only after a focused repair.';
    else if (stableCount) rationale = 'Stable topics are deliberately de-prioritised so the plan can advance rather than over-drill.';
    else if (!eventRows.length) rationale = 'There is little recent evidence, so the plan begins with incomplete curriculum work and finishes with a mixed check.';

    return {
        title: `≈${estimatedMinutes}-minute study plan`,
        estimatedMinutes,
        steps: plan,
        unresolvedCount,
        stableCount,
        rationale,
        boundary: 'This plan is deterministic and uses only bounded local learning evidence plus current completion state. It is a study-sequencing aid, not a grade, diagnosis, or prediction of ability.'
    };
}
