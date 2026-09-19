"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSection = exports.materials = void 0;
exports.sectionProperties = sectionProperties;
// Editable teaching assumptions; not catalogue grades or certified values.
exports.materials = [
    { name: 'Steel (illustrative)', E: 200, density: 7850 },
    { name: 'Aluminium (illustrative)', E: 69, density: 2700 },
    { name: 'Timber (illustrative)', E: 12, density: 500 },
    { name: 'Concrete (uncracked demo)', E: 32, density: 2400 }
];
exports.defaultSection = {
    material: exports.materials[0].name, E: 200, density: 7850,
    shape: 'custom', b: 200, h: 400, t: 12, tf: 20, I: 350000000, A: 10000
};
function sectionProperties(s) {
    if (!s || typeof s.material !== 'string' || s.material.length > 80)
        throw new Error('Invalid material definition.');
    const bounds = [
        ['E', 0.01, 1000], ['density', 0.01, 30000], ['b', 1, 10000], ['h', 1, 10000],
        ['t', 0.1, 1000], ['tf', 0.1, 1000], ['I', 1, 1e15], ['A', 1, 1e8]
    ];
    for (const [key, minimum, maximum] of bounds) {
        if (!Number.isFinite(s[key]) || s[key] < minimum || s[key] > maximum)
            throw new Error(`Section property ${key} must be between ${minimum} and ${maximum}.`);
    }
    const { b, h, t, tf } = s;
    let A = s.A, I = s.I;
    if (s.shape === 'rectangle') {
        A = b * h;
        I = b * h ** 3 / 12;
    }
    else if (s.shape === 'box') {
        if (2 * t >= Math.min(b, h))
            throw new Error('Box wall thickness must be less than half its width and depth.');
        A = b * h - (b - 2 * t) * (h - 2 * t);
        I = (b * h ** 3 - (b - 2 * t) * (h - 2 * t) ** 3) / 12;
    }
    else if (s.shape === 'i') {
        if (2 * tf >= h || t >= b)
            throw new Error('I-section needs 2 flange thicknesses < depth and web thickness < width.');
        A = 2 * b * tf + t * (h - 2 * tf);
        I = (b * h ** 3 - (b - t) * (h - 2 * tf) ** 3) / 12;
    }
    else if (s.shape !== 'custom')
        throw new Error('Unknown section shape.');
    I *= 1e-12;
    A *= 1e-6;
    return { E: s.E * 1e6, I, A, c: h / 2000, EI: s.E * 1e6 * I, weight: s.density * A * 9.80665 / 1000 };
}
