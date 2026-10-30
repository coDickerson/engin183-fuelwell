#!/usr/bin/env python3
"""Export the family food board to a spreadsheet for the team.

Reads with the public key from .env (the same access the /dishes page has), so it only
sees real, visible dishes: seeded samples and rows hidden in the dashboard are left out.
No emails or other personal data are read.

  python3 -m pip install --user openpyxl==3.1.5   # once
  python3 tools/export-food-board.py [output.xlsx]

Default output: ~/Desktop/FuelWell family food board.xlsx
"""
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parent.parent
PACIFIC = ZoneInfo('America/Los_Angeles')
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / 'Desktop' / 'FuelWell family food board.xlsx'


def env():
    values = {}
    for name in ('.env', '.env.local'):
        path = ROOT / name
        if not path.exists():
            continue
        for line in path.read_text().splitlines():
            if '=' in line and not line.lstrip().startswith('#'):
                key, value = line.split('=', 1)
                values.setdefault(key.strip(), value.strip().strip('"'))
    return values['VITE_SUPABASE_URL'], values['VITE_SUPABASE_ANON_KEY']


URL, KEY = env()


def get(path, count=False):
    request = urllib.request.Request(f'{URL}/rest/v1/{path}', headers={
        'apikey': KEY,
        'Authorization': f'Bearer {KEY}',
        **({'Prefer': 'count=exact', 'Range': '0-0'} if count else {}),
    })
    with urllib.request.urlopen(request) as response:
        if count:
            return int(response.headers['Content-Range'].split('/')[-1])
        return json.load(response)


def all_dishes():
    rows, page = [], 1000
    while True:
        batch = get(f'dish_wall?select=created_at,dish,origin&sample=eq.false&order=created_at.asc&offset={len(rows)}&limit={page}')
        rows += batch
        if len(batch) < page:
            return rows


dishes = all_dishes()
answers_yes = get('class_survey_answers?select=knows_someone&knows_someone=eq.true', count=True)
answers_no = get('class_survey_answers?select=knows_someone&knows_someone=eq.false', count=True)
exported = datetime.now(timezone.utc).astimezone(PACIFIC)

FONT = 'Arial'
HEAD = Font(name=FONT, bold=True, color='FFFFFF')
HEAD_FILL = PatternFill('solid', fgColor='1F6F6B')
BODY = Font(name=FONT)
INPUT = Font(name=FONT, color='0000FF')
BOLD = Font(name=FONT, bold=True)
TITLE = Font(name=FONT, bold=True, size=14)
NOTE = Font(name=FONT, italic=True, color='5A6A6E')

wb = Workbook()

# --- Dishes: one row per real dish, oldest first ---
ws = wb.active
ws.title = 'Dishes'
headers = ['#', 'Added (Pacific time)', 'Dish', 'Where it’s from']
ws.append(headers)
for cell in ws[1]:
    cell.font, cell.fill = HEAD, HEAD_FILL
for i, row in enumerate(dishes, start=1):
    added = datetime.fromisoformat(row['created_at'].replace('Z', '+00:00')).astimezone(PACIFIC).replace(tzinfo=None)
    ws.append([i, added, row['dish'], row['origin'] or ''])
for row in ws.iter_rows(min_row=2):
    for cell in row:
        cell.font = BODY
    row[1].number_format = 'yyyy-mm-dd h:mm AM/PM'
for col, width in zip('ABCD', (6, 22, 34, 28)):
    ws.column_dimensions[col].width = width
ws.freeze_panes = 'A2'
ws.auto_filter.ref = f'A1:D{max(2, len(dishes) + 1)}'
last = len(dishes) + 1  # last data row on Dishes

# --- Summary: counts as formulas over the Dishes tab, plus the yes/no tally ---
s = wb.create_sheet('Summary', 0)
s['A1'] = 'FuelWell family food board'
s['A1'].font = TITLE
s['A2'] = f'Exported {exported:%b %-d, %Y at %-I:%M %p} Pacific. Real dishes only: seeded samples and hidden rows are left out.'
s['A2'].font = NOTE

rows = [
    ('Dishes', f'=COUNTA(Dishes!C2:C{max(2, last)})', None),
    ('Dishes with a place', f'=COUNTIF(Dishes!D2:D{max(2, last)},"?*")', None),
    ('Different places (exact spelling)', f'=IFERROR(SUMPRODUCT((Dishes!D2:D{max(2, last)}<>"")/COUNTIF(Dishes!D2:D{max(2, last)},Dishes!D2:D{max(2, last)}&"")),0)', 'Counts each distinct “Where it’s from” entry. “Mexico” and “mexico” count once; “Mexico” and “Oaxaca” count twice.'),
    (None, None, None),
    ('Do you know family or friends with kidney disease?', None, None),
    ('Yes', answers_yes, 'From class_survey_answers at export time (public tally, no personal data).'),
    ('No', answers_no, 'From class_survey_answers at export time (public tally, no personal data).'),
    ('Answered', '=B9+B10', None),
    ('% who said yes', '=IF(B11=0,0,B9/B11)', None),
]
for offset, (label, value, comment) in enumerate(rows, start=4):
    if label:
        s.cell(offset, 1, label).font = BOLD if value is None else BODY
    if value is not None:
        cell = s.cell(offset, 2, value)
        cell.font = INPUT if isinstance(value, int) else BODY
        cell.alignment = Alignment(horizontal='right')
        if comment:
            cell.comment = Comment(comment, 'export-food-board.py')
s['B12'].number_format = '0%;-0%;-'
s['A14'] = 'Blue numbers are counts copied in at export time; black numbers are formulas over the Dishes tab.'
s['A14'].font = NOTE
s.column_dimensions['A'].width = 50
s.column_dimensions['B'].width = 14

OUT.parent.mkdir(parents=True, exist_ok=True)
wb.save(OUT)
print(f"Saved {len(dishes)} {'dish' if len(dishes) == 1 else 'dishes'} ({answers_yes} yes / {answers_no} no) to {OUT}")
