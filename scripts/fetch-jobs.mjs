// Padimachi job openings updater. Runs on GitHub every 3 hours.
// Reads PUBLIC job boards (Greenhouse, Lever, Ashby) of companies in company-names.json.
// Keeps only India jobs, tracks when each job was first seen and when it stopped being listed.
// Never marks a job closed when its board failed to load. General information only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromGreenhouse, fromLever, fromAshby, fromText, buildSalary } from './salary.mjs';
import { verify } from './verify.mjs';
import { buildInsights, buildHiring, updateFirstSeen, updateHealth, shouldFetch, shouldDrop } from './insights.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.JOBS_ROOT || path.join(HERE, '..');
const DATA = path.join(ROOT, 'data');
const NOW = Date.now(), DAY = 864e5;
const UA = 'PadimachiJobsBot/1.0 (+https://padimachi.com)';
const MAX_JOBS = +process.env.MAX_JOBS || 5000, PROBE_PER_RUN = +process.env.PROBE_PER_RUN || 260, DESC = 500;
const INDIA = /india|bengaluru|bangalore|chennai|hyderabad|pune|mumbai|navi mumbai|thane|delhi|gurugram|gurgaon|noida|ghaziabad|kolkata|coimbatore|kochi|cochin|thiruvananthapuram|trivandrum|ahmedabad|jaipur|indore|chandigarh|mohali|nagpur|lucknow|bhubaneswar|visakhapatnam|vizag|mysuru|mysore|madurai|trichy|tiruchirappalli|vadodara|surat|remote.*(ind|apac)/i;

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch { return d; } };
const writeJson = (f, v) => { fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(path.join(DATA, f), JSON.stringify(v)); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const decode = s => String(s || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
export const plain = s => decode(decode(s)).replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, ' ').replace(/<\/(p|li|div|h\d|br)>|<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const safeUrl = u => { try { const x = new URL(String(u)); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };

async function get(url, opt = {}) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 25000);
  try { const r = await fetch(url, { method: opt.body ? 'POST' : 'GET', headers: Object.assign({ 'User-Agent': UA, Accept: 'application/json' }, opt.body ? { 'Content-Type': 'application/json' } : {}), body: opt.body ? JSON.stringify(opt.body) : undefined, signal: ctl.signal }); if (!r.ok) return { ok: false, status: r.status }; return { ok: true, json: await r.json() }; }
  catch (e) { return { ok: false, status: 0 }; } finally { clearTimeout(t); }
}

// provider adapters: return array of unified jobs or null when board failed / does not exist
export const PROV = {
  gh: {
    url: s => `https://boards-api.greenhouse.io/v1/boards/${s}/jobs?content=true&pay_transparency=true`,
    map: (j, s, co) => (j.jobs || []).map(x => ({ id: 'gh:' + s + ':' + x.id, c: co, t: x.title, l: (x.location && x.location.name) || '', u: safeUrl(x.absolute_url), p: Date.parse(x.first_published || x.updated_at) || 0, d: plain(x.content).slice(0, DESC), sa: fromGreenhouse(x) || fromText(plain(x.content)) })),
  },
  lv: {
    url: s => `https://api.lever.co/v0/postings/${s}?mode=json`,
    map: (j, s, co) => (Array.isArray(j) ? j : []).map(x => ({ id: 'lv:' + s + ':' + x.id, c: co, t: x.text, l: (x.categories && (x.categories.location || (x.categories.allLocations || []).join(', '))) || '', u: safeUrl(x.hostedUrl), a: safeUrl(x.applyUrl), p: +x.createdAt || 0, d: plain(x.descriptionPlain || x.description).slice(0, DESC), sa: fromLever(x) || fromText(x.descriptionPlain || plain(x.description)) })),
  },
  wk: {
    url: s => `https://apply.workable.com/api/v1/widget/accounts/${s}?details=true`,
    map: (j, s, co) => (j.jobs || []).map(x => ({ id: 'wk:' + s + ':' + (x.shortcode || x.code), c: co, t: x.title, l: [x.city, x.state, x.country].filter(Boolean).join(', '), u: safeUrl(x.url || x.shortlink), a: safeUrl(x.application_url), p: Date.parse(x.published_on || x.created_at) || 0, d: plain(x.description).slice(0, DESC) })),
  },
  rc: {
    url: s => `https://${s}.recruitee.com/api/offers/`,
    map: (j, s, co) => (j.offers || []).filter(x => !x.status || x.status === 'published').map(x => ({ id: 'rc:' + s + ':' + x.id, c: co, t: x.title, l: [x.city, x.country].filter(Boolean).join(', ') || x.location || '', u: safeUrl(x.careers_url), a: safeUrl(x.careers_apply_url), p: Date.parse(x.published_at || x.created_at) || 0, d: plain(x.description).slice(0, DESC) })),
  },
  sr: {
    url: s => `https://api.smartrecruiters.com/v1/companies/${s}/postings?limit=100&country=in`,
    map: (j, s, co) => (j.content || []).map(x => ({ id: 'sr:' + s + ':' + x.id, c: co, t: x.name, l: [x.location && x.location.city, x.location && x.location.region, 'India'].filter(Boolean).join(', '), u: safeUrl(`https://jobs.smartrecruiters.com/${s}/${x.id}`), p: Date.parse(x.releasedDate) || 0, d: '' })),
  },
  ab: {
    url: s => `https://api.ashbyhq.com/posting-api/job-board/${s}?includeCompensation=true`,
    map: (j, s, co) => (j.jobs || []).filter(x => x.isListed !== false).map(x => ({ id: 'ab:' + s + ':' + x.id, c: co, t: x.title, l: x.location || '', u: safeUrl(x.jobUrl), a: safeUrl(x.applyUrl), p: Date.parse(x.publishedAt) || 0, d: plain(x.descriptionPlain || x.descriptionHtml).slice(0, DESC), sa: fromAshby(x) || fromText(x.descriptionPlain || plain(x.descriptionHtml)) })),
  },
  wd: {
    // key is wd:tenant~dc~site, for example wd:adobe~wd5~external_experienced (the three parts of the company's Workday job page address)
    url: s => { const [t, dc, site] = s.split('~'); return `https://${t}.${dc}.myworkdayjobs.com/wday/cxs/${t}/${site}/jobs`; },
    load: async s => {
      const u = PROV.wd.url(s), all = [];
      for (let off = 0; off < 100; off += 20) {
        const r = await get(u, { body: { appliedFacets: {}, limit: 20, offset: off, searchText: 'India' } }); await sleep(100);
        if (!r.ok) { if (off === 0) return r; break; }
        const list = (r.json && r.json.jobPostings) || []; all.push(...list); if (list.length < 20) break;
      }
      return { ok: true, json: { jobPostings: all } };
    },
    map: (j, s, co) => { const [t, dc, site] = s.split('~'); return (j.jobPostings || []).filter(x => x.title && x.externalPath).map(x => ({ id: 'wd:' + s + ':' + String(x.externalPath).split('/').pop(), c: co, t: x.title, l: /^\d+\s+locations?$/i.test(x.locationsText || '') ? 'India' : (x.locationsText || ''), u: safeUrl(`https://${t}.${dc}.myworkdayjobs.com/${site}${x.externalPath}`), p: parsePosted(x.postedOn, Date.now()), d: '' })); },
  },
};

export const parsePosted = (txt, now) => { const t = String(txt || '').toLowerCase(); if (/today/.test(t)) return now; if (/yesterday/.test(t)) return now - DAY; const m = /(\d+)\+?\s*days?/.exec(t); return m ? now - (+m[1]) * DAY : 0; };
async function getPage(url) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 20000);
  try { const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PadimachiJobsBot/1.0; +https://padimachi.com)', Accept: 'text/html' }, redirect: 'follow', signal: ctl.signal }); const body = r.status === 200 ? (await r.text()).slice(0, 300000) : ''; return { status: r.status, body }; }
  catch (e) { return { status: 0, body: '' }; } finally { clearTimeout(t); }
}
const load = (p, s) => PROV[p].load ? PROV[p].load(s) : get(PROV[p].url(s));

// Many boards list jobs without text (SmartRecruiters, Workday). Fetch the text of a few open jobs per run so that matching can use it.
export const detailOf = j => {
  const [p, a, b] = String(j.id).split(':');
  if (p === 'sr') return { url: `https://api.smartrecruiters.com/v1/companies/${a}/postings/${b}`, text: x => { const sec = (x && x.jobAd && x.jobAd.sections) || {}; return ['jobDescription', 'qualifications'].map(k => sec[k] && sec[k].text).filter(Boolean).join(' '); } };
  if (p === 'wd') { const [t, dc, site] = a.split('~'), base = `https://${t}.${dc}.myworkdayjobs.com/${site}`; if (!String(j.u).startsWith(base)) return null; return { url: `https://${t}.${dc}.myworkdayjobs.com/wday/cxs/${t}/${site}${String(j.u).slice(base.length)}`, text: x => (x && x.jobPostingInfo && x.jobPostingInfo.jobDescription) || '' }; }
  return null;
};
export async function enrich(jobs, cap, getter = get) {
  let n = 0, done = 0;
  const todo = jobs.filter(j => !j.x && !j.d && detailOf(j)).sort((a, b) => b.p - a.p).slice(0, cap);
  await pool(todo, 4, async j => { const d = detailOf(j), r = await getter(d.url); n++; await sleep(80); if (!r.ok) { if (r.status === 404 || r.status === 410) { j.x = Date.now(); j.xv = 1; } return; } const txt = plain(d.text(r.json)).slice(0, 600); if (txt.length > 40) { j.d = txt; done++; } });
  return { tried: n, filled: done };
}

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

export async function probe(company, boards, hints = []) {
  for (const h of hints) { const [p, s] = h.split(':'); if (!PROV[p]) continue; const r = await load(p, s); await sleep(120); if (!r.ok) continue; const jobs = PROV[p].map(r.json, s, company); if (jobs.some(j => INDIA.test(j.l))) { boards[p + ':' + s] = company; return true; } }
  for (const s of slugs(company)) for (const p of ['gh', 'lv', 'ab', 'wk', 'rc', 'sr']) {
    const r = await load(p, s); await sleep(120);
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
    out.push({ id: j.id, c: j.c, t: j.t, l: j.l, u: j.u, a: j.a || '', p: j.p || (o && o.p) || now, s: (o && o.s) || now, x: o && o.xv ? o.x : 0, d: j.d || (o && o.d) || '', ...((j.sa || (o && o.sa)) ? { sa: j.sa || o.sa } : {}), ...(o && o.xv ? { xv: 1 } : {}), ...(o && o.v ? { v: o.v } : {}) });
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
  let names = JSON.parse(fs.readFileSync(path.join(HERE, 'company-names.json'), 'utf8'))
  try { names = [...names, ...JSON.parse(fs.readFileSync(path.join(HERE, 'company-extra.json'), 'utf8'))]; } catch {}
  const boards = readJson('boards.json', {}), manual = readJson('boards-manual.json', {}), miss = readJson('boards-miss.json', {});
  Object.assign(boards, manual);
  // discover boards for a rolling slice of companies that are not known and not recently missed
  const cand = (() => { try { return JSON.parse(fs.readFileSync(path.join(HERE, 'candidates.json'), 'utf8')); } catch { return {}; } })();
  const known = new Set(Object.values(boards).map(norm));
  const all = [...Object.keys(cand), ...names.filter(n => !(n in cand))];
  const todo = all.filter(n => !known.has(norm(n)) && !(miss[n] && NOW - miss[n] < 14 * DAY)).slice(0, PROBE_PER_RUN);
  let found = 0;
  await pool(todo, 4, async n => { if (await probe(n, boards, cand[n] || [])) found++; else miss[n] = NOW; });
  // fetch all known boards (boards that keep returning "not found" are retried only every 6th run; after about 6 days they are dropped)
  const health0 = readJson('health.json', {}), runNo = (health0.runNo || 0) + 1, hb = health0.boards || {};
  const dead = readJson('boards-dead.json', {});
  for (const k of Object.keys(boards)) if (shouldDrop(k, hb, manual)) { dead[k] = { company: boards[k], t: NOW }; miss[boards[k]] = NOW; delete boards[k]; }
  const expired = readJson('expired.json', {});
  const prev = (readJson('jobs.json', { jobs: [] }).jobs) || [], fetched = [], ok = new Set(), failed = [], results = {};
  await pool(Object.entries(boards).filter(([k]) => shouldFetch(k, hb, runNo, manual)), 6, async ([key, company]) => {
    const [p, s] = key.split(':'), r = await load(p, s); await sleep(100);
    results[key] = { ok: r.ok, status: r.status || 0 };
    if (!r.ok) { failed.push(key + ' ' + r.status); return; }
    ok.add(key); fetched.push(...PROV[p].map(r.json, s, company).filter(j => j.t && j.u && INDIA.test(j.l) && !expired[j.id]));
  });
  for (const k of Object.keys(boards)) if (!(k in results)) ok.add(k), results[k] = null; // skipped this run: keep its jobs as they are
  for (const k of Object.keys(results)) if (results[k] === null) delete results[k];
  const skipped = Object.keys(boards).filter(k => !(k in results));
  const jobs = merge(prev, fetched, new Set([...ok].filter(k => !skipped.includes(k))), NOW);
  const enr = await enrich(jobs, +process.env.ENRICH_PER_RUN || 120);
  const ver = process.env.NO_VERIFY ? { checked: 0, closed: [] } : await verify(jobs, { cap: +process.env.VERIFY_PER_RUN || 150, now: NOW, getPage });
  for (const j of jobs) if (j.xv && j.x) expired[j.id] = expired[j.id] || j.x;
  for (const k of Object.keys(expired)) if (NOW - expired[k] > 120 * DAY) delete expired[k];
  const open = jobs.filter(j => !j.x).length;
  let skills = []; try { skills = JSON.parse(fs.readFileSync(path.join(HERE, 'skills.json'), 'utf8')); } catch {}
  const firstRun = !fs.existsSync(path.join(DATA, 'first-seen.json'));
  const firstSeen = updateFirstSeen(readJson('first-seen.json', {}), boards, NOW, firstRun);
  writeJson('jobs.json', { updated: NOW, jobs }); writeJson('expired.json', expired); writeJson('salary.json', buildSalary(jobs, NOW));
  writeJson('boards.json', boards); writeJson('boards-miss.json', miss); writeJson('boards-dead.json', dead); writeJson('first-seen.json', firstSeen);
  writeJson('insights.json', buildInsights(jobs, skills, NOW)); writeJson('hiring.json', { updated: NOW, list: buildHiring(jobs, firstSeen, NOW) });
  const cur = { open, boards: Object.keys(results).length, boardsOk: Object.values(results).filter(r => r.ok).length, failed: failed.slice(0, 20), fetched: fetched.length };
  const health = updateHealth(health0, cur, results, NOW); writeJson('health.json', health);
  writeJson('status.json', { updated: NOW, boards: Object.keys(boards).length, boardsOk: cur.boardsOk, skipped: skipped.length, failed: failed.slice(0, 60), discovered: found, described: enr.filled, verified: ver.checked, expiredNow: ver.closed.length, withoutText: jobs.filter(j => !j.x && !j.d).length, probed: todo.length, open, closed: jobs.length - open, alert: health.alert });
  console.log(`boards ${cur.boardsOk}/${Object.keys(boards).length}, discovered ${found}/${todo.length}, jobs open ${open}, closed ${jobs.length - open}, failed ${failed.length}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e); process.exit(1); });
