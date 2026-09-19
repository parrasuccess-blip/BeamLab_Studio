'use strict';
const { effectiveModel, normalise, solveStudy } = require('../model/study');
const { example, makeItem } = require('../model/examples');
const { catalogue, fromCatalogue } = require('../model/catalogue');
const { sectionProperties } = require('../model/sections');
const { criticalSamples } = require('./diagrams');
const RELEASE = '4.0.0';

// Non-security reference ID. Canonical input is included in the evidence export.
function canonical(value) {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.keys(value).sort().filter(k => value[k] !== undefined).map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
    return JSON.stringify(value);
}
function fingerprint(model) {
    let hash = 2166136261;
    for (const byte of new TextEncoder().encode(canonical(model))) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
    return 'BL400-' + hash.toString(16).padStart(8, '0').toUpperCase();
}
// Four-point Gauss-Legendre is exact through degree 7. Supported linear loads
// give a degree-3 moment and degree-5 displacement on each event interval.
const gauss = [
    [-0.8611363115940526, 0.3478548451374538],
    [-0.3399810435848563, 0.6521451548625461],
    [0.3399810435848563, 0.6521451548625461],
    [0.8611363115940526, 0.3478548451374538]
];
function audit(model, analysis) {
    const a = analysis || solveStudy(model), effective = effectiveModel(model);
    let internal = 0, external = 0;
    for (const e of a.elements) {
        const half = (e.b - e.a) / 2, mid = (e.a + e.b) / 2;
        for (const [xi, weight] of gauss) {
            const x = mid + half * xi, s = a.sample(x), w = e.w0 + e.slope * (x - e.a);
            internal += weight * half * s.M * s.M / e.EI;
            external += weight * half * -w * s.v;
        }
    }
    for (const i of effective.items) {
        if (i.kind === 'point') external -= i.value * a.sample(i.x).v;
        if (i.kind === 'moment') external += i.value * a.sample(i.x).theta;
    }
    const forceScale = Math.max(1, Math.abs(a.total), a.reactions.reduce((v, r) => v + Math.abs(r.force), 0));
    const momentScale = Math.max(1, Math.abs(a.loadMoment), Math.abs(a.peakM.M), forceScale * model.length);
    const displacementScale = Math.max(1, Math.abs(a.peakD.v));
    const energyDifference = internal - external, energyTolerance = 1e-8 + 1e-6 * Math.max(Math.abs(internal), Math.abs(external));
    const check = (name, residual, tolerance, unit) => ({ name, residual, tolerance, unit, pass: Number.isFinite(residual) && Math.abs(residual) <= tolerance });
    const checks = [
        check('Vertical equilibrium', a.forceResidual, forceScale * 1e-7, 'kN'),
        check('Moment equilibrium', a.momentResidual, momentScale * 1e-7, 'kN m'),
        check('Hinge moment releases', a.hingeResidual, momentScale * 1e-7, 'kN m'),
        check('Support displacement / rotation', a.boundaryResidual, displacementScale * 1e-8, 'm equivalent'),
        check('Element-end compatibility', a.endCompatibilityResidual, displacementScale * 1e-8, 'm equivalent'),
        check('Strain energy / external work', energyDifference, energyTolerance, 'kN m')
    ];
    return {
        release: RELEASE, reference: fingerprint(model), generatedAt: new Date().toISOString(),
        interpretation: 'Numerical consistency evidence, not structural safety or code compliance. Reference ID is not a security hash.',
        model, properties: a.properties, reactions: a.reactions,
        extrema: { shear: a.peakV, moment: a.peakM, displacement: a.peakD },
        energy: { strainEnergy_kNm: internal / 2, halfFinalLoadWork_kNm: external / 2 },
        checks, pass: checks.every(c => c.pass), warnings: a.warnings,
        scope: 'Euler-Bernoulli with verified piecewise section properties and optional EI-only multipliers, linear elastic, zero prescribed support movement; true sections support local elastic stress while abrupt transition effects, dynamics, shear deformation and code checks remain outside scope.'
    };
}
function criticalLocations(a, model) {
    const samples = criticalSamples(a, 'M');
    const max = samples.reduce((s, t) => t.M > s.M ? t : s);
    const min = samples.reduce((s, t) => t.M < s.M ? t : s);
    const list = [];
    if (max.M > 1e-7) list.push({ name: 'Peak sagging moment', x: max.x, value: max.M, unit: 'kN m' });
    if (min.M < -1e-7) list.push({ name: 'Peak hogging moment', x: min.x, value: min.M, unit: 'kN m' });
    list.push({ name: 'Largest absolute shear', x: a.peakV.x, value: a.peakV.V, unit: 'kN' });
    list.push({ name: 'Largest displacement', x: a.peakD.x, value: a.peakD.v * 1000, unit: 'mm' });
    model.items.filter(i => i.kind === 'hinge').forEach(h => list.push({ name: 'Hinge ' + h.label, x: h.x, value: a.sample(h.x).M, unit: 'kN m' }));
    return list;
}
function benchmarks() {
    const checks = [];
    function run(name, actual, expected, unit) {
        const tolerance = 1e-7 + Math.abs(expected) * 1e-7;
        checks.push({ name, actual, expected, unit, tolerance, pass: Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance });
    }
    try {
        let m = normalise(example('simple')), a = solveStudy(m);
        run('UDL reaction A', a.reactions[0].force, 25, 'kN');
        run('UDL peak moment', a.peakM.M, 62.5, 'kN m');
        run('UDL centre displacement', a.sample(5).v * 1000, -9.300595238095239, 'mm');
        m.items = m.items.filter(i => ['pin', 'roller'].includes(i.kind));
        m.length = 6; m.items[1].x = 6;
        m.items.push({ ...makeItem('point', 3, undefined, 20), caseId: 'base' });
        a = solveStudy(m);
        run('Centre point peak moment', a.peakM.M, 30, 'kN m');
        run('Centre point displacement', a.sample(3).v * 1000, -1.285714285714286, 'mm');
        a = solveStudy(normalise(example('continuous')));
        run('Continuous middle reaction', a.reactions[1].force, 31.25, 'kN');
        run('Continuous support moment', a.sample(5).M, -15.625, 'kN m');
        a = solveStudy(normalise(example('suspended')));
        run('Suspended span reaction B', a.reactions[1].force, 45, 'kN');
        run('Suspended span hinge residual', a.hingeResidual, 0, 'kN m');
        a = solveStudy(normalise(example('cantilever')));
        run('Cantilever reaction couple', a.reactions[0].moment, 500, 'kN m');
        run('Cantilever tip displacement', a.sample(10).v * 1000, -238.0952380952381, 'mm');
        a = solveStudy(normalise(example('triangle')));
        run('Triangular-load zero shear position', a.peakM.x, 9 / Math.sqrt(3), 'm');
        run('Triangular-load peak moment', a.peakM.M, 12 * 81 / (9 * Math.sqrt(3)), 'kN m');
        m = normalise(example('simple')); m.cases[0].factor = 1.5;
        a = solveStudy(m);
        run('Case factor applied once', a.reactions[0].force, 37.5, 'kN');
        run('Case factor leaves nominal load unchanged', m.items[2].value, 5, 'kN/m');
        run('Strain energy identity', audit(m, a).checks[5].residual, 0, 'kN m');
        const ub = catalogue.find(c => c.name === '310UB40.4'), uc = catalogue.find(c => c.name === '100UC14.8'), pfc = catalogue.find(c => c.name === '380PFC');
        run('Catalogue row count', catalogue.length, 51, 'rows');
        run('310UB40.4 Ix', ub?.I ?? NaN, 86.4e6, 'mm4');
        run('100UC14.8 Ix', uc?.I ?? NaN, 3.18e6, 'mm4');
        run('380PFC area', pfc?.A ?? NaN, 7030, 'mm2');
        const ubProps = sectionProperties(fromCatalogue('310UB40.4'));
        run('310UB40.4 self-weight basis', ubProps.weight, 7850 * 5210e-6 * 9.80665 / 1000, 'kN/m');
    } catch (e) { checks.push({ name: e instanceof Error ? e.message : String(e), pass: false, actual: null, expected: null, unit: '', tolerance: 0 }); }
    return checks;
}
module.exports = { RELEASE, canonical, fingerprint, audit, criticalLocations, benchmarks };
