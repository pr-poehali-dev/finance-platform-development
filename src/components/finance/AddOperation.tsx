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
import { useFinance, categories, OpType } from './store';

const AddOperation = ({ trigger }: { trigger?: React.ReactNode }) => {
  const { addOperation } = useFinance();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<OpType>('income');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const reset = () => {
    setName('');
    setAmount('');
    setCategory(categories[0]);
    setDate(new Date().toISOString().slice(0, 10));
    setType('income');
  };

  const submit = () => {
    const value = Number(amount.replace(/\s/g, ''));
    if (!name.trim() || !value) {
      toast({ title: 'Заполните название и сумму', variant: 'destructive' });
      return;
    }
    addOperation({ name: name.trim(), amount: value, category, date, type });
    toast({ title: 'Операция добавлена', description: `${name} · ${value.toLocaleString('ru-RU')} ₽` });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Icon name="Plus" size={16} /> Добавить операцию
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новая операция</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-secondary">
          {(['income', 'expense'] as OpType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`py-2 rounded-md text-sm font-medium transition-colors ${
                type === t
                  ? t === 'income'
                    ? 'bg-income text-white'
                    : 'bg-expense text-white'
                  : 'text-muted-foreground'
              }`}
            >
              {t === 'income' ? 'Доход' : 'Расход'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Оплата от клиента" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Сумма, ₽</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d\s]/g, ''))}
                placeholder="100 000"
                inputMode="numeric"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Дата</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Категория</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={submit} className="gap-2">
            <Icon name="Check" size={16} /> Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddOperation;
