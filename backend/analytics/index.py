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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    if method != 'GET':
        return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Метод не поддерживается'})}

    params = event.get('queryStringParameters') or {}
    year = int(params.get('year', 2026))

    conn = get_conn()
    cur = conn.cursor()

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
