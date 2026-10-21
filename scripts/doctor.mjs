// Daily self check of the data the site runs on. Fixes nothing silently: it lists problems (bad) and soft signs (warn), writes data/doctor.json, exits 1 on any bad.
// Checks: every data file is valid JSON, job data is fresh and plausible, ids are unique, voice clips listed exist, sitemap pages exist, the bundle named in index.html exists.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.DOCTOR_ROOT || path.join(HERE, '..'), HOUR = 36e5;
export function diagnose(root = ROOT, now = Date.now()) {
  const bad = [], warn = [], info = {}, rd = (p, d) => fs.readFileSync(path.join(root, p), d || 'utf8'), has = p => fs.existsSync(path.join(root, p));
  const J = p => { try { return JSON.parse(rd(p)); } catch (e) { bad.push(`${p} is missing or not valid JSON.`); return null; } };
  if (has('data')) for (const f of fs.readdirSync(path.join(root, 'data')).filter(f => f.endsWith('.json'))) { try { JSON.parse(rd('data/' + f)); } catch { bad.push(`data/${f} is not valid JSON.`); } }
  const jd = J('data/jobs.json');
  if (jd) {
    const jobs = jd.jobs || [], open = jobs.filter(j => !j.x); info.jobs = jobs.length; info.open = open.length;
    const age = (now - jd.updated) / HOUR; info.ageHours = Math.round(age);
    if (age > 12) bad.push(`Job data is ${Math.round(age)} hours old. The 3-hourly update is not running.`); else if (age > 6) warn.push(`Job data is ${Math.round(age)} hours old.`);
    if (open.length < 300) bad.push(`Only ${open.length} open jobs. Expected at least 300.`);
    const seen = new Set(); let dup = 0; for (const j of jobs) { if (seen.has(j.id)) dup++; seen.add(j.id); } info.duplicateIds = dup;
    if (dup > 0) warn.push(`${dup} duplicate job ids (removed on the next update).`);
    const noT = open.filter(j => !j.t || !j.c).length, noL = open.filter(j => !(j.a || j.u)).length;
    if (noT) bad.push(`${noT} open jobs have no title or company.`); if (noL > open.length * .02) bad.push(`${noL} open jobs have no apply link.`);
    const http = open.filter(j => (j.a && !/^https:/.test(j.a)) || (j.u && !/^https:/.test(j.u))).length; if (http) bad.push(`${http} open jobs link to a non-https address.`);
    const future = open.filter(j => j.p > now + 864e5).length; if (future) warn.push(`${future} jobs have a posted date in the future.`);
  }
  const st = has('data/status.json') ? J('data/status.json') : null; if (st && st.alert) bad.push('Job updater reports an alert: ' + String(st.alert).slice(0, 120));
  const vi = has('voice/index.json') ? J('voice/index.json') : null;
  if (vi) { let miss = 0, n = 0; for (const g of ['m', 'f']) for (const h of vi[g] || []) { n++; if (!has(`voice/${g}/${h}.mp3`)) miss++; } info.clips = n; if (miss) bad.push(`${miss} voice clips are listed but the file is missing.`); }
  if (has('sitemap.xml')) { const urls = [...rd('sitemap.xml').matchAll(/<loc>https:\/\/padimachi\.com([^<]*)<\/loc>/g)].map(m => m[1]); let miss = 0; for (const u of urls) { if (u === '/') continue; const p = u.replace(/^\//, ''); if (!(has(p) || has(path.join(p, 'index.html')))) miss++; } info.sitemap = urls.length; if (miss) bad.push(`${miss} sitemap addresses have no page.`); } else bad.push('sitemap.xml is missing.');
  if (has('index.html')) { const html = rd('index.html'); for (const m of html.matchAll(/(?:src|href)="((?:js|css|app)\/[^"?]+)(?:\?[^"]*)?"/g)) if (!has(m[1])) bad.push(`index.html needs ${m[1]} but it is missing.`); } else bad.push('index.html is missing.');
  return { bad, warn, info };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = diagnose(); r.t = Date.now(); fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'data', 'doctor.json'), JSON.stringify(r));
  console.log(JSON.stringify(r.info)); r.warn.forEach(w => console.log('warning: ' + w)); r.bad.forEach(b => console.log(b)); if (r.bad.length) process.exit(1);
}
