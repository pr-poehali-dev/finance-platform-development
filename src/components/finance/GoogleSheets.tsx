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
import { useAnalyticsCtx } from './AnalyticsContext';

const SHEETS_IMPORT_URL = 'https://functions.poehali.dev/beea6773-0ac8-48a4-934d-7ee9c3010d56';

const AddGoogleSheet = ({ trigger }: { trigger: React.ReactNode }) => {
  const { refetch } = useAnalyticsCtx();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const valid = /docs\.google\.com\/spreadsheets\/d\/[\w-]+/.test(url);

  const connect = async () => {
    if (!valid) {
      toast({ title: 'Некорректная ссылка', description: 'Вставьте ссылку на Google Таблицу', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(SHEETS_IMPORT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, year: 2026 }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: 'Не удалось импортировать', description: json.error ?? 'Проверьте доступ к таблице', variant: 'destructive' });
        return;
      }
      toast({
        title: 'Таблица подключена',
        description: `Импортировано строк: ${json.importedRows}, новых полей создано: ${json.createdFields}`,
      });
      refetch();
      setOpen(false);
      setUrl('');
    } catch {
      toast({ title: 'Ошибка соединения', description: 'Не удалось связаться с сервером', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Подключить Google Таблицу</DialogTitle>
          <DialogDescription>
            Откройте доступ по ссылке (Просмотр для всех, у кого есть ссылка) и вставьте адрес таблицы.
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
          <p>
            Первая строка таблицы должна содержать названия месяцев (Январь, Февраль…). Первый столбец — название показателя.
            Строки, которых ещё нет в P&L, будут созданы автоматически.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={connect} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Icon name="Loader2" size={16} className="animate-spin" /> Импортируем…
              </>
            ) : (
              <>
                <Icon name="Link" size={16} /> Подключить и импортировать
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddGoogleSheet;
