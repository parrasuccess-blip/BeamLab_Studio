'use strict';
/** Pure presentation helpers are tested separately from the UI scheduler. */
function sweepPosition(length, progress) {
    if (!Number.isFinite(length) || length < 1 || length > 200 || !Number.isFinite(progress)) throw new Error('Invalid sweep geometry or progress.');
    return length * (0.05 + 0.9 * Math.max(0, Math.min(1, progress)));
}
function nextProgress(progress, direction, seconds, duration = 12) {
    if (![progress, direction, seconds, duration].every(Number.isFinite) || duration <= 0 || seconds < 0 || ![1, -1].includes(direction)) throw new Error('Invalid playback state.');
    const phase = direction === 1 ? progress : 2 - progress;
    const wrapped = ((phase + seconds / duration) % 2 + 2) % 2;
    return { progress: wrapped <= 1 ? wrapped : 2 - wrapped, direction: wrapped < 1 ? 1 : -1 };
}
const speakerNotes = [
    'Lead with interaction, not a list of features. Move the load or start the sweep. Point out that the labels, reactions and discontinuities are calculated together. This is a sequence of static solves, not dynamics.',
    'Explain why support conditions matter. The middle support changes the bending pattern. Do not call the negative region a software error: it is hogging moment.',
    'The geometry is held fixed so this isolates elastic modulus. The dashed curve is the original steel assumption; aluminium is more flexible for this same ideal section. Do not compare real products from E alone.',
    'Show that case factors do not overwrite original loads. Disable Wind, change Live, then bring Wind back. These factors are user choices, not prescribed design combinations.',
    'Use the worked solution to inspect reactions, region equations and extrema. Exported results belong to this exact study; no cloud or AI calculation is involved.',
    'Open model checks. Distinguish consistency residuals from independent analytical benchmarks and from real structural safety. The application is an educational research preview, not a certified design package.',
    'Explain the difference between a response diagram and an influence line: one fixes the load, the other fixes the observation. The envelope combines many positions and is not one simultaneous deformation shape. Click a section, show its governing lead position and refine the travel grid. All axle forces are unfactored unless you enter factored forces deliberately.',
    'Show the rectangular parabolic shear profile and zero transverse shear at the top/bottom surfaces. The integral recovers V. For I-sections this is an elementary width average, not a full flange stress solution. It does not change the Euler-Bernoulli deflection assumptions.'
];
module.exports = { sweepPosition, nextProgress, speakerNotes };
