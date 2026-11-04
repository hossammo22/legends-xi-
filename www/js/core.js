/* LEGENDS XI — core engine. Created by Dr HOSSAM Mo */
(function () {
'use strict';
const LX = window.LX = {};
const D = LX.D = window.LXI_DB;
LX.SIG = 'Created by Dr HOSSAM Mo';
LX.NOW = new Date().getFullYear();

/* ---------------- storage */
const S = LX.S = {
  get(k, d) { try { const v = localStorage.getItem('lxi.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('lxi.' + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem('lxi.' + k); } catch (e) {} }
};

/* ---------------- eras (half-open, by season start year: no double counting) */
LX.ERAS = [
  { id: 'g60', a: 1960, b: 1980, label: '\u20661960–1980\u2069', ar: 'الأجيال الكلاسيكية', d: 'من بيليه وأوزيبيو إلى كرويف وبيكنباور' },
  { id: 'g80', a: 1980, b: 2000, label: '\u20661980–2000\u2069', ar: 'جيل الأساطير', d: 'مارادونا، بلاتيني، فان باستن، خوليت، ماتيوس، باجيو' },
  { id: 'g00', a: 2000, b: 2015, label: '\u20662000–2015\u2069', ar: 'جيل الألفية', d: 'زيدان، رونالدو الظاهرة، رونالدينيو، هنري، كاكا، تشافي وإنييستا' },
  { id: 'g15', a: 2015, b: 9999, label: '\u20662015\u2069–الآن', ar: 'الجيل الحديث', d: 'مبابي، هالاند، صلاح، دي بروين، بيلينغهام، يامال' },
  { id: 'all', a: 0, b: 9999, label: 'كل الأجيال', ar: 'كل الأجيال', d: 'كل اللاعبين والتشكيلات المتاحة' }
];
LX.era = () => LX.ERAS.find(e => e.id === S.get('era', 'all')) || LX.ERAS[4];
LX.setEra = id => { S.set('era', id); document.dispatchEvent(new Event('era')); };
LX.inEra = (p, e) => { e = e || LX.era(); if (!p.yr) return false; return p.yr[0] < e.b && p.yr[1] > e.a; };
LX.squadInEra = (s, e) => { e = e || LX.era(); return s.s >= e.a && s.s < e.b; };

/* ---------------- difficulty */
LX.DIFFS = [
  { id: 1, ar: 'متوسط', en: 'MEDIUM', pts: 100, clues: 5, cls: 'd1', d: 'لاعبون معروفون ومعلومات واضحة لعشاق الكرة.' },
  { id: 2, ar: 'صعب', en: 'HARD', pts: 150, clues: 4, cls: 'd2', d: 'لاعبون من أجيال مختلفة ومسيرات أقل وضوحًا.' },
  { id: 3, ar: 'صعب جدًا', en: 'VERY HARD', pts: 200, clues: 3, cls: 'd3', d: 'لاعبون أقل شهرة ومسيرات معقدة للمؤرخين.' },
  { id: 4, ar: 'أسطوري', en: 'LEGENDARY', pts: 300, clues: 2, cls: 'd4', d: 'لاعبون منسيون ووصلات صارمة للخبراء فقط.' }
];
LX.diff = id => LX.DIFFS.find(d => d.id === +id) || LX.DIFFS[0];

/* ---------------- lookups */
LX.P = id => D.players[id];
LX.T = id => D.teams[id];
LX.squadById = {}; D.squads.forEach(s => LX.squadById[s.id] = s);
LX.squadsOf = {}; D.squads.forEach(s => s.p.forEach(x => (LX.squadsOf[x[2]] = LX.squadsOf[x[2]] || []).push(s)));
LX.allPlayers = Object.values(D.players);
LX.spell = c => c[5] ? `منذ ${LX.iso(String(c[1]))}` : LX.span(c[1], Math.min(c[2], LX.NOW));
LX.wcYears = p => (p.wc || []).map(w => w[0]);
LX.yearsLabel = p => {
  if (p.cl.length && p.cs !== 'tm' || !p.wc) return p.yr ? LX.iso(p.yr[0] + '–' + (p.yr[1] >= LX.NOW ? 'الآن' : p.yr[1])) : '';
  return 'مونديال ' + LX.wcYears(p).join('، ');
};
LX.verLabel = v => ({ src: 'موثقة', kb: 'معرفة تاريخية', wcdb: 'قاعدة كأس العالم' }[v] || v);
LX.posGroup = pos => {
  pos = (pos || '').toUpperCase();
  if (pos === 'GK') return 'GK';
  if (/^(CB|RB|LB|SW|DF|RWB|LWB|WB)$/.test(pos)) return 'DF';
  if (/^(CF|FW|SS|RW|LW|OR|OL|RF|LF|IL|IR)$/.test(pos)) return 'FW';
  return 'MF';
};
LX.POSAR = { GK: 'حارس مرمى', DF: 'مدافع', MF: 'لاعب وسط', FW: 'مهاجم' };
LX.POSDETAIL = { GK: 'حارس مرمى', CB: 'قلب دفاع', SW: 'ليبرو', RB: 'ظهير أيمن', LB: 'ظهير أيسر', RWB: 'جناح دفاعي أيمن', LWB: 'جناح دفاعي أيسر', DM: 'وسط دفاعي', CM: 'وسط ميدان', AM: 'صانع ألعاب', RM: 'وسط أيمن', LM: 'وسط أيسر', RW: 'جناح أيمن', LW: 'جناح أيسر', CF: 'رأس حربة', SS: 'مهاجم ثانٍ', FW: 'مهاجم', MF: 'لاعب وسط', DF: 'مدافع', IL: 'مهاجم داخلي أيسر', IR: 'مهاجم داخلي أيمن', OR: 'جناح أيمن', OL: 'جناح أيسر', RH: 'نصف أيمن', LH: 'نصف أيسر', RF: 'مهاجم أيمن', LF: 'مهاجم أيسر', WB: 'ظهير جناح' };
LX.HONAR = { WC: 'كأس العالم', EURO: 'كأس الأمم الأوروبية', CA: 'كوبا أمريكا', AFCON: 'كأس الأمم الأفريقية', CL: 'دوري أبطال أوروبا', BDO: 'الكرة الذهبية', LIB: 'كوبا ليبرتادوريس' };
LX.HONIC = { WC: '🏆', EURO: '🇪🇺', CA: '🌎', AFCON: '🌍', CL: '⭐', BDO: '🥇', LIB: '🏅' };
const ISO = x => '\u2066' + x + '\u2069';
LX.iso = ISO;
LX.nums = t => String(t).replace(/\d+\s*[–-]\s*\d+/g, m => ISO(m));
LX.season = (a, b) => ISO((b - a <= 1) ? `${a}/${String(a + 1).slice(2)}` : `${a}–${b}`);
LX.span = (a, b) => b - a <= 1 ? LX.season(a, b) : ISO(`${a}–${b}`);
LX.flag = cc => {
  if (!cc || cc.length !== 2) return '';
  return String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
};
LX.teamName = id => { const t = LX.T(id); return t ? t.ar : id; };
LX.natName = p => LX.teamName(p.nat).split(' / ')[0];
LX.age = p => { if (!p.b) return ''; const y = +p.b.slice(0, 4); return LX.NOW - y; };
LX.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
LX.short = p => { const n = p.ar.replace(/".*?"/g, '').trim().split(' '); return n.length > 1 && n[0].length <= 3 ? n.slice(0, 2).join(' ') : (n.length > 2 ? n.slice(-1)[0] : n[n.length - 1]); };
LX.shortName = p => {
  const parts = p.ar.split(' ').filter(Boolean);
  if (parts.length <= 1) return p.ar;
  const last = parts[parts.length - 1];
  return last.length <= 2 ? parts.slice(-2).join(' ') : last;
};

/* ---------------- text normalisation + alias index */
const AR_DIAC = /[ً-ٰٟۖ-ۭـ]/g;
LX.norm = s => String(s || '').toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(AR_DIAC, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/[گ]/g, 'ك').replace(/[ڤ]/g, 'ف').replace(/[پ]/g, 'ب').replace(/[چ]/g, 'ج')
  .replace(/ø/g, 'o').replace(/ß/g, 'ss').replace(/æ/g, 'ae').replace(/ł/g, 'l').replace(/đ/g, 'd').replace(/ı/g, 'i')
  .replace(/["'`’‘.\-_،,()]/g, ' ').replace(/\s+/g, ' ').trim();
const nospace = s => s.replace(/ /g, '');
// Arabic transliteration variants for g/j, etc.
const variants = s => {
  const out = new Set([s, nospace(s)]);
  out.add(s.replace(/غ/g, 'ج')); out.add(s.replace(/ج/g, 'غ')); out.add(s.replace(/ج/g, 'ق'));
  out.add(s.replace(/^ال/, '')); out.add(s.replace(/ تش/g, ' ش').replace(/^تش/, 'ش'));
  out.add(s.replace(/ه$/, 'ة'.replace('ة', 'ه')));
  return [...out];
};
const IDX = LX.IDX = new Map(); // normalised key -> Set(playerId)
const addKey = (k, id) => { if (!k || k.length < 2) return; for (const v of variants(k)) { if (!IDX.has(v)) IDX.set(v, new Set()); IDX.get(v).add(id); } };
LX.allPlayers.forEach(p => {
  const en = LX.norm(p.en.replace(/".*?"/g, ' ')), ar = LX.norm(p.ar.replace(/".*?"/g, ' '));
  addKey(en, p.id); addKey(ar, p.id);
  (p.en.match(/"(.*?)"/) || []).slice(1).forEach(n => addKey(LX.norm(n), p.id));
  (p.ar.match(/"(.*?)"/) || []).slice(1).forEach(n => addKey(LX.norm(n), p.id));
  const enParts = en.split(' '), arParts = ar.split(' ');
  if (enParts.length > 1) { addKey(enParts[enParts.length - 1], p.id); addKey(enParts.slice(1).join(' '), p.id); }
  if (arParts.length > 1) { addKey(arParts[arParts.length - 1], p.id); addKey(arParts.slice(1).join(' '), p.id); }
  p.al.forEach(a => addKey(LX.norm(a), p.id));
});
const lev = (a, b) => {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const m = a.length, n = b.length; let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
};
/** Returns {ok, ids} for an answer. ok=true only when the target is matched and the answer is not
 *  more plausibly another player. Minor spelling errors tolerated when unambiguous. */
LX.matchAnswer = (input, targetId) => {
  const q = LX.norm(input); if (!q) return { ok: false };
  const exact = new Set();
  for (const v of variants(q)) { const hit = IDX.get(v); if (hit) hit.forEach(x => exact.add(x)); }
  if (exact.has(targetId)) return { ok: true, exact: true, amb: exact.size > 1 ? [...exact] : null };
  if (exact.size) return { ok: false, other: [...exact] };
  // fuzzy: tolerate 1 edit for words >= 4 chars, 2 edits for >= 8
  const tol = q.length >= 8 ? 2 : q.length >= 4 ? 1 : 0;
  if (!tol) return { ok: false };
  let best = [], bestD = 9;
  for (const [k, ids] of IDX) {
    if (Math.abs(k.length - q.length) > tol) continue;
    const d = lev(q, k);
    if (d < bestD) { bestD = d; best = [...ids]; } else if (d === bestD) best.push(...ids);
  }
  best = [...new Set(best)];
  if (bestD <= tol && best.length === 1 && best[0] === targetId) return { ok: true, fuzzy: true };
  if (bestD <= tol && best.includes(targetId) && best.length > 1) return { ok: false, amb: best };
  return { ok: false, other: bestD <= tol ? best : null };
};
LX.search = (q, limit = 30, filter) => {
  q = LX.norm(q); if (!q) return [];
  const res = [];
  for (const p of LX.allPlayers) {
    if (filter && !filter(p)) continue;
    const hay = p._hay || (p._hay = LX.norm(p.en + ' ' + p.ar + ' ' + p.al.join(' ')));
    const i = hay.indexOf(q);
    if (i >= 0) res.push([i === 0 ? 0 : (hay[i - 1] === ' ' ? 1 : 2), p.t, p]);
  }
  res.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return res.slice(0, limit).map(r => r[2]);
};

/* ---------------- teammate graph */
/* links: club overlaps ship pre-computed; squad & match links are rebuilt here from the verified squads */
const ADJ = LX.ADJ = {};
(() => {
  const G = new Map();
  const add = (a, b, e) => {
    if (a === b) return;
    for (const [x, y] of [[a, b], [b, a]]) {
      let m = G.get(x); if (!m) G.set(x, m = new Map());
      let l = m.get(y); if (!l) m.set(y, l = []);
      if (x === a) l.push(e);
    }
  };
  const addPair = (a, b, e) => {
    add(a, b, e);
    const l = G.get(a).get(b); G.get(b).set(a, l);
  };
  D.edges.forEach(([a, b, ev]) => ev.forEach(e => addPair(a, b, e)));
  D.squads.forEach(s => {
    const ids = s.p.map(x => x[2]), played = new Set(s.p.filter(x => x[3] !== 'SQ').map(x => x[2]));
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++)
      addPair(ids[i], ids[j], { k: played.has(ids[i]) && played.has(ids[j]) ? 'M' : 'S', t: s.team, s: s.id, y: [s.s, s.s + 1] });
  });
  (D.wcsq || []).forEach(w => {
    const ids = w.p.map(x => x[1]);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const ex = G.get(ids[i]) && G.get(ids[i]).get(ids[j]);
      if (ex && ex.some(e => e.t === w.team && e.y[0] === w.y)) continue;   // already linked by a full squad of the same tournament
      addPair(ids[i], ids[j], { k: 'S', t: w.team, w: w.y, y: [w.y, w.y + 1] });
    }
  });
  G.forEach((m, a) => { ADJ[a] = [...m]; });
  LX.linkCount = [...G.values()].reduce((n, m) => n + m.size, 0) / 2;
})();
LX.evidence = (a, b) => { const l = ADJ[a] || []; const f = l.find(x => x[0] === b); return f ? f[1] : null; };
LX.edgeOK = (ev, opt) => {
  if (!ev) return false;
  return ev.some(e => {
    const t = LX.T(e.t); const nt = t && t.type === 'nt';
    if (opt.only === 'club' && nt) return false;
    if (opt.only === 'nt' && !nt) return false;
    if (opt.matchOnly && e.k !== 'M') return false;
    return true;
  });
};
LX.bestEv = (ev, opt = {}) => {
  const ok = ev.filter(e => { const t = LX.T(e.t), nt = t && t.type === 'nt'; return !(opt.only === 'club' && nt) && !(opt.only === 'nt' && !nt) && !(opt.matchOnly && e.k !== 'M'); });
  const rank = { M: 0, S: 1, C: 2 };
  return ok.sort((x, y) => rank[x.k] - rank[y.k])[0] || ev[0];
};
/** BFS with options {only, matchOnly, forbid:Set, nodeOK(fn), maxDepth}; returns {path, dist, count} */
LX.bfs = (s, t, opt = {}) => {
  if (s === t) return { path: [s], dist: 0, count: 1 };
  const dist = { [s]: 0 }, cnt = { [s]: 1 }, prev = { [s]: null }; const q = [s]; let qi = 0;
  const maxD = opt.maxDepth || 12;
  while (qi < q.length) {
    const u = q[qi++]; if (dist[u] >= maxD) continue;
    if (t in dist && dist[u] >= dist[t]) break;
    for (const [v, ev] of ADJ[u] || []) {
      if (opt.forbid && opt.forbid.has(v) && v !== t) continue;
      if (opt.nodeOK && v !== t && !opt.nodeOK(LX.P(v))) continue;
      if (!LX.edgeOK(ev, opt)) continue;
      if (!(v in dist)) { dist[v] = dist[u] + 1; cnt[v] = cnt[u]; prev[v] = u; q.push(v); }
      else if (dist[v] === dist[u] + 1) cnt[v] = Math.min(9999, cnt[v] + cnt[u]);
    }
  }
  if (!(t in dist)) return null;
  const path = []; for (let x = t; x != null; x = prev[x]) path.unshift(x);
  return { path, dist: dist[t], count: cnt[t] };
};
LX.ballDist = (s, opt = {}, maxD = 8) => {
  const dist = { [s]: 0 }; const q = [s]; let qi = 0;
  while (qi < q.length) {
    const u = q[qi++]; if (dist[u] >= maxD) continue;
    for (const [v, ev] of ADJ[u] || []) {
      if (opt.forbid && opt.forbid.has(v)) continue;
      if (opt.nodeOK && !opt.nodeOK(LX.P(v))) continue;
      if (!LX.edgeOK(ev, opt)) continue;
      if (!(v in dist)) { dist[v] = dist[u] + 1; q.push(v); }
    }
  }
  return dist;
};
LX.evText = e => {
  const t = LX.T(e.t), tn = t ? t.ar : e.t;
  if (e.k === 'M' || e.k === 'S') {
    const s = LX.squadById[e.s];
    if (e.w) return { kind: 'زملاء في قائمة كأس العالم', team: tn, years: String(e.w), ev: `قائمة منتخب ${tn} في كأس العالم ${e.w}` };
    return { kind: e.k === 'M' ? 'زملاء في مباراة موثقة' : 'زملاء في قائمة موثقة', team: tn, years: s ? s.date.slice(0, 4) : '', ev: s ? `${s.comp} — ${s.match}` : '' };
  }
  return { kind: 'زملاء في الفريق الأول', team: tn, years: LX.span(e.y[0], e.y[1]), ev: 'تداخل فترتي اللعب في الفريق الأول لموسم كامل على الأقل' };
};

/* ---------------- seeded random */
LX.rng = seed => { let a = seed >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
LX.pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
LX.shuffle = (arr, r = Math.random) => { arr = arr.slice(); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
LX.today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
LX.hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/* ---------------- stats & achievements */
LX.stat = (k, v) => { const st = S.get('stats', {}); if (v === undefined) return st[k]; st[k] = v; S.set('stats', st); };
LX.bump = (k, n = 1) => LX.stat(k, (LX.stat(k) || 0) + n);
LX.best = (k, v) => { const b = S.get('best', {}); if (v === undefined) return b[k] || 0; if (v > (b[k] || 0)) { b[k] = v; S.set('best', b); return true; } return false; };
LX.ACH = [
  { id: 'first', ic: '⚽', t: 'البداية', d: 'أول إجابة صحيحة في خمن اللاعب' },
  { id: 'streak5', ic: '🔥', t: 'سلسلة نارية', d: '5 إجابات صحيحة متتالية' },
  { id: 'streak10', ic: '☄️', t: 'لا يُوقف', d: '10 إجابات صحيحة متتالية' },
  { id: 'legend', ic: '👑', t: 'خبير أسطوري', d: 'إجابة صحيحة في المستوى الأسطوري' },
  { id: 'link', ic: '🔗', t: 'صانع الوصلات', d: 'أكمل أول تحدي وصلات' },
  { id: 'shortest', ic: '📐', t: 'أقصر طريق', d: 'حل وصلة بأقصر مسار ممكن' },
  { id: 'timetravel', ic: '⏳', t: 'مسافر عبر الزمن', d: 'أكمل تحدي عبر الأجيال' },
  { id: 'missing', ic: '🧩', t: 'المحقق', d: 'اكتشف لاعبًا ناقصًا من تشكيلة تاريخية' },
  { id: 'dream', ic: '🌟', t: 'المدرب الحالم', d: 'احفظ فريق أحلامك الأول' },
  { id: 'daily', ic: '📅', t: 'وفيّ للتحدي', d: 'أكمل التحدي اليومي' },
  { id: 'daily7', ic: '🗓️', t: 'أسبوع كامل', d: '7 أيام متتالية في التحدي اليومي' },
  { id: 'k1000', ic: '💎', t: 'ألف نقطة', d: 'اجمع 1000 نقطة في جلسة واحدة' }
];
LX.unlock = id => {
  const a = S.get('ach', {}); if (a[id]) return;
  a[id] = LX.today(); S.set('ach', a);
  const x = LX.ACH.find(z => z.id === id); if (x) setTimeout(() => LX.toast(`${x.ic} إنجاز جديد: ${x.t}`, 'good', 2600), 600);
};

/* ---------------- haptics */
LX.buzz = ms => { try { if (S.get('vibe', true) && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };
})();
