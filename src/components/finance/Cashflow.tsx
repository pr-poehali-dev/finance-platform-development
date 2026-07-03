import { useState, useMemo } from 'react';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useFinance, buildCashflow, formatMoney, Operation } from './store';
import { useAnalyticsCtx } from './AnalyticsContext';
import AddOperation from './AddOperation';
import { toast } from '@/hooks/use-toast';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const Cashflow = () => {
  const { operations, startBalance, setStartBalance, removeOperation } = useFinance();
  const { data: analytics } = useAnalyticsCtx();
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const flow = buildCashflow(operations, startBalance);
  const gaps = flow.filter((f) => f.gap).length;
  const minBalance = flow.length ? Math.min(...flow.map((f) => f.balance)) : startBalance;

  const flowByDate = useMemo(() => {
    const m = new Map<string, (typeof flow)[number]>();
    for (const f of flow) m.set(f.date, f);
    return m;
  }, [flow]);

  const opsByDate = useMemo(() => {
    const m = new Map<string, Operation[]>();
    for (const o of operations) {
      const arr = m.get(o.date) ?? [];
      arr.push(o);
      m.set(o.date, arr);
    }
    return m;
  }, [operations]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const monthPnl = useMemo(() => {
    if (!analytics) return null;
    const revenueRow = analytics.pnl.find((r) => r.key === 'revenue' && r.month === month + 1);
    const costsRow = analytics.pnl.find((r) => r.key === 'total_costs_with_tax' && r.month === month + 1);
    return { revenue: revenueRow?.fact ?? null, costs: costsRow?.fact ?? null };
  }, [analytics, month]);

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return d.toISOString().slice(0, 10);
    }),
  ];

  const monthLabel = cursor.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  const selectedOps = selectedDate ? opsByDate.get(selectedDate) ?? [] : [];
  const selectedFlow = selectedDate ? flowByDate.get(selectedDate) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5 w-48">
          <Label>Остаток на счёте сегодня, ₽</Label>
          <Input
            value={formatMoney(startBalance)}
            onChange={(e) => setStartBalance(Number(e.target.value.replace(/\D/g, '')) || 0)}
            className="font-mono"
          />
        </div>
        <AddOperation
          trigger={
            <Button className="gap-2">
              <Icon name="Plus" size={16} /> Запланировать платёж
            </Button>
          }
        />
      </div>

      {/* Alert */}
      <div
        className={`rounded-2xl border p-5 flex items-start gap-3 ${
          gaps > 0 ? 'border-expense/40 bg-expense/5' : 'border-income/40 bg-income/5'
        }`}
      >
        <Icon
          name={gaps > 0 ? 'TriangleAlert' : 'ShieldCheck'}
          size={22}
          className={gaps > 0 ? 'text-expense' : 'text-income'}
        />
        <div>
          <div className="font-semibold tracking-tight">
            {gaps > 0
              ? `Внимание: ${gaps} ${gaps === 1 ? 'день' : 'дней'} с кассовым разрывом`
              : 'Кассовых разрывов не прогнозируется'}
          </div>
          <p className="text-sm text-muted-foreground">
            Минимальный остаток за период:{' '}
            <span className={`font-mono tnum font-medium ${minBalance < 0 ? 'text-expense' : 'text-income'}`}>
              {formatMoney(minBalance)} ₽
            </span>
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
        {/* Calendar */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground"
            >
              <Icon name="ChevronLeft" size={18} />
            </button>
            <h2 className="font-semibold tracking-tight capitalize">{monthLabel}</h2>
            <button
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground"
            >
              <Icon name="ChevronRight" size={18} />
            </button>
          </div>

          {monthPnl && (monthPnl.revenue !== null || monthPnl.costs !== null) && (
            <div className="flex gap-4 mb-4 text-xs">
              <span className="text-muted-foreground">
                Выручка по P&L: <span className="font-mono tnum text-income font-medium">{formatMoney(monthPnl.revenue ?? 0)} ₽</span>
              </span>
              <span className="text-muted-foreground">
                Расходы по P&L: <span className="font-mono tnum text-expense font-medium">{formatMoney(monthPnl.costs ?? 0)} ₽</span>
              </span>
            </div>
          )}

          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[11px] text-muted-foreground font-medium py-1">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((date, i) => {
              if (!date) return <div key={i} />;
              const f = flowByDate.get(date);
              const dayNum = Number(date.slice(-2));
              const isSelected = date === selectedDate;
              const isToday = date === new Date().toISOString().slice(0, 10);
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square rounded-lg border p-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    isSelected
                      ? 'border-accent bg-accent/10'
                      : f?.gap
                      ? 'border-expense/30 bg-expense/5 hover:bg-expense/10'
                      : 'border-transparent hover:bg-secondary/50'
                  } ${isToday ? 'ring-1 ring-primary/40' : ''}`}
                >
                  <span className="text-xs text-muted-foreground">{dayNum}</span>
                  {f && (
                    <span className={`text-[10px] font-mono tnum leading-none ${f.net >= 0 ? 'text-income' : 'text-expense'}`}>
                      {f.net >= 0 ? '+' : '−'}
                      {formatMoney(Math.abs(f.net))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail */}
        <div className="rounded-2xl border border-border bg-card p-5">
          {selectedDate ? (
            <>
              <h3 className="font-semibold tracking-tight mb-1 capitalize">
                {new Date(selectedDate).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', weekday: 'long' })}
              </h3>
              {selectedFlow && (
                <p className="text-sm text-muted-foreground mb-4">
                  Остаток на конец дня:{' '}
                  <span className={`font-mono tnum font-medium ${selectedFlow.balance < 0 ? 'text-expense' : 'text-foreground'}`}>
                    {formatMoney(selectedFlow.balance)} ₽
                  </span>
                </p>
              )}
              {selectedOps.length ? (
                <div className="space-y-2">
                  {selectedOps.map((o) => (
                    <div key={o.id} className="group flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-secondary/40">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${o.type === 'income' ? 'bg-income/10' : 'bg-expense/10'}`}>
                        <Icon
                          name={o.type === 'income' ? 'ArrowDownLeft' : 'ArrowUpRight'}
                          size={13}
                          className={o.type === 'income' ? 'text-income' : 'text-expense'}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{o.name}</div>
                        <div className="text-xs text-muted-foreground">{o.category}</div>
                      </div>
                      <div className={`text-sm font-mono tnum ${o.type === 'income' ? 'text-income' : 'text-foreground'}`}>
                        {o.type === 'income' ? '+' : '−'}
                        {formatMoney(o.amount)}
                      </div>
                      <button
                        onClick={() => {
                          removeOperation(o.id)
                            .then(() => toast({ title: 'Операция удалена' }))
                            .catch(() => toast({ title: 'Не удалось удалить', variant: 'destructive' }));
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-expense transition"
                      >
                        <Icon name="Trash2" size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Нет операций в этот день</p>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10">
              <Icon name="CalendarDays" size={28} className="mb-2 opacity-40" />
              <p className="text-sm">Выберите день в календаре,{'\n'}чтобы увидеть детали</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cashflow;