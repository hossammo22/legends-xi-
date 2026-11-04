#!/usr/bin/env python3
"""Turns the Fjelstul World Cup Database + wc/selection.json + wc/names_ar.txt into wc/import.json,
which build.py merges into the app database.

Produces:
  players  : new players (id 'w#####') with WC participations, honours, tier
  extend   : WC participations/honours for players that already exist in the app
  squads   : complete national-team squads (every member present) with the last match line-up
  wcsq     : every World Cup squad list (1962-2022) restricted to players present in the app,
             used to build verified 'squad teammate' links
"""
import csv, json, os, re, collections, unicodedata, sys
H = os.path.dirname(os.path.abspath(__file__)); W = os.path.join(H, 'wc')
MERGE = {'P-77199': 'P-73110'}   # DB record links to another player's page; squad rows belong to Hussein Abdulghani
rd = lambda f: list(csv.DictReader(open(f'{W}/{f}', encoding='utf-8')))
P = {r['player_id']: r for r in rd('players.csv')}
SQ = [r for r in rd('squads.csv') if "Men's" in r['tournament_name'] and int(r['tournament_id'][3:]) >= 1962]
AP = [r for r in rd('player_appearances.csv') if "Men's" in r['tournament_name']]
M = {r['match_id']: r for r in rd('matches.csv') if "Men's" in r['tournament_name']}
TOUR = {r['tournament_id']: r for r in rd('tournaments.csv')}
for rows in (SQ, AP):
    for r in rows: r['player_id'] = MERGE.get(r['player_id'], r['player_id'])
CODE = json.load(open(f'{W}/teammap.json', encoding='utf-8'))
sel = json.load(open(f'{W}/selection.json', encoding='utf-8'))
AR = dict(l.rstrip('\n').split('|', 1) for l in open(f'{W}/names_ar.txt', encoding='utf-8'))
TEAM_AR = {}
for l in open(os.path.join(H, 'teams.txt'), encoding='utf-8'):
    if l.startswith('N-'): p = l.split('|'); TEAM_AR[p[0]] = p[2].split(' / ')[0]
match = sel['match']
chosen = [p for p in sel['chosen'] if p not in MERGE]
def app_id(pid):
    if pid in match: return match[pid]
    if pid in chosen_set: return 'w' + pid[2:]
    return None
chosen_set = set(chosen)
WON = {t: CODE.get(next((r['team_code'] for r in SQ if r['tournament_id'] == t and r['team_name'] == TOUR[t]['winner']), ''), None) for t in TOUR}
# ---- participations
part = collections.defaultdict(list)   # pid -> [[year, no, pos, teamAppId]]
for r in SQ:
    y = int(r['tournament_id'][3:]); no = int(r['shirt_number']) or None
    part[r['player_id']].append([y, no, r['position_code'], CODE[r['team_code']]])
apps = collections.Counter(r['player_id'] for r in AP)
def honours(pid):
    return sorted({('WC', y) for y, _, _, t in part[pid] if WON.get(f'WC-{y}') == t})
def name_en(r):
    g = '' if r['given_name'] == 'not applicable' else r['given_name']
    f = '' if r['family_name'] == 'not applicable' else r['family_name']
    return (g + ' ' + f).strip()
def ascii_(s): return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode()
players, extend = {}, {}
for pid in chosen:
    r = P[pid]; pp = sorted(part[pid])
    pos = collections.Counter(x[2] for x in pp).most_common(1)[0][0]
    nat = pp[-1][3]
    n_t = len({x[0] for x in pp}); n_a = apps[pid]; won = honours(pid)
    tier = 2 if (n_t >= 2 and n_a >= 6) or (won and n_a >= 3) else 3 if n_a >= 1 else 4
    en = name_en(r)
    al = {en.lower(), ascii_(en).lower()}
    if r['family_name'] != 'not applicable': al.add(r['family_name'].lower()); al.add(ascii_(r['family_name']).lower())
    else: al.add(r['given_name'].lower())
    players['w' + pid[2:]] = dict(en=en, ar=AR[pid], nat=nat, pos=pos, b=r['birth_date'], t=tier,
                                  wc=[[y, no, ps] for y, no, ps, _ in pp], h=[list(x) for x in won], al=sorted(a for a in al if a))
for pid, aid in match.items():
    pid = MERGE.get(pid, pid)
    if part.get(pid): extend[aid] = dict(wc=[[y, no, ps] for y, no, ps, _ in sorted(part[pid])], h=[list(x) for x in honours(pid)])
# ---- complete squads with last-match line-up
STAGE = {'group stage': 'دور المجموعات', 'round of 16': 'دور الـ16', 'quarter-finals': 'ربع النهائي', 'second group stage': 'الدور الثاني',
         'semi-finals': 'نصف النهائي', 'third-place match': 'مباراة المركز الثالث', 'final': 'النهائي'}
squad_rows = collections.defaultdict(list)
for r in SQ: squad_rows[(r['tournament_id'], r['team_code'])].append(r)
ap_by = collections.defaultdict(list)
for r in AP: ap_by[(r['tournament_id'], r['team_code'])].append(r)
squads, skipped = [], []
for key in sel['complete']:
    key = tuple(key); rows = squad_rows[key]
    if any(app_id(r['player_id']) is None for r in rows): skipped.append((key, 'incomplete')); continue
    a = ap_by[key]; last = max(r['match_date'] for r in a)
    lm = [r for r in a if r['match_date'] == last]; m = M[lm[0]['match_id']]
    xi = [r for r in lm if r['starter'] == '1']; subs = [r for r in lm if r['substitute'] == '1']
    if len(xi) != 11 or sum(r['position_code'] == 'GK' for r in xi) != 1: skipped.append((key, 'xi')); continue
    LINE = {'GK': 0, 'DF': 1, 'CB': 1, 'RB': 1, 'LB': 1, 'SW': 1, 'MF': 2, 'CM': 2, 'RM': 2, 'LM': 2, 'DM': 2, 'AM': 2, 'RWB': 2, 'LWB': 2,
            'FW': 3, 'CF': 3, 'LW': 3, 'RW': 3, 'LF': 3, 'RF': 3, 'SS': 3}
    side = lambda c: 0 if c.startswith('R') else 2 if c.startswith('L') else 1   # right -> left, as the pitch layout expects
    xi.sort(key=lambda r: (LINE[r['position_code']], side(r['position_code']), int(r['shirt_number'] or 99)))
    cnt = collections.Counter(LINE[r['position_code']] for r in xi)
    form = '-'.join(str(cnt[k]) for k in (1, 2, 3) if cnt[k])
    y = int(key[0][3:]); team = CODE[key[1]]
    home = m['home_team_code'] == key[1]
    opp = CODE[m['away_team_code'] if home else m['home_team_code']]
    gs, ga = (m['home_team_score'], m['away_team_score']) if home else (m['away_team_score'], m['home_team_score'])
    extra = ''
    if m['penalty_shootout'] == '1':
        ps, pa = (m['home_team_score_penalties'], m['away_team_score_penalties']) if home else (m['away_team_score_penalties'], m['home_team_score_penalties'])
        extra = f' ({ps}–{pa} ركلات ترجيح)'
    elif m['extra_time'] == '1': extra = ' (بعد التمديد)'
    used = set(); plist = []
    for role, rs in (('XI', xi), ('SUB', subs)):
        for r in rs:
            no = int(r['shirt_number']) or None
            plist.append([no, r['position_code'], app_id(r['player_id']), role]); used.add(r['player_id'])
    for r in sorted(rows, key=lambda r: int(r['shirt_number'] or 99)):
        if r['player_id'] not in used:
            plist.append([int(r['shirt_number']) or None, r['position_code'], app_id(r['player_id']), 'SQ']); used.add(r['player_id'])
    nos = [p[0] for p in plist if p[0] is not None]
    if len(nos) != len(set(nos)): skipped.append((key, 'dup numbers')); continue
    squads.append(dict(id=f'wc{y}{key[1].lower()}', team=team, s=y, comp=f'كأس العالم {y}',
                       match=f'{TEAM_AR[team]} {gs}–{ga} {TEAM_AR[opp]}{extra} — {STAGE[m["stage_name"]]}',
                       date=last, f=form, kind='match', ver='wcdb', p=plist))
# ---- squad lists for teammate links (any squad with >= 2 app players)
wcsq = []
for key, rows in sorted(squad_rows.items()):
    ids = [[int(r['shirt_number']) or None, app_id(r['player_id'])] for r in rows if app_id(r['player_id'])]
    if len(ids) >= 2: wcsq.append(dict(y=int(key[0][3:]), team=CODE[key[1]], p=ids))
json.dump(dict(players=players, extend=extend, squads=squads, wcsq=wcsq), open(f'{W}/import.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'new players {len(players)} | extended {len(extend)} | full squads {len(squads)} | squad lists {len(wcsq)} | skipped {len(skipped)}', file=sys.stderr)
for s in skipped[:20]: print('  skipped', s, file=sys.stderr)
