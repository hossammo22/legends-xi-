#!/usr/bin/env python3
"""Builds www/js/data.js from the plain-text sources and validates them.

Rules enforced:
- every squad player must exist in the player table
- every club code must exist in teams.txt
- club teammate links only when two first-team spells overlap by >= 1 full season
- national-team links only from verified lineups (never from overlapping years)
"""
import json, glob, os, re, sys, unicodedata
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'www', 'js', 'data.js')
CURRENT = 2026

def rows(path):
    for line in open(path, encoding='utf-8'):
        line = line.rstrip('\n')
        if not line.strip() or line.startswith('#'):
            continue
        yield line

errors, warns = [], []

# ---------- teams
teams = {}
for l in rows(os.path.join(HERE, 'teams.txt')):
    p = l.split('|')
    tid, en, ar, typ, cc, c1, c2 = p
    teams[tid] = dict(id=tid, en=en, ar=ar, type=typ, cc=cc, c1=c1, c2=c2)

# ---------- players
HON = {'WC', 'EURO', 'CA', 'AFCON', 'CL', 'BDO', 'LIB'}
players = {}
for f in sorted(glob.glob(os.path.join(HERE, 'players*.txt'))):
    for l in rows(f):
        p = l.split('|')
        if len(p) != 11:
            errors.append(f'{os.path.basename(f)}: bad field count ({len(p)}): {l[:60]}')
            continue
        pid, en, ar, nat, pos, birth, tier, nty, clubs, hon, aliases = p
        if pid in players:
            errors.append(f'duplicate player id {pid}')
        if nat not in teams:
            errors.append(f'{pid}: unknown nation {nat}')
        spells = []
        for c in [x.strip() for x in clubs.split(';') if x.strip()]:
            m = re.match(r'^(\S+) (\d{4})-(\d{4})$', c)
            if not m:
                errors.append(f'{pid}: bad club spell "{c}"'); continue
            code, a, b = m.group(1), int(m.group(2)), int(m.group(3))
            if code not in teams:
                errors.append(f'{pid}: unknown club code {code}')
            if b <= a:
                errors.append(f'{pid}: empty spell {c}')
            spells.append([code, a, b])
        honours = []
        for h in hon.split():
            if h == '-':
                continue
            m = re.match(r'^([A-Z]+)(\d{4})$', h)
            if not m or m.group(1) not in HON:
                errors.append(f'{pid}: bad honour {h}'); continue
            honours.append([m.group(1), int(m.group(2))])
        nt = None
        if nty:
            m = re.match(r'^(\d{4})-(\d{4})$', nty)
            if m: nt = [int(m.group(1)), int(m.group(2))]
            else: errors.append(f'{pid}: bad NT years {nty}')
        players[pid] = dict(id=pid, en=en, ar=ar, nat=nat, pos=pos,
                            b=birth if birth != '-' else '', t=int(tier),
                            nt=nt, cl=spells, h=honours,
                            al=[a.strip() for a in aliases.split(',') if a.strip()],
                            partial=not spells)

# ---------- squads
squads, cur = [], None
for l in rows(os.path.join(HERE, 'squads.txt')):
    if l.startswith('@'):
        p = l[1:].split('|')
        sid, team, season, comp, match, date, form, kind, ver = p
        if team not in teams:
            errors.append(f'squad {sid}: unknown team {team}')
        cur = dict(id=sid, team=team, s=int(season), comp=comp, match=match,
                   date=date, f=form, kind=kind, ver=ver, p=[])
        squads.append(cur)
    else:
        n, pos, pid, role = l.split('|')
        if pid not in players:
            errors.append(f'squad {cur["id"]}: unknown player {pid}')
        cur['p'].append([None if n == '-' else int(n), pos, pid, role])

for s in squads:
    xi = [x for x in s['p'] if x[3] == 'XI']
    if len(xi) != 11:
        errors.append(f'squad {s["id"]}: XI has {len(xi)} players')
    rows_ = [int(x) for x in s['f'].split('-')]
    if 1 + sum(rows_) != 11:
        errors.append(f'squad {s["id"]}: formation {s["f"]} != 11')
    nums = [x[0] for x in s['p'] if x[0] is not None]
    if len(nums) != len(set(nums)):
        errors.append(f'squad {s["id"]}: duplicate shirt numbers')
    ids = [x[2] for x in s['p']]
    if len(ids) != len(set(ids)):
        errors.append(f'squad {s["id"]}: duplicate player')

# partial players: attach the verified spell implied by the lineup
for s in squads:
    t = teams[s['team']]
    if t['type'] != 'club':
        continue
    for n, pos, pid, role in s['p']:
        pl = players[pid]
        if not any(c[0] == s['team'] and c[1] <= s['s'] < c[2] for c in pl['cl']):
            if pl['partial'] or not pl['cl']:
                pl['cl'].append([s['team'], s['s'], s['s'] + 1])
            else:
                warns.append(f'{pid}: career lacks {s["team"]} {s["s"]} (lineup {s["id"]}) — added')
                pl['cl'].append([s['team'], s['s'], s['s'] + 1])

for pl in players.values():
    pl['cl'].sort(key=lambda c: (c[1], c[2]))
    # clamp open-ended careers to the current season
    for c in pl['cl']:
        if c[2] > CURRENT: c[2] = CURRENT

# ---------- era (active years) per player
for pl in players.values():
    ys = [c[1] for c in pl['cl']] + [c[2] for c in pl['cl']]
    if pl['nt']: ys += pl['nt']
    for s in squads:
        if any(x[2] == pl['id'] for x in s['p']): ys.append(s['s'])
    pl['yr'] = [min(ys), max(ys)] if ys else None
    if not ys:
        errors.append(f'{pl["id"]}: no years at all')

# ---------- edges
edges = defaultdict(list)   # key "a|b" (a<b) -> list of evidence
def add(a, b, ev):
    if a == b: return
    k = '|'.join(sorted([a, b]))
    edges[k].append(ev)

# match teammates (strongest evidence)
for s in squads:
    ids = [x[2] for x in s['p'] if x[3] in ('XI', 'SUB')]
    sq = [x[2] for x in s['p']]
    for i, a in enumerate(sq):
        for b in sq[i+1:]:
            typ = 'M' if (a in ids and b in ids) else 'S'
            add(a, b, dict(k=typ, t=s['team'], s=s['id'], y=[s['s'], s['s']+1]))

# club squad teammates from first-team spells, >=1 full overlapping season
byclub = defaultdict(list)
for pl in players.values():
    for c in pl['cl']:
        byclub[c[0]].append((pl['id'], c[1], c[2]))
for club, lst in byclub.items():
    for i in range(len(lst)):
        a, a1, a2 = lst[i]
        for j in range(i+1, len(lst)):
            b, b1, b2 = lst[j]
            lo, hi = max(a1, b1), min(a2, b2)
            if hi - lo >= 1 and a != b:
                k = '|'.join(sorted([a, b]))
                if any(e['k'] in ('M', 'S') and e['t'] == club for e in edges.get(k, [])):
                    continue
                add(a, b, dict(k='C', t=club, y=[lo, hi]))

# compact edges: keep best evidence per team
E = []
for k, evs in edges.items():
    a, b = k.split('|')
    seen = {}
    for e in evs:
        key = (e['t'], e.get('s'))
        seen.setdefault(key, e)
    E.append([a, b, list(seen.values())])

used_teams = set(c[0] for p in players.values() for c in p['cl']) | set(p['nat'] for p in players.values()) | set(s['team'] for s in squads)
teams_out = {k: v for k, v in teams.items() if k in used_teams}

stats = dict(players=len(players), squads=len(squads), edges=len(E),
             full=sum(1 for p in players.values() if not p['partial']),
             teams=len(teams_out))

if errors:
    print('ERRORS:'); print('\n'.join(errors)); sys.exit(1)
for w in warns: print('warn:', w)

for p in players.values():
    if p['partial']: p['pa'] = 1
    del p['partial']
db = dict(v=1, built=stats, teams=teams_out, players=players, squads=squads, edges=E)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write('/* LEGENDS XI database — generated by data-src/build.py. Do not edit by hand. */\n')
    f.write('window.LXI_DB=' + json.dumps(db, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('OK', stats, f'{os.path.getsize(OUT)//1024} KB')
