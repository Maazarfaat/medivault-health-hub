import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusTracker } from '@/components/offer/StatusTracker';
import { BookTestDialog } from '@/components/booking/BookTestDialog';
import { Check, X, IndianRupee, TestTube, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Booking = Tables<'blood_test_bookings'>;

export default function UserBloodTests() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookTestOpen, setBookTestOpen] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('blood_test_bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setBookings(data || []);
  }, [user]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleOfferAction = async (id: string, action: 'confirmed' | 'rejected') => {
    await supabase.from('blood_test_bookings').update({ status: action } as any).eq('id', id);
    toast({ title: action === 'confirmed' ? t('offerAccepted') : t('offerRejected') });
    fetchBookings();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning">{t('pending')}</Badge>;
      case 'offer_sent': return <Badge className="bg-blue-500 text-white">{t('offerSent')}</Badge>;
      case 'confirmed': return <Badge variant="safe">{t('confirmed')}</Badge>;
      case 'processing': return <Badge variant="default">{t('processing')}</Badge>;
      case 'completed': return <Badge variant="safe">{t('completed')}</Badge>;
      case 'rejected': return <Badge variant="expired">{t('rejected')}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const offers = bookings.filter(b => b.status === 'offer_sent');
  const active = bookings.filter(b => ['pending', 'confirmed', 'processing'].includes(b.status));
  const completed = bookings.filter(b => ['completed', 'rejected'].includes(b.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('myBloodTestBookings')}</h1>
        <Button onClick={() => setBookTestOpen(true)}><Plus className="mr-2 h-4 w-4" />{t('bookTest')}</Button>
      </div>

      {offers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><IndianRupee className="h-5 w-5" />{t('offersReceived')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {offers.map(b => (
              <div key={b.id} className="rounded-lg border bg-background p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{b.test_type}</p>
                    <p className="text-sm text-muted-foreground">{t('from')}: {b.provider_name || t('diagnosticCentre')}</p>
                    <p className="text-sm text-muted-foreground">{new Date(b.appointment_date).toLocaleDateString()}</p>
                  </div>
                  <Badge className="bg-blue-500 text-white">{t('newOffer')}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-md bg-muted p-3 text-sm">
                  <div><p className="text-muted-foreground">{t('price')}</p><p className="font-medium">₹{b.offer_price}</p></div>
                  <div><p className="text-muted-foreground">{t('discount')}</p><p className="font-medium text-green-600">-₹{b.offer_discount || 0}</p></div>
                  <div><p className="text-muted-foreground">{t('finalPrice')}</p><p className="font-bold text-primary">₹{b.offer_final_price}</p></div>
                </div>
                {b.estimated_time && <p className="text-sm">⏱ {t('estimatedTime')}: {b.estimated_time}</p>}
                {b.provider_notes && <p className="text-sm text-muted-foreground">{b.provider_notes}</p>}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handleOfferAction(b.id, 'confirmed')}><Check className="mr-1 h-4 w-4" />{t('acceptOffer')}</Button>
                  <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleOfferAction(b.id, 'rejected')}><X className="mr-1 h-4 w-4" />{t('rejectOffer')}</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {active.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('activeBookings')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {active.map(b => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="font-medium">{b.test_type}</p>
                  <p className="text-sm text-muted-foreground">{new Date(b.appointment_date).toLocaleDateString()}{b.preferred_time && ` at ${b.preferred_time}`}</p>
                  {b.provider_name && <p className="text-xs text-muted-foreground">{t('provider')}: {b.provider_name}</p>}
                </div>
                <div className="text-right space-y-2">
                  {getStatusBadge(b.status)}
                  <StatusTracker currentStatus={b.status} type="booking" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {completed.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('completedBookings')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {completed.map(b => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border p-4">
                <div><p className="font-medium">{b.test_type}</p><p className="text-sm text-muted-foreground">{new Date(b.appointment_date).toLocaleDateString()}</p></div>
                {getStatusBadge(b.status)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {bookings.length === 0 && (
        <Card><CardContent className="flex flex-col items-center gap-4 py-12">
          <TestTube className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">{t('noBookingsYet')}</p>
          <Button onClick={() => setBookTestOpen(true)}><Plus className="mr-2 h-4 w-4" />{t('bookTest')}</Button>
        </CardContent></Card>
      )}

      <BookTestDialog open={bookTestOpen} onOpenChange={setBookTestOpen} onBooked={fetchBookings} />
    </div>
  );
}
