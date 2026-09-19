"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTasks = buildTasks;
exports.recommendNext = recommendNext;

const challenges_1 = require("./challenges");

function cleanProgress(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function buildTasks(level) {
    const lessons = (0, challenges_1.listLessons)(level).map((spec, index) => ({
        kind: 'lesson',
        id: spec.id,
        title: spec.title,
        topic: (0, challenges_1.topicForTask)('lesson', spec.id),
        order: index,
        summary: spec.summary || ''
    }));
    const challenges = (0, challenges_1.listChallenges)(level).map((spec, index) => ({
        kind: 'challenge',
        id: spec.id,
        title: spec.title,
        topic: (0, challenges_1.topicForTask)('challenge', spec.id),
        order: index,
        summary: spec.prompt || ''
    }));
    return { lessons, challenges, all: [...lessons, ...challenges] };
}

function latestEventByTopic(evidence) {
    const map = new Map();
    const rows = Array.isArray(evidence?.recentEvents) ? evidence.recentEvents : [];
    for (const row of rows) {
        if (!row?.topic) continue;
        const previous = map.get(row.topic);
        if (!previous || Number(row.timestamp || 0) >= Number(previous.timestamp || 0)) map.set(row.topic, row);
    }
    return map;
}

function firstIncomplete(tasks, progress) {
    return tasks.find(task => !progress[task.id]) || null;
}

function sameTopicCandidate(topic, tasks, lessonProgress, challengeProgress) {
    const lesson = tasks.lessons.find(task => task.topic === topic && !lessonProgress[task.id]);
    if (lesson) return lesson;
    return tasks.challenges.find(task => task.topic === topic && !challengeProgress[task.id]) || null;
}

function reasonForEvent(event, task) {
    const topic = event.topic || task.topic;
    if (event.event === 'reveal') return `You revealed a reference on ${topic}. Revisit the idea once without the reference before moving on.`;
    if (event.event === 'skip') return `You left a recent ${topic} task blank. This is the shortest route back into that concept.`;
    if (event.event === 'attempt' && event.correct === false) return `Your most recent ${topic} attempt was not correct. Revisit the relationship before adding another layer of difficulty.`;
    return `Recent practice points back to ${topic}.`;
}

function recommendNext(level, evidence = {}, lessonProgressInput = {}, challengeProgressInput = {}) {
    const tasks = buildTasks(level);
    const lessonProgress = cleanProgress(lessonProgressInput);
    const challengeProgress = cleanProgress(challengeProgressInput);
    const completed = task => task.kind === 'lesson' ? !!lessonProgress[task.id] : !!challengeProgress[task.id];
    const incomplete = tasks.all.filter(task => !completed(task));

    if (!incomplete.length) {
        return {
            kind: 'session',
            id: 'practice',
            title: 'Mixed four-question practice',
            topic: 'Mixed revision',
            reason: 'You have completed every lesson and numerical challenge at this level. Use a mixed practice session to check retention across topics.',
            basis: 'level-complete',
            actionLabel: 'Start mixed practice'
        };
    }

    const latest = latestEventByTopic(evidence);
    const priorityRows = Array.isArray(evidence?.priorityTopics) ? evidence.priorityTopics : [];

    for (const priority of priorityRows) {
        const last = latest.get(priority.topic);
        if (last?.event === 'attempt' && last.correct === true) continue;
        if (!last || (last.event === 'attempt' && last.correct === false) || last.event === 'reveal' || last.event === 'skip') {
            const task = sameTopicCandidate(priority.topic, tasks, lessonProgress, challengeProgress);
            if (task) return {
                ...task,
                reason: last ? reasonForEvent(last, task) : `Your current practice history makes ${priority.topic} the strongest topic to revisit next.`,
                basis: last ? 'recent-difficulty' : 'priority-topic',
                actionLabel: task.kind === 'lesson' ? 'Open recommended lesson' : 'Open recommended challenge'
            };
        }
    }

    const recent = Array.isArray(evidence?.recentEvents) ? [...evidence.recentEvents].reverse() : [];
    const mostRecentCorrect = recent.find(row => row?.event === 'attempt' && row.correct === true);
    const nextLesson = firstIncomplete(tasks.lessons, lessonProgress);
    if (nextLesson) {
        return {
            ...nextLesson,
            reason: mostRecentCorrect
                ? `Your latest checked attempt on ${mostRecentCorrect.topic} was correct, so BeamLab is moving forward to the next incomplete concept.`
                : 'No recent difficulty needs remediation, so BeamLab is starting with the next incomplete concept lesson.',
            basis: mostRecentCorrect ? 'advance-after-correction' : 'next-incomplete',
            actionLabel: 'Open recommended lesson'
        };
    }

    const nextChallenge = firstIncomplete(tasks.challenges, challengeProgress);
    if (nextChallenge) {
        return {
            ...nextChallenge,
            reason: mostRecentCorrect
                ? `Your latest checked attempt on ${mostRecentCorrect.topic} was correct. Next, test the remaining calculation work without adding hints.`
                : 'The concept lessons are complete. The next useful step is an unfinished numerical challenge.',
            basis: mostRecentCorrect ? 'advance-after-correction' : 'next-incomplete',
            actionLabel: 'Open recommended challenge'
        };
    }

    return null;
}
