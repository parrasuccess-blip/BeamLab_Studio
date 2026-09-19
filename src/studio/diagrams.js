"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.layoutModel = layoutModel;
exports.coordinates = coordinates;
exports.arrow = arrow;
exports.criticalSamples = criticalSamples;
exports.diagramHeader = diagramHeader;
exports.renderDiagrams = renderDiagrams;
exports.renderSection = renderSection;
exports.teaching = teaching;
const linear_1 = require("../engine/linear");
const validation_1 = require("../model/validation");
const study_1 = require("../model/study");
const common_1 = require("./common");
function layoutModel(m, width) {
    const laneEnds = [], lanes = new Map();
    const scale = (width - 108) / m.length;
    [...m.items.filter(i => (0, validation_1.isLoad)(i.kind))].sort((a, b) => a.x - b.x).forEach(i => {
        const start = i.x * scale - 55, end = ((0, validation_1.isDistributed)(i.kind) ? i.end : i.x) * scale + 55;
        let lane = laneEnds.findIndex(x => x < start);
        if (lane < 0)
            lane = laneEnds.length;
        laneEnds[lane] = end;
        lanes.set(i.id, lane);
    });
    const maxW = Math.max(16, ...m.items.filter(i => (0, validation_1.isDistributed)(i.kind)).flatMap(i => [Math.abs(i.value), Math.abs(i.endValue || i.value)]));
    return { lanes, height: 380 + Math.max(0, laneEnds.length - 1) * 108, factor: 64 / maxW };
}
function coordinates(m, v) {
    const left = v.width < 550 ? 45 : 58, right = v.width - left;
    const span = m.length / v.zoom;
    return { left, right, span, xp: (x) => left + (x - v.pan) / span * (right - left) };
}
const svgText = (x, y, text, colour = '#a1b1bb', anchor = 'middle', size = 11, extra = '') => `<text x="${(0, common_1.fmt)(x, 3)}" y="${(0, common_1.fmt)(y, 3)}" text-anchor="${anchor}" fill="${colour}" font-size="${size}" ${extra}>${(0, common_1.esc)(text)}</text>`;
function arrow(x, y1, y2, c, weight = 1.7) {
    if (Math.abs(y2 - y1) < 0.01)
        return '';
    const sign = y2 >= y1 ? 1 : -1, head = Math.min(8, Math.abs(y2 - y1) * .5);
    return `<line x1="${x}" x2="${x}" y1="${y1}" y2="${y2 - sign * head / 2}" stroke="${c}" stroke-width="${weight}"/><path d="M${x - head * .4} ${y2 - sign * head}L${x} ${y2}L${x + head * .4} ${y2 - sign * head}Z" fill="${c}"/>`;
}
function dimension(x1, x2, y, text, colour = '#71858e') {
    return `<g class="dimension"><line x1="${x1}" x2="${x2}" y1="${y}" y2="${y}" stroke="${colour}" stroke-width=".7"/><path d="M${x1} ${y - 4}v8m${x2 - x1} -8v8" stroke="${colour}"/><path d="M${x1 + 4} ${y - 3}l-4 3 4 3M${x2 - 4} ${y - 3}l4 3-4 3" stroke="${colour}" fill="none"/><rect x="${(x1 + x2) / 2 - 28}" y="${y - 8}" width="56" height="16" rx="4" fill="#0d1318"/>${svgText((x1 + x2) / 2, y + 3, text, colour, 'middle', 9)}</g>`;
}
function criticalSamples(a, kind) {
    const items = [];
    for (const e of a.elements) {
        const l = e.b - e.a;
        items.push(a.sample(e.a, 'right'), a.sample(e.b, 'left'));
        const roots = kind === 'V' ? (0, linear_1.roots01)([e.w0, e.slope * l]) : kind === 'v' ? (0, linear_1.roots01)([e.d[1], -e.r[1] * l / e.EI, e.r[0] * l * l / 2 / e.EI, -e.w0 * l ** 3 / 6 / e.EI, -e.slope * l ** 4 / 24 / e.EI]) : (0, linear_1.roots01)([e.r[0], -e.w0 * l, -e.slope * l * l / 2]);
        roots.forEach(z => items.push(a.sample(e.a + z * l)));
    }
    return items;
}
function diagramHeader(n, title, units, hint) {
    return `<header class="diagram-heading"><div><span>${n}</span><h3>${title}</h3></div><div class="diagram-unit">${hint ? `<small>${hint}</small>` : ''}<b>${units}</b></div></header>`;
}
function renderDiagrams(m, a, v) {
    const { left, right, span, xp } = coordinates(m, v), W = v.width;
    const annotationMode = ['clean','guided','detailed'].includes(v.annotationMode) ? v.annotationMode : (v.annotations ? 'detailed' : 'clean');
    const annotationOn = annotationMode !== 'clean';
    const criticalLimit = annotationMode === 'guided' ? 3 : 8;
    const visible = (x) => x >= v.pan - 1e-8 && x <= v.pan + span + 1e-8;
    const grid = (H) => Array.from({ length: 7 }, (_, k) => {
        const x = v.pan + span * k / 6, px = xp(x);
        return `<line x1="${px}" x2="${px}" y1="12" y2="${H - 28}" stroke="#8ca9b3" opacity=".07"/>${svgText(px, H - 9, (0, common_1.fmt)(x, span < 5 ? 2 : 1), '#738991', 'middle', 9)}`;
    }).join('');
    const tracer = (H) => `<g class="trace-group" style="display:${v.trace === null ? 'none' : ''};pointer-events:none"><line class="trace-line" x1="${xp(v.trace || 0)}" x2="${xp(v.trace || 0)}" y1="15" y2="${H - 28}" stroke="#cae9e2" opacity=".6" stroke-dasharray="3 4"/></g>`;
    const layout = v.layout || layoutModel(m, W), beamY = layout.height - 160;
    let model = `<svg class="model-svg" data-model="1" data-beam-y="${beamY}" viewBox="0 0 ${W} ${layout.height}" role="img" aria-label="Structure and loads" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="beam-metal" gradientUnits="userSpaceOnUse" x1="${left}" x2="${right}" y1="0" y2="0"><stop stop-color="#739e96"/><stop offset=".5" stop-color="#e0ede9"/><stop offset="1" stop-color="#78928f"/></linearGradient><clipPath id="model-clip"><rect x="0" y="0" width="${W}" height="${layout.height}"/></clipPath></defs>${grid(layout.height)}<g clip-path="url(#model-clip)"><line x1="${xp(0)}" x2="${xp(m.length)}" y1="${beamY}" y2="${beamY}" stroke="url(#beam-metal)" stroke-width="7" stroke-linecap="round"/>`;
    for (const i of m.items.filter(i => (0, validation_1.isLoad)(i.kind))) {
        const x = xp(i.x), lane = layout.lanes.get(i.id) || 0;
        const base = beamY - ((0, validation_1.isDistributed)(i.kind) ? 70 : 18) - lane * 108;
        const c = i.colour, factor = (0, study_1.caseFactor)(m, i.caseId), inactive = factor === 0;
        const objectAttrs = `data-object="${(0, common_1.esc)(i.id)}" class="canvas-object ${i.locked ? 'locked' : ''}" tabindex="0" role="button" aria-label="Select ${(0, common_1.esc)(i.label)}"`;
        model += `<g ${objectAttrs} opacity="${inactive ? '.3' : '1'}">`;
        const labelX = (px, half = 70) => (0, common_1.clamp)(px, half + 4, W - half - 4);
        if ((0, validation_1.isDistributed)(i.kind)) {
            const x2 = xp(i.end), w0 = i.value, w1 = i.kind === 'variable' ? i.endValue : w0;
            const y0 = base - w0 * layout.factor, y1 = base - w1 * layout.factor;
            const ly = Math.min(base, y0, y1) - 16;
            const n = Math.min(60, Math.max(2, Math.ceil((x2 - x) / 25)));
            model += `<rect x="${x - 10}" y="${Math.min(y0, y1, base) - 33}" width="${Math.max(10, x2 - x + 20)}" height="${Math.max(y0, y1, base) - Math.min(y0, y1, base) + 48}" rx="9" fill="${v.selected.has(i.id) ? c + '10' : 'transparent'}" stroke="${v.selected.has(i.id) ? c : 'none'}" stroke-dasharray="3 5"/>`;
            model += `<line x1="${x}" x2="${x2}" y1="${y0}" y2="${y1}" stroke="${c}" stroke-width="1.8"/>`;
            for (let k = 0; k <= n; k++)
                model += arrow(x + (x2 - x) * k / n, y0 + (y1 - y0) * k / n, base, c, 1.2);
            for (const [px, part] of [[x, 'start'], [x2, 'end']]) {
                model += `<line x1="${px}" x2="${px}" y1="${base}" y2="${beamY - 5}" stroke="${c}" opacity=".23" stroke-dasharray="2 4"/><circle data-part="${part}" cx="${px}" cy="${base}" r="11" fill="transparent"/><circle data-part="${part}" cx="${px}" cy="${base}" r="4.5" fill="#0d1418" stroke="${c}" stroke-width="1.7"/>`;
            }
            if (i.kind === 'variable')
                for (const [px, yy, part] of [[x, y0, 'w0'], [x2, y1, 'w1']])
                    model += `<g data-part="${part}"><circle cx="${px}" cy="${yy}" r="11" fill="transparent"/><rect x="${px - 4}" y="${yy - 4}" width="8" height="8" transform="rotate(45 ${px} ${yy})" fill="${c}"/></g>`;
            const text = `${i.label}  ${(0, common_1.fmt)(w0, 1)}${i.kind === 'variable' ? ' to ' + (0, common_1.fmt)(w1, 1) : ''} kN/m${i.locked ? ' [L]' : ''}`;
            const lw = Math.min(W - 20, text.length * 6.1 + 14), lx = labelX((x + x2) / 2, lw / 2);
            model += `<g data-inline="value"><rect x="${lx - lw / 2}" y="${ly - 12}" width="${lw}" height="22" rx="6" fill="#111b20" stroke="${c}50"/>${svgText(lx, ly + 3, text, c, 'middle', 10)}</g>`;
        }
        else if (i.kind === 'point') {
            const h = 33 + Math.min(43, Math.sqrt(Math.abs(i.value)) * 4), top = base - h;
            model += `<rect x="${x - 23}" y="${top - 24}" width="46" height="${h + 34}" rx="9" fill="${v.selected.has(i.id) ? c + '10' : 'transparent'}" stroke="${v.selected.has(i.id) ? c : 'none'}" stroke-dasharray="3 4"/>`;
            if (i.value !== 0)
                model += arrow(x, i.value >= 0 ? top : base, i.value >= 0 ? base : top, c, 2);
            const txt = `${i.label} ${(0, common_1.signed)(i.value, 1)} kN${i.locked ? ' [L]' : ''}`;
            model += `<g data-inline="value">${svgText(labelX(x, 56), top - 12, txt, c, 'middle', 11)}</g><line x1="${x}" x2="${x}" y1="${base}" y2="${beamY - 5}" stroke="${c}" stroke-dasharray="2 4" opacity=".35"/>`;
        }
        else {
            const cy = base - 26, r = 20, ccw = i.value >= 0;
            model += `<circle cx="${x}" cy="${cy}" r="30" fill="${v.selected.has(i.id) ? c + '10' : 'transparent'}" stroke="${v.selected.has(i.id) ? c : 'none'}"/><path d="M${x + r} ${cy} A${r} ${r} 0 1 ${ccw ? 0 : 1} ${x} ${cy + (ccw ? r : -r)}" fill="none" stroke="${c}" stroke-width="1.9"/><path d="M${x - 6} ${cy + (ccw ? r : -r) - 5}l8 5-8 5" fill="${c}"/>`;
            model += `<g data-inline="value">${svgText(labelX(x, 74), cy - 36, `${i.label} ${(0, common_1.signed)(i.value, 1)} kN m`, c, 'middle', 10)}</g><line x1="${x}" x2="${x}" y1="${base}" y2="${beamY - 5}" stroke="${c}" stroke-dasharray="2 4" opacity=".35"/>`;
        }
        model += '</g>';
    }
    for (const i of m.items.filter(i => (0, validation_1.isSupport)(i.kind))) {
        const x = xp(i.x), r = a?.reactions.find(r => r.id === i.id), col = '#bbcdc9', labelX = (0, common_1.clamp)(x, 52, W - 52);
        model += `<g data-object="${(0, common_1.esc)(i.id)}" class="canvas-object ${i.locked ? 'locked' : ''}" tabindex="0" role="button" aria-label="Select ${(0, common_1.esc)(i.label)}"><rect x="${x - 24}" y="${beamY - 8}" width="48" height="65" rx="8" fill="${v.selected.has(i.id) ? '#82d8c110' : 'transparent'}" stroke="${v.selected.has(i.id) ? '#82d8c1' : 'none'}" stroke-dasharray="3 4"/>`;
        if (i.kind === 'fixed')
            model += `<rect x="${x - 5}" y="${beamY - 24}" width="10" height="50" fill="${col}"/><path d="M${x - 15} ${beamY - 17}l10-10m-10 23 10-10m-10 23 10-10m-10 23 10-10" stroke="${col}"/>`;
        else
            model += `<path d="M${x} ${beamY + 5}l-11 20h22Z" fill="${col}"/>${i.kind === 'roller' ? `<circle cx="${x - 6}" cy="${beamY + 31}" r="3.5" stroke="${col}" fill="none"/><circle cx="${x + 6}" cy="${beamY + 31}" r="3.5" stroke="${col}" fill="none"/>` : `<line x1="${x - 15}" x2="${x + 15}" y1="${beamY + 29}" y2="${beamY + 29}" stroke="${col}"/>`}`;
        model += svgText(labelX, beamY + 49, `${i.label}${i.locked ? ' [L]' : ''} / ${(0, common_1.fmt)(i.x, 2)} m`, col, 'middle', 9);
        if (r && (!v.practice || v.practiceStep >= 1)) {
            model += arrow(x, r.force >= 0 ? beamY + 100 : beamY + 63, r.force >= 0 ? beamY + 63 : beamY + 100, '#82d8c1', 1.7);
            model += svgText((0, common_1.clamp)(x + 12, 58, W - 72), beamY + 80, `${(0, common_1.signed)(r.force)} kN`, '#82d8c1', x > W - 90 ? 'end' : 'start', 9);
            if (r.fixed)
                model += svgText(labelX, beamY + 115, `M ${(0, common_1.signed)(r.moment)} kN m`, '#bc9aff', 'middle', 9);
        }
        else if (r && v.practice)
            model += svgText(labelX, beamY + 78, 'reaction ?', '#82d8c1', 'middle', 9);
        model += '</g>';
    }
    for (const i of m.items.filter(i => i.kind === 'hinge'))
        model += `<g data-object="${(0, common_1.esc)(i.id)}" tabindex="0" role="button" aria-label="Select ${(0, common_1.esc)(i.label)}" class="canvas-object"><circle cx="${xp(i.x)}" cy="${beamY}" r="17" fill="transparent"/><circle cx="${xp(i.x)}" cy="${beamY}" r="6" fill="#0b1418" stroke="#bc9aff" stroke-width="2"/>${svgText(xp(i.x), beamY + 23, `${i.label} / M=0`, '#bc9aff', 'middle', 10)}</g>`;
    // Dimension chain has its own band, above loads' supports. Labels omitted only
    // when too close to read; full positions remain in the inspector and table.
    if (annotationOn) {
        if (annotationMode === 'guided') model += dimension(xp(0), xp(m.length), beamY + 132, (0, common_1.fmt)(m.length) + ' m');
        else {
            const xs = [...new Set([0, m.length, ...m.items.flatMap(i => (0, validation_1.isDistributed)(i.kind) ? [i.x, i.end] : [i.x])])].sort((a, b) => a - b);
            for (let k = 1; k < xs.length; k++)
                if (visible(xs[k]) && visible(xs[k - 1]) && xp(xs[k]) - xp(xs[k - 1]) > 66)
                    model += dimension(xp(xs[k - 1]), xp(xs[k]), beamY + 132, (0, common_1.fmt)(xs[k] - xs[k - 1]) + ' m');
        }
    }
    model += tracer(layout.height) + `</g></svg>`;
    let html = `<section class="diagram-block" id="structure-block">${diagramHeader('01', 'Structure', 'm / kN', `${(0, common_1.fmt)(m.length)} m member`)}${model}<div class="diagram-caption"><span>Load labels are nominal. Active case factors are applied to the results.${m.selfWeight ? ' Additional self-weight acts over the full beam.' : ''}</span><span>Double-click a label to edit</span></div></section>`;
    const val = (s, k, a) => k === 'stress' ? -s.M * a.properties.c / a.properties.I / 1000 : k === 'v' ? s.v * 1000 : s[k];
    const chart = (kind, num, title, units, colour) => {
        const H = 230, base = 108, amp = 66;
        const critical = a ? criticalSamples(a, kind) : [];
        const other = v.compare ? criticalSamples(v.compare, kind) : [];
        const max = Math.max(1e-8, v.scaleLimits?.[kind] || 0, ...critical.map(s => Math.abs(val(s, kind, a))), ...other.map(s => Math.abs(val(s, kind, v.compare))));
        const yp = (n) => base - n / max * amp;
        const path = (aa) => aa.points.map((s, k) => `${k ? 'L' : 'M'}${(0, common_1.fmt)(xp(s.x), 3)} ${(0, common_1.fmt)(yp(val(s, kind, aa)), 3)}`).join(' ');
        const revealStage = kind === 'V' ? 2 : kind === 'M' ? 3 : 4;
        const revealed = !v.practice || v.practiceStep >= revealStage;
        let svg = `<svg data-chart="${kind}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="${kind}-bounds"><rect x="${left}" y="20" width="${right - left}" height="176"/></clipPath><clipPath id="${kind}-positive"><rect x="${left}" y="10" width="${right - left}" height="${base - 10}"/></clipPath><clipPath id="${kind}-negative"><rect x="${left}" y="${base}" width="${right - left}" height="95"/></clipPath></defs>${grid(H)}<line x1="${left}" x2="${right}" y1="${base}" y2="${base}" stroke="#8da09f" stroke-width=".7" stroke-dasharray="3 4"/>${svgText(left - 8, base + 3, '0', '#839e9a', 'end', 9)}<text x="15" y="${base}" text-anchor="middle" fill="${colour}" font-size="10" transform="rotate(-90 15 ${base})">${(0, common_1.esc)(kind === 'v' ? 'v / mm (up +)' : kind === 'stress' ? 'top fibre / MPa' : kind + ' / ' + units)}</text>`;
        if (a && revealed) {
            const d = path(a), area = `${d} L${xp(m.length)} ${base}L${xp(0)} ${base}Z`;
            svg += `<path d="${area}" fill="${colour}" opacity=".25" clip-path="url(#${kind}-positive)"/><path d="${area}" fill="${kind === 'v' ? '#a586e4' : '#ee8c91'}" opacity=".23" clip-path="url(#${kind}-negative)"/><g clip-path="url(#${kind}-bounds)"><path d="${d}" fill="none" stroke="${colour}" stroke-width="2" stroke-linejoin="round"/>`;
            // Overlay each concentrated jump with the causing action's identity colour.
            for (const item of m.items.filter(i => (kind === 'V' && i.kind === 'point') || (kind === 'M' && i.kind === 'moment'))) {
                if (!visible(item.x) || (0, study_1.caseFactor)(m, item.caseId) === 0)
                    continue;
                const l = a.sample(item.x, 'left'), r = a.sample(item.x);
                if (Math.abs(val(l, kind, a) - val(r, kind, a)) > 1e-8)
                    svg += `<line x1="${xp(item.x)}" x2="${xp(item.x)}" y1="${yp(val(l, kind, a))}" y2="${yp(val(r, kind, a))}" stroke="${item.colour}" stroke-width="2.6"/>`;
            }
            if (v.compare)
                svg += `<path d="${path(v.compare)}" fill="none" stroke="#e3e9e8" opacity=".65" stroke-dasharray="6 5" stroke-width="1.5"/>`;
            for (const hinge of m.items.filter(i => i.kind === 'hinge'))
                svg += `<line x1="${xp(hinge.x)}" x2="${xp(hinge.x)}" y1="25" y2="192" stroke="#bc9aff" opacity=".3" stroke-dasharray="2 5"/>${kind === 'M' ? `<circle cx="${xp(hinge.x)}" cy="${base}" r="4" fill="#11151c" stroke="#bc9aff"/>` : ''}`;
            svg += '</g>';
            if (annotationOn) {
                const priority = [...critical].sort((s, t) => Math.abs(val(t, kind, a)) - Math.abs(val(s, kind, a)));
                const boxes = [];
                const accepted = [];
                for (const s of priority) {
                    if (!visible(s.x))
                        continue;
                    const value = val(s, kind, a);
                    if (Math.abs(value) < 1e-7)
                        continue;
                    if (accepted.some(t => Math.abs(t.s.x - s.x) < 1e-7 && Math.abs(t.value - value) < 1e-6))
                        continue;
                    const tx = (0, common_1.clamp)(xp(s.x), left + 35, right - 35), ty = yp(value) + (value >= 0 ? -12 : 20), tw = 70;
                    if (boxes.some(b => Math.abs(b.x - tx) < (tw + b.w) / 2 + 8 && Math.abs(b.y - ty) < 26))
                        continue;
                    boxes.push({ x: tx, y: ty, w: tw });
                    accepted.push({ s, value });
                    svg += `<circle cx="${xp(s.x)}" cy="${yp(value)}" r="3.5" fill="${colour}"/>${svgText(tx, ty, (0, common_1.signed)(value), value >= 0 ? colour : '#f1a6ad', 'middle', 11, `font-weight="600"`)}${svgText(tx, ty + (value >= 0 ? -13 : 13), `x=${(0, common_1.fmt)(s.x)} m`, '#80969c', 'middle', 8)}`;
                    if (accepted.length >= criticalLimit)
                        break;
                }
                for (const hinge of m.items.filter(i => i.kind === 'hinge' && visible(i.x)))
                    if (kind === 'M')
                        svg += svgText((0, common_1.clamp)(xp(hinge.x), left + 24, right - 24), base - 10, `${hinge.label} 0`, '#c4b1fa', 'middle', 9);
            }
        }
        else if (a && !revealed)
            svg += `<rect x="${left + 15}" y="45" width="${right - left - 30}" height="126" rx="12" fill="#0f191d" stroke="#33454a" stroke-dasharray="4 5"/>${svgText(W / 2, 91, 'PREDICT BEFORE REVEAL', '#82d8c1', 'middle', 9, 'letter-spacing="1.5"')}${svgText(W / 2, 116, kind === 'V' ? 'Sketch the shear-force diagram.' : kind === 'M' ? 'Use the SFD to sketch the bending-moment diagram.' : kind === 'v' ? 'Predict the elastic curve.' : 'Predict tension and compression.', '#c5d5d1', 'middle', 11)}${svgText(W / 2, 138, 'Use Learn → Practice mode when you are ready to reveal the next stage.', '#80969c', 'middle', 8)}`;
        else
            svg += svgText(W / 2, base, 'Complete a stable model to view this response.', '#8ea5ad', 'middle', 11);
        svg += tracer(H) + `<circle class="trace-marker" r="4" fill="#0b1418" stroke="${colour}" stroke-width="2" style="display:none"/><text class="trace-label" fill="${colour}" font-size="10" style="display:none"></text></svg>`;
        let hint = !revealed ? 'Practice mode / response hidden until reveal' : kind === 'v' ? 'Shape exaggerated. Downward = negative.' : kind === 'stress' ? 'Top fibre: tension + / compression -' : 'Signed values / critical positions';
        return `<section class="diagram-block" data-kind="${kind}" data-max="${max}" data-base="${base}" data-amp="${amp}">${diagramHeader(num, title, units, hint)}${svg}</section>`;
    };
    html += chart('V', '02', 'Shear force diagram', 'kN', '#82d8b0');
    html += chart('M', '03', 'Bending moment diagram', 'kN\u00b7m', '#efcb72');
    if (v.deformation)
        html += chart('v', '04', 'Deformed shape', 'mm', '#b899ef');
    if (v.stress)
        html += chart('stress', v.deformation ? '05' : '04', 'Elastic bending stress', 'MPa', '#e9a1a3');
    return html;
}
function renderSection(m, a, x) {
    const props = m.section, values = a ? (0, study_1.stressAt)(a, x) : { top: 0, bottom: 0, M: 0 };
    const H = 200, scale = Math.min(120 / props.h, 110 / props.b), b = props.b * scale, h = props.h * scale, t = Math.max(2, props.t * scale), tf = Math.max(2, props.tf * scale), cx = 110, cy = 96;
    const family = props.family || props.shape;
    let shape = '';
    if (family === 'i' || family === 'UB' || family === 'UC')
        shape = `M${cx - b / 2} ${cy - h / 2}h${b}v${tf}h${-(b - t) / 2}v${h - 2 * tf}h${(b - t) / 2}v${tf}h${-b}v${-tf}h${(b - t) / 2}v${-(h - 2 * tf)}h${-(b - t) / 2}Z`;
    else if (family === 'PFC')
        shape = `M${cx - b / 2} ${cy - h / 2}h${b}v${tf}h${-(b - t)}v${h - 2 * tf}h${b - t}v${tf}h${-b}Z`;
    else
        shape = `M${cx - b / 2} ${cy - h / 2}h${b}v${h}h${-b}Z${family === 'box' ? `M${cx - b / 2 + t} ${cy - h / 2 + t}v${h - 2 * t}h${b - 2 * t}v${-(h - 2 * t)}Z` : ''}`;
    const topC = values.top >= 0 ? '#80d9c6' : '#f0a1a5', bottomC = values.bottom >= 0 ? '#80d9c6' : '#f0a1a5';
    const max = Math.max(Math.abs(values.top), 1e-9), sx = 270, stressWidth = 70, xt = sx + values.top / max * stressWidth, xb = sx + values.bottom / max * stressWidth;
    const drawing = `<svg viewBox="0 0 400 ${H}" role="img" aria-label="Cross-section and elastic stress distribution"><defs><linearGradient id="stress-colour" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${topC}"/><stop offset=".5" stop-color="#83979b"/><stop offset="1" stop-color="${bottomC}"/></linearGradient></defs><path d="${shape}" fill="url(#stress-colour)" fill-rule="evenodd" stroke="#d4e3df" stroke-width=".7"/><line x1="28" x2="190" y1="${cy}" y2="${cy}" stroke="#d0deda" opacity=".4" stroke-dasharray="3 4"/>${svgText(110, cy + h / 2 + 20, props.catalogue || (family === 'custom' ? 'Symmetric outline' : family.toUpperCase()), '#a2b4b8', 'middle', 10)}<line x1="${sx}" x2="${sx}" y1="${cy - h / 2 - 12}" y2="${cy + h / 2 + 12}" stroke="#b3c0c4" opacity=".5"/><path d="M${sx} ${cy - h / 2}H${xt}L${sx} ${cy}Z" fill="${topC}" opacity=".4"/><path d="M${sx} ${cy}L${xb} ${cy + h / 2}H${sx}Z" fill="${bottomC}" opacity=".4"/><line x1="${xt}" y1="${cy - h / 2}" x2="${xb}" y2="${cy + h / 2}" stroke="#e2e9e7"/>${svgText(sx, cy - h / 2 - 20, (0, common_1.signed)(values.top) + ' MPa', topC, 'middle', 11)}${svgText(sx, cy + h / 2 + 29, (0, common_1.signed)(values.bottom) + ' MPa', bottomC, 'middle', 11)}${svgText(sx, 190, 'Compression -  /  Tension +', '#8ea3ab', 'middle', 9)}</svg>`;
    return `<div class="section-stress"><div><span class="eyebrow">THROUGH THE SECTION</span><h3>Compression. Neutral axis. Tension.</h3><p>At x = <b>${(0, common_1.fmt)(x)} m</b>, M = <b>${(0, common_1.signed)(values.M)} kN\u00b7m</b></p><p class="muted">${props.shape === 'custom' && !props.catalogue ? 'Outline is schematic; the calculation uses your entered I and depth.' : 'Cross-section schematic; fillets are omitted from the drawing.'} Constant symmetric depth, bending about x-x. Stress is elastic, not a capacity check.</p><div class="formula">\u03c3(y) = -M y / I</div></div>${drawing}</div>`;
}
function teaching(m, a, x, level = 'all') {
    if (!a)
        return '<p class="muted">Complete a valid model to explore the relationships.</p>';
    const actual = (0, study_1.effectiveModel)(m), l = a.sample(x, 'left'), r = a.sample(x), e = a.elements.find(e => x >= e.a - 1e-10 && x < e.b - 1e-10) || a.elements[a.elements.length - 1];
    const w = e.w0 + e.slope * (x - e.a), jumpV = r.V - l.V, jumpM = r.M - l.M;
    let event = 'Between concentrated actions, the curves are continuous.';
    if (Math.abs(jumpV) > 1e-7)
        event = level === 'year1' ? `A point action makes the shear diagram jump by ${(0, common_1.signed)(jumpV)} kN here.` : `A concentrated vertical action changes shear by ${(0, common_1.signed)(jumpV)} kN here. The bending moment stays continuous unless a couple also acts here.`;
    if (Math.abs(jumpM) > 1e-7)
        event = level === 'year1' ? `A concentrated moment changes the bending-moment diagram suddenly by ${(0, common_1.signed)(jumpM)} kN m.` : `An applied or reaction couple changes moment by ${(0, common_1.signed)(jumpM)} kN m here. A pure couple does not create a shear jump.`;
    if (actual.items.some(i => i.kind === 'hinge' && Math.abs(i.x - x) < 1e-7))
        event = level === 'year1' ? 'This advanced study contains an internal hinge. Its bending moment is zero at the release.' : 'This is an internal hinge: M is zero on both sides. Vertical displacement is continuous, but rotation can differ.';
    if (level === 'year1') {
        const loadIdea = Math.abs(w) < 1e-9 ? 'There is no distributed load in this region, so the shear-force line is flat.' : `The distributed load here is ${(0, common_1.signed)(w)} kN/m, so the shear-force diagram changes steadily rather than staying flat.`;
        const momentIdea = Math.abs(r.V) < 1e-7 ? 'Shear is approximately zero here, so the bending-moment curve is locally flat. This is a common place for a maximum or minimum moment.' : `Shear is ${(0, common_1.signed)(r.V)} kN here. Its sign tells you whether the bending-moment curve is rising or falling.`;
        return `<div class="teach-head"><span class="eyebrow">SHOW WHY / 1ST YEAR / x = ${(0, common_1.fmt)(x)} m</span><span class="tag">Plain-language statics</span></div><div class="teach-cards"><article><div class="formula">Load → shear</div><p>${loadIdea}</p></article><article><div class="formula">Shear → moment</div><p>${momentIdea}</p></article></div><p class="event-explanation">${event}</p><small class="muted">BeamLab can show the derivative equations when you move to 2nd Year. At a point load, inspect the left and right shear values separately.</small>`;
    }
    const advanced = level === 'year3' || level === 'all';
    return `<div class="teach-head"><span class="eyebrow">SHOW WHY / ${level === 'year2' ? '2ND YEAR' : 'ADVANCED'} / x = ${(0, common_1.fmt)(x)} m</span><span class="tag">Deterministic explanation</span></div><div class="teach-cards"><article><div class="formula">dV/dx = -w</div><p>Intensity <b>${(0, common_1.signed)(w)} kN/m</b> gives shear slope <b>${(0, common_1.signed)(-w)} kN/m</b> within this region.</p></article><article><div class="formula">dM/dx = V</div><p>Shear <b>${(0, common_1.signed)(r.V)} kN</b> is the slope of the moment curve. Smooth local extrema may occur where V = 0.</p></article><article><div class="formula">EI v'' = M</div><p>Moment controls elastic curvature. The deformed curve follows the support and hinge compatibility conditions.</p></article>${advanced ? `<article><div class="formula">Model → verification</div><p>Use equilibrium, release and compatibility residuals to check the mathematical model before interpreting an advanced response.</p></article>` : ''}</div><p class="event-explanation">${event}</p><small class="muted">At actions, use the left/right values. A global peak can also occur at an endpoint or moment jump.</small>`;
}
