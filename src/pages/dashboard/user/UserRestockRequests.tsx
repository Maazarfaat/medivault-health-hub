import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusTracker } from '@/components/offer/StatusTracker';
import { ReviewDialog } from '@/components/review/ReviewDialog';
import { Check, X, IndianRupee, RefreshCcw, PackageCheck, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type RestockReq = Tables<'restock_requests'>;

export default function UserRestockRequests() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [restocks, setRestocks] = useState<RestockReq[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ providerId: string; requestId: string } | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const fetchRestocks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('restock_requests').select('*').eq('user_id', user.id).order('request_date', { ascending: false });
    setRestocks(data || []);

    // Fetch existing reviews
    const { data: reviews } = await supabase.from('reviews' as any).select('request_id').eq('user_id', user.id);
    if (reviews) {
      setReviewedIds(new Set((reviews as any[]).map(r => r.request_id)));
    }
  }, [user]);

  useEffect(() => { fetchRestocks(); }, [fetchRestocks]);

  const handleOfferAction = async (id: string, action: 'confirmed' | 'rejected') => {
    await supabase.from('restock_requests').update({ status: action } as any).eq('id', id);
    toast({ title: action === 'confirmed' ? t('offerAccepted') : t('offerRejected') });
    fetchRestocks();
  };

  const handleConfirmDelivery = async (r: RestockReq) => {
    await supabase.from('restock_requests').update({ status: 'fulfilled' } as any).eq('id', r.id);
    toast({ title: 'Delivery Confirmed' });
    // Open review dialog
    if (r.pharmacy_id) {
      setReviewTarget({ providerId: r.pharmacy_id, requestId: r.id });
      setReviewOpen(true);
    }
    fetchRestocks();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning">{t('pending')}</Badge>;
      case 'offer_sent': return <Badge className="bg-blue-500 text-white">{t('offerSent')}</Badge>;
      case 'confirmed': return <Badge variant="safe">{t('confirmed')}</Badge>;
      case 'processing': return <Badge variant="default">{t('processing')}</Badge>;
      case 'delivered': return <Badge className="bg-emerald-500 text-white">Delivered</Badge>;
      case 'fulfilled': return <Badge variant="safe">{t('fulfilled')}</Badge>;
      case 'rejected': return <Badge variant="expired">{t('rejected')}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const offers = restocks.filter(r => r.status === 'offer_sent');
  const active = restocks.filter(r => ['pending', 'confirmed', 'processing', 'delivered'].includes(r.status));
  const completed = restocks.filter(r => ['fulfilled', 'rejected'].includes(r.status));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('myRestockRequests')}</h1>

      {offers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><IndianRupee className="h-5 w-5" />{t('offersReceived')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {offers.map(r => (
              <div key={r.id} className="rounded-lg border bg-background p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{r.medicine_name}</p>
                    <p className="text-sm text-muted-foreground">{t('from')}: {r.provider_name || t('pharmacy')}</p>
                    <p className="text-sm text-muted-foreground">{t('quantity')}: {r.requested_quantity}</p>
                  </div>
                  <Badge className="bg-blue-500 text-white">{t('newOffer')}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-md bg-muted p-3 text-sm">
                  <div><p className="text-muted-foreground">{t('price')}</p><p className="font-medium">₹{r.offer_price}</p></div>
                  <div><p className="text-muted-foreground">{t('discount')}</p><p className="font-medium text-green-600">-₹{r.offer_discount || 0}</p></div>
                  <div><p className="text-muted-foreground">{t('finalPrice')}</p><p className="font-bold text-primary">₹{r.offer_final_price}</p></div>
                </div>
                {r.estimated_time && <p className="text-sm">⏱ {t('estimatedTime')}: {r.estimated_time}</p>}
                {r.provider_notes && <p className="text-sm text-muted-foreground">{r.provider_notes}</p>}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handleOfferAction(r.id, 'confirmed')}><Check className="mr-1 h-4 w-4" />{t('acceptOffer')}</Button>
                  <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleOfferAction(r.id, 'rejected')}><X className="mr-1 h-4 w-4" />{t('rejectOffer')}</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {active.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('activeRequests')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {active.map(r => (
              <div key={r.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{r.medicine_name}</p>
                    <p className="text-sm text-muted-foreground">{t('quantity')}: {r.requested_quantity}</p>
                    {r.provider_name && <p className="text-xs text-muted-foreground">{t('provider')}: {r.provider_name}</p>}
                  </div>
                  <div className="text-right space-y-2">
                    {getStatusBadge(r.status)}
                    <StatusTracker currentStatus={r.status} type="restock" />
                  </div>
                </div>
                {(r.status as string) === 'delivered' && (
                  <Button size="sm" className="w-full" onClick={() => handleConfirmDelivery(r)}>
                    <PackageCheck className="mr-2 h-4 w-4" />Confirm Delivery
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {completed.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('completedRequests')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {completed.map(r => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{r.medicine_name}</p>
                  <p className="text-sm text-muted-foreground">{t('quantity')}: {r.requested_quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(r.status)}
                  {r.status === 'fulfilled' && r.pharmacy_id && !reviewedIds.has(r.id) && (
                    <Button size="sm" variant="outline" onClick={() => {
                      setReviewTarget({ providerId: r.pharmacy_id!, requestId: r.id });
                      setReviewOpen(true);
                    }}>
                      <Star className="mr-1 h-3 w-3" />Review
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {restocks.length === 0 && (
        <Card><CardContent className="flex flex-col items-center gap-4 py-12">
          <RefreshCcw className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">{t('noRestockRequests')}</p>
        </CardContent></Card>
      )}

      {reviewTarget && (
        <ReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          providerId={reviewTarget.providerId}
          providerType="pharmacy"
          requestId={reviewTarget.requestId}
          onReviewed={fetchRestocks}
        />
      )}
    </div>
  );
}
