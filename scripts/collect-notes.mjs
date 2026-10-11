// Collects market and fresher news HEADLINES and LINKS only (no article text) from public Google News RSS searches.
// Writes data/pending.json. Nothing is shown on the website until the owner ticks it in the GitHub issue (see approve-notes.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.JOBS_ROOT || path.join(HERE, '..'), DATA = path.join(ROOT, 'data');
const UA = 'PadimachiNotesBot/1.0 (+https://padimachi.com)';
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch { return d; } };
const writeJson = (f, v) => { fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(path.join(DATA, f), JSON.stringify(v)); };
const dec = s => String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const tag = (x, n) => { const m = new RegExp('<' + n + '[^>]*>([\\s\\S]*?)</' + n + '>', 'i').exec(x); return m ? dec(m[1]) : ''; };
export const idOf = s => { let h = 5381; for (const c of String(s).toLowerCase().replace(/[^a-z0-9]+/g, '')) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h.toString(36); };
const safeUrl = u => { try { const x = new URL(String(u)); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : ''; } catch { return ''; } };

export function parseRss(xml, tagName, now) {
  const out = [];
  for (const m of String(xml).matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const it = m[1]; let title = tag(it, 'title'); const link = safeUrl(tag(it, 'link')), src = tag(it, 'source'), t = Date.parse(tag(it, 'pubDate')) || 0;
    if (src && title.endsWith(' - ' + src)) title = title.slice(0, -(src.length + 3)).trim();
    if (!title || !link || title.length < 15 || title.length > 200) continue;
    out.push({ id: idOf(title), title, link, source: src || 'News', t: t || now, tag: tagName });
  }
  return out;
}

export function pick(items, cfg, now, have) {
  const seen = new Set(have), out = [];
  for (const it of items.sort((a, b) => b.t - a.t)) {
    if (seen.has(it.id)) continue; if (now - it.t > cfg.maxAgeDays * 864e5) continue;
    if ((cfg.blockWords || []).some(w => it.title.toLowerCase().includes(w))) continue;
    seen.add(it.id); out.push(it);
  }
  return out;
}

export async function main() {
  const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'feeds.json'), 'utf8')), now = Date.now();
  const pending = readJson('pending.json', { list: [] }).list || [], notes = (readJson('notes.json', { list: [] }).list || []);
  let got = [];
  for (const f of cfg.queries) {
    try {
      const r = await fetch('https://news.google.com/rss/search?q=' + encodeURIComponent(f.q + ' when:7d') + '&hl=en-IN&gl=IN&ceid=IN:en', { headers: { 'User-Agent': UA } });
      if (r.ok) got.push(...parseRss(await r.text(), f.tag, now));
    } catch (e) { console.error('feed failed', f.q); }
    await new Promise(r => setTimeout(r, 400));
  }
  const fresh = pick(got, cfg, now, [...pending.map(x => x.id), ...notes.map(x => x.id)]);
  const keep = pending.filter(x => now - x.t <= cfg.maxAgeDays * 864e5);
  const list = [...fresh, ...keep].sort((a, b) => b.t - a.t).slice(0, cfg.maxPending);
  writeJson('pending.json', { updated: now, list });
  console.log(`news: ${got.length} read, ${fresh.length} new, ${list.length} waiting for approval`);
}

// issue body: a tick-list. Ticked = shown on the website.
export function issueBody(pending, notes, now) {
  const row = (x, ticked) => `- [${ticked ? 'x' : ' '}] \`${x.id}\` **${x.title.replace(/[*_`\[\]]/g, '')}** · ${x.source} · ${x.tag} · [open](${x.link})`;
  return `<!-- padimachi-notes -->\n## Market notes waiting for your approval\n\nTick the notes you want on the website, then the site updates by itself within a few minutes. Untick to remove one. Only the headline and a link are shown, never the article.\n\n### Waiting\n${pending.slice(0, 25).map(x => row(x, false)).join('\n') || '_Nothing new right now._'}\n\n### Already shown on the website\n${notes.map(x => row(x, true)).join('\n') || '_None yet._'}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'issue') { const now = Date.now(); const p = readJson('pending.json', { list: [] }).list, n = readJson('notes.json', { list: [] }).list; process.stdout.write(issueBody(p.filter(x => !n.find(y => y.id === x.id)), n, now)); }
  else main().catch(e => { console.error(e); process.exit(0); });
}
