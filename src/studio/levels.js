"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modes = exports.modeOrder = void 0;
exports.mode = mode;
exports.allowedTabs = allowedTabs;
exports.canUseTool = canUseTool;
exports.canUseFeature = canUseFeature;
exports.canEditItem = canEditItem;
exports.restrictedStudyFeatures = restrictedStudyFeatures;
exports.recommendedExample = recommendedExample;
exports.unlockSummary = unlockSummary;

exports.modeOrder = ['year1', 'year2', 'year3', 'all'];
exports.modes = {
    year1: {
        id: 'year1', short: '1st Year', title: 'Fundamentals',
        subtitle: 'Statics, reactions and internal-force diagrams',
        tabs: ['build', 'learn'],
        tools: ['pin', 'roller', 'fixed', 'point', 'udl'],
        features: ['annotations', 'teaching', 'practice'],
        examples: ['reference', 'simple', 'overhang', 'cantilever'],
        learns: [
            'Free-body equilibrium and support reactions',
            'Point and distributed loading',
            'Shear-force and bending-moment diagrams',
            'How load, shear and moment are connected'
        ]
    },
    year2: {
        id: 'year2', short: '2nd Year', title: 'Structural behaviour',
        subtitle: 'Sections, stress, deformation and indeterminacy',
        tabs: ['build', 'section', 'layers', 'learn'],
        tools: ['pin', 'roller', 'fixed', 'hinge', 'point', 'udl', 'variable', 'moment'],
        features: ['annotations', 'deformation', 'stress', 'shear', 'teaching', 'practice'],
        examples: ['reference', 'simple', 'overhang', 'cantilever', 'continuous', 'gerber', 'triangle', 'fixed'],
        learns: [
            'Section properties, elastic bending stress and shear stress',
            'Elastic beam deformation and rotation',
            'Internal hinges and simple indeterminate/continuous beams',
            'Energy, compatibility and stiffness concepts through worked results'
        ]
    },
    year3: {
        id: 'year3', short: '3rd+ Year', title: 'Analysis & design context',
        subtitle: 'Load cases, self-weight, influence and advanced response',
        tabs: ['build', 'cases', 'section', 'layers', 'learn'],
        tools: ['pin', 'roller', 'fixed', 'hinge', 'point', 'udl', 'variable', 'moment'],
        features: ['annotations', 'deformation', 'stress', 'shear', 'moving', 'teaching', 'practice', 'review', 'cases', 'catalogue', 'selfweight', 'varyingEI', 'steppedSections', 'settlement'],
        examples: ['reference', 'simple', 'overhang', 'cantilever', 'continuous', 'gerber', 'suspended', 'triangle', 'fixed'],
        learns: [
            'Load cases and user-defined combinations',
            'Catalogue/derived sections, true stepped sections, self-weight, support settlement and piecewise EI zones',
            'Influence lines and sampled moving-load envelopes',
            'Model verification, serviceability context and comparison studies'
        ]
    },
    all: {
        id: 'all', short: 'All Tools', title: 'Full workspace',
        subtitle: 'Everything BeamLab currently supports',
        tabs: ['build', 'cases', 'section', 'layers', 'learn'],
        tools: ['pin', 'roller', 'fixed', 'hinge', 'point', 'udl', 'variable', 'moment'],
        features: ['annotations', 'deformation', 'stress', 'shear', 'moving', 'teaching', 'practice', 'review', 'cases', 'catalogue', 'selfweight', 'varyingEI', 'steppedSections', 'settlement', 'precision'],
        examples: ['reference', 'simple', 'overhang', 'cantilever', 'continuous', 'gerber', 'suspended', 'triangle', 'fixed'],
        learns: [
            'All current analysis and editing tools',
            'Presentation, diagnostics and exports',
            'Moving-load studies and advanced visualisation',
            'No additional design-code claims are unlocked by this mode'
        ]
    }
};
function mode(id) { return exports.modes[id] || exports.modes.year1; }
function allowedTabs(id) { return mode(id).tabs; }
function canUseTool(id, kind) { return mode(id).tools.includes(kind); }
function canUseFeature(id, feature) { return mode(id).features.includes(feature); }
function canEditItem(id, item) {
    if (!item) return false;
    return canUseTool(id, item.kind);
}
function restrictedStudyFeatures(id, study, view = {}) {
    if (id === 'all') return [];
    const out = [];
    const hiddenItems = study.items.filter(i => !canUseTool(id, i.kind));
    if (hiddenItems.length) out.push(`${hiddenItems.length} advanced object${hiddenItems.length === 1 ? '' : 's'}`);
    if (!canUseFeature(id, 'cases') && ((study.cases?.length || 0) > 1 || study.cases?.some(c => c.factor !== 1 || !c.enabled))) out.push('load cases/factors');
    if (!canUseFeature(id, 'selfweight') && study.selfWeight) out.push('self-weight');
    for (const key of ['deformation', 'stress', 'shear', 'moving', 'review']) {
        if (!canUseFeature(id, key) && view[key]) out.push(key === 'moving' ? 'moving-load lab' : key);
    }
    if (!canUseFeature(id, 'catalogue') && study.section?.catalogue) out.push('catalogue section');
    if (!canUseFeature(id, 'varyingEI') && (study.stiffnessRegions?.length || 0)) out.push('piecewise EI zones');
    if (!canUseFeature(id, 'steppedSections') && (study.sectionRegions?.length || 0)) out.push('stepped section regions');
    if (!canUseFeature(id, 'settlement') && study.items.some(i => ['pin','roller','fixed'].includes(i.kind) && Math.abs(i.settlementMm || 0) > 1e-12)) out.push('support settlement');
    return [...new Set(out)];
}
function recommendedExample(id) {
    return id === 'year1' ? 'reference' : id === 'year2' ? 'continuous' : id === 'year3' ? 'suspended' : 'overhang';
}
function unlockSummary(fromId, toId) {
    const from = mode(fromId), to = mode(toId);
    const tools = to.tools.filter(x => !from.tools.includes(x));
    const features = to.features.filter(x => !from.features.includes(x) && !['annotations', 'teaching'].includes(x));
    return { tools, features };
}
