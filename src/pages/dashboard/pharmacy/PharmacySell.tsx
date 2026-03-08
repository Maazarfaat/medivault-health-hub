import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { SellMedicineDialog } from '@/components/pharmacy/SellMedicineDialog';
import { Tables } from '@/integrations/supabase/types';

type Inventory = Tables<'pharmacy_inventory'>;

export default function PharmacySell() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [sellOpen, setSellOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('pharmacy_inventory').select('*').eq('pharmacy_id', user.id).order('name');
    setInventory(data || []);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('sellMedicine')}</h1>
      <p className="text-muted-foreground">Sell medicine to a customer by selecting from your inventory.</p>
      <Button className="gap-2" onClick={() => setSellOpen(true)}>
        <ShoppingCart className="h-5 w-5" />{t('sellMedicine')}
      </Button>
      <SellMedicineDialog open={sellOpen} onOpenChange={setSellOpen} inventory={inventory} onSold={fetchData} />
    </div>
  );
}
