/* LEGENDS XI — Player Connections + Connection Path Reveal. Created by Dr HOSSAM Mo */
(function () {
'use strict';
const LX = window.LX, D = LX.D, S = LX.S, esc = LX.esc, I = LX.I;

LX.CMODES = [
  { id: 1, t: 'الوصلة الكلاسيكية', d: 'اربط لاعبين عبر زملاء موثقين.' },
  { id: 2, t: 'أقصر طريق', d: 'يجب أن تجد أقصر سلسلة ممكنة بالضبط.' },
  { id: 3, t: 'تحدي الثلاث وصلات', d: 'ثلاثة لاعبين وسطاء كحد أقصى.' },
  { id: 4, t: 'أندية فقط', d: 'كل الروابط عبر الأندية.' },
  { id: 5, t: 'منتخبات فقط', d: 'كل الروابط عبر المنتخبات (تشكيلات موثقة).' },
  { id: 6, t: 'عبر الأجيال', d: 'من أساطير الماضي إلى نجوم اليوم.' },
  { id: 7, t: 'لاعبون ممنوعون', d: 'نجوم محوريون غير مسموح باستخدامهم.' },
  { id: 8, t: 'الوصلات الأسطورية', d: 'سلاسل طويلة وزملاء غير متوقعين.' },
  { id: 9, t: 'اصنع تحديك', d: 'اختر البداية والنهاية والقيود بنفسك.' }
];
const RANGE = { 1: [2, 3], 2: [3, 4], 3: [4, 5], 4: [5, 7] };
const SLACK = { 1: 3, 2: 2, 3: 1, 4: 1 };

const baseOpt = (mode, cfg) => {
  const o = { matchOnly: !!cfg.matchOnly };
  if (mode === 4) o.only = 'club';
  if (mode === 5) o.only = 'nt';
  if (cfg.only) o.only = cfg.only;
  return o;
};
/** generate a playable, verified-solvable challenge */
LX.makeChallenge = (mode, diff, cfg = {}, r = Math.random) => {
  const era = cfg.era || LX.era(); const restricted = cfg.restricted && era.id !== 'all';
  const opt = baseOpt(mode, cfg);
  if (restricted) opt.nodeOK = p => LX.inEra(p, era);
  let [lo, hi] = RANGE[diff];
  if (mode === 3) { lo = Math.min(lo, 3); hi = 4; }
  if (mode === 8) { lo = 5; hi = 7; }
  if (mode === 5) { lo = Math.min(lo, 2); hi = Math.min(hi, 4); }
  const tierOK = p => mode === 8 ? p.t >= 2 : diff === 1 ? p.t === 1 : diff === 2 ? p.t <= 2 : diff === 3 ? p.t <= 3 : true;
  const old = p => p.yr && p.yr[0] < 1985, modern = p => p.yr && p.yr[1] >= 2016;
  let starts = LX.allPlayers.filter(p => LX.ADJ[p.id] && tierOK(p) && (!restricted || LX.inEra(p, era)) && (era.id === 'all' || LX.inEra(p, era)));
  const back = mode === 6 && era.id !== 'all' && era.a >= 2000; // modern era selected: travel back in time
  if (mode === 6) starts = starts.filter(back ? modern : old);
  if (mode === 5) starts = starts.filter(p => (LX.ADJ[p.id] || []).some(([, ev]) => LX.edgeOK(ev, { only: 'nt' })));
  starts = LX.shuffle(starts, r);
  for (const s of starts.slice(0, 60)) {
    const ball = LX.ballDist(s.id, opt, hi);
    let targets = Object.entries(ball).filter(([id, d]) => d >= lo && d <= hi).map(([id]) => LX.P(id)).filter(tierOK);
    if (mode === 6) targets = targets.filter(back ? old : modern);
    if (!restricted && era.id !== 'all' && mode !== 6) targets = targets.filter(p => p.t <= 2 || LX.inEra(p, era));
    if (!targets.length) continue;
    const t = LX.pick(targets, r);
    let res = LX.bfs(s.id, t.id, opt); if (!res) continue;
    let forbid = new Set();
    if (mode === 7) {
      // forbid the most famous intermediaries on the shortest route, then make sure it is still solvable
      const mids = res.path.slice(1, -1).map(LX.P).sort((a, b) => a.t - b.t || (LX.ADJ[b.id] || []).length - (LX.ADJ[a.id] || []).length);
      mids.slice(0, Math.min(3, mids.length)).forEach(p => forbid.add(p.id));
      const r2 = LX.bfs(s.id, t.id, { ...opt, forbid, maxDepth: hi + 2 }); if (!r2) continue; res = r2;
    }
    if (diff === 1 && res.count < 2 && mode !== 7) continue;
    return { mode, diff, s: s.id, t: t.id, opt: { ...opt, nodeOK: undefined }, restricted, eraId: era.id, forbid: [...forbid], dist: res.dist, count: res.count, best: res.path, maxMid: mode === 2 ? res.dist - 1 : mode === 3 ? 3 : res.dist - 1 + SLACK[diff] };
  }
  return null;
};
const nodeOKFor = ch => { if (!ch.restricted) return null; const e = LX.ERAS.find(x => x.id === ch.eraId); return p => LX.inEra(p, e); };

/* ---------------- setup */
LX.route(/^\/connect$/, root => {
  const mode = S.get('cmode', 1), diff = S.get('cdiff', 1), restricted = S.get('crestr', false), matchOnly = S.get('cmatch', false);
  const main = LX.page(root, { title: 'وصلات اللاعبين', gen: true }, `
    <div class="card"><div style="font-weight:900;font-size:18px">اربط بين لاعبين من عصور مختلفة</div><div class="muted" style="font-size:12.5px">الرابط صحيح فقط إذا كان اللاعبان زميلين فعلًا في نفس الفريق خلال فترة متداخلة موثقة — اللعب لنفس النادي في سنوات مختلفة لا يكفي.</div></div>
    <div class="section-t">وضع اللعب</div>
    <div class="modes">${LX.CMODES.map(m => `<button class="mode ${m.id === mode ? 'on' : ''}" data-m="${m.id}"><span class="no">MODE ${m.id}</span><span class="t">${m.t}</span><span class="d">${m.d}</span></button>`).join('')}</div>
    <div class="section-t">المستوى</div>
    <div class="tabs" id="df">${LX.DIFFS.map(d => `<button data-d="${d.id}" class="${d.id === diff ? 'on' : ''}">${d.ar}</button>`).join('')}</div>
    <div class="card" style="padding:0;margin-top:12px">
      <div class="setrow"><div class="t">مقيد بالجيل المختار<small>إيقافه = سفر عبر الأجيال: الجيل يحدد البداية، والوسطاء من أي عصر</small></div><button class="switch ${restricted ? 'on' : ''}" id="rs"></button></div>
      <div class="setrow"><div class="t">زملاء المباراة فقط<small>أصعب: الروابط من تشكيلات مباريات موثقة فقط</small></div><button class="switch ${matchOnly ? 'on' : ''}" id="mo"></button></div>
    </div>
    <button class="btn gold block" style="margin-top:16px;font-size:17px;padding:15px" id="go">${mode === 9 ? 'صمم التحدي' : 'ابدأ التحدي'}</button>`);
  main.querySelector('.modes').onclick = e => { const b = e.target.closest('[data-m]'); if (!b) return; S.set('cmode', +b.dataset.m); LX.render(); };
  main.querySelector('#df').onclick = e => { const b = e.target.closest('[data-d]'); if (!b) return; S.set('cdiff', +b.dataset.d); main.querySelectorAll('#df button').forEach(x => x.classList.toggle('on', x === b)); };
  main.querySelector('#rs').onclick = e => { e.currentTarget.classList.toggle('on'); S.set('crestr', e.currentTarget.classList.contains('on')); };
  main.querySelector('#mo').onclick = e => { e.currentTarget.classList.toggle('on'); S.set('cmatch', e.currentTarget.classList.contains('on')); };
  main.querySelector('#go').onclick = () => {
    if (S.get('cmode', 1) === 9) return LX.go('/connect/build');
    const ch = LX.makeChallenge(S.get('cmode', 1), S.get('cdiff', 1), { restricted: S.get('crestr', false), matchOnly: S.get('cmatch', false) });
    if (!ch) return LX.toast('لا يوجد تحدٍ قابل للحل بهذه القيود في الجيل الحالي — غيّر الجيل أو القيود', 'bad', 3000);
    LX._ch = ch; LX.go('/connect/play');
  };
});

/* ---------------- build your own */
LX.route(/^\/connect\/build(?:\/([^/]+))?$/, (root, from) => {
  const st = LX._build = (LX._build && !from) ? LX._build : { s: from || null, t: null, diff: 2, max: 4, only: '', forbid: [], matchOnly: false };
  const pcard = (id, lbl) => id ? `<div class="cnode ${lbl === 'start' ? 'start' : 'end'}">${LX.ph(id, 52)}<div class="grow"><div class="lbl">${lbl === 'start' ? 'START PLAYER' : 'TARGET PLAYER'}</div><div class="n">${esc(LX.P(id).ar)}</div></div><button class="btn sm" data-pick="${lbl}">تغيير</button></div>` : `<button class="cslot" data-pick="${lbl}"><span class="plus">+</span>${lbl === 'start' ? 'اختر لاعب البداية' : 'اختر اللاعب الهدف'}</button>`;
  const main = LX.page(root, { title: 'اصنع تحديك', gen: false }, `
    ${pcard(st.s, 'start')}<div style="height:10px"></div>${pcard(st.t, 'target')}
    <div class="section-t">الحد الأقصى للاعبين الوسطاء</div>
    <div class="tabs" id="mx">${[1, 2, 3, 4, 5, 6].map(n => `<button data-n="${n}" class="${n === st.max ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="section-t">نوع الروابط المسموح</div>
    <div class="tabs" id="on">${[['', 'أندية ومنتخبات'], ['club', 'أندية فقط'], ['nt', 'منتخبات فقط']].map(([k, l]) => `<button data-o="${k}" class="${k === st.only ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div class="section-t">المستوى</div>
    <div class="tabs" id="df">${LX.DIFFS.map(d => `<button data-d="${d.id}" class="${d.id === st.diff ? 'on' : ''}">${d.ar}</button>`).join('')}</div>
    <div class="section-t">لاعبون ممنوعون <button class="chip gold" id="addf">+ إضافة</button></div>
    <div class="row wrap" id="fb">${st.forbid.map(id => `<button class="chip red" data-rm="${id}">✕ ${esc(LX.P(id).ar)}</button>`).join('') || '<span class="muted" style="font-size:13px">لا يوجد</span>'}</div>
    <div class="card setrow" style="padding:12px;margin-top:12px"><div class="t">زملاء المباراة فقط</div><button class="switch ${st.matchOnly ? 'on' : ''}" id="mo"></button></div>
    <div id="chk" class="muted" style="margin-top:12px;font-size:13px"></div>
    <button class="btn gold block" style="margin-top:12px;padding:15px" id="go">تحقق وابدأ</button>`);
  main.onclick = e => {
    const pk = e.target.closest('[data-pick]');
    if (pk) return LX.pickPlayer({ title: pk.dataset.pick === 'start' ? 'لاعب البداية' : 'اللاعب الهدف', filter: p => !!LX.ADJ[p.id], onPick: p => { st[pk.dataset.pick === 'start' ? 's' : 't'] = p.id; LX.render(); } });
    const n = e.target.closest('[data-n]'); if (n) { st.max = +n.dataset.n; LX.render(); }
    const o = e.target.closest('[data-o]'); if (o) { st.only = o.dataset.o; LX.render(); }
    const d = e.target.closest('[data-d]'); if (d) { st.diff = +d.dataset.d; LX.render(); }
    const rm = e.target.closest('[data-rm]'); if (rm) { st.forbid = st.forbid.filter(x => x !== rm.dataset.rm); LX.render(); }
    if (e.target.closest('#addf')) LX.pickPlayer({ title: 'لاعب ممنوع', onPick: p => { if (!st.forbid.includes(p.id)) st.forbid.push(p.id); LX.render(); } });
    if (e.target.closest('#mo')) { st.matchOnly = !st.matchOnly; LX.render(); }
  };
  main.querySelector('#go').onclick = () => {
    const out = main.querySelector('#chk');
    if (!st.s || !st.t || st.s === st.t) { out.textContent = 'اختر لاعبين مختلفين للبداية والنهاية.'; return; }
    const opt = { only: st.only || undefined, matchOnly: st.matchOnly, forbid: new Set(st.forbid), maxDepth: st.max + 1 };
    const res = LX.bfs(st.s, st.t, opt);
    if (!res || res.dist - 1 > st.max) { out.innerHTML = `<span class="chip red">لا يوجد حل موثق بهذه القيود</span> — جرّب زيادة الحد الأقصى أو تخفيف القيود.`; return; }
    if (res.dist === 1) { out.innerHTML = '<span class="chip gold">اللاعبان زميلان مباشرة!</span> اختر لاعبين أبعد لتحدٍ حقيقي.'; return; }
    LX._ch = { mode: 9, diff: st.diff, s: st.s, t: st.t, opt: { only: st.only || undefined, matchOnly: st.matchOnly }, forbid: st.forbid.slice(), dist: res.dist, count: res.count, best: res.path, maxMid: st.max, restricted: false, eraId: 'all' };
    LX.go('/connect/play');
  };
});

/* ---------------- play */
LX.route(/^\/connect\/play$/, root => {
  const ch = LX._ch; if (!ch) return LX.go('/connect');
  const forbid = new Set(ch.forbid), d = LX.diff(ch.diff), nodeOK = nodeOKFor(ch);
  const st = { chain: [ch.s], links: [], mistakes: 0, hints: 0, done: false, t0: Date.now() };
  const mode = LX.CMODES.find(m => m.id === ch.mode);
  const main = LX.page(root, { title: mode.t, gen: true }, `<div id="b"></div>`);
  const b = main.querySelector('#b');
  const draw = () => {
    const mids = st.chain.length - 1, left = ch.maxMid - mids;
    b.innerHTML = `<div class="hud"><div class="lives">${[0, 1, 2].map(i => `<span class="${i < 3 - st.mistakes ? '' : 'off'}">${I.heart}</span>`).join('')}</div><div class="grow muted" style="font-size:12px;text-align:center"><span class="chip">${d.ar}</span> <span class="chip">${ch.opt.only === 'club' ? 'أندية فقط' : ch.opt.only === 'nt' ? 'منتخبات فقط' : 'أندية ومنتخبات'}</span>${ch.restricted ? ' <span class="chip gold">مقيد بالجيل</span>' : ''}</div><div class="chip gold">${left} وسيط متبقٍ</div></div>
      ${forbid.size ? `<div class="row wrap" style="margin-top:10px;gap:6px"><span class="muted" style="font-size:12px">ممنوع:</span>${[...forbid].map(id => `<span class="chip red">${esc(LX.P(id).ar)}</span>`).join('')}</div>` : ''}
      ${ch.mode === 2 ? `<div class="muted" style="font-size:12px;margin-top:8px">أقصر طريق = ${ch.dist - 1} وسيط بالضبط</div>` : ''}
      <div class="chain">
        ${st.chain.map((id, i) => `${i ? `<div class="clink ok">${linkLbl(st.links[i - 1])}</div>` : ''}<div class="cnode ${i === 0 ? 'start' : ''}">${LX.ph(id, 52)}<div class="grow">${i === 0 ? '<div class="lbl">START PLAYER</div>' : ''}<div class="n">${esc(LX.P(id).ar)}</div><div class="muted ltr" style="font-size:12px">${esc(LX.P(id).en)}</div></div></div>`).join('')}
        ${st.done ? `<div class="clink ok">${linkLbl(st.final)}</div>` : `<div class="clink">${left > 0 ? 'أضف زميلًا موثقًا…' : 'لم يعد هناك وسطاء متاحون'}</div>${left > 0 ? `<button class="cslot" id="add"><span class="plus">+</span>أضف لاعبًا وسيطًا</button><div class="clink">…</div>` : ''}`}
        <div class="cnode end">${LX.ph(ch.t, 52)}<div class="grow"><div class="lbl">TARGET PLAYER</div><div class="n">${esc(LX.P(ch.t).ar)}</div><div class="muted ltr" style="font-size:12px">${esc(LX.P(ch.t).en)}</div></div></div>
      </div>
      ${st.done ? '' : `<div class="row" style="margin-top:14px"><button class="btn sm grow" id="undo" ${st.chain.length < 2 ? 'disabled style="opacity:.4"' : ''}>تراجع</button><button class="btn sm grow" id="hint">${I.q} تلميح</button><button class="btn sm grow" id="give">كشف الحل</button></div>`}`;
    LX.loadPhotos(b);
    const add = b.querySelector('#add'); if (add) add.onclick = pick;
    const u = b.querySelector('#undo'); if (u) u.onclick = () => { if (st.chain.length > 1) { st.chain.pop(); st.links.pop(); draw(); } };
    const h = b.querySelector('#hint'); if (h) h.onclick = hint;
    const g = b.querySelector('#give'); if (g) g.onclick = () => finish(false);
  };
  const linkLbl = e => { if (!e) return ''; const x = LX.evText(e); return `${LX.crest(e.t, 18)} <b>${esc(x.team)}</b> · <span class="en">${esc(x.years)}</span>`; };
  const pick = () => LX.pickPlayer({
    title: 'من زميل ' + LX.P(st.chain[st.chain.length - 1]).ar + '؟',
    filter: p => !!LX.ADJ[p.id],
    onPick: p => tryAdd(p.id)
  });
  const fail = msg => { st.mistakes++; LX.buzz(120); LX.toast(msg, 'bad', 2400); if (st.mistakes >= 3) return finish(false); draw(); };
  const tryAdd = id => {
    const last = st.chain[st.chain.length - 1];
    if (st.chain.includes(id)) return LX.toast('اللاعب موجود بالفعل في السلسلة', 'bad');
    if (forbid.has(id)) return fail('هذا اللاعب ممنوع في هذا التحدي');
    if (nodeOK && id !== ch.t && !nodeOK(LX.P(id))) return fail('هذا اللاعب خارج الجيل المحدد');
    if (id === ch.t) { // connecting directly to target
      const ev = LX.evidence(last, id);
      if (!ev || !LX.edgeOK(ev, ch.opt)) return fail('لا يوجد رابط موثق بينهما بهذه القيود');
      st.final = LX.bestEv(ev, ch.opt); st.done = true; return complete();
    }
    const ev = LX.evidence(last, id);
    if (!ev || !LX.edgeOK(ev, ch.opt)) return fail(`${LX.P(id).ar} و${LX.P(last).ar} ليسا زميلين موثقين${ch.opt.only ? ' بهذه القيود' : ''}`);
    st.chain.push(id); st.links.push(LX.bestEv(ev, ch.opt)); LX.buzz(25);
    const evT = LX.evidence(id, ch.t);
    if (evT && LX.edgeOK(evT, ch.opt)) { st.final = LX.bestEv(evT, ch.opt); st.done = true; return complete(); }
    if (st.chain.length - 1 >= ch.maxMid) return fail('استنفدت عدد الوسطاء المسموح دون الوصول للهدف');
    draw();
  };
  const hint = () => {
    const last = st.chain[st.chain.length - 1];
    const res = LX.bfs(last, ch.t, { ...ch.opt, forbid: new Set([...forbid, ...st.chain.slice(0, -1)]), nodeOK });
    if (!res) return LX.toast('لا يوجد مسار من آخر لاعب — جرّب التراجع', 'bad', 2500);
    st.hints++;
    const nx = res.path[1]; const ev = LX.bestEv(LX.evidence(last, nx), ch.opt);
    LX.toast(`تلميح: ابحث عن زميل في ${LX.teamName(ev.t)} (${LX.evText(ev).years})`, '', 3500);
  };
  const complete = () => {
    const mids = st.chain.length - 1, shortest = mids === ch.dist - 1;
    if (ch.mode === 2 && !shortest) { st.done = false; st.chain.length = st.chain.length; return fail(`الوصلة صحيحة لكنها ليست الأقصر (${ch.dist - 1} وسيط)`); }
    finish(true);
  };
  const finish = ok => {
    const mids = st.chain.length - 1;
    const pts = ok ? Math.max(20, d.pts + (mids === ch.dist - 1 ? Math.round(d.pts * .5) : 0) - st.mistakes * Math.round(d.pts * .2) - st.hints * Math.round(d.pts * .15)) : 0;
    if (ok) { LX.unlock('link'); if (mids === ch.dist - 1) LX.unlock('shortest'); if (ch.mode === 6) LX.unlock('timetravel'); LX.best('c' + ch.diff, pts); LX.bump('cOK'); }
    document.dispatchEvent(new CustomEvent('lx:done', { detail: { kind: ch.daily ? 'dc' : 'c', ok } }));
    LX._reveal = { ok, ch, chain: ok ? st.chain.concat(ch.t) : null, links: ok ? st.links.concat(st.final) : null, pts, mistakes: st.mistakes, hints: st.hints };
    LX.go('/connect/reveal');
  };
  draw();
});

/* ---------------- REVEAL CONNECTION TIMELINE */
LX.route(/^\/connect\/reveal$/, root => {
  const R = LX._reveal; if (!R) return LX.go('/connect');
  const ch = R.ch; const opt = { ...ch.opt, forbid: new Set(ch.forbid) };
  const best = LX.bfs(ch.s, ch.t, opt) || { path: ch.best, count: ch.count, dist: ch.dist };
  const bestLinks = best.path.slice(1).map((id, i) => LX.bestEv(LX.evidence(best.path[i], id), ch.opt));
  const main = LX.page(root, { title: 'اكشف تاريخ الوصلة', gen: false }, `
    <div class="card result" style="padding:16px">
      <div class="en gold" style="letter-spacing:.2em;font-size:12px">REVEAL CONNECTION TIMELINE</div>
      <div style="font-size:20px;font-weight:900;margin-top:4px">${R.ok ? 'وصلة مكتملة!' : 'انتهت المحاولة'}</div>
      ${R.ok ? `<div class="big" style="font-size:46px">${LX.iso("+" + R.pts)}</div>` : ''}
      <div class="rgrid"><div><b>${R.ok ? R.chain.length - 2 : '–'}</b><small>وسطاؤك</small></div><div><b>${best.dist - 1}</b><small>أقصر طريق</small></div><div><b>${best.count > 999 ? '999+' : best.count}</b><small>حلول بأقصر طول</small></div></div>
    </div>
    <div class="tabs" style="margin-top:14px" id="tb">${R.ok ? '<button data-v="mine" class="on">مسارك</button>' : ''}<button data-v="best" class="${R.ok ? '' : 'on'}">أقصر مسار</button></div>
    <div id="tl"></div>
    <div class="row" style="margin-top:14px"><button class="btn grow" id="sh">${I.share}مشاركة</button><button class="btn gold grow" id="again">تحدٍ جديد</button></div>
    <div class="footer-sig">${LX.SIG.replace('Dr HOSSAM Mo', '<b>Dr HOSSAM Mo</b>')}</div>`);
  const tl = main.querySelector('#tl');
  const show = v => {
    const path = v === 'mine' ? R.chain : best.path, links = v === 'mine' ? R.links : bestLinks;
    tl.innerHTML = `<div class="rtl">${path.map((id, i) => {
      const p = LX.P(id), e = links[i];
      const x = e && LX.evText(e);
      return `<div class="rstep" style="animation-delay:${i * .35}s"><div class="rail">${LX.ph(id, 56)}<div class="bar"></div></div><div class="body">
        <div class="n">${esc(p.ar)}</div><div class="muted ltr" style="font-size:12px">${esc(p.en)} · ${p.yr ? `${LX.iso(p.yr[0] + '–' + Math.min(p.yr[1], LX.NOW))}` : ''}</div>
        ${e ? `<div class="evid">${LX.crest(e.t, 34)}<div class="grow"><div><b>${esc(x.team)}</b> · <span class="y">${esc(x.years)}</span></div><div class="muted" style="font-size:11.5px">${esc(x.kind)}</div><div style="font-size:11.5px">${LX.nums(esc(x.ev))}</div></div></div>` : ''}
      </div></div>`;
    }).join('')}</div>`;
    LX.loadPhotos(tl);
    tl.onclick = ev => { const q = ev.target.closest('.ph[data-pid]'); if (q) LX.go('/player/' + q.dataset.pid); };
  };
  main.querySelector('#tb').onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; main.querySelectorAll('#tb button').forEach(x => x.classList.toggle('on', x === b)); show(b.dataset.v); };
  show(R.ok ? 'mine' : 'best');
  main.querySelector('#again').onclick = () => { if (ch.mode === 9) return LX.go('/connect/build'); const n = LX.makeChallenge(ch.mode, ch.diff, { restricted: ch.restricted, matchOnly: ch.opt.matchOnly }); if (n) { LX._ch = n; LX.go('/connect/play'); } else LX.go('/connect'); };
  main.querySelector('#sh').onclick = async () => {
    const path = R.ok ? R.chain : best.path, links = R.ok ? R.links : bestLinks;
    const h = 330 + path.length * 170;
    const { c, ctx } = LX.frame(1080, Math.max(1080, h), 'وصلة اللاعبين');
    ctx.textAlign = 'right'; ctx.direction = 'rtl';
    for (let i = 0; i < path.length; i++) {
      const y = 260 + i * 170; const p = LX.P(path[i]);
      if (i < path.length - 1) { ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(900, y + 60); ctx.lineTo(900, y + 170 - 60); ctx.stroke(); }
      await LX.drawPhoto(ctx, p.id, 900, y, 60);
      ctx.fillStyle = '#fff'; ctx.font = '700 42px Cairo'; ctx.fillText(p.ar, 810, y - 6);
      if (links[i]) { const x = LX.evText(links[i]); ctx.fillStyle = '#f0d277'; ctx.font = '600 28px Cairo'; ctx.fillText(`${x.team} · ${x.years}`, 810, y + 40); }
    }
    ctx.direction = 'ltr';
    await LX.shareCanvas(c, 'legends-xi-connection', `وصلة من ${LX.P(path[0]).ar} إلى ${LX.P(path[path.length - 1]).ar} — LEGENDS XI`);
  };
});
})();
