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
const section_regions_1 = require("../model/section-regions");
const study_1 = require("../model/study");
const common_1 = require("./common");
const labels_1 = require("./annotation-layout");
function loadLabel(i, width, factor) {
    const distributed = (0,validation_1.isDistributed)(i.kind);
    const text = distributed ? `${i.label}  ${(0, common_1.fmt)(i.value, 1)}${i.kind === 'variable' ? ' to ' + (0, common_1.fmt)(i.endValue, 1) : ''} kN/m${i.locked ? ' [L]' : ''}`
        : `${i.label} ${(0, common_1.signed)(i.value, 1)} ${i.kind === 'point' ? 'kN' : 'kN·m'}${i.locked ? ' [L]' : ''}`;
    const box = (0,labels_1.labelBox)([{text,colour:i.colour}], Math.min(240,width-24), i.kind === 'point' ? 11 : 10);
    const base = distributed ? -70 : -18;
    const top = distributed ? Math.min(base, base-i.value*factor, base-(i.kind==='variable'?i.endValue:i.value)*factor)
        : i.kind==='point' ? base-33-Math.min(43,Math.sqrt(Math.abs(i.value))*4) : base-62;
    return {...box,top:top-box.height-8};
}
function layoutModel(m, width, view = {}) {
    const {xp, span} = coordinates(m, {width, zoom: view.zoom || 1, pan: view.pan || 0});
    const pan = view.pan || 0, rows = [], lanes = new Map(), labels = new Map();
    const maxW = Math.max(16, ...m.items.filter(i => (0, validation_1.isDistributed)(i.kind)).flatMap(i => [Math.abs(i.value), Math.abs(i.endValue || i.value)]));
    const factor = 64 / maxW;
    [...m.items.filter(i => (0, validation_1.isLoad)(i.kind))].sort((a, b) => a.x - b.x).forEach(i => {
        const distributed = (0, validation_1.isDistributed)(i.kind);
        if ((distributed ? i.end : i.x) < pan - 1e-8 || i.x > pan + span + 1e-8) return;
        const box = loadLabel(i,width,factor);
        const x = xp(i.x), x2 = distributed ? xp(i.end) : x;
        const cx = (0, common_1.clamp)((x + x2) / 2, box.width / 2 + 12, width - box.width / 2 - 12);
        const base = distributed ? -70 : -18;
        const labelTop = box.top;
        const bottom = distributed ? Math.max(base, base - i.value * factor, base - (i.kind === 'variable' ? i.endValue : i.value) * factor) + 8 : base + 10;
        const start = Math.min(x - 30, cx - box.width / 2), end = Math.max(x2 + 30, cx + box.width / 2);
        let lane = rows.findIndex(row => row.end + 12 < start);
        if (lane < 0) { lane = rows.length; rows.push({end, top:labelTop, bottom}); }
        else { rows[lane].end = end; rows[lane].top = Math.min(rows[lane].top, labelTop); rows[lane].bottom = Math.max(rows[lane].bottom, bottom); }
        lanes.set(i.id, lane); labels.set(i.id, {...box, cx, top:labelTop});
    });
    const offsets = rows.map(() => 0);
    for (let n = 1; n < rows.length; n++) offsets[n] = offsets[n-1] - rows[n-1].top + rows[n].bottom + 16;
    const beamY = Math.max(200, ...rows.map((row, n) => 24 - row.top + offsets[n]));
    return {lanes, labels, offsets, beamY, height:beamY + 160, factor};
}
function coordinates(m, v) {
    const left = v.width < 550 ? 45 : 58, right = v.width - left;
    const span = m.length / v.zoom;
    return { left, right, span, xp: (x) => left + (x - v.pan) / span * (right - left) };
}
const svgText = (x, y, text, colour = '#a1b1bb', anchor = 'middle', size = 11, extra = '') => `<text x="${(0, common_1.fmt)(x, 3)}" y="${(0, common_1.fmt)(y, 3)}" text-anchor="${anchor}" fill="${colour}" font-size="${size}" ${extra}>${(0, common_1.esc)(text)}</text>`;
function labelSvg(box, attrs = '') {
    return `<g ${attrs} font-family="ui-monospace,monospace"><rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="5" fill="#101a20" fill-opacity=".96"/>${box.lines.map((line, n) => svgText(box.x + 8, box.y + 17 + n * 15, line.text, line.colour || '#a1b1bb', 'start', line.size, line.bold ? 'font-weight="600"' : '')).join('')}</g>`;
}
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
    const layout = v.layout || layoutModel(m, W, v), beamY = layout.beamY;
    const notes = [];
    const note = (id, x, lines, colour, objectId) => notes.push({id, px:xp(x), colour, objectId, ...(0, labels_1.labelBox)(lines, Math.min(210, W - 24))});
    for (const i of m.items.filter(i => (0, validation_1.isSupport)(i.kind) && visible(i.x))) {
        const r = a?.reactions.find(r => r.id === i.id);
        const lines = [{text:`${i.label}${i.locked ? ' [L]' : ''} / ${(0,common_1.fmt)(i.x,2)} m`, colour:'#bbcdc9'}];
        if (Math.abs(i.settlementMm || 0) > 1e-12) lines.push({text:`Δ ${(0,common_1.signed)(i.settlementMm,2)} mm`, colour:'#efcb72'});
        if (i.kind === 'fixed' && Math.abs(i.rotationMrad || 0) > 1e-12) lines.push({text:`θ ${(0,common_1.signed)(i.rotationMrad,2)} mrad`, colour:'#efcb72'});
        if (r && (!v.practice || v.practiceStep >= 1)) {
            lines.push({text:`R ${(0,common_1.signed)(r.force)} kN`, colour:'#82d8c1'});
            if (r.fixed) lines.push({text:`M ${(0,common_1.signed)(r.moment)} kN·m`, colour:'#bc9aff'});
        } else if (r) lines.push({text:'reaction ?', colour:'#82d8c1'});
        note(i.id, i.x, lines, '#bbcdc9', i.id);
    }
    for (const i of m.items.filter(i => i.kind === 'hinge' && visible(i.x)))
        note(i.id, i.x, [{text:`${i.label} / M=0`, colour:'#bc9aff'}, {text:`x=${(0,common_1.fmt)(i.x)} m`, size:9}], '#bc9aff', i.id);
    const sectionSegments = (0, section_regions_1.sectionSegments)(m);
    const baseDepth = Math.max(1, Number(m.section?.h) || 1);
    const sectionBands = sectionSegments.map(seg => {
        const x1=xp(seg.a), x2=xp(seg.b), mid=(x1+x2)/2;
        const depthRatio=Math.max(.35,Math.min(2.5,(Number(seg.section?.h)||baseDepth)/baseDepth));
        const stroke=Math.max(4,Math.min(18,7*depthRatio));
        const explicit=!!seg.regionId;
        const col=explicit?'#a9d8cf':'url(#beam-metal)';
        const boundary=explicit?`<line x1="${x1}" x2="${x1}" y1="${beamY-13}" y2="${beamY+13}" stroke="#b4d9d1" opacity=".55"/><line x1="${x2}" x2="${x2}" y1="${beamY-13}" y2="${beamY+13}" stroke="#b4d9d1" opacity=".55"/>`:'';
        if (explicit && annotationOn && visible((seg.a+seg.b)/2)) note(`section-${seg.regionId}`, (seg.a+seg.b)/2, [{text:`${seg.regionLabel} / ${seg.label}`,colour:'#a9cfc7',size:9}], '#a9cfc7');
        return `<g class="section-region-band" aria-label="${(0,common_1.esc)(seg.regionLabel)} ${(0,common_1.esc)(seg.label)}"><line x1="${x1}" x2="${x2}" y1="${beamY}" y2="${beamY}" stroke="${col}" stroke-width="${stroke}" stroke-linecap="butt"/>${boundary}</g>`;
    }).join('');
    const stiffnessBands = (m.stiffnessRegions || []).map(r => {
        const x1 = xp(r.x), x2 = xp(r.end), mid = (x1 + x2) / 2;
        const col = r.factor >= 1 ? '#83dcc5' : '#efcb72';
        if (annotationOn && visible((r.x+r.end)/2)) note(`stiffness-${r.id}`, (r.x+r.end)/2, [{text:`${r.label} / EI ×${(0,common_1.fmt)(r.factor,2)}`,colour:col,size:9}], col);
        return `<g class="stiffness-band" aria-label="${(0,common_1.esc)(r.label)} EI multiplier ${(0,common_1.fmt)(r.factor,2)}"><line x1="${x1}" x2="${x2}" y1="${beamY}" y2="${beamY}" stroke="${col}" stroke-width="21" opacity=".12"/><line x1="${x1}" x2="${x2}" y1="${beamY}" y2="${beamY}" stroke="${col}" stroke-width="2" opacity=".9"/></g>`;
    }).join('');
    const structureLabels = (0,labels_1.stackLabels)(notes, W, beamY + 96);
    const dimensionY = Math.max(beamY + 120, ...structureLabels.map(b => b.y + b.height + 22));
    const modelHeight = dimensionY + 38;
    let model = `<svg class="model-svg" data-model="1" data-beam-y="${beamY}" viewBox="0 0 ${W} ${modelHeight}" role="img" aria-label="Structure and loads" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="beam-metal" gradientUnits="userSpaceOnUse" x1="${left}" x2="${right}" y1="0" y2="0"><stop stop-color="#739e96"/><stop offset=".5" stop-color="#e0ede9"/><stop offset="1" stop-color="#78928f"/></linearGradient><clipPath id="model-clip"><rect x="0" y="0" width="${W}" height="${modelHeight}"/></clipPath></defs>${grid(modelHeight)}<g clip-path="url(#model-clip)">${sectionBands}${stiffnessBands}`;
    for (const i of m.items.filter(i => (0, validation_1.isLoad)(i.kind))) {
        if (!layout.lanes.has(i.id)) continue;
        const x = xp(i.x), lane = layout.lanes.get(i.id) || 0;
        const offset = layout.offsets[lane] || 0, base = beamY - ((0, validation_1.isDistributed)(i.kind) ? 70 : 18) - offset;
        const c = i.colour, factor = (0, study_1.caseFactor)(m, i.caseId), inactive = factor === 0;
        const objectAttrs = `data-object="${(0, common_1.esc)(i.id)}" class="canvas-object ${i.locked ? 'locked' : ''}" tabindex="0" role="button" aria-label="Select ${(0, common_1.esc)(i.label)}"`;
        model += `<g ${objectAttrs} opacity="${inactive ? '.3' : '1'}">`;
        if ((0, validation_1.isDistributed)(i.kind)) {
            const x2 = xp(i.end), w0 = i.value, w1 = i.kind === 'variable' ? i.endValue : w0;
            const y0 = base - w0 * layout.factor, y1 = base - w1 * layout.factor;
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
        }
        else if (i.kind === 'point') {
            const h = 33 + Math.min(43, Math.sqrt(Math.abs(i.value)) * 4), top = base - h;
            model += `<rect x="${x - 23}" y="${top - 24}" width="46" height="${h + 34}" rx="9" fill="${v.selected.has(i.id) ? c + '10' : 'transparent'}" stroke="${v.selected.has(i.id) ? c : 'none'}" stroke-dasharray="3 4"/>`;
            if (i.value !== 0)
                model += arrow(x, i.value >= 0 ? top : base, i.value >= 0 ? base : top, c, 2);
            model += `<line x1="${x}" x2="${x}" y1="${base}" y2="${beamY - 5}" stroke="${c}" stroke-dasharray="2 4" opacity=".35"/>`;
        }
        else {
            const cy = base - 26, r = 20, ccw = i.value >= 0;
            model += `<circle cx="${x}" cy="${cy}" r="30" fill="${v.selected.has(i.id) ? c + '10' : 'transparent'}" stroke="${v.selected.has(i.id) ? c : 'none'}"/><path d="M${x + r} ${cy} A${r} ${r} 0 1 ${ccw ? 0 : 1} ${x} ${cy + (ccw ? r : -r)}" fill="none" stroke="${c}" stroke-width="1.9"/><path d="M${x - 6} ${cy + (ccw ? r : -r) - 5}l8 5-8 5" fill="${c}"/>`;
            model += `<line x1="${x}" x2="${x}" y1="${base}" y2="${beamY - 5}" stroke="${c}" stroke-dasharray="2 4" opacity=".35"/>`;
        }
        const box = loadLabel(i,W,layout.factor);
        // Keep frozen drag lanes, but anchor the editable label to the moving object.
        const mid = (0,validation_1.isDistributed)(i.kind) ? (x + xp(i.end)) / 2 : x;
        model += labelSvg({...box, x:(0,common_1.clamp)(mid - box.width / 2,12,W-12-box.width), y:beamY + box.top - offset}, 'data-inline="value" data-annotation="load"');
        model += '</g>';
    }
    for (const i of m.items.filter(i => (0, validation_1.isSupport)(i.kind) && visible(i.x))) {
        const x = xp(i.x), r = a?.reactions.find(r => r.id === i.id), col = '#bbcdc9';
        model += `<g data-object="${(0, common_1.esc)(i.id)}" class="canvas-object ${i.locked ? 'locked' : ''}" tabindex="0" role="button" aria-label="Select ${(0, common_1.esc)(i.label)}"><rect x="${x - 24}" y="${beamY - 8}" width="48" height="65" rx="8" fill="${v.selected.has(i.id) ? '#82d8c110' : 'transparent'}" stroke="${v.selected.has(i.id) ? '#82d8c1' : 'none'}" stroke-dasharray="3 4"/>`;
        if (i.kind === 'fixed')
            model += `<rect x="${x - 5}" y="${beamY - 24}" width="10" height="50" fill="${col}"/><path d="M${x - 15} ${beamY - 17}l10-10m-10 23 10-10m-10 23 10-10m-10 23 10-10" stroke="${col}"/>`;
        else
            model += `<path d="M${x} ${beamY + 5}l-11 20h22Z" fill="${col}"/>${i.kind === 'roller' ? `<circle cx="${x - 6}" cy="${beamY + 31}" r="3.5" stroke="${col}" fill="none"/><circle cx="${x + 6}" cy="${beamY + 31}" r="3.5" stroke="${col}" fill="none"/>` : `<line x1="${x - 15}" x2="${x + 15}" y1="${beamY + 29}" y2="${beamY + 29}" stroke="${col}"/>`}`;
        if (r && (!v.practice || v.practiceStep >= 1)) {
            model += arrow(x, r.force >= 0 ? beamY + 83 : beamY + 48, r.force >= 0 ? beamY + 48 : beamY + 83, '#82d8c1', 1.7);
        }
        model += '</g>';
    }
    for (const i of m.items.filter(i => i.kind === 'hinge' && visible(i.x)))
        model += `<g data-object="${(0, common_1.esc)(i.id)}" tabindex="0" role="button" aria-label="Select ${(0, common_1.esc)(i.label)}" class="canvas-object"><circle cx="${xp(i.x)}" cy="${beamY}" r="17" fill="transparent"/><circle cx="${xp(i.x)}" cy="${beamY}" r="6" fill="#0b1418" stroke="#bc9aff" stroke-width="2"/></g>`;
    // Draw leaders first so no connector can obscure a later row's text.
    model += structureLabels.map(b => `<path d="M${b.px} ${beamY+40} L${b.x+b.width/2} ${b.y}" stroke="${b.colour}" opacity=".25" fill="none" pointer-events="none"/>`).join('');
    model += structureLabels.map(b => labelSvg(b, `data-annotation="structure"${b.objectId ? ` data-object="${(0,common_1.esc)(b.objectId)}" class="canvas-object"` : ''}`)).join('');
    // Dimension chain has its own band below all notes. Labels omitted only
    // when too close to read; full positions remain in the inspector and table.
    if (annotationOn) {
        if (annotationMode === 'guided' && v.zoom === 1) model += dimension(xp(0), xp(m.length), dimensionY, (0, common_1.fmt)(m.length) + ' m');
        else {
            const xs = [...new Set([0, m.length, ...m.items.flatMap(i => (0, validation_1.isDistributed)(i.kind) ? [i.x, i.end] : [i.x])])].sort((a, b) => a - b);
            for (let k = 1; k < xs.length; k++)
                if (visible(xs[k]) && visible(xs[k - 1]) && xp(xs[k]) - xp(xs[k - 1]) > 66)
                    model += dimension(xp(xs[k - 1]), xp(xs[k]), dimensionY, (0, common_1.fmt)(xs[k] - xs[k - 1]) + ' m');
        }
    }
    model += tracer(beamY + 45) + `</g></svg>`;
    let html = `<section class="diagram-block" id="structure-block">${diagramHeader('01', 'Structure', 'm / kN', `${(0, common_1.fmt)(m.length)} m member`)}${model}<div class="diagram-caption"><span>Load labels are nominal. Active case factors are applied to the results.${m.selfWeight ? ' Additional self-weight acts over the full beam.' : ''}${m.items.some(i => (0,validation_1.isSupport)(i.kind) && Math.abs(i.settlementMm || 0)>1e-12) ? ' Support settlement is prescribed displacement (up +).' : ''}</span><span>Double-click a label to edit</span></div></section>`;
    const val = (s, k, a) => k === 'stress' ? -s.M * (s.c ?? a.properties.c) / (s.I ?? a.properties.I) / 1000 : k === 'v' ? s.v * 1000 : s[k];
    const chart = (kind, num, title, units, colour) => {
        const base = 108, amp = 66;
        const critical = a ? criticalSamples(a, kind) : [];
        const other = v.compare ? criticalSamples(v.compare, kind) : [];
        const max = Math.max(1e-8, v.scaleLimits?.[kind] || 0, ...critical.map(s => Math.abs(val(s, kind, a))), ...other.map(s => Math.abs(val(s, kind, v.compare))));
        const yp = (n) => base - n / max * amp;
        const path = (aa) => aa.points.map((s, k) => `${k ? 'L' : 'M'}${(0, common_1.fmt)(xp(s.x), 3)} ${(0, common_1.fmt)(yp(val(s, kind, aa)), 3)}`).join(' ');
        const revealStage = kind === 'V' ? 2 : kind === 'M' ? 3 : 4;
        const revealed = !v.practice || v.practiceStep >= revealStage;
        const wanted = [];
        if (a && revealed && annotationOn) {
            const accepted = [];
            for (const s of [...critical].sort((s,t) => Math.abs(val(t,kind,a)) - Math.abs(val(s,kind,a)))) {
                const value = val(s,kind,a);
                if (!visible(s.x) || Math.abs(value) < 1e-7 || accepted.some(t => Math.abs(t.s.x-s.x)<1e-7 && Math.abs(t.value-value)<1e-6)) continue;
                accepted.push({s,value});
                wanted.push({px:xp(s.x), py:yp(value), xValue:s.x, value, above:value>=0,
                    ...(0,labels_1.labelBox)([{text:(0,common_1.signed)(value), colour:value>=0?colour:'#f1a6ad',size:11,bold:true},{text:`x=${(0,common_1.fmt)(s.x)} m`,colour:'#80969c',size:9}],right-left)});
                if (accepted.length >= criticalLimit) break;
            }
            if (kind === 'M') for (const hinge of m.items.filter(i => i.kind === 'hinge' && visible(i.x)))
                wanted.push({px:xp(hinge.x),py:base,xValue:hinge.x,value:0,above:true,...(0,labels_1.labelBox)([{text:`${hinge.label} / M=0`,colour:'#c4b1fa',size:9},{text:`x=${(0,common_1.fmt)(hinge.x)} m`,size:9}],right-left)});
        }
        const callouts = (0,labels_1.placeCallouts)(wanted,{left,right,top:5,bottom:201});
        const H = Math.max(230,...callouts.filter(b => b.y > 201).map(b => b.y+b.height+38));
        let svg = `<svg data-chart="${kind}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="${kind}-bounds"><rect x="${left}" y="20" width="${right - left}" height="176"/></clipPath><clipPath id="${kind}-positive"><rect x="${left}" y="10" width="${right - left}" height="${base - 10}"/></clipPath><clipPath id="${kind}-negative"><rect x="${left}" y="${base}" width="${right - left}" height="95"/></clipPath></defs>${grid(H)}<line x1="${left}" x2="${right}" y1="${base}" y2="${base}" stroke="#8da09f" stroke-width=".7" stroke-dasharray="3 4"/>${svgText(left - 8, base + 3, '0', '#839e9a', 'end', 9)}<text x="15" y="${base}" text-anchor="middle" fill="${colour}" font-size="10" transform="rotate(-90 15 ${base})">${(0, common_1.esc)(kind === 'v' ? 'v / mm (up +)' : kind === 'stress' ? 'top fibre / MPa' : kind + ' / ' + units)}</text>`;
        svg += tracer(230);
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
            svg += callouts.map(b => `<path d="M${b.px} ${b.py} L${(0,common_1.clamp)(b.px,b.x,b.x+b.width)} ${(0,common_1.clamp)(b.py,b.y,b.y+b.height)}" stroke="${colour}" opacity=".45" fill="none" pointer-events="none"/>`).join('');
            svg += callouts.map(b => labelSvg(b, `data-annotation="critical" data-x="${b.xValue}" data-value="${b.value}" pointer-events="none"`)).join('');
            svg += callouts.map(b => `<circle class="critical-marker" cx="${b.px}" cy="${b.py}" r="3.5" fill="${colour}" pointer-events="none"/>`).join('');
        }
        else if (a && !revealed)
            svg += `<rect x="${left + 15}" y="45" width="${right - left - 30}" height="126" rx="12" fill="#0f191d" stroke="#33454a" stroke-dasharray="4 5"/>${svgText(W / 2, 91, 'PREDICT BEFORE REVEAL', '#82d8c1', 'middle', 9, 'letter-spacing="1.5"')}${svgText(W / 2, 116, kind === 'V' ? 'Sketch the shear-force diagram.' : kind === 'M' ? 'Use the SFD to sketch the bending-moment diagram.' : kind === 'v' ? 'Predict the elastic curve.' : 'Predict tension and compression.', '#c5d5d1', 'middle', 11)}${svgText(W / 2, 138, 'Use Learn → Practice mode when you are ready to reveal the next stage.', '#80969c', 'middle', 8)}`;
        else
            svg += svgText(W / 2, base, 'Complete a stable model to view this response.', '#8ea5ad', 'middle', 11);
        svg += `<circle class="trace-marker" r="4" fill="#0b1418" stroke="${colour}" stroke-width="2" style="display:none" pointer-events="none"/></svg>`;
        let hint = !revealed ? 'Practice mode / response hidden until reveal' : kind === 'v' ? 'Shape exaggerated. Downward = negative.' : kind === 'stress' ? 'Top fibre: tension + / compression -' : 'Signed values / critical positions';
        return `<section class="diagram-block" data-kind="${kind}" data-units="${units}" data-max="${max}" data-base="${base}" data-amp="${amp}">${diagramHeader(num, title, units, hint)}${svg}<div class="diagram-inspection"><span class="trace-placeholder">${!revealed ? 'Predict first; this response is hidden.' : 'Inspect or pin a position for its exact value.'}</span><output class="trace-label" style="display:none;color:${colour}"></output></div></section>`;
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
    const values = a ? (0, study_1.stressAt)(a, x) : { top: 0, bottom: 0, M: 0, unavailable:false, local:{section:m.section,regionLabel:'Base section',label:(0,section_regions_1.sectionLabel)(m.section)} };
    const props = values.local?.section || m.section;
    if (values.unavailable) {
        const local = values.local || {};
        return `<div class="section-stress unavailable"><div><span class="eyebrow">THROUGH THE SECTION / LOCAL RESULT</span><h3>Stress is not inferred in this EI-only zone.</h3><p>At x = <b>${(0,common_1.fmt)(x)} m</b>, M = <b>${(0,common_1.signed)(values.M)} kN·m</b>.</p><p class="muted">The active local stiffness is ${(0,common_1.fmt)(local.stiffnessFactor || 1,3)}× the known section EI, but BeamLab cannot tell whether that multiplier represents E, I or both. The moment result is valid for the beam model; a fibre-stress field would require verified local section properties.</p></div></div>`;
    }
    const H = 200, scale = Math.min(120 / props.h, 110 / props.b), b = props.b * scale, h = props.h * scale, t = Math.max(2, props.t * scale), tf = Math.max(2, props.tf * scale), cx = 110, cy = 96;
    const family = props.family || props.shape;
    let shape = '';
    if (family === 'i' || family === 'UB' || family === 'UC')
        shape = `M${cx - b / 2} ${cy - h / 2}h${b}v${tf}h${-(b - t) / 2}v${h - 2 * tf}h${(b - t) / 2}v${tf}h${-b}v${-tf}h${(b - t) / 2}v${-(h - 2 * tf)}h${-(b - t) / 2}Z`;
    else if (family === 'circle' || family === 'tube') {
        const radius=h/2, inner=(props.h/2-props.t)*scale;
        const circle=r=>`M${cx-r} ${cy}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`;
        shape=circle(radius)+(family==='tube'?circle(inner):'');
    }
    else if (family === 'PFC')
        shape = `M${cx - b / 2} ${cy - h / 2}h${b}v${tf}h${-(b - t)}v${h - 2 * tf}h${b - t}v${tf}h${-b}Z`;
    else
        shape = `M${cx - b / 2} ${cy - h / 2}h${b}v${h}h${-b}Z${family === 'box' ? `M${cx - b / 2 + t} ${cy - h / 2 + t}v${h - 2 * t}h${b - 2 * t}v${-(h - 2 * t)}Z` : ''}`;
    const topC = values.top >= 0 ? '#80d9c6' : '#f0a1a5', bottomC = values.bottom >= 0 ? '#80d9c6' : '#f0a1a5';
    const max = Math.max(Math.abs(values.top), 1e-9), sx = 270, stressWidth = 70, xt = sx + values.top / max * stressWidth, xb = sx + values.bottom / max * stressWidth;
    const localName = values.local?.regionId ? `${values.local.regionLabel} · ${values.local.label}` : values.local?.label || (0,section_regions_1.sectionLabel)(props);
    const drawing = `<svg viewBox="0 0 400 ${H}" role="img" aria-label="Local cross-section and elastic stress distribution"><defs><linearGradient id="stress-colour" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${topC}"/><stop offset=".5" stop-color="#83979b"/><stop offset="1" stop-color="${bottomC}"/></linearGradient></defs><path d="${shape}" fill="url(#stress-colour)" fill-rule="evenodd" stroke="#d4e3df" stroke-width=".7"/><line x1="28" x2="190" y1="${cy}" y2="${cy}" stroke="#d0deda" opacity=".4" stroke-dasharray="3 4"/>${svgText(110, cy + h / 2 + 20, props.catalogue || (family === 'custom' ? 'Symmetric outline' : family.toUpperCase()), '#a2b4b8', 'middle', 10)}<line x1="${sx}" x2="${sx}" y1="${cy - h / 2 - 12}" y2="${cy + h / 2 + 12}" stroke="#b3c0c4" opacity=".5"/><path d="M${sx} ${cy - h / 2}H${xt}L${sx} ${cy}Z" fill="${topC}" opacity=".4"/><path d="M${sx} ${cy}L${xb} ${cy + h / 2}H${sx}Z" fill="${bottomC}" opacity=".4"/><line x1="${xt}" y1="${cy - h / 2}" x2="${xb}" y2="${cy + h / 2}" stroke="#e2e9e7"/>${svgText(sx, cy - h / 2 - 20, (0, common_1.signed)(values.top) + ' MPa', topC, 'middle', 11)}${svgText(sx, cy + h / 2 + 29, (0, common_1.signed)(values.bottom) + ' MPa', bottomC, 'middle', 11)}${svgText(sx, 190, 'Compression -  /  Tension +', '#8ea3ab', 'middle', 9)}</svg>`;
    return `<div class="section-stress"><div><span class="eyebrow">THROUGH THE LOCAL SECTION</span><h3>Compression. Neutral axis. Tension.</h3><p>At x = <b>${(0, common_1.fmt)(x)} m</b>, M = <b>${(0, common_1.signed)(values.M)} kN·m</b></p><p class="local-section-chip">${(0,common_1.esc)(localName)}</p><p class="muted">${props.shape === 'custom' && !props.catalogue ? 'Outline is schematic; the calculation uses the local entered I and depth.' : 'Local cross-section schematic; fillets are omitted from the drawing.'} Bending about x-x. Stress is elastic, not a capacity check.</p><div class="formula">σ(y) = -M y / I</div></div>${drawing}</div>`;
}
function teaching(m, a, x, level = 'all') {
    if (!a) return '<p class="muted">Complete a valid model to explore the relationships.</p>';
    const e = require('./explanation').explainAt(m, a, x, level);
    return `<div class="teach-head"><span class="eyebrow">SHOW WHY / x = ${(0,common_1.fmt)(e.x)} m</span><span class="tag">Deterministic explanation</span></div><h3>${(0,common_1.esc)(e.title)}</h3><div class="formula">${(0,common_1.esc)(e.formula)}</div><div class="teach-cards"><article><b>Load → shear</b><p>Local intensity ${(0,common_1.signed)(e.facts.w)} kN/m; shear slope ${(0,common_1.signed)(-e.facts.w)} kN/m.</p></article><article><b>Shear → moment</b><p>Local shear ${(0,common_1.signed)(e.facts.right.V)} kN is the moment slope within this region.</p></article></div><div class="explanation-detail">${e.lines.map(line => `<p>${(0,common_1.esc)(line)}</p>`).join('')}</div>`;
}
