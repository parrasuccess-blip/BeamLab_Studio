"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detail = detail;

const trajectory_1 = require("./learning-trajectory");
const learning_path_1 = require("./learning-path");

function cleanText(value, max = 180) {
    return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}
function progress(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function outcome(row) {
    if (row.event === 'reveal') return 'Reference revealed';
    if (row.event === 'skip') return 'Skipped';
    if (row.event === 'attempt' && row.correct === false) return 'Incorrect';
    if (row.event === 'attempt' && row.correct === true && row.firstTry === true) return 'First-try correct';
    if (row.event === 'attempt' && row.correct === true) return 'Corrected';
    return 'Attempt';
}
function sameTopicTasks(level, topic, lessonProgress, challengeProgress) {
    const tasks = (0, learning_path_1.buildTasks)(level).all.filter(task => task.topic === topic);
    return tasks.map(task => ({
        ...task,
        completed: task.kind === 'lesson' ? !!lessonProgress[task.id] : !!challengeProgress[task.id]
    }));
}
function chooseNext(status, tasks, latest) {
    const incomplete = tasks.filter(task => !task.completed);
    const preferredChallenge = incomplete.find(task => task.kind === 'challenge');
    const preferredLesson = incomplete.find(task => task.kind === 'lesson');

    if (status === 'stable') {
        return {
            task: null,
            reason: 'No same-topic drill is recommended right now. Recent evidence is stable, so BeamLab should broaden the work instead of over-drilling this topic.'
        };
    }
    if (status === 'unresolved') {
        const task = preferredLesson || preferredChallenge || tasks.find(task => task.id !== latest?.taskId) || tasks[0] || null;
        return {
            task,
            reason: task
                ? 'Revisit the concept with a checked task before treating this topic as secure. BeamLab prefers an unfinished lesson first, then an unfinished numerical challenge.'
                : 'No same-topic exercise is available at this level. Use the broader Recommended Next path.'
        };
    }
    if (status === 'recovered') {
        const task = preferredChallenge || preferredLesson || tasks.find(task => task.id !== latest?.taskId) || null;
        return {
            task,
            reason: task
                ? 'Use one different checked task to confirm that the recovery transfers beyond the question that was just corrected.'
                : 'The available same-topic tasks are already complete. Follow the broader Recommended Next path rather than repeating the same item.'
        };
    }
    if (status === 'first_try') {
        const task = preferredChallenge || preferredLesson || tasks.find(task => task.id !== latest?.taskId) || null;
        return {
            task,
            reason: task
                ? 'One more independent checked attempt can show whether this first-try success is becoming a stable recent pattern.'
                : 'No additional same-topic task is available at this level. Follow the broader Recommended Next path.'
        };
    }
    const task = preferredLesson || preferredChallenge || tasks[0] || null;
    return {
        task,
        reason: task
            ? 'There is not enough recent evidence for a stronger trajectory label, so the next useful step is a checked task in the same topic.'
            : 'No same-topic exercise is available at this level. Use the broader Recommended Next path.'
    };
}
function detail(level, topicInput, eventsInput, mastery = {}, lessonProgressInput = {}, challengeProgressInput = {}) {
    const topic = cleanText(topicInput, 120);
    const lessonProgress = progress(lessonProgressInput);
    const challengeProgress = progress(challengeProgressInput);
    const source = (Array.isArray(eventsInput) ? eventsInput : [])
        .filter(row => row && cleanText(row.topic, 120) === topic)
        .sort((a,b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));

    const currentView = (0, trajectory_1.build)(source, mastery, 10);
    const current = currentView.rows.find(row => row.topic === topic) || null;
    const tasks = sameTopicTasks(level, topic, lessonProgress, challengeProgress);
    const taskMap = new Map(tasks.map(task => [task.id, task]));

    const events = source.slice(-8).map((row, index, visible) => {
        const fullIndex = Math.max(0, source.length - visible.length) + index;
        const prefix = source.slice(0, fullIndex + 1);
        const stateView = (0, trajectory_1.build)(prefix, mastery, 10);
        const state = stateView.rows.find(item => item.topic === topic);
        const knownTask = taskMap.get(row.taskId);
        return {
            event: row.event,
            kind: row.kind === 'challenge' ? 'challenge' : row.kind === 'lesson' ? 'lesson' : 'learning',
            taskId: cleanText(row.taskId, 80),
            taskTitle: cleanText(row.taskTitle, 160) || knownTask?.title || 'Learning activity',
            outcome: outcome(row),
            stateAfter: state?.label || 'Developing',
            stateKey: state?.status || 'developing',
            answer: cleanText(row.answer, 180),
            expected: cleanText(row.expected, 180),
            method: cleanText(row.method, 80),
            mode: row.mode === 'exam' ? 'exam' : row.mode === 'practice' ? 'practice' : row.mode === 'plan' ? 'plan' : 'standalone',
            timestamp: Number.isFinite(Number(row.timestamp)) ? Number(row.timestamp) : 0
        };
    });

    const latest = source.at(-1) || null;
    const next = chooseNext(current?.status || 'developing', tasks, latest);
    return {
        topic,
        current,
        events,
        tasks,
        nextTask: next.task,
        nextReason: next.reason,
        boundary: 'This drill-down explains only the bounded local evidence behind the current trajectory state. It does not diagnose intelligence, ability, grade, competence, or a misconception.'
    };
}
