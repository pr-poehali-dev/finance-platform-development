import { useState, Fragment } from 'react';
import Icon from '@/components/ui/icon';
import EditableCell from './EditableCell';
import EditableLabel from './EditableLabel';
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
  const { data, loading, error, updatePnL, renamePnLRow } = useAnalyticsCtx();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['revenue', 'summary']));
  const [monthFilter, setMonthFilter] = useState<number | 'all'>('all');

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

  const allMonths = [...new Set(data.pnl.filter((r) => r.month).map((r) => r.month as number))].sort((a, b) => a - b);
  const monthsWithData = monthFilter === 'all' ? allMonths : allMonths.filter((m) => m === monthFilter);

  const toggle = (id: string) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold tracking-tight">Годовой P&L 2026</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Нажмите на цифру или название, чтобы изменить</p>
        </div>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="text-sm rounded-lg border border-border bg-secondary px-3 py-1.5 outline-none"
        >
          <option value="all">Все месяцы</option>
          {allMonths.map((m) => (
            <option key={m} value={m}>
              {monthNames[m - 1]}
            </option>
          ))}
        </select>
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
                  <table className="w-full text-sm border-collapse" style={{ minWidth: monthsWithData.length * 160 + 200 }}>
                    <thead>
                      <tr className="border-b border-border">
                        <th rowSpan={2} className="text-left px-5 py-2 font-medium text-muted-foreground sticky left-0 bg-card align-bottom w-52">
                          Показатель
                        </th>
                        {monthsWithData.map((m) => (
                          <th key={m} colSpan={2} className="text-center px-2.5 py-1.5 font-medium text-muted-foreground border-l border-border">
                            {monthNames[m - 1]}
                          </th>
                        ))}
                      </tr>
                      <tr className="border-b border-border">
                        {monthsWithData.map((m) => (
                          <Fragment key={m}>
                            <th className="text-right px-2 py-1.5 font-normal text-[11px] text-muted-foreground border-l border-border">
                              План
                            </th>
                            <th className="text-right px-2 py-1.5 font-normal text-[11px] text-muted-foreground">
                              Факт
                            </th>
                          </Fragment>
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
                            <td className={`px-5 py-1.5 sticky left-0 bg-inherit ${bold ? 'font-semibold' : ''}`}>
                              <EditableLabel
                                value={label}
                                className={`text-sm ${bold ? 'font-semibold' : ''}`}
                                onSave={(v) => renamePnLRow(key, v)}
                              />
                            </td>
                            {monthsWithData.map((m) => {
                              const r = rows.find((x) => x.month === m);
                              const fact = r?.fact;
                              const plan = r?.plan;
                              return (
                                <Fragment key={m}>
                                  <td className="px-1 py-1 min-w-[78px] border-l border-border">
                                    <EditableCell
                                      value={plan ?? null}
                                      className="text-muted-foreground"
                                      onSave={(v) => updatePnL(m, key, 'plan', v)}
                                    />
                                  </td>
                                  <td className="px-1 py-1 min-w-[78px]">
                                    <EditableCell
                                      value={fact ?? null}
                                      negative={(fact ?? 0) < 0}
                                      className={bold ? 'font-semibold' : ''}
                                      onSave={(v) => updatePnL(m, key, 'fact', v)}
                                    />
                                  </td>
                                </Fragment>
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