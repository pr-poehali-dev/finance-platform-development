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

export const categories = ['Продажи', 'Услуги', 'ФОТ', 'Маркетинг', 'Помещение', 'Софт', 'Налоги', 'Прочее'];

export function formatMoney(n: number): string {
  return n.toLocaleString('ru-RU');
}

const OPERATIONS_URL = 'https://functions.poehali.dev/c9c68388-a303-4909-9e0e-6748ac619e00';
const SETTINGS_URL = 'https://functions.poehali.dev/d25e10c5-778d-4054-9050-bfd9274135a1';

interface Store {
  operations: Operation[];
  loading: boolean;
  error: string | null;
  addOperation: (op: Omit<Operation, 'id'>) => Promise<void>;
  updateOperation: (op: Operation) => Promise<void>;
  removeOperation: (id: number) => Promise<void>;
  startBalance: number;
  setStartBalance: (n: number) => void;
}

const Ctx = createContext<Store | null>(null);

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [startBalance, setStartBalanceState] = useState<number>(500000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(OPERATIONS_URL).then((r) => r.json()),
      fetch(SETTINGS_URL).then((r) => r.json()),
    ])
      .then(([ops, settings]) => {
        if (cancelled) return;
        setOperations(ops);
        if (settings?.start_balance) setStartBalanceState(Number(settings.start_balance));
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить данные с сервера');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const addOperation = async (op: Omit<Operation, 'id'>) => {
    const res = await fetch(OPERATIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(op),
    });
    if (!res.ok) throw new Error('Не удалось сохранить операцию');
    const saved: Operation = await res.json();
    setOperations((prev) => [...prev, saved]);
  };

  const updateOperation = async (op: Operation) => {
    const prev = operations;
    setOperations((p) => p.map((o) => (o.id === op.id ? op : o)));
    try {
      const res = await fetch(OPERATIONS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(op),
      });
      if (!res.ok) throw new Error();
    } catch {
      setOperations(prev);
      throw new Error('Не удалось обновить операцию');
    }
  };

  const removeOperation = async (id: number) => {
    const prev = operations;
    setOperations((p) => p.filter((o) => o.id !== id));
    try {
      const res = await fetch(`${OPERATIONS_URL}?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setOperations(prev);
      throw new Error('Не удалось удалить операцию');
    }
  };

  const setStartBalance = (n: number) => {
    setStartBalanceState(n);
    fetch(SETTINGS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_balance: n }),
    }).catch(() => {});
  };

  return (
    <Ctx.Provider value={{ operations, loading, error, addOperation, updateOperation, removeOperation, startBalance, setStartBalance }}>
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