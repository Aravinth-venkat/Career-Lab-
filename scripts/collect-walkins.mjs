// Walk-in drive headlines for Indian cities. Reads public Google News RSS searches, keeps headline + link + source only (no article text),
// drops anything that asks for money, and writes data/walkins.json. Shown on the site at once: walk-ins are time sensitive.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRss, idOf } from './collect-notes.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.JOBS_ROOT || path.join(HERE, '..'), DATA = path.join(ROOT, 'data');
const UA = 'PadimachiWalkinBot/1.0 (+https://padimachi.com)', DAY = 864e5;
export const CITIES = [['Bengaluru', /bengaluru|bangalore/i], ['Chennai', /chennai/i], ['Hyderabad', /hyderabad|secunderabad/i], ['Pune', /pune/i], ['Mumbai', /mumbai|navi mumbai|thane/i], ['Delhi NCR', /delhi|noida|gurugram|gurgaon|ghaziabad|faridabad/i], ['Coimbatore', /coimbatore/i], ['Kolkata', /kolkata/i], ['Kochi', /kochi|cochin|ernakulam/i], ['Ahmedabad', /ahmedabad/i], ['Madurai', /madurai/i], ['Trichy', /trichy|tiruchirappalli/i]];
export const cityOf = s => { const c = CITIES.find(([, re]) => re.test(s)); return c ? c[0] : ''; };
export const BLOCK = /registration fee|security deposit|pay (?:rs|₹|inr)|processing fee|training fee|apply and pay|money back|guaranteed job|100% placement/i;
export const isWalkin = s => /walk[- ]?in/i.test(s) && !BLOCK.test(s);
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch { return d; } };
export function merge(prev, got, now, maxAgeDays = 21, cap = 160) {
  const seen = new Set(), out = [];
  for (const x of [...got, ...prev].sort((a, b) => b.t - a.t)) { if (seen.has(x.id) || now - x.t > maxAgeDays * DAY) continue; seen.add(x.id); out.push(x); }
  return out.slice(0, cap);
}
export function fromRss(xml, now) { return parseRss(xml, 'Walk-in', now).filter(x => isWalkin(x.title)).map(x => ({ id: x.id, title: x.title, link: x.link, source: x.source, t: x.t, city: cityOf(x.title), kind: 'news' })); }
export async function main() {
  const now = Date.now(), prev = (readJson('walkins.json', { list: [] }).list || []); let got = [], ok = 0;
  const qs = [...CITIES.map(c => `walk-in interview ${c[0]}`), 'walk-in drive freshers India', 'walk-in interview IT jobs India'];
  for (const q of qs) {
    try { const r = await fetch('https://news.google.com/rss/search?q=' + encodeURIComponent(q + ' when:14d') + '&hl=en-IN&gl=IN&ceid=IN:en', { headers: { 'User-Agent': UA } }); if (r.ok) { ok++; got.push(...fromRss(await r.text(), now)); } } catch (e) { console.error('feed failed', q); }
    await new Promise(r => setTimeout(r, 400));
  }
  // walk-in jobs found by the job-feed collector (see ext-jobs.mjs) are added there
  const keepExt = prev.filter(x => x.kind === 'job');
  if (!ok && prev.length) { console.log('no feed answered, keeping the old list'); return; }
  const list = merge([...prev.filter(x => x.kind !== 'job'), ...keepExt], got, now);
  fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(path.join(DATA, 'walkins.json'), JSON.stringify({ updated: now, list }));
  console.log(`walk-ins: ${got.length} read, ${list.length} listed (${list.filter(x => x.city).length} with a city)`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e); process.exit(0); });
