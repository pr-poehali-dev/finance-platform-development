import { useState } from 'react';
import Icon from '@/components/ui/icon';
import EditableCell from './EditableCell';
import { useAnalyticsCtx, monthNames } from './AnalyticsContext';

interface SectionDef {
  id: string;
  title: string;
  icon: string;
  keys: string[];
  bold?: Set<string>;
}

const SECTIONS: SectionDef[] = [
  {
    id: 'revenue',
    title: 'Выручка и оплаты',
    icon: 'TrendingUp',
    keys: ['revenue', 'new_payments', 'ar_payments', 'other_legal'],
  },
  {
    id: 'profit',
    title: 'Валовая прибыль',
    icon: 'Coins',
    keys: ['gross_profit'],
    bold: new Set(['gross_profit']),
  },
  {
    id: 'costs',
    title: 'Расходы',
    icon: 'Receipt',
    keys: ['fixed_costs', 'payroll', 'variable_costs', 'investment_costs'],
  },
  {
    id: 'summary',
    title: 'Итоги: EBITDA, налоги, чистая прибыль',
    icon: 'BarChart3',
    keys: ['total_costs_no_tax', 'tax_total', 'total_costs_with_tax', 'ebitda', 'net_profit'],
    bold: new Set(['ebitda', 'net_profit']),
  },
];

const AnnualPnL = () => {
  const { data, loading, error, updatePnL } = useAnalyticsCtx();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['revenue', 'summary']));

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

  const byKey = new Map<string, typeof data.pnl>();
  for (const r of data.pnl) {
    const arr = byKey.get(r.key) ?? [];
    arr.push(r);
    byKey.set(r.key, arr);
  }

  const monthsWithData = [...new Set(data.pnl.filter((r) => r.month).map((r) => r.month as number))].sort((a, b) => a - b);

  const toggle = (id: string) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold tracking-tight">Годовой P&L 2026</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Нажмите на цифру, чтобы изменить факт или план</p>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">план / факт по месяцам</span>
      </div>

      <div className="divide-y divide-border">
        {SECTIONS.map((section) => {
          const isOpen = openSections.has(section.id);
          return (
            <div key={section.id}>
              <button
                onClick={() => toggle(section.id)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-secondary/40 transition-colors"
              >
                <span className="flex items-center gap-2.5 font-medium text-sm">
                  <Icon name={section.icon} size={16} className="text-muted-foreground" />
                  {section.title}
                </span>
                <Icon
                  name="ChevronDown"
                  size={16}
                  className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="overflow-x-auto pb-2 animate-fade-in">
                  <table className="w-full text-sm min-w-[880px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-5 py-2 font-medium text-muted-foreground sticky left-0 bg-card w-48">
                          Показатель
                        </th>
                        {monthsWithData.map((m) => (
                          <th key={m} className="text-right px-2.5 py-2 font-medium text-muted-foreground whitespace-nowrap">
                            {monthNames[m - 1]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.keys.map((key) => {
                        const rows = byKey.get(key);
                        if (!rows) return null;
                        const label = rows[0].label;
                        const bold = section.bold?.has(key);
                        return (
                          <tr key={key} className={`hover:bg-secondary/20 ${bold ? 'bg-secondary/30' : ''}`}>
                            <td className={`px-5 py-2 sticky left-0 bg-inherit ${bold ? 'font-semibold' : ''}`}>{label}</td>
                            {monthsWithData.map((m) => {
                              const r = rows.find((x) => x.month === m);
                              const fact = r?.fact;
                              const plan = r?.plan;
                              return (
                                <td key={m} className="px-1 py-1.5 min-w-[92px]">
                                  <EditableCell
                                    value={fact ?? null}
                                    negative={(fact ?? 0) < 0}
                                    className={bold ? 'font-semibold' : ''}
                                    onSave={(v) => updatePnL(m, key, 'fact', v)}
                                  />
                                  {plan !== null && plan !== undefined ? (
                                    <div className="text-[10px] text-muted-foreground text-right pr-1.5 mt-0.5">
                                      план{' '}
                                      <EditableCell
                                        value={plan}
                                        className="text-[10px] inline-block w-auto"
                                        onSave={(v) => updatePnL(m, key, 'plan', v)}
                                      />
                                    </div>
                                  ) : null}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnnualPnL;
