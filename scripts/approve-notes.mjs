// Reads the ticked boxes from the GitHub issue body (env ISSUE_BODY) and rebuilds data/notes.json.
// Only ids that already exist in pending.json or notes.json are accepted, so nobody can add text through the issue.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.JOBS_ROOT || path.join(HERE, '..'), DATA = path.join(ROOT, 'data');
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch { return d; } };
export function approve(body, pending, notes, now, max = 30) {
  const ticked = [], unticked = new Set();
  for (const m of String(body).matchAll(/^- \[( |x|X)\] `([a-z0-9]+)`/gm)) { if (m[1] === ' ') unticked.add(m[2]); else ticked.push(m[2]); }
  const by = new Map([...pending, ...notes].map(x => [x.id, x]));
  const out = [];
  for (const id of ticked) { const x = by.get(id); if (x && !out.find(o => o.id === id)) out.push(Object.assign({}, x, { ok: (notes.find(n => n.id === id) || {}).ok || now })); }
  // notes not mentioned in the issue stay as they are; unticked ones are removed
  for (const n of notes) if (!out.find(o => o.id === n.id) && !unticked.has(n.id) && !ticked.includes(n.id)) out.push(n);
  out.sort((a, b) => b.t - a.t);
  return out.slice(0, max);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const now = Date.now(), pending = readJson('pending.json', { list: [] }).list || [], notes = readJson('notes.json', { list: [] }).list || [];
  const list = approve(process.env.ISSUE_BODY || '', pending, notes, now);
  fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(path.join(DATA, 'notes.json'), JSON.stringify({ updated: now, list }));
  const left = pending.filter(x => !list.find(n => n.id === x.id));
  fs.writeFileSync(path.join(DATA, 'pending.json'), JSON.stringify({ updated: now, list: left }));
  console.log('notes shown:', list.length);
}
