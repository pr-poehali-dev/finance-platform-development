import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinance, buildCashflow, formatMoney } from './store';
import AddOperation from './AddOperation';
import { Button } from '@/components/ui/button';

const Cashflow = () => {
  const { operations, startBalance, setStartBalance } = useFinance();
  const flow = buildCashflow(operations, startBalance);
  const gaps = flow.filter((f) => f.gap).length;
  const minBalance = flow.length ? Math.min(...flow.map((f) => f.balance)) : startBalance;

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

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <span>Дата</span>
          <span className="text-right">Поступления</span>
          <span className="text-right">Списания</span>
          <span className="text-right">За день</span>
          <span className="text-right">Остаток</span>
        </div>
        <div className="divide-y divide-border">
          {flow.map((f) => (
            <div
              key={f.date}
              className={`grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] px-5 py-3.5 items-center text-sm transition-colors hover:bg-secondary/40 ${
                f.gap ? 'bg-expense/[0.04]' : ''
              }`}
            >
              <span className="flex items-center gap-2 capitalize">
                {f.gap && <Icon name="TriangleAlert" size={14} className="text-expense shrink-0" />}
                {f.label}
              </span>
              <span className="text-right font-mono tnum text-income">
                {f.income ? `+${formatMoney(f.income)}` : '—'}
              </span>
              <span className="text-right font-mono tnum text-muted-foreground">
                {f.expense ? `−${formatMoney(f.expense)}` : '—'}
              </span>
              <span className={`text-right font-mono tnum font-medium ${f.net >= 0 ? 'text-income' : 'text-expense'}`}>
                {f.net >= 0 ? '+' : '−'}
                {formatMoney(Math.abs(f.net))}
              </span>
              <span className={`text-right font-mono tnum font-semibold ${f.balance < 0 ? 'text-expense' : 'text-foreground'}`}>
                {formatMoney(f.balance)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cashflow;
