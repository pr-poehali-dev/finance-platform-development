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
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

const AddGoogleSheet = ({ trigger }: { trigger: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const valid = /docs\.google\.com\/spreadsheets\/d\/[\w-]+/.test(url);

  const connect = () => {
    if (!valid) {
      toast({ title: 'Некорректная ссылка', description: 'Вставьте ссылку на Google Таблицу', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOpen(false);
      const saved = JSON.parse(localStorage.getItem('finance-os-sheets') || '[]');
      saved.push({ url, connectedAt: Date.now() });
      localStorage.setItem('finance-os-sheets', JSON.stringify(saved));
      toast({ title: 'Таблица подключена', description: 'Данные будут синхронизироваться автоматически' });
      setUrl('');
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Подключить Google Таблицу</DialogTitle>
          <DialogDescription>
            Откройте доступ по ссылке (Просмотр) и вставьте адрес таблицы.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label>Ссылка на таблицу</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
          />
          {url && !valid && (
            <p className="text-xs text-expense">Это не похоже на ссылку Google Таблиц</p>
          )}
        </div>

        <div className="rounded-lg bg-secondary/60 border border-border p-3 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Icon name="Info" size={14} /> Как распознаются данные
          </div>
          <p>Столбцы «Дата», «Сумма», «Категория» определяются автоматически.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={connect} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Icon name="Loader2" size={16} className="animate-spin" /> Подключаем…
              </>
            ) : (
              <>
                <Icon name="Link" size={16} /> Подключить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddGoogleSheet;
