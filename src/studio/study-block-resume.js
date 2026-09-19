"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.MAX_AGE_MS = void 0;
exports.create = create;
exports.normalise = normalise;
exports.completedCount = completedCount;
exports.summary = summary;

exports.VERSION = 1;
exports.MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}
function cleanText(value, max = 160) {
    return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}
function finite(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}
function locked(row) {
    return !!row && row.locked === true;
}
function completedCount(snapshotOrSession) {
    const session = snapshotOrSession?.session || snapshotOrSession;
    const results = Array.isArray(session?.results) ? session.results : [];
    let count = 0;
    while (count < results.length && locked(results[count])) count += 1;
    return count;
}
function create(session, level, now = Date.now()) {
    if (!session || session.mode !== 'plan' || !session.active || !session.origin || !Array.isArray(session.queue) || !session.queue.length) return null;
    const savedAt = finite(now, Date.now());
    return {
        version: exports.VERSION,
        savedAt,
        level: cleanText(level, 24) || cleanText(session.origin?.view?.level, 24) || 'year1',
        elapsedMs: Math.max(0, savedAt - finite(session.startedAt, savedAt)),
        session: clone({
            queue: session.queue,
            results: Array.isArray(session.results) ? session.results : [],
            focusTarget: Math.max(0, finite(session.focusTarget)),
            mixedTarget: Math.max(1, finite(session.mixedTarget, 4)),
            phaseTotal: Math.max(1, finite(session.phaseTotal, 1)),
            planRevision: Math.max(0, finite(session.planRevision)),
            targetCount: Math.max(1, finite(session.targetCount, session.queue.length)),
            initialTrajectory: session.initialTrajectory || null,
            studyPlanRationale: cleanText(session.studyPlanRationale, 600),
            origin: session.origin
        })
    };
}
function normalise(input, now = Date.now()) {
    let raw = input;
    if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch { return null; }
    }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    if (Number(raw.version) !== exports.VERSION) return null;
    const savedAt = finite(raw.savedAt, 0);
    if (!savedAt || finite(now, Date.now()) - savedAt > exports.MAX_AGE_MS) return null;
    if (finite(now, Date.now()) < savedAt - 5 * 60 * 1000) return null;
    const s = raw.session;
    if (!s || typeof s !== 'object' || Array.isArray(s)) return null;
    if (!s.origin || typeof s.origin !== 'object' || !s.origin.model) return null;
    if (!Array.isArray(s.queue) || !s.queue.length) return null;
    const queue = s.queue.filter(task => task && typeof task === 'object' && ['lesson','challenge'].includes(task.kind) && cleanText(task.id, 100));
    if (!queue.length) return null;
    const results = Array.isArray(s.results) ? s.results.slice(0, queue.length).map(row => row && typeof row === 'object' ? clone(row) : null) : [];
    const snapshot = {
        version: exports.VERSION,
        savedAt,
        level: cleanText(raw.level, 24) || cleanText(s.origin?.view?.level, 24) || 'year1',
        elapsedMs: Math.max(0, Math.min(24 * 60 * 60 * 1000, finite(raw.elapsedMs, 0))),
        session: {
            queue: clone(queue),
            results,
            focusTarget: Math.max(0, Math.min(8, finite(s.focusTarget))),
            mixedTarget: Math.max(1, Math.min(8, finite(s.mixedTarget, 4))),
            phaseTotal: Math.max(1, Math.min(12, finite(s.phaseTotal, 1))),
            planRevision: Math.max(0, Math.min(999, finite(s.planRevision))),
            targetCount: Math.max(1, Math.min(20, finite(s.targetCount, queue.length))),
            initialTrajectory: s.initialTrajectory && typeof s.initialTrajectory === 'object' ? clone(s.initialTrajectory) : null,
            studyPlanRationale: cleanText(s.studyPlanRationale, 600),
            origin: clone(s.origin)
        }
    };
    const done = completedCount(snapshot);
    if (done >= snapshot.session.queue.length) return null;
    return snapshot;
}
function summary(snapshot) {
    if (!snapshot) return null;
    const s = snapshot.session;
    const done = completedCount(snapshot);
    const focusTotal = s.queue.filter(task => task.blockRole === 'focus').length;
    const mixedTotal = s.queue.filter(task => task.blockRole === 'mixed').length;
    const completed = s.queue.slice(0, done);
    const completedFocus = completed.filter(task => task.blockRole === 'focus').length;
    const completedMixed = completed.filter(task => task.blockRole === 'mixed').length;
    const next = s.queue[done] || null;
    return {
        savedAt: snapshot.savedAt,
        elapsedMs: snapshot.elapsedMs,
        level: snapshot.level,
        completedCount: done,
        totalCount: s.queue.length,
        focusTotal,
        mixedTotal,
        completedFocus,
        completedMixed,
        nextTitle: cleanText(next?.title, 160) || 'Next study activity',
        nextTopic: cleanText(next?.topic, 120),
        nextRole: next?.blockRole === 'mixed' ? 'mixed' : 'focus',
        planRevision: s.planRevision || 0
    };
}
