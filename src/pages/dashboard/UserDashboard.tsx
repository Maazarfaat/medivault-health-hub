import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { MedicineCard } from '@/components/medicine/MedicineCard';
import { AddMedicineDialog } from '@/components/medicine/AddMedicineDialog';
import { BookTestDialog } from '@/components/booking/BookTestDialog';
import { StatusTracker } from '@/components/offer/StatusTracker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, AlertTriangle, Clock, Package, Plus, QrCode, PenLine, TestTube, Check, X, IndianRupee } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getMedicineStatus, isLowStock, needsRestock } from '@/lib/medicineStatus';
import { getUserLocation, reverseGeocode } from '@/lib/geolocation';
import { Tables } from '@/integrations/supabase/types';

type UserMedicine = Tables<'user_medicines'>;
type Booking = Tables<'blood_test_bookings'>;
type RestockReq = Tables<'restock_requests'>;

export default function UserDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, profile, role, signOut } = useAuth();
  const [medicines, setMedicines] = useState<UserMedicine[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [restocks, setRestocks] = useState<RestockReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addMethod, setAddMethod] = useState<'manual' | 'scan'>('manual');
  const [bookTestOpen, setBookTestOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [medsRes, bookRes, restockRes] = await Promise.all([
      supabase.from('user_medicines').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('blood_test_bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('restock_requests').select('*').eq('user_id', user.id).order('request_date', { ascending: false }),
    ]);
    setMedicines(medsRes.data || []);
    setBookings(bookRes.data || []);
    setRestocks(restockRes.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRestock = async (med: UserMedicine) => {
    if (!user) return;
    const location = await getUserLocation();
    const insertData: any = {
      user_id: user.id,
      medicine_name: med.name,
      requested_quantity: med.prescribed_doses || 30,
    };
    if (location) {
      insertData.user_latitude = location.latitude;
      insertData.user_longitude = location.longitude;
      insertData.user_address = await reverseGeocode(location.latitude, location.longitude);
    }
    await supabase.from('restock_requests').insert(insertData);
    toast({ title: t('restockSent'), description: `${t('requestFor')} ${med.name} ${t('restockDesc')}` });
    fetchAll();
  };

  const handleTakeDose = async (med: UserMedicine) => {
    if (!user) return;
    const newDoses = (med.doses_taken || 0) + 1;
    await supabase.from('user_medicines').update({ doses_taken: newDoses }).eq('id', med.id);
    toast({ title: t('doseTaken'), description: t('doseDesc') });
    fetchAll();
  };

  const handleOfferAction = async (id: string, type: 'booking' | 'restock', action: 'confirmed' | 'rejected') => {
    const table = type === 'booking' ? 'blood_test_bookings' : 'restock_requests';
    await supabase.from(table).update({ status: action } as any).eq('id', id);
    toast({ title: action === 'confirmed' ? t('offerAccepted') : t('offerRejected') });
    fetchAll();
  };

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const stats = {
    total: medicines.length,
    expiring: medicines.filter(m => getMedicineStatus(m.expiry_date) === 'expiring').length,
    expired: medicines.filter(m => getMedicineStatus(m.expiry_date) === 'expired').length,
    lowStock: medicines.filter(m => isLowStock(m.quantity)).length,
  };

  const dashboardUser = {
    id: user?.id || '', name: profile?.name || 'User', email: profile?.email || '',
    mobileNumber: profile?.mobile_number || '', mobileVerified: profile?.mobile_verified || false,
    role: (role || 'user') as any, profileCompletion: profile?.profile_completion || 0,
  };

  // Offers pending user action
  const bookingOffers = bookings.filter(b => b.status === 'offer_sent');
  const restockOffers = restocks.filter(r => r.status === 'offer_sent');
  const hasOffers = bookingOffers.length > 0 || restockOffers.length > 0;

  // Active orders (confirmed/processing)
  const activeBookings = bookings.filter(b => ['pending', 'offer_sent', 'confirmed', 'processing'].includes(b.status));
  const activeRestocks = restocks.filter(r => ['pending', 'offer_sent', 'confirmed', 'processing'].includes(r.status));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning">{t('pending')}</Badge>;
      case 'offer_sent': return <Badge className="bg-blue-500 text-white">{t('offerSent')}</Badge>;
      case 'confirmed': return <Badge variant="safe">{t('confirmed')}</Badge>;
      case 'processing': return <Badge variant="default">{t('processing')}</Badge>;
      case 'completed': return <Badge variant="safe">{t('completed')}</Badge>;
      case 'fulfilled': return <Badge variant="safe">{t('fulfilled')}</Badge>;
      case 'rejected': return <Badge variant="expired">{t('rejected')}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout user={dashboardUser} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('welcomeBack')}, {profile?.name?.split(' ')[0] || 'User'}!</h1>
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

        {/* Offers Received */}
        {hasOffers && (
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                {t('offersReceived')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookingOffers.map(b => (
                <div key={b.id} className="rounded-lg border bg-background p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{b.test_type}</p>
                      <p className="text-sm text-muted-foreground">{t('from')}: {(b as any).provider_name || t('diagnosticCentre')}</p>
                      <p className="text-sm text-muted-foreground">{new Date(b.appointment_date).toLocaleDateString()}</p>
                    </div>
                    <Badge className="bg-blue-500 text-white">{t('newOffer')}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-md bg-muted p-3 text-sm">
                    <div><p className="text-muted-foreground">{t('price')}</p><p className="font-medium">₹{(b as any).offer_price}</p></div>
                    <div><p className="text-muted-foreground">{t('discount')}</p><p className="font-medium text-green-600">-₹{(b as any).offer_discount || 0}</p></div>
                    <div><p className="text-muted-foreground">{t('finalPrice')}</p><p className="font-bold text-primary">₹{(b as any).offer_final_price}</p></div>
                  </div>
                  {(b as any).estimated_time && <p className="text-sm">⏱ {t('estimatedTime')}: {(b as any).estimated_time}</p>}
                  {(b as any).provider_notes && <p className="text-sm text-muted-foreground">{(b as any).provider_notes}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => handleOfferAction(b.id, 'booking', 'confirmed')}>
                      <Check className="mr-1 h-4 w-4" />{t('acceptOffer')}
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleOfferAction(b.id, 'booking', 'rejected')}>
                      <X className="mr-1 h-4 w-4" />{t('rejectOffer')}
                    </Button>
                  </div>
                </div>
              ))}
              {restockOffers.map(r => (
                <div key={r.id} className="rounded-lg border bg-background p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{r.medicine_name}</p>
                      <p className="text-sm text-muted-foreground">{t('from')}: {(r as any).provider_name || t('pharmacy')}</p>
                      <p className="text-sm text-muted-foreground">{t('quantity')}: {r.requested_quantity}</p>
                    </div>
                    <Badge className="bg-blue-500 text-white">{t('newOffer')}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-md bg-muted p-3 text-sm">
                    <div><p className="text-muted-foreground">{t('price')}</p><p className="font-medium">₹{(r as any).offer_price}</p></div>
                    <div><p className="text-muted-foreground">{t('discount')}</p><p className="font-medium text-green-600">-₹{(r as any).offer_discount || 0}</p></div>
                    <div><p className="text-muted-foreground">{t('finalPrice')}</p><p className="font-bold text-primary">₹{(r as any).offer_final_price}</p></div>
                  </div>
                  {(r as any).estimated_time && <p className="text-sm">⏱ {t('estimatedTime')}: {(r as any).estimated_time}</p>}
                  {(r as any).provider_notes && <p className="text-sm text-muted-foreground">{(r as any).provider_notes}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => handleOfferAction(r.id, 'restock', 'confirmed')}>
                      <Check className="mr-1 h-4 w-4" />{t('acceptOffer')}
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleOfferAction(r.id, 'restock', 'rejected')}>
                      <X className="mr-1 h-4 w-4" />{t('rejectOffer')}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Active Blood Test Bookings */}
        {activeBookings.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t('myBloodTestBookings')}</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setBookTestOpen(true)}>
                  <TestTube className="mr-2 h-4 w-4" />{t('bookTest')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="font-medium">{booking.test_type}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.appointment_date).toLocaleDateString()}
                      {booking.preferred_time && ` at ${booking.preferred_time}`}
                    </p>
                    {(booking as any).provider_name && (
                      <p className="text-xs text-muted-foreground">{t('provider')}: {(booking as any).provider_name}</p>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    {getStatusBadge(booking.status)}
                    <StatusTracker currentStatus={booking.status} type="booking" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Active Restock Requests */}
        {activeRestocks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('myRestockRequests')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeRestocks.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="font-medium">{r.medicine_name}</p>
                    <p className="text-sm text-muted-foreground">{t('quantity')}: {r.requested_quantity}</p>
                    {(r as any).provider_name && (
                      <p className="text-xs text-muted-foreground">{t('provider')}: {(r as any).provider_name}</p>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    {getStatusBadge(r.status)}
                    <StatusTracker currentStatus={r.status} type="restock" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Medicines */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('myMedicines')}</h2>
          </div>
          {loading ? (
            <p className="text-muted-foreground">{t('loading')}</p>
          ) : medicines.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <Pill className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">{t('noMedicinesYet')}</p>
                <Button onClick={() => setAddOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />{t('addMedicine')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {medicines.map((med) => {
                const status = getMedicineStatus(med.expiry_date);
                const medForCard = {
                  ...med,
                  userId: med.user_id,
                  batchNumber: med.batch_number || '',
                  expiryDate: med.expiry_date,
                  addedMethod: med.added_method as any,
                  status,
                  prescribedDoses: med.prescribed_doses ?? undefined,
                  dosesTaken: med.doses_taken ?? undefined,
                };
                return (
                  <MedicineCard
                    key={med.id}
                    medicine={medForCard}
                    onRestock={needsRestock(med.quantity) || isLowStock(med.quantity) ? () => handleRestock(med) : undefined}
                    onTakeDose={med.prescribed_doses ? () => handleTakeDose(med) : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddMedicineDialog open={addOpen} onOpenChange={setAddOpen} onAdded={fetchAll} defaultMethod={addMethod} />
      <BookTestDialog open={bookTestOpen} onOpenChange={setBookTestOpen} onBooked={fetchAll} />
    </DashboardLayout>
  );
}
