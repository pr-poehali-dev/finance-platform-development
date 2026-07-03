import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const SALARIES_URL = 'https://functions.poehali.dev/363b653b-25af-4100-960c-85f7df298f97';

export interface Department {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  departmentId: number;
  name: string;
  position: string;
  baseSalary: number;
  bonusPercent: number;
  bonusMetricKey: string;
}

export const bonusMetrics = [
  { key: 'none', label: 'Без бонуса' },
  { key: 'revenue', label: '% от выручки' },
  { key: 'new_payments', label: '% от новых оплат' },
  { key: 'gross_profit', label: '% от валовой прибыли' },
];

interface Ctx {
  departments: Department[];
  employees: Employee[];
  loading: boolean;
  error: string | null;
  addEmployee: (e: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (e: Employee) => Promise<void>;
  removeEmployee: (id: number) => Promise<void>;
  addDepartment: (name: string) => Promise<void>;
}

const SalariesCtx = createContext<Ctx | null>(null);

export const SalariesProvider = ({ children }: { children: ReactNode }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(SALARIES_URL)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setDepartments(json.departments ?? []);
        setEmployees(json.employees ?? []);
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить данные о зарплатах');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addEmployee = useCallback(async (e: Omit<Employee, 'id'>) => {
    const res = await fetch(SALARIES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(e),
    });
    if (!res.ok) throw new Error('create failed');
    const saved: Employee = await res.json();
    setEmployees((prev) => [...prev, saved]);
  }, []);

  const updateEmployee = useCallback(async (e: Employee) => {
    const prev = employees;
    setEmployees((p) => p.map((x) => (x.id === e.id ? e : x)));
    try {
      const res = await fetch(SALARIES_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(e),
      });
      if (!res.ok) throw new Error();
    } catch {
      setEmployees(prev);
      throw new Error('update failed');
    }
  }, [employees]);

  const removeEmployee = useCallback(async (id: number) => {
    const prev = employees;
    setEmployees((p) => p.filter((x) => x.id !== id));
    try {
      const res = await fetch(`${SALARIES_URL}?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setEmployees(prev);
      throw new Error('delete failed');
    }
  }, [employees]);

  const addDepartment = useCallback(async (name: string) => {
    const res = await fetch(SALARIES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'department', name }),
    });
    if (!res.ok) throw new Error('create failed');
    const saved: Department = await res.json();
    setDepartments((prev) => [...prev, saved]);
  }, []);

  return (
    <SalariesCtx.Provider
      value={{ departments, employees, loading, error, addEmployee, updateEmployee, removeEmployee, addDepartment }}
    >
      {children}
    </SalariesCtx.Provider>
  );
};

export const useSalaries = () => {
  const ctx = useContext(SalariesCtx);
  if (!ctx) throw new Error('useSalaries must be used within SalariesProvider');
  return ctx;
};
