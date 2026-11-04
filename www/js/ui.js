/* LEGENDS XI — UI kit, photos, router. Created by Dr HOSSAM Mo */
(function () {
'use strict';
const LX = window.LX, S = LX.S, esc = LX.esc;

/* ---------------- icons */
const I = LX.I = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path fill="#e5484d" d="M12 21s-7.5-4.6-9.5-9.2C1 8.2 3.3 4.5 7 4.5c2 0 3.5 1.1 5 2.8 1.5-1.7 3-2.8 5-2.8 3.7 0 6 3.7 4.5 7.3C19.5 16.4 12 21 12 21z"/></svg>',
  puzzle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M10 3h4v3a2 2 0 1 0 4 0V3h3v7h-3a2 2 0 1 0 0 4h3v7h-7v-3a2 2 0 1 0-4 0v3H3v-7h3a2 2 0 1 0 0-4H3V3z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4M12 2v14"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
  q: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
  shirt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M8 3l-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>'
};

/* ---------------- original logo: shield + pitch geometry + XI */
LX.logo = (size = 120) => `
<svg class="logo" width="${size}" height="${size}" viewBox="0 0 200 200" aria-label="LEGENDS XI">
 <defs>
  <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6df8f"/><stop offset=".5" stop-color="#D4AF37"/><stop offset="1" stop-color="#8f6d14"/></linearGradient>
  <linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f8a5e"/><stop offset="1" stop-color="#0d3f2b"/></linearGradient>
 </defs>
 <path d="M100 8 L178 38 V98 C178 146 142 178 100 192 C58 178 22 146 22 98 V38 Z" fill="#101827" stroke="url(#lg1)" stroke-width="7"/>
 <path d="M100 24 L163 48 V98 C163 137 134 164 100 176 C66 164 37 137 37 98 V48 Z" fill="url(#lg2)"/>
 <g stroke="rgba(255,255,255,.35)" stroke-width="2" fill="none">
  <line x1="37" y1="100" x2="163" y2="100"/><circle cx="100" cy="100" r="22"/>
  <path d="M70 48 V66 H130 V48"/><path d="M78 176 V160 H122 V176" />
 </g>
 <g transform="translate(100 64)"><polygon points="0,-13 12.4,-4 7.6,10.5 -7.6,10.5 -12.4,-4" fill="#fff"/><polygon points="0,-6 5.7,-1.9 3.5,4.9 -3.5,4.9 -5.7,-1.9" fill="#101827"/></g>
 <text x="100" y="140" text-anchor="middle" font-family="Oswald,Cairo,sans-serif" font-weight="700" font-size="58" fill="url(#lg1)" letter-spacing="4">XI</text>
</svg>`;

/* ---------------- crest (generated, never a real club logo) */
LX.crest = (tid, size = 40) => {
  const t = LX.T(tid) || { en: tid, c1: '#334', c2: '#fff', type: 'club', cc: '' };
  if (t.type === 'nt') {
    return `<div class="crest" style="width:${size}px;height:${size}px;border-radius:50%;background:${t.c1};border:2px solid ${t.c2};font-size:${size * .55}px">${LX.flag(t.cc)}</div>`;
  }
  const words = t.en.replace(/\(.*?\)/g, '').replace(/[^A-Za-zÀ-ÿ0-9 ]/g, ' ').split(' ').filter(w => w && !/^(FC|AC|AS|SS|RCD|CF|SL|SC|1|VfL|VfB|TSG|de|of|the|City|United)$/i.test(w));
  const ini = (words.length === 1 ? words[0].slice(0, 3) : words.map(w => w[0]).join('').slice(0, 3)).toUpperCase();
  return `<div class="crest" style="width:${size}px;height:${size * 1.12}px;font-size:${size * .32}px;color:${t.c2};background:${t.c1};clip-path:polygon(50% 0,100% 14%,100% 60%,50% 100%,0 60%,0 14%);box-shadow:inset 0 0 0 3px ${t.c2}55">${esc(ini)}</div>`;
};

/* ---------------- photo service (Wikipedia / Wikimedia Commons, licence-checked, cached) */
const TITLES = {"ronaldo":"Ronaldo (Brazilian footballer)","pedro":"Pedro (footballer, born 1987)","raul":"Raúl (footballer)","kaka":"Kaká","marcelo":"Marcelo (footballer, born 1988)","dida":"Dida (footballer, born 1973)","edu":"Edu (footballer, born 1978)","lucio":"Lúcio","dante":"Dante (footballer)","fabinho":"Fabinho (footballer, born October 1993)","rodri":"Rodri (footballer, born 1996)","branco":"Branco (footballer)","jorginho":"Jorginho (footballer, born 1964)","mazinho":"Mazinho (footballer, born 1966)","viola":"Viola (footballer)","felix":"Félix (footballer, born 1937)","brito":"Brito (footballer, born 1939)","everaldo":"Everaldo (footballer, born 1944)","gerson":"Gérson","canario":"Canário","nando":"Nando (footballer, born 1967)","juancarlos":"Juan Carlos (footballer, born 1965)","eusebio":"Eusebio Sacristán","eusebio-pt":"Eusébio","serginho":"Serginho (footballer, born 1971)","edmilson":"Edmílson","denilson":"Denílson (footballer, born 1977)","marcos":"Marcos (footballer, born 1973)","juniorbaiano":"Júnior Baiano","cesar":"César Sánchez","tiago":"Tiago Mendes","leonardo":"Leonardo (footballer, born 1969)","socrates":"Sócrates","gedo":"Mohamed Nagy (footballer)","jair":"Jair da Costa","gento":"Francisco Gento","rivelino":"Roberto Rivellino","pele":"Pelé","alisson":"Alisson Becker","ederson":"Ederson (footballer, born 1993)","firmino":"Roberto Firmino","juanito":"Juanito (footballer, born 1954)","michel":"Míchel (footballer, born 1963)","pirri":"Pirri (footballer)","gavi":"Gavi (footballer)","vinicius":"Vinícius Júnior","abedipele":"Abedi Pele","carlosalberto":"Carlos Alberto Torres","piazza":"Wilson Piazza","simon":"Juan Simón","lauren":"Lauren (footballer, born 1977)","hanysaid":"Hany Said","gomaa":"Wael Gomaa","fathy-a":"Ahmed Fathy","ghaly":"Hossam Ghaly","hassan-a":"Ahmed Hassan","moteab":"Emad Moteab","zidan":"Mohamed Zidan","elhadary":"Essam El-Hadary","abdelshafy":"Mohamed Abdel-Shafy","moawad":"Sayed Moawad","moatasem":"Moatasem Salem","hossamhassan":"Hossam Hassan","mido":"Mido (footballer)","trezeguet-eg":"Trézéguet (Egyptian footballer)","chicharito":"Javier Hernández","enzo":"Enzo Fernández","alvarez":"Julián Álvarez","lautaro":"Lautaro Martínez","martinez-e":"Emiliano Martínez","romero-c":"Cristian Romero","romero-s":"Sergio Romero","perez-e":"Enzo Pérez","muller-g":"Gerd Müller","muller-t":"Thomas Müller","hoeness-u":"Uli Hoeneß","hoeness-d":"Dieter Hoeneß","cole-a":"Andrew Cole","cole-ashley":"Ashley Cole","cole-j":"Joe Cole","gomez-j":"Joe Gomez","gomez-m":"Mario Gómez","johnson-g":"Glen Johnson","kennedy-a":"Alan Kennedy","lee-s":"Sammy Lee","johnston":"Craig Johnston","rossi-s":"Sebastiano Rossi","rossi-p":"Paolo Rossi","galli-g":"Giovanni Galli","galli-f":"Filippo Galli","baggio-r":"Roberto Baggio","baggio-d":"Dino Baggio","thomas-jc":"Jean-Christophe Thomas","durand":"Jean-Philippe Durand","vidal-jm":"José María Vidal","vidal-a":"Arturo Vidal","dejong-t":"Theo de Jong","dejong-n":"Nigel de Jong","dejong-f":"Frenkie de Jong","jansen-w":"Wim Jansen","muhren-g":"Gerrie Mühren","forster-kh":"Karlheinz Förster","brown-jl":"José Luis Brown","ferreira-p":"Paulo Ferreira","carvalho-r":"Ricardo Carvalho","navas-j":"Jesús Navas","navas-k":"Keylor Navas","hernandez-l":"Lucas Hernandez","hernandez-t":"Theo Hernandez","thuram-m":"Marcus Thuram","fofana-y":"Youssouf Fofana","diarra-a":"Alou Diarra","traore-d":"Djimi Traoré","toure-k":"Kolo Touré","toure-y":"Yaya Touré","bender-s":"Sven Bender","butt-j":"Jörg Butt","laudrup-m":"Michael Laudrup","deboer-f":"Frank de Boer","deboer-r":"Ronald de Boer","vandekerkhof-r":"René van de Kerkhof","charlton-b":"Bobby Charlton","robson-b":"Bryan Robson","falcao-p":"Paulo Roberto Falcão","falcao-r":"Radamel Falcao","valverde-f":"Federico Valverde","neville-g":"Gary Neville","owen":"Michael Owen","rice":"Declan Rice","alexis":"Alexis Sánchez","jamesrodriguez":"James Rodríguez","luisgarcia":"Luis García (footballer, born 1978)","luisenrique":"Luis Enrique","camacho":"José Antonio Camacho","santamaria":"José Santamaría","dominguez":"Rogelio Domínguez","zarraga":"José María Zárraga","delsol":"Luis del Sol","humberto":"Humberto Coelho","chalana":"Fernando Chalana","coluna":"Mário Coluna","mancini":"Roberto Mancini","best":"George Best","law":"Denis Law","moore":"Bobby Moore","banks":"Gordon Banks","hurst":"Geoff Hurst","zico":"Zico (footballer)","garrincha":"Garrincha","marquitos":"Marquitos","pachin":"Pachín","finidi":"Finidi George","kanu":"Nwankwo Kanu","isco":"Isco","deco":"Deco","sanchis":"Manuel Sanchís Hontiyuelo","stoica":"Tudorel Stoica","lung":"Silviu Lung","balint":"Gavril Balint","bumbescu":"Adrian Bumbescu","iovan":"Ștefan Iovan","ungureanu":"Nicolae Ungureanu","minea":"Dan Minea","rotariu":"Iosif Rotariu","piturca":"Victor Pițurcă","lacatus":"Marius Lăcătuș","petrescu":"Dan Petrescu","hagi":"Gheorghe Hagi","buso":"Renato Buso","pari":"Fausto Pari","lanna":"Marco Lanna","bonetti":"Ivano Bonetti","colombo":"Angelo Colombo","cesarsampaio":"César Sampaio","gilbertosilva":"Gilberto Silva","robertocarlos":"Roberto Carlos","bernardo":"Bernardo Silva","rodrygo":"Rodrygo","pedri":"Pedri","neymar":"Neymar","salah":"Mohamed Salah","cristiano":"Cristiano Ronaldo","danialves":"Dani Alves","davidluiz":"David Luiz","juliocesar":"Júlio César (footballer, born 1979)","juninhopaulista":"Juninho Paulista","maurosilva":"Mauro Silva","marciosantos":"Márcio Santos","roquejunior":"Roque Júnior","flavioconceicao":"Flávio Conceição","ruicosta":"Rui Costa","paulosousa":"Paulo Sousa","xabialonso":"Xabi Alonso","javimartinez":"Javi Martínez","lucasmoura":"Lucas Moura","alexsandro":"Alex Sandro","vandersar":"Edwin van der Sar","vandervaart":"Rafael van der Vaart","vanderwiel":"Gregory van der Wiel","vanbasten":"Marco van Basten","vanbommel":"Mark van Bommel","vanbronckhorst":"Giovanni van Bronckhorst","vanbuyten":"Daniel Van Buyten","vandijk":"Virgil van Dijk","vanhanegem":"Willem van Hanegem","vanpersie":"Robin van Persie","alexanderarnold":"Trent Alexander-Arnold","macallister":"Alexis Mac Allister","debruyne":"Kevin De Bruyne","delpiero":"Alessandro Del Piero","derossi":"Daniele De Rossi","desisti":"Giancarlo De Sisti","depaul":"Rodrigo De Paul","dimaria":"Ángel Di María","dimeco":"Éric Di Meco","dilivio":"Angelo Di Livio","distefano":"Alfredo Di Stéfano","dimarco":"Federico Dimarco","kolomuani":"Randal Kolo Muani","delbosque":"Vicente del Bosque","amancio":"Amancio Amaro","santillana":"Carlos Alonso González","mcilroy":"Sammy McIlroy","buchan":"Martin Buchan","hugosanchez":"Hugo Sánchez","aboutrika":"Mohamed Aboutrika","amrzaki":"Amr Zaki","elneny":"Mohamed Elneny","marmoush":"Omar Marmoush","hakimi":"Achraf Hakimi","bounou":"Yassine Bounou","hadji":"Mustapha Hadji","madjer":"Rabah Madjer","belloumi":"Lakhdar Belloumi","suarez":"Luis Suárez","cavani":"Edinson Cavani","daei":"Ali Daei","aljaber":"Sami Al-Jaber","valderrama":"Carlos Valderrama","higuita":"René Higuita","yamal":"Lamine Yamal","bellingham":"Jude Bellingham","saka":"Bukayo Saka","odegaard":"Martin Ødegaard","brunofernandes":"Bruno Fernandes","terstegen":"Marc-André ter Stegen","deligt":"Matthijs de Ligt","depay":"Memphis Depay","eriksen":"Christian Eriksen","musampa":"Kiki Musampa","olarticoechea":"Julio Olarticoechea","goikoetxea":"Jon Andoni Goikoetxea","alexanko":"José Ramón Alexanko","eydelie":"Jean-Jacques Eydelie","sauzee":"Franck Sauzée","boli":"Basile Boli","angloma":"Jocelyn Angloma","zubizarreta":"Andoni Zubizarreta","salinas":"Julio Salinas","bakero":"José Mari Bakero","oleguer":"Oleguer Presas","moatasem2":"x"};
const PHC = S.get('ph', {});
let saveT;
const savePH = () => { clearTimeout(saveT); saveT = setTimeout(() => S.set('ph', PHC), 400); };
const queue = []; let active = 0; const MAXC = 4;
const pending = new Map(); // pid -> Promise
const hasCaches = typeof caches !== 'undefined';
const footy = /football|soccer|goalkeeper|striker|midfielder|defender|footballer|coach|manager/i;
const fname = u => { try { const parts = new URL(u).pathname.split('/'); const i = parts.indexOf('thumb'); return decodeURIComponent(i >= 0 ? parts[i + 3] : parts[parts.length - 1]); } catch (e) { return ''; } };
const strip = h => String(h || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const run = () => {
  while (active < MAXC && queue.length) {
    const job = queue.shift(); active++;
    job().finally(() => { active--; run(); });
  }
};
async function resolvePhoto(p) {
  const title = TITLES[p.id] || p.en.replace(/".*?"/g, '').replace(/\s+/g, ' ').trim();
  const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/ /g, '_')), { headers: { 'Api-User-Agent': 'LegendsXI/1.0 (football encyclopedia app)' } });
  if (!r.ok) throw new Error('nf');
  const j = await r.json();
  const desc = (j.description || '') + ' ' + (j.extract || '').slice(0, 220);
  if (j.type === 'disambiguation' || !footy.test(desc)) return { n: 1, why: 'mismatch', ts: Date.now() };
  const src = (j.thumbnail && j.thumbnail.source) || '';
  if (!src) return { n: 1, why: 'noimage', page: j.content_urls && j.content_urls.desktop.page, ts: Date.now() };
  const file = fname((j.originalimage && j.originalimage.source) || src);
  // licence check on Wikimedia Commons / Wikipedia file page
  const q = await fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=extmetadata|url&titles=' + encodeURIComponent('File:' + file));
  const qj = await q.json(); const pg = Object.values((qj.query && qj.query.pages) || {})[0] || {};
  const ii = (pg.imageinfo || [])[0] || {}; const m = ii.extmetadata || {};
  const nonfree = (m.NonFree && String(m.NonFree.value) === 'true') || /fair use|non-free/i.test((m.LicenseShortName || {}).value || '');
  if (nonfree) return { n: 1, why: 'nonfree', ts: Date.now() };
  const thumb = src.replace(/\/(\d+)px-/, '/400px-');
  return { u: thumb, file, lic: strip((m.LicenseShortName || {}).value) || 'غير محدد', art: strip((m.Artist || {}).value).slice(0, 120), credit: strip((m.Credit || {}).value).slice(0, 120), src: ii.descriptionurl || '', page: j.content_urls && j.content_urls.desktop.page, ts: Date.now() };
}
async function blobURL(url) {
  if (hasCaches) {
    try {
      const c = await caches.open('lxi-photos-v1');
      let res = await c.match(url);
      if (!res) { const r = await fetch(url, { mode: 'cors' }); if (!r.ok) throw 0; await c.put(url, r.clone()); res = r; }
      return URL.createObjectURL(await res.blob());
    } catch (e) { /* fall through to direct URL */ }
  }
  return url;
}
LX.photoInfo = pid => PHC[pid];
LX.photoURL = pid => {
  if (S.get('photos', true) === false) return Promise.resolve(null);
  const ov = S.get('phx', {})[pid]; if (ov) return Promise.resolve(ov);
  if (pending.has(pid)) return pending.get(pid);
  const pr = new Promise(resolve => {
    const job = async () => {
      try {
        let info = PHC[pid];
        const stale = info && info.n && Date.now() - info.ts > 7 * 864e5 && info.why !== 'mismatch' && info.why !== 'nonfree';
        if (!info || stale) {
          info = await resolvePhoto(LX.P(pid)); PHC[pid] = info; savePH();
        }
        if (info.n) return resolve(null);
        resolve(await blobURL(info.u));
      } catch (e) { resolve(null); }
    };
    queue.push(job); run();
  });
  pending.set(pid, pr); pr.then(v => { if (!v) pending.delete(pid); });
  return pr;
};
LX.clearPhotos = async () => { for (const k in PHC) delete PHC[k]; S.del('ph'); pending.clear(); if (hasCaches) await caches.delete('lxi-photos-v1'); };
LX.photoCredits = () => Object.entries(PHC).filter(([, v]) => !v.n).map(([pid, v]) => ({ pid, ...v }));

/** photo element; size px; opts {sq, hideName} */
LX.ph = (pid, size = 44, cls = '') => {
  const p = LX.P(pid); const t = p ? LX.T(p.nat) : null;
  const ini = p ? (p.en.replace(/".*?"/g, '').trim().split(/\s+/).map(w => w[0]).filter(c => /[A-Za-zÀ-ÿ]/.test(c)).slice(-2).join('') || '?') : '?';
  const bg = t ? `background:linear-gradient(145deg,${t.c1}cc,#16213a)` : '';
  return `<div class="ph ${cls}" data-pid="${esc(pid)}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .34)}px;${bg}"><span class="ini">${esc(ini.toUpperCase())}</span></div>`;
};
LX.loadPhotos = (root = document) => {
  root.querySelectorAll('.ph[data-pid]:not([data-l])').forEach(el => {
    el.setAttribute('data-l', '1');
    const pid = el.getAttribute('data-pid'); if (!LX.P(pid)) return;
    LX.photoURL(pid).then(u => {
      if (!u || !el.isConnected) return;
      const img = new Image(); img.alt = ''; img.decoding = 'async';
      img.onload = () => { img.classList.add('ld'); el.querySelector('.ini') && (el.querySelector('.ini').style.opacity = 0); };
      img.src = u; el.appendChild(img);
    });
  });
};

/* ---------------- toast + sheet */
let toastT;
LX.toast = (msg, kind = '', ms = 1800) => {
  let el = document.querySelector('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.className = 'toast ' + kind; el.textContent = msg; requestAnimationFrame(() => el.classList.add('on'));
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), ms);
};
LX.sheet = (html, onMount) => {
  LX.closeSheet();
  const bg = document.createElement('div'); bg.className = 'sheet-bg';
  const sh = document.createElement('div'); sh.className = 'sheet'; sh.innerHTML = '<div class="grab"></div>' + html;
  document.body.append(bg, sh);
  requestAnimationFrame(() => { bg.classList.add('on'); sh.classList.add('on'); });
  bg.onclick = LX.closeSheet; LX._sheet = [bg, sh];
  onMount && onMount(sh); LX.loadPhotos(sh);
  return sh;
};
LX.closeSheet = () => {
  if (!LX._sheet) return false; const [bg, sh] = LX._sheet; LX._sheet = null;
  bg.classList.remove('on'); sh.classList.remove('on'); setTimeout(() => { bg.remove(); sh.remove(); }, 260); return true;
};

/** Player picker sheet. opts: {title, filter(p), onPick(p)} */
LX.pickPlayer = opts => {
  const sh = LX.sheet(`<h3>${esc(opts.title || 'اختر لاعبًا')}</h3>
    <div class="search">${I.search}<input id="pk" placeholder="اكتب اسم اللاعب بالعربية أو الإنجليزية" autocomplete="off"></div>
    <div class="picker"><div class="plist" id="pkl"></div></div>`, sh => {
    const inp = sh.querySelector('#pk'), list = sh.querySelector('#pkl');
    const draw = () => {
      const r = inp.value.trim() ? LX.search(inp.value, 40, opts.filter) : (opts.suggest ? opts.suggest() : []);
      list.innerHTML = r.length ? r.map(p => LX.prow(p)).join('') : `<div class="empty">${inp.value.trim() ? 'لا نتائج مطابقة' : 'ابدأ الكتابة للبحث'}</div>`;
      LX.loadPhotos(list);
    };
    inp.oninput = draw; draw(); setTimeout(() => inp.focus(), 280);
    list.onclick = e => { const b = e.target.closest('[data-p]'); if (!b) return; const p = LX.P(b.dataset.p); LX.closeSheet(); opts.onPick(p); };
  });
  return sh;
};
LX.prow = (p, extra = '') => `<button class="prow" data-p="${p.id}">${LX.ph(p.id, 40)}<div class="grow"><div class="n">${esc(p.ar)}</div><div class="s"><span class="ltr">${esc(p.en)}</span> · ${LX.flag((LX.T(p.nat) || {}).cc)} ${esc(LX.POSAR[LX.posGroup(p.pos)])}${p.yr ? ` · ${LX.iso(p.yr[0] + '–' + Math.min(p.yr[1], LX.NOW))}` : ''}</div></div>${extra}</button>`;

/* ---------------- share / export */
LX.shareCanvas = async (canvas, name, text) => {
  const dataUrl = canvas.toDataURL('image/png');
  const C = window.Capacitor, P = C && C.Plugins;
  try {
    if (P && P.Filesystem && P.Share && C.isNativePlatform && C.isNativePlatform()) {
      const r = await P.Filesystem.writeFile({ path: name + '.png', data: dataUrl.split(',')[1], directory: 'CACHE' });
      await P.Share.share({ title: 'LEGENDS XI', text, files: [r.uri], dialogTitle: 'مشاركة' });
      return;
    }
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], name + '.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text, title: 'LEGENDS XI' }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = dataUrl; a.download = name + '.png'; document.body.appendChild(a); a.click(); a.remove();
  LX.toast('تم حفظ الصورة', 'good');
};
/** draws an image (blob url) cropped circular onto ctx */
LX.drawPhoto = async (ctx, pid, x, y, r) => {
  const p = LX.P(pid); const t = p && LX.T(p.nat);
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath();
  ctx.fillStyle = t ? t.c1 : '#223'; ctx.fill(); ctx.clip();
  const u = await LX.photoURL(pid);
  let drawn = false;
  if (u) {
    await new Promise(res => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { const s = Math.max(2 * r / im.width, 2 * r / im.height); const w = im.width * s, h = im.height * s; try { ctx.drawImage(im, x - w / 2, y - r - (h - 2 * r) * .15, w, h); drawn = true; } catch (e) {} res(); }; im.onerror = res; im.src = u; });
  }
  if (!drawn && p) { ctx.fillStyle = '#fff'; ctx.font = `700 ${r * .7}px Oswald`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.en.split(' ').map(w => w[0]).slice(-2).join(''), x, y); }
  ctx.restore(); ctx.lineWidth = Math.max(2, r * .08); ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
};
/** branded canvas frame; returns {c, ctx} */
LX.frame = (w, h, title) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0d1424'); g.addColorStop(1, '#101827'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  const rg = x.createRadialGradient(w / 2, -100, 10, w / 2, -100, w); rg.addColorStop(0, 'rgba(23,107,73,.55)'); rg.addColorStop(1, 'rgba(23,107,73,0)'); x.fillStyle = rg; x.fillRect(0, 0, w, h);
  x.fillStyle = '#D4AF37'; x.font = '700 54px Oswald'; x.textAlign = 'center'; x.fillText('LEGENDS XI', w / 2, 86);
  x.fillStyle = '#f0d277'; x.font = '500 20px Oswald'; x.fillText('F O O T B A L L   T I M E   M A C H I N E', w / 2, 118);
  if (title) { x.fillStyle = '#fff'; x.font = '700 34px Cairo'; x.direction = 'rtl'; x.fillText(title, w / 2, 178); x.direction = 'ltr'; }
  x.fillStyle = 'rgba(255,255,255,.75)'; x.font = '500 22px Oswald'; x.fillText(LX.SIG, w / 2, h - 34);
  x.strokeStyle = 'rgba(212,175,55,.6)'; x.lineWidth = 4; x.strokeRect(14, 14, w - 28, h - 28);
  return { c, ctx: x };
};

/* ---------------- router */
const routes = [];
LX.route = (re, fn) => routes.push([re, fn]);
LX.go = h => { if (location.hash === '#' + h) LX.render(); else location.hash = h; };
LX.back = () => { if (LX.closeSheet()) return; if (history.length > 1 && location.hash && location.hash !== '#/' && location.hash !== '#/home') history.back(); else LX.exitApp && LX.exitApp(); };
LX.render = () => {
  const h = (location.hash || '#/home').slice(1) || '/home';
  LX.closeSheet(); if (LX._timer) { clearInterval(LX._timer); LX._timer = null; }
  for (const [re, fn] of routes) {
    const m = h.match(re);
    if (m) { const root = document.getElementById('app'); root.innerHTML = ''; window.scrollTo(0, 0); fn(root, ...m.slice(1).map(x => x == null ? undefined : decodeURIComponent(x))); LX.loadPhotos(root); return; }
  }
  LX.go('/home');
};
window.addEventListener('hashchange', LX.render);

/** standard page: topbar + body. opts {title, back:true, gen:true, right} */
LX.page = (root, opts, body) => {
  const e = LX.era();
  root.innerHTML = `<header class="topbar">
     ${opts.back === false ? '' : `<button class="iconbtn" id="bk" aria-label="رجوع">${I.back}</button>`}
     <h1>${opts.title}</h1>
     ${opts.gen ? `<button class="genchip" id="gc">${I.clock}<span>${esc(e.label)}</span></button>` : ''}
     ${opts.right || ''}
   </header><main class="page">${body}</main>`;
  const bk = root.querySelector('#bk'); if (bk) bk.onclick = LX.back;
  const gc = root.querySelector('#gc'); if (gc) gc.onclick = () => LX.eraSheet();
  return root.querySelector('main');
};
LX.eraSheet = () => {
  const cur = LX.era().id;
  LX.sheet(`<h3>ذاكرة الأجيال — اختر الجيل</h3><div class="plist">${LX.ERAS.map(e => `<button class="prow" data-e="${e.id}" style="${e.id === cur ? 'border-color:var(--gold);background:rgba(212,175,55,.12)' : ''}"><div class="grow"><div class="n en" style="font-size:17px">${esc(e.label)}</div><div class="s">${esc(e.ar)} — ${esc(e.d)}</div></div>${e.id === cur ? '<span class="chip gold">مُفعّل</span>' : ''}</button>`).join('')}</div>
   <p class="muted" style="font-size:12px;margin:10px 4px 0">تُحدد الأجيال حسب سنة بداية الموسم (مثلًا 1960–1980 تعني مواسم 1960/61 حتى 1979/80) فلا تتكرر سنوات الحدود. يُصنَّف اللاعب حسب سنوات مسيرته الموثقة.</p>`, sh => {
    sh.onclick = ev => { const b = ev.target.closest('[data-e]'); if (!b) return; LX.setEra(b.dataset.e); LX.closeSheet(); LX.toast('تم اختيار جيل ' + LX.era().label, 'good'); LX.render(); };
  });
};
})();
