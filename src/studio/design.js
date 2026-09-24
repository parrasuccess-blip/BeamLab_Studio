"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referenceBasis = exports.limitations = void 0;
exports.defaults = defaults;
exports.normaliseSettings = normaliseSettings;
exports.evaluate = evaluate;
exports.reviewSnapshot = reviewSnapshot;
const sections_1 = require("../model/sections");
exports.referenceBasis = [
    { id: 'AS4100', label: 'AS 4100:2020', title: 'Steel structures', source: 'NCC referenced-document schedule inspected for BeamLab 4.0', url: 'https://ncc.abcb.gov.au/editions/ncc-2022/adopted/volume-two/2-referenced-documents/referenced-documents' },
    { id: 'ASNZS1170-0', label: 'AS/NZS 1170.0:2002', title: 'Structural design actions - General principles', source: 'NCC schedule lists amendments 1, 3 and 4', url: 'https://ncc.abcb.gov.au/editions/ncc-2022/adopted/volume-two/2-referenced-documents/referenced-documents' },
    { id: 'ASNZS1170-1', label: 'AS/NZS 1170.1:2002', title: 'Permanent, imposed and other actions', source: 'NCC schedule lists amendments 1 and 2', url: 'https://ncc.abcb.gov.au/editions/ncc-2022/adopted/volume-two/2-referenced-documents/referenced-documents' }
];
exports.limitations = [
    'Automatic AS 4100 section/member capacity is not implemented.',
    'Section classification, local slenderness and effective section properties are not checked.',
    'Lateral-torsional buckling, restraint spacing and unbraced length are not modelled.',
    'Axial force, second-order effects and combined action interaction are not modelled.',
    'Web bearing/buckling, connections, holes, welds and bolts are not checked.',
    'Fatigue, fire, durability, fabrication, erection and construction-stage checks are outside this release.',
    'Current load-case factors are user-defined unless the user has independently entered a verified basis.'
];
function finitePositive(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
}
function defaults() {
    return {
        momentCapacity: null,
        shearCapacity: null,
        deflectionMode: 'unset',
        deflectionRatio: 250,
        deflectionLimitMm: null,
        serviceSpanM: null,
        fyMPa: null,
        capacitySource: '',
        notes: ''
    };
}
function normaliseSettings(input) {
    const base = defaults();
    if (!input || typeof input !== 'object' || Array.isArray(input)) return base;
    const mode = ['unset','ratio','direct'].includes(input.deflectionMode) ? input.deflectionMode : 'unset';
    return {
        momentCapacity: finitePositive(input.momentCapacity),
        shearCapacity: finitePositive(input.shearCapacity),
        deflectionMode: mode,
        deflectionRatio: input.deflectionRatio === undefined ? base.deflectionRatio : finitePositive(input.deflectionRatio),
        deflectionLimitMm: finitePositive(input.deflectionLimitMm),
        serviceSpanM: finitePositive(input.serviceSpanM),
        fyMPa: finitePositive(input.fyMPa),
        capacitySource: typeof input.capacitySource === 'string' ? input.capacitySource.trim().slice(0, 240) : '',
        notes: typeof input.notes === 'string' ? input.notes.trim().slice(0, 1000) : ''
    };
}
function extrema(points, key) {
    const values = (points || []).map(p => Number(p[key])).filter(Number.isFinite);
    if (!values.length) return { max: 0, min: 0 };
    return { max: Math.max(...values), min: Math.min(...values) };
}
function ratioCheck(id, label, demand, limit, unit, basis) {
    if (!(Number.isFinite(limit) && limit > 0)) return { id, label, demand, limit: null, unit, ratio: null, basis, status: 'not-assessed' };
    const ratio = demand / limit;
    return { id, label, demand, limit, unit, ratio, basis, status: ratio <= 1 ? 'within-entered-limit' : 'exceeds-entered-limit' };
}
function evaluate(model, analysis, rawSettings) {
    if (!model || !analysis) return null;
    const settings = normaliseSettings(rawSettings);
    const props = analysis.properties || (0, sections_1.sectionProperties)(model.section);
    const moments = extrema(analysis.points, 'M');
    const shears = extrema(analysis.points, 'V');
    const hasEIOnly = !!analysis.hasEIOnlyRegions;
    const hasTrueSteppedSections = !!analysis.hasSectionRegions;
    const stressEnvelope = !hasEIOnly ? analysis.elasticStressEnvelope : null;
    const demand = {
        moment: Math.abs(analysis.peakM.M),
        momentPositive: moments.max,
        momentNegative: moments.min,
        momentX: analysis.peakM.x,
        shear: Math.abs(analysis.peakV.V),
        shearPositive: shears.max,
        shearNegative: shears.min,
        shearX: analysis.peakV.x,
        deflectionMm: Math.abs(analysis.peakD.v) * 1000,
        deflectionSignedMm: analysis.peakD.v * 1000,
        deflectionX: analysis.peakD.x,
        elasticStressMPa: stressEnvelope?.stress ?? (hasEIOnly ? null : Math.abs(analysis.peakM.M) * props.c / props.I / 1000),
        elasticStressX: stressEnvelope?.x ?? (hasEIOnly ? null : analysis.peakM.x),
        elasticStressSection: stressEnvelope?.sectionLabel || (hasEIOnly ? null : (model.section.catalogue || model.section.shape || 'Base section')),
        elasticStressRegion: stressEnvelope?.regionLabel || (hasEIOnly ? null : 'Base section')
    };
    const serviceSpanM = settings.serviceSpanM || model.length;
    const deflectionLimitMm = settings.deflectionMode === 'ratio'
        ? (settings.deflectionRatio ? serviceSpanM * 1000 / settings.deflectionRatio : null)
        : settings.deflectionMode === 'direct'
            ? settings.deflectionLimitMm
            : null;
    const checks = [
        ratioCheck('moment', 'Bending', demand.moment, settings.momentCapacity, 'kN·m', 'User-supplied final design capacity'),
        ratioCheck('shear', 'Shear', demand.shear, settings.shearCapacity, 'kN', 'User-supplied final design capacity'),
        ratioCheck('deflection', 'Deflection', demand.deflectionMm, deflectionLimitMm, 'mm', settings.deflectionMode === 'ratio' ? `User study criterion L/${settings.deflectionRatio}` : 'User-supplied displacement limit')
    ];
    const assessed = checks.filter(row => row.ratio !== null);
    const governing = assessed.length ? assessed.reduce((a,b) => b.ratio > a.ratio ? b : a) : null;

    let elasticReference = { fyMPa: settings.fyMPa, momentKNm: null, ratio: null, x:null, sectionLabel:null, regionLabel:null, unavailable:false, reason:null };
    if (hasEIOnly) {
        elasticReference = {
            ...elasticReference,
            unavailable:true,
            reason:'EI-only zones do not define local section modulus or the E/I split required for a first-yield reference.'
        };
    } else if (settings.fyMPa) {
        const candidates = (analysis.stressCandidates || []).length
            ? analysis.stressCandidates
            : [{ x:analysis.peakM.x, M:analysis.peakM.M, properties:props, sectionLabel:model.section.catalogue || model.section.shape || 'Base section', regionLabel:'Base section' }];
        const rows = candidates.map(row => {
            const my = settings.fyMPa * 1e6 * row.properties.I / row.properties.c / 1000;
            return { x:row.x, sectionLabel:row.sectionLabel, regionLabel:row.regionLabel, momentKNm:my, ratio:my ? Math.abs(row.M)/my : null };
        }).filter(row => Number.isFinite(row.ratio));
        if (rows.length) {
            const critical = rows.reduce((a,b)=>b.ratio>a.ratio?b:a);
            elasticReference = { ...elasticReference, ...critical };
        }
    }

    const factors = (model.cases || []).map(c => ({
        id: c.id,
        name: c.name,
        enabled: !!c.enabled,
        factor: c.factor,
        active: !!c.enabled && c.factor !== 0,
        actions: model.items.filter(i => i.caseId === c.id && ['point','udl','variable','moment'].includes(i.kind)).length,
        selfWeight: !!model.selfWeight && model.selfWeightCase === c.id
    }));
    const readiness = [
        { id:'analysis', state:'ready', label:'Stable analysis result', detail:'Demand comes directly from the current deterministic BeamLab solution.' },
        ...(hasTrueSteppedSections ? [
            { id:'stepped-section-profile', state:'ready', label:'Local stepped-section properties', detail:'Each stepped region carries deterministic local E, I, area, depth, density and elastic self-weight properties.' },
            { id:'stepped-capacity-applicability', state:'missing', label:'Capacity applicability across section changes', detail:'Entered bending/shear capacities are global user inputs. Verify independently that the chosen capacities apply to every relevant stepped region and transition.' }
        ] : []),
        ...(hasEIOnly ? [{ id:'piecewise-section', state:'missing', label:'EI-only local section properties', detail:'EI multipliers redistribute stiffness but do not define local E, I, section modulus, shear geometry, self-weight or resistance. Replace them with true stepped sections when verified local properties are available.' }] : []),
        { id:'factors', state:'input', label:'Action-factor provenance', detail:'Current factors are visible below. BeamLab 4.0 does not claim they are automatic AS/NZS combinations.' },
        { id:'moment-capacity', state:settings.momentCapacity ? 'ready':'input', label:'Bending capacity', detail:settings.momentCapacity ? 'A final design capacity has been entered by the user.' : 'Enter a verified final design capacity to assess bending demand.' },
        { id:'shear-capacity', state:settings.shearCapacity ? 'ready':'input', label:'Shear capacity', detail:settings.shearCapacity ? 'A final design capacity has been entered by the user.' : 'Enter a verified final design capacity to assess shear demand.' },
        { id:'serviceability', state:deflectionLimitMm ? 'ready':'input', label:'Serviceability criterion', detail:deflectionLimitMm ? 'A user-defined displacement criterion is active.' : 'Choose a serviceability criterion and ensure the active factor set is appropriate for it.' },
        { id:'capacity-source', state:settings.capacitySource ? 'ready':'input', label:'Capacity source / traceability', detail:settings.capacitySource || 'Record the source, clause, calculation or external software result used for entered capacities.' },
        { id:'ltb', state:'missing', label:'Member stability / restraint', detail:'LTB, restraint spacing and unbraced length are not automatically checked.' },
        { id:'classification', state:'missing', label:'Section classification', detail:'Plate slenderness/local buckling and effective section properties are not automatically checked.' },
        { id:'combined', state:'missing', label:'Combined actions / second-order', detail:'Axial force, P-delta and code interaction checks are outside the current beam model.' },
        { id:'connections', state:'missing', label:'Connections & local checks', detail:'Web bearing/buckling, holes, bolts, welds, abrupt transition details and connection design are not included.' }
    ];
    const steppedRegions = (analysis.sectionRegions || []).map(r => {
        const rp = (0, sections_1.sectionProperties)(r.section);
        return {
            label:r.label,
            x_m:r.x,
            end_m:r.end,
            section:r.section.catalogue || r.section.shape || 'Custom section',
            family:r.section.family || null,
            material:r.section.material,
            E_GPa:r.section.E,
            I_mm4:rp.I*1e12,
            A_mm2:rp.A*1e6,
            c_mm:rp.c*1000,
            depth_mm:r.section.h,
            EI_kNm2:rp.EI,
            selfWeight_kNm:rp.weight
        };
    });
    return {
        settings,
        demand,
        checks,
        governing,
        elasticReference,
        serviceability: { mode: settings.deflectionMode, serviceSpanM, limitMm: deflectionLimitMm },
        factors,
        section: {
            label: model.section.catalogue || model.section.material || model.section.shape || 'Custom section',
            family: model.section.family || null,
            E_GPa: model.section.E,
            I_mm4: props.I * 1e12,
            A_mm2: props.A * 1e6,
            c_mm: props.c * 1000,
            EI_kNm2: props.EI,
            selfWeight_kNm: props.weight,
            hasTrueSteppedSections,
            hasEIOnlyOverrides:hasEIOnly,
            piecewiseEI:hasEIOnly,
            steppedRegions,
            stiffnessZones: (analysis.stiffnessRegions || []).map(r => ({ label:r.label, x_m:r.x, end_m:r.end, factor:r.factor }))
        },
        readiness
    };
}
function reviewSnapshot(model, analysis, rawSettings, reference) {
    const review = evaluate(model, analysis, rawSettings);
    if (!review) throw new Error('A stable BeamLab analysis is required before exporting a design review.');
    return {
        schema: 'beamlab-design-review-4.0',
        release: '4.0.0',
        generatedAt: new Date().toISOString(),
        modelReference: reference || null,
        study: { name: model.name, length_m: model.length, selfWeight: !!model.selfWeight },
        demand: review.demand,
        enteredCriteria: review.settings,
        serviceability: review.serviceability,
        checks: review.checks,
        governingEnteredCheck: review.governing,
        elasticFirstYieldReference: review.elasticReference,
        section: review.section,
        caseFactors: review.factors,
        readiness: review.readiness,
        limitations: [
            ...exports.limitations,
            ...(analysis.hasSectionRegions ? ['True stepped sections are analysed as abrupt prismatic property regions. Transition stress concentrations, tapers and connection details are not modelled; entered capacities must be verified for every relevant region.'] : []),
            ...(analysis.hasEIOnlyRegions ? ['EI-only multipliers do not define local section geometry, elastic stress, self-weight or member resistance; replace them with verified local sections when those quantities are required.'] : [])
        ],
        publicReferenceBasis: exports.referenceBasis.map(r => ({ id:r.id, label:r.label, title:r.title, source:r.source, url:r.url })),
        disclaimer: 'This is a transparent review of BeamLab demand against user-entered capacities/criteria. It is not automatic AS 4100 or AS/NZS 1170 compliance and is not structural design approval.'
    };
}
