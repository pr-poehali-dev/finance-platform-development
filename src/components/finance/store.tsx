import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type OpType = 'income' | 'expense';

export interface Operation {
  id: number;
  date: string; // ISO yyyy-mm-dd
  name: string;
  category: string;
  type: OpType;
  amount: number;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const today = new Date();
const day = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return iso(d);
};

const seed: Operation[] = [
  { id: 1, date: day(-2), name: 'Оплата от ООО «Ветер»', category: 'Продажи', type: 'income', amount: 480000 },
  { id: 2, date: day(-1), name: 'Аренда офиса', category: 'Помещение', type: 'expense', amount: 120000 },
  { id: 3, date: day(0), name: 'Подписка Битрикс24', category: 'Софт', type: 'expense', amount: 24000 },
  { id: 4, date: day(1), name: 'Оплата от ИП Смирнов', category: 'Услуги', type: 'income', amount: 215000 },
  { id: 5, date: day(3), name: 'Зарплата команды', category: 'ФОТ', type: 'expense', amount: 680000 },
  { id: 6, date: day(5), name: 'Рекламный бюджет', category: 'Маркетинг', type: 'expense', amount: 95000 },
  { id: 7, date: day(7), name: 'Оплата от ООО «Каскад»', category: 'Продажи', type: 'income', amount: 360000 },
  { id: 8, date: day(10), name: 'Налоги', category: 'Налоги', type: 'expense', amount: 210000 },
];

export const categories = ['Продажи', 'Услуги', 'ФОТ', 'Маркетинг', 'Помещение', 'Софт', 'Налоги', 'Прочее'];

export function formatMoney(n: number): string {
  return n.toLocaleString('ru-RU');
}

interface Store {
  operations: Operation[];
  addOperation: (op: Omit<Operation, 'id'>) => void;
  removeOperation: (id: number) => void;
  startBalance: number;
  setStartBalance: (n: number) => void;
}

const Ctx = createContext<Store | null>(null);

const KEY = 'finance-os-ops';
const BAL_KEY = 'finance-os-balance';

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [operations, setOperations] = useState<Operation[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : seed;
    } catch {
      return seed;
    }
  });
  const [startBalance, setStartBalance] = useState<number>(() => {
    const raw = localStorage.getItem(BAL_KEY);
    return raw ? Number(raw) : 500000;
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(operations));
  }, [operations]);

  useEffect(() => {
    localStorage.setItem(BAL_KEY, String(startBalance));
  }, [startBalance]);

  const addOperation = (op: Omit<Operation, 'id'>) =>
    setOperations((prev) => [...prev, { ...op, id: Date.now() }]);

  const removeOperation = (id: number) =>
    setOperations((prev) => prev.filter((o) => o.id !== id));

  return (
    <Ctx.Provider value={{ operations, addOperation, removeOperation, startBalance, setStartBalance }}>
      {children}
    </Ctx.Provider>
  );
};

export const useFinance = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
};

/* ---------- derived helpers ---------- */

export interface DayFlow {
  date: string;
  label: string;
  income: number;
  expense: number;
  net: number;
  balance: number;
  gap: boolean;
}

export function buildCashflow(ops: Operation[], startBalance: number): DayFlow[] {
  const byDate = new Map<string, { income: number; expense: number }>();
  for (const o of ops) {
    const cur = byDate.get(o.date) ?? { income: 0, expense: 0 };
    if (o.type === 'income') cur.income += o.amount;
    else cur.expense += o.amount;
    byDate.set(o.date, cur);
  }
  const dates = [...byDate.keys()].sort();
  let balance = startBalance;
  return dates.map((date) => {
    const { income, expense } = byDate.get(date)!;
    const net = income - expense;
    balance += net;
    const d = new Date(date);
    return {
      date,
      label: d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', weekday: 'short' }),
      income,
      expense,
      net,
      balance,
      gap: balance < 0,
    };
  });
}
