// Nightly browser test of the live site. Opens the real pages in a headless browser on a laptop and a phone size,
// and reports pages that fail to open, show errors, run off the screen, or are empty. Writes data/smoke.json, exits 1 on a problem.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
const SITE = (process.env.SMOKE_SITE || 'https://padimachi.com').replace(/\/$/, '');
const ROUTES = ['home', 'career', 'learn', 'learn/servicenow', 'interview', 'resumepdf', 'report', 'ctc', 'pay', 'reading', 'tracker', 'profile', 'companies', 'journey', 'toolkit', 'mentor', 'offer', 'lab', 'ladder', 'mymap', 'progress', 'play', 'mock', 'speak', 'search', 'faq', 'kb'];
const SAMPLE = 'Priya Sharma priya@gmail.com +91 98765 43210\nSUMMARY\nFresher keen on ServiceNow development.\nSKILLS\nServiceNow, JavaScript, SQL\nEDUCATION\nB.E. Computer Science 2025\nPROJECTS\nProject #1: Leave form\nDescription: Built a leave request form.';
const { chromium } = await import('playwright');
const bad = [], info = { routes: 0 };
const browser = await chromium.launch(process.env.PW_EXE ? { executablePath: process.env.PW_EXE } : {});
for (const [name, w, h] of [['laptop', 1280, 800], ['phone', 390, 800]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } }), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('requestfailed', r => { if (/\/(data|app)\//.test(r.url())) errs.push('request failed: ' + r.url()); });
  try { await p.goto(SITE + '/', { waitUntil: 'load', timeout: 45000 }); await p.waitForSelector('main', { timeout: 20000 }); } catch (e) { bad.push(`${name}: home page did not open (${e.message.split('\n')[0]}).`); await ctx.close(); continue; }
  for (const r of ROUTES) {
    await p.evaluate(x => { location.hash = '#/' + x; }, r); await p.waitForTimeout(350); info.routes++;
    const o = await p.evaluate(() => ({ len: (document.querySelector('main') || {}).innerText ? document.querySelector('main').innerText.length : 0, wide: document.documentElement.scrollWidth > innerWidth + 2 }));
    if (o.len < 40) bad.push(`${name}: #/${r} is empty.`); if (o.wide) bad.push(`${name}: #/${r} runs off the screen sideways.`);
  }
  await p.evaluate(() => { location.hash = '#/career'; }); await p.waitForTimeout(2500);
  const jobs = await p.evaluate(() => document.querySelectorAll('.job').length); if (jobs < 3) bad.push(`${name}: the jobs page shows ${jobs} jobs.`);
  const tab = await p.evaluate(() => { const t = document.querySelector('.tabbar'); return !!t && getComputedStyle(t).display !== 'none'; }); if (name === 'phone' && !tab) bad.push('phone: bottom menu is missing.');
  await p.evaluate(() => { location.hash = '#/resumepdf/new'; }); await p.waitForTimeout(400);
  const f = await p.evaluate(() => !!document.querySelector('input[type=file]')); if (!f) bad.push(`${name}: resume upload box is missing.`);
  await p.evaluate(s => { localStorage.setItem('careerlab_v2', JSON.stringify({ resume: s })); location.hash = '#/resumepdf'; location.reload(); }, SAMPLE); await p.waitForTimeout(1500);
  const pages = await p.evaluate(() => document.querySelectorAll('.rpage').length); if (pages < 1) bad.push(`${name}: Resume Studio shows no preview.`);
  errs.filter((x, i, a) => a.indexOf(x) === i).slice(0, 5).forEach(x => bad.push(`${name}: ${x}`));
  await ctx.close();
}
await browser.close();
const r = { t: Date.now(), site: SITE, ok: bad.length === 0, info, bad };
if (!process.env.SMOKE_NOWRITE) { fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'data', 'smoke.json'), JSON.stringify(r)); }
console.log(JSON.stringify(info)); bad.forEach(b => console.log(b)); if (bad.length) process.exit(1);
