import json
import os
import re
import csv
import io
from typing import Dict, Any
from urllib.request import urlopen, Request
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r'[^a-z0-9а-яё]+', '_', text)
    text = re.sub(r'_+', '_', text).strip('_')
    return text or 'row'


def extract_sheet_id(url: str) -> str:
    match = re.search(r'/spreadsheets/d/([\w-]+)', url)
    if not match:
        raise ValueError('Некорректная ссылка на Google Таблицу')
    return match.group(1)


def fetch_csv(sheet_id: str, gid: str = '0') -> str:
    csv_url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}'
    req = Request(csv_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urlopen(req, timeout=15) as resp:
        raw = resp.read()
    return raw.decode('utf-8-sig', errors='replace')


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''Импорт данных из публичной Google Таблицы: строки становятся показателями P&L, недостающие поля создаются автоматически'''
    method = event.get('httpMethod', 'GET')

    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    if method != 'POST':
        return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Метод не поддерживается'})}

    body = json.loads(event.get('body') or '{}')
    url = str(body.get('url', ''))
    year = int(body.get('year', 2026))

    try:
        sheet_id = extract_sheet_id(url)
        csv_text = fetch_csv(sheet_id)
    except Exception:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Не удалось получить доступ к таблице. Проверьте, что доступ открыт по ссылке ("Просмотр для всех, у кого есть ссылка")'})}

    reader = list(csv.reader(io.StringIO(csv_text)))
    if len(reader) < 2:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'В таблице недостаточно данных'})}

    header_row = reader[0]
    month_cols = []
    for i, col in enumerate(header_row[1:], start=1):
        col_clean = col.strip().lower()
        for m_idx, m_name in enumerate(['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'], start=1):
            if col_clean.startswith(m_name):
                month_cols.append((i, m_idx))
                break

    if not month_cols:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Не найдены столбцы с названиями месяцев (Январь, Февраль, ...)'})}

    conn = get_conn()
    cur = conn.cursor()

    imported_rows = 0
    created_fields = 0

    for row in reader[1:]:
        if not row or not row[0].strip():
            continue
        label = row[0].strip().replace("'", "''")
        row_key = slugify(row[0])

        cur.execute(
            f"SELECT 1 FROM pnl_monthly WHERE year = {year} AND row_key = '{row_key}' LIMIT 1"
        )
        exists = cur.fetchone()
        if not exists:
            created_fields += 1

        for col_idx, month_num in month_cols:
            if col_idx >= len(row):
                continue
            raw_val = row[col_idx].strip()
            raw_val = re.sub(r'[^\d.,-]', '', raw_val).replace(',', '.')
            if raw_val in ('', '-', '.'):
                continue
            try:
                value = float(raw_val)
            except ValueError:
                continue

            cur.execute(
                f"INSERT INTO pnl_monthly (year, month, row_key, row_label, section, plan_amount, fact_amount) "
                f"VALUES ({year}, {month_num}, '{row_key}', '{label}', 'imported', NULL, {value}) "
                f"ON CONFLICT (year, month, row_key) DO UPDATE SET fact_amount = EXCLUDED.fact_amount, row_label = EXCLUDED.row_label"
            )
        imported_rows += 1

    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'ok': True, 'importedRows': imported_rows, 'createdFields': created_fields}),
    }
