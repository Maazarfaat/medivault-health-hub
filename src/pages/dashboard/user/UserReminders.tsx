import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlarmClock, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AddReminderDialog } from '@/components/reminder/AddReminderDialog';

interface Reminder {
  id: string;
  medicine_name: string;
  dosage: string | null;
  reminder_time: string;
  is_active: boolean;
  created_at: string;
}

export default function UserReminders() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('medicine_reminders' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('reminder_time', { ascending: true });
    setReminders((data as any) || []);
  }, [user]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const toggleReminder = async (id: string, isActive: boolean) => {
    await supabase.from('medicine_reminders' as any).update({ is_active: !isActive } as any).eq('id', id);
    fetchReminders();
  };

  const deleteReminder = async (id: string) => {
    await supabase.from('medicine_reminders' as any).delete().eq('id', id);
    toast({ title: t('reminderDeleted') });
    fetchReminders();
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('medicineReminders')}</h1>
        <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />{t('addReminder')}</Button>
      </div>

      {reminders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <AlarmClock className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{t('noReminders')}</p>
            <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />{t('addReminder')}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reminders.map(r => (
            <Card key={r.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{r.medicine_name}</CardTitle>
                  <Switch checked={r.is_active} onCheckedChange={() => toggleReminder(r.id, r.is_active)} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {r.dosage && <p className="text-sm text-muted-foreground">{t('dosage')}: {r.dosage}</p>}
                <div className="flex items-center gap-2">
                  <AlarmClock className="h-4 w-4 text-primary" />
                  <span className="text-lg font-semibold">{formatTime(r.reminder_time)}</span>
                </div>
                <Badge variant={r.is_active ? 'safe' : 'secondary'}>
                  {r.is_active ? t('active') : t('paused')}
                </Badge>
                <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={() => deleteReminder(r.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />{t('delete')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddReminderDialog open={addOpen} onOpenChange={setAddOpen} onAdded={fetchReminders} />
    </div>
  );
}
