'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const order = JSON.parse(fs.readFileSync(path.join(root, 'module-order.json'), 'utf8'));
const styles = ['styles.css','workspace.css'].map(file=>fs.readFileSync(path.join(root,'src',file),'utf8')).join('\n');
const tutorClient = fs.readFileSync(path.join(root, 'src/browser/tutor-client.js'), 'utf8');
const readability = fs.readFileSync(path.join(root, 'src/browser/readability.js'), 'utf8');

const moduleRegistry = order.map(name => {
  const code = fs.readFileSync(path.join(root, 'src', name + '.js'), 'utf8').trimEnd();
  return `${JSON.stringify(name)}: function(module,exports,require) {\n${code}\n}`;
}).join(',\n');

const loader = `const cache = {};\nfunction load(id) {\n  if (cache[id]) return cache[id].exports;\n  if (!modules[id]) throw new Error('Missing module: ' + id);\n  const module = cache[id] = { exports: {} };\n  const relative = (name) => {\n    const parts = id.split('/'); parts.pop();\n    for (const p of name.split('/')) { if(p === '..') parts.pop(); else if(p !== '.') parts.push(p); }\n    return load(parts.join('/'));\n  };\n  modules[id](module, module.exports, relative); return module.exports;\n}\nload('studio/app');`;

const html = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<meta name="description" content="BeamLab Studio: interactive structural intuition, transparent calculations and annotated engineering diagrams.">\n<title>BeamLab Studio 4.1 - Guided Engineering Studio</title>\n<style>\n${styles}</style>\n</head>\n<body>\n<div id="app"></div>\n<noscript>BeamLab requires JavaScript for interactive analysis.</noscript>\n<script>\n(() => {\n'use strict';\nconst modules = {\n${moduleRegistry}\n};\n${loader}\n})();\n</script>\n<script>\n${tutorClient}</script>\n<script>\n${readability}</script>\n</body>\n</html>\n`;

const outDir = path.join(root, 'dist');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html);
const hash = crypto.createHash('sha256').update(html).digest('hex');
fs.writeFileSync(path.join(outDir, 'SHA256.txt'), hash + '\n');
fs.writeFileSync(path.join(outDir, 'release.json'), JSON.stringify({version:require('../package.json').version,artifact:'index.html',sha256:hash},null,2)+'\n');
console.log(`Built BeamLab: ${Buffer.byteLength(html)} bytes`);
console.log(`SHA-256 ${hash}`);
