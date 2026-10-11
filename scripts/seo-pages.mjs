// Builds search-friendly pages from the public job list: one page per company, per field and per field + city (only when there are enough jobs),
// plus an index page, and adds them to sitemap.xml. Plain HTML, no scripts. Each job links to the company's own page.
// Run daily by the "Search pages" workflow and again on every publish. General information only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normCity } from './insights.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.JOBS_ROOT || path.join(HERE, '..');
const SITE = 'https://padimachi.com', DAY = 864e5, CSS = "body{font-family:system-ui,Segoe UI,Roboto,sans-serif;margin:0;background:#f7f8fb;color:#1b2430;line-height:1.6}main{max-width:820px;margin:0 auto;padding:20px 16px 60px}a{color:#2563eb}h1{font-size:1.7rem}h2{margin-top:2rem;font-size:1.25rem}.card{background:#fff;border-radius:14px;padding:14px 16px;margin:10px 0;box-shadow:0 1px 3px rgba(0,0,0,.08)}.btn{display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600}nav a{margin-right:12px}@media(prefers-color-scheme:dark){body{background:#12161d;color:#e6e9ef}.card{background:#1b212b}a{color:#7aa7ff}}";
const X = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const slug = s => String(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
export const FIELDS = [['servicenow', 'ServiceNow', /servicenow|service now/], ['qa', 'QA and testing', /\bqa\b|sdet|tester|test engineer|testing|quality assurance|automation test/], ['cyber', 'Cyber security', /security|soc analyst|infosec|penetration|cyber|vulnerab|\bsoc\b/], ['cloud', 'Cloud and DevOps', /devops|\bsre\b|site reliability|cloud|infrastructure|platform engineer|kubernetes|sysadmin|system administrator|network engineer/], ['data', 'Data and analytics', /data (scien|analy|engineer)|analytics|machine learning|\bml\b|\bai\b|business intelligence|\bbi\b|insight/], ['design', 'Design', /designer|\bux\b|\bui\b|graphic|illustrat|creative|motion|visual|animator/], ['marketing', 'Digital marketing', /marketing|\bseo\b|content|social media|growth|brand|campaign|copywrit|community/], ['sales', 'Sales', /\bsales\b|business development|account executive|account manager|partnership|revenue|key account|presales|pre-sales/], ['support', 'Customer support', /support|customer success|customer service|help ?desk|service desk|customer experience|customer care/], ['hr', 'HR and recruitment', /recruit|talent|\bhr\b|human resources|people (&|and) culture|people partner|hrbp|payroll|people operations/], ['finance', 'Finance and accounts', /financ|account(s|ant|ing)|audit|\btax\b|treasury|controller|fp&a|billing|reconcil/], ['pm', 'Product and project management', /product manag|product owner|program manag|project manag|scrum|delivery manag|product lead/], ['ops', 'Operations', /operations|supply chain|logistics|procure|warehouse|fulfil|vendor|category manager/], ['programming', 'Software development', /software|developer|full ?stack|back ?end|front ?end|java|python|golang|react|node|\bsde\b|programmer|engineer|architect|android|ios\b|mobile/]];
export const fieldOf = t => { const s = String(t || '').toLowerCase(), h = FIELDS.find(f => f[2].test(s)); return h ? h[0] : ''; };
const fname = id => (FIELDS.find(f => f[0] === id) || [])[1] || '';
const ago = (t, now) => { const d = Math.max(0, Math.floor((now - t) / DAY)); return d === 0 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago'; };
const MIN_COMPANY = 3, MIN_FIELD = 5, MIN_COMBO = 4, MAX_SHOWN = 60;
const safe = u => /^https:\/\//.test(u || '') ? u : '';
const shell = (title, desc, url, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${X(title)}</title><meta name="description" content="${X(desc)}"><link rel="canonical" href="${X(url)}"><meta property="og:title" content="${X(title)}"><meta property="og:description" content="${X(desc)}"><meta property="og:type" content="website"><meta property="og:url" content="${X(url)}"><link rel="icon" href="/icons/icon-192.png"><style>${CSS}</style></head><body><main><nav><a href="/">Padimachi</a><a href="/openings/">Job openings</a><a href="/learn/">Learn</a></nav>${body}<p class="dim" style="font-size:.85rem">General information only. These openings are taken from companies' own public job pages and may be filled before our next check. Always confirm on the company page. Never pay anyone for a job.</p></main></body></html>`;
const jobCard = (j, now) => { const u = safe(j.a) || safe(j.u); return `<div class="card"><b>${X(j.t)}</b><br>${X(j.c)} · ${X(normCity(j.l) || j.l || 'India')} · posted ${ago(j.p || j.s, now)}<br>${u ? `<a href="${X(u)}" rel="nofollow noopener noreferrer" target="_blank">Apply on the company page</a>` : ''}</div>`; };
const group = (list, f) => { const m = new Map(); for (const j of list) { const k = f(j); if (!k) continue; (m.get(k) || m.set(k, []).get(k)).push(j); } return m; };
const link = (href, text, n) => `<a href="${X(href)}">${X(text)}${n ? ' (' + n + ')' : ''}</a>`;
const stamp = now => new Date(now).toISOString().slice(0, 10);

export function build(allJobs, now = Date.now(), sal = null) {
  const open = allJobs.filter(j => !j.x && j.t && j.c && now - (j.p || j.s) <= 90 * DAY).sort((a, b) => (b.p || b.s) - (a.p || a.s));
  const files = {}, urls = [], cityOf = j => normCity(j.l) || '';
  const salBlock = (f, c) => { const x = sal && (c ? sal.combos && sal.combos[f + '|' + c] : sal.fields && sal.fields[f]); return x ? `<div class="card"><b>Pay posted by companies</b><br>Across ${x.n} openings that list pay${c ? ' in ' + X(c) : ''}, the typical range is ₹${x.lo} to ₹${x.hi} lakh a year. Only companies that publish pay are counted, so treat this as a guide.</div>` : ''; };
  const page = (file, title, desc, h1, intro, jobs, extra) => { files[file] = shell(title, desc, `${SITE}/${file === 'openings/index.html' ? 'openings/' : file}`, `<h1>${X(h1)}</h1><p>${X(intro)} Updated ${stamp(now)}.</p><p><a class="btn" href="/#/openings">See openings matched to your resume</a></p>${jobs.slice(0, MAX_SHOWN).map(j => jobCard(j, now)).join('')}${jobs.length > MAX_SHOWN ? `<p>Showing the newest ${MAX_SHOWN} of ${jobs.length}. <a href="/#/openings">Search all of them on Padimachi</a>.</p>` : ''}${extra || ''}`); urls.push(`${SITE}/${file === 'openings/index.html' ? 'openings/' : file}`); };
  const byCo = group(open, j => j.c), byField = group(open, j => fieldOf(j.t));
  const companies = [...byCo].filter(x => x[1].length >= MIN_COMPANY).sort((a, b) => b[1].length - a[1].length);
  const fields = [...byField].filter(x => x[1].length >= MIN_FIELD).sort((a, b) => b[1].length - a[1].length);
  const combos = [];
  for (const [f, list] of fields) for (const [c, l2] of group(list, cityOf)) if (l2.length >= MIN_COMBO && c !== 'Remote') combos.push([f, c, l2]);
  const usedSlugs = new Set();
  const uniq = s => { let k = s || 'x', i = 2; while (usedSlugs.has(k)) k = (s || 'x') + '-' + i++; usedSlugs.add(k); return k; };
  const coFiles = new Map(companies.map(([c]) => [c, 'at-' + uniq(slug(c))]));
  for (const [c, list] of companies) {
    const cities = [...group(list, cityOf)].sort((a, b) => b[1].length - a[1].length).slice(0, 5).map(x => x[0]);
    page(`openings/${coFiles.get(c)}.html`, `${c} jobs in India: ${list.length} open now | Padimachi`, `${list.length} current ${c} openings in India${cities.length ? ' (' + cities.join(', ') + ')' : ''}, taken from the company's own job page. Apply on the company page.`, `${c} jobs in India`, `${list.length} openings at ${c} right now${cities.length ? ', mostly in ' + cities.join(', ') : ''}.`, list, `<p>${link('/openings/', 'All companies hiring now')}</p>`);
  }
  const fFiles = new Map(fields.map(([f]) => [f, 'jobs-' + f]));
  for (const [f, list] of fields) {
    const cs = combos.filter(x => x[0] === f).sort((a, b) => b[2].length - a[2].length);
    page(`openings/${fFiles.get(f)}.html`, `${fname(f)} jobs in India: ${list.length} open now | Padimachi`, `${list.length} current ${fname(f).toLowerCase()} openings in India from companies' own job pages. See titles, cities and apply links.`, `${fname(f)} jobs in India`, `${list.length} ${fname(f).toLowerCase()} openings right now.`, list, (cs.length ? `<h2>By city</h2><p>${cs.map(x => link(`/openings/jobs-${f}-in-${slug(x[1])}.html`, `${fname(f)} jobs in ${x[1]}`, x[2].length)).join(' · ')}</p>` : '') + salBlock(f) + `<p>${link('/learn/' + (f === 'marketing' ? 'dmkt' : f) + '.html', 'Free ' + fname(f) + ' interview guide')}</p>`);
  }
  for (const [f, c, list] of combos) page(`openings/jobs-${f}-in-${slug(c)}.html`, `${fname(f)} jobs in ${c}: ${list.length} open now | Padimachi`, `${list.length} current ${fname(f).toLowerCase()} openings in ${c} from companies' own job pages.`, `${fname(f)} jobs in ${c}`, `${list.length} ${fname(f).toLowerCase()} openings in ${c} right now.`, list, salBlock(f, c) + `<p>${link(`/openings/${fFiles.get(f)}.html`, 'All ' + fname(f) + ' jobs in India')}</p>`);
  const idx = `<h2>By field</h2><p>${fields.map(([f, l]) => link(`/openings/${fFiles.get(f)}.html`, fname(f), l.length)).join(' · ') || 'Not enough openings yet.'}</p><h2>Companies hiring now</h2><p>${companies.slice(0, 80).map(([c, l]) => link(`/openings/${coFiles.get(c)}.html`, c, l.length)).join(' · ') || 'Not enough openings yet.'}</p>`;
  page('openings/index.html', `Job openings in India: ${open.length} open now | Padimachi`, `${open.length} recent job openings in India from companies' own job pages, by field, city and company. Free, updated every few hours.`, 'Job openings in India', `${open.length} recent openings from ${byCo.size} companies, taken from their own public job pages.`, [], idx);
  return { files, urls };
}

export function writeAll(root = ROOT, now = Date.now()) {
  let jobs = []; try { jobs = JSON.parse(fs.readFileSync(path.join(root, 'data', 'jobs.json'), 'utf8')).jobs || []; } catch {}
  const dir = path.join(root, 'openings');
  if (jobs.length < 50) { return { skipped: true, reason: 'too few jobs, pages left as they were' }; }
  let sal = null; try { sal = JSON.parse(fs.readFileSync(path.join(root, 'data', 'salary.json'), 'utf8')); } catch {}
  const { files, urls } = build(jobs, now, sal);
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (const [f, html] of Object.entries(files)) fs.writeFileSync(path.join(root, f), html);
  const sm = path.join(root, 'sitemap.xml'); let x = ''; try { x = fs.readFileSync(sm, 'utf8'); } catch {}
  x = x.replace(/<url><loc>https:\/\/padimachi\.com\/openings\/[^<]*<\/loc>[^]*?<\/url>/g, '');
  if (!x.includes('</urlset>')) x = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://padimachi.com/</loc></url></urlset>';
  x = x.replace('</urlset>', urls.map(u => `<url><loc>${X(u)}</loc><lastmod>${stamp(now)}</lastmod><changefreq>daily</changefreq></url>`).join('') + '</urlset>');
  fs.writeFileSync(sm, x);
  return { pages: urls.length };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(writeAll()));
