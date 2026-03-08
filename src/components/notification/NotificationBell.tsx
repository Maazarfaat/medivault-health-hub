import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications((data as any) || []);
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Check reminders every minute
  useEffect(() => {
    if (!user) return;
    const checkReminders = async () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const { data: reminders } = await supabase
        .from('medicine_reminders' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (reminders) {
        for (const r of reminders as any[]) {
          const reminderTime = r.reminder_time?.substring(0, 5);
          if (reminderTime === currentTime) {
            // Check if notification already sent today
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const { data: existing } = await supabase
              .from('notifications' as any)
              .select('id')
              .eq('user_id', user.id)
              .eq('title', `${t('reminder')}: ${r.medicine_name}`)
              .gte('created_at', todayStart.toISOString())
              .limit(1);

            if (!existing || existing.length === 0) {
              await supabase.from('notifications' as any).insert({
                user_id: user.id,
                title: `${t('reminder')}: ${r.medicine_name}`,
                message: `${t('timeToTakeMedicine')} – ${r.medicine_name}${r.dosage ? ` (${r.dosage})` : ''}`,
                type: 'reminder',
              });
              fetchNotifications();
            }
          }
        }
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [user, t, fetchNotifications]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications' as any).update({ is_read: true } as any).eq('user_id', user.id).eq('is_read', false);
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h4 className="text-sm font-semibold">{t('notifications')}</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>
              {t('markAllRead')}
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">{t('noNotifications')}</p>
          ) : (
            <div className="divide-y">
              {notifications.map(n => (
                <div key={n.id} className={`p-3 ${!n.is_read ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.is_read && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
