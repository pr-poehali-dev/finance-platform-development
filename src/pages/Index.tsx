import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import PnLChart from '@/components/finance/PnLChart';
import AddOperation from '@/components/finance/AddOperation';
import Cashflow from '@/components/finance/Cashflow';
import AddGoogleSheet from '@/components/finance/GoogleSheets';
import { Period, periodLabels, buildPnL, forecast } from '@/components/finance/data';
import { PnLPoint } from '@/components/finance/PnLChart';
import { useFinance, formatMoney, Operation } from '@/components/finance/store';

interface ViewProps {
  period: Period;
  setPeriod: (p: Period) => void;
  data: PnLPoint[];
  totalIncome: number;
  totalExpense: number;
  profit: number;
  margin: string;
}

type Tab = 'dashboard' | 'pnl' | 'cashflow' | 'integrations' | 'settings';

const nav: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Дашборд', icon: 'LayoutDashboard' },
  { id: 'pnl', label: 'P&L отчёт', icon: 'TrendingUp' },
  { id: 'cashflow', label: 'Денежный поток', icon: 'CalendarClock' },
  { id: 'integrations', label: 'Интеграции', icon: 'Plug' },
  { id: 'settings', label: 'Настройки', icon: 'Settings2' },
];

const Index = () => {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [period, setPeriod] = useState<Period>('quarter');
  const { operations } = useFinance();

  const data = buildPnL(operations, period);
  const totalIncome = operations.filter((o) => o.type === 'income').reduce((a, o) => a + o.amount, 0);
  const totalExpense = operations.filter((o) => o.type === 'expense').reduce((a, o) => a + o.amount, 0);
  const profit = totalIncome - totalExpense;
  const margin = totalIncome ? ((profit / totalIncome) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border px-4 py-6 sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Icon name="Rocket" size={18} className="text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">Финанс·ОС</span>
        </div>

        <nav className="flex flex-col gap-1">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                tab === n.id
                  ? 'bg-secondary text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <Icon name={n.icon} size={18} />
              {n.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto px-3 py-4 rounded-xl bg-secondary/60 border border-border">
          <div className="flex items-center gap-2 text-sm font-medium mb-1">
            <Icon name="Server" size={15} className="text-accent" />
            Готово к развёртыванию
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            On-premise, российское ПО, Astra Linux
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-border">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{nav.find((n) => n.id === tab)?.label}</h1>
            <p className="text-sm text-muted-foreground">Финансовая отчётность компании</p>
          </div>
          <div className="flex items-center gap-3">
            <AddOperation />
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-sm font-medium text-accent-foreground">
              АК
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-6xl mx-auto animate-fade-in" key={tab}>
          {tab === 'dashboard' && (
            <Dashboard {...{ period, setPeriod, data, totalIncome, totalExpense, profit, margin }} />
          )}
          {tab === 'pnl' && <PnL {...{ period, setPeriod, data, profit, margin, totalIncome, totalExpense }} />}
          {tab === 'cashflow' && <Cashflow />}
          {tab === 'integrations' && <Integrations />}
          {tab === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
};

/* ---------- Period selector ---------- */
const PeriodTabs = ({ period, setPeriod }: { period: Period; setPeriod: (p: Period) => void }) => (
  <div className="inline-flex p-1 rounded-lg bg-secondary border border-border">
    {(Object.keys(periodLabels) as Period[]).map((p) => (
      <button
        key={p}
        onClick={() => setPeriod(p)}
        className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
          period === p ? 'bg-card shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {periodLabels[p]}
      </button>
    ))}
  </div>
);

const Metric = ({ label, value, delta, positive, icon }: { label: string; value: string; delta: string; positive?: boolean; icon: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Icon name={icon} size={18} className="text-muted-foreground" />
    </div>
    <div className="text-2xl font-semibold tracking-tight tnum mb-1">{value}</div>
    <div className={`flex items-center gap-1 text-xs ${positive ? 'text-income' : 'text-expense'}`}>
      <Icon name={positive ? 'ArrowUpRight' : 'ArrowDownRight'} size={14} />
      {delta}
    </div>
  </div>
);

/* ---------- Dashboard ---------- */
const Dashboard = ({ period, setPeriod, data, totalIncome, totalExpense, profit, margin }: ViewProps) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between flex-wrap gap-3">
      <PeriodTabs period={period} setPeriod={setPeriod} />
      <AddOperation trigger={<Button variant="outline" size="sm" className="gap-2"><Icon name="Plus" size={16} /> Внести данные</Button>} />
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Metric label="Выручка" value={`${formatMoney(totalIncome)} ₽`} delta="+12.4%" positive icon="Wallet" />
      <Metric label="Расходы" value={`${formatMoney(totalExpense)} ₽`} delta="+4.1%" icon="Receipt" />
      <Metric label="Прибыль" value={`${formatMoney(profit)} ₽`} delta="+18.2%" positive icon="PiggyBank" />
      <Metric label="Маржа" value={`${margin}%`} delta="+2.3 п.п." positive icon="Percent" />
    </div>

    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold tracking-tight">Доходы и расходы</h2>
        <span className="text-xs text-muted-foreground">₽, тыс.</span>
      </div>
      {data.length ? <PnLChart data={data} /> : <Empty />}
    </div>

    <ForecastCard />
  </div>
);

const Empty = () => (
  <div className="py-12 text-center text-muted-foreground">
    <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-40" />
    <p className="text-sm">Нет данных за период. Добавьте операцию.</p>
  </div>
);

const ForecastCard = () => {
  const max = Math.max(...forecast.map((f) => f.value));
  return (
    <div className="rounded-2xl border border-border bg-primary text-primary-foreground p-6 overflow-hidden relative">
      <div className="absolute inset-0 grid-lines opacity-[0.06]" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="Sparkles" size={18} className="text-accent" />
          <h2 className="font-semibold tracking-tight">AI-прогноз выручки</h2>
        </div>
        <p className="text-sm text-primary-foreground/60 mb-6">На основе исторических данных · точность модели 92%</p>
        <div className="flex items-end gap-6">
          {forecast.map((f) => (
            <div key={f.label} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-sm font-mono tnum">{formatMoney(f.value)}к</span>
              <div className="w-full flex items-end justify-center h-28">
                <div className="w-full max-w-[56px] rounded-t-md bg-accent/80" style={{ height: `${(f.value / max) * 100}%` }} />
              </div>
              <span className="text-xs text-primary-foreground/60">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------- P&L report ---------- */
const PnL = ({ period, setPeriod, data, profit, margin, totalIncome, totalExpense }: ViewProps) => {
  const { operations, removeOperation } = useFinance();
  const sorted = [...operations].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PeriodTabs period={period} setPeriod={setPeriod} />
        <AddOperation />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        {data.length ? <PnLChart data={data} /> : <Empty />}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold tracking-tight">Операции</h2>
            <span className="text-xs text-muted-foreground">{operations.length} записей</span>
          </div>
          <div className="divide-y divide-border max-h-[420px] overflow-auto">
            {sorted.map((t: Operation) => (
              <div key={t.id} className="group flex items-center gap-3 px-5 py-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-income/10' : 'bg-expense/10'}`}>
                  <Icon name={t.type === 'income' ? 'ArrowDownLeft' : 'ArrowUpRight'} size={16} className={t.type === 'income' ? 'text-income' : 'text-expense'} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.category} · {new Date(t.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                  </div>
                </div>
                <div className={`text-sm font-mono tnum font-medium ${t.type === 'income' ? 'text-income' : 'text-foreground'}`}>
                  {t.type === 'income' ? '+' : '−'}
                  {formatMoney(t.amount)} ₽
                </div>
                <button
                  onClick={() => {
                    removeOperation(t.id);
                    toast({ title: 'Операция удалена' });
                  }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-expense transition"
                >
                  <Icon name="Trash2" size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 h-fit">
          <h2 className="font-semibold tracking-tight">Итог за период</h2>
          <Row label="Выручка" value={`${formatMoney(totalIncome)} ₽`} />
          <Row label="Себестоимость и расходы" value={`−${formatMoney(totalExpense)} ₽`} muted />
          <div className="h-px bg-border" />
          <Row label="Чистая прибыль" value={`${formatMoney(profit)} ₽`} big />
          <Row label="Рентабельность" value={`${margin}%`} accent />
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, muted, big, accent }: { label: string; value: string; muted?: boolean; big?: boolean; accent?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className={`text-sm ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>{label}</span>
    <span className={`font-mono tnum ${big ? 'text-xl font-semibold' : 'text-sm font-medium'} ${accent ? 'text-income' : ''}`}>{value}</span>
  </div>
);

/* ---------- Integrations ---------- */
const Integrations = () => (
  <div className="grid md:grid-cols-2 gap-5">
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-accent/10">
        <Icon name="Building2" size={22} className="text-accent" />
      </div>
      <h3 className="font-semibold tracking-tight mb-1">Битрикс24</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">Автоматическая выгрузка сделок и платежей из CRM в отчёты.</p>
      <Button
        className="w-full"
        onClick={() => toast({ title: 'Битрикс24', description: 'Введите вебхук-ссылку в настройках интеграции' })}
      >
        Подключить
      </Button>
    </div>

    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-secondary">
        <Icon name="Sheet" size={22} className="text-foreground" />
      </div>
      <h3 className="font-semibold tracking-tight mb-1">Google Таблицы</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">Подключите таблицу по ссылке — данные распознаются автоматически.</p>
      <AddGoogleSheet trigger={<Button variant="outline" className="w-full gap-2"><Icon name="Link" size={16} /> Вставить ссылку</Button>} />
    </div>

    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-secondary">
        <Icon name="FileSpreadsheet" size={22} className="text-foreground" />
      </div>
      <h3 className="font-semibold tracking-tight mb-1">Excel / .xlsx</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">Загрузите файл — система распознает столбцы и построит отчёт.</p>
      <ExcelUpload />
    </div>

    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-secondary">
        <Icon name="Landmark" size={22} className="text-foreground" />
      </div>
      <h3 className="font-semibold tracking-tight mb-1">Банковская выписка</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">Импорт выписки 1С и загрузка операций по счёту.</p>
      <Button variant="outline" className="w-full" disabled>Скоро</Button>
    </div>
  </div>
);

const ExcelUpload = () => {
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) toast({ title: 'Файл загружен', description: `${file.name} · распознаём данные…` });
  };
  return (
    <label>
      <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFile} />
      <Button variant="outline" className="w-full gap-2" asChild>
        <span><Icon name="Upload" size={16} /> Загрузить файл</span>
      </Button>
    </label>
  );
};

/* ---------- Settings ---------- */
const Settings = () => (
  <div className="max-w-2xl space-y-6">
    <SettingBlock title="Категории" desc="Управление статьями доходов и расходов">
      <div className="flex flex-wrap gap-2">
        {['Продажи', 'Услуги', 'ФОТ', 'Маркетинг', 'Помещение', 'Софт', 'Налоги'].map((c) => (
          <span key={c} className="px-3 py-1.5 rounded-lg bg-secondary text-sm border border-border">{c}</span>
        ))}
      </div>
    </SettingBlock>

    <SettingBlock title="Валюта" desc="Основная валюта отчётов">
      <div className="inline-flex p-1 rounded-lg bg-secondary border border-border">
        {['₽ RUB', '$ USD', '€ EUR'].map((c, i) => (
          <button key={c} className={`px-4 py-1.5 rounded-md text-sm ${i === 0 ? 'bg-card shadow-sm font-medium' : 'text-muted-foreground'}`}>{c}</button>
        ))}
      </div>
    </SettingBlock>

    <SettingBlock title="Развёртывание" desc="Совместимость с российским ПО">
      <div className="flex flex-wrap gap-2">
        {['Astra Linux', 'PostgreSQL', 'Docker', 'РЕД ОС'].map((s) => (
          <span key={s} className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-sm flex items-center gap-1.5">
            <Icon name="Check" size={14} /> {s}
          </span>
        ))}
      </div>
    </SettingBlock>
  </div>
);

const SettingBlock = ({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card p-6">
    <h3 className="font-semibold tracking-tight">{title}</h3>
    <p className="text-sm text-muted-foreground mb-4">{desc}</p>
    {children}
  </div>
);

export default Index;