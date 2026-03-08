import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function UserNotifications() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications' as any).select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setNotifications((data as any) || []);
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications' as any).update({ is_read: true } as any).eq('user_id', user.id).eq('is_read', false);
    fetchNotifications();
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications' as any).delete().eq('id', id);
    fetchNotifications();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('notifications')}</h1>
        {notifications.some(n => !n.is_read) && (
          <Button variant="outline" onClick={markAllRead}>{t('markAllRead')}</Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-4 py-12">
          <Bell className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">{t('noNotifications')}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <Card key={n.id} className={!n.is_read ? 'border-primary/30 bg-primary/5' : ''}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => deleteNotification(n.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
