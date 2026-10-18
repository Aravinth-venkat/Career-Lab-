// Checks that listed jobs are still open by looking at the job's own page. A job whose page says it has expired,
// or is gone (404/410), is marked closed and remembered so it is not listed again. Pages that block us are left alone.
const EXPIRED = /this job has expired|job (?:is )?(?:no longer|has been) (?:available|filled|closed|removed|posted)|this (?:job|position|posting|role|vacancy) (?:has been|is) (?:closed|filled|removed|expired)|(?:job|posting|position) (?:has )?expired|no longer accepting applications|sorry, this job|the job you are looking for (?:is|has)|position (?:has been|is) (?:filled|closed)|job not found/i;
export const isExpired = (status, body) => status === 404 || status === 410 || (status >= 200 && status < 300 && EXPIRED.test(String(body || '').slice(0, 200000).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ')));
const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function verify(jobs, { cap = 150, now = Date.now(), getPage, minAgeDays = 3, recheckDays = 6 } = {}) {
  const DAY = 864e5, due = jobs.filter(j => !j.x && j.u && !/^wd:/.test(j.id) && now - (j.s || 0) > 0 && now - (j.p || j.s || 0) > minAgeDays * DAY && now - (j.v || 0) > recheckDays * DAY).sort((a, b) => ((/^sr:/.test(a.id) ? 0 : 1) - (/^sr:/.test(b.id) ? 0 : 1)) || (a.v || 0) - (b.v || 0) || (a.p || 0) - (b.p || 0)).slice(0, cap);
  const closed = [], fixed = []; let i = 0, checked = 0;
  await Promise.all(Array.from({ length: 4 }, async () => { while (i < due.length) { const j = due[i++]; const r = await getPage(j.u); await sleep(60); if (!r || !r.status) continue; if (r.status === 403 || r.status === 429 || r.status >= 500) continue; checked++; if (isExpired(r.status, r.body)) { j.x = now; j.xv = 1; closed.push(j.id); } else { j.v = now; if (j.a && j.a !== j.u && /^https:/.test(j.a)) { const r2 = await getPage(j.a); await sleep(60); if (r2 && (r2.status === 404 || r2.status === 410)) { j.af = now; delete j.a; fixed.push(j.id); } } } } }));
  return { checked, closed, fixed };
}
