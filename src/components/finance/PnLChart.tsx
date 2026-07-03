import { formatMoney } from './store';

export interface PnLPoint {
  label: string;
  income: number;
  expense: number;
}

interface Props {
  data: PnLPoint[];
}

const PnLChart = ({ data }: Props) => {
  const W = 720;
  const H = 260;
  const pad = 24;
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense])) * 1.15;

  const x = (i: number) => pad + (i * (W - pad * 2)) / (data.length - 1);
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);

  const line = (key: 'income' | 'expense') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d[key])}`).join(' ');

  const area = (key: 'income' | 'expense') =>
    `${line(key)} L ${x(data.length - 1)} ${H - pad} L ${x(0)} ${H - pad} Z`;

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--income))" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(var(--income))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={pad}
            x2={W - pad}
            y1={pad + (H - pad * 2) * t}
            y2={pad + (H - pad * 2) * t}
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />
        ))}

        <path d={area('income')} fill="url(#incomeFill)" />
        <path d={line('income')} fill="none" stroke="hsl(var(--income))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={line('expense')} fill="none" stroke="hsl(var(--expense))" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" strokeLinejoin="round" />

        {data.map((d, i) => (
          <g key={d.label}>
            <circle cx={x(i)} cy={y(d.income)} r="4" fill="hsl(var(--background))" stroke="hsl(var(--income))" strokeWidth="2.5" />
            <text x={x(i)} y={H - 6} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11 }}>
              {d.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="flex gap-6 mt-2 px-2">
        <Legend color="hsl(var(--income))" label="Доходы" value={formatMoney(data.reduce((a, d) => a + d.income, 0))} />
        <Legend color="hsl(var(--expense))" label="Расходы" value={formatMoney(data.reduce((a, d) => a + d.expense, 0))} dashed />
      </div>
    </div>
  );
};

const Legend = ({ color, label, value, dashed }: { color: string; label: string; value: string; dashed?: boolean }) => (
  <div className="flex items-center gap-2">
    <span
      className="inline-block w-5 h-0.5 rounded-full"
      style={{ background: dashed ? 'transparent' : color, borderTop: dashed ? `2px dashed ${color}` : undefined }}
    />
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-mono tnum font-medium">{value} ₽</span>
  </div>
);

export default PnLChart;