"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_SECTION_REGIONS = void 0;
exports.normaliseSectionRegions = normaliseSectionRegions;
exports.validateSectionDefinition = validateSectionDefinition;
exports.validateSectionRegions = validateSectionRegions;
exports.sectionRegionAt = sectionRegionAt;
exports.sectionAt = sectionAt;
exports.sectionLabel = sectionLabel;
exports.sectionSegments = sectionSegments;
exports.hasSectionRegions = hasSectionRegions;

const sections_1 = require("./sections");
const catalogue_1 = require("./catalogue");

exports.MAX_SECTION_REGIONS = 12;

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}
function normaliseSectionRegions(input) {
    if (!Array.isArray(input)) return [];
    return clone(input).sort((a,b) => Number(a.x || 0) - Number(b.x || 0) || Number(a.end || 0) - Number(b.end || 0));
}
function validateSectionDefinition(section) {
    const props = (0, sections_1.sectionProperties)(section);
    if (section.catalogue !== undefined) {
        if (typeof section.catalogue !== 'string' || section.catalogue.length > 80)
            throw new Error('Invalid catalogue metadata in stepped section.');
        const entry = catalogue_1.catalogue.find(r => r.name === section.catalogue);
        if (!entry || section.shape !== 'custom' || section.family !== entry.family ||
            ['A','I','h','b','t','tf'].some(k => Math.abs(section[k] - entry[k]) > 1e-8 * Math.max(1, entry[k])))
            throw new Error('A stepped catalogue section no longer matches its source. Choose the catalogue section again or use a copied custom section.');
    }
    if (section.family !== undefined && (typeof section.family !== 'string' || section.family.length > 20))
        throw new Error('Invalid stepped-section family metadata.');
    return props;
}
function validateSectionRegions(input, length) {
    if (input === undefined) return;
    if (!Array.isArray(input) || input.length > exports.MAX_SECTION_REGIONS)
        throw new Error(`Use at most ${exports.MAX_SECTION_REGIONS} non-overlapping stepped-section regions.`);
    const ids = new Set();
    const regions = normaliseSectionRegions(input);
    for (const r of regions) {
        if (!r || typeof r !== 'object' || Array.isArray(r))
            throw new Error('Invalid stepped-section region.');
        if (typeof r.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(r.id) || ids.has(r.id))
            throw new Error('Stepped-section region identifiers must be unique and contain only letters, digits, underscores or hyphens.');
        ids.add(r.id);
        if (typeof r.label !== 'string' || !r.label.trim() || r.label.length > 40)
            throw new Error('Each stepped-section region needs a label of 1 to 40 characters.');
        if (!Number.isFinite(r.x) || !Number.isFinite(r.end) || r.x < 0 || r.end > length || r.end <= r.x + 1e-5)
            throw new Error(`${r.label}: section region must have a valid start and end inside the beam.`);
        try { validateSectionDefinition(r.section); }
        catch (e) { throw new Error(`${r.label}: ${e instanceof Error ? e.message : 'invalid section definition.'}`); }
    }
    for (let i = 1; i < regions.length; i++) {
        if (regions[i].x < regions[i-1].end - 1e-8)
            throw new Error('Stepped-section regions cannot overlap. Split the member into adjacent non-overlapping regions instead.');
    }
}
function sectionRegionAt(input, x, side='right', length=1) {
    const regions = Array.isArray(input) ? input : [];
    const eps = Math.max(1, Math.abs(Number(length) || 1)) * 1e-10;
    if (side === 'left') {
        for (let i = regions.length - 1; i >= 0; i--) {
            const r = regions[i];
            if (x > r.x + eps && x <= r.end + eps) return r;
            if (Math.abs(x - r.end) <= eps && r.end > r.x + eps) return r;
        }
        return null;
    }
    for (const r of regions) {
        if (x >= r.x - eps && x < r.end - eps) return r;
        if (Math.abs(x - r.x) <= eps && r.end > r.x + eps) return r;
        if (Math.abs(x - length) <= eps && Math.abs(r.end - length) <= eps && x >= r.x - eps) return r;
    }
    return null;
}
function sectionAt(model, x, side='right') {
    const regions = Array.isArray(model?.sectionRegions) ? model.sectionRegions : [];
    return sectionRegionAt(regions, x, side, model?.length || 1)?.section || model.section;
}
function sectionLabel(section) {
    if (!section) return 'Unknown section';
    return section.catalogue || (section.shape === 'rectangle' ? 'Solid rectangle' : section.shape === 'i' ? 'Symmetric I-section' : section.shape === 'box' ? 'Box section' : 'Custom section');
}
function sectionSegments(model) {
    const length = model.length;
    const regions = normaliseSectionRegions(model.sectionRegions);
    const raw = [0, length, ...regions.flatMap(r => [r.x, r.end])].sort((a,b)=>a-b);
    const xs = raw.filter((x,i)=>!i || x - raw[i-1] > Math.max(1,length)*1e-10);
    const out = [];
    for (let i=0;i<xs.length-1;i++) {
        const a=xs[i], b=xs[i+1];
        if (b-a <= Math.max(1,length)*1e-10) continue;
        const mid=(a+b)/2;
        const region=sectionRegionAt(regions,mid,'right',length);
        const section=region?.section || model.section;
        out.push({
            a,b,
            id:region?.id || 'base',
            regionId:region?.id || null,
            regionLabel:region?.label || 'Base section',
            section,
            label:sectionLabel(section),
            properties:validateSectionDefinition(section)
        });
    }
    return out;
}
function hasSectionRegions(modelOrRegions) {
    const regions = Array.isArray(modelOrRegions) ? modelOrRegions : modelOrRegions?.sectionRegions;
    return Array.isArray(regions) && regions.length > 0;
}
