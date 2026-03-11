import { useState, useEffect, useCallback } from 'react';
import { MedicineCard } from '@/components/medicine/MedicineCard';
import { AddMedicineDialog } from '@/components/medicine/AddMedicineDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pill, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getMedicineStatus, isLowStock, needsRestock } from '@/lib/medicineStatus';
import { getUserLocation, reverseGeocode } from '@/lib/geolocation';
import { Tables } from '@/integrations/supabase/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
    const newQuantity = Math.max((med.quantity || 0) - 1, 0);
    const newDosesTaken = (med.doses_taken || 0) + 1;
    await supabase.from('user_medicines').update({ 
      doses_taken: newDosesTaken,
      quantity: newQuantity,
    }).eq('id', med.id);
    toast({ title: t('doseTaken'), description: t('doseDesc') });
    fetchMedicines();
  };

  const handleRemove = async (med: UserMedicine) => {
    await supabase.from('user_medicines').delete().eq('id', med.id);
    toast({ title: t('medicineRemoved') || 'Medicine Removed' });
    fetchMedicines();
  };

  const handleRemoveExpired = async () => {
    if (!user) return;
    const expiredIds = medicines.filter(m => getMedicineStatus(m.expiry_date) === 'expired').map(m => m.id);
    if (expiredIds.length === 0) {
      toast({ title: 'No expired medicines to remove' });
      return;
    }
    for (const id of expiredIds) {
      await supabase.from('user_medicines').delete().eq('id', id);
    }
    toast({ title: `${expiredIds.length} expired medicine(s) removed` });
    fetchMedicines();
  };

  const expiredCount = medicines.filter(m => getMedicineStatus(m.expiry_date) === 'expired').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{t('myMedicines')}</h1>
        <div className="flex gap-2">
          {expiredCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />Remove Expired ({expiredCount})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove all expired medicines?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove {expiredCount} expired medicine(s) from your list.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemoveExpired} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Remove All Expired
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />{t('addMedicine')}</Button>
        </div>
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
                onRemove={() => handleRemove(med)}
              />
            );
          })}
        </div>
      )}

      <AddMedicineDialog open={addOpen} onOpenChange={setAddOpen} onAdded={fetchMedicines} />
    </div>
  );
}
