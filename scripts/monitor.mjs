// Daily check of the LIVE website. Prints problems (one per line) and exits 1 when there are any. The workflow turns that into a GitHub issue.
// Checks: home page loads, the app bundle and stylesheet load, job data is fresh and not suddenly small, sitemap and robots work.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = process.env.SITE_URL || 'https://padimachi.com';
const UA = 'PadimachiMonitor/1.0 (+https://padimachi.com)';
async function get(url, f = fetch) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 20000);
  try { const r = await f(url, { headers: { 'User-Agent': UA, 'Cache-Control': 'no-cache' }, signal: ctl.signal }); return { ok: r.ok, status: r.status, text: async () => r.text() }; }
  catch (e) { return { ok: false, status: 0, text: async () => '' }; } finally { clearTimeout(t); }
}
export async function check({ site = SITE, now = Date.now(), f = fetch, last = null } = {}) {
  const bad = [], info = {};
  const home = await get(site + '/', f);
  if (!home.ok) { bad.push(`Home page does not load (status ${home.status}).`); return { bad, info }; }
  const html = await home.text();
  if (!/Padimachi/i.test(html)) bad.push('Home page loaded but does not look like Padimachi.');
  const assets = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)].map(m => m[1]);
  if (!assets.some(a => a.startsWith('js/'))) bad.push('Home page has no app script.');
  for (const a of assets.slice(0, 6)) { const r = await get(site + '/' + a, f); if (!r.ok) bad.push(`Asset ${a} fails (status ${r.status}).`); }
  const jr = await get(site + '/data/jobs.json', f);
  if (!jr.ok) bad.push(`Job data does not load (status ${jr.status}).`);
  else {
    let j = null; try { j = JSON.parse(await jr.text()); } catch { bad.push('Job data is not valid JSON.'); }
    if (j) {
      const open = (j.jobs || []).filter(x => !x.x).length, age = (now - (j.updated || 0)) / 36e5; info.open = open; info.ageHours = Math.round(age);
      if (age > 12) bad.push(`Job data is ${Math.round(age)} hours old. The updater should run every 3 hours.`);
      if (open < 50) bad.push(`Only ${open} open jobs are listed. Something may be wrong with the job boards.`);
      else if (last && last.open >= 100 && open < last.open * 0.5) bad.push(`Open jobs dropped from ${last.open} to ${open} since the last check.`);
    }
  }
  for (const p of ['/sitemap.xml', '/robots.txt', '/manifest.webmanifest']) { const r = await get(site + p, f); if (!r.ok) bad.push(`${p} fails (status ${r.status}).`); }
  return { bad, info };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = path.join(HERE, '..', 'data', 'monitor.json'); let last = null; try { last = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  const r = await check({ last });
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify({ t: Date.now(), open: r.info.open ?? (last && last.open) ?? 0, ageHours: r.info.ageHours ?? null, bad: r.bad })); } catch {}
  if (r.bad.length) { console.log(r.bad.join('\n')); process.exit(1); }
  console.log('Site healthy. ' + JSON.stringify(r.info));
}
