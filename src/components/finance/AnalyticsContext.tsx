import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const ANALYTICS_URL = 'https://functions.poehali.dev/45c98298-8d40-4059-bf34-e23fd6fcf495';

export interface PnLRow {
  month: number | null;
  key: string;
  label: string;
  section: string;
  plan: number | null;
  fact: number | null;
}

export interface MarketingRow {
  month: number | null;
  source: string;
  plan: number | null;
  fact: number | null;
}

export interface TrafficRow {
  month: number | null;
  key: string;
  label: string;
  unit: string;
  plan: number | null;
  fact: number | null;
}

interface AnalyticsData {
  pnl: PnLRow[];
  marketing: MarketingRow[];
  traffic: TrafficRow[];
}

interface Ctx {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  updatePnL: (month: number | null, key: string, field: 'plan' | 'fact', value: number | null) => Promise<void>;
  updateTraffic: (month: number | null, key: string, field: 'plan' | 'fact', value: number | null) => Promise<void>;
}

const AnalyticsCtx = createContext<Ctx | null>(null);

export const AnalyticsProvider = ({ children, year = 2026 }: { children: ReactNode; year?: number }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${ANALYTICS_URL}?year=${year}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить аналитику');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  const updatePnL = useCallback(
    async (month: number | null, key: string, field: 'plan' | 'fact', value: number | null) => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pnl: prev.pnl.map((r) => (r.month === month && r.key === key ? { ...r, [field]: value } : r)),
        };
      });
      const res = await fetch(ANALYTICS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'pnl', year, month, key, field, value }),
      });
      if (!res.ok) throw new Error('save failed');
    },
    [year]
  );

  const updateTraffic = useCallback(
    async (month: number | null, key: string, field: 'plan' | 'fact', value: number | null) => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          traffic: prev.traffic.map((r) => (r.month === month && r.key === key ? { ...r, [field]: value } : r)),
        };
      });
      const res = await fetch(ANALYTICS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'traffic', year, month, key, field, value }),
      });
      if (!res.ok) throw new Error('save failed');
    },
    [year]
  );

  return (
    <AnalyticsCtx.Provider value={{ data, loading, error, updatePnL, updateTraffic }}>
      {children}
    </AnalyticsCtx.Provider>
  );
};

export const useAnalyticsCtx = () => {
  const ctx = useContext(AnalyticsCtx);
  if (!ctx) throw new Error('useAnalyticsCtx must be used within AnalyticsProvider');
  return ctx;
};

export const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
