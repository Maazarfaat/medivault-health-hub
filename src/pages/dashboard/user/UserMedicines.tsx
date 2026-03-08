import { useState, useEffect, useCallback } from 'react';
import { MedicineCard } from '@/components/medicine/MedicineCard';
import { AddMedicineDialog } from '@/components/medicine/AddMedicineDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pill, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getMedicineStatus, isLowStock, needsRestock } from '@/lib/medicineStatus';
import { getUserLocation, reverseGeocode } from '@/lib/geolocation';
import { Tables } from '@/integrations/supabase/types';

type UserMedicine = Tables<'user_medicines'>;

export default function UserMedicines() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [medicines, setMedicines] = useState<UserMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const fetchMedicines = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('user_medicines').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setMedicines(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);

  const handleRestock = async (med: UserMedicine) => {
    if (!user) return;
    const location = await getUserLocation();
    const insertData: any = { user_id: user.id, medicine_name: med.name, requested_quantity: med.prescribed_doses || 30 };
    if (location) {
      insertData.user_latitude = location.latitude;
      insertData.user_longitude = location.longitude;
      insertData.user_address = await reverseGeocode(location.latitude, location.longitude);
    }
    await supabase.from('restock_requests').insert(insertData);
    toast({ title: t('restockSent'), description: `${t('requestFor')} ${med.name} ${t('restockDesc')}` });
  };

  const handleTakeDose = async (med: UserMedicine) => {
    if (!user) return;
    await supabase.from('user_medicines').update({ doses_taken: (med.doses_taken || 0) + 1 }).eq('id', med.id);
    toast({ title: t('doseTaken'), description: t('doseDesc') });
    fetchMedicines();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('myMedicines')}</h1>
        <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />{t('addMedicine')}</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t('loading')}</p>
      ) : medicines.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Pill className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{t('noMedicinesYet')}</p>
            <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />{t('addMedicine')}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {medicines.map(med => {
            const status = getMedicineStatus(med.expiry_date);
            const medForCard = {
              ...med, userId: med.user_id, batchNumber: med.batch_number || '', expiryDate: med.expiry_date,
              addedMethod: med.added_method as any, status,
              prescribedDoses: med.prescribed_doses ?? undefined, dosesTaken: med.doses_taken ?? undefined,
            };
            return (
              <MedicineCard key={med.id} medicine={medForCard}
                onRestock={needsRestock(med.quantity) || isLowStock(med.quantity) ? () => handleRestock(med) : undefined}
                onTakeDose={med.prescribed_doses ? () => handleTakeDose(med) : undefined}
              />
            );
          })}
        </div>
      )}

      <AddMedicineDialog open={addOpen} onOpenChange={setAddOpen} onAdded={fetchMedicines} />
    </div>
  );
}
