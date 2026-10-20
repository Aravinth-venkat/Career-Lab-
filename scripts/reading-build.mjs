// Weekly: builds data/reading.json for the Reading page from books.json.
// Book entries are kept as they are (title, author, why). Free links are opened; a link that fails is hidden until it works again.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.JOBS_ROOT || path.join(HERE, '..'), DATA = path.join(ROOT, 'data');
const UA = 'PadimachiReadingBot/1.0 (+https://padimachi.com)';
export function validate(src) {
  const bad = [], ids = src && src.tracks ? Object.keys(src.tracks) : [];
  if (!ids.length) bad.push('books.json has no tracks.');
  for (const id of ids) for (const x of src.tracks[id]) {
    if (!x.t || !x.a || !x.why) bad.push(`${id}: an entry has no title, author or reason.`);
    if (x.k === 'free' && !/^https:\/\//.test(x.u || '')) bad.push(`${id}: "${x.t}" needs an https link.`);
    if (x.k !== 'free' && x.k !== 'book') bad.push(`${id}: "${x.t}" has an unknown kind.`);
  }
  return bad;
}
export async function build({ src, prev = {}, f = fetch, now = Date.now() } = {}) {
  const bad = validate(src); if (bad.length) return { bad };
  const tracks = {}, dead = [];
  for (const [id, list] of Object.entries(src.tracks)) {
    tracks[id] = [];
    for (const x of list) {
      if (x.k === 'free') {
        let ok = false; try { const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 15000); const r = await f(x.u, { headers: { 'User-Agent': UA }, signal: ctl.signal }); clearTimeout(t); ok = r.status < 400 || r.status === 403 || r.status === 429; } catch { ok = false; }
        const was = prev[x.u]; if (!ok && was === false) { dead.push(x.u); continue; }
        if (!ok) { tracks[id].push({ ...x, shaky: true }); continue; }
      }
      tracks[id].push(x);
    }
  }
  const state = {}; return { out: { updated: now, tracks }, dead, bad: [] };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const src = JSON.parse(fs.readFileSync(path.join(HERE, 'books.json'), 'utf8'));
  let prevFile = {}; try { prevFile = JSON.parse(fs.readFileSync(path.join(DATA, 'reading-health.json'), 'utf8')); } catch {}
  const r = await build({ src, prev: prevFile });
  if (r.bad.length) { r.bad.forEach(b => console.log(b)); process.exit(1); }
  const health = {}; for (const list of Object.values(r.out.tracks)) for (const x of list) if (x.k === 'free') health[x.u] = !x.shaky;
  for (const u of r.dead) health[u] = false;
  fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(path.join(DATA, 'reading.json'), JSON.stringify(r.out)); fs.writeFileSync(path.join(DATA, 'reading-health.json'), JSON.stringify(health));
  console.log(JSON.stringify({ tracks: Object.keys(r.out.tracks).length, items: Object.values(r.out.tracks).reduce((a, l) => a + l.length, 0), hidden: r.dead.length }));
}
