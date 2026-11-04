#!/usr/bin/env python3
"""Resolve Transfermarkt club names to app team ids and write tm/final.json for build.py.
   final.json = { teams: {id: {en, ar, cc}}, careers: {playerId: [[teamId, a, b, ta, tb, open], ...]} }"""
import json, os, re, csv, glob, unicodedata, sys
H = os.path.dirname(os.path.abspath(__file__)); T = os.path.join(H, 'tm')
auto = json.load(open(f'{T}/clubmap_auto.json', encoding='utf-8'))
alias, newteams = {}, {}
def slug(s): return 'X' + re.sub(r'[^A-Z0-9]', '', unicodedata.normalize('NFD', s.upper()).encode('ascii', 'ignore').decode())[:10]
country = {}
for f in glob.glob(f'{T}/*.csv'):
    for r in csv.DictReader(open(f, encoding='utf-8')): country.setdefault(r['club_name'], r['country'])
CC = {'England': 'GB', 'Spain': 'ES', 'Italy': 'IT', 'Germany': 'DE', 'France': 'FR', 'Portugal': 'PT', 'Netherlands': 'NL', 'Russia': 'RU'}
for l in open(f'{T}/clubs_ar.txt', encoding='utf-8'):
    if l.startswith('#') or not l.strip(): continue
    name, ar, *rest = l.rstrip('\n').split('|')
    if rest and rest[0].startswith('='): alias[name] = rest[0][1:]; continue
    tid = slug(name)
    while tid in newteams: tid += 'Z'
    newteams[tid] = dict(en=re.sub(r'\s*\(.*?\)', '', name).strip(), ar=ar, cc=CC.get(country.get(name, ''), ''), tm=name)
by_tm = {v['tm']: k for k, v in newteams.items()}
def resolve(c, depth=0):
    if c in auto: return auto[c]
    if c in alias:
        a = alias[c]
        return a if re.fullmatch(r'[A-Z0-9]+', a) and a not in by_tm and a not in alias and a not in auto else resolve(a, depth + 1)
    return by_tm.get(c)
car = json.load(open(f'{T}/careers.json', encoding='utf-8'))
out, miss = {}, set()
for pid, sp in car.items():
    res = []
    for c, a, b, ta, tb, op in sp:
        tid = resolve(c)
        if not tid: miss.add(c); continue
        if res and res[-1][0] == tid and abs(res[-1][4] - ta) < 0.01: res[-1][2] = b; res[-1][4] = tb; res[-1][5] = op; continue
        res.append([tid, a, b, ta, tb, op])
    if res: out[pid] = res
used = {s[0] for v in out.values() for s in v}
json.dump(dict(teams={k: v for k, v in newteams.items() if k in used}, careers=out), open(f'{T}/final.json', 'w', encoding='utf-8'), ensure_ascii=False)
print(f'players with careers: {len(out)} | new clubs used: {len(used & set(newteams))} | unresolved clubs: {len(miss)}', file=sys.stderr)
if miss: print(sorted(miss)[:40], file=sys.stderr)
