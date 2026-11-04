#!/usr/bin/env python3
"""Extract representative club line-ups from StatsBomb Open Data (https://github.com/statsbomb/open-data).
For every (team, competition-season) the chosen match is the one whose starting XI overlaps most with the
season's most-used starters ("the generation's XI"). League tables are computed for full seasons.
Usage: sb_extract.py <statsbomb-data-dir>  ->  sb/candidates.json"""
import json, glob, os, sys, collections
SB = sys.argv[1]; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sb', 'candidates.json')
comps = {(c['competition_id'], c['season_id']): c for c in json.load(open(f'{SB}/competitions.json'))}
res = {}
for f in sorted(glob.glob(f'{SB}/matches/*/*.json')):
    cid, sid = int(f.split('/')[-2]), int(os.path.basename(f)[:-5])
    c = comps[(cid, sid)]; ms = json.load(open(f))
    full = len(ms) >= 300
    table = collections.defaultdict(lambda: [0, 0, 0, 0, 0, 0])  # P W D L GF GA
    starts = collections.defaultdict(collections.Counter); xi = {}; info = {}; names = {}
    for m in ms:
        h, a = m['home_team']['home_team_id'], m['away_team']['away_team_id']; names[h] = m['home_team']['home_team_name']; names[a] = m['away_team']['away_team_name']; hs, as_ = m['home_score'], m['away_score']
        for t, gf, ga in ((h, hs, as_), (a, as_, hs)):
            r = table[t]; r[0] += 1; r[4] += gf; r[5] += ga; r[1 if gf > ga else 2 if gf == ga else 3] += 1
        try: L = json.load(open(f'{SB}/lineups/{m["match_id"]}.json'))
        except Exception: continue
        for tl in L:
            t = tl['team_id']; st = []
            for p in tl['lineup']:
                pos = p.get('positions') or []
                if pos and pos[0].get('start_reason') == 'Starting XI':
                    st.append(dict(id=p['player_id'], name=p['player_name'], nick=p.get('player_nickname'), no=p.get('jersey_number'),
                                   pos=pos[0]['position'], cc=(p.get('country') or {}).get('name')))
                    starts[t][p['player_id']] += 1
            if len(st) == 11:
                xi[(t, m['match_id'])] = st
                info[(t, m['match_id'])] = dict(date=m['match_date'], home=names[h], away=names[a], hs=hs, as_=as_, stage=(m.get('competition_stage') or {}).get('name'))
    for t in starts:
        top = {pid for pid, _ in starts[t].most_common(11)}
        cands = [(k, v) for k, v in xi.items() if k[0] == t]
        if not cands: continue
        # most representative match; ties -> later in season
        k, v = max(cands, key=lambda kv: (sum(p['id'] in top for p in kv[1]), info[kv[0]]['date']))
        rank = None
        if full:
            order = sorted(table, key=lambda x: (-(table[x][1] * 3 + table[x][2]), -(table[x][4] - table[x][5]), -table[x][4]))
            rank = order.index(t) + 1
        res[f'{cid}/{sid}/{t}'] = dict(team=names.get(t, str(t)), comp=c['competition_name'], season=c['season_name'], match=k[1], xi=v, **info[k],
                                      games=sum(1 for kk in xi if kk[0] == t), table=table[t] if full else None, rank=rank, nteams=len(table) if full else None)
json.dump(res, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(len(res), 'team-seasons')
