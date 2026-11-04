#!/usr/bin/env python3
"""Rebuild club careers for World-Cup-imported players from Transfermarkt transfer records
(ewenme/transfers, 9 European leagues, 1992/93-2022/23).

Rules (conservative):
  * a player is matched only when name AND birth year agree and the match is unique;
  * a spell at club C is kept only when its start and end are both known and consistent
    (the next transfer leaves from C), or C is a covered-league club still holding him at data end;
  * youth / reserve sides (B, II, U19, Castilla...) are not first-team spells;
  * time precision: summer window = season start, winter window = mid-season (+0.5).
Output: tm/careers.json  { appId: [[clubKey, a, b, ta, tb, open], ...] }  and tm/clubs_todo.txt
"""
import csv, glob, json, os, re, sys, unicodedata, collections
H = os.path.dirname(os.path.abspath(__file__)); T = os.path.join(H, 'tm')
def norm(s): return ' '.join(re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFD', (s or '').lower()).encode('ascii', 'ignore').decode()).split())
rows = [r for f in sorted(glob.glob(f'{T}/*.csv')) for r in csv.DictReader(open(f, encoding='utf-8'))]
DATA_END = 2023.0
PSEUDO = {'without club', 'retired', 'career break', 'unknown', 'ban', 'own youth', 'free agent', 'disqualification', 'deceased', 'unattached', 'pause', 'not found'}
YOUTH = re.compile(r'(\bu\d{2}\b|\bb\b|\bii\b|\biii\b|\bc\b|castilla|atletic|\bjong\b|youth|reserves?|primavera|\bjuvenil|\bacademy|\bsub[- ]?\d+|\bjgd\b|\bu-\d+)', re.I)
# ---- learn short (club_involved_name) -> long (club_name) names from transfers recorded on both sides
side = collections.defaultdict(list)
for r in rows:
    side[(norm(r['player_name']), r['season'], r['transfer_period'], r['transfer_movement'])].append(r)
vote = collections.defaultdict(collections.Counter)
for (p, s, per, mv), rs in side.items():
    if mv != 'out': continue
    ins = side.get((p, s, per, 'in'), [])
    for o in rs:
        for i in ins:
            if o['club_name'] != i['club_name']:
                vote[i['club_involved_name']][o['club_name']] += 1   # short name of the seller -> seller long name
                vote[o['club_involved_name']][i['club_name']] += 1   # short name of the buyer -> buyer long name
LONG = {r['club_name'] for r in rows}
SHORT2LONG = {}
STOPW = {'fc', 'cf', 'ac', 'as', 'sc', 'ss', 'cd', 'ud', 'afc', 'sv', 'club', 'de', 'calcio', 'rcd', 'sl', 'us', 'ssc'}
def similar(a, b):
    ta = [w for w in norm(a).split() if w not in STOPW]; tb = [w for w in norm(b).split() if w not in STOPW]
    return any(len(x) >= 3 and len(y) >= 3 and (x.startswith(y) or y.startswith(x)) for x in ta for y in tb)
for sh, c in vote.items():
    (lg, n), = c.most_common(1)
    tot = sum(c.values())
    # strong evidence, or the two names clearly belong together (prevents e.g. 'Estudiantes' -> 'Getafe CF')
    if n >= 0.5 * tot and (n >= 20 or (n >= 2 and similar(sh, lg))): SHORT2LONG[sh] = lg
def canon(name):
    if not name: return None
    n = name.strip()
    if norm(n) in PSEUDO or norm(n).startswith('without club'): return None
    return SHORT2LONG.get(n, n)
def youth(name): return bool(YOUTH.search(name or ''))
# one identity per club across renames / re-foundings (AC Fiorentina -> ACF Fiorentina, Parma FC -> Parma Calcio 1913 ...)
KEYSTOP = STOPW | {'acf', 'ssd', 'bc', 'kv', 'sk', 'krc', 'rsc', 'cfc', 'hsc', 'sco', 'fco', 'ogc', 'losc', 'aj', 'rc', 'balompie', 'clube', 'futebol', 'football', 'sad'}
SAME = {'internazionale': 'inter milan', 'inter': 'inter milan', 'olympique lyonnais': 'olympique lyon', 'lyon': 'olympique lyon', 'milan ac': 'milan',
        'atletico de madrid': 'atletico madrid', 'man utd': 'manchester united', 'man city': 'manchester city', 'spurs': 'tottenham hotspur'}
def ckey(name):
    if not name: return None
    k = ' '.join(w for w in norm(re.sub(r'\(.*?\)', ' ', name)).split() if w not in KEYSTOP and not w.isdigit())
    return SAME.get(k, k)
# ---- events per Transfermarkt player identity (name + estimated birth year)
ev = collections.defaultdict(dict)
for r in rows:
    try: age = int(r['age'])
    except ValueError: continue
    s = int(r['season'][:4]); t = s + (0.5 if r['transfer_period'].lower().startswith('w') else 0.0)
    club = r['club_name']; other = r['club_involved_name']
    frm, to = (other, club) if r['transfer_movement'] == 'in' else (club, other)
    fee = r['fee'] or ''
    k = (norm(r['player_name']), s - age)
    key = (t, canon(frm) or ('~' + norm(frm)), canon(to) or ('~' + norm(to)))
    ev[k][key] = dict(t=t, frm=canon(frm), to=canon(to), frm_raw=frm, to_raw=to, loan='loan' in fee.lower() and 'end of loan' not in fee.lower(),
                      ret='end of loan' in fee.lower(), name=r['player_name'])
# merge identities whose birth estimate differs by one (age is measured on different dates)
ident = collections.defaultdict(list)
for (n, b) in ev: ident[n].append(b)
def events_for(n, by):
    out = {}
    for b in ident.get(n, []):
        if abs(b - by) <= 1: out.update(ev[(n, b)])
    evs = sorted(out.values(), key=lambda e: (e['t'], e['ret'] is False))
    # within one transfer window, order the moves so that each one leaves the club the previous one arrived at
    res, i = [], 0
    while i < len(evs):
        grp = [e for e in evs[i:] if e['t'] == evs[i]['t']]; i += len(grp)
        cur = ckey(res[-1]['to']) if res else None
        while grp:
            nx = next((e for e in grp if cur and ckey(e['frm']) == cur), None) or next((e for e in grp if not any(ckey(o['to']) == ckey(e['frm']) for o in grp if o is not e)), grp[0])
            grp.remove(nx); res.append(nx); cur = ckey(nx['to'])
    return res
def ambiguous(n, by):
    bs = sorted(b for b in ident.get(n, []) if abs(b - by) <= 2)
    return len(bs) > 1 and (bs[-1] - bs[0]) > 2
# ---- chain -> spells
COVERED = LONG
def spells(evs):
    out = []
    for i, e in enumerate(evs):
        c = e['to']
        if not c or youth(e['to_raw']) or youth(c): continue
        nxt = next((x for x in evs[i + 1:] if x['t'] > e['t'] or x is not e), None)
        nxt = evs[i + 1] if i + 1 < len(evs) else None
        if nxt is None:
            if c in COVERED: out.append([c, e['t'], DATA_END, True])     # still there at data end (covered club records every exit)
            continue
        if ckey(nxt['frm']) == ckey(c) and nxt['t'] > e['t']:
            out.append([c, e['t'], nxt['t'], False])
    # merge consecutive spells at the same club (e.g. loan out and back recorded as two chains)
    merged = []
    for s in out:
        if merged and ckey(merged[-1][0]) == ckey(s[0]) and abs(merged[-1][2] - s[1]) < 0.01: merged[-1][2] = s[2]; merged[-1][3] = s[3]
        else: merged.append(s)
    return merged
# ---- targets: World-Cup-imported players, newest first
imp = json.load(open(os.path.join(H, 'wc', 'import.json'), encoding='utf-8'))
WCP = {r['player_id']: r for r in csv.DictReader(open(os.path.join(H, 'wc', 'players.csv'), encoding='utf-8'))}
res, stat, clubs = {}, collections.Counter(), collections.Counter()
order = sorted(imp['players'].items(), key=lambda kv: -max(w[0] for w in kv[1]['wc']))
for aid, p in order:
    r = WCP['P-' + aid[1:]]; by = int(p['b'][:4])
    g = '' if r['given_name'] == 'not applicable' else r['given_name']; f = '' if r['family_name'] == 'not applicable' else r['family_name']
    names = {norm((g + ' ' + f).strip()), norm(f) if not g else None, norm(g) if not f else None}
    names |= {norm(a) for a in p['al']}
    names.discard(None); names.discard('')
    hits = [n for n in names if any(abs(b - by) <= 1 for b in ident.get(n, []))]
    if not hits: stat['no_match'] += 1; continue
    if len(hits) > 1 and len({tuple(sorted(e['t'] for e in events_for(n, by))) for n in hits}) > 1:
        # several spellings matched with different histories -> prefer the full name if present
        full = norm((g + ' ' + f).strip())
        if full in hits: hits = [full]
        else: stat['ambiguous_name'] += 1; continue
    n = hits[0]
    if ambiguous(n, by): stat['ambiguous_identity'] += 1; continue
    evs = events_for(n, by)
    known = [e for e in evs if e['frm'] and e['to']]
    breaks = sum(1 for a, b in zip(known, known[1:]) if ckey(a['to']) != ckey(b['frm']) and not youth(a['to_raw']) and not youth(b['frm_raw']))
    if breaks >= 2 and breaks > 0.25 * len(known): stat['inconsistent_chain'] += 1; continue
    if not f or not g:   # mononyms (Fernandinho, Fred...) must have a fully consistent chain
        if breaks: stat['mononym_inconsistent'] += 1; continue
    sp = spells(evs)
    if not sp: stat['no_spell'] += 1; continue
    res[aid] = [[c, int(a), int(-(-b // 1)), a, b, op] for c, a, b, op in sp]
    for c, *_ in sp: clubs[c] += 1
    stat['ok'] += 1
json.dump({k: dict(v) for k, v in vote.items()}, open(f'{T}/votes.json', 'w', encoding='utf-8'), ensure_ascii=False)
json.dump(res, open(f'{T}/careers.json', 'w', encoding='utf-8'), ensure_ascii=False)
with open(f'{T}/clubs_todo.txt', 'w', encoding='utf-8') as fh:
    for c, n in clubs.most_common(): fh.write(f'{c}|{n}\n')
print(dict(stat), 'clubs:', len(clubs), file=sys.stderr)
