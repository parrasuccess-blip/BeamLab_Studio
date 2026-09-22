"use strict";
// Presentation geometry only. Never alters solver samples or model coordinates.
exports.textWidth = textWidth;
exports.wrapText = wrapText;
exports.labelBox = labelBox;
exports.overlaps = overlaps;
exports.placeCallouts = placeCallouts;
exports.stackLabels = stackLabels;

// Annotation text explicitly uses monospace in both the app and SVG exports.
// Allow a full em for non-Latin glyphs and a small safety margin for fallback fonts.
function textWidth(text, size = 10) {
    return Array.from(String(text)).reduce((w, c) => w + size * (c.codePointAt(0) > 0x2fff ? 1.05 : .65), 0);
}
function wrapText(text, width, size = 10) {
    const lines = []; let line = '';
    for (const word of String(text).split(/\s+/u)) {
        if (line && textWidth(line + ' ' + word, size) <= width) { line += ' ' + word; continue; }
        if (line) lines.push(line);
        line = '';
        for (const c of Array.from(word)) {
            if (line && textWidth(line + c, size) > width) { lines.push(line); line = ''; }
            line += c;
        }
    }
    if (line || !lines.length) lines.push(line);
    return lines;
}
function labelBox(lines, maxWidth, size = 10) {
    const wrapped = lines.flatMap(line => wrapText(line.text, maxWidth - 16, line.size || size).map(text => ({...line, text, size: line.size || size})));
    return {lines: wrapped, width: Math.min(maxWidth, Math.max(48, ...wrapped.map(line => textWidth(line.text, line.size) + 16))), height: wrapped.length * 15 + 12};
}
function overlaps(a, b, gap = 6) {
    return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
}
const bounded = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Deterministic nearest free slot; overflow has its own rows, never silently drops a value.
function placeCallouts(labels, bounds) {
    const placed = [];
    for (const label of labels) {
        const {width, height} = label;
        const preferredY = label.above ? label.py - height - 9 : label.py + 9;
        const xs = [label.px - width / 2, bounds.left, bounds.right - width,
            ...placed.flatMap(b => [b.x - width - 8, b.x + b.width + 8])].map(x => bounded(x, bounds.left, bounds.right - width));
        const ys = [preferredY, label.above ? label.py + 9 : label.py - height - 9];
        for (let y = bounds.top; y <= bounds.bottom - height; y += 12) ys.push(y);
        const choices = [];
        for (const x of xs) for (const y of ys) {
            const box = {x, y, width, height};
            if (y < bounds.top || y + height > bounds.bottom || placed.some(b => overlaps(box, b))) continue;
            // Keep exact critical-point dots (including hinge zeros) off all text.
            if (labels.some(p => overlaps(box,{x:p.px-5,y:p.py-5,width:10,height:10},0))) continue;
            const cost = Math.abs(x + width / 2 - label.px) + 1.4 * Math.abs(y - preferredY);
            choices.push({...box, cost});
        }
        choices.sort((a, b) => a.cost - b.cost || a.y - b.y || a.x - b.x);
        let box = choices[0];
        if (!box) {
            let y = bounds.bottom + 36;
            box = {x: bounded(label.px - width / 2, bounds.left, bounds.right - width), y, width, height};
            while (placed.some(b => overlaps(box, b))) box.y += height + 8;
        }
        placed.push({...label, ...box});
    }
    return placed;
}

// Structure notes occupy separate rows below all symbols/reaction arrows.
function stackLabels(labels, width, top) {
    const placed = [];
    for (const label of [...labels].sort((a, b) => a.px - b.px)) {
        const box = {...label, x: bounded(label.px - label.width / 2, 12, width - 12 - label.width), y: top};
        while (placed.some(b => overlaps(box, b, 10))) {
            box.y = Math.max(...placed.filter(b => overlaps(box, b, 10)).map(b => b.y + b.height + 10));
        }
        placed.push(box);
    }
    return placed;
}
