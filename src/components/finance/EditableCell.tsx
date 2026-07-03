import { useState, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { formatMoney } from './store';

interface Props {
  value: number | null;
  onSave: (value: number | null) => Promise<void>;
  suffix?: string;
  className?: string;
  placeholder?: string;
  negative?: boolean;
}

const EditableCell = ({ value, onSave, suffix = '', className = '', placeholder = '—', negative }: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value !== null && value !== undefined ? String(value) : '');
      requestAnimationFrame(() => ref.current?.focus());
    }
  }, [editing, value]);

  const commit = async () => {
    const trimmed = draft.trim().replace(/\s/g, '').replace(',', '.');
    const num = trimmed === '' ? null : Number(trimmed);
    if (trimmed !== '' && Number.isNaN(num)) {
      toast({ title: 'Введите число', variant: 'destructive' });
      return;
    }
    setEditing(false);
    if (num === value) return;
    setSaving(true);
    try {
      await onSave(num);
    } catch {
      toast({ title: 'Не удалось сохранить значение', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        className={`w-full bg-accent/10 border border-accent rounded px-1.5 py-0.5 text-right font-mono tnum outline-none ${className}`}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      disabled={saving}
      className={`w-full block text-right font-mono tnum rounded px-1.5 py-0.5 hover:bg-accent/10 transition-colors cursor-text ${
        negative ? 'text-expense' : ''
      } ${saving ? 'opacity-50' : ''} ${className}`}
      title="Нажмите, чтобы изменить"
    >
      {value !== null && value !== undefined ? `${formatMoney(value)}${suffix}` : <span className="text-muted-foreground/50">{placeholder}</span>}
    </button>
  );
};

export default EditableCell;