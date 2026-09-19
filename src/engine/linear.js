"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solveSPD = solveSPD;
exports.poly = poly;
exports.roots01 = roots01;
/** Diagonally equilibrated Cholesky. Mechanisms are errors, never regularised. */
function solveSPD(A, b) {
    const n = b.length;
    if (!n)
        return [];
    const scale = A.map((r, i) => Math.sqrt(r[i]));
    if (scale.some(x => !Number.isFinite(x) || x <= 0))
        throw new Error('Unrestrained degree of freedom. Check supports and hinges.');
    const L = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            let sum = A[i][j] / (scale[i] * scale[j]);
            for (let k = 0; k < j; k++)
                sum -= L[i][k] * L[j][k];
            if (i === j) {
                if (sum < 1e-11)
                    throw new Error('This model is unstable or numerically ill-conditioned. Check hinge positions and support spacing.');
                L[i][j] = Math.sqrt(sum);
            }
            else
                L[i][j] = sum / L[j][j];
        }
    }
    const y = Array(n).fill(0), z = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        let v = b[i] / scale[i];
        for (let j = 0; j < i; j++)
            v -= L[i][j] * y[j];
        y[i] = v / L[i][i];
    }
    for (let i = n - 1; i >= 0; i--) {
        let v = y[i];
        for (let j = i + 1; j < n; j++)
            v -= L[j][i] * z[j];
        z[i] = v / L[i][i];
    }
    return z.map((v, i) => v / scale[i]);
}
function poly(c, x) {
    let y = 0;
    for (let i = c.length - 1; i >= 0; i--)
        y = y * x + c[i];
    return y;
}
/** All real roots in [0,1], including tangencies, for degree <= 4. */
function roots01(coefficients) {
    const max = Math.max(...coefficients.map(Math.abs), 1e-300);
    const c = coefficients.map(v => v / max);
    while (c.length > 1 && Math.abs(c[c.length - 1]) < 1e-14)
        c.pop();
    if (c.length < 2)
        return [];
    if (c.length === 2) {
        const x = -c[0] / c[1];
        return x >= 0 && x <= 1 ? [x] : [];
    }
    const critical = roots01(c.slice(1).map((v, i) => v * (i + 1)));
    const bounds = [0, ...critical.filter(x => x > 0 && x < 1), 1];
    const result = bounds.filter(x => Math.abs(poly(c, x)) < 1e-12);
    for (let i = 0; i < bounds.length - 1; i++) {
        let a = bounds[i], b = bounds[i + 1], fa = poly(c, a);
        if (fa * poly(c, b) >= 0)
            continue;
        for (let j = 0; j < 55; j++) {
            const m = (a + b) / 2, fm = poly(c, m);
            if (fa * fm <= 0)
                b = m;
            else {
                a = m;
                fa = fm;
            }
        }
        result.push((a + b) / 2);
    }
    return result.sort((a, b) => a - b).filter((x, i, arr) => !i || x - arr[i - 1] > 1e-9);
}
