// Shared rules for tagging jobs. The same rules are copied into js/jobtags.js for the website (a test keeps them identical).
export const FRESHER = '\\b(freshers?|fresh graduates?|entry[- ]level|graduate trainee|trainee|campus|apprentice|internship|intern|no experience|0\\s*(?:-|to|–)\\s*[12]\\s*(?:years|yrs)|(?:less than|up to|under)\\s*[12]\\s*years?|recent graduates?)\\b';
export const SENIOR = '\\b(senior|sr\\.?|lead|manager|principal|architect|head|director|vp|vice president|staff|chief)\\b';
export const URGENT = '\\b(urgent(?:ly)?|immediate(?:ly)? (?:joiners?|joining|hiring|requirement|opening)|immediate joiners?|asap|hiring now|hot (?:opening|requirement)|quick joiners?)\\b|walk[- ]?in';
export const WALKIN = 'walk[- ]?in';
const re = s => new RegExp(s, 'i');
export const minYears = d => { const m = /(\d{1,2})\s*\+?\s*(?:to|-|–)?\s*(\d{1,2})?\s*\+?\s*(?:years|yrs)/i.exec(d || ''); return m ? +m[1] : null; };
export function classify(j) {
  const t = String(j.t || ''), d = String(j.d || ''), all = t + ' ' + d, y = minYears(d);
  const senior = re(SENIOR).test(t);
  const fresher = !senior && (re(FRESHER).test(all) || y === 0);
  return { fresher, urgent: re(URGENT).test(all), walkin: re(WALKIN).test(all) };
}
