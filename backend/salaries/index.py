import json
import os
from typing import Dict, Any
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''Управление отделами, сотрудниками и системой мотивации: расчёт зарплат на основе показателей компании'''
    method = event.get('httpMethod', 'GET')

    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    conn = get_conn()
    cur = conn.cursor()

    if method == 'GET':
        cur.execute("SELECT id, name FROM departments ORDER BY id")
        departments = [{'id': r[0], 'name': r[1]} for r in cur.fetchall()]

        cur.execute(
            "SELECT id, department_id, name, position, base_salary, bonus_percent, bonus_metric_key "
            "FROM employees ORDER BY department_id, id"
        )
        employees = [
            {
                'id': r[0],
                'departmentId': r[1],
                'name': r[2],
                'position': r[3],
                'baseSalary': float(r[4]),
                'bonusPercent': float(r[5]),
                'bonusMetricKey': r[6],
            }
            for r in cur.fetchall()
        ]
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'departments': departments, 'employees': employees})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action', 'employee')

        if action == 'department':
            name = str(body.get('name', '')).replace("'", "''")
            if not name:
                cur.close()
                conn.close()
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Не указано название отдела'})}
            cur.execute(f"INSERT INTO departments (name) VALUES ('{name}') RETURNING id, name")
            row = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 201, 'headers': headers, 'body': json.dumps({'id': row[0], 'name': row[1]})}

        department_id = int(body.get('departmentId', 0))
        name = str(body.get('name', '')).replace("'", "''")
        position = str(body.get('position', '')).replace("'", "''")
        base_salary = float(body.get('baseSalary', 0))
        bonus_percent = float(body.get('bonusPercent', 0))
        bonus_metric_key = str(body.get('bonusMetricKey', 'none')).replace("'", "''")

        if not name or not department_id:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Не указаны обязательные поля сотрудника'})}

        cur.execute(
            f"INSERT INTO employees (department_id, name, position, base_salary, bonus_percent, bonus_metric_key) "
            f"VALUES ({department_id}, '{name}', '{position}', {base_salary}, {bonus_percent}, '{bonus_metric_key}') "
            f"RETURNING id, department_id, name, position, base_salary, bonus_percent, bonus_metric_key"
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'id': row[0], 'departmentId': row[1], 'name': row[2], 'position': row[3],
                'baseSalary': float(row[4]), 'bonusPercent': float(row[5]), 'bonusMetricKey': row[6],
            }),
        }

    if method == 'PUT':
        body = json.loads(event.get('body') or '{}')
        emp_id = body.get('id')
        if not emp_id:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Не указан id сотрудника'})}

        name = str(body.get('name', '')).replace("'", "''")
        position = str(body.get('position', '')).replace("'", "''")
        base_salary = float(body.get('baseSalary', 0))
        bonus_percent = float(body.get('bonusPercent', 0))
        bonus_metric_key = str(body.get('bonusMetricKey', 'none')).replace("'", "''")
        department_id = int(body.get('departmentId', 0))

        cur.execute(
            f"UPDATE employees SET name = '{name}', position = '{position}', base_salary = {base_salary}, "
            f"bonus_percent = {bonus_percent}, bonus_metric_key = '{bonus_metric_key}', department_id = {department_id} "
            f"WHERE id = {int(emp_id)} "
            f"RETURNING id, department_id, name, position, base_salary, bonus_percent, bonus_metric_key"
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if not row:
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Сотрудник не найден'})}
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'id': row[0], 'departmentId': row[1], 'name': row[2], 'position': row[3],
                'baseSalary': float(row[4]), 'bonusPercent': float(row[5]), 'bonusMetricKey': row[6],
            }),
        }

    if method == 'DELETE':
        params = event.get('queryStringParameters') or {}
        emp_id = params.get('id')
        if not emp_id or not str(emp_id).isdigit():
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Не указан id сотрудника'})}
        cur.execute(f"DELETE FROM employees WHERE id = {int(emp_id)}")
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    cur.close()
    conn.close()
    return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Метод не поддерживается'})}
