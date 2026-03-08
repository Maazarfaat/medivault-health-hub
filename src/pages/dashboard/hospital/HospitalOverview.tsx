import { useState, useEffect, useCallback } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Package, AlertTriangle, Clock, QrCode, Pill } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { getMedicineStatus } from '@/lib/medicineStatus';
import { useNavigate } from 'react-router-dom';

export default function HospitalOverview() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalItems: 0, expiringSoon: 0, expired: 0 });

  const fetchStats = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('hospital_inventory').select('*').eq('hospital_id', user.id);
    const inventory = data || [];
    setStats({
      totalItems: inventory.length,
      expiringSoon: inventory.filter(m => getMedicineStatus(m.expiry_date) === 'expiring').length,
      expired: inventory.filter(m => getMedicineStatus(m.expiry_date) === 'expired').length,
    });
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('hospitalDashboard')}</h1>
        <p className="text-muted-foreground">{t('manageInventoryAdherence')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title={t('totalItems')} value={stats.totalItems} icon={<Package className="h-6 w-6" />} variant="primary" />
        <StatsCard title={t('expiringSoon')} value={stats.expiringSoon} icon={<Clock className="h-6 w-6" />} variant="warning" />
        <StatsCard title={t('expired')} value={stats.expired} icon={<AlertTriangle className="h-6 w-6" />} variant="expired" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Button className="h-auto flex-col gap-2 py-6" onClick={() => navigate('/hospital/inventory')}>
          <QrCode className="h-6 w-6" /><span>{t('addMedicineScan')}</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => navigate('/hospital/adherence')}>
          <Pill className="h-6 w-6" /><span>{t('patientAdherence')}</span>
        </Button>
      </div>
    </div>
  );
}
