// Posts one daily digest of NEW openings to a Telegram channel. Does nothing until two secrets exist:
// TELEGRAM_BOT_TOKEN (from @BotFather) and TELEGRAM_CHAT_ID (for example @padimachi_jobs). Each job is posted once.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify } from './tags.mjs';
import { normCity } from './insights.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.JOBS_ROOT || path.join(HERE, '..'), DATA = path.join(ROOT, 'data');
const DAY = 864e5, SITE = 'https://padimachi.com';
const H = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const safe = u => /^https:\/\//.test(u || '') ? u : '';
export function pick(jobs, posted, now, max = 8) {
  const fresh = jobs.filter(j => !j.x && !posted[j.id] && now - (j.p || j.s) <= 2 * DAY && (safe(j.a) || safe(j.u)));
  const score = j => { const c = classify(j); return (c.fresher ? 3 : 0) + (c.walkin ? 3 : 0) + (c.urgent ? 2 : 0) + (j.sa ? 1 : 0); };
  const best = fresh.map(j => [j, score(j)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1] || (b[0].p || 0) - (a[0].p || 0)), seen = {}, out = [];
  for (const [j] of best) { if ((seen[j.c] = (seen[j.c] || 0) + 1) > 2) continue; out.push(j); if (out.length >= max) break; }
  return out;
}
export function message(list, now) {
  const tag = j => { const c = classify(j); return c.walkin ? '🚶' : c.fresher ? '🌱' : c.urgent ? '⚡' : '🆕'; };
  const lines = list.map(j => `${tag(j)} <b>${H(j.t)}</b>\n${H(j.c)} · ${H(normCity(j.l) || j.l || 'India')}${j.sa ? ' · ₹' + j.sa[0] + '–' + j.sa[1] + ' LPA' : ''}\n<a href="${H(safe(j.a) || safe(j.u))}">Apply on the company page</a>`);
  return `<b>New openings, ${new Date(now).toISOString().slice(0, 10)}</b>\n\n${lines.join('\n\n')}\n\nMatch jobs to your resume (it stays on your phone): <a href="${SITE}/#/openings">padimachi.com</a>\nConfirm every job on the company page. Never pay anyone for a job.`;
}
export async function run({ token, chat, now = Date.now(), f = fetch, root = ROOT } = {}) {
  if (!token || !chat) return { skipped: 'Telegram is not set up yet (no secrets).' };
  const data = path.join(root, 'data'); let jobs = [], st = { posted: {} };
  try { jobs = JSON.parse(fs.readFileSync(path.join(data, 'jobs.json'), 'utf8')).jobs || []; } catch {}
  try { st = JSON.parse(fs.readFileSync(path.join(data, 'telegram.json'), 'utf8')); } catch {}
  for (const k of Object.keys(st.posted)) if (now - st.posted[k] > 30 * DAY) delete st.posted[k];
  const list = pick(jobs, st.posted, now); if (!list.length) return { posted: 0 };
  const r = await f(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text: message(list, now), parse_mode: 'HTML', disable_web_page_preview: true }) });
  if (!r.ok) return { error: 'Telegram answered ' + r.status };
  list.forEach(j => { st.posted[j.id] = now; }); fs.mkdirSync(data, { recursive: true }); fs.writeFileSync(path.join(data, 'telegram.json'), JSON.stringify(st));
  return { posted: list.length };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { const r = await run({ token: process.env.TELEGRAM_BOT_TOKEN, chat: process.env.TELEGRAM_CHAT_ID }); console.log(JSON.stringify(r)); if (r.error) process.exit(1); }
