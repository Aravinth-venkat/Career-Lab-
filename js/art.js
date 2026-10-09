/* Career Lab SVG art: original illustrations generated per track (no external images). */
(function (root) {
  const HUE = { servicenow: 165, programming: 215, itfund: 260, hr: 330, finance: 145, sales: 25, ops: 45, support: 190, pm: 285, eng: 10, soft: 200, all: 230 };
  const h = id => HUE[id] === undefined ? 230 : HUE[id];
  const col = (id, l, s, a) => "hsl(" + h(id) + "," + (s || 80) + "%," + (l || 60) + "%" + (a === undefined ? "" : "," + a) + ")";
  let n = 0;
  function hero(id, icon) {
    const u = "a" + (++n), c1 = col(id, 55), c2 = col((id), 62, 85).replace(/\(\d+/, "(" + ((h(id) + 50) % 360));
    let dots = ""; for (let i = 0; i < 28; i++) dots += `<circle cx="${20 + (i % 7) * 52}" cy="${24 + Math.floor(i / 7) * 46}" r="2.4" fill="#fff" opacity=".35"/>`;
    return `<svg viewBox="0 0 400 240" role="img" aria-label="Illustration" class="art"><defs><linearGradient id="${u}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
<filter id="${u}s" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-opacity=".28"/></filter></defs>
<rect width="400" height="240" rx="26" fill="url(#${u}g)"/>${dots}
<circle cx="330" cy="40" r="70" fill="#fff" opacity=".12"/><circle cx="60" cy="210" r="90" fill="#fff" opacity=".1"/>
<g filter="url(#${u}s)"><rect x="92" y="52" width="216" height="140" rx="18" fill="#fff" opacity=".95"/>
<rect x="110" y="72" width="90" height="10" rx="5" fill="${c1}"/><rect x="110" y="92" width="160" height="7" rx="3.5" fill="#cbd5e1"/><rect x="110" y="107" width="128" height="7" rx="3.5" fill="#cbd5e1"/>
<rect x="110" y="132" width="40" height="40" rx="10" fill="${c2}" opacity=".85"/><rect x="160" y="148" width="14" height="24" rx="4" fill="${c1}"/><rect x="180" y="138" width="14" height="34" rx="4" fill="${c1}" opacity=".7"/><rect x="200" y="128" width="14" height="44" rx="4" fill="${c1}" opacity=".5"/>
<circle cx="268" cy="152" r="22" fill="none" stroke="#e2e8f0" stroke-width="8"/><path d="M268 130a22 22 0 0 1 20 31" fill="none" stroke="${c1}" stroke-width="8" stroke-linecap="round"/></g>
<g filter="url(#${u}s)"><circle cx="322" cy="62" r="30" fill="#fff"/><text x="322" y="73" text-anchor="middle" font-size="32">${icon || "🎯"}</text></g>
<g filter="url(#${u}s)"><rect x="40" y="130" width="92" height="40" rx="20" fill="#fff"/><circle cx="62" cy="150" r="9" fill="#22c55e"/><rect x="78" y="144" width="42" height="7" rx="3.5" fill="#94a3b8"/><rect x="78" y="156" width="28" height="6" rx="3" fill="#cbd5e1"/></g></svg>`;
  }
  /* small cover for topic cards */
  function cover(id, icon) {
    const u = "c" + (++n);
    return `<svg viewBox="0 0 200 90" preserveAspectRatio="xMidYMid slice" class="cover" aria-hidden="true"><defs><linearGradient id="${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${col(id, 52)}"/><stop offset="1" stop-color="${col(id, 66, 85).replace(/\(\d+/, "(" + ((h(id) + 45) % 360))}"/></linearGradient></defs><rect width="200" height="90" fill="url(#${u})"/><circle cx="170" cy="14" r="46" fill="#fff" opacity=".13"/><circle cx="20" cy="86" r="40" fill="#fff" opacity=".1"/><path d="M0 70 Q50 40 100 62 T200 52 V90 H0Z" fill="#fff" opacity=".12"/><text x="100" y="58" text-anchor="middle" font-size="40">${icon || "📘"}</text></svg>`;
  }
  /* inline mic waveform */
  function wave() { let b = ""; for (let i = 0; i < 18; i++) b += `<i style="animation-delay:${i * 70}ms"></i>`; return `<span class="wave" aria-hidden="true">${b}</span>`; }
  const api = { hero, cover, wave, hue: h };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Art = api;
})(typeof window !== "undefined" ? window : globalThis);
