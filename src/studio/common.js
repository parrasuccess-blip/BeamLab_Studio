"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unit = exports.clamp = exports.signed = exports.fmt = exports.esc = void 0;
exports.button = button;
exports.field = field;
exports.toggle = toggle;
exports.icon = icon;
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
exports.esc = esc;
const fmt = (n, d = 2) => Number.isFinite(n) ? (Math.abs(n) < 0.5 * 10 ** -d ? 0 : n).toFixed(d) : '--';
exports.fmt = fmt;
const signed = (n, d = 2) => `${n > 0.5 * 10 ** -d ? '+' : ''}${(0, exports.fmt)(n, d)}`;
exports.signed = signed;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
exports.clamp = clamp;
const unit = (s) => s.replace('kN m', 'kN\u00b7m').replace('mm4', 'mm\u2074').replace('mm2', 'mm\u00b2');
exports.unit = unit;
function button(action, label, cls = '', disabled = false, title = '') { return `<button type="button" data-action="${(0, exports.esc)(action)}" class="${cls}" ${disabled ? 'disabled' : ''} ${title ? `title="${(0, exports.esc)(title)}"` : ''}>${label}</button>`; }
function field(key, label, value, units = '', min = -100000, max = 100000, step = 'any') {
    return `<label class="field"><span>${(0, exports.esc)(label)}</span><div><input data-field="${key}" aria-label="${(0, exports.esc)(label)}" type="number" min="${min}" max="${max}" step="${step}" value="${value === null ? '' : Number(value.toPrecision(10))}"><small>${(0, exports.esc)(units)}</small></div><em class="field-error"></em></label>`;
}
function toggle(key, label, hint, value) {
    return `<button type="button" data-action="${key}" class="toggle-row" role="switch" aria-checked="${value}" aria-label="${(0, exports.esc)(label)}"><span><b>${(0, exports.esc)(label)}</b><small>${(0, exports.esc)(hint)}</small></span><i class="switch ${value ? 'on' : ''}"><u></u></i></button>`;
}
function icon(name, size = 18) {
    const paths = {
        undo: '<path d="M8 5 3 10l5 5M3 10h10a7 7 0 0 1 0 14"/>',
        redo: '<path d="m16 5 5 5-5 5m5-5h-10a7 7 0 0 0 0 14"/>',
        down: '<path d="m6 9 6 6 6-6"/>',
        right: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
        expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
        download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
        close: '<path d="m6 6 12 12M6 18 18 6"/>',
        lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
        unlock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0"/>',
        layers: '<path d="m3 8 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 18l9 5 9-5"/>',
        settings: '<path d="M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6"/>',
        share: '<circle cx="18" cy="5" r="3"/><circle cx="5" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8 10 7-4M8 14l7 4"/>',
        compare: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/>',
        copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
        trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
        help: '<circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 1 1 4 3c-1 1-1 2-1 3m0 3h.01"/>',
        eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
        check: '<path d="m5 12 4 4 10-10"/>',
        menu: '<path d="M4 5h16M4 12h16M4 19h16"/>',
        plus: '<path d="M12 4v16M4 12h16"/>',
        star: '<path d="m12 3 2 6 7 3-7 2-2 7-2-7-7-2 7-3 2-6Z"/>'
    };
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.settings}</svg>`;
}
