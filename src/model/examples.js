"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.examples = exports.titles = exports.colours = void 0;
exports.makeItem = makeItem;
exports.example = example;
const sections_1 = require("./sections");
exports.colours = ['#efbd6a', '#77b9ee', '#bc9aff', '#f48fa8', '#b6d881', '#f79566', '#8ee0dc'];
exports.titles = { pin: 'Pin support', roller: 'Roller support', fixed: 'Fixed support', hinge: 'Internal hinge', point: 'Point load', udl: 'Uniform load', variable: 'Variable load', moment: 'Applied couple' };
let sequence = 0;
function makeItem(kind, x, end, value = 20, endValue) {
    const id = `obj-${++sequence}-${Date.now().toString(36)}`;
    return { id, kind, label: exports.titles[kind], x, end, value, endValue, colour: exports.colours[sequence % exports.colours.length] };
}
function model(name, length, items) {
    let load = 0, support = 0, hinge = 0;
    items.forEach(i => {
        if (['pin', 'roller', 'fixed'].includes(i.kind)) {
            i.label = String.fromCharCode(65 + support++);
            i.colour = '#9fbbb4';
        }
        else if (i.kind === 'hinge') {
            i.label = `H${++hinge}`;
            i.colour = '#bc9aff';
        }
        else {
            i.colour = exports.colours[load++ % exports.colours.length];
            i.label = `${i.kind === 'point' ? 'P' : i.kind === 'moment' ? 'M' : i.kind === 'variable' ? 'V' : 'U'}${load}`;
        }
    });
    return { version: 3, name, length, items, section: { ...sections_1.defaultSection }, selfWeight: false };
}
exports.examples = [
    { key: 'simple', name: 'Simply supported', detail: 'Start with the essentials' },
    { key: 'overhang', name: 'Double overhang', detail: 'The original BeamLab model' },
    { key: 'cantilever', name: 'Cantilever', detail: 'One fixed end, one free end' },
    { key: 'continuous', name: 'Continuous beam', detail: 'Two equal spans, three supports' },
    { key: 'gerber', name: 'Internal hinge', detail: 'Moment release at 8 m' },
    { key: 'suspended', name: 'Suspended span', detail: 'Four supports, two hinges' },
    { key: 'triangle', name: 'Triangular loading', detail: '0 to 12 kN/m over 9 m' },
    { key: 'fixed', name: 'Fixed at both ends', detail: 'Restraint changes the response' }
];
function example(key) {
    const s = (kind, x) => makeItem(kind, x);
    const u = (end, w) => makeItem('udl', 0, end, w);
    if (key === 'overhang')
        return model('Double-overhang study', 12, [s('pin', 2), s('roller', 10), u(12, 7)]);
    if (key === 'cantilever')
        return model('Cantilever study', 10, [s('fixed', 0), makeItem('point', 10, undefined, 50)]);
    if (key === 'continuous')
        return model('Two-span continuous beam', 10, [s('pin', 0), s('roller', 5), s('roller', 10), u(10, 5)]);
    if (key === 'gerber')
        return model('Internal-hinge study', 12, [s('pin', 0), s('roller', 6), s('roller', 12), s('hinge', 8), u(12, 10)]);
    if (key === 'suspended')
        return model('Suspended-span study', 18, [s('pin', 0), s('roller', 4), s('roller', 14), s('roller', 18), s('hinge', 6), s('hinge', 12), u(18, 5)]);
    if (key === 'triangle')
        return model('Triangular-load study', 9, [s('pin', 0), s('roller', 9), makeItem('variable', 0, 9, 0, 12)]);
    if (key === 'fixed')
        return model('Fixed-ended study', 10, [s('fixed', 0), s('fixed', 10), u(10, 5)]);
    return model('Simply supported study', 10, [s('pin', 0), s('roller', 10), u(10, 5)]);
}
