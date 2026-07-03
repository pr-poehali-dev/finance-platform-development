import Icon from '@/components/ui/icon';
import EditableCell from './EditableCell';
import { formatMoney } from './store';
import { useAnalyticsCtx, monthNames } from './AnalyticsContext';

const CONV_KEYS = ['conv_lead_to_consult', 'conv_lead_to_pay', 'conv_consult_to_pay'];
const CONTRACT_KEYS = ['contracts_bfl', 'contracts_vbfl', 'contracts_rd'];
const QUALITY_KEYS = ['missed_call_pct', 'low_quality_pct'];

const Traffic = () => {
  const { data, loading, error, updateTraffic } = useAnalyticsCtx();

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Icon name="Loader2" size={26} className="mx-auto mb-3 animate-spin" />
        <p className="text-sm">Загружаем аналитику трафика…</p>
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

  const groupByKey = (key: string) =>
    data.traffic.filter((r) => r.key === key && r.month).sort((a, b) => (a.month as number) - (b.month as number));

  const leads = groupByKey('leads');
  const consultations = groupByKey('consultations');
  const maxLeads = Math.max(...leads.map((r) => r.fact ?? 0), 1);

  const totalLeads = leads.reduce((a, r) => a + (r.fact ?? 0), 0);
  const totalConsult = consultations.reduce((a, r) => a + (r.fact ?? 0), 0);
  const totalContracts = CONTRACT_KEYS.reduce((sum, k) => sum + groupByKey(k).reduce((a, r) => a + (r.fact ?? 0), 0), 0);

  const monthsForConv = [...new Set(data.traffic.filter((r) => CONV_KEYS.includes(r.key) && r.month).map((r) => r.month as number))].sort(
    (a, b) => a - b
  );
  const monthsForContracts = [...new Set(data.traffic.filter((r) => CONTRACT_KEYS.includes(r.key) && r.month).map((r) => r.month as number))].sort(
    (a, b) => a - b
  );
  const monthsForQuality = [...new Set(data.traffic.filter((r) => QUALITY_KEYS.includes(r.key) && r.month).map((r) => r.month as number))].sort(
    (a, b) => a - b
  );

  const sourcesBySource = new Map<string, typeof data.marketing>();
  for (const r of data.marketing) {
    const arr = sourcesBySource.get(r.source) ?? [];
    arr.push(r);
    sourcesBySource.set(r.source, arr);
  }
  const sourceTotals = [...sourcesBySource.entries()].map(([source, rows]) => ({
    source,
    fact: rows.reduce((a, r) => a + (r.fact ?? 0), 0),
  }));
  const maxSource = Math.max(...sourceTotals.map((s) => s.fact), 1);

  const avgOf = (key: string) => {
    const rows = groupByKey(key);
    const vals = rows.map((r) => r.fact).filter((v): v is number => v !== null && v !== undefined && v > 0);
    if (!vals.length) return 0;
    return Math.round(vals.reduce((a, v) => a + v, 0) / vals.length);
  };

  return (
    <div className="space-y-6">
      {/* Funnel summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="Users" label="Лидов всего" value={totalLeads.toLocaleString('ru-RU')} />
        <StatCard icon="MessageSquare" label="Консультаций" value={totalConsult.toLocaleString('ru-RU')} />
        <StatCard icon="FileCheck2" label="Заключено договоров" value={totalContracts.toLocaleString('ru-RU')} />
        <StatCard icon="Target" label="Ср. стоимость лида" value={`${formatMoney(avgOf('lead_cost'))} ₽`} />
      </div>

      {/* Leads chart */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold tracking-tight">Лиды и консультации по месяцам</h2>
          <span className="text-xs text-muted-foreground">факт</span>
        </div>
        <div className="flex items-end gap-3 h-40">
          {leads.map((r) => {
            const consult = consultations.find((c) => c.month === r.month);
            return (
              <div key={r.month} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex items-end justify-center gap-1 h-32">
                  <div
                    className="w-1/2 max-w-[18px] rounded-t-md bg-accent/70"
                    style={{ height: `${((r.fact ?? 0) / maxLeads) * 100}%` }}
                    title={`Лиды: ${r.fact}`}
                  />
                  <div
                    className="w-1/2 max-w-[18px] rounded-t-md bg-primary/70"
                    style={{ height: `${((consult?.fact ?? 0) / maxLeads) * 100}%` }}
                    title={`Консультации: ${consult?.fact ?? 0}`}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">{monthNames[(r.month as number) - 1]}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-5 mt-4">
          <Legend color="bg-accent/70" label="Лиды" />
          <Legend color="bg-primary/70" label="Консультации" />
        </div>
      </div>

      {/* Editable metrics table: leads, consultations, quality */}
      <EditTable
        title="Лиды, консультации и качество трафика"
        months={leads.map((r) => r.month as number)}
        rows={['leads', 'consultations', ...QUALITY_KEYS]}
        data={data.traffic}
        onEdit={updateTraffic}
        suffixFor={(key) => (QUALITY_KEYS.includes(key) ? '%' : '')}
      />

      {/* Contracts by type */}
      <EditTable
        title="Заключённые договоры по типам"
        months={monthsForContracts}
        rows={CONTRACT_KEYS}
        data={data.traffic}
        onEdit={updateTraffic}
      />

      {/* Conversion table */}
      <EditTable
        title="Воронка конверсий"
        months={monthsForConv}
        rows={CONV_KEYS}
        data={data.traffic}
        onEdit={updateTraffic}
        suffixFor={() => '%'}
      />

      {/* Marketing sources */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold tracking-tight">Источники маркетинга</h2>
          <span className="text-xs text-muted-foreground">факт затрат, ₽</span>
        </div>
        <div className="space-y-3">
          {sourceTotals.map((s) => (
            <div key={s.source} className="flex items-center gap-3">
              <span className="w-32 text-sm text-muted-foreground truncate">{s.source}</span>
              <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(s.fact / maxSource) * 100}%` }} />
              </div>
              <span className="w-28 text-right text-sm font-mono tnum">{formatMoney(s.fact)} ₽</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface EditTableProps {
  title: string;
  months: number[];
  rows: string[];
  data: { month: number | null; key: string; label: string; plan: number | null; fact: number | null }[];
  onEdit: (month: number | null, key: string, field: 'plan' | 'fact', value: number | null) => Promise<void>;
  suffixFor?: (key: string) => string;
}

const EditTable = ({ title, months, rows, data, onEdit, suffixFor }: EditTableProps) => {
  if (!months.length) return null;
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-semibold tracking-tight">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Нажмите на цифру, чтобы отредактировать</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-2.5 font-medium text-muted-foreground sticky left-0 bg-card">Показатель</th>
              {months.map((m) => (
                <th key={m} className="text-right px-2.5 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                  {monthNames[m - 1]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((key) => {
              const rowData = data.filter((r) => r.key === key);
              if (!rowData.length) return null;
              const label = rowData[0].label;
              return (
                <tr key={key} className="border-b border-border/60 hover:bg-secondary/20">
                  <td className="px-5 py-2 sticky left-0 bg-inherit whitespace-nowrap">{label}</td>
                  {months.map((m) => {
                    const r = rowData.find((x) => x.month === m);
                    return (
                      <td key={m} className="px-1 py-1.5 min-w-[80px]">
                        <EditableCell
                          value={r?.fact ?? null}
                          suffix={suffixFor?.(key) ?? ''}
                          onSave={(v) => onEdit(m, key, 'fact', v)}
                        />
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

const StatCard = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Icon name={icon} size={18} className="text-muted-foreground" />
    </div>
    <div className="text-2xl font-semibold tracking-tight tnum">{value}</div>
  </div>
);

const Legend = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-2">
    <span className={`inline-block w-3 h-3 rounded-sm ${color}`} />
    <span className="text-sm text-muted-foreground">{label}</span>
  </div>
);

export default Traffic;
