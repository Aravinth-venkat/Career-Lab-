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
  const fresh = jobs.filter(j => !j.x && !posted[j.id] && now - (j.p || j.s) <= 3 * DAY && (safe(j.a) || safe(j.u)));
  const score = j => { const c = classify(j); return (c.fresher ? 3 : 0) + (c.walkin ? 3 : 0) + (c.urgent ? 2 : 0) + (j.sa ? 1 : 0); };
  const best = fresh.map(j => [j, score(j)]).sort((a, b) => b[1] - a[1] || (b[0].p || 0) - (a[0].p || 0)), seen = {}, out = [];
  for (const [j] of best) { if ((seen[j.c] = (seen[j.c] || 0) + 1) > 2) continue; out.push(j); if (out.length >= max) break; }
  return out;
}
export function message(list, now) {
  const tag = j => { const c = classify(j); return c.walkin ? '🚶' : c.fresher ? '🌱' : c.urgent ? '⚡' : '🆕'; };
  const lines = list.map(j => `${tag(j)} <b>${H(j.t)}</b>\n${H(j.c)} · ${H(normCity(j.l) || j.l || 'India')}${j.sa ? ' · ₹' + j.sa[0] + '–' + j.sa[1] + ' LPA' : ''}\n<a href="${H(safe(j.a) || safe(j.u))}">Apply on the company page</a>`);
  return `<b>New openings, ${new Date(now).toISOString().slice(0, 10)}</b>\n\n${lines.join('\n\n')}\n\nMatch jobs to your resume (it stays on your phone): <a href="${SITE}/#/openings">padimachi.com</a>\nConfirm every job on the company page. Never pay anyone for a job.`;
}
export async function run({ token, chat, now = Date.now(), f = fetch, root = ROOT, test = false } = {}) {
  if (!token || !chat) return { skipped: 'Telegram is not set up yet (no secrets).' };
  if (test) { const r = await f(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text: '✅ Padimachi job bot is connected. Daily openings will appear here at 9 AM.' }) }); return r.ok ? { test: 'sent' } : { error: 'Telegram answered ' + r.status }; }
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
// Optional extra channels by field, and one weekly top-skills post. Each needs its own chat id; none is posted until it is set.
export const FIELDS = { freshers: { label: 'Fresher openings', test: j => classify(j).fresher }, servicenow: { label: 'ServiceNow openings', test: j => /service[- ]?now|\bsnow\b|\bitsm\b|\bcmdb\b/i.test(String(j.t || '') + ' ' + String(j.d || '').slice(0, 600)) } };
export function skillsMessage(skills, now, n = 8) {
  const top = (skills || []).slice(0, n); if (!top.length) return '';
  return `<b>Top skills employers asked for this week</b>\n\n${top.map((x, i) => `${i + 1}. ${H(x[0])} (${+x[1]} openings)`).join('\n')}\n\nSee which ones your resume is missing (it stays on your phone): <a href="${SITE}/#/report">padimachi.com</a>`;
}
export async function runAll({ token, chat, chats = {}, weekly = false, now = Date.now(), f = fetch, root = ROOT, test = false } = {}) {
  const main = await run({ token, chat, now, f, root, test }); if (!token || test) return { main };
  const data = path.join(root, 'data'); let jobs = [], st = { posted: {} };
  try { jobs = JSON.parse(fs.readFileSync(path.join(data, 'jobs.json'), 'utf8')).jobs || []; } catch {}
  try { st = JSON.parse(fs.readFileSync(path.join(data, 'telegram.json'), 'utf8')); } catch {}
  st.f = st.f || {}; const out = { main }; const send = async (cid, text) => f(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: cid, text, parse_mode: 'HTML', disable_web_page_preview: true }) });
  for (const [k, spec] of Object.entries(FIELDS)) {
    const cid = chats[k]; if (!cid) continue; const posted = st.f[k] = st.f[k] || {}; for (const id of Object.keys(posted)) if (now - posted[id] > 30 * DAY) delete posted[id];
    const list = pick(jobs.filter(spec.test), posted, now); if (!list.length) { out[k] = { posted: 0 }; continue; }
    const m = message(list, now).replace('New openings', spec.label); const r = await send(cid, m);
    if (!r.ok) { out[k] = { error: 'Telegram answered ' + r.status }; continue; } list.forEach(j => { posted[j.id] = now; }); out[k] = { posted: list.length };
  }
  if (weekly && chat) { const wk = new Date(now).toISOString().slice(0, 10), last = st.weekly || ''; if (!last || now - Date.parse(last) >= 6 * DAY) { let sk = []; try { sk = JSON.parse(fs.readFileSync(path.join(data, 'insights.json'), 'utf8')).skills || []; } catch {} const m = skillsMessage(sk, now); if (m) { const r = await send(chat, m); if (r.ok) { st.weekly = wk; out.weekly = 'sent'; } else out.weekly = { error: 'Telegram answered ' + r.status }; } } else out.weekly = 'already sent'; }
  fs.mkdirSync(data, { recursive: true }); fs.writeFileSync(path.join(data, 'telegram.json'), JSON.stringify(st)); return out;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { const e = process.env, r = await runAll({ token: e.TELEGRAM_BOT_TOKEN, chat: e.TELEGRAM_CHAT_ID, chats: { freshers: e.TELEGRAM_CHAT_FRESHERS, servicenow: e.TELEGRAM_CHAT_SERVICENOW }, weekly: e.TG_WEEKLY === 'true' || new Date().getUTCDay() === 1, test: e.TG_TEST === 'true' }); console.log(JSON.stringify(r)); if (JSON.stringify(r).includes('"error"')) process.exit(1); }
