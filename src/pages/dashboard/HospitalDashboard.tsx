import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, AlertTriangle, Clock, Plus, QrCode, Search, Pill } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getMedicineStatus } from '@/lib/medicineStatus';
import { AddInventoryDialog } from '@/components/pharmacy/AddInventoryDialog';
import { Tables } from '@/integrations/supabase/types';

type HospitalInv = Tables<'hospital_inventory'>;

export default function HospitalDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, profile, role, signOut } = useAuth();
  const [inventory, setInventory] = useState<HospitalInv[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('hospital_inventory').select('*').eq('hospital_id', user.id).order('created_at', { ascending: false });
    setInventory(data || []);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const filteredInventory = inventory.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const stats = {
    totalItems: inventory.length,
    expiringSoon: inventory.filter(m => getMedicineStatus(m.expiry_date) === 'expiring').length,
    expired: inventory.filter(m => getMedicineStatus(m.expiry_date) === 'expired').length,
  };

  const dashboardUser = {
    id: user?.id || '', name: profile?.name || 'Hospital', email: profile?.email || '',
    mobileNumber: profile?.mobile_number || '', mobileVerified: profile?.mobile_verified || false,
    role: (role || 'hospital') as any, profileCompletion: profile?.profile_completion || 0,
  };

  const getStatusBadge = (expiryDate: string) => {
    const status = getMedicineStatus(expiryDate);
    switch (status) {
      case 'safe': return <Badge variant="safe">{t('safe')}</Badge>;
      case 'expiring': return <Badge variant="warning">{t('expiring')}</Badge>;
      case 'expired': return <Badge variant="expired">{t('expired')}</Badge>;
    }
  };

  return (
    <DashboardLayout user={dashboardUser} onLogout={handleLogout}>
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
          <Button className="h-auto flex-col gap-2 py-6" onClick={() => setAddOpen(true)}>
            <QrCode className="h-6 w-6" /><span>{t('addMedicineScan')}</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => setAddOpen(true)}>
            <Pill className="h-6 w-6" /><span>{t('manualEntry')}</span>
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('medicineInventory')}</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={t('searchMedicines')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-9" />
              </div>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />{t('addItem')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredInventory.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">{t('noInventoryYet')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('medicineName')}</TableHead>
                    <TableHead>{t('batchNumber')}</TableHead>
                    <TableHead>{t('expiryDate')}</TableHead>
                    <TableHead>{t('quantity')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.batch_number || '-'}</TableCell>
                      <TableCell>{new Date(item.expiry_date).toLocaleDateString()}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{getStatusBadge(item.expiry_date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AddInventoryDialog open={addOpen} onOpenChange={setAddOpen} onAdded={fetchData} table="hospital_inventory" idField="hospital_id" />
    </DashboardLayout>
  );
}
