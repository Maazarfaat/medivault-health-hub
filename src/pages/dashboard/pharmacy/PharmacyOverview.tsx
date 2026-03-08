import { useState, useEffect, useCallback } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Package, AlertTriangle, Clock, DollarSign, ShoppingCart, QrCode, FileSpreadsheet, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { getMedicineStatus } from '@/lib/medicineStatus';
import { SaveLocationButton } from '@/components/location/SaveLocationButton';
import { useNavigate } from 'react-router-dom';

export default function PharmacyOverview() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalItems: 0, expiringSoon: 0, expired: 0, totalValue: 0, activeRestocks: 0 });

  const fetchStats = useCallback(async () => {
    if (!user) return;
    const [inv, restock] = await Promise.all([
      supabase.from('pharmacy_inventory').select('*').eq('pharmacy_id', user.id),
      supabase.from('restock_requests').select('id, status').not('status', 'in', '("fulfilled","rejected")'),
    ]);
    const inventory = inv.data || [];
    setStats({
      totalItems: inventory.length,
      expiringSoon: inventory.filter(m => getMedicineStatus(m.expiry_date) === 'expiring').length,
      expired: inventory.filter(m => getMedicineStatus(m.expiry_date) === 'expired').length,
      totalValue: inventory.reduce((sum, m) => sum + m.quantity * 10, 0),
      activeRestocks: (restock.data || []).length,
    });
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('pharmacyDashboard')}</h1>
          <p className="text-muted-foreground">{t('manageInventory')}</p>
        </div>
        <SaveLocationButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title={t('totalItems')} value={stats.totalItems} icon={<Package className="h-6 w-6" />} variant="primary" />
        <StatsCard title={t('expiringSoon')} value={stats.expiringSoon} icon={<Clock className="h-6 w-6" />} variant="warning" />
        <StatsCard title={t('expired')} value={stats.expired} icon={<AlertTriangle className="h-6 w-6" />} variant="expired" />
        <StatsCard title={t('inventoryValue')} value={`₹${stats.totalValue.toLocaleString()}`} icon={<DollarSign className="h-6 w-6" />} variant="safe" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Button className="h-auto flex-col gap-2 py-6" onClick={() => navigate('/pharmacy/sell')}>
          <ShoppingCart className="h-6 w-6" /><span>{t('sellMedicine')}</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => navigate('/pharmacy/inventory')}>
          <QrCode className="h-6 w-6" /><span>{t('addInventory')}</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => navigate('/pharmacy/csv')}>
          <FileSpreadsheet className="h-6 w-6" /><span>{t('csvUpload')}</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => navigate('/pharmacy/restock')}>
          <RefreshCcw className="h-6 w-6" /><span>{t('restockRequests')} ({stats.activeRestocks})</span>
        </Button>
      </div>
    </div>
  );
}
