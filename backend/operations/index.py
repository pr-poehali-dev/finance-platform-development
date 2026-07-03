import json
import os
from typing import Dict, Any
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''Управление финансовыми операциями компании: список, добавление, удаление доходов и расходов'''
    method = event.get('httpMethod', 'GET')

    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    conn = get_conn()
    cur = conn.cursor()

    if method == 'GET':
        cur.execute(
            "SELECT id, op_date, name, category, op_type, amount FROM operations ORDER BY op_date ASC"
        )
        rows = cur.fetchall()
        result = [
            {
                'id': r[0],
                'date': r[1].isoformat(),
                'name': r[2],
                'category': r[3],
                'type': r[4],
                'amount': float(r[5]),
            }
            for r in rows
        ]
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(result)}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        date = str(body.get('date', '')).replace("'", "''")
        name = str(body.get('name', '')).replace("'", "''")
        category = str(body.get('category', '')).replace("'", "''")
        op_type = str(body.get('type', '')).replace("'", "''")
        amount = float(body.get('amount', 0))

        if op_type not in ('income', 'expense') or not name or amount <= 0:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Некорректные данные операции'})}

        cur.execute(
            f"INSERT INTO operations (op_date, name, category, op_type, amount) "
            f"VALUES ('{date}', '{name}', '{category}', '{op_type}', {amount}) "
            f"RETURNING id, op_date, name, category, op_type, amount"
        )
        row = cur.fetchone()
        conn.commit()
        result = {
            'id': row[0],
            'date': row[1].isoformat(),
            'name': row[2],
            'category': row[3],
            'type': row[4],
            'amount': float(row[5]),
        }
        cur.close()
        conn.close()
        return {'statusCode': 201, 'headers': headers, 'body': json.dumps(result)}

    if method == 'DELETE':
        params = event.get('queryStringParameters') or {}
        op_id = params.get('id')
        if not op_id or not str(op_id).isdigit():
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Не указан id операции'})}

        cur.execute(f"DELETE FROM operations WHERE id = {int(op_id)}")
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    cur.close()
    conn.close()
    return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Метод не поддерживается'})}
