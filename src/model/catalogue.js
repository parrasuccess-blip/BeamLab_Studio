"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogueFamilies = exports.catalogue = exports.catalogueSource = void 0;
exports.fromCatalogue = fromCatalogue;
const sections_1 = require("./sections");
exports.catalogueSource = 'https://www.infrabuild.com/wp-content/uploads/sites/8/2022/02/Hot20Rolled20Cat_Edition9_2019.pdf';
exports.catalogueFamilies = [
    { id: 'UB', name: 'Universal Beams', table: 9, printedPage: 10 },
    { id: 'UC', name: 'Universal Columns', table: 11, printedPage: 12 },
    { id: 'PFC', name: 'Parallel Flange Channels', table: 15, printedPage: 15 }
];
/**
 * InfraBuild-hosted Liberty Hot Rolled and Structural Steel Products,
 * ninth edition (October 2019), Tables 9, 11 and 15.
 *
 * Values below are the manufacturer-tabulated mass, principal dimensions,
 * gross area and horizontal centroidal Ix.  BeamLab uses those tabulated A/Ix
 * values rather than a sharp-corner geometric approximation.  The catalogue is
 * a reference library, not a statement of current product availability and not
 * a design-capacity database.
 */
exports.catalogue = [
    // Universal beams / Table 9
    { name: '610UB125', family: 'UB', table: 9, page: 10, mass: 125, h: 611.6, b: 229.0, tf: 19.6, t: 11.9, A: 16000, I: 986e6 },
    { name: '610UB113', family: 'UB', table: 9, page: 10, mass: 113, h: 607.0, b: 228.0, tf: 17.3, t: 11.2, A: 14500, I: 875e6 },
    { name: '610UB101', family: 'UB', table: 9, page: 10, mass: 101, h: 602.0, b: 228.0, tf: 14.8, t: 10.6, A: 13000, I: 761e6 },
    { name: '530UB92.4', family: 'UB', table: 9, page: 10, mass: 92.4, h: 533.0, b: 209.0, tf: 15.6, t: 10.2, A: 11800, I: 554e6 },
    { name: '530UB82.0', family: 'UB', table: 9, page: 10, mass: 82.0, h: 528.2, b: 209.0, tf: 13.2, t: 9.6, A: 10500, I: 477e6 },
    { name: '460UB82.1', family: 'UB', table: 9, page: 10, mass: 82.1, h: 460.4, b: 191.0, tf: 16.0, t: 9.9, A: 10500, I: 372e6 },
    { name: '460UB74.6', family: 'UB', table: 9, page: 10, mass: 74.6, h: 457.4, b: 190.0, tf: 14.5, t: 9.1, A: 9520, I: 335e6 },
    { name: '460UB67.1', family: 'UB', table: 9, page: 10, mass: 67.1, h: 453.8, b: 190.0, tf: 12.7, t: 8.5, A: 8580, I: 296e6 },
    { name: '410UB59.7', family: 'UB', table: 9, page: 10, mass: 59.7, h: 406.4, b: 178.0, tf: 12.8, t: 7.8, A: 7640, I: 216e6 },
    { name: '410UB53.7', family: 'UB', table: 9, page: 10, mass: 53.7, h: 402.6, b: 178.0, tf: 10.9, t: 7.6, A: 6890, I: 188e6 },
    { name: '360UB56.7', family: 'UB', table: 9, page: 10, mass: 56.7, h: 358.6, b: 172.0, tf: 13.0, t: 8.0, A: 7240, I: 161e6 },
    { name: '360UB50.7', family: 'UB', table: 9, page: 10, mass: 50.7, h: 355.6, b: 171.0, tf: 11.5, t: 7.3, A: 6470, I: 142e6 },
    { name: '360UB44.7', family: 'UB', table: 9, page: 10, mass: 44.7, h: 352.0, b: 171.0, tf: 9.7, t: 6.9, A: 5720, I: 121e6 },
    { name: '310UB46.2', family: 'UB', table: 9, page: 10, mass: 46.2, h: 307.2, b: 166.0, tf: 11.8, t: 6.7, A: 5930, I: 100e6 },
    { name: '310UB40.4', family: 'UB', table: 9, page: 10, mass: 40.4, h: 304.0, b: 165.0, tf: 10.2, t: 6.1, A: 5210, I: 86.4e6 },
    { name: '310UB32.0', family: 'UB', table: 9, page: 10, mass: 32.0, h: 298.0, b: 149.0, tf: 8.0, t: 5.5, A: 4080, I: 63.2e6 },
    { name: '250UB37.3', family: 'UB', table: 9, page: 10, mass: 37.3, h: 256.2, b: 146.0, tf: 10.9, t: 6.4, A: 4750, I: 55.7e6 },
    { name: '250UB31.4', family: 'UB', table: 9, page: 10, mass: 31.4, h: 251.6, b: 146.0, tf: 8.6, t: 6.1, A: 4010, I: 44.5e6 },
    { name: '250UB25.7', family: 'UB', table: 9, page: 10, mass: 25.7, h: 248.0, b: 124.0, tf: 8.0, t: 5.0, A: 3270, I: 35.4e6 },
    { name: '200UB29.8', family: 'UB', table: 9, page: 10, mass: 29.8, h: 207.0, b: 134.0, tf: 9.6, t: 6.3, A: 3820, I: 29.1e6 },
    { name: '200UB25.4', family: 'UB', table: 9, page: 10, mass: 25.4, h: 203.2, b: 133.0, tf: 7.8, t: 5.8, A: 3230, I: 23.6e6 },
    { name: '200UB22.3', family: 'UB', table: 9, page: 10, mass: 22.3, h: 201.6, b: 133.0, tf: 7.0, t: 5.0, A: 2870, I: 21.0e6 },
    { name: '200UB18.2', family: 'UB', table: 9, page: 10, mass: 18.2, h: 198.0, b: 99.0, tf: 7.0, t: 4.5, A: 2320, I: 15.8e6 },
    { name: '180UB22.2', family: 'UB', table: 9, page: 10, mass: 22.2, h: 179.0, b: 90.0, tf: 10.0, t: 6.0, A: 2820, I: 15.3e6 },
    { name: '180UB18.1', family: 'UB', table: 9, page: 10, mass: 18.1, h: 175.0, b: 90.0, tf: 8.0, t: 5.0, A: 2300, I: 12.1e6 },
    { name: '180UB16.1', family: 'UB', table: 9, page: 10, mass: 16.1, h: 173.0, b: 90.0, tf: 7.0, t: 4.5, A: 2040, I: 10.6e6 },
    { name: '150UB18.0', family: 'UB', table: 9, page: 10, mass: 18.0, h: 155.0, b: 75.0, tf: 9.5, t: 6.0, A: 2300, I: 9.05e6 },
    { name: '150UB14.0', family: 'UB', table: 9, page: 10, mass: 14.0, h: 150.0, b: 75.0, tf: 7.0, t: 5.0, A: 1780, I: 6.66e6 },

    // Universal columns / Table 11
    { name: '310UC158', family: 'UC', table: 11, page: 12, mass: 158, h: 327.2, b: 311.0, tf: 25.0, t: 15.7, A: 20100, I: 388e6 },
    { name: '310UC137', family: 'UC', table: 11, page: 12, mass: 137, h: 320.6, b: 309.0, tf: 21.7, t: 13.8, A: 17500, I: 329e6 },
    { name: '310UC118', family: 'UC', table: 11, page: 12, mass: 118, h: 314.6, b: 307.0, tf: 18.7, t: 11.9, A: 15000, I: 277e6 },
    { name: '310UC96.8', family: 'UC', table: 11, page: 12, mass: 96.8, h: 308.0, b: 305.0, tf: 15.4, t: 9.9, A: 12400, I: 223e6 },
    { name: '250UC89.5', family: 'UC', table: 11, page: 12, mass: 89.5, h: 260.0, b: 256.0, tf: 17.3, t: 10.5, A: 11400, I: 143e6 },
    { name: '250UC72.9', family: 'UC', table: 11, page: 12, mass: 72.9, h: 253.8, b: 254.0, tf: 14.2, t: 8.6, A: 9320, I: 114e6 },
    { name: '200UC59.5', family: 'UC', table: 11, page: 12, mass: 59.5, h: 209.8, b: 205.0, tf: 14.2, t: 9.3, A: 7620, I: 61.3e6 },
    { name: '200UC52.2', family: 'UC', table: 11, page: 12, mass: 52.2, h: 206.4, b: 204.0, tf: 12.5, t: 8.0, A: 6660, I: 52.8e6 },
    { name: '200UC46.2', family: 'UC', table: 11, page: 12, mass: 46.2, h: 203.4, b: 203.0, tf: 11.0, t: 7.3, A: 5900, I: 45.9e6 },
    { name: '150UC37.2', family: 'UC', table: 11, page: 12, mass: 37.2, h: 161.8, b: 154.0, tf: 11.5, t: 8.1, A: 4730, I: 22.2e6 },
    { name: '150UC30.0', family: 'UC', table: 11, page: 12, mass: 30.0, h: 157.6, b: 153.0, tf: 9.4, t: 6.6, A: 3860, I: 17.6e6 },
    { name: '150UC23.4', family: 'UC', table: 11, page: 12, mass: 23.4, h: 152.4, b: 152.0, tf: 6.8, t: 6.1, A: 2980, I: 12.6e6 },
    { name: '100UC14.8', family: 'UC', table: 11, page: 12, mass: 14.8, h: 97.0, b: 99.0, tf: 7.0, t: 5.0, A: 1890, I: 3.18e6 },

    // Parallel flange channels / Table 15
    { name: '380PFC', family: 'PFC', table: 15, page: 15, mass: 55.2, h: 380, b: 100, tf: 17.5, t: 10.0, A: 7030, I: 152e6 },
    { name: '300PFC', family: 'PFC', table: 15, page: 15, mass: 40.1, h: 300, b: 90, tf: 16.0, t: 8.0, A: 5110, I: 72.4e6 },
    { name: '250PFC', family: 'PFC', table: 15, page: 15, mass: 35.5, h: 250, b: 90, tf: 15.0, t: 8.0, A: 4520, I: 45.1e6 },
    { name: '230PFC', family: 'PFC', table: 15, page: 15, mass: 25.1, h: 230, b: 75, tf: 12.0, t: 6.5, A: 3200, I: 26.8e6 },
    { name: '200PFC', family: 'PFC', table: 15, page: 15, mass: 22.9, h: 200, b: 75, tf: 12.0, t: 6.0, A: 2920, I: 19.1e6 },
    { name: '180PFC', family: 'PFC', table: 15, page: 15, mass: 20.9, h: 180, b: 75, tf: 11.0, t: 6.0, A: 2660, I: 14.1e6 },
    { name: '150PFC', family: 'PFC', table: 15, page: 15, mass: 17.7, h: 150, b: 75, tf: 9.5, t: 6.0, A: 2250, I: 8.34e6 },
    { name: '125PFC', family: 'PFC', table: 15, page: 15, mass: 11.9, h: 125, b: 65, tf: 7.5, t: 4.7, A: 1520, I: 3.97e6 },
    { name: '100PFC', family: 'PFC', table: 15, page: 15, mass: 8.33, h: 100, b: 50, tf: 6.7, t: 4.2, A: 1060, I: 1.74e6 },
    { name: '75PFC', family: 'PFC', table: 15, page: 15, mass: 5.92, h: 75, b: 40, tf: 6.1, t: 3.8, A: 754, I: 0.683e6 }
];
function fromCatalogue(name) {
    const row = exports.catalogue.find(c => c.name === name);
    if (!row)
        throw new Error('Unknown catalogue section.');
    return {
        ...sections_1.defaultSection,
        E: 200,
        density: 7850,
        material: 'Steel (illustrative)',
        shape: 'custom',
        b: row.b,
        h: row.h,
        tf: row.tf,
        t: row.t,
        I: row.I,
        A: row.A,
        catalogue: row.name,
        family: row.family
    };
}
