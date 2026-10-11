// Padimachi job openings updater. Runs on GitHub every 3 hours.
// Reads PUBLIC job boards (Greenhouse, Lever, Ashby) of companies in company-names.json.
// Keeps only India jobs, tracks when each job was first seen and when it stopped being listed.
// Never marks a job closed when its board failed to load. General information only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.JOBS_ROOT || path.join(HERE, '..');
const DATA = path.join(ROOT, 'data');
const NOW = Date.now(), DAY = 864e5;
const UA = 'PadimachiJobsBot/1.0 (+https://padimachi.com)';
const MAX_JOBS = +process.env.MAX_JOBS || 5000, PROBE_PER_RUN = +process.env.PROBE_PER_RUN || 120, DESC = 500;
const INDIA = /india|bengaluru|bangalore|chennai|hyderabad|pune|mumbai|navi mumbai|thane|delhi|gurugram|gurgaon|noida|ghaziabad|kolkata|coimbatore|kochi|cochin|thiruvananthapuram|trivandrum|ahmedabad|jaipur|indore|chandigarh|mohali|nagpur|lucknow|bhubaneswar|visakhapatnam|vizag|mysuru|mysore|madurai|trichy|tiruchirappalli|vadodara|surat|remote.*(ind|apac)/i;

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch { return d; } };
const writeJson = (f, v) => { fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(path.join(DATA, f), JSON.stringify(v)); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const decode = s => String(s || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
export const plain = s => decode(decode(s)).replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, ' ').replace(/<\/(p|li|div|h\d|br)>|<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const safeUrl = u => { try { const x = new URL(String(u)); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };

async function get(url) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 25000);
  try { const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: ctl.signal }); if (!r.ok) return { ok: false, status: r.status }; return { ok: true, json: await r.json() }; }
  catch (e) { return { ok: false, status: 0 }; } finally { clearTimeout(t); }
}

// provider adapters: return array of unified jobs or null when board failed / does not exist
export const PROV = {
  gh: {
    url: s => `https://boards-api.greenhouse.io/v1/boards/${s}/jobs?content=true`,
    map: (j, s, co) => (j.jobs || []).map(x => ({ id: 'gh:' + s + ':' + x.id, c: co, t: x.title, l: (x.location && x.location.name) || '', u: safeUrl(x.absolute_url), p: Date.parse(x.first_published || x.updated_at) || 0, d: plain(x.content).slice(0, DESC) })),
  },
  lv: {
    url: s => `https://api.lever.co/v0/postings/${s}?mode=json`,
    map: (j, s, co) => (Array.isArray(j) ? j : []).map(x => ({ id: 'lv:' + s + ':' + x.id, c: co, t: x.text, l: (x.categories && (x.categories.location || (x.categories.allLocations || []).join(', '))) || '', u: safeUrl(x.hostedUrl), a: safeUrl(x.applyUrl), p: +x.createdAt || 0, d: plain(x.descriptionPlain || x.description).slice(0, DESC) })),
  },
  ab: {
    url: s => `https://api.ashbyhq.com/posting-api/job-board/${s}`,
    map: (j, s, co) => (j.jobs || []).filter(x => x.isListed !== false).map(x => ({ id: 'ab:' + s + ':' + x.id, c: co, t: x.title, l: x.location || '', u: safeUrl(x.jobUrl), a: safeUrl(x.applyUrl), p: Date.parse(x.publishedAt) || 0, d: plain(x.descriptionPlain || x.descriptionHtml).slice(0, DESC) })),
  },
};

export const slugs = name => {
  const base = String(name).toLowerCase().replace(/\(.*?\)/g, ' ').replace(/&/g, ' and ').replace(/['’.]/g, '');
  const words = base.split(/[^a-z0-9]+/).filter(Boolean);
  const drop = new Set(['india', 'limited', 'ltd', 'pvt', 'private', 'technologies', 'technology', 'systems', 'solutions', 'services', 'group', 'bank', 'the', 'and']);
  const core = words.filter(w => !drop.has(w));
  const out = new Set([core.join(''), words.join(''), core.join('-'), words.join('-')]);
  return [...out].filter(x => x && x.length >= 3 && x.length <= 40).slice(0, 3);
};
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

async function pool(items, n, fn) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } })); }

export async function probe(company, boards) {
  for (const s of slugs(company)) for (const p of ['gh', 'lv', 'ab']) {
    const r = await get(PROV[p].url(s)); await sleep(120);
    if (!r.ok) continue;
    const jobs = PROV[p].map(r.json, s, company);
    if (!jobs.length || !jobs.some(j => INDIA.test(j.l))) continue;
    if (p === 'gh') { const nm = await get(`https://boards-api.greenhouse.io/v1/boards/${s}`); if (nm.ok && nm.json && nm.json.name) { const a = norm(nm.json.name), b = norm(company); if (!a.includes(b.slice(0, 5)) && !b.includes(a.slice(0, 5))) continue; } }
    boards[p + ':' + s] = company; return true;
  }
  return false;
}

export function merge(prev, fetched, okBoards, now) {
  const byId = new Map(prev.map(j => [j.id, j])), seen = new Set(), out = [];
  for (const j of fetched) {
    seen.add(j.id); const o = byId.get(j.id);
    out.push({ id: j.id, c: j.c, t: j.t, l: j.l, u: j.u, a: j.a || '', p: j.p || (o && o.p) || now, s: (o && o.s) || now, x: 0, d: j.d || (o && o.d) || '' });
  }
  for (const o of prev) {
    if (seen.has(o.id)) continue;
    const board = o.id.split(':').slice(0, 2).join(':');
    if (!okBoards.has(board)) { out.push(o); continue; }             // board failed today: keep status unchanged
    if (o.x) { if (now - o.x <= 7 * DAY) out.push(o); continue; }    // closed jobs stay 7 days
    out.push(Object.assign({}, o, { x: now }));
  }
  const keep = out.filter(j => j.x ? now - j.x <= 7 * DAY : now - (j.p || j.s) <= 120 * DAY);
  keep.sort((a, b) => (a.x ? 1 : 0) - (b.x ? 1 : 0) || b.p - a.p);
  return keep.slice(0, MAX_JOBS);
}

export async function main() {
  const names = JSON.parse(fs.readFileSync(path.join(HERE, 'company-names.json'), 'utf8'));
  const boards = readJson('boards.json', {}), manual = readJson('boards-manual.json', {}), miss = readJson('boards-miss.json', {});
  Object.assign(boards, manual);
  // discover boards for a rolling slice of companies that are not known and not recently missed
  const known = new Set(Object.values(boards).map(norm));
  const todo = names.filter(n => !known.has(norm(n)) && !(miss[n] && NOW - miss[n] < 14 * DAY)).slice(0, PROBE_PER_RUN);
  let found = 0;
  await pool(todo, 4, async n => { if (await probe(n, boards)) found++; else miss[n] = NOW; });
  // fetch all known boards
  const prev = (readJson('jobs.json', { jobs: [] }).jobs) || [], fetched = [], ok = new Set(), failed = [];
  await pool(Object.entries(boards), 6, async ([key, company]) => {
    const [p, s] = key.split(':'), r = await get(PROV[p].url(s)); await sleep(100);
    if (!r.ok) { failed.push(key + ' ' + r.status); return; }
    ok.add(key); fetched.push(...PROV[p].map(r.json, s, company).filter(j => j.t && j.u && INDIA.test(j.l)));
  });
  const jobs = merge(prev, fetched, ok, NOW);
  const open = jobs.filter(j => !j.x).length;
  writeJson('jobs.json', { updated: NOW, jobs });
  writeJson('boards.json', boards); writeJson('boards-miss.json', miss);
  writeJson('status.json', { updated: NOW, boards: Object.keys(boards).length, boardsOk: ok.size, failed: failed.slice(0, 60), discovered: found, probed: todo.length, open, closed: jobs.length - open });
  console.log(`boards ${ok.size}/${Object.keys(boards).length}, discovered ${found}/${todo.length}, jobs open ${open}, closed ${jobs.length - open}, failed ${failed.length}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e); process.exit(1); });
