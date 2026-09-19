"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarise = summarise;

function cleanRows(rows) {
    return (Array.isArray(rows) ? rows : []).filter(row => row && typeof row === 'object');
}
function unique(values) {
    return [...new Set(values.filter(Boolean))];
}
function summarise(rowsInput) {
    const rows = cleanRows(rowsInput);
    const firstTryRows = rows.filter(row => !!row.firstCorrect);
    const recoveredRows = rows.filter(row => !row.firstCorrect && !!row.correct);
    const unresolvedRows = rows.filter(row => !row.correct);
    const revealedRows = rows.filter(row => !!row.revealed);
    const blankRows = rows.filter(row => !!row.skipped);

    const unresolvedTopics = unique(unresolvedRows.map(row => row.topic));
    const recoveredTopics = unique(recoveredRows.map(row => row.topic).filter(topic => !unresolvedTopics.includes(topic)));
    const strengthTopics = unique(firstTryRows.map(row => row.topic).filter(topic => !unresolvedTopics.includes(topic) && !recoveredTopics.includes(topic)));

    let headline = 'Session complete.';
    let explanation = 'Use the detailed question review below to decide what to revisit.';
    if (rows.length && unresolvedRows.length === 0 && recoveredRows.length === 0) {
        headline = 'Clean first pass.';
        explanation = 'Every checked item was correct on the first attempt. BeamLab can move the learning path forward rather than repeating this set.';
    } else if (unresolvedRows.length === 0 && recoveredRows.length > 0) {
        headline = 'You repaired the misses during the session.';
        explanation = 'No question remained unresolved. The recovered topics are still useful evidence, but the next step can now broaden or advance the work.';
    } else if (unresolvedRows.length > 0 && recoveredRows.length > 0) {
        headline = 'Some ideas recovered; others still need another pass.';
        explanation = 'Recovered items and unresolved items are separated so BeamLab does not treat every initial error as an ongoing weakness. An unresolved result is evidence for another check, not proof of a misconception.';
    } else if (unresolvedRows.length > 0) {
        headline = 'A few ideas are still unresolved.';
        explanation = 'The unresolved list comes only from this session outcome. It is evidence for what to revisit next, not proof of a misconception.';
    }

    return {
        total: rows.length,
        firstTry: firstTryRows.length,
        recovered: recoveredRows.length,
        unresolved: unresolvedRows.length,
        revealed: revealedRows.length,
        blank: blankRows.length,
        headline,
        explanation,
        strengths: strengthTopics,
        recoveredTopics,
        unresolvedTopics
    };
}
