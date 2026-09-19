"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = build;

const STATUS = {
    unresolved: { label: 'Unresolved', rank: 0 },
    recovered: { label: 'Recovered', rank: 1 },
    first_try: { label: 'First-try correct', rank: 2 },
    stable: { label: 'First-try stable', rank: 3 },
    developing: { label: 'Developing', rank: 4 }
};

function cleanText(value, max = 120) {
    return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}
function cleanEvents(events) {
    return (Array.isArray(events) ? events : [])
        .filter(row => row && typeof row === 'object' && cleanText(row.topic))
        .map(row => ({
            event: ['attempt','reveal','skip'].includes(row.event) ? row.event : 'attempt',
            topic: cleanText(row.topic),
            correct: row.event === 'attempt' && typeof row.correct === 'boolean' ? row.correct : null,
            firstTry: row.event === 'attempt' && typeof row.firstTry === 'boolean' ? row.firstTry : null,
            timestamp: Number.isFinite(Number(row.timestamp)) ? Number(row.timestamp) : 0
        }))
        .sort((a,b) => a.timestamp - b.timestamp);
}
function marker(row) {
    if (row.event === 'reveal') return { state:'unresolved', label:'Reveal used', timestamp:row.timestamp };
    if (row.event === 'skip') return { state:'unresolved', label:'Skipped', timestamp:row.timestamp };
    if (row.correct === false) return { state:'unresolved', label:'Incorrect', timestamp:row.timestamp };
    if (row.correct === true && row.firstTry === true) return { state:'first_try', label:'First-try correct', timestamp:row.timestamp };
    if (row.correct === true) return { state:'recovered', label:'Corrected', timestamp:row.timestamp };
    return { state:'developing', label:'Attempt', timestamp:row.timestamp };
}
function statusFor(rows) {
    if (!rows.length) return 'developing';
    const latest = rows.at(-1);
    const latestMarker = marker(latest);
    if (latestMarker.state === 'unresolved') return 'unresolved';

    const attempts = rows.filter(row => row.event === 'attempt');
    const lastTwo = attempts.slice(-2);
    const twoFirstTry = lastTwo.length === 2 && lastTwo.every(row => row.correct === true && row.firstTry === true);
    if (twoFirstTry && latestMarker.state !== 'unresolved') return 'stable';

    const hadEarlierDifficulty = rows.slice(0,-1).some(row => marker(row).state === 'unresolved');
    if (latest.event === 'attempt' && latest.correct === true && hadEarlierDifficulty) return 'recovered';
    if (latest.event === 'attempt' && latest.correct === true && latest.firstTry === true) return 'first_try';
    return 'developing';
}
function explanation(status, topic) {
    if (status === 'unresolved') return `Latest checked evidence for ${topic} is still unresolved. Revisit it before treating the topic as secure.`;
    if (status === 'recovered') return `A recent difficulty in ${topic} was followed by a correct checked response. BeamLab records the recovery without assuming long-term mastery.`;
    if (status === 'stable') return `The two newest checked attempts in ${topic} were both correct on the first try. This is recent stability evidence, not a permanent mastery claim.`;
    if (status === 'first_try') return `The newest checked attempt in ${topic} was correct on the first try. More evidence is needed before calling the pattern stable.`;
    return `There is recent activity in ${topic}, but not enough evidence for a stronger trajectory label.`;
}
function masteryScore(topic, mastery) {
    const stat = mastery && typeof mastery === 'object' ? mastery[topic] : null;
    if (!stat || !(Number(stat.firstAttempts) > 0)) return null;
    const firstAttempts = Math.max(1, Number(stat.firstAttempts) || 0);
    const attempts = Math.max(1, Number(stat.attempts) || 0);
    const first = (Number(stat.firstCorrect) || 0) / firstAttempts;
    const overall = (Number(stat.correct) || 0) / attempts;
    return Math.max(0, Math.min(100, Math.round(100 * (.7 * first + .3 * overall))));
}
function build(events, mastery = {}, limit = 6) {
    const clean = cleanEvents(events);
    const groups = new Map();
    for (const row of clean) {
        if (!groups.has(row.topic)) groups.set(row.topic, []);
        groups.get(row.topic).push(row);
    }
    const rows = [...groups.entries()].map(([topic, topicEvents]) => {
        const status = statusFor(topicEvents);
        return {
            topic,
            status,
            label: STATUS[status].label,
            explanation: explanation(status, topic),
            latestAt: topicEvents.at(-1)?.timestamp || 0,
            eventCount: topicEvents.length,
            masteryScore: masteryScore(topic, mastery),
            markers: topicEvents.slice(-6).map(marker)
        };
    }).sort((a,b) => b.latestAt - a.latestAt || STATUS[a.status].rank - STATUS[b.status].rank || a.topic.localeCompare(b.topic));

    const visible = rows.slice(0, Math.max(1, Math.min(10, Number(limit) || 6)));
    const counts = rows.reduce((acc,row) => {
        acc[row.status] = (acc[row.status] || 0) + 1;
        return acc;
    }, {unresolved:0,recovered:0,first_try:0,stable:0,developing:0});

    return {
        rows: visible,
        counts,
        eventWindow: clean.length,
        topicCount: rows.length,
        boundary: 'Recent trajectory is derived only from bounded local learning events. It describes observed response history, not intelligence, ability, grade, or proof of a misconception.'
    };
}
