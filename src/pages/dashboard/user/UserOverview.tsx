import { useState, useEffect, useCallback } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { BookTestDialog } from '@/components/booking/BookTestDialog';
import { AddMedicineDialog } from '@/components/medicine/AddMedicineDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill, AlertTriangle, Clock, Package, QrCode, PenLine, TestTube, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { getMedicineStatus, isLowStock } from '@/lib/medicineStatus';

export default function UserOverview() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({ total: 0, expiring: 0, expired: 0, lowStock: 0 });
  const [addOpen, setAddOpen] = useState(false);
  const [addMethod, setAddMethod] = useState<'manual' | 'scan'>('manual');
  const [bookTestOpen, setBookTestOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('user_medicines').select('expiry_date, quantity').eq('user_id', user.id);
    if (data) {
      setStats({
        total: data.length,
        expiring: data.filter(m => getMedicineStatus(m.expiry_date) === 'expiring').length,
        expired: data.filter(m => getMedicineStatus(m.expiry_date) === 'expired').length,
        lowStock: data.filter(m => isLowStock(m.quantity)).length,
      });
    }
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('welcomeBack')}!</h1>
        <p className="text-muted-foreground">{t('medicineOverview')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title={t('totalMedicines')} value={stats.total} icon={<Pill className="h-6 w-6" />} variant="primary" />
        <StatsCard title={t('expiringSoon')} value={stats.expiring} icon={<Clock className="h-6 w-6" />} variant="warning" />
        <StatsCard title={t('expired')} value={stats.expired} icon={<AlertTriangle className="h-6 w-6" />} variant="expired" />
        <StatsCard title={t('lowStock')} value={stats.lowStock} icon={<Package className="h-6 w-6" />} variant="warning" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">{t('quickActions')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => { setAddMethod('scan'); setAddOpen(true); }}>
              <QrCode className="h-5 w-5" /><span className="text-xs">{t('scanQR')}</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => { setAddMethod('manual'); setAddOpen(true); }}>
              <PenLine className="h-5 w-5" /><span className="text-xs">{t('manualEntry')}</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => setBookTestOpen(true)}>
              <TestTube className="h-5 w-5" /><span className="text-xs">{t('bookTest')}</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => { setAddMethod('manual'); setAddOpen(true); }}>
              <Plus className="h-5 w-5" /><span className="text-xs">{t('addMedicine')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <AddMedicineDialog open={addOpen} onOpenChange={setAddOpen} onAdded={fetchStats} defaultMethod={addMethod} />
      <BookTestDialog open={bookTestOpen} onOpenChange={setBookTestOpen} onBooked={fetchStats} />
    </div>
  );
}
