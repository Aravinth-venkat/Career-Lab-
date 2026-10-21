// Extra job feed: Adzuna's free API (India). Runs only when ADZUNA_APP_ID and ADZUNA_APP_KEY are set as GitHub secrets.
// Writes data/ext-jobs.json (kept apart from jobs.json so the checked company-board data is never mixed up) and adds walk-in jobs to data/walkins.json.
// Adzuna terms: show "Adzuna" with a link on the jobs; jobs open through Adzuna. Review the terms before earning money from the site.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cityOf, isWalkin, merge } from './collect-walkins.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.JOBS_ROOT || path.join(HERE, '..'), DATA = path.join(ROOT, 'data'), DAY = 864e5;
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch { return d; } };
export const QUERIES = [['fresher', ''], ['walk in interview', ''], ['servicenow developer', ''], ['software developer', ''], ['customer support', ''], ['hr executive', ''], ['accountant', ''], ['sales executive', ''], ['data analyst', ''], ['qa tester', '']];
const plain = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
export function mapJob(x, now) {
  if (!x || !x.id || !x.title || !x.redirect_url) return null;
  let u; try { u = new URL(x.redirect_url); if (u.protocol !== 'https:') return null; } catch { return null; }
  const sal = x.salary_min && x.salary_max && String(x.salary_is_predicted) !== '1' ? [Math.round(x.salary_min / 1e4) / 10, Math.round(x.salary_max / 1e4) / 10] : null;
  return { id: 'az:' + x.id, c: plain(x.company && x.company.display_name) || 'Company not shown', t: plain(x.title), l: plain(x.location && x.location.display_name) || 'India', u: u.href, a: '', p: Date.parse(x.created) || now, s: now, d: plain(x.description).slice(0, 400), ...(sal ? { sa: sal } : {}), src: 'Adzuna' };
}
export async function main() {
  const id = process.env.ADZUNA_APP_ID, key = process.env.ADZUNA_APP_KEY, now = Date.now();
  if (!id || !key) { console.log('Adzuna keys not set: skipping the extra job feed.'); return; }
  const got = new Map(); let ok = 0, fail = 0;
  for (const [what] of QUERIES) {
    try {
      const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${encodeURIComponent(id)}&app_key=${encodeURIComponent(key)}&results_per_page=50&max_days_old=14&what=${encodeURIComponent(what)}&content-type=application/json`;
      const r = await fetch(url, { headers: { 'User-Agent': 'PadimachiJobsBot/1.0 (+https://padimachi.com)', Accept: 'application/json' } });
      if (!r.ok) { fail++; console.error('adzuna', what, r.status); continue; }
      const j = await r.json(); ok++; for (const x of j.results || []) { const m = mapJob(x, now); if (m) got.set(m.id, m); }
    } catch (e) { fail++; console.error('adzuna failed', what); }
    await new Promise(r => setTimeout(r, 600));
  }
  if (!ok) { console.log('Adzuna did not answer: keeping the old list.'); return; }
  const jobs = [...got.values()].sort((a, b) => b.p - a.p).slice(0, 800);
  fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(path.join(DATA, 'ext-jobs.json'), JSON.stringify({ updated: now, src: 'Adzuna', jobs }));
  const wj = jobs.filter(j => isWalkin(j.t + ' ' + j.d)).map(j => ({ id: j.id, title: j.t + ' at ' + j.c, link: j.u, source: 'Adzuna', t: j.p, city: cityOf(j.l + ' ' + j.t), kind: 'job' }));
  const prev = readJson('walkins.json', { list: [] }).list || [];
  fs.writeFileSync(path.join(DATA, 'walkins.json'), JSON.stringify({ updated: now, list: merge(prev, wj, now) }));
  console.log(`adzuna: ${jobs.length} jobs, ${wj.length} walk-in, ${fail} failed calls`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e); process.exit(0); });
