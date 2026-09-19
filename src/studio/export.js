"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.download = download;
exports.snapshotCode = snapshotCode;
exports.fromSnapshot = fromSnapshot;
exports.resultsCsv = resultsCsv;
exports.exportedSvgs = exportedSvgs;
exports.svgDocument = svgDocument;
exports.raster = raster;
exports.pngExport = pngExport;
exports.pdfReport = pdfReport;
const study_1 = require("../model/study");
const sections_1 = require("../model/sections");
const section_regions_1 = require("../model/section-regions");
const diagrams_1 = require("./diagrams");
const common_1 = require("./common");
const { fingerprint, RELEASE } = require('./verification');
function download(data, name, type) {
    const blob = new Blob([data], { type }), url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function snapshotCode(m) {
    const data = new TextEncoder().encode(JSON.stringify(m));
    return 'BLSTUDIO3:' + btoa(Array.from(data, b => String.fromCharCode(b)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromSnapshot(code) {
    code = code.trim();
    if (code.includes('#model='))
        code = decodeURIComponent(code.split('#model=')[1]);
    if (code.startsWith('BLSTUDIO3:'))
        code = code.slice(10);
    if (code.length > 210000 || !/^[\w-]+$/.test(code))
        throw new Error('Invalid snapshot code.');
    const raw = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
    return (0, study_1.parseStudy)(new TextDecoder().decode(Uint8Array.from(raw, c => c.charCodeAt(0))));
}
function resultsCsv(a) {
    // Duplicate coordinates intentionally retain both sides of point/couple and property jumps.
    const rows = ['x_m,side,shear_kN,moment_kNm,displacement_up_mm,rotation_CCW_rad,local_section,local_EI_kNm2,top_fibre_stress_MPa'];
    a.elements.forEach((e) => {
        const n = Math.max(12, Math.ceil((e.b - e.a) * 20));
        for (let i = 0; i <= n; i++) {
            const x = e.a + (e.b - e.a) * i / n, side = i === n ? 'left' : 'right', s = a.sample(x, side);
            const stress = Math.abs((s.stiffnessFactor ?? 1)-1) > 1e-12 ? '' : -s.M * (s.c ?? a.properties.c) / (s.I ?? a.properties.I) / 1000;
            const section = JSON.stringify(String(s.sectionRegionLabel ? s.sectionRegionLabel + ' / ' + s.sectionLabel : s.sectionLabel || 'Base section'));
            rows.push([x, i === 0 ? 'right' : i === n ? 'left' : 'interior', s.V, s.M, s.v * 1000, s.theta, section, s.localEI, stress].join(','));
        }
    });
    return rows.join('\n');
}
function exportedSvgs(m, a, v, width = 1100) {
    const node = document.createElement('div');
    node.innerHTML = (0, diagrams_1.renderDiagrams)(m, a, { ...v, width, zoom: 1, pan: 0, trace: null, compare: null, selected: new Set(), annotations: true, layout: undefined });
    return [...node.querySelectorAll('.diagram-block>svg')];
}
function svgDocument(m, a, v) {
    const svgs = exportedSvgs(m, a, v), ns = 'http://www.w3.org/2000/svg', root = document.createElementNS(ns, 'svg');
    let y = 76;
    const W = 1100;
    root.setAttribute('xmlns', ns);
    root.setAttribute('width', String(W));
    root.setAttribute('font-family', 'Arial, sans-serif');
    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#0d1318');
    root.append(bg);
    const text = (txt, yy, size = 13) => { const t = document.createElementNS(ns, 'text'); t.setAttribute('x', '36'); t.setAttribute('y', String(yy)); t.setAttribute('fill', '#dce7e8'); t.setAttribute('font-size', String(size)); t.textContent = txt; root.append(t); };
    text('BeamLab Studio '+RELEASE+' / ' + m.name, 30, 20);
    text('Current model only. Case factors: ' + m.cases.map(c => c.name + ' ' + (c.enabled ? c.factor : 'OFF')).join(' / '), 52, 11);
    text(fingerprint(m)+' / Educational analysis. Not a design check. Nominal labels; factored results.', 69, 11);
    y = 94;
    const names = ['Structure', 'Shear force / kN', 'Bending moment / kN m', ...(v.deformation ? ['Deformation / mm (up +, exaggerated)'] : []), ...(v.stress ? ['Top-fibre elastic stress / MPa (tension +)'] : [])];
    svgs.forEach((svg, i) => { text(names[i], y + 23, 14); y += 37; const H = Number(svg.getAttribute('viewBox').split(' ')[3]); svg.setAttribute('x', '0'); svg.setAttribute('y', String(y)); svg.setAttribute('width', '1100'); svg.setAttribute('height', String(H)); root.append(svg); y += H + 16; });
    root.setAttribute('height', String(y));
    root.setAttribute('viewBox', `0 0 ${W} ${y}`);
    return new XMLSerializer().serializeToString(root);
}
async function raster(svg, scale = 2) {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
        const img = new Image();
        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Image rendering timed out. Please use the SVG export.')), 10000);
            img.onload = () => { clearTimeout(timer); resolve(); };
            img.onerror = () => { clearTimeout(timer); reject(new Error('Unable to render the diagram. Please use SVG export.')); };
            img.src = url;
        });
        if (!img.naturalWidth || !img.naturalHeight) throw new Error('The image has no renderable dimensions.');
        const canvas = document.createElement('canvas');
        const factor = Math.min(scale, 8000 / img.naturalHeight, 4096 / img.naturalWidth);
        canvas.width = Math.max(1, Math.round(img.naturalWidth * factor));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * factor));
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas is not available. Please use SVG export.');
        ctx.fillStyle = '#0d1318'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas;
    } finally { URL.revokeObjectURL(url); }
}
async function pngExport(m, a, v) {
    const c = await raster(svgDocument(m, a, v));
    const blob = await new Promise((resolve, reject) => c.toBlob(b => b ? resolve(b) : reject(new Error('PNG encoding failed.')), 'image/png'));
    download(blob, 'beamlab-diagrams.png', 'image/png');
}
/** Minimal dependency-free PDF 1.4 writer. Standard PDF Helvetica and JPEG images.
 * Source text is escaped and encoded ASCII; no user text is treated as PDF code.
 */
class Pdf {
    enc(s) { return new TextEncoder().encode(s); }
    add(s) { this.objects.push(typeof s === 'string' ? this.enc(s) : s); return this.objects.length; }
    stream(header, bytes) { const a = this.enc(`<<${header} /Length ${bytes.length}>>\nstream\n`), b = this.enc('\nendstream'), out = new Uint8Array(a.length + bytes.length + b.length); out.set(a); out.set(bytes, a.length); out.set(b, a.length + bytes.length); return this.add(out); }
    constructor() {
        this.objects = [];
        this.pages = [];
        this.add('');
        this.add('');
        this.add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
        this.add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    }
    page(content, image) {
        let resources = '/Font << /F1 3 0 R /F2 4 0 R >>';
        if (image) {
            const id = this.stream(`/Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`, image.bytes);
            resources += ` /XObject << /Im1 ${id} 0 R >>`;
        }
        const cid = this.stream('', this.enc(content));
        const pid = this.add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << ${resources} >> /Contents ${cid} 0 R >>`);
        this.pages.push(pid);
    }
    finish() {
        this.objects[0] = this.enc('<< /Type /Catalog /Pages 2 0 R >>');
        this.objects[1] = this.enc(`<< /Type /Pages /Count ${this.pages.length} /Kids [${this.pages.map(i => i + ' 0 R').join(' ')}] >>`);
        const chunks = [this.enc('%PDF-1.4\n')], offsets = [0];
        let pos = chunks[0].length;
        this.objects.forEach((data, i) => { offsets.push(pos); const prefix = this.enc(`${i + 1} 0 obj\n`), suffix = this.enc('\nendobj\n'); chunks.push(prefix, data, suffix); pos += prefix.length + data.length + suffix.length; });
        chunks.push(this.enc(`xref\n0 ${this.objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(n => String(n).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${this.objects.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF`));
        const out = new Uint8Array(chunks.reduce((s, c) => s + c.length, 0));
        let at = 0;
        chunks.forEach(c => { out.set(c, at); at += c.length; });
        return out;
    }
}
const pdfEscape = (s) => s.normalize('NFKD').replace(/[^\x20-\x7e]/g, '-').replace(/[\\()]/g, '\\$&');
function line(text, y, size = 11, bold = false, colour = '0.10 0.17 0.20') { return `${colour} rg BT /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 42 ${y} Tm (${pdfEscape(text)}) Tj ET\n`; }
function wrap(s, max = 92) { const lines = []; let current = ''; for (const word of s.split(/\s+/)) {
    if (current.length + word.length + 1 > max) {
        lines.push(current);
        current = word;
    }
    else
        current += (current ? ' ' : '') + word;
} if (current)
    lines.push(current); return lines; }
async function pdfReport(m, a, v) {
    const pdf = new Pdf();
    let pageNumber = 1, cmd = '', y = 782;
    const footer = () => line(`BeamLab ${RELEASE} | ${fingerprint(m)} | Not design approval | Page ${pageNumber++}`, 29, 8, false, '0.38 0.44 0.47');
    const finish = () => { pdf.page(cmd + footer()); cmd = ''; y = 782; };
    const space = h => { if (y - h < 75) { finish(); cmd = line('BEAMLAB / CALCULATION RECORD - CONTINUED', y, 11, true); y -= 30; } };
    const heading = text => { space(65); y -= 13; cmd += '0.86 0.90 0.91 RG 42 '+(y+4)+' m 553 '+(y+4)+' l S\n'; y -= 16; cmd += line(text, y, 10, true); y -= 23; };
    const add = (text, size=10) => {
        // Bound long unbroken names as well as ordinary prose.
        const safe = String(text).replace(/(\S{78})(?=\S)/g,'$1 ');
        for (const t of wrap(safe, 88)) { space(17); cmd += line(t,y,size); y -= 15; }
    };
    cmd = line('BEAMLAB / ENGINEERING STUDY', 791, 9, true, '0.23 0.45 0.41');
    y = 761;
    for (const t of wrap(m.name,42)) { cmd += line(t,y,21,true); y -= 26; }
    add('Linear elastic analysis / '+fingerprint(m)+' / current model / full member width',10);
    heading('01  RESPONSE SUMMARY');
    add(`Peak shear |V| = ${(0,common_1.fmt)(Math.abs(a.peakV.V),4)} kN at ${(0,common_1.fmt)(a.peakV.x,4)} m.`);
    add(`Peak moment |M| = ${(0,common_1.fmt)(Math.abs(a.peakM.M),4)} kN m at ${(0,common_1.fmt)(a.peakM.x,4)} m.`);
    add(`Peak displacement = ${(0,common_1.fmt)(a.peakD.v*1000,5)} mm at ${(0,common_1.fmt)(a.peakD.x,4)} m (up positive).`);
    const stressEnvelope = a.hasEIOnlyRegions ? null : a.elasticStressEnvelope;
    const stress = stressEnvelope?.stress ?? (a.hasEIOnlyRegions ? null : Math.abs(a.peakM.M)*a.properties.c/a.properties.I/1000);
    add(a.hasEIOnlyRegions
        ? 'Peak elastic extreme-fibre stress is not inferred while EI-only stiffness overrides are active because their local E/I split and section geometry are undefined.'
        : `Peak elastic extreme-fibre stress magnitude = ${(0,common_1.fmt)(stress,4)} MPa${stressEnvelope ? ' at x '+(0,common_1.fmt)(stressEnvelope.x,4)+' m in '+stressEnvelope.sectionLabel : ''}. No capacity check.`);
    heading('02  MEMBER & SECTION');
    add(`${(0,common_1.fmt)(m.length)} m / ${a.system}. Base section: ${m.section.catalogue || m.section.shape}.`);
    add(`${m.section.material}. E ${(0,common_1.fmt)(m.section.E)} GPa; density ${(0,common_1.fmt)(m.section.density)} kg/m3; depth ${(0,common_1.fmt)(m.section.h)} mm.`);
    add(`A ${(0,common_1.fmt)(a.properties.A*1e6)} mm2; Ix ${(a.properties.I*1e12).toExponential(5)} mm4; base EI ${(0,common_1.fmt)(a.properties.EI/1000,5)} MN m2.`);
    if (a.hasSectionRegions) {
        add('True stepped-section regions:');
        for (const r of (a.sectionRegions || [])) {
            const rp=(0,sections_1.sectionProperties)(r.section);
            add(`  ${r.label}: ${(0,common_1.fmt)(r.x,3)}-${(0,common_1.fmt)(r.end,3)} m / ${(0,section_regions_1.sectionLabel)(r.section)} / E ${(0,common_1.fmt)(r.section.E,3)} GPa / A ${(0,common_1.fmt)(rp.A*1e6,2)} mm2 / Ix ${(rp.I*1e12).toExponential(5)} mm4 / h ${(0,common_1.fmt)(r.section.h,2)} mm / EI ${(0,common_1.fmt)(rp.EI/1000,5)} MN m2 / SW ${(0,common_1.fmt)(rp.weight,5)} kN/m.`,9);
        }
        add('Abrupt section transitions are member-property boundaries only; transition stress concentrations, tapers and connection effects are outside this model.',9);
    }
    if (a.hasEIOnlyRegions) {
        add('EI-only stiffness overrides: ' + (a.stiffnessRegions || []).map(r => r.label + ' ' + (0,common_1.fmt)(r.x,3) + '-' + (0,common_1.fmt)(r.end,3) + ' m, EI x' + (0,common_1.fmt)(r.factor,3)).join(' / ') + '.');
        add('EI-only multipliers do not define local section geometry, stress, self-weight or resistance.');
    }
    const wc=m.cases.find(c=>c.id===m.selfWeightCase);
    if (!m.selfWeight) add('Self-weight: excluded.');
    else if (a.hasSectionRegions) {
        const swSegments=(0,section_regions_1.sectionSegments)(m);
        add('Self-weight: piecewise from local section area/density, case '+(wc?.name || m.selfWeightCase)+'.');
        for (const seg of swSegments) add(`  ${(0,common_1.fmt)(seg.a,3)}-${(0,common_1.fmt)(seg.b,3)} m / ${seg.regionLabel}: ${(0,common_1.fmt)(seg.properties.weight,5)} kN/m nominal.`,9);
    } else add(`Self-weight: ${(0,common_1.fmt)(a.properties.weight,5)} kN/m nominal, case ${wc?.name || m.selfWeightCase}.`);
    heading('03  ACTIVE FACTORS & SUPPORT REACTIONS');
    add('User-defined factors, not prescribed design-code combinations.');
    add(m.cases.map(c => c.name+': '+(c.enabled?(0,common_1.fmt)(c.factor,3):'OFF')).join(' / '));
    for (const r of a.reactions) add(`${r.label} at ${(0,common_1.fmt)(r.x,3)} m: Ry ${(0,common_1.fmt)(r.force,5)} kN upward; couple ${(0,common_1.fmt)(r.moment,5)} kN m CCW.`);
    heading('04  MODEL ACTIONS (NOMINAL INPUTS)');
    for (const i of m.items) {
        if (['pin','roller','fixed'].includes(i.kind)) continue;
        const c=m.cases.find(c=>c.id===i.caseId);
        add(`${i.label}: ${i.kind}, x=${(0,common_1.fmt)(i.x,3)}${i.end!==undefined?' to '+(0,common_1.fmt)(i.end,3):''} m${['point','udl','variable','moment'].includes(i.kind)?'; '+(0,common_1.fmt)(i.value,3)+(i.kind==='variable'?' to '+(0,common_1.fmt)(i.endValue,3):'')+' '+(i.kind==='point'?'kN':i.kind==='moment'?'kN m':'kN/m'):''}${c?'; '+c.name:''}.`);
    }
    heading('05  CONSISTENCY & SCOPE');
    add(`Force residual ${a.forceResidual.toExponential(2)} kN; moment residual ${a.momentResidual.toExponential(2)} kN m; hinge residual ${a.hingeResidual.toExponential(2)} kN m.`,9);
    add(`Support residual ${a.boundaryResidual.toExponential(2)} m; element compatibility ${a.endCompatibilityResidual.toExponential(2)} m.`,9);
    add('Euler-Bernoulli small-deflection bending with optional true piecewise section properties and optional EI-only multipliers. True stepped regions use their local E/I/A/depth/density; abrupt transition stress concentrations are not modelled. EI-only overrides do not infer local stress or section capacity. No axial, shear-deformation, settlement, stability, concrete-cracking or code-capacity checks. Negative bearing reactions require hold-down restraint. Residuals do not certify real structural safety.',9);
    for (const w of a.warnings) add(w,9);
    if (m.section.catalogue || (m.sectionRegions || []).some(r=>r.section?.catalogue)) add('Catalogue geometry used in the base and/or local regions: Liberty / InfraBuild HRSSP, 9th edition, Oct 2019, Tables 9/11/15. Historical starter subset. PFC torsion excluded.',9);
    finish();
    // Group aligned figures, not a tiny chart on an otherwise empty page.
    const svgWidth=800, ns='http://www.w3.org/2000/svg';
    const images=exportedSvgs(m,a,v,svgWidth);
    const batches=[]; let group=[],height=0;
    for (const svg of images) {
        const h=Number(svg.getAttribute('viewBox').split(' ')[3])+48;
        if (group.length && height+h>990) { batches.push(group);group=[];height=0; }
        group.push(svg);height+=h;
    }
    if (group.length) batches.push(group);
    for (const batch of batches) {
        const outer=document.createElementNS(ns,'svg');outer.setAttribute('xmlns',ns);
        outer.setAttribute('width',String(svgWidth));outer.setAttribute('font-family','Arial, sans-serif');
        const bg=document.createElementNS(ns,'rect');bg.setAttribute('width','100%');bg.setAttribute('height','100%');bg.setAttribute('fill','#0d1318');outer.append(bg);
        let at=18;
        for (const svg of batch) {
            const title=document.createElementNS(ns,'text');title.setAttribute('x','30');title.setAttribute('y',String(at+17));title.setAttribute('font-size','17');title.setAttribute('fill','#e3eeeb');title.textContent=svg.getAttribute('aria-label');outer.append(title);at+=38;
            const h=Number(svg.getAttribute('viewBox').split(' ')[3]);svg.setAttribute('x','0');svg.setAttribute('y',String(at));svg.setAttribute('width',String(svgWidth));svg.setAttribute('height',String(h));
            svg.querySelectorAll('text').forEach(t=>{const n=Number(t.getAttribute('font-size'));if(n)t.setAttribute('font-size',String(n*1.1));});
            outer.append(svg);at+=h+10;
        }
        outer.setAttribute('height',String(at));outer.setAttribute('viewBox',`0 0 ${svgWidth} ${at}`);
        const canvas=await raster(new XMLSerializer().serializeToString(outer),2);
        const encoded=canvas.toDataURL('image/jpeg',.97).split(',')[1];
        const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
        const displayHeight=Math.min(655,511*at/svgWidth),displayWidth=displayHeight*svgWidth/at;
        cmd=line('ANNOTATED ANALYSIS DIAGRAMS',793,17,true)+line('Full member / active case factors / signed internal actions',771,10);
        cmd+=`q ${displayWidth} 0 0 ${displayHeight} 42 ${749-displayHeight} cm /Im1 Do Q\n`;
        cmd+=line('Deformation is exaggerated. Nominal load labels; current factored results. No comparison overlay.',66,8);
        pdf.page(cmd+footer(),{bytes,width:canvas.width,height:canvas.height});
    }
    return pdf.finish();
}
