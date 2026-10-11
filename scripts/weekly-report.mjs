// Prints a short weekly report (markdown) from the data files. Used by the weekly workflow to open a GitHub issue.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.JOBS_ROOT || path.join(HERE, '..'), DATA = path.join(ROOT, 'data');
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch { return d; } };
export function report(now) {
  const ins = readJson('insights.json', {}), health = readJson('health.json', { runs: [] }), st = readJson('status.json', {}), pend = readJson('pending.json', { list: [] }).list || [], notes = readJson('notes.json', { list: [] }).list || [], hire = readJson('hiring.json', { list: [] }).list || [], dead = readJson('boards-dead.json', {});
  const runs7 = (health.runs || []).filter(r => now - r.t <= 7 * 864e5), bad = runs7.filter(r => r.issues && r.issues.length).length;
  const fmt = a => (a || []).map(x => x[0] + ' (' + x[1] + ')').join(', ') || 'not enough data yet';
  const L = [];
  L.push('## Padimachi weekly report', '', `Week ending ${new Date(now).toISOString().slice(0, 10)}`, '', '### Job openings');
  L.push(`- Open now: **${ins.open ?? st.open ?? '?'}** across **${ins.companies ?? '?'}** companies`, `- Posted in the last 7 days: **${ins.new7 ?? '?'}**`, `- Fresher friendly: **${ins.fresher ?? '?'}**, urgent: **${ins.urgent ?? '?'}**, walk-in: **${ins.walkin ?? '?'}**`);
  L.push(`- Skills in demand: ${fmt(ins.skills)}`, `- Cities with most new openings: ${fmt(ins.cities)}`, `- Companies new to the list in the last 2 weeks: **${hire.filter(x => x.isNew).length}**`);
  L.push('', '### Updater health', `- Runs in the last 7 days: **${runs7.length}** (${bad} had a problem)`, `- Last run: boards loaded **${st.boardsOk ?? '?'}** of **${st.boards ?? '?'}**`);
  if (st.failed && st.failed.length) L.push(`- Boards that failed last run: ${st.failed.slice(0, 8).join(', ')}`);
  if (health.stale && health.stale.length) L.push(`- Boards returning "not found": ${health.stale.slice(0, 8).join(', ')}`);
  if (Object.keys(dead).length) L.push(`- Boards dropped as gone: ${Object.keys(dead).length}`);
  if (runs7.length < 8) L.push('- ⚠️ Fewer than 8 runs this week. GitHub may be skipping scheduled runs.');
  L.push('', '### Market notes', `- Waiting for your approval: **${pend.length}** (tick them in the "Market notes waiting for your approval" issue)`, `- Shown on the website: **${notes.length}**`);
  L.push('', '### Needs a human', '- Learning content, tips and healthcare content are not changed automatically. Review them when you add new topics.');
  return L.join('\n');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.stdout.write(report(Date.now()) + '\n');
