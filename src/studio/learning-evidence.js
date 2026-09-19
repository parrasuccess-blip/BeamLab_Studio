"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_EVENTS = void 0;
exports.normaliseEvent = normaliseEvent;
exports.appendEvent = appendEvent;
exports.snapshot = snapshot;

exports.MAX_EVENTS = 24;
const EVENT_TYPES = new Set(['attempt','reveal','skip']);

function shortText(value, max = 180) {
    return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}
function finiteInt(value, fallback = 0, max = 999) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(max, Math.round(n))) : fallback;
}
function canonical(value) {
    return shortText(value, 180).toLowerCase().replace(/[^a-z0-9.+\-/%=]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function masteryScore(stat) {
    if (!stat || !(Number(stat.firstAttempts) > 0)) return null;
    const firstAttempts = Math.max(1, Number(stat.firstAttempts) || 0);
    const attempts = Math.max(1, Number(stat.attempts) || 0);
    const first = (Number(stat.firstCorrect) || 0) / firstAttempts;
    const overall = (Number(stat.correct) || 0) / attempts;
    return Math.max(0, Math.min(100, Math.round(100 * (.7 * first + .3 * overall))));
}
function normaliseEvent(input, now = Date.now()) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const event = EVENT_TYPES.has(input.event) ? input.event : 'attempt';
    const timestamp = Number.isFinite(Number(input.timestamp)) ? Number(input.timestamp) : now;
    return {
        event,
        kind: input.kind === 'challenge' ? 'challenge' : input.kind === 'lesson' ? 'lesson' : 'learning',
        taskId: shortText(input.taskId, 80),
        taskTitle: shortText(input.taskTitle, 160),
        topic: shortText(input.topic, 120) || 'Structural mechanics',
        correct: event === 'attempt' && typeof input.correct === 'boolean' ? input.correct : null,
        firstTry: event === 'attempt' && typeof input.firstTry === 'boolean' ? input.firstTry : null,
        tries: event === 'attempt' ? finiteInt(input.tries, 1, 20) : 0,
        answer: shortText(input.answer, 180),
        expected: shortText(input.expected, 180),
        method: shortText(input.method, 80),
        mode: input.mode === 'exam' ? 'exam' : input.mode === 'practice' ? 'practice' : 'standalone',
        timestamp
    };
}
function appendEvent(events, input, now = Date.now()) {
    const list = Array.isArray(events) ? events.map(row => normaliseEvent(row, now)).filter(Boolean) : [];
    const row = normaliseEvent(input, now);
    if (row) list.push(row);
    return list.slice(-exports.MAX_EVENTS);
}
function topicSummary(mastery) {
    if (!mastery || typeof mastery !== 'object' || Array.isArray(mastery)) return [];
    return Object.entries(mastery).map(([topic, raw]) => {
        const stat = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
        return {
            topic: shortText(topic, 120),
            score: masteryScore(stat),
            attempts: finiteInt(stat.attempts),
            firstAttempts: finiteInt(stat.firstAttempts),
            firstCorrect: finiteInt(stat.firstCorrect),
            correct: finiteInt(stat.correct),
            reveals: finiteInt(stat.reveals),
            lastAt: Number.isFinite(Number(stat.lastAt)) ? Number(stat.lastAt) : null
        };
    }).filter(row => row.topic).sort((a,b) => (a.score ?? 50) - (b.score ?? 50) || b.attempts - a.attempts || (b.lastAt || 0) - (a.lastAt || 0)).slice(0, 10);
}
function snapshot(events, mastery = {}, activeTask = null) {
    const clean = (Array.isArray(events) ? events : []).map(row => normaliseEvent(row)).filter(Boolean).slice(-exports.MAX_EVENTS);
    const recentEvents = clean.slice(-10);
    const masteryRows = topicSummary(mastery);
    const grouped = new Map();
    for (const row of recentEvents) {
        if (!grouped.has(row.topic)) grouped.set(row.topic, {topic:row.topic, wrong:0, correct:0, reveals:0, skips:0, latestAt:0});
        const g = grouped.get(row.topic);
        g.latestAt = Math.max(g.latestAt, row.timestamp || 0);
        if (row.event === 'attempt') row.correct ? g.correct++ : g.wrong++;
        else if (row.event === 'reveal') g.reveals++;
        else if (row.event === 'skip') g.skips++;
    }
    const masteryByTopic = new Map(masteryRows.map(row => [row.topic, row]));
    const allTopics = new Set([...grouped.keys(), ...masteryRows.map(row => row.topic)]);
    const priorityTopics = [...allTopics].map(topic => {
        const g = grouped.get(topic) || {topic,wrong:0,correct:0,reveals:0,skips:0,latestAt:0};
        const stat = masteryByTopic.get(topic);
        const weakness = stat?.score === null || stat?.score === undefined ? 0 : Math.max(0, 65 - stat.score) / 10;
        const priority = g.wrong * 3 + g.reveals * 2 + g.skips * 2 + weakness;
        const reasons = [];
        if (g.wrong) reasons.push(g.wrong + ' recent incorrect attempt' + (g.wrong === 1 ? '' : 's'));
        if (g.reveals) reasons.push(g.reveals + ' reveal' + (g.reveals === 1 ? '' : 's'));
        if (g.skips) reasons.push(g.skips + ' skip' + (g.skips === 1 ? '' : 's'));
        if (stat?.score !== null && stat?.score !== undefined && stat.score < 65) reasons.push('mastery score ' + stat.score + '%');
        return {topic, priority:Number(priority.toFixed(2)), reason:reasons.join(' + ') || 'limited recent evidence', recentWrong:g.wrong, recentCorrect:g.correct, reveals:g.reveals, skips:g.skips, masteryScore:stat?.score ?? null, latestAt:g.latestAt || stat?.lastAt || null};
    }).filter(row => row.priority > 0).sort((a,b) => b.priority - a.priority || (b.latestAt || 0) - (a.latestAt || 0)).slice(0, 5);

    const responseGroups = new Map();
    for (const row of recentEvents) {
        if (row.event !== 'attempt' || row.correct !== false || !row.answer || !row.expected) continue;
        const answerKey = canonical(row.answer), expectedKey = canonical(row.expected);
        if (!answerKey || !expectedKey || answerKey === expectedKey) continue;
        const key = row.topic + '\n' + answerKey;
        const prev = responseGroups.get(key) || {topic:row.topic, answer:row.answer, expected:row.expected, count:0, latestAt:0};
        prev.count += 1;
        prev.latestAt = Math.max(prev.latestAt, row.timestamp || 0);
        prev.expected = row.expected || prev.expected;
        responseGroups.set(key, prev);
    }
    const repeatedWrongResponses = [...responseGroups.values()].filter(row => row.count >= 2).sort((a,b) => b.count - a.count || b.latestAt - a.latestAt).slice(0, 3);

    let task = null;
    if (typeof activeTask === 'string' && activeTask.trim()) task = {title:shortText(activeTask, 160)};
    else if (activeTask && typeof activeTask === 'object' && !Array.isArray(activeTask)) task = {
        kind: activeTask.kind === 'challenge' ? 'challenge' : activeTask.kind === 'lesson' ? 'lesson' : 'learning',
        id: shortText(activeTask.id, 80),
        title: shortText(activeTask.title, 160),
        topic: shortText(activeTask.topic, 120)
    };

    return {
        activeTask: task,
        recentEvents,
        priorityTopics,
        repeatedWrongResponses,
        topicSummary: masteryRows,
        interpretationBoundary: 'This is deterministic local learning evidence for sequencing and diagnostic questions. Weak scores, reveals, skips or repeated errors are not proof of a misconception. A repeated wrong response is evidence of a response pattern only; infer an underlying misconception only when the student reasoning itself supports it.'
    };
}
