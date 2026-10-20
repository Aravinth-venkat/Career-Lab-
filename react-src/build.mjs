// Builds one self-contained HTML file. Usage: node build.mjs <outdir> [embed]
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire('/opt/npm-tools/node_modules/'); const esbuild = require('esbuild');
const out = process.argv[2] || '/tmp/react-out', embed = process.argv[3] === 'embed'; fs.mkdirSync(out, { recursive: true });
const NODE = '/opt/npm-tools/node_modules';
const fixParts = { name: 'fixParts', setup(b) { b.onLoad({ filter: /content\.js$/ }, a => { let t = fs.readFileSync(a.path, 'utf8'); const L = t.split('\n'); const i = L.findIndex(l => l.startsWith('const PARTS =')); L[i] = 'const PARTS = [' + Array.from({ length: 20 }, (_, k) => 'require("./content-p' + (k + 1) + '.js")').join(',') + '];'; return { contents: L.join('\n'), loader: 'js', resolveDir: path.dirname(a.path) }; }); } };
const r = await esbuild.build({ plugins: [fixParts], entryPoints: ['src/app.jsx'], bundle: true, minify: true, write: false, outdir: out, format: 'iife', jsx: 'automatic', target: 'es2019', define: { 'process.env.NODE_ENV': '"production"', global: 'window' }, nodePaths: [NODE], loader: { '.css': 'css' }, banner: { js: 'window.global=window;' } });
let js = '', css = ''; for (const f of r.outputFiles) { if (f.path.endsWith('.js')) js = f.text; else css = f.text; }
let pre = '';
if (embed) {
  const jobs = JSON.parse(fs.readFileSync('/home/claude/career-lab-/data/jobs.json', 'utf8')).jobs.filter(j => !j.x).sort((a, b) => (b.p || b.s) - (a.p || a.s)).slice(0, 700).map(j => ({ id: j.id, c: j.c, t: j.t, l: j.l, u: j.u, a: j.a, p: j.p, s: j.s, sa: j.sa, d: String(j.d || '').slice(0, 400) }));
  pre = `window.__JOBS__=${JSON.stringify(jobs)};window.__SAL__=${fs.readFileSync('/home/claude/career-lab-/data/salary.json', 'utf8')};window.__BOOKS__=${fs.readFileSync('/home/claude/career-lab-/data/reading.json', 'utf8')};`;
}
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Padimachi React preview</title><style>${css}</style></head><body><div id="root"></div><script>${pre.replace(/<\/script>/g, '<\\/script>')}</script><script>${js.replace(/<\/script>/g, '<\\/script>')}</script></body></html>`;
fs.writeFileSync(path.join(out, 'index.html'), html); console.log('built', (html.length / 1e6).toFixed(2) + ' MB');
