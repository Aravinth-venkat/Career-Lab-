// Builds the extra data files the website reads: insights.json (fresher / urgent / walk-in counts, skills in demand),
// hiring.json (companies hiring now, new ones), and health.json (run history, per-board failures, alert flag).
// Pure functions: no network. General information only.
import { classify } from './tags.mjs';
const DAY = 864e5;
export const normCity = l => { const s = String(l || '').toLowerCase(); if (/bengaluru|bangalore|hosur road/.test(s)) return 'Bengaluru'; if (/gurugram|gurgaon/.test(s)) return 'Gurugram'; if (/mumbai|bombay|navi mumbai|thane/.test(s)) return 'Mumbai'; if (/delhi|ncr/.test(s)) return 'Delhi NCR'; if (/noida|ghaziabad/.test(s)) return 'Noida'; if (/hyderabad|secunderabad/.test(s)) return 'Hyderabad'; if (/chennai/.test(s)) return 'Chennai'; if (/pune/.test(s)) return 'Pune'; if (/kolkata/.test(s)) return 'Kolkata'; if (/remote/.test(s)) return 'Remote'; const f = s.split(/[,;/|-]/)[0].trim(); return /^india$/.test(f) || !f ? '' : f.replace(/\b\w/g, x => x.toUpperCase()); };
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const skillRe = n => new RegExp('(^|[^a-z0-9+#.])' + esc(n.toLowerCase()) + '(?![a-z0-9+#])', 'i');

export function buildInsights(jobs, skills, now) {
  const open = jobs.filter(j => !j.x), w7 = open.filter(j => now - (j.p || j.s) <= 7 * DAY), w14 = open.filter(j => now - (j.p || j.s) <= 14 * DAY);
  const cls = open.map(j => [j, classify(j)]);
  const tally = (list, f) => list.filter(f).length;
  const skillCount = {}; const res = skills.map(s => [s, skillRe(s)]);
  for (const j of w14) { const txt = (j.t || '') + ' ' + (j.d || ''); for (const [s, r] of res) if (r.test(txt)) skillCount[s] = (skillCount[s] || 0) + 1; }
  const top = (m, n) => Object.entries(m).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
  const cityCount = {}; for (const j of w14) { const c = normCity(j.l); if (c) cityCount[c] = (cityCount[c] || 0) + 1; }
  const fresherList = cls.filter(([j, c]) => c.fresher && now - (j.p || j.s) <= 30 * DAY).length;
  return { updated: now, open: open.length, new7: w7.length, fresher: fresherList, urgent: tally(cls.map(x => x[1]), c => c.urgent), walkin: tally(cls.map(x => x[1]), c => c.walkin), skills: top(skillCount, 12), cities: top(cityCount, 8), companies: new Set(open.map(j => j.c)).size };
}

export function buildHiring(jobs, firstSeen, now) {
  const m = new Map();
  for (const j of jobs) { if (j.x) continue; const e = m.get(j.c) || { c: j.c, n: 0, new7: 0, cities: {} }; e.n++; if (now - (j.p || j.s) <= 7 * DAY) e.new7++; const city = normCity(j.l); if (city) e.cities[city] = (e.cities[city] || 0) + 1; m.set(j.c, e); }
  return [...m.values()].map(e => ({ c: e.c, n: e.n, new7: e.new7, cities: Object.entries(e.cities).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]), isNew: !!(firstSeen[e.c] && now - firstSeen[e.c] <= 14 * DAY), first: firstSeen[e.c] || 0 })).sort((a, b) => (b.isNew - a.isNew) || b.new7 - a.new7 || b.n - a.n || a.c.localeCompare(b.c)).slice(0, 400);
}

// firstSeen: company -> time we first saw a board for it. On the very first run existing companies get 0 (known from before).
export function updateFirstSeen(prev, boards, now, firstRun) {
  const out = Object.assign({}, prev);
  for (const c of new Set(Object.values(boards))) if (!(c in out)) out[c] = firstRun ? 0 : now;
  return out;
}

// only 404 and 410 mean "this board is gone". Timeouts, 429 and 5xx are temporary and never count.
export const isGone = status => status === 404 || status === 410;

export function updateBoardHealth(prev, results, now) {
  const out = Object.assign({}, prev);
  for (const [key, r] of Object.entries(results)) {
    const o = out[key] || { fail: 0, ok: 0, last: 0 };
    if (r.ok) out[key] = { fail: 0, ok: now, last: now, status: 200 };
    else if (isGone(r.status)) out[key] = { fail: o.fail + 1, ok: o.ok || 0, last: now, status: r.status };
    else out[key] = Object.assign({}, o, { last: now, status: r.status });
  }
  return out;
}

// Which boards to fetch this run. Boards that keep returning "gone" are tried only every 6th run; manual boards always run.
export function shouldFetch(key, health, runNo, manual) {
  if (manual && key in manual) return true;
  const h = health[key]; if (!h || h.fail < 12) return true;
  return runNo % 6 === 0;
}
export const shouldDrop = (key, health, manual) => !(manual && key in manual) && health[key] && health[key].fail >= 100;

export function runVerdict(prevRuns, now, cur) {
  const last = prevRuns[prevRuns.length - 1];
  const issues = [];
  if (cur.boards && cur.boardsOk / cur.boards < 0.7) issues.push(`only ${cur.boardsOk} of ${cur.boards} company boards loaded`);
  if (last && last.open >= 50 && cur.open < last.open * 0.6) issues.push(`open jobs fell from ${last.open} to ${cur.open}`);
  if (cur.fetched === 0 && cur.boards > 0) issues.push('no jobs were returned by any board');
  return issues;
}

export function updateHealth(prev, cur, boardResults, now) {
  const runs = (prev.runs || []).slice(-59);
  const issues = runVerdict(runs, now, cur);
  const streak = issues.length ? (prev.streak || 0) + 1 : 0;
  runs.push({ t: now, open: cur.open, boards: cur.boards, boardsOk: cur.boardsOk, failed: cur.failed, issues });
  const boards = updateBoardHealth(prev.boards || {}, boardResults, now);
  const stale = Object.entries(boards).filter(([, b]) => b.fail >= 3).map(([k, b]) => k + ' (' + b.fail + ' not-found runs)').slice(0, 30);
  return { updated: now, runNo: (prev.runNo || 0) + 1, streak, alert: streak >= 2 ? { since: runs[runs.length - 1 - (streak - 1)].t, issues } : null, runs, boards, stale };
}
