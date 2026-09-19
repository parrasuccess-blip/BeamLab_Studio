"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLoad = exports.isDistributed = exports.isSupport = void 0;
exports.validateModel = validateModel;
exports.parseModel = parseModel;
const sections_1 = require("./sections");
const stiffness_1 = require("./stiffness");
const isSupport = (k) => ['pin', 'roller', 'fixed'].includes(k);
exports.isSupport = isSupport;
const isDistributed = (k) => k === 'udl' || k === 'variable';
exports.isDistributed = isDistributed;
const isLoad = (k) => ['point', 'udl', 'variable', 'moment'].includes(k);
exports.isLoad = isLoad;
function validateModel(m) {
    if (!m || m.version !== 3 || typeof m.name !== 'string' || m.name.length > 100 || typeof m.selfWeight !== 'boolean')
        throw new Error('Not a BeamLab 3 model file.');
    if (!Number.isFinite(m.length) || m.length < 1 || m.length > 200)
        throw new Error('Beam length must be between 1 and 200 m.');
    if (!Array.isArray(m.items) || m.items.length > 48)
        throw new Error('A maximum of 48 objects is supported.');
    (0, sections_1.sectionProperties)(m.section);
    (0, stiffness_1.validateRegions)(m.stiffnessRegions, m.length);
    const ids = new Set();
    const kinds = ['pin', 'roller', 'fixed', 'hinge', 'point', 'udl', 'variable', 'moment'];
    for (const o of m.items) {
        if (!o || !kinds.includes(o.kind) || typeof o.id !== 'string' || ids.has(o.id) || typeof o.label !== 'string' || o.label.length > 30 || !/^#[0-9a-fA-F]{6}$/.test(o.colour))
            throw new Error('Invalid or duplicated object in model.');
        ids.add(o.id);
        if (!Number.isFinite(o.x) || o.x < 0 || o.x > m.length)
            throw new Error(`${o.label}: position must be inside the beam.`);
        if ((0, exports.isLoad)(o.kind) && (!Number.isFinite(o.value) || Math.abs(o.value) > 100000))
            throw new Error(`${o.label}: enter a finite load between -100000 and 100000.`);
        if ((0, exports.isDistributed)(o.kind)) {
            if (!Number.isFinite(o.end) || o.end <= o.x + 1e-5 || o.end > m.length)
                throw new Error(`${o.label}: load end must be after its start and within the beam.`);
            if (o.kind === 'variable' && (!Number.isFinite(o.endValue) || Math.abs(o.endValue) > 100000))
                throw new Error(`${o.label}: invalid end intensity.`);
        }
        if (o.kind === 'hinge' && (o.x <= 0 || o.x >= m.length))
            throw new Error('Internal hinges must lie inside the beam.');
    }
    const supports = m.items.filter(o => (0, exports.isSupport)(o.kind)).sort((a, b) => a.x - b.x);
    for (let i = 1; i < supports.length; i++)
        if (Math.abs(supports[i].x - supports[i - 1].x) < 1e-6)
            throw new Error('Two supports occupy the same position. Move or remove one.');
    const hinges = m.items.filter(o => o.kind === 'hinge').sort((a, b) => a.x - b.x);
    for (let i = 1; i < hinges.length; i++)
        if (Math.abs(hinges[i].x - hinges[i - 1].x) < 1e-6)
            throw new Error('Two hinges occupy the same position.');
    for (const h of hinges)
        if (m.items.some(o => (o.kind === 'moment' || o.kind === 'fixed') && Math.abs(o.x - h.x) < 1e-6))
            throw new Error('A couple or fixed support directly on a hinge is ambiguous. Move it off the hinge.');
}
function parseModel(text) {
    if (text.length > 100000)
        throw new Error('Model file is too large.');
    const m = JSON.parse(text);
    validateModel(m);
    return m;
}
