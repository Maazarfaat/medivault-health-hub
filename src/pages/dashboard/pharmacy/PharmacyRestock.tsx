import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, ExternalLink, Send, Star, Truck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateDistance, formatDistance, getGoogleMapsLink } from '@/lib/geolocation';
import { SendOfferDialog } from '@/components/offer/SendOfferDialog';
import { StatusTracker } from '@/components/offer/StatusTracker';
import { DeliverMedicineDialog } from '@/components/pharmacy/DeliverMedicineDialog';
import { Tables } from '@/integrations/supabase/types';

type RestockReq = Tables<'restock_requests'>;

interface RestockWithProfile extends RestockReq {
  userName?: string;
  userMobile?: string;
  distanceKm?: number | null;
  userAddress?: string | null;
  userLat?: number | null;
  userLng?: number | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  userName?: string;
}

export default function PharmacyRestock() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [restockRequests, setRestockRequests] = useState<RestockWithProfile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [deliverDialogOpen, setDeliverDialogOpen] = useState(false);
  const [deliverRequest, setDeliverRequest] = useState<RestockWithProfile | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data: restock } = await supabase.from('restock_requests').select('*').order('request_date', { ascending: false });
    const requests = restock || [];
    if (requests.length > 0) {
      const userIds = [...new Set(requests.map(r => r.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, name, mobile_number').in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const pharmacyLat = profile?.latitude;
      const pharmacyLng = profile?.longitude;

      const enriched: RestockWithProfile[] = requests.map(r => {
        const userLat = r.user_latitude;
        const userLng = r.user_longitude;
        let dist: number | null = null;
        if (pharmacyLat && pharmacyLng && userLat && userLng) {
          dist = calculateDistance(pharmacyLat, pharmacyLng, userLat, userLng);
        }
        return {
          ...r,
          userName: profileMap.get(r.user_id)?.name || 'Unknown',
          userMobile: profileMap.get(r.user_id)?.mobile_number || 'N/A',
          distanceKm: dist,
          userAddress: (r as any).user_address || null,
          userLat, userLng,
        };
      });
      enriched.sort((a, b) => {
        if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm != null) return -1;
        return 1;
      });
      setRestockRequests(enriched);
    } else {
      setRestockRequests([]);
    }

    // Fetch reviews
    const { data: reviewData } = await supabase.from('reviews' as any).select('*').eq('provider_id', user.id);
    if (reviewData && (reviewData as any[]).length > 0) {
      const reviewUserIds = [...new Set((reviewData as any[]).map(r => r.user_id))];
      const { data: reviewProfiles } = await supabase.from('profiles').select('user_id, name').in('user_id', reviewUserIds);
      const rpMap = new Map(reviewProfiles?.map(p => [p.user_id, p]) || []);
      setReviews((reviewData as any[]).map(r => ({ ...r, userName: rpMap.get(r.user_id)?.name || 'User' })));
    }
  }, [user, profile]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSendOffer = async (offer: { price: number; discount: number; finalPrice: number; estimatedTime: string; notes: string }) => {
    if (!selectedRequestId || !user) return;
    await supabase.from('restock_requests').update({
      status: 'offer_sent' as any,
      pharmacy_id: user.id,
      offer_price: offer.price,
      offer_discount: offer.discount,
      offer_final_price: offer.finalPrice,
      estimated_time: offer.estimatedTime,
      provider_notes: offer.notes,
      provider_name: profile?.name || 'Pharmacy',
    } as any).eq('id', selectedRequestId);
    toast({ title: t('offerSent') });
    fetchData();
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    await supabase.from('restock_requests').update({ status } as any).eq('id', id);
    toast({ title: t('statusUpdated') });
    fetchData();
  };

  const handleDeliver = async (details: { batchNumber: string; manufacturingDate: string; expiryDate: string; quantity: number }) => {
    if (!deliverRequest || !user) return;
    const req = deliverRequest;

    // Delete old zero-quantity entries for this medicine
    const { data: oldEntries } = await supabase
      .from('user_medicines')
      .select('id, quantity')
      .eq('user_id', req.user_id)
      .eq('name', req.medicine_name);

    if (oldEntries) {
      const zeroQtyIds = oldEntries.filter(e => e.quantity === 0).map(e => e.id);
      for (const id of zeroQtyIds) {
        await supabase.from('user_medicines').delete().eq('id', id);
      }
    }

    // Check if there's an existing entry with same batch to merge
    const { data: existing } = await supabase
      .from('user_medicines')
      .select('id, quantity')
      .eq('user_id', req.user_id)
      .eq('name', req.medicine_name)
      .eq('batch_number', details.batchNumber)
      .maybeSingle();

    if (existing) {
      await supabase.from('user_medicines').update({ quantity: existing.quantity + details.quantity } as any).eq('id', existing.id);
    } else {
      await supabase.from('user_medicines').insert({
        user_id: req.user_id,
        name: req.medicine_name,
        batch_number: details.batchNumber,
        manufacturing_date: details.manufacturingDate,
        expiry_date: details.expiryDate,
        quantity: details.quantity,
        added_method: 'pharmacy' as any,
      } as any);
    }

    await supabase.from('restock_requests').update({ status: 'delivered' } as any).eq('id', req.id);
    await supabase.from('notifications').insert({
      user_id: req.user_id,
      title: 'Medicine Restocked',
      message: `Your restocked medicine "${req.medicine_name}" has been added to your inventory.`,
      type: 'restock',
    });
    toast({ title: 'Medicine delivered and added to user inventory' });
    setDeliverRequest(null);
    fetchData();
  };

  const activeRestocks = restockRequests.filter(r => r.status !== 'fulfilled' && r.status !== 'rejected');
  const deliveredRestocks = restockRequests.filter(r => r.status === 'fulfilled' || r.status === 'delivered');

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning">{t('pending')}</Badge>;
      case 'offer_sent': return <Badge className="bg-blue-500 text-white">{t('offerSent')}</Badge>;
      case 'confirmed': return <Badge variant="safe">{t('confirmed')}</Badge>;
      case 'processing': return <Badge variant="default">{t('processing')}</Badge>;
      case 'delivered': return <Badge className="bg-emerald-500 text-white">Delivered</Badge>;
      case 'rejected': return <Badge variant="expired">{t('rejected')}</Badge>;
      case 'fulfilled': return <Badge variant="safe">{t('fulfilled')}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('restockRequests')}</h1>

      {activeRestocks.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No active restock requests</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{t('restockRequests')}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('medicineName')}</TableHead>
                  <TableHead>{t('userName')}</TableHead>
                  <TableHead>{t('mobile')}</TableHead>
                  <TableHead>{t('quantity')}</TableHead>
                  <TableHead>{t('distance')}</TableHead>
                  <TableHead>{t('location')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('orderTracking')}</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeRestocks.map(req => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.medicine_name}</TableCell>
                    <TableCell>{req.userName}</TableCell>
                    <TableCell>{req.userMobile}</TableCell>
                    <TableCell>{req.requested_quantity}</TableCell>
                    <TableCell>
                      {req.distanceKm != null ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />{formatDistance(req.distanceKm)}
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {req.userLat && req.userLng ? (
                        <div className="space-y-1">
                          {req.userAddress && (
                            <p className="text-xs text-muted-foreground max-w-[200px] truncate" title={req.userAddress}>{req.userAddress}</p>
                          )}
                          <a href={getGoogleMapsLink(req.userLat, req.userLng)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" />{t('viewLocation')}
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t('noLocation')}</span>
                      )}
                    </TableCell>
                    <TableCell>{getRequestStatusBadge(req.status)}</TableCell>
                    <TableCell><StatusTracker currentStatus={req.status} type="restock" /></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {req.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => { setSelectedRequestId(req.id); setOfferDialogOpen(true); }}>
                              <Send className="mr-1 h-3 w-3" />{t('sendOffer')}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(req.id, 'rejected')}>
                              {t('reject')}
                            </Button>
                          </>
                        )}
                        {req.status === 'confirmed' && (
                          <Button size="sm" onClick={() => handleStatusUpdate(req.id, 'processing')}>
                            {t('processing')}
                          </Button>
                        )}
                        {req.status === 'processing' && (
                          <Button size="sm" onClick={() => { setDeliverRequest(req); setDeliverDialogOpen(true); }}>
                            <Truck className="mr-1 h-3 w-3" />Mark Delivered
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {deliveredRestocks.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Orders Delivered</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('medicineName')}</TableHead>
                  <TableHead>{t('userName')}</TableHead>
                  <TableHead>{t('quantity')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveredRestocks.map(req => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.medicine_name}</TableCell>
                    <TableCell>{req.userName}</TableCell>
                    <TableCell>{req.requested_quantity}</TableCell>
                    <TableCell>{getRequestStatusBadge(req.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />Reviews Received
              {avgRating && <Badge variant="safe">⭐ {avgRating}/5</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{r.userName}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <SendOfferDialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen} onSubmit={handleSendOffer} title={t('sendRestockOffer')} />
      {deliverRequest && (
        <DeliverMedicineDialog
          open={deliverDialogOpen}
          onOpenChange={setDeliverDialogOpen}
          medicineName={deliverRequest.medicine_name}
          quantity={deliverRequest.requested_quantity}
          onDeliver={handleDeliver}
        />
      )}
    </div>
  );
}
