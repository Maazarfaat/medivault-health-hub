import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { getMedicineStatus } from '@/lib/medicineStatus';
import { AddInventoryDialog } from '@/components/pharmacy/AddInventoryDialog';
import { Tables } from '@/integrations/supabase/types';

type HospitalInv = Tables<'hospital_inventory'>;

export default function HospitalInventory() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [inventory, setInventory] = useState<HospitalInv[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('hospital_inventory').select('*').eq('hospital_id', user.id).order('created_at', { ascending: false });
    setInventory(data || []);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = inventory.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getStatusBadge = (expiryDate: string) => {
    const status = getMedicineStatus(expiryDate);
    switch (status) {
      case 'safe': return <Badge variant="safe">{t('safe')}</Badge>;
      case 'expiring': return <Badge variant="warning">{t('expiring')}</Badge>;
      case 'expired': return <Badge variant="expired">{t('expired')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('medicineInventory')}</h1>
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
          {filtered.length === 0 ? (
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
                {filtered.map((item) => (
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
      <AddInventoryDialog open={addOpen} onOpenChange={setAddOpen} onAdded={fetchData} table="hospital_inventory" idField="hospital_id" />
    </div>
  );
}
