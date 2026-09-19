"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_REGIONS = void 0;
exports.normaliseRegions = normaliseRegions;
exports.validateRegions = validateRegions;
exports.factorAt = factorAt;
exports.regionAt = regionAt;
exports.effectiveEI = effectiveEI;
exports.hasVaryingEI = hasVaryingEI;

exports.MAX_REGIONS = 12;

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}
function normaliseRegions(input) {
    if (!Array.isArray(input)) return [];
    return clone(input).sort((a,b) => Number(a.x || 0) - Number(b.x || 0) || Number(a.end || 0) - Number(b.end || 0));
}
function validateRegions(input, length) {
    if (input === undefined) return;
    if (!Array.isArray(input) || input.length > exports.MAX_REGIONS)
        throw new Error(`Use at most ${exports.MAX_REGIONS} non-overlapping EI zones.`);
    const ids = new Set();
    const regions = normaliseRegions(input);
    for (const r of regions) {
        if (!r || typeof r !== 'object' || Array.isArray(r))
            throw new Error('Invalid EI zone.');
        if (typeof r.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(r.id) || ids.has(r.id))
            throw new Error('EI zone identifiers must be unique and contain only letters, digits, underscores or hyphens.');
        ids.add(r.id);
        if (typeof r.label !== 'string' || !r.label.trim() || r.label.length > 40)
            throw new Error('Each EI zone needs a label of 1 to 40 characters.');
        if (!Number.isFinite(r.x) || !Number.isFinite(r.end) || r.x < 0 || r.end > length || r.end <= r.x + 1e-5)
            throw new Error(`${r.label}: EI zone must have a valid start and end inside the beam.`);
        if (!Number.isFinite(r.factor) || r.factor < 0.05 || r.factor > 20)
            throw new Error(`${r.label}: EI multiplier must be between 0.05 and 20.`);
    }
    for (let i = 1; i < regions.length; i++) {
        if (regions[i].x < regions[i-1].end - 1e-8)
            throw new Error('EI zones cannot overlap. Split the beam into adjacent non-overlapping regions instead.');
    }
}
function regionAt(input, x) {
    const regions = Array.isArray(input) ? input : [];
    return regions.find(r => x >= r.x - 1e-10 && x <= r.end + 1e-10) || null;
}
function factorAt(input, x) {
    return regionAt(input, x)?.factor || 1;
}
function effectiveEI(baseEI, input, x) {
    return baseEI * factorAt(input, x);
}
function hasVaryingEI(modelOrRegions) {
    const regions = Array.isArray(modelOrRegions) ? modelOrRegions : modelOrRegions?.stiffnessRegions;
    return Array.isArray(regions) && regions.some(r => Math.abs(Number(r.factor) - 1) > 1e-12);
}
