/* LEGENDS XI — Who Is Missing, Dream XI, Time Machine, Daily Challenge. Created by Dr HOSSAM Mo */
(function () {
'use strict';
const LX = window.LX, D = LX.D, S = LX.S, esc = LX.esc, I = LX.I;

/* ===================== WHO IS MISSING ===================== */
LX.makeMissing = (diff, r = Math.random, era) => {
  era = era || LX.era();
  let sq = D.squads.filter(s => LX.squadInEra(s, era)); if (!sq.length) sq = D.squads;
  const s = LX.pick(sq, r);
  const xi = s.p.map((x, i) => [x, i]).filter(([x]) => x[3] === 'XI');
  const n = Math.min(diff, 4);
  // medium hides the most famous, legendary hides the least famous
  const ranked = LX.shuffle(xi, r).sort((a, b) => diff <= 2 ? LX.P(a[0][2]).t - LX.P(b[0][2]).t : LX.P(b[0][2]).t - LX.P(a[0][2]).t);
  return { sid: s.id, hidden: ranked.slice(0, n).map(([, i]) => i), diff };
};
LX.route(/^\/missing(?:\/(daily))?$/, (root, daily) => {
  if (!daily && !LX._miss) return missingSetup(root);
  const M = daily ? LX._dailyMiss : LX._miss; if (!M) return LX.go('/missing');
  const s = LX.squadById[M.sid], t = LX.T(s.team), d = LX.diff(M.diff);
  const st = { found: new Set(), lives: 3, hints: new Set(), done: false };
  const xi = s.p.filter(x => x[3] === 'XI'); const L = LX.layout(s.f);
  const main = LX.page(root, { title: 'اللاعب الناقص', gen: !daily }, `<div id="b"></div>`);
  const b = main.querySelector('#b');
  const draw = () => {
    b.innerHTML = `<div class="hud"><div class="lives">${[0, 1, 2].map(i => `<span class="${i < st.lives ? '' : 'off'}">${I.heart}</span>`).join('')}</div><div class="grow" style="text-align:center;font-weight:800">${st.found.size}/${M.hidden.length} مكتشف</div><span class="chip">${d.ar}</span></div>
      <div class="sqhead" style="--c1:${t.c1};margin-top:10px">${LX.crest(s.team, 44)}<div class="meta"><div class="t" style="font-size:16px">${esc(t.ar)} — ${esc(s.comp)}</div><div class="m">${LX.nums(esc(s.match))} · <span class="f">${esc(s.f)}</span></div></div></div>
      <div class="pitch">${LX.pitchLines()}${xi.map((x, i) => {
        const idx = s.p.indexOf(x), hid = M.hidden.includes(idx) && !st.found.has(idx);
        if (hid) return `<button class="pp hidden" data-h="${idx}" style="left:${L[i][0]}%;top:${L[i][1]}%"><div class="ph" style="width:50px;height:50px"><span class="ini">?</span></div><span class="no">${M.diff >= 4 ? '?' : (x[0] ?? 'غ.م')}</span><span class="nm">من هو؟</span><span class="ps">${esc(x[1])}</span></button>`;
        return LX.pitchPlayer(x[2], L[i][0], L[i][1], x[0], x[1], M.hidden.includes(idx) ? 'got' : '');
      }).join('')}</div>
      <p class="muted" style="font-size:12px;margin-top:8px">اضغط على علامة الاستفهام واكتب اسم اللاعب الناقص.</p>
      ${st.done ? `<div class="card result"><div class="big" style="font-size:44px">${st.ok ? LX.iso('+' + st.pts) : '0'}</div><div>${st.ok ? 'أحسنت! اكتملت التشكيلة' : 'انتهت الفرص'}</div><div class="row" style="margin-top:12px"><button class="btn grow" id="sq">التشكيلة كاملة</button><button class="btn gold grow" id="nx">${daily ? 'العودة للتحدي اليومي' : 'تشكيلة أخرى'}</button></div></div>` : ''}`;
    LX.loadPhotos(b);
  };
  b.onclick = e => {
    const h = e.target.closest('[data-h]'); if (h && !st.done) return ask(+h.dataset.h);
    const p = e.target.closest('.pp[data-p]'); if (p && st.done) return LX.go('/player/' + p.dataset.p);
    if (e.target.closest('#sq')) return LX.go('/squad/' + s.id);
    if (e.target.closest('#nx')) { if (daily) return LX.go('/daily'); LX._miss = LX.makeMissing(M.diff); LX.render(); }
  };
  const ask = idx => {
    const x = s.p[idx], p = LX.P(x[2]);
    LX.sheet(`<h3>اللاعب الناقص — ${esc(LX.POSDETAIL[x[1]] || x[1])}${x[0] != null && M.diff < 4 ? ` · رقم ${x[0]}` : ''}</h3>
      ${st.hints.has(idx) ? `<div class="clue" style="margin-bottom:10px"><span class="i">!</span><span class="x">جنسيته: ${esc(LX.natName(p))} · ${p.yr ? `نشط ${LX.iso(p.yr[0] + '–' + Math.min(p.yr[1], LX.NOW))}` : ''}</span></div>` : ''}
      <div class="answer" style="margin-top:0"><div class="search"><input id="ma" placeholder="ابدأ كتابة اسم اللاعب…" autocomplete="off"></div><button class="btn gold" id="mc">تحقق</button></div>
      ${st.hints.has(idx) ? '' : `<button class="btn sm block" style="margin-top:10px" id="mh">${I.q} تلميح: الجنسية (${LX.iso('−' + Math.round(d.pts * .15))})</button>`}`, sh => {
      const inp = sh.querySelector('#ma'); setTimeout(() => inp.focus(), 250);
      const go = () => {
        if (!inp.value.trim()) return;
        const m = LX.answerCheck(inp, p.id);
        if (m.ok) { st.found.add(idx); LX.closeSheet(); LX.toast('صحيح! ' + p.ar, 'good'); LX.buzz(30); if (st.found.size === M.hidden.length) end(true); else draw(); return; }
        st.lives--; LX.buzz(120); LX.toast('إجابة خاطئة', 'bad'); sh.querySelector('.answer').classList.add('shake'); setTimeout(() => sh.querySelector('.answer') && sh.querySelector('.answer').classList.remove('shake'), 400);
        if (st.lives <= 0) { LX.closeSheet(); end(false); } else draw();
      };
      LX.autoAnswer(inp, go); sh.querySelector('#mc').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
      const mh = sh.querySelector('#mh'); if (mh) mh.onclick = () => { st.hints.add(idx); LX.closeSheet(); ask(idx); };
    });
  };
  const end = ok => {
    st.done = true; st.ok = ok;
    if (!ok) M.hidden.forEach(i => st.found.add(i));
    st.pts = ok ? Math.max(10, d.pts * M.hidden.length - st.hints.size * Math.round(d.pts * .15) - (3 - st.lives) * Math.round(d.pts * .2)) : 0;
    if (ok) { LX.unlock('missing'); LX.best('m' + M.diff, st.pts); }
    document.dispatchEvent(new CustomEvent('lx:done', { detail: { kind: daily ? 'dm' : 'm', ok } }));
    draw();
  };
  draw();
});
function missingSetup(root) {
  const diff = S.get('mdiff', 1);
  const main = LX.page(root, { title: 'اللاعب الناقص', gen: true }, `
    <div class="card"><div style="font-weight:900;font-size:18px">من الغائب عن التشكيلة؟</div><div class="muted" style="font-size:12.5px">تشكيلات تاريخية حقيقية بأرقامها ومراكزها — اكتشف اللاعبين المخفيين.</div></div>
    <div class="section-t">المستوى</div>
    <div class="diffs">${LX.DIFFS.map(d => `<button class="diff ${d.cls} ${d.id === diff ? 'on' : ''}" data-d="${d.id}"><span class="lv">LEVEL ${d.id}</span><span class="t">${d.ar}</span><span class="d">${d.id === 4 ? '4 لاعبين مخفيين بدون أرقام القمصان' : `${d.id} ${d.id === 1 ? 'لاعب مخفي' : 'لاعبين مخفيين'}`}</span><span class="pts"><span>${d.pts} لكل لاعب</span><span>أفضل: <b>${LX.best('m' + d.id)}</b></span></span></button>`).join('')}</div>
    <button class="btn gold block" style="margin-top:16px;padding:15px;font-size:17px" id="go">ابدأ</button>`);
  main.querySelector('.diffs').onclick = e => { const b = e.target.closest('[data-d]'); if (!b) return; S.set('mdiff', +b.dataset.d); main.querySelectorAll('.diff').forEach(x => x.classList.toggle('on', x === b)); };
  main.querySelector('#go').onclick = () => { LX._miss = LX.makeMissing(S.get('mdiff', 1)); LX.render(); };
}
// reset the setup when entering from home
LX.newMissing = () => { LX._miss = null; LX.go('/missing'); };

/* ===================== DREAM XI ===================== */
const FORMS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '4-5-1', '5-3-2', '4-1-4-1', '3-4-3'];
const slotPos = (f, i) => { if (i === 0) return 'GK'; const rows = f.split('-').map(Number); let k = i - 1; for (let r = 0; r < rows.length; r++) { if (k < rows[r]) return r === 0 ? 'DF' : r === rows.length - 1 ? 'FW' : 'MF'; k -= rows[r]; } return 'MF'; };
const dream = () => S.get('dream', { f: '4-3-3', p: Array(11).fill(null), name: 'فريق أحلامي' });
LX.addToDream = pid => {
  const dr = dream(); const p = LX.P(pid);
  LX.sheet(`<h3>أضف ${esc(p.ar)} إلى فريق أحلامك</h3><div class="plist">${dr.p.map((id, i) => `<button class="prow" data-i="${i}"><span class="chip">${slotPos(dr.f, i)}</span><div class="grow"><div class="n">${id ? esc(LX.P(id).ar) : 'مركز شاغر'}</div><div class="s">المركز ${i + 1} في خطة ${dr.f}</div></div>${slotPos(dr.f, i) === LX.posGroup(p.pos) ? '<span class="chip green">مناسب</span>' : ''}</button>`).join('')}</div>`, sh => {
    sh.onclick = e => { const b = e.target.closest('[data-i]'); if (!b) return; const d2 = dream(); const at = d2.p.indexOf(pid); if (at >= 0) d2.p[at] = null; d2.p[+b.dataset.i] = pid; S.set('dream', d2); LX.closeSheet(); LX.unlock('dream'); LX.toast('تمت الإضافة إلى فريق أحلامك', 'good'); };
  });
};
LX.route(/^\/dream$/, root => {
  const dr = dream(); const L = LX.layout(dr.f); const onlyEra = S.get('dreamEra', false);
  const main = LX.page(root, { title: 'فريق أحلامك', gen: true }, `
    <div class="search"><input id="nm" value="${esc(dr.name)}" maxlength="40"></div>
    <div class="formsel" style="margin-top:10px">${FORMS.map(f => `<button class="${f === dr.f ? 'on' : ''}" data-f="${f}">${f}</button>`).join('')}</div>
    <div class="pitch">${LX.pitchLines()}${L.map(([x, y], i) => dr.p[i] ? LX.pitchPlayer(dr.p[i], x, y, i + 1 === 1 ? 1 : null, slotPos(dr.f, i)).replace('class="pp ', `data-i="${i}" class="pp `) : `<button class="pp slot" data-i="${i}" style="left:${x}%;top:${y}%"><div class="ph" style="width:50px;height:50px"><span class="ini">+</span></div><span class="nm">${slotPos(dr.f, i)}</span></button>`).join('')}</div>
    <div class="card setrow" style="padding:12px;margin-top:10px"><div class="t">من الجيل المختار فقط<small>${esc(LX.era().label)}</small></div><button class="switch ${onlyEra ? 'on' : ''}" id="oe"></button></div>
    <div class="row" style="margin-top:12px"><button class="btn grow" id="clr">مسح</button><button class="btn grow" id="auto">اقتراح تلقائي</button><button class="btn gold grow" id="exp">${I.share} تصدير</button></div>
    <div class="footer-sig">${LX.SIG.replace('Dr HOSSAM Mo', '<b>Dr HOSSAM Mo</b>')}</div>`);
  main.querySelectorAll('.pp .no').forEach(n => n.remove());
  main.querySelector('#nm').onchange = e => { const d2 = dream(); d2.name = e.target.value || 'فريق أحلامي'; S.set('dream', d2); };
  main.querySelector('.formsel').onclick = e => { const b = e.target.closest('[data-f]'); if (!b) return; const d2 = dream(); d2.f = b.dataset.f; S.set('dream', d2); LX.render(); };
  main.querySelector('#oe').onclick = () => { S.set('dreamEra', !onlyEra); LX.render(); };
  main.querySelector('.pitch').onclick = e => {
    const b = e.target.closest('[data-i]'); if (!b) return; const i = +b.dataset.i; const need = slotPos(dr.f, i);
    LX.pickPlayer({
      title: `اختر ${LX.POSAR[need]}`, filter: p => !onlyEra || LX.inEra(p),
      suggest: () => LX.allPlayers.filter(p => p.t === 1 && LX.posGroup(p.pos) === need && (!onlyEra || LX.inEra(p))).slice(0, 30),
      onPick: p => { const d2 = dream(); const at = d2.p.indexOf(p.id); if (at >= 0) d2.p[at] = null; d2.p[i] = p.id; S.set('dream', d2); LX.unlock('dream'); LX.render(); }
    });
  };
  main.querySelector('#clr').onclick = () => { const d2 = dream(); d2.p = Array(11).fill(null); S.set('dream', d2); LX.render(); };
  main.querySelector('#auto').onclick = () => {
    const d2 = dream(); const used = new Set();
    d2.p = d2.p.map((id, i) => { if (id) { used.add(id); return id; } const need = slotPos(d2.f, i); const c = LX.shuffle(LX.allPlayers.filter(p => p.t === 1 && LX.posGroup(p.pos) === need && !used.has(p.id) && (!onlyEra || LX.inEra(p)))); const p = c[0]; if (p) used.add(p.id); return p ? p.id : null; });
    S.set('dream', d2); LX.render();
  };
  main.querySelector('#exp').onclick = async () => {
    const d2 = dream(); const { c, ctx } = LX.frame(1080, 1500, d2.name);
    const px = 90, py = 220, pw = 900, ph2 = 1160;
    for (let k = 0; k < 11; k++) { ctx.fillStyle = k % 2 ? '#18704a' : '#1c7a4f'; ctx.fillRect(px, py + k * ph2 / 11, pw, ph2 / 11 + 1); }
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 4; ctx.strokeRect(px + 16, py + 16, pw - 32, ph2 - 32); ctx.beginPath(); ctx.moveTo(px + 16, py + ph2 / 2); ctx.lineTo(px + pw - 16, py + ph2 / 2); ctx.stroke(); ctx.beginPath(); ctx.arc(px + pw / 2, py + ph2 / 2, 100, 0, 7); ctx.stroke();
    ctx.fillStyle = '#f0d277'; ctx.font = '700 34px Oswald'; ctx.textAlign = 'center'; ctx.fillText(d2.f, 540, 210);
    const L2 = LX.layout(d2.f);
    for (let i = 0; i < 11; i++) {
      const id = d2.p[i]; const x = px + pw * L2[i][0] / 100, y = py + ph2 * L2[i][1] / 100;
      if (!id) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.arc(x, y, 52, 0, 7); ctx.stroke(); ctx.setLineDash([]); continue; }
      await LX.drawPhoto(ctx, id, x, y, 56);
      const nm = LX.shortName(LX.P(id)); ctx.font = '700 28px Cairo'; ctx.direction = 'rtl'; const w = ctx.measureText(nm).width + 22;
      ctx.fillStyle = 'rgba(6,12,24,.85)'; ctx.fillRect(x - w / 2, y + 62, w, 40); ctx.fillStyle = '#fff'; ctx.fillText(nm, x, y + 92); ctx.direction = 'ltr';
    }
    await LX.shareCanvas(c, 'legends-xi-dream', `${d2.name} — LEGENDS XI — ${LX.SIG}`);
  };
});

/* ===================== FOOTBALL TIME MACHINE ===================== */
LX.route(/^\/era$/, root => {
  const e = LX.era();
  const players = LX.allPlayers.filter(p => LX.inEra(p, e));
  const legends = players.filter(p => p.t === 1).sort((a, b) => a.yr[0] - b.yr[0]);
  const sqs = D.squads.filter(s => LX.squadInEra(s, e)).sort((a, b) => a.s - b.s);
  // a "did you know" from verified links between two legends of the era
  const r = Math.random; let fact = '';
  for (let k = 0; k < 40 && !fact; k++) {
    const a = LX.pick(legends.length ? legends : players, r); const n = (LX.ADJ[a.id] || []).filter(([id]) => LX.P(id).t === 1 && LX.inEra(LX.P(id), e));
    if (n.length) { const [bid, ev] = LX.pick(n, r); const x = LX.evText(LX.bestEv(ev)); fact = `${a.ar} و${LX.P(bid).ar} كانا زميلين في ${x.team} (${x.years}).`; }
  }
  const main = LX.page(root, { title: 'ذاكرة الأجيال', gen: false }, `
    <div class="card" style="text-align:center"><div class="en gold" style="letter-spacing:.3em;font-size:12px">FOOTBALL TIME MACHINE</div><div style="font-size:20px;font-weight:900">اختر محطتك في الزمن</div></div>
    <div class="plist" style="margin-top:12px">${LX.ERAS.map(x => `<button class="prow" data-e="${x.id}" style="${x.id === e.id ? 'border-color:var(--gold);background:rgba(212,175,55,.12)' : ''}"><div class="grow"><div class="n en" style="font-size:18px">${esc(x.label)}</div><div class="s">${esc(x.ar)} — ${esc(x.d)}</div></div><span class="chip ${x.id === e.id ? 'gold' : ''}">${LX.allPlayers.filter(p => LX.inEra(p, x)).length} لاعب</span></button>`).join('')}</div>
    ${fact ? `<div class="section-t">هل تعلم؟</div><div class="clue"><span class="i">💡</span><span class="x">${esc(fact)}</span></div>` : ''}
    <div class="section-t">أساطير ${esc(e.label)} <small>${legends.length}</small></div>
    <div class="pcards">${legends.slice(0, 24).map(p => LX.card(p.id, null, p.pos)).join('').replace(/<span class="num u">غير موثق<\/span>/g, '')}</div>
    <div class="section-t">تشكيلات هذا الجيل <small>${sqs.length}</small></div>
    <div class="plist">${sqs.map(LX.squadRow).join('') || '<div class="empty">لا توجد تشكيلات موثقة</div>'}</div>
    <div class="section-t">العب في هذا الجيل</div>
    <div class="smallcards"><button class="smallcard" data-g="/guess"><span class="t">خمن اللاعب</span></button><button class="smallcard" data-g="/connect"><span class="t">وصلات اللاعبين</span></button><button class="smallcard" data-g="/missing"><span class="t">اللاعب الناقص</span></button><button class="smallcard" data-g="/squads"><span class="t">التشكيلات</span></button></div>`);
  main.onclick = ev => {
    const b = ev.target.closest('[data-e]'); if (b) { LX.setEra(b.dataset.e); return LX.render(); }
    const g = ev.target.closest('[data-g]'); if (g) { if (g.dataset.g === '/missing') LX._miss = null; return LX.go(g.dataset.g); }
    const s = ev.target.closest('[data-s]'); if (s) return LX.go('/squad/' + s.dataset.s);
    const p = ev.target.closest('[data-p]'); if (p) return LX.go('/player/' + p.dataset.p);
  };
});

/* ===================== DAILY LEGEND CHALLENGE ===================== */
const dkey = () => LX.today();
const dstate = () => S.get('daily', {});
const mark = (k, ok) => { const all = dstate(); const t = all[dkey()] = all[dkey()] || {}; if (ok && !t[k]) t[k] = 1; S.set('daily', all); checkStreak(); };
const checkStreak = () => {
  const all = dstate(); const t = all[dkey()] || {};
  if (t.g && t.m && t.c && !t.full) {
    t.full = 1; S.set('daily', all); LX.unlock('daily');
    let n = 0; const d = new Date(); for (;;) { const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; if (all[k] && all[k].full) { n++; d.setDate(d.getDate() - 1); } else break; }
    LX.stat('dailyStreak', n); if (n >= 7) LX.unlock('daily7');
  }
};
document.addEventListener('lx:done', e => { const k = e.detail.kind; if (k === 'dm') mark('m', e.detail.ok); if (k === 'dc') mark('c', e.detail.ok); });
LX.route(/^\/daily$/, root => {
  const seed = LX.hash('lxi' + dkey()); const t = dstate()[dkey()] || {};
  const main = LX.page(root, { title: 'التحدي اليومي', gen: false }, `
    <div class="card" style="text-align:center"><div class="en gold" style="letter-spacing:.3em;font-size:12px">DAILY LEGEND CHALLENGE</div><div style="font-size:20px;font-weight:900">${esc(new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }))}</div><div class="muted" style="font-size:12.5px">نفس التحدي لكل اللاعبين اليوم · سلسلة الأيام: <b class="gold">${LX.stat('dailyStreak') || 0}</b></div></div>
    <div class="plist" style="margin-top:12px">
      <button class="prow" data-k="g"><span class="chip ${t.g ? 'green' : 'gold'}">${t.g ? '✓' : '1'}</span><div class="grow"><div class="n">أسطورة اليوم</div><div class="s">خمن اللاعب من أدلته — المستوى الصعب</div></div></button>
      <button class="prow" data-k="m"><span class="chip ${t.m ? 'green' : 'gold'}">${t.m ? '✓' : '2'}</span><div class="grow"><div class="n">تشكيلة اليوم</div><div class="s">اكتشف اللاعبين الناقصين</div></div></button>
      <button class="prow" data-k="c"><span class="chip ${t.c ? 'green' : 'gold'}">${t.c ? '✓' : '3'}</span><div class="grow"><div class="n">وصلة اليوم</div><div class="s">اربط بين نجمين عبر زملاء موثقين</div></div></button>
    </div>
    ${t.full ? '<div class="card result" style="margin-top:12px"><div style="font-size:30px">🏆</div><b>أكملت تحدي اليوم! عُد غدًا</b></div>' : ''}
    <div id="dg"></div>`);
  main.querySelector('.plist').onclick = e => {
    const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k;
    if (k === 'm') { LX._dailyMiss = LX.makeMissing(2, LX.rng(seed + 7), LX.ERAS[4]); return LX.go('/missing/daily'); }
    if (k === 'c') { const ch = LX.makeChallenge(1, 2, { era: LX.ERAS[4] }, LX.rng(seed + 13)); if (!ch) return; ch.daily = true; LX._ch = ch; return LX.go('/connect/play'); }
    // daily guess inline
    const q = LX.makeQuestion({ diff: 2, cat: 'mix', era: LX.ERAS[4], r: LX.rng(seed + 3) }); if (!q) return;
    const dg = main.querySelector('#dg'); let tries = 3, hints = 0;
    const done = ok => {
      if (ok) mark('g', true);
      dg.innerHTML = `<div class="qbox reveal ${ok ? '' : 'bad'}" style="margin-top:12px">${LX.ph(q.p.id, 100)}<div style="font-weight:900;font-size:20px;margin-top:8px">${esc(q.p.ar)}</div><div class="muted ltr">${esc(q.p.en)}</div>
        <div style="margin-top:6px">${ok ? '<span class="chip green">إجابة صحيحة</span>' : '<span class="chip red">حاول غدًا من جديد</span>'}</div>${LX.cardMini(q.p)}
        <div class="row" style="margin-top:12px"><button class="btn grow" id="dp">الملف الكامل</button><button class="btn gold grow" id="dk">${ok ? 'متابعة التحدي' : 'حسنًا'}</button></div></div>`;
      LX.loadPhotos(dg);
      dg.querySelector('#dp').onclick = () => LX.go('/player/' + q.p.id);
      dg.querySelector('#dk').onclick = () => LX.render();
    };
    const draw = (msg) => {
      const all = q.clues.concat(q.extras.slice(0, hints));
      dg.innerHTML = `<div class="qbox" style="margin-top:12px"><div class="q">مين أسطورة اليوم؟</div><div class="clues">${all.map((c, i) => `<div class="clue"><span class="i">${i + 1}</span><span class="x">${esc(c)}</span></div>`).join('')}</div>
      <div class="answer"><div class="search"><input id="da" placeholder="ابدأ كتابة الاسم…" autocomplete="off" autocapitalize="off"></div><button class="btn gold" id="dc">تحقق</button></div>
      <div class="row" style="margin-top:10px"><button class="btn sm grow" id="dh" ${hints >= Math.min(3, q.extras.length) ? 'disabled style="opacity:.4"' : ''}>${I.q} دليل إضافي (${LX.iso(Math.min(3, q.extras.length) - hints)} متبقية)</button></div>
      <div class="muted" style="margin-top:8px;font-size:12px">محاولات متبقية: ${tries} ${msg ? '· ' + msg : ''}</div></div>`;
      const inp = dg.querySelector('#da');
      const go = () => { if (!inp.value.trim()) return; const m = LX.answerCheck(inp, q.p.id); if (m.ok) { LX.toast('صحيح! ' + q.p.ar, 'good'); return done(true); } tries--; LX.buzz(120); if (tries <= 0) return done(false); draw('إجابة خاطئة'); };
      LX.autoAnswer(inp, go);
      dg.querySelector('#dc').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
      dg.querySelector('#dh').onclick = () => { if (hints < Math.min(3, q.extras.length)) { hints++; draw(msg); } };
      setTimeout(() => inp.focus(), 50);
    };
    if (t.g) return LX.toast('أكملت هذا الجزء اليوم', 'good');
    draw();
  };
});
})();
