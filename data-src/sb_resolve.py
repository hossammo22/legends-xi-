#!/usr/bin/env python3
"""Match StatsBomb starters of the selected generations to app players; list the ones that must be created."""
import json, os, re, unicodedata, collections, sys
H = os.path.dirname(os.path.abspath(__file__))
def norm(s): return ' '.join(re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFD', (s or '').lower()).encode('ascii', 'ignore').decode()).split())
src = open(os.path.join(H, '..', 'www', 'js', 'data.js'), encoding='utf-8').read()
D = json.loads(src[src.index('{'):src.rindex('}') + 1])
P = {k: v for k, v in D['players'].items() if not k.startswith('sb') and not k.startswith('g-')}; T = D['teams']   # base DB without generated players
cc2nt = {}
for t in T.values():
    if t['type'] == 'nt': cc2nt[norm(t['en'])] = t['id']
cc2nt.update({norm(k): v for k, v in {'Korea (South)': 'N-KOR', 'Korea Republic': 'N-KOR', "Côte d'Ivoire": 'N-CIV', 'Ivory Coast': 'N-CIV', 'United States': 'N-USA',
     'Czech Republic': 'N-CZE', 'Bosnia and Herzegovina': 'N-BIH', 'Congo DR': 'N-COD', 'Republic of Ireland': 'N-IRL', 'Ireland': 'N-IRL', 'Northern Ireland': 'N-NIR',
     'Wales': 'N-WAL', 'Scotland': 'N-SCO', 'England': 'N-ENG', 'Holland': 'N-NED', 'Netherlands': 'N-NED', 'Macedonia': 'N-MKD', 'North Macedonia': 'N-MKD',
     'Cape Verde Islands': 'N-CPV', 'Cape Verde': 'N-CPV', 'Guinea-Bissau': 'N-GNB', 'Iran': 'N-IRN', 'Russia': 'N-RUS', 'Turkey': 'N-TUR', 'Türkiye': 'N-TUR', 'Germany': 'N-GER', 'United States of America': 'N-USA', 'Albania': 'N-ALB', 'Burkina Faso': 'N-BFA',
     'Central African Republic': 'N-CTA', 'Congo, (Kinshasa)': 'N-COD', 'Guinea': 'N-GUI', 'Jamaica': 'N-JAM', 'Kenya': 'N-KEN', 'Madagascar': 'N-MAD', 'New Zealand': 'N-NZL',
     'Paraguay': 'N-PAR', 'China': 'N-CHN', 'China PR': 'N-CHN', 'Guadeloupe': 'N-FRA', 'Slovakia': 'N-SVK', 'Venezuela\xa0(Bolivarian Republic)': 'N-VEN'}.items()})
idx = collections.defaultdict(set); surn = collections.defaultdict(set)
for p in P.values():
    for n in [p['en']] + p.get('al', []):
        k = norm(n)
        if k: idx[k].add(p['id'])
    toks = norm(p['en']).split()
    if toks: surn[toks[-1]].add(p['id'])
def by(pid): return int((P[pid].get('b') or '0000')[:4] or 0)
FORCE = {'Juan Francisco Torres Belén': 'juanfran', 'António Alberto Bastos Pimparel': 'w27059', 'Dayotchanculle Upamecano': 'upamecano', 'Daniel Carvajal Ramos': 'carvajal', 'Daniel Olmo Carvajal': 'w40007'}
NEVER = {'Luis García Fernández'}   # homonyms of app players that are different people  # homonyms: decided by hand
def resolve(sp, nat, season=None):
    if sp['name'] in FORCE: return [FORCE[sp['name']]]
    if sp['name'] in NEVER or sp.get('nick') in NEVER: return []
    cands = []
    for n in (sp.get('nick'), sp['name']):
        k = norm(n)
        if k in idx: cands = list(idx[k]); break
    if not cands:
        toks = norm(sp['name']).split()
        # full name contains first+last of an app player of the same nation (e.g. "Lionel Andrés Messi Cuccittini")
        for pid, p in P.items():
            t = norm(p['en']).split()
            if len(t) >= 2 and p['nat'] == nat and all(x in toks for x in t): cands.append(pid)
        if not cands and sp.get('nick'):
            t = norm(sp['nick']).split()
            if len(t) > 1: cands = [pid for pid in surn.get(t[-1], ()) if P[pid]['nat'] == nat and norm(P[pid]['en']).split()[0] == t[0]]
        if not cands and season and not sp.get('nick'):   # same first name + surname + nation + playing age, unique
            for tok in set(toks[-2:]):
                first = norm(sp.get('nick') or sp['name']).split()[0]
                c2 = [pid for pid in surn.get(tok, ()) if P[pid]['nat'] == nat and by(pid) and 16 <= season - by(pid) <= 41
                      and norm(P[pid]['en']).split()[0] == first]
                if len(c2) == 1: cands = c2; break
    if nat: cands = [c for c in cands if P[c]['nat'] == nat] or ([] if len(cands) != 1 else cands)
    if season:   # a starter of that season must be of playing age
        cands = [c for c in cands if not by(c) or 16 <= season - by(c) <= 41]
    return cands
if __name__ == '__main__':
    cand = json.load(open(os.path.join(H, 'sb', 'candidates.json'), encoding='utf-8'))
    byk = {(k.split('/')[0] + '/' + k.split('/')[1], v['team']): v for k, v in cand.items()}
    out, new = [], {}
    amb = []
    for l in open(os.path.join(H, 'sb', 'select.txt'), encoding='utf-8'):
        if not l[:1].isdigit(): continue
        cs, t, app, story = l.rstrip('\n').split('|'); v = byk[(cs, t)]
        xi = []
        for sp in v['xi']:
            nat = cc2nt.get(norm(sp['cc']))
            c = resolve(sp, nat, int(v['season'][:4]))
            if len(c) > 1: amb.append((sp['name'], c))
            pid = c[0] if len(c) == 1 else None
            if not pid:
                pid = 'sb' + str(sp['id'])
                new.setdefault(pid, dict(name=sp['name'], nick=sp.get('nick'), cc=sp['cc'], nat=nat, pos=sp['pos'], spells=[]))['spells'].append((app, int(v['season'][:4])))
            xi.append(dict(pid=pid, no=sp['no'], pos=sp['pos']))
        out.append(dict(key=cs, team=t, app=app, story=story, season=int(v['season'][:4]), comp=v['comp'], date=v['date'], home=v['home'], away=v['away'], hs=v['hs'], as_=v['as_'], stage=v.get('stage'), xi=xi))
    json.dump(dict(lineups=out, new=new), open(os.path.join(H, 'sb', 'resolved.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(len(out), 'lineups;', len(new), 'new players;', 'ambiguous:', amb[:20], file=sys.stderr)
    print('no nation:', sorted({x['cc'] for x in new.values() if not x['nat']}), file=sys.stderr)
