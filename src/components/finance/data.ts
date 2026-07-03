import { Operation } from './store';
import { PnLPoint } from './PnLChart';

export type Period = 'month' | 'quarter' | 'year';

export const periodLabels: Record<Period, string> = {
  month: 'Месяц',
  quarter: 'Квартал',
  year: 'Год',
};

const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

// Aggregate operations into chart points depending on selected period
export function buildPnL(ops: Operation[], period: Period): PnLPoint[] {
  const buckets = new Map<string, { income: number; expense: number; order: number }>();

  for (const o of ops) {
    const d = new Date(o.date);
    let key = '';
    let order = 0;
    if (period === 'month') {
      const week = Math.ceil(d.getDate() / 7);
      key = `${week} нед`;
      order = d.getMonth() * 5 + week;
    } else if (period === 'quarter') {
      key = monthNames[d.getMonth()];
      order = d.getMonth();
    } else {
      const q = Math.floor(d.getMonth() / 3) + 1;
      key = `Q${q}`;
      order = q;
    }
    const cur = buckets.get(key) ?? { income: 0, expense: 0, order };
    if (o.type === 'income') cur.income += o.amount;
    else cur.expense += o.amount;
    buckets.set(key, cur);
  }

  return [...buckets.entries()]
    .sort((a, b) => a[1].order - b[1].order)
    .map(([label, v]) => ({ label, income: Math.round(v.income / 1000), expense: Math.round(v.expense / 1000) }));
}

export const forecast = [
  { label: 'След. мес', value: 4300 },
  { label: '+2 мес', value: 4650 },
  { label: '+3 мес', value: 5020 },
];
