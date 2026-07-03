import json
import os
from typing import Dict, Any
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''Годовая P&L аналитика компании (план/факт по месяцам), источники маркетинга и трафик-метрики'''
    method = event.get('httpMethod', 'GET')

    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    conn = get_conn()
    cur = conn.cursor()

    if method == 'PUT':
        body = json.loads(event.get('body') or '{}')
        table = body.get('table')
        year = int(body.get('year', 2026))
        month = body.get('month')
        row_key = str(body.get('key', '')).replace("'", "''")
        field = body.get('field')
        value = body.get('value')

        if table not in ('pnl', 'traffic') or field not in ('plan', 'fact') or not row_key:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Некорректные параметры обновления'})}

        column = 'plan_amount' if field == 'plan' else 'fact_amount'
        table_name = 'pnl_monthly' if table == 'pnl' else 'traffic_monthly'
        key_column = 'row_key' if table == 'pnl' else 'metric_key'

        if table == 'traffic':
            column = 'plan_value' if field == 'plan' else 'fact_value'

        num_value = 'NULL' if value is None else float(value)
        month_clause = f"month = {int(month)}" if month is not None else "month IS NULL"

        cur.execute(
            f"UPDATE {table_name} SET {column} = {num_value} "
            f"WHERE year = {year} AND {month_clause} AND {key_column} = '{row_key}' "
            f"RETURNING id"
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if not row:
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Показатель не найден'})}
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    if method != 'GET':
        cur.close()
        conn.close()
        return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Метод не поддерживается'})}

    params = event.get('queryStringParameters') or {}
    year = int(params.get('year', 2026))

    cur.execute(
        f"SELECT month, row_key, row_label, section, plan_amount, fact_amount "
        f"FROM pnl_monthly WHERE year = {year} ORDER BY row_key, month"
    )
    pnl_rows = cur.fetchall()
    pnl = [
        {
            'month': r[0],
            'key': r[1],
            'label': r[2],
            'section': r[3],
            'plan': float(r[4]) if r[4] is not None else None,
            'fact': float(r[5]) if r[5] is not None else None,
        }
        for r in pnl_rows
    ]

    cur.execute(
        f"SELECT month, source_name, plan_amount, fact_amount "
        f"FROM marketing_sources_monthly WHERE year = {year} ORDER BY source_name, month"
    )
    mk_rows = cur.fetchall()
    marketing = [
        {
            'month': r[0],
            'source': r[1],
            'plan': float(r[2]) if r[2] is not None else None,
            'fact': float(r[3]) if r[3] is not None else None,
        }
        for r in mk_rows
    ]

    cur.execute(
        f"SELECT month, metric_key, metric_label, unit, plan_value, fact_value "
        f"FROM traffic_monthly WHERE year = {year} ORDER BY metric_key, month"
    )
    tr_rows = cur.fetchall()
    traffic = [
        {
            'month': r[0],
            'key': r[1],
            'label': r[2],
            'unit': r[3],
            'plan': float(r[4]) if r[4] is not None else None,
            'fact': float(r[5]) if r[5] is not None else None,
        }
        for r in tr_rows
    ]

    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'pnl': pnl, 'marketing': marketing, 'traffic': traffic}),
    }