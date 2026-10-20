import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { D, C, load, save, modeOf } from './lib.js';
export const Ctx = createContext();
export const useS = () => useContext(Ctx);
export function Provider({ children }) {
  const [S, setS] = useState(() => load());
  const set = useCallback(p => setS(o => { const n = { ...o, ...(typeof p === 'function' ? p(o) : p) }; save(n); return n; }), []);
  useEffect(() => { document.documentElement.dataset.theme = S.theme === 'light' ? 'light' : 'dark'; }, [S.theme]);
  return <Ctx.Provider value={{ S, set }}>{children}</Ctx.Provider>;
}

/* ---------- data ---------- */
let JOBS = null;
export const useJobs = () => { const [j, setJ] = useState(JOBS); useEffect(() => { if (JOBS) return; const fin = a => { JOBS = a; setJ(a); }; if (location.protocol === 'file:' || window.__JOBS__) return fin(window.__JOBS__ || []); fetch('data/jobs.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : Promise.reject()).then(d => fin((d.jobs || []).filter(x => !x.x))).catch(() => fin([])); }, []); return j; };
export const skillsOf = S => S.resume ? C.extractSkills(S.resume, D.SKILLS) : [];
export const FRESH = /fresher|trainee|intern\b|internship|entry[- ]level|graduate|campus|0\s*(?:-|to)\s*[12]\s*(?:years|yrs)/i; export const SENIOR = /\b(senior|sr\.?|lead|manager|principal|architect|head|director|vp)\b/i; export const URGENT = /urgent|immediate|asap|walk[- ]?in|hiring now/i;
export const ago = ts => { const d = Math.max(0, Math.round((Date.now() - ts) / 864e5)); return d < 1 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago'; };
export const stepsOf = S => { const a = Array.isArray(S.apps) ? S.apps : []; return [[!!S.resume, '📄', 'Upload resume', '#/resumepdf'], [!!S.resume, '📊', 'See your report', '#/report'], [!!(S.dims && S.dims.length), '🎤', 'Practise a question', '#/interview'], [!!S.sj, '💼', 'See matched jobs', '#/career'], [a.some(x => x.st && x.st !== 'wish'), '✅', 'Apply and track', '#/tracker']]; };
export const lastIdx = a => a.findIndex(x => !x[0]);


export { FRESH as _f };
