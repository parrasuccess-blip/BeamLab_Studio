"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solveBeam = solveBeam;
const linear_1 = require("./linear");
const sections_1 = require("../model/sections");
const section_regions_1 = require("../model/section-regions");
const validation_1 = require("../model/validation");
const stiffness_1 = require("../model/stiffness");
/** Piecewise-property Euler-Bernoulli bending, kN/m/radians.
 * Displacements up, rotations CCW, applied forces down, couples CCW.
 * Event-aligned Hermite stiffness and exact linear-load vectors. Each element
 * carries a verified local section and an optional EI-only multiplier.
 * Recover the quartic/quintic interior fields by equilibrium integration, not
 * cubic-only displacement interpolation. No artificial stiffness for unstable
 * models.
 */
function solveBeam(model) {
    (0, validation_1.validateModel)(model);
    const p = (0, sections_1.sectionProperties)(model.section), length = model.length;
    const sectionRegions = (0, section_regions_1.normaliseSectionRegions)(model.sectionRegions);
    const stiffnessRegions = (0, stiffness_1.normaliseRegions)(model.stiffnessRegions);
    const supports = model.items.filter(i => (0, validation_1.isSupport)(i.kind)).sort((a, b) => a.x - b.x);
    if (!supports.some(s => s.kind === 'pin' || s.kind === 'fixed'))
        throw new Error('Add a pin or fixed support for horizontal restraint.');
    const hinges = model.items.filter(i => i.kind === 'hinge');
    const internalDistributedLoads = Array.isArray(model.internalDistributedLoads)
        ? model.internalDistributedLoads.filter(o => o && (0, validation_1.isDistributed)(o.kind))
        : [];
    if (model.selfWeight) {
        for (const seg of (0, section_regions_1.sectionSegments)(model)) {
            internalDistributedLoads.push({
                id: '__selfweight__' + internalDistributedLoads.length,
                label: 'Self-weight · ' + seg.regionLabel,
                kind: 'udl',
                x: seg.a,
                end: seg.b,
                value: seg.properties.weight,
                colour: '#9eaab1',
                internal: true,
                source: 'self-weight'
            });
        }
    }
    const loads = [...model.items.filter(i => (0, validation_1.isDistributed)(i.kind)), ...internalDistributedLoads];
    const events = [
        0, length,
        ...model.items.flatMap(i => (0, validation_1.isDistributed)(i.kind) ? [i.x, i.end] : [i.x]),
        ...internalDistributedLoads.flatMap(i => [i.x, i.end]),
        ...sectionRegions.flatMap(r => [r.x, r.end]),
        ...stiffnessRegions.flatMap(r => [r.x, r.end])
    ].sort((a, b) => a - b);
    const xs = events.filter((x, i) => !i || x - events[i - 1] > length * 1e-10);
    if (xs.some((x, i) => i && x - xs[i - 1] < length * 1e-6))
        throw new Error('Two structural events are too close together. Separate them or use exactly the same position.');
    const index = (x) => xs.findIndex(v => Math.abs(v - x) <= length * 1e-9);
    let count = 0;
    const nodes = xs.map(x => {
        const v = count++, left = count++;
        const right = hinges.some(h => Math.abs(h.x - x) < length * 1e-9) ? count++ : left;
        return { v, left, right };
    });
    const K = Array.from({ length: count }, () => Array(count).fill(0));
    const F = Array(count).fill(0), constrained = new Set();
    const elements = [];
    const intensity = (o, x) => o.value + (o.kind === 'variable' ? (o.endValue - o.value) * (x - o.x) / (o.end - o.x) : 0);
    for (let i = 0; i < xs.length - 1; i++) {
        const a = xs[i], b = xs[i + 1], l = b - a, centre = (a + b) / 2;
        const active = loads.filter(o => centre > o.x && centre < o.end);
        const sectionRegion = (0, section_regions_1.sectionRegionAt)(sectionRegions, centre, 'right', length);
        const section = sectionRegion?.section || model.section;
        const properties = (0, sections_1.sectionProperties)(section);
        const stiffnessFactor = (0, stiffness_1.factorAt)(stiffnessRegions, centre);
        const EI = properties.EI * stiffnessFactor;
        const w0 = active.reduce((sum, o) => sum + intensity(o, a), 0);
        const w1 = active.reduce((sum, o) => sum + intensity(o, b), 0);
        const dofs = [nodes[i].v, nodes[i].right, nodes[i + 1].v, nodes[i + 1].left];
        const k = [
            [12, 6 * l, -12, 6 * l],
            [6 * l, 4 * l * l, -6 * l, 2 * l * l],
            [-12, -6 * l, 12, -6 * l],
            [6 * l, 2 * l * l, -6 * l, 4 * l * l]
        ].map(row => row.map(v => v * EI / l ** 3));
        const loadVector = [-l * (7 * w0 + 3 * w1) / 20, -l * l * (3 * w0 + 2 * w1) / 60, -l * (3 * w0 + 7 * w1) / 20, l * l * (2 * w0 + 3 * w1) / 60];
        dofs.forEach((di, r) => {
            F[di] += loadVector[r];
            dofs.forEach((dj, c) => { K[di][dj] += k[r][c]; });
        });
        elements.push({
            a, b, dofs, k, f: loadVector, w0, slope: (w1 - w0) / l,
            EI, stiffnessFactor, section, properties,
            sectionRegionId: sectionRegion?.id || null,
            sectionRegionLabel: sectionRegion?.label || 'Base section',
            sectionLabel: (0, section_regions_1.sectionLabel)(section),
            d: [], r: []
        });
    }
    model.items.forEach(o => {
        const n = nodes[index(o.x)];
        if (o.kind === 'point')
            F[n.v] -= o.value;
        if (o.kind === 'moment')
            F[n.left] += o.value;
        if ((0, validation_1.isSupport)(o.kind))
            constrained.add(n.v);
        if (o.kind === 'fixed')
            constrained.add(n.left);
    });
    const d = Array(count).fill(0);
    for (const support of supports) {
        const n = nodes[index(support.x)];
        d[n.v] = (support.settlementMm || 0) / 1000;
        if (support.kind === 'fixed') d[n.left] = (support.rotationMrad || 0) / 1000;
    }
    const free = Array.from({ length: count }, (_, i) => i).filter(i => !constrained.has(i));
    const rhs = free.map(i => F[i] - Array.from(constrained).reduce((sum, j) => sum + K[i][j] * d[j], 0));
    const q = (0, linear_1.solveSPD)(free.map(i => free.map(j => K[i][j])), rhs);
    free.forEach((j, i) => { d[j] = q[i]; });
    const R = K.map((row, i) => row.reduce((sum, v, j) => sum + v * d[j], 0) - F[i]);
    for (const e of elements) {
        e.d = e.dofs.map(i => d[i]);
        e.r = e.k.map((row, i) => row.reduce((sum, v, j) => sum + v * e.d[j], 0) - e.f[i]);
    }
    function at(e, x) {
        const t = Math.max(0, Math.min(e.b - e.a, x - e.a));
        const V0 = e.r[0], M0 = -e.r[1], w = e.w0, k = e.slope;
        const V = V0 - w * t - k * t * t / 2;
        const M = M0 + V0 * t - w * t ** 2 / 2 - k * t ** 3 / 6;
        const theta = e.d[1] + (M0 * t + V0 * t ** 2 / 2 - w * t ** 3 / 6 - k * t ** 4 / 24) / e.EI;
        const v = e.d[0] + e.d[1] * t + (M0 * t * t / 2 + V0 * t ** 3 / 6 - w * t ** 4 / 24 - k * t ** 5 / 120) / e.EI;
        return { x: e.a + t, V, M, v, theta, I:e.properties.I, c:e.properties.c, localEI:e.EI, stiffnessFactor:e.stiffnessFactor, sectionLabel:e.sectionLabel, sectionRegionLabel:e.sectionRegionLabel };
    }
    const elementAt = (x, side = 'right') => {
        x = Math.max(0, Math.min(length, x));
        return elements.find(e => side === 'left'
            ? x > e.a + 1e-10 && x <= e.b + 1e-10
            : x >= e.a - 1e-10 && x < e.b - 1e-10) || (x <= 0 ? elements[0] : elements[elements.length - 1]);
    };
    const sample = (x, side = 'right') => at(elementAt(x, side), Math.max(0, Math.min(length, x)));
    const localSectionAt = (x, side = 'right') => {
        const e = elementAt(x, side);
        return {
            section: e.section,
            properties: e.properties,
            stiffnessFactor: e.stiffnessFactor,
            EI: e.EI,
            regionId: e.sectionRegionId,
            regionLabel: e.sectionRegionLabel,
            label: e.sectionLabel
        };
    };
    const points = [], candidatesV = [], candidatesM = [], candidatesD = [], stressCandidates = [];
    let compatibility = 0;
    for (const e of elements) {
        const l = e.b - e.a;
        const ends = [at(e, e.a), at(e, e.b)];
        compatibility = Math.max(compatibility, Math.abs(ends[1].v - e.d[2]), Math.abs(ends[1].theta - e.d[3]) * l);
        candidatesV.push(...ends);
        candidatesD.push(...ends);
        const localMomentCandidates = [...ends];
        (0, linear_1.roots01)([e.w0, e.slope * l]).forEach(z => candidatesV.push(at(e, e.a + z * l)));
        (0, linear_1.roots01)([e.r[0], -e.w0 * l, -e.slope * l * l / 2]).forEach(z => localMomentCandidates.push(at(e, e.a + z * l)));
        candidatesM.push(...localMomentCandidates);
        stressCandidates.push(...localMomentCandidates.map(row => ({
            x: row.x,
            M: row.M,
            properties: e.properties,
            section: e.section,
            sectionLabel: e.sectionLabel,
            regionLabel: e.sectionRegionLabel,
            regionId: e.sectionRegionId,
            stiffnessFactor: e.stiffnessFactor
        })));
        (0, linear_1.roots01)([e.d[1], -e.r[1] * l / e.EI, e.r[0] * l ** 2 / (2 * e.EI), -e.w0 * l ** 3 / (6 * e.EI), -e.slope * l ** 4 / (24 * e.EI)]).forEach(z => candidatesD.push(at(e, e.a + z * l)));
        const n = Math.max(8, Math.ceil(160 * l / length));
        for (let i = 0; i <= n; i++)
            points.push(at(e, e.a + l * i / n));
    }
    const maximum = (arr, key) => arr.reduce((a, b) => Math.abs(b[key]) > Math.abs(a[key]) ? b : a);
    const peakV = maximum(candidatesV, 'V'), peakM = maximum(candidatesM, 'M'), peakD = maximum(candidatesD, 'v');
    const hasEIOnlyRegions = stiffnessRegions.some(r => Math.abs(Number(r.factor) - 1) > 1e-12);
    let elasticStressEnvelope = null;
    if (!hasEIOnlyRegions && stressCandidates.length) {
        elasticStressEnvelope = stressCandidates.map(row => {
            const top = -row.M * row.properties.c / row.properties.I / 1000;
            return { ...row, top, bottom: -top, stress: Math.abs(top) };
        }).reduce((a, b) => b.stress > a.stress ? b : a);
    }
    const reactions = supports.map(s => {
        const n = nodes[index(s.x)];
        return { id: s.id, label: s.label, x: s.x, force: R[n.v], moment: s.kind === 'fixed' ? R[n.left] : 0, fixed: s.kind === 'fixed', settlementMm: s.settlementMm || 0, rotationMrad: s.rotationMrad || 0 };
    });
    let total = 0, loadMoment = 0, appliedCouple = 0;
    model.items.forEach(o => {
        if (o.kind === 'point') {
            total += o.value;
            loadMoment += o.value * o.x;
        }
        if (o.kind === 'moment')
            appliedCouple += o.value;
    });
    loads.forEach(o => {
        const l = o.end - o.x, w0 = o.value, w1 = o.kind === 'variable' ? o.endValue : w0;
        const force = l * (w0 + w1) / 2;
        total += force;
        loadMoment += o.x * force + l * l * (w0 + 2 * w1) / 6;
    });
    const forceResidual = reactions.reduce((sum, r) => sum + r.force, 0) - total;
    const momentResidual = reactions.reduce((sum, r) => sum + r.force * r.x + r.moment, 0) - loadMoment + appliedCouple;
    const hingeResidual = Math.max(0, ...hinges.flatMap(h => [Math.abs(sample(h.x, 'left').M), Math.abs(sample(h.x, 'right').M)]));
    const boundaryResidual = Math.max(0, ...supports.flatMap(s => [Math.abs(sample(s.x).v - (s.settlementMm || 0) / 1000), s.kind === 'fixed' ? Math.abs(sample(s.x).theta - (s.rotationMrad || 0) / 1000) * length : 0]));
    const finiteResults = [total, loadMoment, appliedCouple, forceResidual, momentResidual, hingeResidual, boundaryResidual, compatibility,
        ...reactions.flatMap(r => [r.force, r.moment]), ...points.flatMap(row => [row.V, row.M, row.v, row.theta])];
    if (!finiteResults.every(Number.isFinite))
        throw new Error('Non-finite numerical result. Check model properties and loading.');
    const forceScale = Math.max(1, ...F.map(Math.abs), Math.abs(total));
    const momentScale = Math.max(1, Math.abs(loadMoment), Math.abs(peakM.M), forceScale * length);
    if (Math.abs(forceResidual) > forceScale * 1e-7 || Math.abs(momentResidual) > momentScale * 1e-7 || hingeResidual > momentScale * 1e-7 || compatibility > Math.max(1e-8, Math.abs(peakD.v) * 1e-5))
        throw new Error('Numerical verification failed. Move nearly coincident objects apart or simplify this model.');
    const warnings = [];
    if (reactions.some(r => r.force < -1e-7))
        warnings.push('Negative reaction: this ideal model needs hold-down restraint. An unanchored bearing may lift off.');
    if (Math.abs(peakD.v) / length > 0.01)
        warnings.push('Large relative deflection: the small-deflection model may no longer be appropriate.');
    if(supports.some(s=>Math.abs(s.rotationMrad||0)>1e-12)) warnings.push('Fixed-support rotation is prescribed in mrad, positive counter-clockwise. Small-rotation assumptions apply.');
    const settledSupports = supports.filter(s => Math.abs(s.settlementMm || 0) > 1e-12);
    if (settledSupports.length)
        warnings.push('Support settlement is imposed as a prescribed vertical displacement (positive upward). It can generate reactions and moments in indeterminate systems even without applied loads.');
    const localSections = (0, section_regions_1.sectionSegments)(model);
    if (localSections.some(seg => seg.section.material.includes('Concrete')))
        warnings.push('Concrete regions use gross, uncracked elastic stiffness. Cracking, creep and reinforcement are not modelled.');
    if (sectionRegions.length)
        warnings.push('Stepped-section changes are idealised as abrupt prismatic regions. Local transition stresses, tapers, connection effects and three-dimensional stress concentrations are not modelled.');
    if (hasEIOnlyRegions)
        warnings.push('Piecewise EI-only zones modify elastic stiffness without defining whether E, I or both changed. Local section geometry, bending stress, shear stress, self-weight and member resistance are not inferred inside those zones.');
    const system = hinges.length ? `${hinges.length}-hinge beam` : supports.length === 1 ? 'Cantilever' : supports.length > 2 ? 'Continuous beam' : supports.some(s => s.kind === 'fixed') ? 'Restrained beam' : supports[0].x > 0 || supports[supports.length - 1].x < length ? 'Overhang beam' : 'Simply supported beam';
    return {
        properties: p,
        sectionRegions,
        stiffnessRegions,
        hasSectionRegions: sectionRegions.length > 0,
        hasEIOnlyRegions,
        hasVaryingEI: sectionRegions.length > 0 || hasEIOnlyRegions,
        hasSupportSettlement: supports.some(s => Math.abs(s.settlementMm || 0) > 1e-12),
        hasSupportRotation: supports.some(s => Math.abs(s.rotationMrad || 0) > 1e-12),
        prescribedSupportDisplacements: supports.map(s => ({ id:s.id, label:s.label, x:s.x, settlementMm:s.settlementMm || 0, rotationMrad:s.rotationMrad || 0 })),
        elements,
        reactions,
        points,
        stressCandidates,
        elasticStressEnvelope,
        peakV,
        peakM,
        peakD,
        total,
        loadMoment,
        appliedCouple,
        forceResidual,
        momentResidual,
        hingeResidual,
        boundaryResidual,
        endCompatibilityResidual: compatibility,
        warnings,
        system,
        dofs: count,
        sample,
        localSectionAt
    };
}
