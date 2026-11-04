#!/usr/bin/env python3
"""Select World Cup players to import, by era quota, filling complete squads first.
Writes wc/selection.json (mapping + chosen players + squads) and wc/names_todo.txt."""
import csv, json, re, os, unicodedata, collections, sys
H = os.path.dirname(os.path.abspath(__file__)); W = os.path.join(H, 'wc')
QUOTA = {'A': 1501, 'B': 700, 'C': 500}  # A +1: one DB record is merged as a duplicate in wc_import.py
def norm(s): return re.sub(r'[^a-z ]', ' ', unicodedata.normalize('NFD', (s or '').lower()).encode('ascii', 'ignore').decode()).split()
P = {r['player_id']: r for r in csv.DictReader(open(f'{W}/players.csv', encoding='utf-8')) if r['female'] == '0'}
SQ = [r for r in csv.DictReader(open(f'{W}/squads.csv', encoding='utf-8')) if r['player_id'] in P and "Men's" in r['tournament_name']]
yrs = collections.defaultdict(set)
for r in SQ: yrs[r['player_id']].add(int(r['tournament_id'][3:]))
def era(pid):
    f = min(yrs[pid]); return 'A' if f >= 1998 else 'B' if f >= 1990 else 'C'
# ---- existing app players
import subprocess, tempfile
base = os.path.join(tempfile.gettempdir(), 'lxi_base.js')   # hand-curated players only (no WC import)
subprocess.run([sys.executable, os.path.join(H, 'build.py')], check=True, stdout=subprocess.DEVNULL, env=dict(os.environ, LXI_NO_WC='1', LXI_OUT=base))
src = open(base, encoding='utf-8').read()
db = json.loads(src[src.index('=') + 1:src.rindex(';')])
CODE = json.load(open(f'{W}/teammap.json', encoding='utf-8'))
by_date = collections.defaultdict(list); by_year = collections.defaultdict(list)
for p in db['players'].values():
    if not p['b']: continue
    by_date[p['b']].append(p); by_year[p['b'][:4]].append(p)
def toks(p): return set(norm(p['en'].replace('"', ' ')) + sum((norm(a) for a in p['al']), []))
match = {}
for pid, r in P.items():
    if not yrs.get(pid): continue
    fam = norm(r['family_name']) if r['family_name'] != 'not applicable' else []
    giv = norm(r['given_name']) if r['given_name'] != 'not applicable' else []
    key = (fam[-1:] or giv[-1:])
    if not key: continue
    nat = {CODE.get(s['team_code']) for s in SQ if s['player_id'] == pid} if False else None
    cands = [p for p in by_date.get(r['birth_date'], []) if key[0] in toks(p) or (giv and giv[0] in toks(p))]
    if len(cands) == 1: match[pid] = cands[0]['id']
MANUAL = {'P-07955': 'inacio', 'P-14923': 'clodoaldo', 'P-20643': 'helguera', 'P-25337': 'vandekerkhof-r', 'P-48712': 'vandekerkhof-w',
          'P-32212': 'deboer-f', 'P-92804': 'deboer-r', 'P-56735': 'lizarazu', 'P-68792': 'juliano', 'P-80379': 'serrizuela',
          'P-16126': 'rats', 'P-27906': 'zavarov', 'P-48718': 'lytovchenko'}
for k, v in MANUAL.items():
    for kk in [x for x, vv in match.items() if vv == v]: del match[kk]
    match[k] = v
# twins / namesakes born the same day (e.g. Hossam & Ibrahim Hassan): keep only the record whose given name matches
byapp = collections.defaultdict(list)
for k, v in match.items(): byapp[v].append(k)
for v, ks in byapp.items():
    if len(ks) > 1:
        t = toks(db['players'][v])
        keep = [k for k in ks if set(norm(P[k]['given_name'])) & t]
        for k in ks:
            if k not in keep[:1]: del match[k]
print('matched existing players:', len(match), file=sys.stderr)
# ---- squads 1970-2022 with line-up data
AP = list(csv.DictReader(open(f'{W}/player_appearances.csv', encoding='utf-8')))
M = {r['match_id']: r for r in csv.DictReader(open(f'{W}/matches.csv', encoding='utf-8')) if "Men's" in r['tournament_name']}
squads = collections.defaultdict(list)
for r in SQ:
    y = int(r['tournament_id'][3:])
    if y >= 1970: squads[(r['tournament_id'], r['team_code'])].append(r)
last = {}
for r in AP:
    if r['match_id'] not in M: continue
    k = (r['tournament_id'], r['team_code'])
    if k not in last or r['match_date'] > last[k]: last[k] = r['match_date']
BIG = {'BRA': 10, 'ARG': 10, 'DEU': 10, 'ITA': 9, 'FRA': 9, 'ESP': 9, 'NLD': 8, 'ENG': 8, 'PRT': 8, 'EGY': 10, 'MAR': 8, 'DZA': 7, 'TUN': 7, 'SAU': 7, 'QAT': 6, 'URY': 7, 'BEL': 7, 'HRV': 7, 'CMR': 6, 'NGA': 6, 'SEN': 6, 'GHA': 6, 'MEX': 5, 'USA': 5, 'COL': 6, 'CHL': 5, 'SWE': 5, 'DNK': 5, 'POL': 5, 'SUN': 6, 'YUG': 5, 'CSK': 4, 'TUR': 5, 'JPN': 5, 'KOR': 5, 'CIV': 6, 'SRB': 4, 'RUS': 4, 'IRN': 4, 'SCO': 3, 'CHE': 4, 'AUT': 3, 'ROU': 5, 'BGR': 5, 'HUN': 3, 'IRQ': 4, 'KWT': 4, 'ARE': 4}
def stage_w(k):
    rs = [r for r in AP if (r['tournament_id'], r['team_code']) == k and r['match_date'] == last.get(k)]
    if not rs: return 1
    st = rs[0]['stage_name']; return {'final': 4, 'third-place match': 3, 'semi-finals': 3, 'quarter-finals': 2}.get(st, 1)
SW = {k: stage_w(k) for k in squads if k in last}
chosen = set(); used = collections.Counter(); complete = []
def missing(k): return [r['player_id'] for r in squads[k] if r['player_id'] not in match and r['player_id'] not in chosen]
open_sq = [k for k in squads if k in last]
while True:
    best = None
    for k in open_sq:
        ms = missing(k); need = collections.Counter(era(p) for p in ms)
        if any(used[e] + n > QUOTA[e] for e, n in need.items()): continue
        sc = (BIG.get(k[1], 2) * SW[k]) / (len(ms) + 2)
        if best is None or sc > best[0]: best = (sc, k, ms)
    if not best: break
    _, k, ms = best
    for p in ms: chosen.add(p); used[era(p)] += 1
    complete.append(k); open_sq.remove(k)
print('complete squads:', len(complete), dict(used), file=sys.stderr)
# fill remaining quota with most-capped individual players (partial squads still give verified squad links)
apps = collections.Counter(r['player_id'] for r in AP)
rest = sorted((p for p in yrs if p not in chosen and p not in match and min(yrs[p]) >= 1962),
              key=lambda p: (-len(yrs[p]), -apps[p], -BIG.get(next(r['team_code'] for r in SQ if r['player_id'] == p), 2)))
for p in rest:
    e = era(p)
    if used[e] < QUOTA[e]: chosen.add(p); used[e] += 1
print('final:', dict(used), file=sys.stderr)
out = {'match': match, 'chosen': sorted(chosen), 'complete': [list(k) for k in complete]}
json.dump(out, open(f'{W}/selection.json', 'w'), ensure_ascii=False)
with open(f'{W}/names_todo.txt', 'w', encoding='utf-8') as f:
    for pid in sorted(chosen, key=lambda p: (era(p), next(r['team_code'] for r in SQ if r['player_id'] == p), P[p]['family_name'])):
        r = P[pid]; g = '' if r['given_name'] == 'not applicable' else r['given_name']; fa = '' if r['family_name'] == 'not applicable' else r['family_name']
        tc = next(s['team_code'] for s in SQ if s['player_id'] == pid)
        f.write(f"{pid}|{tc}|{(g + ' ' + fa).strip()}\n")
