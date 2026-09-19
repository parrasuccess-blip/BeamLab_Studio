"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clone = void 0;
exports.normalise = normalise;
exports.validateStudy = validateStudy;
exports.parseStudy = parseStudy;
exports.caseFactor = caseFactor;
exports.effectiveModel = effectiveModel;
exports.solveStudy = solveStudy;
exports.setCombination = setCombination;
exports.resultant = resultant;
exports.stressAt = stressAt;
exports.reviewLimits = reviewLimits;
const solver_1 = require("../engine/solver");
const validation_1 = require("./validation");
const sections_1 = require("./sections");
const catalogue_1 = require("./catalogue");
const clone = (v) => JSON.parse(JSON.stringify(v));
exports.clone = clone;
function normalise(model) {
    const m = (0, exports.clone)(model);
    if (!m.cases)
        m.cases = [{ id: 'base', name: 'Base', enabled: true, factor: 1 }];
    m.items.forEach(i => { if ((0, validation_1.isLoad)(i.kind) && !i.caseId)
        i.caseId = m.cases[0].id; });
    m.selfWeightCase || (m.selfWeightCase = m.cases[0].id);
    m.combinations || (m.combinations = []);
    return m;
}
function validateStudy(m) {
    (0, validation_1.validateModel)(m);
    if (m.section.catalogue) {
        const entry=catalogue_1.catalogue.find(r=>r.name===m.section.catalogue);
        if (!entry || m.section.shape!=='custom' || m.section.family!==entry.family || ['A','I','h','b','t','tf'].some(k=>Math.abs(m.section[k]-entry[k])>1e-8*Math.max(1,entry[k])))
            throw new Error('Catalogue section properties do not match their source. Detach the section before editing geometry.');
    }
    if (!m.cases) {
        for(const i of m.items) if(!/^[a-zA-Z0-9_-]{1,100}$/.test(i.id) || i.id==='__weight__') throw new Error('Invalid or reserved object identifier.');
        return;
    }
    if (!Array.isArray(m.cases) || !m.cases.length || m.cases.length > 12)
        throw new Error('Use between 1 and 12 load cases.');
    const ids = new Set();
    for (const c of m.cases) {
        if (!c || typeof c.id !== 'string' || !/^[a-zA-Z0-9_-]{1,50}$/.test(c.id) || ids.has(c.id) || typeof c.name !== 'string' || !c.name.trim() || c.name.length > 40 || typeof c.enabled !== 'boolean' || !Number.isFinite(c.factor) || Math.abs(c.factor) > 20)
            throw new Error('Invalid load case. Factors must be finite and between -20 and 20.');
        ids.add(c.id);
    }
    for (const i of m.items) {
        if (!/^[a-zA-Z0-9_-]{1,100}$/.test(i.id) || i.id==='__weight__')
            throw new Error('Object identifiers must contain only letters, digits, underscores or hyphens.');
        if (i.locked !== undefined && typeof i.locked !== 'boolean')
            throw new Error('Invalid object lock.');
        if ((0, validation_1.isLoad)(i.kind) && i.caseId && !ids.has(i.caseId))
            throw new Error('A load refers to a missing case.');
    }
    if (m.selfWeightCase && !ids.has(m.selfWeightCase))
        throw new Error('Self-weight refers to a missing case.');
    if (m.combinations) {
        if (!Array.isArray(m.combinations) || m.combinations.length > 20)
            throw new Error('Use at most 20 saved combinations.');
        const combinationIds=new Set();
        for (const c of m.combinations) {
            if (!c || combinationIds.has(c.id)) throw new Error('Invalid or duplicated combination.');
            combinationIds.add(c.id);
            if (typeof c.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(c.id) || typeof c.name !== 'string' || !c.name.trim() || c.name.length > 50 || !c.factors || typeof c.factors !== 'object' || Array.isArray(c.factors))
                throw new Error('Invalid combination.');
            for (const [id, value] of Object.entries(c.factors))
                if (!ids.has(id) || !Number.isFinite(value) || Math.abs(value) > 20)
                    throw new Error('Invalid combination factor.');
        }
    }
    if (m.review)
        for (const value of Object.values(m.review))
            if (value !== null && (!Number.isFinite(value) || value <= 0 || value > 1e6))
                throw new Error('Review limits must be positive, finite, or unset.');
    if (m.section.catalogue !== undefined && (typeof m.section.catalogue !== 'string' || m.section.catalogue.length > 80))
        throw new Error('Invalid catalogue metadata.');
    if (m.section.family !== undefined && (typeof m.section.family !== 'string' || m.section.family.length > 20))
        throw new Error('Invalid section family.');
}
function parseStudy(text) {
    if (text.length > 150000)
        throw new Error('Model file exceeds 150 kB.');
    const value = JSON.parse(text);
    validateStudy(value);
    return normalise(value);
}
function caseFactor(m, id) {
    if (!m.cases)
        return 1;
    const c = m.cases.find(c => c.id === (id || m.cases[0].id));
    return c?.enabled ? c.factor : 0;
}
/** Convert case factors into actual actions once. Never mutate nominal loads. */
function effectiveModel(m) {
    validateStudy(m);
    const items = [];
    for (const i of m.items) {
        if (!(0, validation_1.isLoad)(i.kind))
            items.push({ ...i });
        else {
            const f = caseFactor(m, i.caseId);
            if (f !== 0)
                items.push({ ...i, value: i.value * f, ...(i.endValue !== undefined ? { endValue: i.endValue * f } : {}) });
        }
    }
    if (m.selfWeight) {
        const f = caseFactor(m, m.selfWeightCase);
        if (f)
            items.push({ id: '__weight__', kind: 'udl', label: 'SW', x: 0, end: m.length, value: (0, sections_1.sectionProperties)(m.section).weight * f, colour: '#91a6ab' });
    }
    // Reserve a slot for the internally generated self-weight action.
    if (items.length > 48)
        throw new Error('Keep one of the 48 object slots free when self-weight is enabled.');
    return { ...m, items, selfWeight: false };
}
function solveStudy(m) { return (0, solver_1.solveBeam)(effectiveModel(m)); }
function setCombination(m, factors) {
    return { ...m, cases: m.cases.map(c => ({ ...c, enabled: (factors[c.id] || 0) !== 0, factor: factors[c.id] ?? 0 })) };
}
function resultant(i) {
    if (i.kind === 'point')
        return { force: i.value, firstMoment: i.value * i.x, position: i.x };
    if (i.kind === 'moment')
        return { force: 0, firstMoment: 0, position: i.x };
    const l = i.end - i.x, w0 = i.value, w1 = i.kind === 'variable' ? i.endValue : w0;
    const force = l * (w0 + w1) / 2;
    const firstMoment = i.x * force + l * l * (w0 + 2 * w1) / 6;
    return { force, firstMoment, position: Math.abs(force) > 1e-9 ? firstMoment / force : null };
}
function stressAt(a, x) {
    const M = a.sample(x).M, top = -M * a.properties.c / a.properties.I / 1000;
    return { top, bottom: -top, M };
}
function reviewLimits(a, m) {
    const stress = Math.abs(a.peakM.M) * a.properties.c / a.properties.I / 1000;
    const displacement = Math.abs(a.peakD.v) * 1000;
    return { stress, displacement, stressRatio: m.review?.stressMPa ? stress / m.review.stressMPa : null, displacementRatio: m.review?.displacementMm ? displacement / m.review.displacementMm : null };
}
