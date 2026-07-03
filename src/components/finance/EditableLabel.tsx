import { useState, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface Props {
  value: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
}

const EditableLabel = ({ value, onSave, className = '' }: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      requestAnimationFrame(() => ref.current?.focus());
    }
  }, [editing, value]);

  const commit = async () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed || trimmed === value) return;
    setSaving(true);
    try {
      await onSave(trimmed);
    } catch {
      toast({ title: 'Не удалось переименовать', variant: 'destructive' });
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
        className={`bg-accent/10 border border-accent rounded px-1.5 py-0.5 outline-none ${className}`}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      disabled={saving}
      className={`text-left rounded px-1.5 py-0.5 hover:bg-accent/10 transition-colors ${saving ? 'opacity-50' : ''} ${className}`}
      title="Нажмите, чтобы переименовать"
    >
      {value}
    </button>
  );
};

export default EditableLabel;
