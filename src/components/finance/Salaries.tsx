import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useSalaries, bonusMetrics, Employee } from './SalariesContext';
import { useAnalyticsCtx, monthNames } from './AnalyticsContext';
import { formatMoney } from './store';
import EditableCell from './EditableCell';

const Salaries = () => {
  const { departments, employees, loading, error, updateEmployee, removeEmployee } = useSalaries();
  const { data: analytics, updatePnL } = useAnalyticsCtx();
  const [syncing, setSyncing] = useState(false);
  const currentMonth = new Date().getMonth() + 1;

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Icon name="Loader2" size={26} className="mx-auto mb-3 animate-spin" />
        <p className="text-sm">Загружаем данные о зарплатах…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-16 text-center text-expense">
        <Icon name="CloudOff" size={26} className="mx-auto mb-3" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const metricValue = (metricKey: string): number => {
    if (metricKey === 'none' || !analytics) return 0;
    const row = analytics.pnl.find((r) => r.key === metricKey && r.month === currentMonth);
    return row?.fact ?? 0;
  };

  const calcSalary = (e: Employee) => {
    const bonusBase = metricValue(e.bonusMetricKey);
    const bonus = bonusBase * (e.bonusPercent / 100);
    return { bonus, total: e.baseSalary + bonus };
  };

  const totalPayroll = employees.reduce((sum, e) => sum + calcSalary(e).total, 0);
  const payrollInPnL = analytics?.pnl.find((r) => r.key === 'payroll' && r.month === currentMonth)?.fact ?? null;
  const isSynced = payrollInPnL !== null && Math.round(payrollInPnL) === Math.round(totalPayroll);

  const syncWithPnL = async () => {
    setSyncing(true);
    try {
      await updatePnL(currentMonth, 'payroll', 'fact', Math.round(totalPayroll));
      toast({ title: 'ФОТ синхронизирован с P&L', description: `${formatMoney(Math.round(totalPayroll))} ₽ · ${monthNames[currentMonth - 1]}` });
    } catch {
      toast({ title: 'Не удалось синхронизировать', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold tracking-tight text-lg">Зарплаты · {monthNames[currentMonth - 1]}</h2>
          <p className="text-sm text-muted-foreground">Расчёт автоматически учитывает факт P&L текущего месяца</p>
        </div>
        <AddEmployeeDialog />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">Итого фонд оплаты труда за месяц</span>
          <Icon name="Wallet" size={18} className="text-muted-foreground" />
        </div>
        <div className="text-2xl font-semibold tracking-tight tnum mb-3">{formatMoney(totalPayroll)} ₽</div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className={`text-xs flex items-center gap-1.5 ${isSynced ? 'text-income' : 'text-muted-foreground'}`}>
            <Icon name={isSynced ? 'CheckCircle2' : 'AlertCircle'} size={14} />
            {isSynced
              ? 'Синхронизировано с ФОТ в P&L'
              : `В P&L сейчас: ${payrollInPnL !== null ? formatMoney(payrollInPnL) + ' ₽' : 'не указано'}`}
          </span>
          <Button size="sm" variant="outline" onClick={syncWithPnL} disabled={syncing || isSynced} className="gap-2">
            {syncing ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="RefreshCw" size={14} />}
            Синхронизировать с P&L
          </Button>
        </div>
      </div>

      {departments.map((dep) => {
        const deptEmployees = employees.filter((e) => e.departmentId === dep.id);
        if (!deptEmployees.length) return null;
        const deptTotal = deptEmployees.reduce((sum, e) => sum + calcSalary(e).total, 0);
        return (
          <div key={dep.id} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold tracking-tight">{dep.name}</h3>
              <span className="text-sm font-mono tnum text-muted-foreground">{formatMoney(deptTotal)} ₽</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="text-left px-5 py-2.5 font-medium">Сотрудник</th>
                    <th className="text-left px-3 py-2.5 font-medium">Должность</th>
                    <th className="text-right px-3 py-2.5 font-medium">Оклад</th>
                    <th className="text-left px-3 py-2.5 font-medium">Мотивация</th>
                    <th className="text-right px-3 py-2.5 font-medium">Бонус</th>
                    <th className="text-right px-5 py-2.5 font-medium">Итого</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {deptEmployees.map((e) => {
                    const { bonus, total } = calcSalary(e);
                    return (
                      <tr key={e.id} className="group hover:bg-secondary/30">
                        <td className="px-5 py-2.5 font-medium whitespace-nowrap">{e.name}</td>
                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{e.position}</td>
                        <td className="px-1 py-1 min-w-[100px]">
                          <EditableCell
                            value={e.baseSalary}
                            onSave={async (v) => updateEmployee({ ...e, baseSalary: v ?? e.baseSalary })}
                          />
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <MotivationSelect employee={e} onSave={updateEmployee} />
                        </td>
                        <td className="text-right px-3 py-2.5 font-mono tnum text-income">
                          {bonus ? `+${formatMoney(Math.round(bonus))}` : '—'}
                        </td>
                        <td className="text-right px-5 py-2.5 font-mono tnum font-semibold">{formatMoney(Math.round(total))} ₽</td>
                        <td className="px-2">
                          <button
                            onClick={() => {
                              removeEmployee(e.id)
                                .then(() => toast({ title: 'Сотрудник удалён' }))
                                .catch(() => toast({ title: 'Не удалось удалить', variant: 'destructive' }));
                            }}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-expense transition"
                          >
                            <Icon name="Trash2" size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MotivationSelect = ({ employee, onSave }: { employee: Employee; onSave: (e: Employee) => Promise<void> }) => {
  const [percent, setPercent] = useState(String(employee.bonusPercent));

  const commitPercent = () => {
    const num = Number(percent.replace(',', '.'));
    if (Number.isNaN(num) || num === employee.bonusPercent) return;
    onSave({ ...employee, bonusPercent: num }).catch(() => toast({ title: 'Не удалось сохранить', variant: 'destructive' }));
  };

  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={employee.bonusMetricKey}
        onValueChange={(v) => onSave({ ...employee, bonusMetricKey: v }).catch(() => toast({ title: 'Не удалось сохранить', variant: 'destructive' }))}
      >
        <SelectTrigger className="h-8 text-xs w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {bonusMetrics.map((m) => (
            <SelectItem key={m.key} value={m.key}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {employee.bonusMetricKey !== 'none' && (
        <div className="flex items-center gap-1">
          <input
            value={percent}
            onChange={(e) => setPercent(e.target.value.replace(/[^\d.,]/g, ''))}
            onBlur={commitPercent}
            onKeyDown={(e) => e.key === 'Enter' && commitPercent()}
            className="w-12 h-8 text-xs text-right rounded-md border border-border bg-secondary px-1.5 outline-none"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      )}
    </div>
  );
};

const AddEmployeeDialog = () => {
  const { departments, addEmployee } = useSalaries();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [departmentId, setDepartmentId] = useState<string>(String(departments[0]?.id ?? ''));
  const [baseSalary, setBaseSalary] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !departmentId) {
      toast({ title: 'Заполните имя и отдел', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await addEmployee({
        name: name.trim(),
        position: position.trim(),
        departmentId: Number(departmentId),
        baseSalary: Number(baseSalary.replace(/\s/g, '')) || 0,
        bonusPercent: 0,
        bonusMetricKey: 'none',
      });
      toast({ title: 'Сотрудник добавлен' });
      setName('');
      setPosition('');
      setBaseSalary('');
      setOpen(false);
    } catch {
      toast({ title: 'Не удалось добавить сотрудника', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Icon name="UserPlus" size={16} /> Добавить сотрудника
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новый сотрудник</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Имя</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Иван Иванов" />
          </div>
          <div className="space-y-1.5">
            <Label>Должность</Label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Менеджер" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Отдел</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Оклад, ₽</Label>
              <Input
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value.replace(/[^\d\s]/g, ''))}
                placeholder="50 000"
                className="font-mono"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={saving} className="gap-2">
            {saving ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Check" size={16} />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Salaries;