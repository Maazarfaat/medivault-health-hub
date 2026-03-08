import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface AddReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function AddReminderDialog({ open, onOpenChange, onAdded }: AddReminderDialogProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ medicineName: '', dosage: '', reminderTime: '08:00' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from('medicine_reminders' as any).insert({
      user_id: user.id,
      medicine_name: form.medicineName,
      dosage: form.dosage || null,
      reminder_time: form.reminderTime,
    });

    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('reminderAdded') });
      setForm({ medicineName: '', dosage: '', reminderTime: '08:00' });
      onOpenChange(false);
      onAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addReminder')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>{t('medicineName')} *</Label>
            <Input required value={form.medicineName} onChange={e => setForm(f => ({ ...f, medicineName: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>{t('dosage')}</Label>
            <Input value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 1 tablet" />
          </div>
          <div className="space-y-1">
            <Label>{t('reminderTime')} *</Label>
            <Input type="time" required value={form.reminderTime} onChange={e => setForm(f => ({ ...f, reminderTime: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !form.medicineName}>
            {loading ? t('loading') : t('addReminder')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
