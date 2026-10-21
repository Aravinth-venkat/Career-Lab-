// Loads the live site's search, knowledge-base and profile-writer logic for the React pages.
// The live files are copied (genD.mjs) as factories and run against a tiny stand-in for the live UI object.
import { D } from './lib.js';
import '../../cl-src/js/faq.js';
import JOBS from '../../cl-src/js/jobs.js';
import STUDY from '../../cl-src/js/study.js';
import PJ from '../../cl-src/js/lab-data-js.js'; import PP from '../../cl-src/js/lab-data-py.js'; import PS from '../../cl-src/js/lab-data-sn.js';
import '../../cl-src/js/companies-data.js';
import mkWatch from './liveWatch.js'; import mkSmart from './liveSmart.js'; import mkKb from './liveKb.js'; import mkPk from './livePk.js';
import { C } from './lib.js';
import ladderMod from './ladderLoad.js';

const LADDER = ladderMod;

export const H = { S: {} };           // the page keeps H.S pointing at the current saved state
export const LAB = { sn: [], js: [], web: [], py: [], java: [] };
[PJ, PP, PS].forEach(p => p && Object.keys(LAB).forEach(k => LAB[k].push(...(p[k] || []))));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const trackOf = id => D.TRACKS.find(t => t.id === id);
const UI = {
  $: () => null, $$: () => [], esc, D, C, mount() {}, save() {}, toast() {}, trackOf, VIEWS: {}, LAB,
  get S() { return H.S; },
  myTracks() { const S = H.S, r = C.detectTrack(S.resume || '', D.SKILLS).map(x => x.track); if (S.track && !r.includes(S.track)) r.unshift(S.track); return r.slice(0, 2); },
  uploader() {},
};
const root = { UI, LADDER: ladderMod, JOBS, FAQ: window.FAQ, STUDY, SpeechRecognition: null };
export { LADDER, JOBS, STUDY, trackOf, esc };
export const smart = mkSmart(root).smart;
export const kb = mkKb(root).kb;
export const pk = mkPk(root).profileKit;
export const wt = mkWatch(root);
export const COMPANIES = window.COMPANIES || { co: [], kinds: {} };
