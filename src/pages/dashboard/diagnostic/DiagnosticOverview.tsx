import { useState, useEffect, useCallback } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { TestTube, Clock, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { SaveLocationButton } from '@/components/location/SaveLocationButton';

export default function DiagnosticOverview() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({ totalBookings: 0, pending: 0, offersSent: 0, completed: 0 });

  const fetchStats = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('blood_test_bookings').select('status');
    const bookings = data || [];
    setStats({
      totalBookings: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      offersSent: bookings.filter(b => b.status === 'offer_sent').length,
      completed: bookings.filter(b => b.status === 'completed').length,
    });
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('diagnosticDashboard')}</h1>
          <p className="text-muted-foreground">{t('manageBookings')}</p>
        </div>
        <SaveLocationButton />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title={t('totalBookings')} value={stats.totalBookings} icon={<TestTube className="h-6 w-6" />} variant="primary" />
        <StatsCard title={t('pending')} value={stats.pending} icon={<Clock className="h-6 w-6" />} variant="warning" />
        <StatsCard title={t('offersSent')} value={stats.offersSent} icon={<Send className="h-6 w-6" />} variant="default" />
        <StatsCard title={t('completed')} value={stats.completed} icon={<CheckCircle className="h-6 w-6" />} variant="safe" />
      </div>
    </div>
  );
}
