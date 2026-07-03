import { useEffect, useState } from 'react';

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

export function useAnalytics(year = 2026) {
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

  return { data, loading, error };
}

export const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
