import Icon from '@/components/ui/icon';
import { formatMoney } from './store';
import { useAnalytics, monthNames, PnLRow } from './useAnalytics';

const ROW_ORDER = [
  'revenue',
  'new_payments',
  'ar_payments',
  'gross_profit',
  'fixed_costs',
  'payroll',
  'variable_costs',
  'investment_costs',
  'total_costs_no_tax',
  'tax_total',
  'total_costs_with_tax',
  'ebitda',
  'net_profit',
];

const SECTION_BOLD = new Set(['gross_profit', 'ebitda', 'net_profit', 'total_costs_no_tax', 'total_costs_with_tax']);

const AnnualPnL = () => {
  const { data, loading, error } = useAnalytics(2026);

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Icon name="Loader2" size={26} className="mx-auto mb-3 animate-spin" />
        <p className="text-sm">Загружаем годовой отчёт…</p>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="py-16 text-center text-expense">
        <Icon name="CloudOff" size={26} className="mx-auto mb-3" />
        <p className="text-sm">{error ?? 'Нет данных'}</p>
      </div>
    );
  }

  const byKey = new Map<string, PnLRow[]>();
  for (const r of data.pnl) {
    const arr = byKey.get(r.key) ?? [];
    arr.push(r);
    byKey.set(r.key, arr);
  }

  const monthsWithData = [...new Set(data.pnl.filter((r) => r.month).map((r) => r.month as number))].sort((a, b) => a - b);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">Годовой P&L 2026 · план / факт</h2>
        <span className="text-xs text-muted-foreground">по данным компании</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-2.5 font-medium text-muted-foreground sticky left-0 bg-card">Показатель</th>
              {monthsWithData.map((m) => (
                <th key={m} className="text-right px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                  {monthNames[m - 1]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROW_ORDER.map((key) => {
              const rows = byKey.get(key);
              if (!rows) return null;
              const label = rows[0].label;
              const bold = SECTION_BOLD.has(key);
              return (
                <tr key={key} className={`border-b border-border/60 hover:bg-secondary/30 ${bold ? 'bg-secondary/20' : ''}`}>
                  <td className={`px-5 py-2.5 sticky left-0 bg-inherit ${bold ? 'font-semibold' : ''}`}>{label}</td>
                  {monthsWithData.map((m) => {
                    const r = rows.find((x) => x.month === m);
                    const fact = r?.fact;
                    const plan = r?.plan;
                    const negative = (fact ?? 0) < 0;
                    return (
                      <td key={m} className="text-right px-3 py-2.5 whitespace-nowrap">
                        <div className={`font-mono tnum ${bold ? 'font-semibold' : ''} ${negative ? 'text-expense' : ''}`}>
                          {fact !== null && fact !== undefined ? formatMoney(fact) : '—'}
                        </div>
                        {plan !== null && plan !== undefined && (
                          <div className="text-[11px] text-muted-foreground font-mono">план {formatMoney(plan)}</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnnualPnL;
