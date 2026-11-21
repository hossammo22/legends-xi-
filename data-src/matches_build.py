#!/usr/bin/env python3
"""Builds data-src/matches.json: World Cup semi-finals + finals (1930-2022) and European finals
(Champions' Cup / Champions League 1956-2026, UEFA Cup / Europa League 1972-2026) with line-ups,
scorers, cards and short factual notes; plus European semi-final results.

Sources
  WC : Fjelstul World Cup Database (CC-BY-SA 4.0) for goals / cards / subs / shoot-outs / 1970+ line-ups;
       wc/ko_pre1970.txt (rsssf.org + Wikipedia) for 1930-1966 line-ups.
  EU : eu/raw/*.txt, transcribed from rsssf.org season pages (uefa.com for 2025-26).
Names that are not app players are kept as plain name pairs (en, ar) from eu/names.txt / wc/names_ar*.txt.
"""
import csv, json, os, re, sys, glob, unicodedata, collections
H = os.path.dirname(os.path.abspath(__file__))
W = os.path.join(H, 'wc')
rd = lambda f: list(csv.DictReader(open(f'{W}/{f}', encoding='utf-8')))
err, warn = [], []

def norm(s):
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z ]', ' ', s.replace('-', ' ')).split()

# ---------------- app tables (players / teams / squads) – read the plain sources the same way build.py does
def rows(path):
    for line in open(path, encoding='utf-8'):
        line = line.rstrip('\n')
        if line.strip() and not line.startswith('#'): yield line
teams = {}
for l in rows(os.path.join(H, 'teams.txt')):
    p = l.split('|'); teams[p[0]] = dict(en=p[1], ar=p[2], type=p[3])
tmf = json.load(open(os.path.join(H, 'tm', 'final.json'), encoding='utf-8'))
for k, t in tmf['teams'].items(): teams.setdefault(k, dict(en=t['en'], ar=t['ar'], type='club'))
players = {}
for f in sorted(glob.glob(os.path.join(H, 'players*.txt'))):
    for l in rows(f):
        p = l.split('|')
        if len(p) != 11: continue
        cl = []
        for c in p[8].split(';'):
            m = re.match(r'^\s*(\S+) (\d{4})-(\d{4})\s*$', c)
            if m: cl.append((m.group(1), int(m.group(2)), int(m.group(3))))
        players[p[0]] = dict(en=p[1], ar=p[2], nat=p[3], pos=p[4], cl=cl, al=[a.strip() for a in p[10].split(',') if a.strip()])
wci = json.load(open(os.path.join(W, 'import.json'), encoding='utf-8'))
for pid, p in wci['players'].items(): players[pid] = dict(en=p['en'], ar=p['ar'], nat=p['nat'], pos=p['pos'], cl=[], al=p['al'])
for pid, sp in tmf['careers'].items():
    if pid in players: players[pid]['cl'] = [(x[0], x[1], max(x[2], x[1] + 1)) for x in sp]
squads = []
cur = None
for f in sorted(glob.glob(os.path.join(H, 'squads*.txt'))):
    for l in rows(f):
        if l.startswith('>'): continue
        if l.startswith('@'):
            p = l[1:].split('|'); cur = dict(id=p[0], team=p[1], s=int(p[2]), date=p[5], f=p[6], p=[]); squads.append(cur)
        else:
            n, pos, pid, role = l.split('|'); cur['p'].append([None if n == '-' else int(n), pos, pid, role])
_have = {(q['team'], q['date']) for q in squads}
for q in wci['squads']:
    if (q['team'], q['date']) not in _have: squads.append(dict(id=q['id'], team=q['team'], s=q['s'], date=q['date'], f=q['f'], p=q['p']))
sq_by = {(q['team'], q['date']): q for q in squads}
# players appearing in any squad for a team (club context for name resolution)
in_team = collections.defaultdict(set)
for q in squads:
    for x in q['p']: in_team[(q['team'], q['s'])].add(x[2])

# ---------------- position templates for a row-grouped line-up (GK; back row; ...; front row)
def row_pos(rows_, era_pyramid):
    out = ['GK']; k = len(rows_)
    for ri, n in enumerate(rows_):
        last, first = ri == k - 1, ri == 0
        if first:
            out += {1: ['CB'], 2: ['RB', 'LB'], 3: ['RB', 'CB', 'LB'], 4: ['RB', 'CB', 'CB', 'LB'], 5: ['RWB', 'CB', 'CB', 'CB', 'LWB']}.get(n, ['DF'] * n)
        elif last:
            out += {1: ['CF'], 2: ['CF', 'CF'], 3: ['RW', 'CF', 'LW'], 4: ['RW', 'CF', 'CF', 'LW'], 5: ['OR', 'IR', 'CF', 'IL', 'OL']}.get(n, ['FW'] * n)
        elif ri == k - 2 and k >= 4:
            out += {1: ['AM'], 2: ['AM', 'AM'], 3: ['RW', 'AM', 'LW'], 4: ['RM', 'AM', 'AM', 'LM']}.get(n, ['MF'] * n)
        else:
            if era_pyramid and n == 3: out += ['RH', 'CH', 'LH']
            elif era_pyramid and n == 2: out += ['RH', 'LH']
            else: out += {1: ['DM'], 2: ['CM', 'CM'], 3: ['CM', 'CM', 'CM'], 4: ['RM', 'CM', 'CM', 'LM'], 5: ['RM', 'CM', 'CM', 'CM', 'LM']}.get(n, ['MF'] * n)
    return out

SUBRE = re.compile(r'\(([^()]*?)\)')
def parse_lineup(txt, need_gk=True):
    """'GK; A, B (Sub 46), C; D' -> (rows, [(name, captain, [(sub, min)])])"""
    txt = re.sub(r'\(subs used:[^)]*\)', '', txt).strip()
    groups = [g.strip() for g in txt.split(';') if g.strip()]
    entries, rows_ = [], []
    for gi, g in enumerate(groups):
        parts, depth, buf = [], 0, ''
        for ch in g:
            if ch == '(': depth += 1
            if ch == ')': depth -= 1
            if ch == ',' and depth == 0: parts.append(buf); buf = ''
            else: buf += ch
        parts.append(buf)
        cnt = 0
        for p in parts:
            p = p.strip()
            if not p: continue
            subs = []
            for inner in SUBRE.findall(p):
                if inner.strip() == 'c': continue
                for s in inner.split(','):
                    m = re.match(r'^\s*(.+?)\s+(\d+(?:\+\d+)?)\s*$', s) or re.match(r'^\s*(\d+)\.?\s+(.+?)\s*$', s)
                    if m and re.match(r'^\d', m.group(1)): subs.append((m.group(2).strip(), m.group(1)))
                    elif m: subs.append((m.group(1).strip(), m.group(2)))
                    elif s.strip(): subs.append((s.strip(), None))
            cap = '(c)' in p
            name = SUBRE.sub('', p).strip()
            entries.append((name, cap, subs)); cnt += 1
        rows_.append(cnt)
    if rows_ and rows_[0] == 1 and len(rows_) >= 3: rows_ = rows_[1:]
    elif need_gk: err.append(f'line-up without GK group: {txt[:50]}')
    else: rows_ = []
    return rows_, entries

# ---------------- name resolution
OVR = {}   # (year, teamcode, raw) -> pid or ('~', en, ar)
NEWN = {}  # raw name (normalised) -> (en, ar)   plain names for people not in the app
def load_names():
    f = os.path.join(H, 'eu', 'names.txt')
    if not os.path.exists(f): return
    for l in rows(f):
        p = [x.strip() for x in l.split('|')]
        if p[0].startswith('='):        # = year|team|raw|pid
            OVR[(int(p[0][1:]), p[1], p[2])] = p[3]
        else:                   # raw|English|Arabic   (team-independent plain name)
            NEWN[' '.join(norm(p[0]))] = (p[1] or p[0], p[2])
load_names()

def cands_for(team, year):
    s = set()
    for y in range(year - 2, year + 2): s |= in_team.get((team, y), set())
    for pid, p in players.items():
        if any(c[0] == team and c[1] - 1 <= year <= c[2] + 1 for c in p['cl']): s.add(pid)
    return s

def keyset(pid):
    p = players[pid]; ks = set()
    for nm in [p['en']] + p['al']:
        t = norm(nm)
        if not t: continue
        ks.add(' '.join(t)); ks.add(t[-1]); ks.add(' '.join(t[-2:])); ks.add(t[0])
        if len(t) >= 2: ks.add(t[0][0] + ' ' + t[-1]); ks.add(t[0][0] + ' ' + ' '.join(t[1:]))
    return ks

UNRES = collections.OrderedDict()
GLOB = {}
ERA = {}
for pid, p in players.items():
    ys = [c[1] for c in p['cl']] + [c[2] for c in p['cl']] + [w[0] for w in wci['players'].get(pid, {}).get('wc', [])]
    ys += [w[0] for w in wci['extend'].get(pid, {}).get('wc', [])]
    if ys: ERA[pid] = (min(ys), max(ys))
for q in squads:
    for x in q['p']:
        e = ERA.get(x[2]); ERA[x[2]] = (min(e[0], q['s']), max(e[1], q['s'])) if e else (q['s'], q['s'])
BYFULL = collections.defaultdict(set)
for pid, p in players.items():
    BYFULL[' '.join(norm(p['en']))].add(pid)
BYKEY = collections.defaultdict(set)
for pid in players:
    for k in keyset(pid): BYKEY[k].add(pid)
def resolve(raw, team, year, pool=None):
    raw = raw.strip()
    o = OVR.get((year, team, raw))
    if o: return o if o in players else None if o.startswith('~') else (err.append(f'override {raw}: unknown pid {o}') or None)
    if (year, team, raw) in OVR: return None
    t = norm(raw.replace('.', ' '))
    if not t: return None
    q = ' '.join(t)
    explicit = pool is not None
    pool = pool if pool is not None else cands_for(team, year)
    hits = [pid for pid in pool if q in keyset(pid)]
    if not hits and explicit:
        return None
    if not hits:
        def ok(pid):
            e = ERA.get(pid)
            if not e: return False
            if not players[pid]['cl']: return e[0] - 8 <= year <= e[1] + 3
            return e[0] - 3 <= year <= e[1] + (4 if e[1] >= 2021 else 2)
        def surname_ok(pid):
            for nm in [players[pid]['en']] + players[pid]['al']:
                tt = norm(nm)
                if tt and (tt == t or tt[-len(t):] == t): return True
            return False
        g = [pid for pid in BYKEY.get(q, ()) if ok(pid) and surname_ok(pid)]
        if len(g) == 1 and len(q) >= 5:
            GLOB[(year, team, raw)] = g[0]; return g[0]
    if len(hits) == 1: return hits[0]
    if len(hits) > 1:
        full = [pid for pid in hits if ' '.join(norm(players[pid]['en'])) == q or norm(players[pid]['en'])[-1] == t[-1]]
        if len(full) == 1: return full[0]
        UNRES[(year, team, raw)] = 'ambiguous: ' + ','.join(sorted(hits)[:5]); return None
    return None

def person(raw, team, year, pool=None):
    """-> ['pid'] or [None, en, ar]"""
    pid = resolve(raw, team, year, pool)
    if pid: return pid
    nn = NEWN.get(' '.join(norm(raw)))
    if nn: return [None, nn[0], nn[1]]
    if (year, team, raw) not in UNRES: UNRES[(year, team, raw)] = 'missing'
    return [None, raw, raw]

def build_lineup(txt, team, year, pyramid):
    rows_, ents = parse_lineup(txt)
    if len(ents) != 11: err.append(f'{year} {team}: line-up has {len(ents)} starters: {txt[:60]}')
    pos = row_pos(rows_, pyramid) if 1 + sum(rows_) == 11 else ['GK'] + ['MF'] * 10
    L = []
    for i, (nm, cap, subs) in enumerate(ents):
        e = dict(p=person(nm, team, year), pos=pos[i] if i < len(pos) else 'MF')
        if cap: e['c'] = 1
        for sn, mn in subs:
            e.setdefault('off', mn)
            L.append(e); e = dict(p=person(sn, team, year), pos='SUB', on=mn)
        L.append(e)
    return '-'.join(map(str, rows_)), L

# ======================================================================= World Cup
P = {r['player_id']: r for r in rd('players.csv')}
MERGE = {'P-77199': 'P-73110'}
SEL = json.load(open(f'{W}/selection.json', encoding='utf-8'))['match']
ARW = dict(l.rstrip('\n').split('|', 1) for l in open(f'{W}/names_ar.txt', encoding='utf-8'))
if os.path.exists(f'{W}/names_ko_ar.txt'):
    ARW.update(dict(l.rstrip('\n').split('|', 1) for l in open(f'{W}/names_ko_ar.txt', encoding='utf-8') if '|' in l and not l.startswith('#')))
CODE = json.load(open(f'{W}/teammap.json', encoding='utf-8'))
CODE.update({'CSK': 'N-TCH', 'YUG': 'N-YUG', 'DEU': 'N-GER', 'SUN': 'N-URS'})
WCMISS = {}
def wc_person(fid):
    fid = MERGE.get(fid, fid)
    if fid in SEL and SEL[fid] in players: return SEL[fid]
    if 'w' + fid[2:] in players: return 'w' + fid[2:]
    r = P[fid]
    full = ' '.join(norm(((r['given_name'] if r['given_name'] != 'not applicable' else '') + ' ' + (r['family_name'] if r['family_name'] != 'not applicable' else '')).strip()))
    hit = [pid for pid in BYFULL.get(full, ())]
    if len(hit) == 1: return hit[0]
    en = ((r['given_name'] if r['given_name'] != 'not applicable' else '') + ' ' + (r['family_name'] if r['family_name'] != 'not applicable' else '')).strip()
    if fid not in ARW: WCMISS[fid] = en
    return [None, en, ARW.get(fid, en)]

M = [r for r in rd('matches.csv') if "Men's" in r['tournament_name']]
KO = [r for r in M if r['stage_name'] in ('semi-finals', 'final') or r['match_id'] == 'M-1950-22']
AP = collections.defaultdict(list)
for r in rd('player_appearances.csv'): AP[r['match_id']].append(r)
GO = collections.defaultdict(list)
for r in rd('goals.csv'): GO[r['match_id']].append(r)
BK = collections.defaultdict(list)
for r in rd('bookings.csv'): BK[r['match_id']].append(r)
SB = collections.defaultdict(list)
for r in rd('substitutions.csv'): SB[r['match_id']].append(r)
PK = collections.defaultdict(list)
for r in rd('penalty_kicks.csv'): PK[r['match_id']].append(r)
SQW = collections.defaultdict(list)
for r in rd('squads.csv'): SQW[(r['tournament_id'], r['team_code'])].append(r)

# pre-1970 text line-ups
PRE = {}
blk = None
for l in open(f'{W}/ko_pre1970.txt', encoding='utf-8'):
    l = l.strip()
    if not l or l.startswith('# '): continue
    if l.startswith('## '):
        m = re.match(r'## (\d{4}) (\w+) (\S+) .*?\| (\w+) (\d+)-(\d+) (\w+)', l)
        blk = dict(y=int(m.group(1)), date=m.group(3), h=m.group(4), a=m.group(7), A=None, B=None)
        PRE[(blk['date'], blk['h'])] = blk; continue
    k, _, v = l.partition(':')
    if k in ('A', 'B'): blk[k] = v.strip()
FJ_ALIAS = {'URS': 'SUN', 'GER': 'DEU', 'FRG': 'DEU', 'CZE': 'CSK', 'YUG': 'YUG', 'ENG': 'ENG', 'POR': 'PRT', 'CHI': 'CHL', 'URU': 'URY', 'SWE': 'SWE',
            'HUN': 'HUN', 'BRA': 'BRA', 'ITA': 'ITA', 'AUT': 'AUT', 'ARG': 'ARG', 'USA': 'USA', 'FRA': 'FRA'}

def pre_lineup(txt, tid, tcode, year):
    rows_, ents = parse_lineup(txt, False)
    if len(ents) != 11: err.append(f'WC {year} {tcode}: {len(ents)} starters')
    if not rows_ or 1 + sum(rows_) != 11: rows_ = [2, 3, 5]
    pos = row_pos(rows_, True)
    sq = SQW[(tid, tcode)]
    L = []
    for i, (nm, cap, subs) in enumerate(ents):
        t = norm(nm.replace('.', ' '))
        def score(r):
            fam = norm(r['family_name'] if r['family_name'] != 'not applicable' else r['given_name'])
            giv = norm(r['given_name']) if r['given_name'] != 'not applicable' else []
            full = giv + fam
            if t == fam or t == full or t == giv: return 3
            if len(t) >= 2 and len(t[0]) == 1 and t[1:] == fam and giv and giv[0][0] == t[0]: return 3
            if t[-1:] == fam[-1:]: return 2
            if t[-1] in fam or t[-1] in full: return 1
            return 0
        best = sorted(sq, key=score, reverse=True)
        if not best or score(best[0]) == 0 or (len(best) > 1 and score(best[1]) == score(best[0])):
            UNRES[(year, tcode, nm)] = 'wc-pre: ' + ','.join(b['family_name'] for b in best[:3] if score(b) == score(best[0])); p = [None, nm, nm]
        else:
            p = wc_person(best[0]['player_id'])
        e = dict(p=p, pos=pos[i])
        if p and best and not isinstance(p, list) or (isinstance(p, list) and p[0] is None and p[1] != nm):
            no = int(best[0]['shirt_number'] or 0) or None
            if no: e['n'] = no
        if cap: e['c'] = 1
        L.append(e)
    return '-'.join(map(str, rows_)), L

STAGE_AR = {'semi-finals': 'SF', 'final': 'F', 'final round': 'F'}
def fmin(r): return r['minute_label'].replace("'", '').replace(' ', '')
matches = []
for m in KO:
    mid = m['match_id']; y = int(m['tournament_id'][3:])
    hc, ac = m['home_team_code'], m['away_team_code']
    H_, A_ = CODE.get(hc), CODE.get(ac)
    if not H_ or not A_: err.append(f'{mid}: team code {hc}/{ac}'); continue
    rec = dict(id='wc' + mid[2:].replace('-', '').lower(), c='WC', y=y, st=STAGE_AR[m['stage_name']], d=m['match_date'],
               v=f"{m['stadium_name']}, {m['city_name']}", h=H_, a=A_, hs=int(m['home_team_score']), as_=int(m['away_team_score']),
               src='wcdb')
    if m['extra_time'] == '1': rec['x'] = 'aet'
    if m['penalty_shootout'] == '1': rec['pen'] = [int(m['home_team_score_penalties']), int(m['away_team_score_penalties'])]
    side = lambda code: 0 if code == hc else 1
    # line-ups
    lus, forms = [[], []], ['', '']
    ap = AP.get(mid, [])
    if ap:
        LINE = {'GK': 0, 'DF': 1, 'CB': 1, 'RB': 1, 'LB': 1, 'SW': 1, 'MF': 2, 'CM': 2, 'RM': 2, 'LM': 2, 'DM': 2, 'AM': 2, 'RWB': 2, 'LWB': 2,
                'FW': 3, 'CF': 3, 'LW': 3, 'RW': 3, 'LF': 3, 'RF': 3, 'SS': 3}
        sd = lambda c: 0 if c.startswith('R') else 2 if c.startswith('L') else 1
        subs = SB.get(mid, [])
        for code in (hc, ac):
            xi = [r for r in ap if r['team_code'] == code and r['starter'] == '1']
            xi.sort(key=lambda r: (LINE.get(r['position_code'], 2), sd(r['position_code']), int(r['shirt_number'] or 99)))
            cnt = collections.Counter(LINE.get(r['position_code'], 2) for r in xi)
            forms[side(code)] = '-'.join(str(cnt[k]) for k in (1, 2, 3) if cnt[k])
            L = []
            offs = {MERGE.get(s['player_id'], s['player_id']): fmin(s) for s in subs if s['team_code'] == code and s['going_off'] == '1'}
            ons = [s for s in subs if s['team_code'] == code and s['coming_on'] == '1']
            for r in xi:
                e = dict(p=wc_person(r['player_id']), pos=r['position_code'], n=int(r['shirt_number'] or 0) or None)
                fid = MERGE.get(r['player_id'], r['player_id'])
                if fid in offs: e['off'] = offs[fid]
                L.append(e)
            for s in ons:
                L.append(dict(p=wc_person(s['player_id']), pos='SUB', n=int(s['shirt_number'] or 0) or None, on=fmin(s)))
            lus[side(code)] = L
    else:
        q = [sq_by.get((H_, m['match_date'])), sq_by.get((A_, m['match_date']))]
        pre = next((b for (d_, h_), b in PRE.items() if d_ == m['match_date'] and FJ_ALIAS.get(h_, h_) in (hc, ac)), None)
        for i, (code, tc) in enumerate(((hc, H_), (ac, A_))):
            if q[i]:
                rec.setdefault('sq', [None, None])[i] = q[i]['id']
                forms[i] = q[i]['f']
                lus[i] = [dict(p=x[2], pos=x[1], n=x[0]) if x[3] == 'XI' else dict(p=x[2], pos='SUB', n=x[0]) for x in q[i]['p'] if x[3] in ('XI', 'SUB')]
            elif pre:
                lst_home = FJ_ALIAS.get(pre['h'], pre['h']) == code
                txt = pre['A'] if lst_home else pre['B']
                forms[i], lus[i] = pre_lineup(txt, m['tournament_id'], code, y)
                rec['src'] = 'rsssf+wcdb'
            else:
                err.append(f'{mid}: no line-up for {code}')
    rec['f'] = forms; rec['L'] = lus
    # squads already in the app for this match
    for i, tc in enumerate((H_, A_)):
        q = sq_by.get((tc, m['match_date']))
        if q: rec.setdefault('sq', [None, None])[i] = q['id']
    # goals / cards / shoot-out
    G = []
    for g in sorted(GO.get(mid, []), key=lambda r: (int(r['minute_regulation']), int(r['minute_stoppage']))):
        sc = side(g['team_code'])
        e = [fmin(g), sc, wc_person(g['player_id'])]
        fl = 'og' if g['own_goal'] == '1' else 'p' if g['penalty'] == '1' else ''
        if fl: e.append(fl)
        G.append(e)
    rec['g'] = G
    R = []
    for b in BK.get(mid, []):
        if b['sending_off'] == '1' or b['red_card'] == '1' or b['second_yellow_card'] == '1':
            R.append([fmin(b), side(b['team_code']), wc_person(b['player_id'])])
    if R: rec['r'] = R
    pk = PK.get(mid, [])
    if pk: rec['pk'] = [[side(r['team_code']), wc_person(r['player_id']), int(r['converted'])] for r in pk]
    matches.append(rec)

# 1950 decider has no Fjelstul line-up and no squads row → text
# (handled above via PRE: key is ('1950-07-16','URU'))

# ======================================================================= Europe
TMAP = {}
for l in rows(os.path.join(H, 'eu', 'teams_map.txt')):
    raw, code = [x.strip() for x in l.split('|')]
    TMAP[raw] = code
def tcode(raw):
    raw = raw.strip()
    c = TMAP.get(raw)
    if not c: err.append(f'eu team not mapped: "{raw}"'); return raw
    if c not in teams: err.append(f'eu team code {c} not in teams'); return c
    return c

MON = {m: i + 1 for i, m in enumerate('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split())}
def pdate(s):
    m = re.match(r'(\d{1,2}) (\w{3}) (\d{4})', s.strip())
    if not m: err.append(f'bad date {s}'); return s
    return f'{m.group(3)}-{MON[m.group(2)]:02d}-{int(m.group(1)):02d}'

def split_score(s):
    # "Team A 3-2 Team B"
    m = re.match(r'^(.*?)\s+(\d+)-(\d+)\s+(.*)$', s.strip())
    return m.group(1), int(m.group(2)), int(m.group(3)), m.group(4)

semis = []
for f in sorted(glob.glob(os.path.join(H, 'eu', 'raw', '*.txt'))):
    year, cur, comp = None, None, None
    for l in open(f, encoding='utf-8'):
        l = l.rstrip('\n').strip()
        if not l or l.startswith('# '): continue
        if l.startswith('## '): year = int(l[3:7]); cur = None; continue
        k, _, v = l.partition(':'); k = k.strip(); v = v.strip()
        if k in ('CL-SEMI', 'UEFA-SEMI', 'EL-SEMI', 'CL-SEMI1', 'EL-SEMI1', 'CL-GROUP'):
            c = 'CL' if k.startswith('CL') else 'EL'
            p = [x.strip() for x in v.split('|')]
            if k == 'CL-GROUP':
                semis.append(dict(c=c, y=year, grp=[tcode(re.sub(r'\s*\(.*\)$', '', x)) for x in p])); continue
            if k.endswith('1'):
                m = re.match(r'^(\d+)-(\d+)\s*(\(.*\))?', p[2])
                semis.append(dict(c=c, y=year, a=tcode(p[0]), b=tcode(p[1]), one=[int(m.group(1)), int(m.group(2))], note=(m.group(3) or '').strip('()')))
            else:
                def sc(x):
                    m = re.match(r'^(\d+)-(\d+)', x); return [int(m.group(1)), int(m.group(2))]
                note = re.sub(r'^\d+-\d+\s*', '', p[4]).strip().strip('()')
                semis.append(dict(c=c, y=year, a=tcode(p[0]), b=tcode(p[1]), l1=sc(p[2]), l2=sc(p[3]), agg=sc(p[4]), note=note))
            continue
        if k in ('CL-FINAL', 'CL-REPLAY', 'UEFA-FINAL', 'UEFA-FINAL-1', 'UEFA-FINAL-2', 'EL-FINAL'):
            c = 'CL' if k.startswith('CL') else 'EL'
            st = {'CL-FINAL': 'F', 'CL-REPLAY': 'R', 'UEFA-FINAL': 'F', 'EL-FINAL': 'F', 'UEFA-FINAL-1': 'F1', 'UEFA-FINAL-2': 'F2'}[k]
            p = [x.strip() for x in v.split('|')]
            hn, hs, as_, an = split_score(p[2])
            ex = p[3] if len(p) > 3 else ''
            cur = dict(id=f'{c.lower()}{year}{st.lower()}', c=c, y=year, st=st, d=pdate(p[0]), v=p[1], h=tcode(hn), a=tcode(an), hs=hs, as_=as_,
                       src='rsssf' if year < 2026 else 'uefa', g=[], f=['', ''], L=[[], []], _raw=dict(h=hn, a=an))
            exl = ex.lower()
            if 'aet' in exl or 'golden' in exl or 'silver' in exl: cur['x'] = 'aet'
            if 'golden' in exl: cur['gg'] = 'golden'
            if 'silver' in exl: cur['gg'] = 'silver'
            mp = re.search(r'(\d+)-(\d+) pens', ex)
            if mp:
                a_, b_ = int(mp.group(1)), int(mp.group(2))
                # "X a-b pens" names the winner first
                wn = ex[:mp.start()].split(',')[-1].strip()
                winner_home = (wn and (wn in hn or hn.startswith(wn) or TMAP.get(wn) == cur['h'] or wn.split()[0] in hn))
                cur['pen'] = [a_, b_] if winner_home else [b_, a_]
            ma = re.search(r'agg (\d+)-(\d+)', ex)
            if ma: cur['agg'] = [int(ma.group(1)), int(ma.group(2))]
            if 'away goals' in exl: cur['ag'] = 1
            if 'replay' in exl: cur['rp'] = 1
            matches.append(cur); continue
        if cur is None: continue
        if k == 'G':
            p = [x.strip() for x in v.split('|')]
            if len(p) < 3: continue
            mn, tm, who = p[0], p[1], p[2]
            fl = 'og' if '(og)' in who else 'p' if '(pen)' in who else ''
            who = re.sub(r'\s*\((og|pen)\)', '', who)
            sd = 0 if tcode(tm) == cur['h'] else 1
            # own goal: scorer belongs to the other side
            who_team = cur['a'] if (sd == 0) == (fl == 'og') else cur['h']
            e = [mn, sd, ('P', who, who_team)]
            if fl: e.append(fl)
            cur['g'].append(e)
        elif k in ('A', 'B'):
            if v.startswith('('): continue          # existing squad
            team = cur['h'] if k == 'A' else cur['a']
            lst = v
            # A/B in the raw file are listed as teamA = the first team on the score line
            fm, L = build_lineup(lst, team, cur['y'] - 1, cur['y'] < 1966)
            i = 0 if k == 'A' else 1
            cur['f'][i] = fm; cur['L'][i] = L
        elif k == 'RED':
            if v.lower().startswith('none'): continue
            for part in v.split(';'):
                mm = re.match(r'\s*(.+?)\s*\((.+?)\)\s*(\d+)', part)
                if not mm: warn.append(f'red parse {part}'); continue
                nm, tm, mn = mm.groups()
                tmc = TMAP.get(tm.strip()) or next((c for r_, c in TMAP.items() if tm.strip() in r_), None)
                sd = 0 if tmc == cur['h'] else 1
                cur.setdefault('r', []).append([mn, sd, ('P', nm, cur['h'] if sd == 0 else cur['a'])])

# link existing squads + fill missing line-ups from them; resolve goal scorers against the line-ups
for mt in matches:
    if mt['c'] == 'WC': continue
    for i, tc in enumerate((mt['h'], mt['a'])):
        q = sq_by.get((tc, mt['d']))
        if q:
            mt.setdefault('sq', [None, None])[i] = q['id']
            if not mt['L'][i]:
                mt['f'][i] = q['f']
                mt['L'][i] = [dict(p=x[2], pos=x[1], n=x[0]) if x[3] == 'XI' else dict(p=x[2], pos='SUB', n=x[0]) for x in q['p'] if x[3] in ('XI', 'SUB')]
        if not mt['L'][i]: err.append(f"{mt['id']}: no line-up for {tc}")
    for key in ('g', 'r'):
        for e in mt.get(key, []):
            if isinstance(e[2], tuple):
                _, who, team = e[2]
                side = 0 if team == mt['h'] else 1
                pool = {x['p'] for x in mt['L'][side] if isinstance(x['p'], str)}
                pid = resolve(who, team, mt['y'] - 1, pool) if pool else None
                if not pid:
                    # match against the plain-name entries of that line-up
                    t = norm(who.replace('.', ' '))
                    for x in mt['L'][side]:
                        if not isinstance(x['p'], str) and (norm(x['p'][1].replace('.', ' '))[-1:] == t[-1:]):
                            pid = x['p']; break
                if not pid: pid = person(who, team, mt['y'] - 1)
                e[2] = pid
                kk = lambda q: q if isinstance(q, str) else 'N:' + q[1]
                if kk(pid) not in {kk(x['p']) for x in mt['L'][side]}:
                    mt['L'][side].append(dict(p=pid, pos='SUB'))   # scored/sent off, so he played: a substitute missing from the stored squad
    mt.pop('_raw', None)

for mt in matches:
    mt['as'] = mt.pop('as_')

# ---------------- notes (factual, derived) + curated notes
TA = lambda c: teams[c]['ar'].split(' / ')[0] if c in teams else c
def pname(p): return players[p]['ar'] if isinstance(p, str) else p[2]
CUR = collections.defaultdict(list)
nf = os.path.join(H, 'eu', 'notes.txt')
if os.path.exists(nf):
    for l in rows(nf):
        mid, _, txt = l.partition('|'); CUR[mid.strip()].append(txt.strip())
for mt in matches:
    N = []
    sc = collections.Counter()
    for g in mt['g']:
        if len(g) > 3 and g[3] == 'og': continue
        sc[(g[1], json.dumps(g[2], ensure_ascii=False))] += 1
    for (sd, pj), n in sc.items():
        if n >= 3: N.append(f'{pname(json.loads(pj))} يسجل {"أربعة" if n == 4 else n} أهداف.' if n > 3 else f'هاتريك: {pname(json.loads(pj))}.')
    if mt['g']:
        # comeback: a side trailing by 2+ and not losing
        h = a = 0; worst = [0, 0]
        for g in mt['g']:
            if g[1] == 0: h += 1
            else: a += 1
            worst[0] = min(worst[0], h - a); worst[1] = min(worst[1], a - h)
        for sd in (0, 1):
            fin = (mt['hs'] - mt['as']) if sd == 0 else (mt['as'] - mt['hs'])
            if worst[sd] <= -2 and fin >= 0:
                gap = {2: 'بهدفين', 3: 'بثلاثة أهداف', 4: 'بأربعة أهداف'}.get(-worst[sd], f'بـ{-worst[sd]} أهداف')
                won = fin > 0 or (mt.get('pen') and (mt['pen'][0] > mt['pen'][1]) == (sd == 0))
                N.append(f'عودة كبيرة: {TA(mt["h"] if sd == 0 else mt["a"])} عاد من تأخر {gap} ثم {"فاز" if won else "تعادل"}.')
        last = mt['g'][-1]
        try:
            mn = int(re.match(r'\d+', last[0]).group()); plus = '+' in last[0]
        except Exception: mn, plus = 0, False
        if (mn >= 88 or plus) and mn <= 90 and abs(mt['hs'] - mt['as']) <= 1 and not mt.get('x'):
            N.append(f'هدف قاتل في الدقيقة {last[0]} عن طريق {pname(last[2])}.')
        if mt.get('gg') == 'golden': N.append('حُسمت بالهدف الذهبي في الوقت الإضافي.')
        if mt.get('gg') == 'silver': N.append('حُسمت بالهدف الفضي في الوقت الإضافي.')
    for r in mt.get('r', []):
        N.append(f'طرد {pname(r[2])} ({TA(mt["h"] if r[1] == 0 else mt["a"])}) في الدقيقة {r[0]}.')
    if mt.get('pen'):
        w = mt['h'] if mt['pen'][0] > mt['pen'][1] else mt['a']
        N.append(f'حُسمت بركلات الترجيح {max(mt["pen"])}–{min(mt["pen"])} لصالح {TA(w)}.')
    mt['n'] = CUR.get(mt['id'], []) + N

semis.sort(key=lambda s: (s['c'], s['y']))
matches.sort(key=lambda m: (m['c'], m['y'], m['d']))
json.dump(dict(matches=matches, semis=semis), open(os.path.join(H, 'matches.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'matches {len(matches)} | semis {len(semis)} | unresolved {len(UNRES)} | wc names missing {len(WCMISS)} | errors {len(err)}', file=sys.stderr)
json.dump(dict(unres=[[*k, v] for k, v in UNRES.items()], wcmiss=WCMISS, glob=[[*k, v, players[v]['en'], players[v]['nat']] for k, v in GLOB.items()]), open('/tmp/claude-0/unres.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
for e in err[:60]: print('ERR', e, file=sys.stderr)
for w in warn[:20]: print('warn', w, file=sys.stderr)
if err: sys.exit(1)
