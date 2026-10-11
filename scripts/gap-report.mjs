// Content gap report: skills that new job posts ask for (data/insights.json) but that no learning page mentions.
// The learning pages are the generated /learn/*.html files (topic names, lessons and interview questions). General guide only: a person decides what to write.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.JOBS_ROOT || path.join(HERE, '..');
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const learnText = root => { const d = path.join(root, 'learn'); try { return fs.readdirSync(d).filter(f => f.endsWith('.html')).map(f => fs.readFileSync(path.join(d, f), 'utf8').replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ')).join(' ').toLowerCase(); } catch { return ''; } };
export const findGaps = (skills, text) => (skills || []).filter(x => x && x[0]).map(([name, n]) => ({ name, n, covered: new RegExp('(^|[^a-z0-9+#.])' + esc(String(name).toLowerCase()) + '(?![a-z0-9+#])').test(text) })).filter(x => !x.covered).map(x => [x.name, x.n]);
export function gaps(root = ROOT) {
  const text = learnText(root); if (text.length < 5000) return null;
  let ins = {}; try { ins = JSON.parse(fs.readFileSync(path.join(root, 'data', 'insights.json'), 'utf8')); } catch {}
  return findGaps(ins.skills || [], text).slice(0, 10);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(gaps()));
