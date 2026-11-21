/* LEGENDS XI — tournaments: World Cup, Champions League, Europa League — semi-finals & finals,
   broadcast-style match centre. Created by Dr HOSSAM Mo */
(function () {
'use strict';
const LX = window.LX, D = LX.D, S = LX.S, esc = LX.esc, I = LX.I;
const EN = () => LX.lang === 'en';
const M = D.matches || [], SEMIS = D.semis || [];
const byId = LX.matchById = {}; M.forEach(m => byId[m.id] = m);

LX.COMPS = {
  WC: { ar: 'كأس العالم', en: 'FIFA World Cup', k: 'WORLD CUP', ic: '🏆', cls: 'cwc', d: 'نصف النهائي والنهائي في كل النسخ منذ 1930 بالتشكيلات والهدافين.' },
  CL: { ar: 'دوري أبطال أوروبا', en: 'European Cup / Champions League', k: 'CHAMPIONS LEAGUE', ic: '⭐', cls: 'ccl', d: 'كل النهائيات منذ 1956 بالتشكيلات والهدافين، ونتائج نصف النهائي.' },
  EL: { ar: 'الدوري الأوروبي', en: 'UEFA Cup / Europa League', k: 'EUROPA LEAGUE', ic: '🥈', cls: 'cel', d: 'كل النهائيات منذ 1972 (ذهابًا وإيابًا حتى 1997) ونتائج نصف النهائي.' }
};
const compName = (c, y) => {
  if (c === 'CL') return y < 1993 ? 'كأس أوروبا للأندية البطلة' : 'دوري أبطال أوروبا';
  if (c === 'EL') return y < 2010 ? 'كأس الاتحاد الأوروبي' : 'الدوري الأوروبي';
  return 'كأس العالم';
};
const STG = { F: 'النهائي', SF: 'نصف النهائي', F1: 'النهائي — الذهاب', F2: 'النهائي — الإياب', R: 'النهائي — المباراة المعادة' };

/* ---------------- people: app player id or plain [null, en, ar] */
const who = p => {
  if (typeof p === 'string') { const x = LX.P(p); return x ? { id: p, ar: x.ar, en: x.en, p: x } : { id: null, ar: p, en: p }; }
  return { id: null, ar: EN() ? p[1] : p[2], en: p[1] };
};
const shortOf = w => w.p ? LX.shortName(w.p) : (w.ar.split(' ').filter(Boolean).slice(-1)[0] || w.ar);
const pkey = p => typeof p === 'string' ? p : 'N:' + p[1];
const team = c => LX.T(c) || { ar: c, en: c, c1: '#334', c2: '#fff', type: 'club', cc: '' };
const tname = c => team(c).ar.split(' / ')[0];
const yearOf = m => m.d.slice(0, 4);
const ISO = LX.iso;
const minute = s => ISO(String(s).replace('+', '+') + "'");

/* ---------------- winners */
function winnerOf(m) {
  if (m.pen) return m.pen[0] > m.pen[1] ? m.h : m.a;
  if (m.hs !== m.as) return m.hs > m.as ? m.h : m.a;
  return null;
}
/** edition summary: {c, y, finals:[...], winner, runner, label} */
LX.edition = (c, y) => {
  const fins = M.filter(m => m.c === c && m.y === y && m.st !== 'SF');
  if (!fins.length) return null;
  let win = null, run = null, score = '';
  const f1 = fins.find(m => m.st === 'F1'), f2 = fins.find(m => m.st === 'F2');
  if (f1 && f2) {
    const a = f2.a; // first leg home team = second leg away
    const ga = f1.hs + f2.as, gb = f1.as + f2.hs;
    if (f2.pen) win = winnerOf(f2);
    else if (ga !== gb) win = ga > gb ? f1.h : f1.a;
    else { const awayA = f2.as, awayB = f1.as; win = awayA > awayB ? f1.h : f1.a; }
    run = win === f1.h ? f1.a : f1.h;
    score = win === f1.h ? `${ga}–${gb}` : `${gb}–${ga}`; return { c, y, finals: [f1, f2], winner: win, runner: run, score, agg: true, a };
  }
  const last = fins.find(m => m.st === 'R') || fins.find(m => m.st === 'F') || fins[0];
  win = winnerOf(last); run = win === last.h ? last.a : last.h;
  return { c, y, finals: fins, winner: win, runner: run, score: win === last.a ? `${last.as}–${last.hs}` : `${last.hs}–${last.as}`, last };
};
const editions = c => [...new Set(M.filter(m => m.c === c).map(m => m.y))].sort((a, b) => b - a);

/* ---------------- small renderers */
const crest = (c, s) => LX.crest(c, s);
const resultLine = m => {
  const bits = [];
  if (m.x) bits.push(m.gg === 'golden' ? 'بالهدف الذهبي' : m.gg === 'silver' ? 'بالهدف الفضي' : 'بعد التمديد');
  if (m.pen) bits.push(`ركلات الترجيح ${ISO(m.pen[0] + '–' + m.pen[1])}`);
  if (m.agg) bits.push(`مجموع المباراتين ${ISO(m.agg[0] + '–' + m.agg[1])}${m.ag ? ' (بفارق الأهداف خارج الأرض)' : ''}`);
  return bits.join(' · ');
};
/** compact score card for lists */
LX.matchCard = m => {
  const w = winnerOf(m);
  return `<button class="mcard" data-m="${m.id}">
    <div class="mc-st">${esc(STG[m.st] || '')}<span>${ISO(m.d)}</span></div>
    <div class="mc-row ${w === m.h ? 'w' : ''}">${crest(m.h, 26)}<b>${esc(tname(m.h))}</b><span class="sc">${m.hs}</span></div>
    <div class="mc-row ${w === m.a ? 'w' : ''}">${crest(m.a, 26)}<b>${esc(tname(m.a))}</b><span class="sc">${m.as}</span></div>
    ${resultLine(m) ? `<div class="mc-x">${resultLine(m)}</div>` : ''}
  </button>`;
};

/* ---------------- hub */
LX.route(/^\/cups$/, root => {
  const main = LX.page(root, { title: 'البطولات الكبرى' }, `
    <p class="muted" style="margin:0 2px 12px">نصف النهائي والنهائي: من سجل الهدف، ومن طُرد، وكيف حُسمت المباراة، بتشكيلتي الفريقين على أرض الملعب.</p>
    <div class="cuphub">${Object.entries(LX.COMPS).map(([c, x]) => {
      const ys = editions(c); const e = LX.edition(c, ys[0]);
      return `<button class="cupcard ${x.cls}" data-c="${c}"><span class="tro">${x.ic}</span><span class="k">${x.k}</span><span class="t">${esc(EN() ? x.en : x.ar)}</span><span class="d">${esc(x.d)}</span>
        <span class="meta"><span>${ys.length} نسخة</span>${e && e.winner ? `<span>آخر بطل: ${crest(e.winner, 18)} ${esc(tname(e.winner))} ${ISO(String(ys[0]))}</span>` : ''}</span></button>`;
    }).join('')}</div>
    <div class="section-t">مباريات خالدة</div>
    <div class="mgrid">${['cl2005f', 'wc197030', 'wc202264', 'cl1999f', 'wc195022', 'el2001f', 'wc201461', 'cl1960f'].map(id => byId[id]).filter(Boolean).map(LX.matchCard).join('')}</div>`);
  main.onclick = e => { const c = e.target.closest('[data-c]'); if (c) return LX.go('/cup/' + c.dataset.c); const m = e.target.closest('[data-m]'); if (m) LX.go('/match/' + m.dataset.m); };
});

/* ---------------- editions list */
LX.route(/^\/cup\/(WC|CL|EL)$/, (root, c) => {
  const x = LX.COMPS[c]; const ys = editions(c);
  const titles = {};
  ys.forEach(y => { const e = LX.edition(c, y); if (e && e.winner) titles[e.winner] = (titles[e.winner] || 0) + 1; });
  const top = Object.entries(titles).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const main = LX.page(root, { title: esc(EN() ? x.en : x.ar) }, `
    <div class="cuphead ${x.cls}"><span class="tro">${x.ic}</span><div><div class="k">${x.k}</div><div class="t">${ys.length} نسخة في القاعدة</div></div></div>
    <div class="section-t">الأكثر تتويجًا <small>في النسخ المسجلة</small></div>
    <div class="kings">${top.map(([t, n]) => `<button class="king" data-t="${t}">${crest(t, 30)}<b>${esc(tname(t))}</b><span>${n}</span></button>`).join('')}</div>
    <div class="section-t">كل النسخ</div>
    <div class="edlist">${ys.map(y => { const e = LX.edition(c, y); if (!e) return ''; const f = e.agg ? e.finals[0] : e.last;
      return `<button class="ed" data-y="${y}"><span class="yr">${ISO(String(y))}</span>${crest(e.winner || f.h, 30)}<span class="grow"><b>${esc(tname(e.winner || f.h))}</b><small>${e.winner ? 'على ' : ''}${esc(tname(e.runner || f.a))} · ${ISO(e.score)}${e.agg ? ' (مجموع)' : ''}${e.last && e.last.pen ? ' · ترجيح' : ''}${e.last && e.last.x && !e.last.pen ? ' · تمديد' : ''}</small></span><span class="chev">${I.back}</span></button>`; }).join('')}</div>`);
  main.onclick = e => { const b = e.target.closest('[data-y]'); if (b) return LX.go(`/cup/${c}/${b.dataset.y}`); const t = e.target.closest('[data-t]'); if (t) LX.go('/team/' + t.dataset.t); };
});

/* ---------------- one edition: final(s) + semi-finals */
LX.route(/^\/cup\/(WC|CL|EL)\/(\d{4})$/, (root, c, y) => {
  y = +y; const e = LX.edition(c, y); if (!e) return LX.go('/cup/' + c);
  const ys = editions(c); const i = ys.indexOf(y);
  const prev = ys[i + 1], next = ys[i - 1];
  const sfm = M.filter(m => m.c === c && m.y === y && m.st === 'SF');
  const sft = SEMIS.filter(s => s.c === c && s.y === y);
  const tie = s => {
    if (s.grp) return `<div class="tie"><div class="muted" style="font-size:12.5px">لم يُلعب نصف نهائي هذا الموسم: تأهل متصدرا المجموعتين إلى النهائي.</div><div class="row" style="gap:10px;margin-top:6px">${s.grp.map(t => `<span class="chip">${crest(t, 18)} ${esc(tname(t))}</span>`).join('')}</div></div>`;
    const sc = x => ISO(EN() ? x[0] + '–' + x[1] : x[1] + '–' + x[0]);   // number next to its team on screen
    const legs = s.one ? `<span class="lg">${sc(s.one)}</span>` : `<span class="lg">${sc(s.l1)}</span><span class="lg">${sc(s.l2)}</span><span class="lg agg">${sc(s.agg)}</span>`;
    return `<div class="tie"><div class="tt"><span class="tm">${crest(s.a, 22)} ${esc(tname(s.a))}</span><span class="vs">${legs}</span><span class="tm">${crest(s.b, 22)} ${esc(tname(s.b))}</span></div>
      <div class="muted" style="font-size:11.5px;margin-top:4px">${s.one ? 'مباراة واحدة' : 'الذهاب · الإياب · المجموع'}${s.note ? ' — ' + esc(noteAr(s.note)) : ''}</div></div>`;
  };
  const main = LX.page(root, { title: `${esc(compName(c, y))} ${ISO(String(y))}` }, `
    <div class="edhero ${LX.COMPS[c].cls}">
      <div class="k">${LX.COMPS[c].k} ${ISO(String(y))}</div>
      <div class="champ">${crest(e.winner, 64)}<div><div class="lbl">البطل</div><div class="nm">${esc(tname(e.winner))}</div><div class="ru">الوصيف: ${esc(tname(e.runner))}</div></div></div>
    </div>
    <div class="section-t">${e.finals.length > 1 ? 'النهائي' + (e.agg ? ' — مباراتا الذهاب والإياب' : ' والمباراة المعادة') : 'النهائي'}</div>
    <div class="mgrid">${e.finals.map(LX.matchCard).join('')}</div>
    ${e.agg ? `<div class="aggbar">مجموع المباراتين: ${ISO(e.score)} لصالح ${esc(tname(e.winner))}</div>` : ''}
    <div class="section-t">نصف النهائي ${c !== 'WC' ? '<small>النتائج</small>' : ''}</div>
    ${sfm.length ? `<div class="mgrid">${sfm.map(LX.matchCard).join('')}</div>` : ''}
    ${sft.length ? sft.map(tie).join('') : ''}
    ${!sfm.length && !sft.length ? `<div class="empty">${c === 'WC' && (y === 1950 || y === 1974 || y === 1978) ? 'لم يُقم دور نصف نهائي في هذه النسخة (نظام المجموعات النهائية).' : 'لا توجد بيانات لنصف النهائي.'}</div>` : ''}
    <div class="row" style="justify-content:space-between;margin-top:16px">
      ${prev ? `<button class="btn ghost" data-y="${prev}">‹ ${ISO(String(prev))}</button>` : '<span></span>'}
      ${next ? `<button class="btn ghost" data-y="${next}">${ISO(String(next))} ›</button>` : '<span></span>'}
    </div>`);
  main.onclick = ev => { const m = ev.target.closest('[data-m]'); if (m) return LX.go('/match/' + m.dataset.m); const b = ev.target.closest('[data-y]'); if (b) location.replace(`#/cup/${c}/${b.dataset.y}`); };
});
const noteAr = n => n.replace('aet', 'بعد التمديد').replace(/away goals/, 'بفارق الأهداف خارج الأرض').replace(/play-off (\d+-\d+), (\w+)/, 'مباراة فاصلة $1 في $2').replace(/(\w[\w .]*) (\d+-\d+) pens/, 'ركلات الترجيح $2 لـ$1');

/* ---------------- match centre */
function goalsBy(m) {
  const n = {};
  m.g.forEach(g => { if (g[3] === 'og') return; const k = pkey(g[2]); n[k] = (n[k] || 0) + 1; });
  return n;
}
function rowsFrom(form, L) {
  let rows = String(form || '').split('-').map(Number).filter(Boolean);
  const xi = L.filter(x => x.pos !== 'SUB');
  if (rows.reduce((a, b) => a + b, 0) !== xi.length - 1) {
    const c = { DF: 0, MF: 0, FW: 0 }; xi.slice(1).forEach(x => c[LX.posGroup(x.pos)]++);
    rows = [c.DF, c.MF, c.FW].filter(Boolean);
  }
  return rows;
}
/** both teams on one pitch: home attacks up (bottom half), away attacks down (top half, mirrored) */
function bothPitch(m) {
  const goals = goalsBy(m), reds = new Set((m.r || []).map(r => pkey(r[2])));
  const side = (L, form, top) => {
    const xi = L.filter(x => x.pos !== 'SUB'); const rows = rowsFrom(form, L);
    const pts = [[50, top ? 6 : 94]]; const k = rows.length;
    rows.forEach((cnt, ri) => {
      const y0 = top ? 15 : 85, y1 = top ? 44 : 56;
      const y = k === 1 ? (y0 + y1) / 2 : y0 + (y1 - y0) * ri / (k - 1);
      for (let i = 0; i < cnt; i++) {
        const spread = cnt === 1 ? 0 : Math.min(86, 21 * (cnt - 1) + 6);
        let x = 50 + spread / 2 - (cnt === 1 ? 0 : spread * i / (cnt - 1));
        if (top) x = 100 - x;
        pts.push([x, y]);
      }
    });
    return xi.map((x, i) => {
      const w = who(x.p), pt = pts[i] || [50, 50], k_ = pkey(x.p), t = team(top ? m.a : m.h);
      const g = goals[k_] || 0;
      return `<button class="fp ${top ? 'aw' : 'hm'}" ${w.id ? `data-p="${w.id}"` : 'disabled'} style="left:${pt[0]}%;top:${pt[1]}%;--c1:${t.c1};--c2:${t.c2}">
        ${w.id ? LX.ph(w.id, 34) : `<div class="ph" style="width:34px;height:34px;font-size:12px;background:linear-gradient(145deg,${t.c1},#16213a)"><span class="ini">${esc((w.en.split(/[\s.]+/).filter(Boolean).slice(-1)[0] || '?').slice(0, 2).toUpperCase())}</span></div>`}
        ${x.n ? `<span class="no">${x.n}</span>` : ''}${x.c ? '<span class="cap">C</span>' : ''}
        <span class="nm">${esc(shortOf(w))}</span>
        <span class="bd">${g ? `<i class="gl">${'⚽'.repeat(Math.min(g, 4))}</i>` : ''}${reds.has(k_) ? '<i class="rc"></i>' : ''}${x.off ? `<i class="so">▼${esc(String(x.off))}</i>` : ''}</span>
      </button>`;
    }).join('');
  };
  return `<div class="fullpitch">${fullLines()}
    <div class="tlabel top">${crest(m.a, 20)} ${esc(tname(m.a))} <span>${esc(m.f[1] || '')}</span></div>
    <div class="tlabel bot">${crest(m.h, 20)} ${esc(tname(m.h))} <span>${esc(m.f[0] || '')}</span></div>
    ${side(m.L[0], m.f[0], false)}${side(m.L[1], m.f[1], true)}</div>`;
}
const fullLines = () => `<svg class="lines" viewBox="0 0 68 105" preserveAspectRatio="none"><g fill="none" stroke="rgba(255,255,255,.5)" stroke-width=".35">
 <rect x="2" y="2" width="64" height="101"/><line x1="2" y1="52.5" x2="66" y2="52.5"/><circle cx="34" cy="52.5" r="8"/>
 <rect x="14" y="2" width="40" height="16"/><rect x="24" y="2" width="20" height="5.5"/><rect x="14" y="87" width="40" height="16"/><rect x="24" y="97.5" width="20" height="5.5"/>
 <path d="M27 18 A8 8 0 0 0 41 18"/><path d="M27 87 A8 8 0 0 1 41 87"/></g><circle cx="34" cy="52.5" r=".7" fill="#fff"/></svg>`;

function timeline(m) {
  const ev = [];
  m.g.forEach(g => ev.push({ t: g[0], s: g[1], k: g[3] === 'og' ? 'og' : g[3] === 'p' ? 'pen' : 'goal', p: g[2] }));
  (m.r || []).forEach(r => ev.push({ t: r[0], s: r[1], k: 'red', p: r[2] }));
  const num = t => { const a = String(t).split('+'); return (+a[0] || 0) + (+(a[1] || 0)) / 100; };
  ev.sort((a, b) => num(a.t) - num(b.t));
  if (!ev.length) return '<div class="empty" style="padding:12px">لم تُسجل أهداف في الوقت الأصلي والإضافي.</div>';
  let h = 0, a = 0;
  return `<div class="tline">${ev.map(e => {
    if (e.k !== 'red') { if (e.s === 0) h++; else a++; }
    const w = who(e.p);
    const ic = e.k === 'red' ? '<i class="rc"></i>' : '⚽';
    const tag = e.k === 'pen' ? ' <small>(جزاء)</small>' : e.k === 'og' ? ' <small>(في مرماه)</small>' : '';
    const body = `<span class="ev ${e.k}">${ic} ${w.id ? `<a data-p="${w.id}">${esc(w.ar)}</a>` : esc(w.ar)}${tag}${e.k !== 'red' ? ` <span class="run">${ISO(h + '–' + a)}</span>` : ''}</span>`;
    return `<div class="gtl ${e.s === 0 ? 'l' : 'r'}">${e.s === 0 ? body : '<span></span>'}<span class="mn">${minute(e.t)}</span>${e.s === 1 ? body : '<span></span>'}</div>`;
  }).join('')}</div>`;
}
function lineupList(m, i) {
  const L = m.L[i], goals = goalsBy(m);
  const xi = L.filter(x => x.pos !== 'SUB'), subs = L.filter(x => x.pos === 'SUB');
  const r = (x, sub) => { const w = who(x.p), g = goals[pkey(x.p)] || 0;
    return `<div class="lu ${w.id ? 'lnk' : ''}" ${w.id ? `data-p="${w.id}"` : ''}><span class="n">${x.n || ''}</span><span class="pos">${esc(sub ? '' : x.pos)}</span><span class="nm">${esc(w.ar)}${x.c ? ' <b class="capb">(ق)</b>' : ''}${g ? ` <i>${'⚽'.repeat(Math.min(g, 4))}</i>` : ''}</span><span class="mv">${sub && x.on ? `<b class="up">▲ ${esc(String(x.on))}</b>` : ''}${x.off ? `<b class="dn">▼ ${esc(String(x.off))}</b>` : ''}</span></div>`; };
  return `<div class="luteam"><div class="luh">${crest(i ? m.a : m.h, 26)}<b>${esc(tname(i ? m.a : m.h))}</b><span class="f">${esc(m.f[i] || '')}</span></div>
    ${xi.map(x => r(x, false)).join('')}${subs.length ? `<div class="lusep">البدلاء المشاركون</div>${subs.map(x => r(x, true)).join('')}` : ''}</div>`;
}
function shootout(m) {
  if (!m.pk || !m.pk.length) return '';
  const rows = [[], []]; m.pk.forEach(k => rows[k[0]].push(k));
  const cell = k => `<span class="pk ${k[2] ? 'in' : 'out'}" title="${esc(who(k[1]).ar)}">${k[2] ? '●' : '✕'}</span>`;
  return `<div class="section-t">ركلات الترجيح <small>${ISO(m.pen[0] + '–' + m.pen[1])}</small></div>
   <div class="pkbox">${[0, 1].map(s => `<div class="pkr"><span class="t">${crest(s ? m.a : m.h, 20)} ${esc(tname(s ? m.a : m.h))}</span><span class="pks">${rows[s].map(cell).join('')}</span></div>`).join('')}
   <div class="muted" style="font-size:11.5px;margin-top:6px">${m.pk.map(k => `${esc(shortOf(who(k[1])))} ${k[2] ? '✔' : '✘'}`).join(' · ')}</div></div>`;
}
LX.route(/^\/match\/([^/]+)$/, (root, id) => {
  const m = byId[id]; if (!m) return LX.go('/cups');
  const H = team(m.h), A = team(m.a), w = winnerOf(m);
  const sib = M.filter(x => x.c === m.c && x.y === m.y && x.id !== m.id && (m.st === 'SF' ? x.st === 'SF' : x.st !== 'SF'));
  const SRC = { wcdb: 'Fjelstul World Cup Database', 'rsssf+wcdb': 'RSSSF + Fjelstul World Cup Database', rsssf: 'RSSSF', uefa: 'UEFA.com' };
  const main = LX.page(root, { title: `${esc(STG[m.st])} · ${ISO(yearOf(m))}` }, `
    <div class="scoreboard" style="--h1:${H.c1};--a1:${A.c1}">
      <div class="sbc">${esc(compName(m.c, m.y))} ${ISO(String(m.y))} — ${esc(STG[m.st])}</div>
      <div class="sbm">
        <button class="sbt ${w === m.h ? 'win' : ''}" data-t="${m.h}">${crest(m.h, 54)}<b>${esc(tname(m.h))}</b></button>
        <div class="sbs"><span>${m.hs}</span><i>:</i><span>${m.as}</span></div>
        <button class="sbt ${w === m.a ? 'win' : ''}" data-t="${m.a}">${crest(m.a, 54)}<b>${esc(tname(m.a))}</b></button>
      </div>
      ${resultLine(m) ? `<div class="sbx">${resultLine(m)}</div>` : ''}
      <div class="sbmeta">${I.cal.replace('<svg', '<svg style="width:14px;height:14px;vertical-align:-2px"')} ${ISO(m.d)} · 🏟️ ${esc(m.v)}</div>
    </div>
    ${m.n && m.n.length ? `<div class="notes"><div class="h">📝 أبرز أحداث المباراة</div>${m.n.map(t => `<p dir="rtl" lang="ar">${LX.nums(esc(t))}</p>`).join('')}</div>` : ''}
    <div class="section-t">مجريات الأهداف</div>${timeline(m)}
    ${shootout(m)}
    <div class="section-t">التشكيلتان على أرض الملعب</div>
    ${bothPitch(m)}
    <div class="lugrid">${lineupList(m, 0)}${lineupList(m, 1)}</div>
    ${(m.sq || []).some(Boolean) ? `<div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap">${(m.sq || []).map((q, i) => q ? `<button class="btn ghost" data-s="${q}">${I.shirt.replace('<svg', '<svg style="width:16px;height:16px"')} تشكيلة ${esc(tname(i ? m.a : m.h))} بالبطاقات</button>` : '').join('')}</div>` : ''}
    ${sib.length ? `<div class="section-t">${m.st === 'SF' ? 'نصف النهائي الآخر' : 'مباريات النهائي الأخرى'}</div><div class="mgrid">${sib.map(LX.matchCard).join('')}</div>` : ''}
    <div class="row" style="gap:8px;margin-top:12px"><button class="btn ghost" data-ed="1">${I.trophy.replace('<svg', '<svg style="width:16px;height:16px"')} كل مباريات نسخة ${ISO(String(m.y))}</button></div>
    <p class="muted" style="font-size:11.5px;margin-top:12px">المصدر: ${esc(SRC[m.src] || m.src)}${m.c === 'WC' ? ' (CC-BY-SA 4.0)' : ''}. الدقائق كما وردت في المصدر؛ قد تختلف دقيقة أو اثنتين بين المراجع. اللاعبون غير المسجلين في قاعدة التطبيق يظهرون بأسمائهم فقط.</p>`);
  main.onclick = ev => {
    const p = ev.target.closest('[data-p]'); if (p) return LX.go('/player/' + p.dataset.p);
    const t = ev.target.closest('[data-t]'); if (t) return LX.go('/team/' + t.dataset.t);
    const s = ev.target.closest('[data-s]'); if (s) return LX.go('/squad/' + s.dataset.s);
    const mm = ev.target.closest('[data-m]'); if (mm) return LX.go('/match/' + mm.dataset.m);
    if (ev.target.closest('[data-ed]')) LX.go(`/cup/${m.c}/${m.y}`);
  };
});

/* ---------------- player profile hook: knockout appearances */
LX.matchesOf = pid => M.filter(m => m.L.some(L => L.some(x => x.p === pid)) || m.g.some(g => g[2] === pid));
})();
