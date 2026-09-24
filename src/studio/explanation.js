'use strict';
const {effectiveModel} = require('../model/study');
const {signed} = require('./common');
const f = (n, digits = 3) => (Math.abs(n) < .5 * 10 ** -digits ? 0 : n).toFixed(digits);
const curvature = (moment, EI) => {
    if (!Number.isFinite(EI) || EI <= 0) return 'unavailable';
    const value = moment / EI;
    if (Math.abs(value) < 1e-15) return '0 m⁻¹';
    const [mantissa, exponent] = value.toExponential(3).split('e');
    const raised = String(Number(exponent)).replace(/[-0-9]/g, c => ({'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'})[c]);
    return `${mantissa} × 10${raised} m⁻¹`;
};

// Read field values and local intensity from the solved elements. This is an
// explanation of the authoritative solve, never a second beam calculation.
function explainAt(model, analysis, position, level = 'year1') {
    if (!analysis || !model) throw new Error('A solved model is required.');
    const x = Math.max(0, Math.min(model.length, Number(position) || 0));
    const left = analysis.sample(x, 'left'), right = analysis.sample(x, 'right');
    const element = analysis.elements.find(e => x >= e.a - 1e-10 && x < e.b - 1e-10) || analysis.elements.at(-1);
    const w = element.w0 + element.slope * (x - element.a);
    const jumpV = right.V - left.V, jumpM = right.M - left.M;
    const hasVJump = Math.abs(jumpV) > 1e-7, hasMJump = Math.abs(jumpM) > 1e-7;
    const at = effectiveModel(model).items.filter(i => Math.abs(i.x - x) < 1e-8);
    const hinge = at.find(i => i.kind === 'hinge');
    const support = at.find(i => ['pin','roller','fixed'].includes(i.kind));
    const endpoint = x < 1e-8 || Math.abs(x - model.length) < 1e-8;
    let title = 'Shear controls how moment changes here.';
    const lines = [];
    if (hasVJump || hasMJump) {
        title = hasVJump && hasMJump ? 'Concentrated actions create both a shear jump and a moment jump.'
            : hasVJump ? 'The concentrated vertical action creates a shear jump.' : 'The concentrated couple creates a moment jump.';
        if (hasVJump) lines.push(`V⁻ = ${f(left.V)} kN; V⁺ = ${f(right.V)} kN. ΔV = V⁺ − V⁻ = ${f(jumpV)} kN, from the net vertical action here.`);
        if (hasMJump) lines.push(`M⁻ = ${f(left.M)} kN·m; M⁺ = ${f(right.M)} kN·m. ΔM = M⁺ − M⁻ = ${f(jumpM)} kN·m, from the net applied or reaction couple here.`);
        if (!hasMJump) lines.push('Bending moment remains continuous across this position; the change in shear changes its slope.');
        if (!hasVJump) lines.push('Shear remains continuous across this position; the net couple changes moment directly.');
    } else if (endpoint) {
        title = 'Read the response just inside the end of the member.';
        lines.push('This is a boundary, so the displayed value is the internal member response. There is no second beam region outside the endpoint.');
    } else if (Math.abs(w) > 1e-8) {
        title = 'Distributed loading controls the shear slope here.';
    } else if (Math.abs(right.V) < 1e-8) {
        title = 'Moment is locally stationary here.';
        lines.push('Shear is approximately zero here. This may be a smooth maximum, minimum or a flat moment region; zero shear alone does not identify the global peak.');
    }
    if (hinge) lines.push(Math.abs(left.M) < 1e-7 && Math.abs(right.M) < 1e-7
        ? 'The internal hinge releases bending moment: M = 0 at both adjacent faces. Vertical displacement stays continuous; rotation can differ.'
        : 'An internal release is present. Read the two adjacent face values with the concentrated actions at this position.');
    if (support) {
        const reaction = analysis.reactions.find(r => r.id === support.id || Math.abs(r.x - x) < 1e-8);
        if (reaction) lines.push(`The support reaction is ${f(reaction.force)} kN (upward positive)${reaction.fixed ? `, with reaction couple ${f(reaction.moment)} kN·m (counter-clockwise positive)` : ''}.`);
        if (!endpoint && support.kind !== 'fixed') lines.push('An intermediate pin or roller supports vertical movement; it does not release moment in a continuous member.');
        if (support.settlementMm || support.rotationMrad) lines.push(`The imposed support movement is ${f(support.settlementMm || 0)} mm upward and ${f(support.rotationMrad || 0)} mrad counter-clockwise. The solved compatibility includes these prescribed values.`);
    }
    lines.push(`The effective downward load intensity in the ${endpoint && x > 0 ? 'left-hand' : 'right-hand'} region is ${f(w)} kN/m${model.selfWeight ? ', including enabled, factored self-weight' : ''}. The local shear slope is ${f(-w)} kN/m.`);
    lines.push(`V = ${f(right.V)} kN and M = ${f(right.M)} kN·m at x = ${f(x)} m${endpoint && x > 0 ? ' (inside the left face)' : ' (right-hand value)'}.`);
    if (Math.abs(right.V) > 1e-8) lines.push(`${right.V > 0 ? 'Positive' : 'Negative'} shear means moment is ${right.V > 0 ? 'rising' : 'falling'} as x increases within this region.`);
    const formula = level === 'year1' ? 'Load → shear → moment → bending' : 'dV/dx = −w(x)    ·    dM/dx = V(x)    ·    EI d²v/dx² = M(x)';
    if (level !== 'year1') lines.push(`Elastic displacement here is ${f(right.v * 1000)} mm (upward positive) and rotation is ${f(right.theta, 6)} rad. Local EI = ${f(right.localEI)} kN·m².`);
    if (level === 'year3' || level === 'all') lines.push('This explains the current linear-elastic model, not capacity or code compliance. A global peak may also occur at an endpoint, a corner or a moment jump.');
    const steps = [
        {label:'1 · Loading sets the shear slope', equation:'dV/dx = −w(x)', value:`w = ${signed(w)} kN/m → dV/dx = ${signed(-w)} kN/m`, detail:hasVJump ? `At this action, V⁻ = ${f(left.V)} kN and V⁺ = ${f(right.V)} kN: ΔV = ${f(jumpV)} kN. Between actions the local slope still follows the load intensity.` : 'The intensity applies between structural events. A concentrated force changes shear suddenly at its own position.'},
        {label:'2 · Shear sets the moment slope', equation:'dM/dx = V(x)', value:`V = ${f(right.V)} kN → moment ${right.V > 1e-8 ? 'rises' : right.V < -1e-8 ? 'falls' : 'is locally stationary'} toward increasing x`, detail:hasMJump ? `M⁻ = ${f(left.M)} kN·m and M⁺ = ${f(right.M)} kN·m: ΔM = ${f(jumpM)} kN·m. A couple creates an immediate moment change.` : `M = ${f(right.M)} kN·m here. There is no moment jump at this position; a vertical point action can change the slope across its location.`},
        {label:level === 'year1' ? '3 · Moment bends the beam' : '3 · Moment sets elastic curvature', equation:level === 'year1' ? 'Moment → bending' : 'EI d²v/dx² = M(x)', value:level === 'year1' ? `M = ${f(right.M)} kN·m at this position` : `M = ${f(right.M)} kN·m; EI = ${f(right.localEI)} kN·m² → v″ = ${curvature(right.M,right.localEI)}`, detail:level === 'year1' ? 'The support arrangement and loading across the whole beam also affect its shape.' : 'Curvature follows M/EI within this local section. Deflection also depends on the supports, hinges and every other region; local moment alone does not give the displacement.'}
    ];
    return {x, title, lines, formula, steps, facts:{left, right, w, jumpV, jumpM, endpoint}};
}
module.exports = {explainAt};
