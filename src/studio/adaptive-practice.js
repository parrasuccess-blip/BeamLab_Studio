"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planPractice = planPractice;

const challenges_1 = require("./challenges");
const learning_path_1 = require("./learning-path");

function progressMap(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function clampCount(value, max) {
    const n = Number(value);
    return Math.max(1, Math.min(max, Number.isFinite(n) ? Math.round(n) : 4));
}
function latestByTopic(evidence) {
    const map = new Map();
    for (const row of Array.isArray(evidence?.recentEvents) ? evidence.recentEvents : []) {
        if (!row?.topic) continue;
        const prev = map.get(row.topic);
        if (!prev || Number(row.timestamp || 0) >= Number(prev.timestamp || 0)) map.set(row.topic, row);
    }
    return map;
}
function unresolved(row) {
    return !!row && (row.event === 'reveal' || row.event === 'skip' || (row.event === 'attempt' && row.correct === false));
}
function corrected(row) {
    return !!row && row.event === 'attempt' && row.correct === true;
}
function masteryFor(topic, stats) {
    const score = (0, challenges_1.masteryScore)(stats?.[topic]);
    return score === null ? null : Number(score);
}
function isComplete(task, lessonProgress, challengeProgress) {
    return task.kind === 'lesson' ? !!lessonProgress[task.id] : !!challengeProgress[task.id];
}
function taskSort(a, b, stats, lessonProgress, challengeProgress) {
    const ac = isComplete(a, lessonProgress, challengeProgress) ? 1 : 0;
    const bc = isComplete(b, lessonProgress, challengeProgress) ? 1 : 0;
    if (ac !== bc) return ac - bc;
    const as = masteryFor(a.topic, stats), bs = masteryFor(b.topic, stats);
    const av = as === null ? 50 : as, bv = bs === null ? 50 : bs;
    if (av !== bv) return av - bv;
    const aa = Number(stats?.[a.topic]?.attempts || 0), ba = Number(stats?.[b.topic]?.attempts || 0);
    if (aa !== ba) return aa - ba;
    if (a.kind !== b.kind) return a.kind === 'lesson' ? -1 : 1;
    return a.id.localeCompare(b.id);
}
function sameTopicCandidate(topic, candidates, preferredKind = null, preferredId = null) {
    if (preferredId) {
        const exact = candidates.find(task => task.id === preferredId);
        if (exact) return exact;
    }
    if (preferredKind) {
        const alternate = candidates.find(task => task.topic === topic && task.kind !== preferredKind);
        if (alternate) return alternate;
    }
    return candidates.find(task => task.topic === topic) || null;
}
function eventReason(event, phase) {
    const topic = event?.topic || 'this topic';
    if (phase === 'repair') {
        if (event?.event === 'reveal') return `Repair: you revealed the reference on ${topic}, so this question checks whether you can now reconstruct the idea without that reference.`;
        if (event?.event === 'skip') return `Repair: you recently left ${topic} blank, so BeamLab is bringing that concept back first.`;
        return `Repair: your latest ${topic} attempt was not correct, so BeamLab is resolving that relationship before moving on.`;
    }
    return `Reinforce: recent evidence still points to ${topic}, but this question changes the task or representation so you are not simply repeating the same prompt.`;
}
function pushPlan(plan, chosen, task, basis, reason) {
    if (!task || chosen.has(task.id)) return false;
    chosen.add(task.id);
    plan.push({ ...task, basis, reason });
    return true;
}

function planPractice(level, evidence = {}, lessonProgressInput = {}, challengeProgressInput = {}, stats = {}, options = {}) {
    const lessonProgress = progressMap(lessonProgressInput);
    const challengeProgress = progressMap(challengeProgressInput);
    const exclude = new Set(Array.isArray(options.excludeIds) ? options.excludeIds : []);
    const { all } = (0, learning_path_1.buildTasks)(level);
    const candidates = all.filter(task => !exclude.has(task.id));
    if (!candidates.length) return [];

    const count = clampCount(options.count, candidates.length);
    const latest = latestByTopic(evidence);
    const priority = Array.isArray(evidence?.priorityTopics) ? [...evidence.priorityTopics] : [];
    const chosen = new Set();
    const plan = [];

    // 1) Resolve the newest/highest-priority difficulty first, unless the latest evidence says it was corrected.
    let repair = null;
    for (const row of priority) {
        const event = latest.get(row.topic);
        if (!unresolved(event)) continue;
        const available = candidates.filter(task => !chosen.has(task.id));
        const task = sameTopicCandidate(row.topic, available, event?.kind || null, event?.taskId || null);
        if (task) {
            repair = { task, event };
            pushPlan(plan, chosen, task, 'repair', eventReason(event, 'repair'));
            break;
        }
    }

    // 2) If possible, reinforce the same unresolved topic using another task type/representation.
    if (repair && plan.length < count) {
        const available = candidates.filter(task => !chosen.has(task.id));
        const task = sameTopicCandidate(repair.task.topic, available, repair.task.kind, null);
        if (task) pushPlan(plan, chosen, task, 'reinforce', eventReason(repair.event, 'reinforce'));
    }

    // 3) If there is another unresolved topic, use it before falling back to aggregate mastery.
    if (plan.length < count) {
        for (const row of priority) {
            if (plan.some(item => item.topic === row.topic)) continue;
            const event = latest.get(row.topic);
            if (!unresolved(event)) continue;
            const available = candidates.filter(task => !chosen.has(task.id));
            const task = sameTopicCandidate(row.topic, available, event?.kind || null, event?.taskId || null);
            if (task && pushPlan(plan, chosen, task, 'second-focus', `Second focus: ${row.topic} also has unresolved recent evidence, so it stays in this short practice set.`)) break;
        }
    }

    const correctedTopics = new Set([...latest.entries()].filter(([, row]) => corrected(row)).map(([topic]) => topic));

    // 4) Transfer: move to a different topic, preferring incomplete/untried work and avoiding a just-corrected topic where possible.
    if (plan.length < count) {
        const focusTopics = new Set(plan.map(item => item.topic));
        let pool = candidates.filter(task => !chosen.has(task.id) && !focusTopics.has(task.topic) && !correctedTopics.has(task.topic));
        if (!pool.length) pool = candidates.filter(task => !chosen.has(task.id) && !focusTopics.has(task.topic));
        pool.sort((a, b) => taskSort(a, b, stats, lessonProgress, challengeProgress));
        const task = pool[0];
        if (task) pushPlan(plan, chosen, task, 'transfer', `Transfer: switch to ${task.topic} so the session checks whether the underlying mechanics carry across a different concept rather than over-drilling one area.`);
    }

    // 5) Consolidate/fill with the strongest remaining deterministic priorities.
    const remaining = candidates.filter(task => !chosen.has(task.id)).sort((a, b) => taskSort(a, b, stats, lessonProgress, challengeProgress));
    for (const task of remaining) {
        if (plan.length >= count) break;
        const score = masteryFor(task.topic, stats);
        const state = isComplete(task, lessonProgress, challengeProgress)
            ? 'completed work worth revisiting'
            : score === null ? 'an untried task' : `a ${score}% mastery topic`;
        pushPlan(plan, chosen, task, 'consolidate', `Consolidate: ${task.topic} is ${state}, giving the session breadth without duplicating a question already selected.`);
    }

    return plan.slice(0, count);
}
