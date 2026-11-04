/* LEGENDS XI — Legendary Squads encyclopedia. Created by Dr HOSSAM Mo */
(function () {
'use strict';
const LX = window.LX, D = LX.D, S = LX.S, esc = LX.esc, I = LX.I;

/* team -> players with spells there */
const TEAMP = {};
LX.allPlayers.forEach(p => p.cl.forEach(c => (TEAMP[c[0]] = TEAMP[c[0]] || []).push([p.id, c[1], c[2]])));
const TEAMSQ = {};
D.squads.forEach(s => (TEAMSQ[s.team] = TEAMSQ[s.team] || []).push(s));
LX.TEAMSQ = TEAMSQ;
const COUNTRY = { GB: 'إنجلترا وبريطانيا', ES: 'إسبانيا', IT: 'إيطاليا', DE: 'ألمانيا', FR: 'فرنسا', NL: 'هولندا', PT: 'البرتغال', BR: 'البرازيل', AR: 'الأرجنتين', EG: 'مصر', TR: 'تركيا', BE: 'بلجيكا', US: 'أمريكا', SA: 'السعودية' };

/* ---------------- squad browser */
LX.route(/^\/squads(?:\/(club|nt))?$/, (root, tab) => {
  tab = tab || S.get('sqtab', 'club'); S.set('sqtab', tab);
  const era = LX.era();
  const main = LX.page(root, { title: 'موسوعة التشكيلات التاريخية', gen: true }, `
    <div class="tabs"><button data-t="club" class="${tab === 'club' ? 'on' : ''}">الأندية</button><button data-t="nt" class="${tab === 'nt' ? 'on' : ''}">المنتخبات</button></div>
    <div class="search" style="margin-top:10px">${I.search}<input id="q" placeholder="ابحث عن فريق…"></div>
    <div class="gens" id="cc"></div>
    <div class="section-t">التشكيلات الموثقة ${era.id !== 'all' ? `<small>جيل ${esc(era.label)}</small>` : ''}</div>
    <div id="featured" class="plist"></div>
    <div class="section-t">كل الفرق <small id="cnt"></small></div>
    <div class="teamgrid" id="grid"></div>`);
  main.querySelectorAll('.tabs button').forEach(b => b.onclick = () => LX.go('/squads/' + b.dataset.t));
  const teams = Object.values(D.teams).filter(t => (tab === 'nt' ? t.type === 'nt' : t.type === 'club'));
  const info = t => {
    const sq = (TEAMSQ[t.id] || []).filter(s => LX.squadInEra(s, era));
    const pl = tab === 'nt' ? LX.allPlayers.filter(p => p.nat === t.id && LX.inEra(p, era)).length : new Set((TEAMP[t.id] || []).filter(x => x[1] < era.b && x[2] > era.a).map(x => x[0])).size;
    return { sq: sq.length, pl };
  };
  const all = teams.map(t => ({ t, ...info(t) })).filter(x => x.sq || x.pl).sort((a, b) => b.sq - a.sq || b.pl - a.pl);
  const countries = [...new Set(all.map(x => x.t.cc))].filter(c => COUNTRY[c]);
  let cc = ''; const ccEl = main.querySelector('#cc');
  if (tab === 'club') ccEl.innerHTML = `<button class="gen on" data-c="">الكل</button>` + countries.map(c => `<button class="gen" data-c="${c}">${LX.flag(c)} ${COUNTRY[c]}</button>`).join('');
  else ccEl.remove();
  ccEl.onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; cc = b.dataset.c; ccEl.querySelectorAll('.gen').forEach(x => x.classList.toggle('on', x === b)); draw(); };
  const featured = D.squads.filter(s => LX.squadInEra(s, era) && (tab === 'nt') === (LX.T(s.team).type === 'nt')).sort((a, b) => b.s - a.s);
  const drawF = n => { main.querySelector('#featured').innerHTML = featured.length ? featured.slice(0, n).map(s => squadRow(s)).join('') + (featured.length > n ? `<button class="btn block" id="fmore" style="margin-top:6px">عرض كل التشكيلات (${featured.length})</button>` : '') : '<div class="empty">لا توجد تشكيلات موثقة في هذا الجيل</div>'; LX.loadPhotos(main); };
  drawF(25);
  main.querySelector('#featured').addEventListener('click', e => { if (e.target.id === 'fmore') { e.stopPropagation(); drawF(9999); } }, true);
  main.querySelector('#featured').onclick = e => { const b = e.target.closest('[data-s]'); if (b) LX.go('/squad/' + b.dataset.s); };
  const q = main.querySelector('#q');
  const draw = () => {
    const n = LX.norm(q.value);
    const list = all.filter(x => (!cc || x.t.cc === cc) && (!n || LX.norm(x.t.en + ' ' + x.t.ar).includes(n)));
    main.querySelector('#cnt').textContent = list.length + ' فريق';
    main.querySelector('#grid').innerHTML = list.map(x => `<button class="teamtile" data-t="${x.t.id}">${LX.crest(x.t.id, 38)}<div><div class="n">${esc(x.t.ar)}</div><div class="c">${x.sq ? `<span class="gold">${x.sq} تشكيلة</span> · ` : ''}${x.pl} لاعب</div></div></button>`).join('');
  };
  q.oninput = draw; draw();
  main.querySelector('#grid').onclick = e => { const b = e.target.closest('[data-t]'); if (b) LX.go('/team/' + b.dataset.t); };
});
const squadRow = s => `<button class="prow" data-s="${s.id}">${LX.crest(s.team, 38)}<div class="grow"><div class="n">${esc(LX.teamName(s.team))} <span class="en gold">${s.date.slice(0, 4)}</span></div><div class="s">${esc(s.comp)} · ${LX.nums(esc(s.match))}</div></div><span class="verbadge ${s.ver}">${LX.verLabel(s.ver)}</span></button>`;
LX.squadRow = squadRow;

/* ---------------- team page with chronological timeline */
LX.route(/^\/team\/([^/]+)(?:\/(\d{4}))?$/, (root, tid, yr) => {
  const t = LX.T(tid); if (!t) return LX.go('/squads');
  const era = LX.era();
  const sqs = (TEAMSQ[tid] || []).slice().sort((a, b) => a.s - b.s);
  let members;
  if (t.type === 'nt') members = LX.allPlayers.filter(p => p.nat === tid).flatMap(p => p.nt ? [[p.id, p.nt[0], p.nt[1] + 1]] : (p.wc && p.wc.length ? p.wc.map(w => [p.id, w[0], w[0] + 1]) : [[p.id, p.yr[0], p.yr[1] + 1]]));
  else members = TEAMP[tid] || [];
  let ys = members.flatMap(m => [m[1]]).concat(sqs.map(s => s.s));
  let y0 = Math.max(Math.min(...ys), era.a, 1955), y1 = Math.min(Math.max(...members.map(m => m[2] - 1), ...sqs.map(s => s.s)), era.b - 1, LX.NOW);
  const years = []; for (let y = y0; y <= y1; y++) years.push(y);
  const sel = yr ? +yr : (sqs.filter(s => LX.squadInEra(s, era)).slice(-1)[0] || {}).s || y1;
  const main = LX.page(root, { title: esc(t.ar), gen: true }, `
    <div class="sqhead" style="--c1:${t.c1}">${LX.crest(tid, 56)}<div class="meta"><div class="t">${esc(t.ar)}</div><div class="m ltr en">${esc(t.en)}</div><div class="m">${sqs.length} تشكيلة موثقة · ${new Set(members.map(m => m[0])).size} لاعب في القاعدة</div></div></div>
    <div class="section-t">الخط الزمني <small>اختر موسمًا</small></div>
    <div class="years" id="yrs">${years.map(y => { const has = sqs.some(s => s.s === y); return `<button class="yr ${has ? 'has' : ''} ${y === sel ? 'on' : ''}" data-y="${y}"><b>${y}</b><small>${has ? 'تشكيلة موثقة' : (t.type === 'nt' ? '' : LX.season(y, y + 1))}</small></button>`; }).join('')}</div>
    <div id="body"></div>`);
  main.querySelector('#yrs').onclick = e => { const b = e.target.closest('[data-y]'); if (b) location.replace('#/team/' + tid + '/' + b.dataset.y); };
  setTimeout(() => { const on = main.querySelector('.yr.on'); on && on.scrollIntoView({ inline: 'center', block: 'nearest' }); }, 30);
  const body = main.querySelector('#body');
  const ySq = sqs.filter(s => s.s === sel);
  const roster = members.filter(m => m[1] <= sel && sel < m[2]).map(m => LX.P(m[0]));
  const uniq = [...new Map(roster.map(p => [p.id, p])).values()].sort((a, b) => ['GK', 'DF', 'MF', 'FW'].indexOf(LX.posGroup(a.pos)) - ['GK', 'DF', 'MF', 'FW'].indexOf(LX.posGroup(b.pos)));
  body.innerHTML = `
    ${ySq.length ? `<div class="section-t">تشكيلات ${sel}</div><div class="plist">${ySq.map(squadRow).join('')}</div>` : ''}
    ${sqs.length ? `<div class="section-t">كل التشكيلات الموثقة</div><div class="plist">${sqs.filter(s => LX.squadInEra(s, era)).map(squadRow).join('') || '<div class="empty">لا توجد في هذا الجيل</div>'}</div>` : ''}
    <div class="section-t">${t.type === 'nt' ? `لاعبون دوليون في ${sel}` : `لاعبو الفريق الأول في موسم ${LX.season(sel, sel + 1)}`}<small>${uniq.length}</small></div>
    <p class="muted" style="font-size:12px;margin:-4px 2px 6px">قائمة مستخرجة من المسيرات الموثقة في قاعدة البيانات، وليست تشكيلة مباراة بعينها.</p>
    <div class="plist">${uniq.map(p => LX.prow(p)).join('') || '<div class="empty">لا يوجد لاعبون مسجلون لهذا الموسم في القاعدة بعد</div>'}</div>`;
  body.onclick = e => { const s = e.target.closest('[data-s]'); if (s) return LX.go('/squad/' + s.dataset.s); const p = e.target.closest('[data-p]'); if (p) LX.go('/player/' + p.dataset.p); };
});

/* ---------------- formation layout */
LX.layout = (form, n) => {
  const rows = form.split('-').map(Number); const pts = [[50, 91]];
  const k = rows.length; const top = 14, bot = 72;
  rows.forEach((cnt, ri) => {
    const y = k === 1 ? 45 : bot - (bot - top) * ri / (k - 1);
    for (let i = 0; i < cnt; i++) {
      const spread = cnt === 1 ? 0 : Math.min(84, 22 * (cnt - 1) + 6);
      const x = 50 + spread / 2 - (cnt === 1 ? 0 : spread * i / (cnt - 1));
      pts.push([x, y]);
    }
  });
  return pts.slice(0, n || 11);
};
LX.pitchLines = () => `<svg class="lines" viewBox="0 0 68 100" preserveAspectRatio="none"><g fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".35">
 <rect x="2" y="2" width="64" height="96"/><line x1="2" y1="50" x2="66" y2="50"/><circle cx="34" cy="50" r="7.5"/>
 <rect x="14" y="2" width="40" height="15"/><rect x="24" y="2" width="20" height="5.5"/><rect x="14" y="83" width="40" height="15"/><rect x="24" y="92.5" width="20" height="5.5"/>
 <path d="M27 17 A8 8 0 0 0 41 17"/><path d="M27 83 A8 8 0 0 1 41 83"/></g><circle cx="34" cy="50" r=".7" fill="#fff"/></svg>`;
LX.pitchPlayer = (pid, x, y, no, pos, extra = '') => {
  const p = LX.P(pid);
  return `<button class="pp ${extra}" data-p="${pid}" style="left:${x}%;top:${y}%">${LX.ph(pid, 50)}<span class="no ${no == null ? 'u' : ''}">${no == null ? 'غ.م' : no}</span><span class="nm">${esc(LX.shortName(p))}</span><span class="ps">${esc(pos)}</span></button>`;
};

/* ---------------- squad screen (4 views) */
const VIEWS = [['pitch', 'الملعب'], ['pes', 'قائمة كلاسيكية'], ['cards', 'البطاقات'], ['full', 'التشكيلة الكاملة']];
LX.route(/^\/squad\/([^/]+)(?:\/(\w+))?$/, (root, sid, view) => {
  const s = LX.squadById[sid]; if (!s) return LX.go('/squads');
  view = view || S.get('sqview', 'pitch'); S.set('sqview', view);
  const t = LX.T(s.team);
  const xi = s.p.filter(x => x[3] === 'XI'), subs = s.p.filter(x => x[3] === 'SUB'), rest = s.p.filter(x => x[3] === 'SQ');
  const main = LX.page(root, { title: esc(t.ar) + ' ' + s.date.slice(0, 4), gen: false }, `
    <div class="sqhead" style="--c1:${t.c1}">${LX.crest(s.team, 54)}<div class="meta"><div class="t">${esc(s.comp)}</div><div class="m">${LX.nums(esc(s.match))}</div><div class="row" style="gap:6px;margin-top:4px"><span class="f">${esc(s.f)}</span><span class="muted" style="font-size:12px">${esc(s.date)}</span><span class="verbadge ${s.ver}">${s.ver === 'src' ? 'موثقة من سجل المباراة' : s.ver === 'wcdb' ? 'قاعدة بيانات كأس العالم' : 'معرفة تاريخية'}</span></div></div></div>
    <div class="tabs" style="margin-top:12px">${VIEWS.map(([k, l]) => `<button data-v="${k}" class="${k === view ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div id="v"></div>
    <p class="muted" style="font-size:11.5px;margin-top:12px">${s.kind === 'season' ? 'أرقام قمصان ثابتة للموسم. التشكيلة الأساسية تمثيلية للموسم وليست مباراة بعينها.' : 'تشكيلة مباراة واحدة بأرقامها في تلك المباراة. "غ.م" = غير موثق.'}</p>`);
  main.querySelectorAll('.tabs button').forEach(b => b.onclick = () => location.replace('#/squad/' + sid + '/' + b.dataset.v));
  const v = main.querySelector('#v');
  const pg = x => LX.posGroup(x[1]);
  if (view === 'pitch') {
    const L = LX.layout(s.f);
    v.innerHTML = `<div class="pitch">${LX.pitchLines()}${xi.map((x, i) => LX.pitchPlayer(x[2], L[i][0], L[i][1], x[0], x[1])).join('')}</div>
      ${subs.length ? `<div class="section-t">البدلاء المشاركون</div><div class="plist">${subs.map(x => LX.prow(LX.P(x[2]), `<span class="no">${x[0] ?? '–'}</span>`)).join('')}</div>` : ''}`;
  } else if (view === 'pes') {
    const r = x => { const p = LX.P(x[2]); return `<button class="r" data-p="${p.id}">${LX.ph(p.id, 38, 'sq')}<div class="nm">${esc(p.ar)}<small>${esc(p.en)}</small></div><div class="no ${x[0] == null ? 'u' : ''}">${x[0] ?? 'غير موثق'}</div><div class="pos pos-${pg(x)}">${esc(x[1])}</div></button>`; };
    v.innerHTML = `<div class="pes"><div class="hd"><span>PHOTO</span><span>PLAYER</span><span style="text-align:center">No.</span><span style="text-align:center">POS</span></div>
      ${xi.map(r).join('')}${subs.length ? `<div class="sep">SUBSTITUTES · البدلاء</div>${subs.map(r).join('')}` : ''}${rest.length ? `<div class="sep">SQUAD · بقية القائمة</div>${rest.map(r).join('')}` : ''}</div>`;
  } else if (view === 'cards') {
    v.innerHTML = `<div class="pcards">${s.p.map(x => LX.card(x[2], x[0], x[1], s)).join('')}</div>`;
  } else {
    let sort = 'pos';
    const sorter = { pos: (a, b) => ['GK', 'DF', 'MF', 'FW'].indexOf(pg(a)) - ['GK', 'DF', 'MF', 'FW'].indexOf(pg(b)), no: (a, b) => (a[0] ?? 999) - (b[0] ?? 999), nat: (a, b) => LX.natName(LX.P(a[2])).localeCompare(LX.natName(LX.P(b[2])), 'ar'), name: (a, b) => LX.P(a[2]).ar.localeCompare(LX.P(b[2]).ar, 'ar') };
    const sec = (ttl, arr) => arr.length ? `<div class="section-t">${ttl}<small>${arr.length}</small></div><div class="plist">${arr.slice().sort(sorter[sort]).map(x => LX.prow(LX.P(x[2]), `<span class="chip">${esc(x[1])}</span><span class="no">${x[0] ?? '–'}</span>`)).join('')}</div>` : '';
    const draw = () => {
      v.innerHTML = `<div class="row" style="margin-top:12px;gap:6px">ترتيب: ${[['pos', 'المركز'], ['no', 'الرقم'], ['nat', 'الجنسية'], ['name', 'الاسم']].map(([k, l]) => `<button class="chip ${k === sort ? 'gold' : ''}" data-sort="${k}">${l}</button>`).join('')}</div>
        ${sec('التشكيلة الأساسية', xi)}${sec('البدلاء الذين شاركوا', subs)}${sec('بقية أعضاء القائمة المسجلة', rest)}`;
      LX.loadPhotos(v);
    };
    v.onclick = e => { const b = e.target.closest('[data-sort]'); if (b) { sort = b.dataset.sort; draw(); } };
    draw();
  }
  v.addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) LX.go('/player/' + b.dataset.p); });
});

/* collectible card */
LX.card = (pid, no, pos, s) => {
  const p = LX.P(pid); const team = s ? LX.teamName(s.team) : (p.cl.length ? LX.teamName(p.cl[p.cl.length - 1][0]) : '');
  const period = s ? s.date.slice(0, 4) : LX.yearsLabel(p);
  return `<button class="pcard t${p.t}" data-p="${pid}"><span class="num ${no == null ? 'u' : ''}">${no ?? 'غير موثق'}</span><span class="pos en">${esc(pos || p.pos)}</span>${LX.ph(pid, 86)}<div class="nm">${esc(p.ar)}</div><div class="en">${esc(p.en)}</div><div class="meta"><span>${LX.flag((LX.T(p.nat) || {}).cc)} ${esc(LX.natName(p))}</span><span>${esc(team)}</span><span class="en">${esc(period)}</span></div><div class="sig">${LX.SIG}</div></button>`;
};

/* ---------------- editorial player card (bios*.txt) */
function cardHtml(p) {
  const x = p.x; if (!x) return '';
  const tn = t => t === p.nat ? 'منتخب ' + LX.natName(p) : LX.teamName(t);
  const row = (k, v) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`;
  const nos = Object.entries(x.no || {});
  return `<div class="section-t">البطاقة التعريفية</div><div class="card pcardx">
    ${x.role ? row('المركز المعروف به', esc(x.role)) : ''}
    ${x.nick ? row('اللقب', esc(x.nick[0]) + (x.nick[1] ? ` <span class="en muted">${esc(x.nick[1])}</span>` : '')) : ''}
    ${x.tags && x.tags.length ? `<div class="kv"><span class="k">ما يميّزه</span><span class="v tags">${x.tags.map(t => `<span class="chip">${esc(LX.TAGAR[t])}</span>`).join('')}</span></div>` : ''}
    ${x.desc ? `<p class="bdesc">${esc(x.desc)}</p>` : ''}
    ${(x.best || []).map(b => `<div class="bitem"><div class="bt">⭐ أفضل مواسمه — ${esc(tn(b[0]))} ${b[0] === p.nat ? LX.iso(b[1]) : LX.seasonLabel(b[1])}</div><div>${esc(b[2])}</div></div>`).join('')}
    ${(x.stat || []).map(t => `<div class="bitem"><div class="bt">📊 إحصائية مميزة</div><div>${esc(t)}</div></div>`).join('')}
    ${(x.story || []).map(st => `<div class="bitem"><div class="bt">📖 ${st[0] ? 'مع ' + esc(tn(st[0])) : 'حكاية لا تُنسى'}</div><div>${esc(st[1])}</div></div>`).join('')}
    ${nos.length ? `<div class="bt" style="margin-top:10px">👕 أرقام القميص</div><div class="nos">${nos.map(([t, ns]) => `<div class="noitem">${t === p.nat ? `<span class="fl">${LX.flag((LX.T(p.nat) || {}).cc)}</span>` : LX.crest(t, 24)}<span class="grow">${esc(tn(t))}</span><b class="en">${ns.join(' · ')}</b></div>`).join('')}</div>` : ''}
    ${x.ind && x.ind.length ? `<div class="bt" style="margin-top:10px">🏅 جوائز فردية</div><div class="honours">${x.ind.map(t => `<span class="chip gold">${esc(t)}</span>`).join('')}</div>` : ''}
    ${x.tit && x.tit.length ? `<div class="bt" style="margin-top:10px">🏆 ألقاب جماعية</div><div class="honours">${x.tit.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
    <p class="muted" style="font-size:11px;margin:10px 0 0">معلومات تحريرية من المعرفة التاريخية الموثقة عمومًا؛ الأرقام غير المؤكدة لم تُدرج.</p>
  </div>`;
}

/* ---------------- player profile */
LX.route(/^\/player\/([^/]+)$/, (root, pid) => {
  const p = LX.P(pid); if (!p) return LX.go('/home');
  const t = LX.T(p.nat);
  const sqs = (LX.squadsOf[pid] || []).slice().sort((a, b) => a.s - b.s);
  const nums = sqs.map(s => { const x = s.p.find(z => z[2] === pid); return { s, no: x[0], pos: x[1], role: x[3] }; });
  const mates = (LX.ADJ[pid] || []).map(([q, ev]) => ({ p: LX.P(q), ev: LX.bestEv(ev) })).sort((a, b) => ({ M: 0, S: 1, C: 2 }[a.ev.k] - { M: 0, S: 1, C: 2 }[b.ev.k]) || a.p.t - b.p.t);
  const hon = {}; p.h.forEach(([k, y]) => (hon[k] = hon[k] || []).push(y));
  const admin = S.get('admin', false); const phInfo = LX.photoInfo(pid);
  const main = LX.page(root, { title: esc(p.ar), gen: false }, `
    <div class="prof">${LX.ph(pid, 132)}<h2>${esc(p.ar)}</h2><div class="en ltr">${esc(p.en)}</div>
      <div class="row wrap" style="justify-content:center;gap:6px;margin-top:8px"><span class="chip">${LX.flag(t && t.cc)} ${esc(LX.natName(p))}</span><span class="chip gold">${esc(LX.POSDETAIL[p.pos] || p.pos)}</span>${p.t === 1 ? '<span class="chip green">أسطورة</span>' : ''}</div></div>
    <div class="facts">
      <div class="fact"><b>${p.b ? esc(p.b.length > 4 ? p.b : p.b) : 'غير موثق'}</b><small>تاريخ الميلاد</small></div>
      ${p.cl.length || !p.wc ? `<div class="fact"><b>${p.yr ? LX.iso(p.yr[0] + '–' + (p.yr[1] >= LX.NOW ? 'الآن' : p.yr[1])) : '–'}</b><small>سنوات النشاط</small></div>` : `<div class="fact"><b>${p.wc.length}</b><small>مشاركات في كأس العالم</small></div>`}
      <div class="fact"><b>${p.nt ? LX.iso(p.nt[0] + '–' + (p.nt[1] >= LX.NOW ? 'الآن' : p.nt[1])) : 'غير موثق'}</b><small>دوليًا مع ${esc(LX.natName(p))}</small></div>
    </div>
    ${cardHtml(p)}
    ${Object.keys(hon).length ? `<div class="section-t">أبرز الإنجازات</div><div class="honours">${Object.entries(hon).map(([k, ys]) => `<span class="chip gold">${LX.HONIC[k]} ${esc(LX.HONAR[k])}${ys.length > 1 ? ` ×${ys.length}` : ''} <span class="en" style="opacity:.8">${ys.join('، ')}</span></span>`).join('')}</div>` : ''}
    <div class="actions">
      <button class="btn green" id="a1">${I.link}بدء وصلة</button>
      <button class="btn" id="a2">${I.q}خمن زملاءه</button>
      <button class="btn gold" id="a3">${I.star}فريق الأحلام</button>
    </div>
    ${p.wc && p.wc.length ? `<div class="section-t">المشاركة في كأس العالم <small>مع ${esc(LX.natName(p))}</small></div><div class="card" style="padding:4px 10px"><table class="numtable">${p.wc.map(w => { const sq = (LX.squadsOf[pid] || []).find(s => s.s === w[0] && s.team === p.nat); return `<tr ${sq ? `data-s="${sq.id}"` : ''}><td class="n">${w[1] ?? '<span style="font-size:11px">غ.م</span>'}</td><td><b>كأس العالم ${w[0]}</b><div class="muted" style="font-size:11.5px">${esc(LX.POSDETAIL[w[2]] || w[2])}${sq ? ' · عرض التشكيلة' : ''}</div></td></tr>`; }).join('')}</table></div>` : ''}
    <div class="section-t">المسيرة مع الأندية <small>بالترتيب الزمني</small></div>
    ${p.cl.length ? `<div class="tl">${p.cl.map(c => `<button class="tli" data-t="${c[0]}" style="display:block;width:100%;text-align:start"><div class="row">${LX.crest(c[0], 30)}<div class="grow"><div style="font-weight:800">${esc(LX.teamName(c[0]))}</div><div class="y">${LX.spell(c)}</div></div></div></button>`).join('')}</div>${p.cs === 'tm' ? '<p class="muted" style="font-size:11.5px;margin:4px 2px 0">مسيرة الأندية مستخرجة من سجلات انتقالات Transfermarkt لـ9 دوريات أوروبية (1992–2023). الفترات خارج هذه الدوريات أو بعد 2023 قد لا تظهر، و"منذ" تعني أنه كان لا يزال بالنادي حتى 2023 على الأقل.</p>' : ''}` : (p.wc ? '<div class="empty">مسيرة الأندية لهذا اللاعب غير مضافة بعد — بياناته الموثقة حاليًا هي مشاركاته في كأس العالم</div>' : '<div class="empty">المسيرة الكاملة غير موثقة في القاعدة بعد</div>')}
    ${nums.length ? `<div class="section-t">أرقام القميص الموثقة</div><div class="card" style="padding:4px 10px"><table class="numtable">${nums.map(n => `<tr data-s="${n.s.id}"><td class="n">${n.no ?? '<span style="font-size:11px">غير موثق</span>'}</td><td><b>${esc(LX.teamName(n.s.team))}</b> · ${esc(n.s.comp)}<div class="muted" style="font-size:11.5px">${esc(n.pos)} · ${n.role === 'XI' ? 'أساسي' : n.role === 'SUB' ? 'بديل شارك' : 'ضمن القائمة'}</div></td></tr>`).join('')}</table></div>` : ''}
    ${sqs.length ? `<div class="section-t">ظهوره في التشكيلات التاريخية</div><div class="plist">${sqs.map(LX.squadRow).join('')}</div>` : ''}
    <div class="section-t">زملاء تاريخيون <small>${mates.length} زميل موثق</small></div>
    <div class="plist" id="mates">${mates.slice(0, 12).map(m => LX.prow(m.p, `<span class="chip ${m.ev.k === 'M' ? 'green' : ''}" style="font-size:10.5px">${esc(LX.teamName(m.ev.t))}</span>`)).join('')}</div>
    ${mates.length > 12 ? `<button class="btn block" style="margin-top:8px" id="more">عرض كل الزملاء (${mates.length})</button>` : ''}
    <div class="section-t">الصورة</div>
    <div class="card" style="font-size:12.5px" id="phc">${phInfo && !phInfo.n ? `مصدر الصورة: <a href="${esc(phInfo.src)}" target="_blank" rel="noopener">ويكيميديا كومنز</a> · الترخيص: ${esc(phInfo.lic)}${phInfo.art ? ` · ${esc(phInfo.art)}` : ''}` : 'تُجلب الصور من ويكيبيديا/ويكيميديا كومنز بعد التحقق من أنها للاعب نفسه وأن ترخيصها يسمح بإعادة الاستخدام. يظهر بديل أنيق عند عدم توفر صورة مرخصة.'}
      ${admin ? `<div class="row" style="margin-top:10px"><button class="btn sm" id="phr">استبدال الصورة</button><button class="btn sm" id="phd">حذف الاستبدال</button></div>` : ''}</div>`);
  main.querySelector('.tl') && (main.querySelector('.tl').onclick = e => { const b = e.target.closest('[data-t]'); if (b) LX.go('/team/' + b.dataset.t); });
  main.addEventListener('click', e => { const s = e.target.closest('[data-s]'); if (s) return LX.go('/squad/' + s.dataset.s); const q = e.target.closest('.prow[data-p]'); if (q) LX.go('/player/' + q.dataset.p); });
  main.querySelector('#a1').onclick = () => LX.go('/connect/build/' + pid);
  main.querySelector('#a2').onclick = () => { S.set('guessRel', pid); LX.go('/guess/play/rel'); };
  main.querySelector('#a3').onclick = () => LX.addToDream(pid);
  const more = main.querySelector('#more');
  if (more) more.onclick = () => { main.querySelector('#mates').innerHTML = mates.map(m => LX.prow(m.p, `<span class="chip ${m.ev.k === 'M' ? 'green' : ''}" style="font-size:10.5px">${esc(LX.teamName(m.ev.t))}</span>`)).join(''); more.remove(); LX.loadPhotos(main); };
  const phr = main.querySelector('#phr');
  if (phr) {
    phr.onclick = () => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = () => { const f = inp.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); const s2 = 320 / Math.max(img.width, img.height); c.width = img.width * s2; c.height = img.height * s2; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); const ov = S.get('phx', {}); ov[pid] = c.toDataURL('image/jpeg', .85); S.set('phx', ov); LX.toast('تم استبدال الصورة', 'good'); LX.render(); }; img.src = rd.result; }; rd.readAsDataURL(f); };
      inp.click();
    };
    main.querySelector('#phd').onclick = () => { const ov = S.get('phx', {}); delete ov[pid]; S.set('phx', ov); LX.render(); };
  }
});
})();
