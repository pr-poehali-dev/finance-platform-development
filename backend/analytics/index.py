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

        if table == 'marketing' and field == 'label':
            old_source = row_key
            new_source = str(value or '').replace("'", "''")
            if not old_source or not new_source:
                cur.close()
                conn.close()
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Некорректное название источника'})}
            cur.execute(
                f"UPDATE marketing_sources_monthly SET source_name = '{new_source}' "
                f"WHERE year = {year} AND source_name = '{old_source}'"
            )
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        if table not in ('pnl', 'traffic') or not row_key:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Некорректные параметры обновления'})}

        table_name = 'pnl_monthly' if table == 'pnl' else 'traffic_monthly'
        key_column = 'row_key' if table == 'pnl' else 'metric_key'
        label_column = 'row_label' if table == 'pnl' else 'metric_label'

        if field == 'label':
            new_label = str(value or '').replace("'", "''")
            if not new_label:
                cur.close()
                conn.close()
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Название не может быть пустым'})}
            cur.execute(
                f"UPDATE {table_name} SET {label_column} = '{new_label}' "
                f"WHERE year = {year} AND {key_column} = '{row_key}'"
            )
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        if field not in ('plan', 'fact'):
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Некорректное поле обновления'})}

        column = 'plan_amount' if field == 'plan' else 'fact_amount'
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

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        table = body.get('table')
        year = int(body.get('year', 2026))
        row_key = str(body.get('key', '')).replace("'", "''")
        label = str(body.get('label', '')).replace("'", "''")
        section = str(body.get('section', 'custom')).replace("'", "''")

        if table not in ('pnl', 'traffic') or not row_key or not label:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Некорректные параметры новой строки'})}

        if table == 'pnl':
            for m in range(1, 13):
                cur.execute(
                    f"INSERT INTO pnl_monthly (year, month, row_key, row_label, section, plan_amount, fact_amount) "
                    f"VALUES ({year}, {m}, '{row_key}', '{label}', '{section}', NULL, NULL) "
                    f"ON CONFLICT (year, month, row_key) DO NOTHING"
                )
        else:
            for m in range(1, 13):
                cur.execute(
                    f"INSERT INTO traffic_monthly (year, month, metric_key, metric_label, unit, plan_value, fact_value) "
                    f"VALUES ({year}, {m}, '{row_key}', '{label}', 'count', NULL, NULL) "
                    f"ON CONFLICT (year, month, metric_key) DO NOTHING"
                )
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 201, 'headers': headers, 'body': json.dumps({'ok': True, 'key': row_key})}

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