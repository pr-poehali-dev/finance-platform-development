import Icon from '@/components/ui/icon';
import { formatMoney } from './store';
import { useAnalytics, monthNames, MarketingRow, TrafficRow } from './useAnalytics';

const FUNNEL_KEYS = ['leads', 'consultations'];
const CONV_KEYS = ['conv_lead_to_consult', 'conv_lead_to_pay', 'conv_consult_to_pay'];
const COST_KEYS = ['lead_cost', 'contract_cost'];

const groupByKey = (rows: TrafficRow[], key: string) =>
  rows.filter((r) => r.key === key && r.month).sort((a, b) => (a.month as number) - (b.month as number));

const Traffic = () => {
  const { data, loading, error } = useAnalytics(2026);

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

  const leads = groupByKey(data.traffic, 'leads');
  const consultations = groupByKey(data.traffic, 'consultations');
  const maxLeads = Math.max(...leads.map((r) => r.fact ?? 0), 1);

  const totalLeads = leads.reduce((a, r) => a + (r.fact ?? 0), 0);
  const totalConsult = consultations.reduce((a, r) => a + (r.fact ?? 0), 0);

  // last available payments count approximation via conversion rows isn't reliable — use last month deal count from conv_consult_to_pay*consult
  const convRows = data.traffic.filter((r) => CONV_KEYS.includes(r.key) && r.month);

  const sourcesBySource = new Map<string, MarketingRow[]>();
  for (const r of data.marketing) {
    const arr = sourcesBySource.get(r.source) ?? [];
    arr.push(r);
    sourcesBySource.set(r.source, arr);
  }
  const sourceTotals = [...sourcesBySource.entries()].map(([source, rows]) => ({
    source,
    fact: rows.reduce((a, r) => a + (r.fact ?? 0), 0),
    plan: rows.reduce((a, r) => a + (r.plan ?? 0), 0),
  }));
  const maxSource = Math.max(...sourceTotals.map((s) => s.fact), 1);

  const costRows = (key: string) => groupByKey(data.traffic, key);

  return (
    <div className="space-y-6">
      {/* Funnel summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="Users" label="Лидов всего" value={totalLeads.toLocaleString('ru-RU')} />
        <StatCard icon="MessageSquare" label="Консультаций" value={totalConsult.toLocaleString('ru-RU')} />
        <StatCard
          icon="Percent"
          label="Лид → консультация"
          value={`${totalLeads ? Math.round((totalConsult / totalLeads) * 100) : 0}%`}
        />
        <StatCard
          icon="Target"
          label="Ср. стоимость лида"
          value={`${formatMoney(avgOf(costRows('lead_cost')))} ₽`}
        />
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

      {/* Conversion table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold tracking-tight">Воронка конверсий</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-2.5 font-medium text-muted-foreground">Этап</th>
                {monthNames.slice(0, 6).map((m) => (
                  <th key={m} className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONV_KEYS.map((key) => {
                const rows = convRows.filter((r) => r.key === key);
                if (!rows.length) return null;
                return (
                  <tr key={key} className="border-b border-border/60">
                    <td className="px-5 py-2.5">{rows[0].label}</td>
                    {Array.from({ length: 6 }, (_, i) => i + 1).map((m) => {
                      const r = rows.find((x) => x.month === m);
                      return (
                        <td key={m} className="text-right px-3 py-2.5 font-mono tnum">
                          {r?.fact !== undefined && r?.fact !== null ? `${r.fact}%` : '—'}
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

function avgOf(rows: TrafficRow[]): number {
  const vals = rows.map((r) => r.fact).filter((v): v is number => v !== null && v !== undefined);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, v) => a + v, 0) / vals.length);
}

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
