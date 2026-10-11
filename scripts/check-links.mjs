// Weekly link check. Finds every web address written into the website's script files and checks that it still opens.
// Only "not found" answers (404, 410) and unreachable hosts count as broken. Sites that block robots (403, 429, 999) are left alone.
// A link is reported as broken only after it fails two weeks in a row, so one bad moment never raises an alarm.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.JOBS_ROOT || path.join(HERE, '..');
const SKIP = /(^https?:\/\/(www\.)?(w3\.org|schema\.org|localhost|example\.(com|org)|fonts\.(googleapis|gstatic)\.com|script\.google\.com|accounts\.google\.com|apis\.google\.com|api\.github\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)|\$\{|%s)/i;
export const extract = text => [...new Set([...String(text).matchAll(/https?:\/\/[^\s"'`\\<>)\]}]+/g)].map(m => m[0].replace(/[.,;:!?]+$/, '')).filter(u => u.length < 300 && !SKIP.test(u) && /^https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/i.test(u)))];
export const classify = status => status >= 200 && status < 400 ? 'ok' : status === 404 || status === 410 || status === 0 ? 'dead' : 'unknown';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function probe(url, f) {
  for (const method of ['HEAD', 'GET']) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 15000);
    try { const r = await f(url, { method, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PadimachiLinkCheck/1.0; +https://padimachi.com)' }, signal: ctl.signal }); if (method === 'HEAD' && (r.status === 405 || r.status === 403 || r.status === 501 || r.status >= 500)) continue; return r.status; }
    catch (e) { if (method === 'GET') return 0; } finally { clearTimeout(t); }
  }
  return 0;
}
export async function checkAll(urls, { f = fetch, prev = {}, now = Date.now(), delay = 250, conc = 6 } = {}) {
  const byHost = {}; urls.forEach(u => { let h = ''; try { h = new URL(u).host; } catch {} (byHost[h] = byHost[h] || []).push(u); });
  const hosts = Object.values(byHost), out = {}; let i = 0;
  await Promise.all(Array.from({ length: conc }, async () => { while (i < hosts.length) { const list = hosts[i++]; for (const u of list) { let st = await probe(u, f); if (classify(st) === 'dead') { await sleep(delay * 4); st = await probe(u, f); } out[u] = st; await sleep(delay); } } }));
  const links = {};
  for (const u of urls) { const c = classify(out[u]), p = prev[u] || {}; links[u] = { status: out[u], state: c, strikes: c === 'dead' ? (p.strikes || 0) + 1 : 0, since: c === 'dead' ? (p.since || now) : 0 }; }
  return links;
}
export const summary = links => { const v = Object.entries(links); return { checked: v.length, ok: v.filter(x => x[1].state === 'ok').length, unknown: v.filter(x => x[1].state === 'unknown').length, broken: v.filter(x => x[1].state === 'dead' && x[1].strikes >= 2).map(x => [x[0], x[1].status]), pending: v.filter(x => x[1].state === 'dead' && x[1].strikes < 2).length }; };
export function sources(root) {
  const files = []; const walk = d => { for (const n of fs.readdirSync(d, { withFileTypes: true })) { if (n.name.startsWith('.') || n.name === 'data' || n.name === 'scripts' || n.name === 'node_modules' || n.name === 'voice') continue; const p = path.join(d, n.name); if (n.isDirectory()) walk(p); else if (/\.(js|html)$/.test(n.name)) files.push(p); } }; walk(root);
  return files;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = path.join(ROOT, 'data', 'links.json'); let prev = {}; try { prev = JSON.parse(fs.readFileSync(file, 'utf8')).links || {}; } catch {}
  const urls = extract(sources(ROOT).map(p => fs.readFileSync(p, 'utf8')).join('\n')).filter(u => !/padimachi\.com|aravinth-venkat\.github\.io/.test(u));
  const links = await checkAll(urls, { prev }), sum = summary(links);
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify({ updated: Date.now(), summary: sum, links: Object.fromEntries(Object.entries(links).filter(x => x[1].state !== 'ok')) }));
  console.log(`links ${sum.checked}, ok ${sum.ok}, blocked/unknown ${sum.unknown}, broken ${sum.broken.length}, failed once ${sum.pending}`);
}
